import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import UserModel
from auth import get_password_hash, get_current_user
from schemas import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])

def format_user_dict(user: UserModel) -> dict:
    skills_data = []
    if user.skills:
        try:
            skills_data = json.loads(user.skills)
        except Exception:
            skills_data = []
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "department": user.department,
        "profile_pic": user.profile_pic,
        "bio": user.bio,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "skills": skills_data,
    }


@router.get("", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    users = db.query(UserModel).all()
    return [format_user_dict(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return format_user_dict(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    updates: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="You can only update your own profile")
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if updates.bio is not None:
        user.bio = updates.bio
    if updates.profile_pic is not None:
        user.profile_pic = updates.profile_pic
    if updates.skills is not None:
        skills_dicts = [s.model_dump() for s in updates.skills]
        user.skills = json.dumps(skills_dicts)
    db.commit()
    db.refresh(user)
    return format_user_dict(user)
