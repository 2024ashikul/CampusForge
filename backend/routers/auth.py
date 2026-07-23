import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import UserModel, EmailVerification
from schemas import UserCreate, UserResponse, Token, LoginRequest
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

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


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pw = get_password_hash(user_in.password)
    skills_str = json.dumps([s.model_dump() for s in user_in.skills]) if user_in.skills else None
    new_user = UserModel(
        name=user_in.name,
        email=user_in.email,
        password=hashed_pw,
        department=user_in.department,
        profile_pic=user_in.profile_pic,
        bio=user_in.bio,
        skills=skills_str,
        is_active=1,  # Auto-activate (no email service configured)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return format_user_dict(new_user)


@router.post("/login", response_model=Token)
def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == form_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is not active")

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": format_user_dict(user),
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserModel = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return format_user_dict(current_user)


@router.post("/refresh", response_model=Token)
def refresh_token(current_user: UserModel = Depends(get_current_user)):
    access_token = create_access_token(data={"sub": current_user.email})
    refresh_token = create_refresh_token(data={"sub": current_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": format_user_dict(current_user),
    }
