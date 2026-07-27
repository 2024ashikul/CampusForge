import json
import re

from fastapi import APIRouter, Depends, HTTPException, status

from auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from database import get_db
from models import DEPARTMENT_CODES, derive_department
from schemas import LoginRequest, Token, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
STUDENT_ID_PATTERN = re.compile("^\\d{7}$")


def format_user_dict(user, db):
    skills = db.all(
        "SELECT skill, skill_level FROM skills WHERE user_id = ? ORDER BY skill", (user.student_id,)
    )
    try:
        socials = json.loads(user.socials) if user.socials else None
    except (TypeError, json.JSONDecodeError):
        socials = None
    return {
        "student_id": user.student_id,
        "name": user.name,
        "email": user.email,
        "department": derive_department(user.student_id),
        "profile_pic": user.profile_pic,
        "bio": user.bio,
        "created_at": user.created_at,
        "skills": [{"name": s.skill, "level": s.skill_level} for s in skills],
        "socials": socials,
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db=Depends(get_db)):
    if not STUDENT_ID_PATTERN.match(user_in.student_id):
        raise HTTPException(400, "student_id must be exactly 7 digits (format YYPPNNN)")
    if db.one("SELECT 1 FROM user WHERE student_id = ?", (user_in.student_id,)):
        raise HTTPException(400, f"Student ID {user_in.student_id} is already registered")
    if db.one("SELECT 1 FROM user WHERE email = ?", (user_in.email,)):
        raise HTTPException(400, "User with this email already exists")
    db.execute(
        "INSERT INTO user (student_id, name, email, password, profile_pic, bio, socials) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            user_in.student_id,
            user_in.name,
            user_in.email,
            get_password_hash(user_in.password),
            user_in.profile_pic,
            user_in.bio,
            json.dumps(user_in.socials) if user_in.socials else None,
        ),
    )
    for skill in user_in.skills or []:
        db.execute(
            "INSERT INTO skills (user_id, skill, skill_level) VALUES (?, ?, ?)",
            (user_in.student_id, skill.name.strip(), skill.level),
        )
    db.commit()
    return format_user_dict(
        db.one("SELECT * FROM user WHERE student_id = ?", (user_in.student_id,)), db
    )


@router.post("/login", response_model=Token)
def login(form_data: LoginRequest, db=Depends(get_db)):
    user = db.one(
        "SELECT * FROM user WHERE student_id = ? AND email = ?",
        (form_data.student_id, form_data.email),
    )
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(401, "Incorrect Student ID, Email, or Password")
    return {
        "access_token": create_access_token({"sub": user.student_id}),
        "token_type": "bearer",
        "user": format_user_dict(user, db),
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user), db=Depends(get_db)):
    return format_user_dict(current_user, db)


@router.post("/refresh", response_model=Token)
def refresh_token(current_user=Depends(get_current_user), db=Depends(get_db)):
    return {
        "access_token": create_access_token({"sub": current_user.student_id}),
        "token_type": "bearer",
        "user": format_user_dict(current_user, db),
    }


@router.get("/department-codes")
def get_department_codes():
    return DEPARTMENT_CODES
