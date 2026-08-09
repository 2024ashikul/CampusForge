from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_optional_current_user
from database import get_db
from models import derive_department
from schemas import SkillStudentResponse, SkillSummary

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get("", response_model=List[SkillSummary])
def list_skills(db=Depends(get_db), current_user=Depends(get_optional_current_user)):
    return [
        {"skill": r.skill, "student_count": r.student_count}
        for r in db.all(
            "SELECT skill, COUNT(*) AS student_count FROM skills GROUP BY skill ORDER BY LOWER(skill)"
        )
    ]


@router.get("/{skill_name}", response_model=List[SkillStudentResponse])
def students_by_skill(
    skill_name: str, db=Depends(get_db), current_user=Depends(get_optional_current_user)
):
    rows = db.all(
        "SELECT u.student_id, u.name, u.email, u.profile_pic, u.bio, s.skill, s.skill_level FROM skills s JOIN user u ON u.student_id = s.user_id WHERE LOWER(s.skill) = LOWER(?) ORDER BY s.skill_level DESC, u.name",
        (skill_name.strip(),),
    )
    if not rows:
        raise HTTPException(404, "Skill not found")
    return [{**r.__dict__, "department": derive_department(r.student_id)} for r in rows]
