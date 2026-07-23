import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import EventModel, EventRegistrantModel, ClubModel, ClubMemberModel, UserModel
from schemas import (
    EventCreate,
    EventResponse,
    EventRegistrationRequest,
    EventUpdate,
    EventResultPublishRequest,
    EventRegistrantUpdate
)
from auth import get_current_user, get_optional_current_user

router = APIRouter(prefix="/events", tags=["Events"])


def check_is_event_admin(event: EventModel, user_id: int, db: Session) -> bool:
    if not user_id:
        return False
    # If event belongs to a club, check if user is a club admin
    if event.club_id:
        club = db.query(ClubModel).filter(ClubModel.id == event.club_id).first()
        if club:
            user = db.query(UserModel).filter(UserModel.id == user_id).first()
            if user and club.lead_name and user.name.lower() == club.lead_name.lower():
                return True
            club_member = db.query(ClubMemberModel).filter(
                ClubMemberModel.club_id == event.club_id,
                ClubMemberModel.user_id == user_id
            ).first()
            if club_member and club_member.role and club_member.role.lower() in ["admin", "lead", "leader", "president", "director"]:
                return True

    # Check if registrant has Admin role for this event
    reg = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.event_id == event.id,
        EventRegistrantModel.user_id == user_id
    ).first()
    if reg and reg.role and reg.role.lower() == "admin":
        return True

    return False


def format_event_response(event: EventModel, current_user_id: Optional[int] = None, db: Session = None) -> EventResponse:
    parsed_tags = []
    if event.tags:
        try:
            parsed_tags = json.loads(event.tags) if event.tags.startswith('[') else [t.strip() for t in event.tags.split(',')]
        except Exception:
            parsed_tags = []

    club_title = event.club.title if event.club else "Campus Organization"
    registrant_count = db.query(EventRegistrantModel).filter(EventRegistrantModel.event_id == event.id).count() if db else len(event.registrants)

    is_registered = False
    user_role = "EXTERNAL"
    registrant_role = None
    registrant_status = None

    if current_user_id and db:
        reg_entry = db.query(EventRegistrantModel).filter(
            EventRegistrantModel.event_id == event.id,
            EventRegistrantModel.user_id == current_user_id
        ).first()

        if check_is_event_admin(event, current_user_id, db):
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
        description_markdown=event.description_markdown or event.short_description,
        event_type=event.event_type or "workshop",
        status=event.status or "upcoming",
        participation_type=event.participation_type or "individual",
        entrance_fee=event.entrance_fee or "free",
        date=event.date,
        time=event.time,
        location=event.location,
        virtual_link=event.virtual_link,
        image_url=event.image_url,
        club_id=event.club_id,
        tags=parsed_tags,
        results=event.results,
        created_at=event.created_at,
        club_title=club_title,
        registrant_count=registrant_count,
        is_registered=is_registered,
        user_role=user_role,
        registrant_role=registrant_role,
        registrant_status=registrant_status,
    )


@router.get("", response_model=List[EventResponse])
def get_all_events(db: Session = Depends(get_db), current_user: Optional[UserModel] = Depends(get_optional_current_user)):
    events = db.query(EventModel).order_by(EventModel.created_at.desc()).all()
    user_id = current_user.id if current_user else None
    return [format_event_response(e, current_user_id=user_id, db=db) for e in events]


@router.get("/{event_id}", response_model=EventResponse)
def get_event_by_id(event_id: int, db: Session = Depends(get_db), current_user: Optional[UserModel] = Depends(get_optional_current_user)):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    user_id = current_user.id if current_user else None
    return format_event_response(event, current_user_id=user_id, db=db)


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    tags_str = json.dumps(event_in.tags) if event_in.tags is not None else None
    new_event = EventModel(
        title=event_in.title,
        short_description=event_in.short_description,
        description_markdown=event_in.description_markdown or event_in.short_description,
        event_type=event_in.event_type,
        status=event_in.status,
        participation_type=event_in.participation_type,
        entrance_fee=event_in.entrance_fee,
        date=event_in.date,
        time=event_in.time,
        location=event_in.location,
        virtual_link=event_in.virtual_link,
        image_url=event_in.image_url,
        club_id=event_in.club_id,
        tags=tags_str,
        results=event_in.results,
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    # Auto add creator as Event Admin registrant
    reg = EventRegistrantModel(
        event_id=new_event.id,
        user_id=current_user.id,
        role="Admin",
        status="approved",
        payment_status="free"
    )
    db.add(reg)
    db.commit()

    return format_event_response(new_event, current_user_id=current_user.id, db=db)


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

    if not check_is_event_admin(event, current_user.id, db):
        raise HTTPException(status_code=403, detail="Admin permissions required to modify event settings")

    if updates.title is not None:
        event.title = updates.title
    if updates.short_description is not None:
        event.short_description = updates.short_description
    if updates.description_markdown is not None:
        event.description_markdown = updates.description_markdown
    if updates.event_type is not None:
        event.event_type = updates.event_type
    if updates.status is not None:
        event.status = updates.status
    if updates.participation_type is not None:
        event.participation_type = updates.participation_type
    if updates.entrance_fee is not None:
        event.entrance_fee = updates.entrance_fee
    if updates.date is not None:
        event.date = updates.date
    if updates.time is not None:
        event.time = updates.time
    if updates.location is not None:
        event.location = updates.location
    if updates.virtual_link is not None:
        event.virtual_link = updates.virtual_link
    if updates.tags is not None:
        event.tags = json.dumps(updates.tags)
    if updates.results is not None:
        event.results = updates.results

    db.commit()
    db.refresh(event)
    return format_event_response(event, current_user_id=current_user.id, db=db)


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

    if not check_is_event_admin(event, current_user.id, db):
        raise HTTPException(status_code=403, detail="Admin permissions required to publish event results")

    event.results = req.results
    event.status = "completed"
    db.commit()
    db.refresh(event)
    return format_event_response(event, current_user_id=current_user.id, db=db)


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

    existing = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.event_id == event_id,
        EventRegistrantModel.user_id == current_user.id
    ).first()

    if existing:
        return {"detail": "Already registered for this event", "is_registered": True}

    registration = EventRegistrantModel(
        event_id=event_id,
        user_id=current_user.id,
        role="Participant",
        status="approved",
        team_name=req.team_name,
        payment_status="completed" if event.entrance_fee != "free" else "free",
        payment_method=req.payment_method if event.entrance_fee != "free" else None
    )
    db.add(registration)
    db.commit()

    return {
        "detail": f"Successfully registered for {event.title}!",
        "is_registered": True,
        "status": "approved",
        "payment_status": registration.payment_status,
    }


@router.get("/{event_id}/registrants")
def get_event_registrants(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    registrants = db.query(EventRegistrantModel).filter(EventRegistrantModel.event_id == event_id).all()
    out = []
    for r in registrants:
        u = r.user
        out.append({
            "id": r.id,
            "user_id": r.user_id,
            "name": u.name if u else "Unknown User",
            "email": u.email if u else "",
            "department": u.department if u else "",
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

    if not check_is_event_admin(event, current_user.id, db):
        raise HTTPException(status_code=403, detail="Admin permissions required to modify registrant settings")

    reg = db.query(EventRegistrantModel).filter(
        EventRegistrantModel.id == registrant_id,
        EventRegistrantModel.event_id == event_id
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registrant record not found")

    if updates.role is not None:
        reg.role = updates.role
    if updates.status is not None:
        reg.status = updates.status

    db.commit()
    return {"detail": "Registrant updated successfully", "registrant_id": reg.id, "role": reg.role, "status": reg.status}
