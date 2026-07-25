from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import SkillModel, UserModel, derive_department
from auth import get_optional_current_user
from schemas import SkillSummary, SkillStudentResponse

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get("", response_model=List[SkillSummary])
def list_skills(db: Session = Depends(get_db), current_user: Optional[UserModel] = Depends(get_optional_current_user)):
    rows = (
        db.query(SkillModel.skill, func.count().label("student_count"))
        .group_by(SkillModel.skill)
        .order_by(func.lower(SkillModel.skill))
        .all()
    )
    return [{"skill": skill, "student_count": count} for skill, count in rows]


@router.get("/{skill_name}", response_model=List[SkillStudentResponse])
def students_by_skill(skill_name: str, db: Session = Depends(get_db), current_user: Optional[UserModel] = Depends(get_optional_current_user)):
    rows = (
        db.query(SkillModel, UserModel)
        .join(UserModel, SkillModel.user_id == UserModel.student_id)
        .filter(func.lower(SkillModel.skill) == skill_name.strip().lower())
        .order_by(SkillModel.skill_level.desc(), UserModel.name)
        .all()
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Skill not found")
    return [{
        "student_id": user.student_id,
        "name": user.name,
        "email": user.email,
        "department": derive_department(user.student_id),
        "profile_pic": user.profile_pic,
        "bio": user.bio,
        "skill": entry.skill,
        "skill_level": entry.skill_level,
    } for entry, user in rows]
