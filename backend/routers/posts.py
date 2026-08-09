import json
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status

from auth import get_current_user, get_optional_current_user
from database import Database, get_db
from email_notifications import email_delivery_enabled, send_announcement_emails
from schemas import PostCreate, PostResponse, PostUpdate

router = APIRouter(prefix="/posts", tags=["Posts"])


def _post(db, pid):
    return db.one("SELECT * FROM posts WHERE id=?", (pid,))


def _sync_tags(db, pid, tags):
    db.execute("DELETE FROM post_tags WHERE post_id=?", (pid,))
    for tag in tags:
        if tag.strip():
            db.execute("INSERT INTO post_tags (post_id,value) VALUES (?,?)", (pid, tag.strip()))


def _sync_media(db, pid, media):
    db.execute("DELETE FROM post_media WHERE post_id=?", (pid,))
    for i, item in enumerate(media):
        db.execute(
            "INSERT INTO post_media (post_id,media_type,file_url,display_order) VALUES (?,?,?,?)",
            (
                pid,
                item.media_type,
                item.file_url,
                item.display_order if item.display_order is not None else i,
            ),
        )


def _get_event_id_for_post(db, pid):
    row = db.one("SELECT value FROM post_tags WHERE post_id=? AND value LIKE 'event_ref:%'", (pid,))
    if row:
        try:
            return int(row.value.split(":")[1])
        except (ValueError, IndexError):
            pass
    return None


def format_post_response(p, current_user_id=None, db: Database | None = None):
    if db is None:
        raise ValueError("A database connection is required to format a post response.")
    author_name, association, pic = ("Anonymous", "STUDENT", None)
    if p.club_id:
        club = db.one("SELECT title,details FROM club WHERE id=?", (p.club_id,))
        author_name = club.title if club else "Club"
        association = "CLUB"
        try:
            pic = json.loads(club.details or "{}").get("profile_picture_url") if club else None
        except json.JSONDecodeError:
            pass
    elif p.user_id:
        user = db.one("SELECT name,profile_pic FROM user WHERE student_id=?", (p.user_id,))
        author_name = user.name if user else "Anonymous"
        pic = user.profile_pic if user else None
    reactions = db.all(
        "SELECT reaction_type,COUNT(*) AS count FROM post_reactions WHERE post_id=? GROUP BY reaction_type",
        (p.id,),
    )
    mine = (
        db.one(
            "SELECT reaction_type FROM post_reactions WHERE post_id=? AND user_id=?",
            (p.id, current_user_id),
        )
        if current_user_id
        else None
    )
    return {
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "post_type": p.post_type,
        "status": p.status,
        "user_id": p.user_id,
        "club_id": p.club_id,
        "event_id": _get_event_id_for_post(db, p.id),
        "tags": [
            x.value
            for x in db.all("SELECT value FROM post_tags WHERE post_id=?", (p.id,))
            if not x.value.startswith("event_ref:")
        ],
        "media": [
            {
                "id": x.id,
                "media_type": x.media_type,
                "file_url": x.file_url,
                "display_order": x.display_order,
            }
            for x in db.all(
                "SELECT * FROM post_media WHERE post_id=? ORDER BY display_order", (p.id,)
            )
        ],
        "created_at": p.created_at,
        "updated_at": None,
        "author_name": author_name,
        "author_association": association,
        "author_pic": pic,
        "reaction_counts": {x.reaction_type: x.count for x in reactions},
        "user_reaction": mine.reaction_type if mine else None,
        "comment_count": (
            comment_count.count
            if (comment_count := db.one("SELECT COUNT(*) AS count FROM comments WHERE post_id=?", (p.id,)))
            else 0
        ),
    }


@router.get("", response_model=List[PostResponse])
def list_posts(
    post_type: Optional[str] = Query(None),
    club_id: Optional[int] = Query(None),
    event_id: Optional[int] = Query(None),
    user_id: Optional[str] = Query(None),
    status: Optional[str] = Query("published"),
    tag: Optional[str] = Query(None),
    db=Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    sql = "SELECT DISTINCT p.* FROM posts p"
    params = []
    if tag:
        sql += " JOIN post_tags t ON t.post_id=p.id"
    if event_id:
        sql += " JOIN post_tags et ON et.post_id=p.id AND et.value=?"
        params.append(f"event_ref:{event_id}")
    conditions = []
    for column, value in [
        ("p.post_type", post_type),
        ("p.club_id", club_id),
        ("p.user_id", user_id),
        ("p.status", status),
        ("t.value", tag),
    ]:
        if value is not None:
            conditions.append(f"{column}=?")
            params.append(value)
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)
    sql += " ORDER BY p.created_at DESC"
    return [
        format_post_response(p, current_user.student_id if current_user else None, db)
        for p in db.all(sql, tuple(params))
    ]


@router.get("/{post_id}", response_model=PostResponse)
def get_post_by_id(
    post_id: int, db=Depends(get_db), current_user=Depends(get_optional_current_user)
):
    p = _post(db, post_id)
    if not p:
        raise HTTPException(404, "Post not found")
    return format_post_response(p, current_user.student_id if current_user else None, db)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: PostCreate,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    club = db.one("SELECT * FROM club WHERE id=?", (post_in.club_id,)) if post_in.club_id else None
    event = (
        db.one("SELECT * FROM events WHERE id=?", (post_in.event_id,)) if post_in.event_id else None
    )
    if post_in.club_id and (not club):
        raise HTTPException(400, "Associated club_id does not exist")
    if post_in.event_id and (not event):
        raise HTTPException(400, "Associated event_id does not exist")
    if post_in.post_type == "announcement" and club:
        from routers.clubs import check_is_club_admin

        if not check_is_club_admin(club, current_user.student_id, db):
            raise HTTPException(403, "Only club admins can publish announcements")
    if post_in.post_type == "announcement_event" and event:
        from routers.events import check_is_event_admin

        if not check_is_event_admin(event, current_user.student_id, db):
            raise HTTPException(403, "Only event admins can publish announcements")
    c = db.execute(
        "INSERT INTO posts (title,description,post_type,status,user_id,club_id) VALUES (?,?,?,?,?,?)",
        (
            post_in.title,
            post_in.description,
            post_in.post_type,
            post_in.status,
            None if post_in.club_id else current_user.student_id,
            post_in.club_id,
        ),
    )
    pid = c.lastrowid
    tags_to_sync = list(post_in.tags or [])
    if post_in.event_id:
        tags_to_sync.append(f"event_ref:{post_in.event_id}")
    _sync_tags(db, pid, tags_to_sync)
    _sync_media(db, pid, post_in.media or [])
    db.commit()
    p = _post(db, pid)
    recipients = []
    org = "CampusForge"
    kind = ""
    if post_in.post_type == "announcement" and club:
        org, kind = (club.title, "club")
        recipients = [
            r.email
            for r in db.all(
                "SELECT u.email FROM user u JOIN club_members m ON m.user_id=u.student_id WHERE m.club_id=? AND m.status='approved'",
                (club.id,),
            )
        ]
    if post_in.post_type == "announcement_event" and event:
        org, kind = (event.title, "event")
        recipients = [
            r.email
            for r in db.all(
                "SELECT u.email FROM user u JOIN event_registrants r ON r.user_id=u.student_id WHERE r.event_id=? AND r.status='approved'",
                (event.id,),
            )
        ]
    queued = bool(recipients and email_delivery_enabled())
    if queued:
        background_tasks.add_task(
            send_announcement_emails,
            list(dict.fromkeys(recipients)),
            organization_name=org,
            announcement_title=p.title,
            announcement_body=p.description,
            announcement_kind=kind,
        )
    result = format_post_response(p, current_user.student_id, db)
    result["email_notifications_queued"] = queued
    result["notification_recipient_count"] = len(set(recipients))
    return result


@router.patch("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int, updates: PostUpdate, db=Depends(get_db), current_user=Depends(get_current_user)
):
    p = _post(db, post_id)
    if not p:
        raise HTTPException(404, "Post not found")
    _require_post_manager(p, current_user.student_id, db, "edit")
    vals = {
        k: getattr(updates, k)
        for k in ["title", "description", "post_type", "status"]
        if getattr(updates, k) is not None
    }
    if vals:
        db.execute(
            "UPDATE posts SET " + ", ".join((f"{k}=?" for k in vals)) + " WHERE id=?",
            tuple(vals.values()) + (post_id,),
        )
    if updates.tags is not None:
        event_id = _get_event_id_for_post(db, post_id)
        tags_to_sync = list(updates.tags)
        if event_id:
            tags_to_sync.append(f"event_ref:{event_id}")
        _sync_tags(db, post_id, tags_to_sync)
    if updates.media is not None:
        _sync_media(db, post_id, updates.media)
    db.commit()
    return format_post_response(_post(db, post_id), current_user.student_id, db)


@router.patch("/{post_id}/publish", response_model=PostResponse)
def publish_post(post_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    p = _post(db, post_id)
    if not p:
        raise HTTPException(404, "Post not found")
    _require_post_manager(p, current_user.student_id, db, "publish")
    db.execute("UPDATE posts SET status='published' WHERE id=?", (post_id,))
    db.commit()
    return format_post_response(_post(db, post_id), current_user.student_id, db)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    p = _post(db, post_id)
    if not p:
        raise HTTPException(404, "Post not found")
    _require_post_manager(p, current_user.student_id, db, "delete")
    db.execute("DELETE FROM posts WHERE id=?", (post_id,))
    db.commit()


def _require_post_manager(post, student_id, db, action: str) -> None:
    if post.user_id:
        if post.user_id != student_id:
            raise HTTPException(403, f"Cannot {action} another user's post")
        return
    if post.club_id:
        from routers.clubs import check_is_club_admin

        club = db.one("SELECT * FROM club WHERE id=?", (post.club_id,))
        if club and check_is_club_admin(club, student_id, db):
            return
        raise HTTPException(403, f"Club admin permissions required to {action} this post")
    event_id = _get_event_id_for_post(db, post.id)
    if event_id:
        from routers.events import check_is_event_admin

        event = db.one("SELECT * FROM events WHERE id=?", (event_id,))
        if event and check_is_event_admin(event, student_id, db):
            return
        raise HTTPException(403, f"Event admin permissions required to {action} this post")
    raise HTTPException(403, f"Cannot {action} this post")
