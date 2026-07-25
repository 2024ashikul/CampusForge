import json
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import UserModel, DEPARTMENT_CODES, derive_department
from schemas import UserCreate, UserResponse, Token, LoginRequest
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

STUDENT_ID_PATTERN = re.compile(r"^\d{7}$")


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
    # Derive department from student_id (not stored in DB)
    department = derive_department(user.student_id)
    return {
        "student_id": user.student_id,
        "name": user.name,
        "email": user.email,
        "department": department,
        "profile_pic": user.profile_pic,
        "bio": user.bio,
        "created_at": user.created_at,
        "skills": skills_data,
        "socials": socials_data,
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Validate student_id format
    if not STUDENT_ID_PATTERN.match(user_in.student_id):
        raise HTTPException(status_code=400, detail="student_id must be exactly 7 digits (format YYPPNNN)")

    # Check uniqueness of student_id
    existing_sid = db.query(UserModel).filter(UserModel.student_id == user_in.student_id).first()
    if existing_sid:
        raise HTTPException(status_code=400, detail=f"Student ID {user_in.student_id} is already registered")

    # Check uniqueness of email
    existing_email = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pw = get_password_hash(user_in.password)
    skills_str = json.dumps([s.model_dump() for s in user_in.skills]) if user_in.skills else None
    socials_str = json.dumps(user_in.socials) if user_in.socials else None

    new_user = UserModel(
        student_id=user_in.student_id,
        name=user_in.name,
        email=user_in.email,
        password=hashed_pw,
        profile_pic=user_in.profile_pic,
        bio=user_in.bio,
        skills=skills_str,
        socials=socials_str,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return format_user_dict(new_user)


@router.post("/login", response_model=Token)
def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    """Login with student_id + email + password simultaneously."""
    user = db.query(UserModel).filter(
        UserModel.student_id == form_data.student_id,
        UserModel.email == form_data.email
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect Student ID, Email, or Password")
    if not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect Student ID, Email, or Password")

    # JWT sub is now the student_id (string)
    access_token = create_access_token(data={"sub": user.student_id})
    refresh_token = create_refresh_token(data={"sub": user.student_id})

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
    access_token = create_access_token(data={"sub": current_user.student_id})
    refresh_token = create_refresh_token(data={"sub": current_user.student_id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": format_user_dict(current_user),
    }


@router.get("/department-codes")
def get_department_codes():
    """Return the mapping of department codes to department names."""
    return DEPARTMENT_CODES
