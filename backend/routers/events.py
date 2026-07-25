import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user, get_optional_current_user
from database import Database, get_db
from models import derive_department
from schemas import (
    EventCreate,
    EventDetails,
    EventRegistrantUpdate,
    EventRegistrationRequest,
    EventResponse,
    EventResultPublishRequest,
    EventSettings,
    EventUpdate,
    TeamMemberAddRequest,
)

router = APIRouter(prefix="/events", tags=["Events"])


def _parse(v, m):
    try:
        return m(**json.loads(v)) if v else m()
    except TypeError, json.JSONDecodeError:
        return m()


def _details(e):
    return _parse(e.details, EventDetails)


def _settings(e):
    return _parse(e.settings, EventSettings)


def _tags(e):
    try:
        return json.loads(e.tags) if e.tags else []
    except json.JSONDecodeError:
        return []


def _event(db, eid):
    return db.one("SELECT * FROM events WHERE id=?", (eid,))


def check_is_event_admin(e, sid, db):
    if not sid:
        return False
    if e.club_id:
        from routers.clubs import check_is_club_admin

        club = db.one("SELECT * FROM club WHERE id=?", (e.club_id,))
        if club and check_is_club_admin(club, sid, db):
            return True
    return bool(
        db.one(
            "SELECT 1 FROM event_registrants WHERE event_id=? AND user_id=? AND LOWER(role)='admin'",
            (e.id, sid),
        )
    )


def check_is_main_event_admin(e, sid, db):
    r = db.one(
        "SELECT user_id FROM event_registrants WHERE event_id=? AND LOWER(role)='admin' ORDER BY registered_at,id LIMIT 1",
        (e.id,),
    )
    return bool(r and r.user_id == sid)


def format_event_response(e, current_user_student_id=None, db: Database | None = None):
    if db is None:
        raise ValueError("A database connection is required to format an event response.")
    r = (
        db.one(
            "SELECT * FROM event_registrants WHERE event_id=? AND user_id=?",
            (e.id, current_user_student_id),
        )
        if current_user_student_id
        else None
    )
    admin = bool(current_user_student_id and check_is_event_admin(e, current_user_student_id, db))
    club = db.one("SELECT title FROM club WHERE id=?", (e.club_id,)) if e.club_id else None
    return {
        "id": e.id,
        "title": e.title,
        "short_description": e.short_description,
        "event_type": e.event_type,
        "status": e.status,
        "start_time": e.start_time,
        "end_time": e.end_time,
        "club_id": e.club_id,
        "tags": _tags(e),
        "results": e.results,
        "details": _details(e),
        "settings": _settings(e),
        "club_title": club.title if club else "Campus Organization",
        "registrant_count": (
            registrant_count.count
            if (
                registrant_count := db.one(
                    "SELECT COUNT(*) AS count FROM event_registrants WHERE event_id=?", (e.id,)
                )
            )
            else 0
        ),
        "is_registered": bool(r or admin),
        "user_role": (
            "ADMIN" if admin else "ENROLLED" if r and r.status == "approved" else "EXTERNAL"
        ),
        "registrant_role": r.role if r else "Admin" if admin else None,
        "registrant_status": r.status if r else "approved" if admin else None,
    }


@router.get("", response_model=List[EventResponse])
def get_all_events(db=Depends(get_db), current_user=Depends(get_optional_current_user)):
    return [
        format_event_response(e, current_user.student_id if current_user else None, db)
        for e in db.all("SELECT * FROM events ORDER BY start_time")
    ]


@router.get("/{event_id}", response_model=EventResponse)
def get_event_by_id(
    event_id: int, db=Depends(get_db), current_user=Depends(get_optional_current_user)
):
    e = _event(db, event_id)
    if not e:
        raise HTTPException(404, "Event not found")
    return format_event_response(e, current_user.student_id if current_user else None, db)


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(event_in: EventCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    c = db.execute(
        "INSERT INTO events (title,short_description,event_type,status,start_time,end_time,club_id,tags,results,details,settings) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        (
            event_in.title,
            event_in.short_description,
            event_in.event_type,
            event_in.status,
            event_in.start_time,
            event_in.end_time,
            event_in.club_id,
            json.dumps(event_in.tags) if event_in.tags is not None else None,
            event_in.results,
            json.dumps((event_in.details or EventDetails()).model_dump()),
            json.dumps((event_in.settings or EventSettings()).model_dump()),
        ),
    )
    eid = c.lastrowid
    db.execute(
        "INSERT INTO event_registrants (event_id,user_id,role,status) VALUES (?,?,'Admin','approved')",
        (eid, current_user.student_id),
    )
    db.commit()
    return format_event_response(_event(db, eid), current_user.student_id, db)


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int, updates: EventUpdate, db=Depends(get_db), current_user=Depends(get_current_user)
):
    e = _event(db, event_id)
    if not e:
        raise HTTPException(404, "Event not found")
    if not check_is_event_admin(e, current_user.student_id, db):
        raise HTTPException(403, "Admin permissions required to modify event settings")
    vals = {
        k: getattr(updates, k)
        for k in [
            "title",
            "short_description",
            "event_type",
            "status",
            "start_time",
            "end_time",
            "results",
        ]
        if getattr(updates, k) is not None
    }
    if updates.tags is not None:
        vals["tags"] = json.dumps(updates.tags)
    if updates.details is not None:
        d = _details(e).model_dump()
        d.update({k: v for k, v in updates.details.model_dump().items() if v is not None})
        vals["details"] = json.dumps(d)
    if updates.settings is not None:
        s = _settings(e).model_dump()
        s.update({k: v for k, v in updates.settings.model_dump().items() if v is not None})
        vals["settings"] = json.dumps(s)
    if vals:
        db.execute(
            "UPDATE events SET " + ", ".join((f"{k}=?" for k in vals)) + " WHERE id=?",
            tuple(vals.values()) + (event_id,),
        )
        db.commit()
    return format_event_response(_event(db, event_id), current_user.student_id, db)


@router.post("/{event_id}/results", response_model=EventResponse)
def publish_event_results(
    event_id: int,
    req: EventResultPublishRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    e = _event(db, event_id)
    if not e:
        raise HTTPException(404, "Event not found")
    if not check_is_event_admin(e, current_user.student_id, db):
        raise HTTPException(403, "Admin permissions required to publish event results")
    s = _settings(e).model_dump()
    s["is_results_public"] = True
    db.execute(
        "UPDATE events SET results=?,status='completed',settings=? WHERE id=?",
        (req.results, json.dumps(s), event_id),
    )
    db.commit()
    return format_event_response(_event(db, event_id), current_user.student_id, db)


def _valid_users(db, ids):
    return (
        {
            r.student_id
            for r in db.all(
                "SELECT student_id FROM user WHERE student_id IN ("
                + ",".join("?" * len(ids))
                + ")",
                tuple(ids),
            )
        }
        if ids
        else set()
    )


@router.post("/{event_id}/register")
def register_for_event(
    event_id: int,
    req: EventRegistrationRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    e = _event(db, event_id)
    if not e:
        raise HTTPException(404, "Event not found")
    if db.one(
        "SELECT 1 FROM event_registrants WHERE event_id=? AND user_id=?",
        (event_id, current_user.student_id),
    ):
        return {"detail": "Already registered for this event", "is_registered": True}
    team = _settings(e).participation_type == "team"
    name = (req.team_name or "").strip()
    if team and (not name):
        raise HTTPException(400, "A team name is required for this event")
    if not team and (name or req.team_members):
        raise HTTPException(400, "This event only accepts individual registrations")
    ids = list(
        dict.fromkeys(
            [current_user.student_id] + [x.strip() for x in req.team_members if x.strip()]
        )
    )
    if team and len(ids) > 4:
        raise HTTPException(400, "A team can have at most 4 members")
    if _valid_users(db, ids) != set(ids):
        raise HTTPException(400, "One or more Student IDs were not found")
    if db.one(
        "SELECT 1 FROM event_registrants WHERE event_id=? AND user_id IN ("
        + ",".join("?" * len(ids))
        + ")",
        (event_id, *ids),
    ):
        raise HTTPException(400, "One or more team members are already registered")
    for sid in ids:
        db.execute(
            "INSERT INTO event_registrants (event_id,user_id,role,status,team_name) VALUES (?,?,?,?,?)",
            (
                event_id,
                sid,
                "Team Lead" if team and sid == current_user.student_id else "Participant",
                "approved",
                name or None,
            ),
        )
    db.commit()
    return {
        "detail": (
            f"Team registration submitted for {e.title}!"
            if team
            else f"Successfully registered for {e.title}!"
        ),
        "is_registered": True,
        "status": "approved",
    }


@router.get("/{event_id}/registrants")
def get_event_registrants(
    event_id: int, db=Depends(get_db), current_user=Depends(get_current_user)
):
    if not _event(db, event_id):
        raise HTTPException(404, "Event not found")
    rows = db.all(
        "SELECT r.*,u.name,u.email,u.profile_pic FROM event_registrants r LEFT JOIN user u ON u.student_id=r.user_id WHERE r.event_id=? ORDER BY CASE WHEN LOWER(r.role)='admin' THEN 0 ELSE 1 END,r.team_name,r.registered_at",
        (event_id,),
    )
    return [
        {**r.__dict__, "student_id": r.user_id, "department": derive_department(r.user_id)}
        for r in rows
    ]


@router.post("/{event_id}/teams/{team_name}/members")
def add_team_members(
    event_id: int,
    team_name: str,
    req: TeamMemberAddRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    e = _event(db, event_id)
    if not e:
        raise HTTPException(404, "Event not found")
    if _settings(e).participation_type != "team":
        raise HTTPException(400, "This event does not use team registration")
    if not db.one(
        "SELECT 1 FROM event_registrants WHERE event_id=? AND user_id=? AND team_name=? AND LOWER(role)!='admin'",
        (event_id, current_user.student_id, team_name),
    ):
        raise HTTPException(403, "Only a member of this team can add members")
    team_size = db.one(
        "SELECT COUNT(*) AS count FROM event_registrants WHERE event_id=? AND team_name=? AND LOWER(role)!='admin'",
        (event_id, team_name),
    )
    size = team_size.count if team_size else 0
    ids = list(dict.fromkeys((x.strip() for x in req.team_members if x.strip())))
    if not ids:
        raise HTTPException(400, "Choose at least one member to add")
    if size + len(ids) > 4:
        raise HTTPException(400, f"Only {4 - size} team seat(s) remain")
    if _valid_users(db, ids) != set(ids):
        raise HTTPException(400, "One or more Student IDs were not found")
    if db.one(
        "SELECT 1 FROM event_registrants WHERE event_id=? AND user_id IN ("
        + ",".join("?" * len(ids))
        + ")",
        (event_id, *ids),
    ):
        raise HTTPException(400, "One or more selected users are already registered")
    for sid in ids:
        db.execute(
            "INSERT INTO event_registrants (event_id,user_id,role,status,team_name) VALUES (?,?,'Participant','approved',?)",
            (event_id, sid, team_name),
        )
    db.commit()
    return {"detail": f"Added {len(ids)} member(s) to {team_name}"}


@router.patch("/{event_id}/registrants/{registrant_id}")
def update_event_registrant(
    event_id: int,
    registrant_id: int,
    updates: EventRegistrantUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    e = _event(db, event_id)
    if not e:
        raise HTTPException(404, "Event not found")
    if not check_is_event_admin(e, current_user.student_id, db):
        raise HTTPException(403, "Admin permissions required to modify registrant settings")
    r = db.one(
        "SELECT * FROM event_registrants WHERE id=? AND event_id=?", (registrant_id, event_id)
    )
    if not r:
        raise HTTPException(404, "Registrant record not found")
    if (updates.role is not None or updates.team_name is not None) and (
        not check_is_main_event_admin(e, current_user.student_id, db)
    ):
        raise HTTPException(403, "Only the main event admin can assign roles")
    if updates.team_name is not None and (r.role or "").lower() != "admin":
        raise HTTPException(400, "Custom display roles are only available for admins")
    vals = [
        (k, v)
        for k, v in [
            ("role", updates.role),
            ("team_name", updates.team_name.strip() if updates.team_name is not None else None),
        ]
        if v is not None
    ]
    if updates.status is not None:
        if r.team_name:
            db.execute(
                "UPDATE event_registrants SET status=? WHERE event_id=? AND team_name=?",
                (updates.status, event_id, r.team_name),
            )
        else:
            vals.append(("status", updates.status))
    if vals:
        db.execute(
            "UPDATE event_registrants SET "
            + ", ".join((f"{k}=?" for k, _ in vals))
            + " WHERE id=?",
            tuple((v for _, v in vals)) + (registrant_id,),
        )
    db.commit()
    r = db.one("SELECT * FROM event_registrants WHERE id=?", (registrant_id,))
    return {
        "detail": "Registrant updated successfully",
        "registrant_id": r.id,
        "role": r.role,
        "status": r.status,
    }


@router.post("/{event_id}/admins")
def add_event_admin(
    event_id: int, payload: dict, db=Depends(get_db), current_user=Depends(get_current_user)
):
    e = _event(db, event_id)
    if not e:
        raise HTTPException(404, "Event not found")
    if not check_is_main_event_admin(e, current_user.student_id, db):
        raise HTTPException(403, "Only the main event admin can add admins")
    sid = str(payload.get("student_id", "")).strip()
    user = db.one("SELECT name FROM user WHERE student_id=?", (sid,))
    if not user:
        raise HTTPException(404, "Student ID not found")
    display = str(payload.get("display_role", "Admin")).strip() or "Admin"
    r = db.one("SELECT id FROM event_registrants WHERE event_id=? AND user_id=?", (event_id, sid))
    if r:
        db.execute(
            "UPDATE event_registrants SET role='Admin',status='approved',team_name=? WHERE id=?",
            (display, r.id),
        )
    else:
        db.execute(
            "INSERT INTO event_registrants (event_id,user_id,role,status,team_name) VALUES (?,?,'Admin','approved',?)",
            (event_id, sid, display),
        )
    db.commit()
    return {"detail": f"{user.name} is now an event admin"}


@router.delete("/{event_id}/teams/{team_name}")
def remove_event_team(
    event_id: int, team_name: str, db=Depends(get_db), current_user=Depends(get_current_user)
):
    e = _event(db, event_id)
    if not e:
        raise HTTPException(404, "Event not found")
    if not check_is_event_admin(e, current_user.student_id, db):
        raise HTTPException(403, "Admin permissions required to remove a team")
    c = db.execute(
        "DELETE FROM event_registrants WHERE event_id=? AND team_name=? AND LOWER(role)!='admin'",
        (event_id, team_name),
    )
    if not c.rowcount:
        raise HTTPException(404, "Team not found")
    db.commit()
    return {"detail": "Team removed from the event"}
