import json
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import PostModel, PostTagModel, PostMediaModel, PostReactionModel, UserModel, ClubModel, ClubMemberModel, EventModel, EventRegistrantModel
from schemas import PostCreate, PostResponse, PostUpdate, PostMediaSchema
from auth import get_current_user, get_optional_current_user
from email_notifications import email_delivery_enabled, send_announcement_emails

router = APIRouter(prefix="/posts", tags=["Posts"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sync_tags(db: Session, post: PostModel, tags: List[str]):
    """Replace all tags for a post."""
    db.query(PostTagModel).filter(PostTagModel.post_id == post.id).delete()
    for value in tags:
        db.add(PostTagModel(post_id=post.id, value=value.strip()))


def _sync_media(db: Session, post: PostModel, media: List[PostMediaSchema]):
    """Replace all media for a post."""
    db.query(PostMediaModel).filter(PostMediaModel.post_id == post.id).delete()
    for idx, item in enumerate(media):
        db.add(PostMediaModel(
            post_id=post.id,
            media_type=item.media_type,
            file_url=item.file_url,
            display_order=item.display_order if item.display_order is not None else idx,
        ))


def _get_reaction_counts(post: PostModel) -> dict:
    counts: dict = {}
    for r in post.reactions:
        counts[r.reaction_type] = counts.get(r.reaction_type, 0) + 1
    return counts


def format_post_response(
    post: PostModel,
    current_user_id: Optional[str] = None,  # String student_id
) -> PostResponse:
    author_name = "Anonymous"
    author_association = "STUDENT"
    author_pic = None

    if post.author_club:
        author_name = post.author_club.title
        author_association = "CLUB"
        try:
            author_pic = json.loads(post.author_club.details or "{}").get("profile_picture_url")
        except (TypeError, json.JSONDecodeError):
            pass
    elif post.author_user:
        author_name = post.author_user.name
        author_association = "STUDENT"
        author_pic = post.author_user.profile_pic

    tags = [t.value for t in post.tags]
    media = [
        PostMediaSchema(
            id=m.id,
            media_type=m.media_type,
            file_url=m.file_url,
            display_order=m.display_order
        )
        for m in post.media
    ]
    reaction_counts = _get_reaction_counts(post)
    user_reaction = None
    if current_user_id:
        for r in post.reactions:
            if r.user_id == current_user_id:
                user_reaction = r.reaction_type
                break

    return PostResponse(
        id=post.id,
        title=post.title,
        description=post.description,
        post_type=post.post_type,
        status=post.status,
        user_id=post.user_id,
        club_id=post.club_id,
        event_id=post.event_id,
        tags=tags,
        media=media,
        created_at=post.created_at,
        updated_at=getattr(post, "updated_at", None),  # Safe attribute check
        author_name=author_name,
        author_association=author_association,
        author_pic=author_pic,
        reaction_counts=reaction_counts,
        user_reaction=user_reaction,
        comment_count=len(post.comments),
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=List[PostResponse])
def list_posts(
    post_type: Optional[str] = Query(None, description="Filter by post_type"),
    club_id: Optional[int] = Query(None, description="Filter by club_id"),
    event_id: Optional[int] = Query(None, description="Filter by event_id"),
    user_id: Optional[str] = Query(None, description="Filter by user student_id"), # Fixed int -> str
    status: Optional[str] = Query("published", description="Filter by status"),
    tag: Optional[str] = Query(None, description="Filter by tag value"),
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
):
    query = db.query(PostModel)
    if post_type:
        query = query.filter(PostModel.post_type == post_type)
    if club_id:
        query = query.filter(PostModel.club_id == club_id)
    if event_id:
        query = query.filter(PostModel.event_id == event_id)
    if user_id:
        query = query.filter(PostModel.user_id == user_id)
    if status:
        query = query.filter(PostModel.status == status)
    if tag:
        query = query.join(PostTagModel).filter(PostTagModel.value == tag)
    posts = query.order_by(PostModel.created_at.desc()).all()
    uid = current_user.student_id if current_user else None
    return [format_post_response(p, current_user_id=uid) for p in posts]


@router.get("/{post_id}", response_model=PostResponse)
def get_post_by_id(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    uid = current_user.student_id if current_user else None
    return format_post_response(post, current_user_id=uid)


# FastAPI Route inside routes.py

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: PostCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    # Validate club_id if supplied
    club = None
    event = None
    if post_in.club_id is not None:
        club = db.query(ClubModel).filter(ClubModel.id == post_in.club_id).first()
        if not club:
            raise HTTPException(status_code=400, detail="Associated club_id does not exist")
    if post_in.event_id is not None:
        event = db.query(EventModel).filter(EventModel.id == post_in.event_id).first()
        if not event:
            raise HTTPException(status_code=400, detail="Associated event_id does not exist")

    is_club_announcement = post_in.post_type == "announcement" and club is not None
    is_event_announcement = post_in.post_type == "announcement_event" and event is not None
    if is_club_announcement:
        from routers.clubs import check_is_club_admin
        if not check_is_club_admin(club, current_user.student_id, db):
            raise HTTPException(status_code=403, detail="Only club admins can publish announcements")
    if is_event_announcement:
        from routers.events import check_is_event_admin
        if not check_is_event_admin(event, current_user.student_id, db):
            raise HTTPException(status_code=403, detail="Only event admins can publish announcements")

    new_post = PostModel(
        title=post_in.title,
        description=post_in.description,
        post_type=post_in.post_type,
        status=post_in.status,
        user_id=current_user.student_id if not post_in.club_id else None,
        club_id=post_in.club_id,
        event_id=post_in.event_id,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    if post_in.tags:
        _sync_tags(db, new_post, post_in.tags)
    if post_in.media:
        _sync_media(db, new_post, post_in.media)

    db.commit()
    db.refresh(new_post)

    recipients = []
    organization_name = "CampusForge"
    announcement_kind = ""
    if is_club_announcement:
        organization_name = club.title
        announcement_kind = "club"
        recipients = [row.email for row in db.query(UserModel.email).join(
            ClubMemberModel, ClubMemberModel.user_id == UserModel.student_id
        ).filter(ClubMemberModel.club_id == club.id, ClubMemberModel.status == "approved").all()]
    elif is_event_announcement:
        organization_name = event.title
        announcement_kind = "event"
        recipients = [row.email for row in db.query(UserModel.email).join(
            EventRegistrantModel, EventRegistrantModel.user_id == UserModel.student_id
        ).filter(EventRegistrantModel.event_id == event.id, EventRegistrantModel.status == "approved").all()]

    recipients = list(dict.fromkeys(recipients))
    notifications_queued = bool(recipients and announcement_kind and email_delivery_enabled())
    if notifications_queued:
        background_tasks.add_task(
            send_announcement_emails,
            recipients,
            organization_name=organization_name,
            announcement_title=new_post.title,
            announcement_body=new_post.description,
            announcement_kind=announcement_kind,
        )

    response = format_post_response(new_post, current_user_id=current_user.student_id)
    response.email_notifications_queued = notifications_queued
    response.notification_recipient_count = len(recipients)
    return response

@router.patch("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    updates: PostUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id and post.user_id != current_user.student_id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's post")

    if updates.title is not None:
        post.title = updates.title
    if updates.description is not None:
        post.description = updates.description
    if updates.post_type is not None:
        post.post_type = updates.post_type
    if updates.status is not None:
        post.status = updates.status
    if updates.event_id is not None:
        post.event_id = updates.event_id
    if updates.tags is not None:
        _sync_tags(db, post, updates.tags)
    if updates.media is not None:
        _sync_media(db, post, updates.media)

    db.commit()
    db.refresh(post)
    return format_post_response(post, current_user_id=current_user.student_id)


@router.patch("/{post_id}/publish", response_model=PostResponse)
def publish_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id and post.user_id != current_user.student_id:
        raise HTTPException(status_code=403, detail="Cannot publish another user's post")
    post.status = "published"
    db.commit()
    db.refresh(post)
    return format_post_response(post, current_user_id=current_user.student_id)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id and post.user_id != current_user.student_id:
        raise HTTPException(status_code=403, detail="Cannot delete another user's post")
    db.delete(post)
    db.commit()
    return None
