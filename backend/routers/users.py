import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user, get_optional_current_user
from database import get_db
from models import derive_department
from routers.clubs import format_club_response
from routers.events import format_event_response
from schemas import ClubResponse, EventResponse, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


def format_user_dict(user, db):
    try:
        socials = json.loads(user.socials) if user.socials else None
    except (TypeError, json.JSONDecodeError):
        socials = None
    return {
        **user.__dict__,
        "department": derive_department(user.student_id),
        "skills": [
            {"name": r.skill, "level": r.skill_level}
            for r in db.all(
                "SELECT skill, skill_level FROM skills WHERE user_id = ? ORDER BY skill",
                (user.student_id,),
            )
        ],
        "socials": socials,
    }


@router.get("", response_model=List[UserResponse])
def get_all_users(db=Depends(get_db), current_user=Depends(get_optional_current_user)):
    return [format_user_dict(u, db) for u in db.all("SELECT * FROM user ORDER BY name")]


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: str, db=Depends(get_db), current_user=Depends(get_optional_current_user)
):
    user = db.one("SELECT * FROM user WHERE student_id = ?", (user_id,))
    if not user:
        raise HTTPException(404, "User not found")
    return format_user_dict(user, db)


@router.get("/{user_id}/clubs", response_model=List[ClubResponse])
def get_user_clubs(
    user_id: str, db=Depends(get_db), current_user=Depends(get_optional_current_user)
):
    return [
        format_club_response(c, user_id, db)
        for c in db.all(
            "SELECT c.* FROM club c JOIN club_members m ON m.club_id = c.id WHERE m.user_id = ?",
            (user_id,),
        )
    ]


@router.get("/{user_id}/events", response_model=List[EventResponse])
def get_user_events(
    user_id: str, db=Depends(get_db), current_user=Depends(get_optional_current_user)
):
    return [
        format_event_response(e, user_id, db)
        for e in db.all(
            "SELECT e.* FROM events e JOIN event_registrants r ON r.event_id = e.id WHERE r.user_id = ?",
            (user_id,),
        )
    ]


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str, updates: UserUpdate, db=Depends(get_db), current_user=Depends(get_current_user)
):
    if current_user.student_id != user_id:
        raise HTTPException(403, "You can only update your own profile")
    if not db.one("SELECT 1 FROM user WHERE student_id = ?", (user_id,)):
        raise HTTPException(404, "User not found")
    fields = [
        (k, v)
        for k, v in {
            "name": updates.name,
            "bio": updates.bio,
            "profile_pic": updates.profile_pic,
            "socials": json.dumps(updates.socials) if updates.socials is not None else None,
        }.items()
        if v is not None
    ]
    if fields:
        db.execute(
            "UPDATE user SET "
            + ", ".join((f"{key} = ?" for key, _ in fields))
            + " WHERE student_id = ?",
            tuple((v for _, v in fields)) + (user_id,),
        )
    if updates.skills is not None:
        db.execute("DELETE FROM skills WHERE user_id = ?", (user_id,))
        for skill in updates.skills:
            db.execute(
                "INSERT INTO skills (user_id, skill, skill_level) VALUES (?, ?, ?)",
                (user_id, skill.name.strip(), skill.level),
            )
    db.commit()
    return format_user_dict(db.one("SELECT * FROM user WHERE student_id = ?", (user_id,)), db)
