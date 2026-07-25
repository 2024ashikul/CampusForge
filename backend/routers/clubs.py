import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import ClubModel, ClubMemberModel, UserModel, EventModel
from schemas import (
    ClubCreate, ClubResponse, ClubJoinRequest, ClubUpdate, ClubMemberUpdate,
    ClubDetails, ClubSettings
)
from auth import get_current_user, get_optional_current_user
from models import derive_department

router = APIRouter(prefix="/clubs", tags=["Clubs"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_details(club: ClubModel) -> ClubDetails:
    if club.details:
        try:
            d = json.loads(club.details)
            return ClubDetails(**d)
        except Exception:
            pass
    return ClubDetails()


def _parse_settings(club: ClubModel) -> ClubSettings:
    if club.settings:
        try:
            s = json.loads(club.settings)
            return ClubSettings(**s)
        except Exception:
            pass
    return ClubSettings()


def check_is_club_admin(club: ClubModel, user_student_id: str, db: Session) -> bool:
    if not user_student_id:
        return False
    details = _parse_details(club)
    user = db.query(UserModel).filter(UserModel.student_id == user_student_id).first()
    if user and details.lead_name and user.name.lower() == details.lead_name.lower():
        return True
    member = db.query(ClubMemberModel).filter(
        ClubMemberModel.club_id == club.id,
        ClubMemberModel.user_id == user_student_id
    ).first()
    if member and member.role and member.role.lower() in ["admin", "lead", "leader", "president", "director"]:
        return True
    return False


def format_club_response(
    club: ClubModel,
    current_user_student_id: Optional[str] = None,
    db: Session = None
) -> ClubResponse:
    details = _parse_details(club)
    settings = _parse_settings(club)

    member_count = (
        db.query(ClubMemberModel).filter(ClubMemberModel.club_id == club.id).count()
        if db else len(club.members)
    )
    event_count = db.query(EventModel).filter(EventModel.club_id == club.id).count() if db else len(club.events)

    is_joined = False
    user_role = "EXTERNAL"
    member_role = None
    member_status = None

    if current_user_student_id and db:
        joined_entry = db.query(ClubMemberModel).filter(
            ClubMemberModel.club_id == club.id,
            ClubMemberModel.user_id == current_user_student_id
        ).first()

        if check_is_club_admin(club, current_user_student_id, db):
            user_role = "ADMIN"
            is_joined = True
            member_role = joined_entry.role if joined_entry else "Admin"
            member_status = joined_entry.status if joined_entry else "approved"
        elif joined_entry:
            is_joined = True
            member_role = joined_entry.role
            member_status = joined_entry.status
            user_role = "ENROLLED" if joined_entry.status == "approved" else "EXTERNAL"

    return ClubResponse(
        id=club.id,
        title=club.title,
        description=club.description,
        details=details,
        settings=settings,
        created_at=club.created_at,
        member_count=member_count,
        event_count=event_count,
        is_joined=is_joined,
        user_role=user_role,
        member_role=member_role,
        member_status=member_status,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=List[ClubResponse])
def get_all_clubs(
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user)
):
    clubs = db.query(ClubModel).all()
    user_sid = current_user.student_id if current_user else None
    return [format_club_response(c, current_user_student_id=user_sid, db=db) for c in clubs]


@router.get("/{club_id}", response_model=ClubResponse)
def get_club_by_id(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user)
):
    club = db.query(ClubModel).filter(ClubModel.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    user_sid = current_user.student_id if current_user else None
    return format_club_response(club, current_user_student_id=user_sid, db=db)


@router.post("", response_model=ClubResponse, status_code=status.HTTP_201_CREATED)
def create_club(
    club_in: ClubCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Inject creator as lead in details
    details = club_in.details or ClubDetails()
    details.lead_name = current_user.name
    settings = club_in.settings or ClubSettings()

    new_club = ClubModel(
        title=club_in.title,
        description=club_in.description,
        details=json.dumps(details.model_dump()),
        settings=json.dumps(settings.model_dump()),
    )
    db.add(new_club)
    db.commit()
    db.refresh(new_club)

    # Auto add creator as Admin member
    membership = ClubMemberModel(
        club_id=new_club.id,
        user_id=current_user.student_id,
        role="Admin",
        status="approved",
    )
    db.add(membership)
    db.commit()

    return format_club_response(new_club, current_user_student_id=current_user.student_id, db=db)


@router.patch("/{club_id}", response_model=ClubResponse)
def update_club(
    club_id: int,
    updates: ClubUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    club = db.query(ClubModel).filter(ClubModel.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    if not check_is_club_admin(club, current_user.student_id, db):
        raise HTTPException(status_code=403, detail="Admin permissions required to modify club settings")

    if updates.title is not None:
        club.title = updates.title
    if updates.description is not None:
        club.description = updates.description
    if updates.details is not None:
        # Merge with existing details
        existing = _parse_details(club).model_dump()
        existing.update({k: v for k, v in updates.details.model_dump().items() if v is not None})
        club.details = json.dumps(existing)
    if updates.settings is not None:
        existing = _parse_settings(club).model_dump()
        existing.update({k: v for k, v in updates.settings.model_dump().items() if v is not None})
        club.settings = json.dumps(existing)

    db.commit()
    db.refresh(club)
    return format_club_response(club, current_user_student_id=current_user.student_id, db=db)


@router.post("/{club_id}/join")
def join_club(
    club_id: int,
    req: ClubJoinRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    club = db.query(ClubModel).filter(ClubModel.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    existing = db.query(ClubMemberModel).filter(
        ClubMemberModel.club_id == club_id,
        ClubMemberModel.user_id == current_user.student_id
    ).first()
    if existing:
        return {"detail": "Already a member of this club", "is_joined": True}

    settings = _parse_settings(club)
    init_status = "approved" if settings.join_format == "open" else "pending"

    membership = ClubMemberModel(
        club_id=club_id,
        user_id=current_user.student_id,
        role="Member",
        status=init_status,
    )
    db.add(membership)
    db.commit()

    return {
        "detail": f"Successfully requested to join {club.title}!",
        "is_joined": True,
        "status": init_status,
    }


@router.get("/{club_id}/members")
def get_club_members(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    club = db.query(ClubModel).filter(ClubModel.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    members = db.query(ClubMemberModel).filter(ClubMemberModel.club_id == club_id).all()
    out = []
    for m in members:
        u = m.user
        out.append({
            "id": m.id,
            "user_id": m.user_id,
            "name": u.name if u else "Unknown User",
            "email": u.email if u else "",
            "student_id": u.student_id if u else "",
            "department": derive_department(u.student_id) if u else "",
            "profile_pic": u.profile_pic if u else None,
            "role": m.role,
            "status": m.status or "approved",
            "joined_at": m.joined_at,
        })
    return out


@router.patch("/{club_id}/members/{member_id}")
def update_club_member(
    club_id: int,
    member_id: int,
    updates: ClubMemberUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    club = db.query(ClubModel).filter(ClubModel.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    if not check_is_club_admin(club, current_user.student_id, db):
        raise HTTPException(status_code=403, detail="Admin permissions required to modify member roles")

    member = db.query(ClubMemberModel).filter(
        ClubMemberModel.id == member_id,
        ClubMemberModel.club_id == club_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member record not found")

    if updates.role is not None:
        member.role = updates.role
    if updates.status is not None:
        member.status = updates.status

    db.commit()
    return {
        "detail": "Member updated successfully",
        "member_id": member.id,
        "role": member.role,
        "status": member.status,
    }
