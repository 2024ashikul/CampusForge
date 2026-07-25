import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import UserModel, ClubMemberModel, ClubModel, EventRegistrantModel, EventModel, derive_department
from auth import get_password_hash, get_current_user, get_optional_current_user
from schemas import UserCreate, UserResponse, UserUpdate, ClubResponse, EventResponse
from routers.clubs import format_club_response
from routers.events import format_event_response

router = APIRouter(prefix="/users", tags=["Users"])


def format_user_dict(user: UserModel) -> dict:
    skills_data = []
    if user.skills:
        try:
            skills_data = json.loads(user.skills)
        except Exception:
            skills_data = []
    socials_data = None
    if user.socials:
        try:
            socials_data = json.loads(user.socials)
        except Exception:
            socials_data = None
    return {
        "student_id": user.student_id,
        "name": user.name,
        "email": user.email,
        "department": derive_department(user.student_id),
        "profile_pic": user.profile_pic,
        "bio": user.bio,
        "created_at": user.created_at,
        "skills": skills_data,
        "socials": socials_data,
    }


@router.get("", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
):
    users = db.query(UserModel).all()
    return [format_user_dict(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: str,   # student_id is now the identifier
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
):
    user = db.query(UserModel).filter(UserModel.student_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return format_user_dict(user)


@router.get("/{user_id}/clubs", response_model=List[ClubResponse])
def get_user_clubs(
    user_id: str,   # student_id
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
):
    memberships = db.query(ClubMemberModel).filter(ClubMemberModel.user_id == user_id).all()
    club_ids = [m.club_id for m in memberships]
    clubs = db.query(ClubModel).filter(ClubModel.id.in_(club_ids)).all() if club_ids else []
    return [format_club_response(c, current_user_student_id=user_id, db=db) for c in clubs]


@router.get("/{user_id}/events", response_model=List[EventResponse])
def get_user_events(
    user_id: str,   # student_id
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
):
    registrations = db.query(EventRegistrantModel).filter(EventRegistrantModel.user_id == user_id).all()
    event_ids = [r.event_id for r in registrations]
    events = db.query(EventModel).filter(EventModel.id.in_(event_ids)).all() if event_ids else []
    return [format_event_response(e, current_user_student_id=user_id, db=db) for e in events]


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,   # student_id
    updates: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if current_user.student_id != user_id:
        raise HTTPException(status_code=403, detail="You can only update your own profile")
    user = db.query(UserModel).filter(UserModel.student_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if updates.name is not None:
        user.name = updates.name
    if updates.bio is not None:
        user.bio = updates.bio
    if updates.profile_pic is not None:
        user.profile_pic = updates.profile_pic
    if updates.skills is not None:
        user.skills = json.dumps([s.model_dump() for s in updates.skills])
    if updates.socials is not None:
        user.socials = json.dumps(updates.socials)
    db.commit()
    db.refresh(user)
    return format_user_dict(user)
