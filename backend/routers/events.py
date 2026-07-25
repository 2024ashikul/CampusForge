import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import EventModel, EventRegistrantModel, ClubModel, ClubMemberModel, UserModel
from schemas import (
    EventCreate, EventResponse, EventRegistrationRequest,
    EventUpdate, EventResultPublishRequest, EventRegistrantUpdate, TeamMemberAddRequest,
    EventDetails, EventSettings
)
from auth import get_current_user, get_optional_current_user
from models import derive_department

router = APIRouter(prefix="/events", tags=["Events"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_details(event: EventModel) -> EventDetails:
    if event.details:
        try:
            return EventDetails(**json.loads(event.details))
        except Exception:
            pass
    return EventDetails()


def _parse_settings(event: EventModel) -> EventSettings:
    if event.settings:
        try:
            return EventSettings(**json.loads(event.settings))
        except Exception:
            pass
    return EventSettings()


def _parse_tags(event: EventModel) -> List[str]:
    if event.tags:
        try:
            return json.loads(event.tags) if event.tags.startswith("[") else [t.strip() for t in event.tags.split(",")]
        except Exception:
            pass
    return []


def check_is_event_admin(event: EventModel, user_student_id: str, db: Session) -> bool:
    if not user_student_id:
        return False
    if event.club_id:
        club = db.query(ClubModel).filter(ClubModel.id == event.club_id).first()
        if club:
            from routers.clubs import check_is_club_admin
            if check_is_club_admin(club, user_student_id, db):
                return True
    reg = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.event_id == event.id,
        EventRegistrantModel.user_id == user_student_id
    ).first()
    if reg and reg.role and reg.role.lower() == "admin":
        return True
    return False


def check_is_main_event_admin(event: EventModel, user_student_id: str, db: Session) -> bool:
    """The event creator is the first admin registration. No new data is needed."""
    main_admin = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.event_id == event.id,
        EventRegistrantModel.role.ilike("admin")
    ).order_by(EventRegistrantModel.registered_at.asc(), EventRegistrantModel.id.asc()).first()
    return bool(main_admin and main_admin.user_id == user_student_id)


def format_event_response(
    event: EventModel,
    current_user_student_id: Optional[str] = None,
    db: Session = None
) -> EventResponse:
    details = _parse_details(event)
    settings = _parse_settings(event)
    parsed_tags = _parse_tags(event)
    club_title = event.club.title if event.club else "Campus Organization"
    registrant_count = (
        db.query(EventRegistrantModel).filter(EventRegistrantModel.event_id == event.id).count()
        if db else len(event.registrants)
    )

    is_registered = False
    user_role = "EXTERNAL"
    registrant_role = None
    registrant_status = None

    if current_user_student_id and db:
        reg_entry = db.query(EventRegistrantModel).filter(
            EventRegistrantModel.event_id == event.id,
            EventRegistrantModel.user_id == current_user_student_id
        ).first()

        if check_is_event_admin(event, current_user_student_id, db):
            user_role = "ADMIN"
            is_registered = True
            registrant_role = reg_entry.role if reg_entry else "Admin"
            registrant_status = reg_entry.status if reg_entry else "approved"
        elif reg_entry:
            is_registered = True
            registrant_role = reg_entry.role
            registrant_status = reg_entry.status
            user_role = "ENROLLED" if reg_entry.status == "approved" else "EXTERNAL"

    return EventResponse(
        id=event.id,
        title=event.title,
        short_description=event.short_description,
        event_type=event.event_type or "workshop",
        status=event.status or "upcoming",
        start_time=event.start_time,
        end_time=event.end_time,
        club_id=event.club_id,
        tags=parsed_tags,
        results=event.results,
        details=details,
        settings=settings,
        club_title=club_title,
        registrant_count=registrant_count,
        is_registered=is_registered,
        user_role=user_role,
        registrant_role=registrant_role,
        registrant_status=registrant_status,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=List[EventResponse])
def get_all_events(
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user)
):
    events = db.query(EventModel).all()
    user_sid = current_user.student_id if current_user else None
    return [format_event_response(e, current_user_student_id=user_sid, db=db) for e in events]


@router.get("/{event_id}", response_model=EventResponse)
def get_event_by_id(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user)
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    user_sid = current_user.student_id if current_user else None
    return format_event_response(event, current_user_student_id=user_sid, db=db)


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    tags_str = json.dumps(event_in.tags) if event_in.tags is not None else None
    details = event_in.details or EventDetails()
    settings = event_in.settings or EventSettings()

    new_event = EventModel(
        title=event_in.title,
        short_description=event_in.short_description,
        event_type=event_in.event_type,
        status=event_in.status,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        club_id=event_in.club_id,
        tags=tags_str,
        results=event_in.results,
        details=json.dumps(details.model_dump()),
        settings=json.dumps(settings.model_dump()),
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    # Auto add creator as Event Admin registrant
    reg = EventRegistrantModel(
        event_id=new_event.id,
        user_id=current_user.student_id,
        role="Admin",
        status="approved",
    )
    db.add(reg)
    db.commit()

    return format_event_response(new_event, current_user_student_id=current_user.student_id, db=db)


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    updates: EventUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not check_is_event_admin(event, current_user.student_id, db):
        raise HTTPException(status_code=403, detail="Admin permissions required to modify event settings")

    if updates.title is not None:
        event.title = updates.title
    if updates.short_description is not None:
        event.short_description = updates.short_description
    if updates.event_type is not None:
        event.event_type = updates.event_type
    if updates.status is not None:
        event.status = updates.status
    if updates.start_time is not None:
        event.start_time = updates.start_time
    if updates.end_time is not None:
        event.end_time = updates.end_time
    if updates.tags is not None:
        event.tags = json.dumps(updates.tags)
    if updates.results is not None:
        event.results = updates.results
    if updates.details is not None:
        existing = _parse_details(event).model_dump()
        existing.update({k: v for k, v in updates.details.model_dump().items() if v is not None})
        event.details = json.dumps(existing)
    if updates.settings is not None:
        existing = _parse_settings(event).model_dump()
        existing.update({k: v for k, v in updates.settings.model_dump().items() if v is not None})
        event.settings = json.dumps(existing)

    db.commit()
    db.refresh(event)
    return format_event_response(event, current_user_student_id=current_user.student_id, db=db)


@router.post("/{event_id}/results", response_model=EventResponse)
def publish_event_results(
    event_id: int,
    req: EventResultPublishRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not check_is_event_admin(event, current_user.student_id, db):
        raise HTTPException(status_code=403, detail="Admin permissions required to publish event results")

    event.results = req.results
    event.status = "completed"
    # Mark results as public in settings
    settings_data = _parse_settings(event).model_dump()
    settings_data["is_results_public"] = True
    event.settings = json.dumps(settings_data)

    db.commit()
    db.refresh(event)
    return format_event_response(event, current_user_student_id=current_user.student_id, db=db)


@router.post("/{event_id}/register")
def register_for_event(
    event_id: int,
    req: EventRegistrationRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    settings = _parse_settings(event)
    is_team_event = settings.participation_type == "team"
    team_name = (req.team_name or "").strip()

    existing = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.event_id == event_id,
        EventRegistrantModel.user_id == current_user.student_id
    ).first()
    if existing:
        return {"detail": "Already registered for this event", "is_registered": True}

    if is_team_event and not team_name:
        raise HTTPException(status_code=400, detail="A team name is required for this event")
    if not is_team_event and (team_name or req.team_members):
        raise HTTPException(status_code=400, detail="This event only accepts individual registrations")

    member_ids = [current_user.student_id]
    if is_team_event:
        member_ids.extend(member_id.strip() for member_id in req.team_members if member_id.strip())
        member_ids = list(dict.fromkeys(member_ids))
        if len(member_ids) > 4:
            raise HTTPException(status_code=400, detail="A team can have at most 4 members")
        users = db.query(UserModel).filter(UserModel.student_id.in_(member_ids)).all()
        found_ids = {user.student_id for user in users}
        missing_ids = [member_id for member_id in member_ids if member_id not in found_ids]
        if missing_ids:
            raise HTTPException(status_code=400, detail=f"Student ID not found: {', '.join(missing_ids)}")

        already_registered = db.query(EventRegistrantModel).filter(
            EventRegistrantModel.event_id == event_id,
            EventRegistrantModel.user_id.in_(member_ids)
        ).all()
        if already_registered:
            raise HTTPException(status_code=400, detail="One or more team members are already registered")

    # Validate everything before any rows are written; all roster rows commit together.
    try:
        for member_id in member_ids:
            db.add(EventRegistrantModel(
                event_id=event_id,
                user_id=member_id,
                role="Team Lead" if is_team_event and member_id == current_user.student_id else "Participant",
                status="approved",
                team_name=team_name or None,
            ))
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "detail": f"Team registration submitted for {event.title}!" if is_team_event else f"Successfully registered for {event.title}!",
        "is_registered": True,
        "status": "approved",
    }


@router.post("/{event_id}/teams/{team_name}/members")
def add_team_members(
    event_id: int,
    team_name: str,
    req: TeamMemberAddRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """A registered team member can fill the remaining seats after initial registration."""
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if _parse_settings(event).participation_type != "team":
        raise HTTPException(status_code=400, detail="This event does not use team registration")

    team_member = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.event_id == event_id,
        EventRegistrantModel.user_id == current_user.student_id,
        EventRegistrantModel.team_name == team_name,
        EventRegistrantModel.role.notilike("admin"),
    ).first()
    if not team_member:
        raise HTTPException(status_code=403, detail="Only a member of this team can add members")

    current_size = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.event_id == event_id,
        EventRegistrantModel.team_name == team_name,
        EventRegistrantModel.role.notilike("admin"),
    ).count()
    member_ids = list(dict.fromkeys(member_id.strip() for member_id in req.team_members if member_id.strip()))
    if not member_ids:
        raise HTTPException(status_code=400, detail="Choose at least one member to add")
    if current_size + len(member_ids) > 4:
        raise HTTPException(status_code=400, detail=f"Only {4 - current_size} team seat(s) remain")

    users = db.query(UserModel).filter(UserModel.student_id.in_(member_ids)).all()
    found_ids = {user.student_id for user in users}
    missing_ids = [member_id for member_id in member_ids if member_id not in found_ids]
    if missing_ids:
        raise HTTPException(status_code=400, detail=f"Student ID not found: {', '.join(missing_ids)}")
    already_registered = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.event_id == event_id,
        EventRegistrantModel.user_id.in_(member_ids),
    ).all()
    if already_registered:
        raise HTTPException(status_code=400, detail="One or more selected users are already registered")

    try:
        for member_id in member_ids:
            db.add(EventRegistrantModel(
                event_id=event_id, user_id=member_id, role="Participant",
                status="approved", team_name=team_name,
            ))
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"detail": f"Added {len(member_ids)} member(s) to {team_name}"}


@router.get("/{event_id}/registrants")
def get_event_registrants(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    registrants = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.event_id == event_id
    ).order_by(
        EventRegistrantModel.role != "Admin",
        EventRegistrantModel.team_name.is_(None),
        EventRegistrantModel.team_name.asc(),
        EventRegistrantModel.registered_at.asc()
    ).all()
    out = []
    for r in registrants:
        u = r.user
        out.append({
            "id": r.id,
            "user_id": r.user_id,
            "name": u.name if u else "Unknown User",
            "email": u.email if u else "",
            "student_id": u.student_id if u else "",
            "department": derive_department(u.student_id) if u else "",
            "profile_pic": u.profile_pic if u else None,
            "team_name": r.team_name,
            "role": r.role or "Participant",
            "status": r.status or "approved",
            "registered_at": r.registered_at,
        })
    return out


@router.patch("/{event_id}/registrants/{registrant_id}")
def update_event_registrant(
    event_id: int,
    registrant_id: int,
    updates: EventRegistrantUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not check_is_event_admin(event, current_user.student_id, db):
        raise HTTPException(status_code=403, detail="Admin permissions required to modify registrant settings")

    reg = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.id == registrant_id,
        EventRegistrantModel.event_id == event_id
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registrant record not found")

    if updates.role is not None:
        if not check_is_main_event_admin(event, current_user.student_id, db):
            raise HTTPException(status_code=403, detail="Only the main event admin can assign roles")
        reg.role = updates.role
    if updates.team_name is not None:
        if not check_is_main_event_admin(event, current_user.student_id, db):
            raise HTTPException(status_code=403, detail="Only the main event admin can change admin roles")
        if (reg.role or "").lower() != "admin":
            raise HTTPException(status_code=400, detail="Custom display roles are only available for admins")
        reg.team_name = updates.team_name.strip() or None
    if updates.status is not None:
        if reg.team_name:
            db.query(EventRegistrantModel).filter(
                EventRegistrantModel.event_id == event_id,
                EventRegistrantModel.team_name == reg.team_name
            ).update({EventRegistrantModel.status: updates.status}, synchronize_session=False)
        else:
            reg.status = updates.status

    db.commit()
    return {
        "detail": "Registrant updated successfully",
        "registrant_id": reg.id,
        "role": reg.role,
        "status": reg.status,
    }


@router.post("/{event_id}/admins")
def add_event_admin(
    event_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Add an event admin using the existing event registration table."""
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not check_is_main_event_admin(event, current_user.student_id, db):
        raise HTTPException(status_code=403, detail="Only the main event admin can add admins")

    student_id = str(payload.get("student_id", "")).strip()
    display_role = str(payload.get("display_role", "Admin")).strip() or "Admin"
    user = db.query(UserModel).filter(UserModel.student_id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student ID not found")

    reg = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.event_id == event_id,
        EventRegistrantModel.user_id == student_id
    ).first()
    if reg:
        reg.role = "Admin"
        reg.status = "approved"
        reg.team_name = display_role
    else:
        db.add(EventRegistrantModel(
            event_id=event_id, user_id=student_id, role="Admin",
            status="approved", team_name=display_role
        ))
    db.commit()
    return {"detail": f"{user.name} is now an event admin"}


@router.delete("/{event_id}/teams/{team_name}")
def remove_event_team(
    event_id: int,
    team_name: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not check_is_event_admin(event, current_user.student_id, db):
        raise HTTPException(status_code=403, detail="Admin permissions required to remove a team")
    deleted = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.event_id == event_id,
        EventRegistrantModel.team_name == team_name,
        EventRegistrantModel.role.notilike("admin")
    ).delete(synchronize_session=False)
    if not deleted:
        raise HTTPException(status_code=404, detail="Team not found")
    db.commit()
    return {"detail": "Team removed from the event"}
