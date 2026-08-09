import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user, get_optional_current_user
from database import Database, get_db
from models import derive_department
from schemas import (
    ClubCreate,
    ClubDetails,
    ClubJoinRequest,
    ClubMemberUpdate,
    ClubResponse,
    ClubSettings,
    ClubUpdate,
)

router = APIRouter(prefix="/clubs", tags=["Clubs"])


def _parse(value, model):
    try:
        return model(**json.loads(value)) if value else model()
    except (TypeError, json.JSONDecodeError):
        return model()


def _details(club):
    return _parse(club.details, ClubDetails)


def _settings(club):
    return _parse(club.settings, ClubSettings)


def check_is_club_admin(club, student_id, db):
    if not student_id:
        return False
    user = db.one("SELECT name FROM user WHERE student_id = ?", (student_id,))
    if (
        user
        and _details(club).lead_name
        and (user.name.lower() == _details(club).lead_name.lower())
    ):
        return True
    return bool(
        db.one(
            "SELECT 1 FROM club_members WHERE club_id = ? AND user_id = ? AND LOWER(role) IN ('admin','lead','leader','president','director')",
            (club.id, student_id),
        )
    )


def format_club_response(club, current_user_student_id=None, db: Database | None = None):
    if db is None:
        raise ValueError("A database connection is required to format a club response.")
    member = (
        db.one(
            "SELECT * FROM club_members WHERE club_id = ? AND user_id = ?",
            (club.id, current_user_student_id),
        )
        if current_user_student_id
        else None
    )
    is_admin = bool(
        current_user_student_id and check_is_club_admin(club, current_user_student_id, db)
    )
    member_count = db.one("SELECT COUNT(*) AS count FROM club_members WHERE club_id = ?", (club.id,))
    event_count = db.one("SELECT COUNT(*) AS count FROM events WHERE club_id = ?", (club.id,))
    return {
        "id": club.id,
        "title": club.title,
        "description": club.description,
        "details": _details(club),
        "settings": _settings(club),
        "created_at": club.created_at,
        "member_count": member_count.count if member_count else 0,
        "event_count": event_count.count if event_count else 0,
        "is_joined": bool(member or is_admin),
        "user_role": (
            "ADMIN"
            if is_admin
            else "ENROLLED" if member and member.status == "approved" else "EXTERNAL"
        ),
        "member_role": member.role if member else "Admin" if is_admin else None,
        "member_status": member.status if member else "approved" if is_admin else None,
    }


def _club(db, cid):
    return db.one("SELECT * FROM club WHERE id = ?", (cid,))


@router.get("", response_model=List[ClubResponse])
def get_all_clubs(db=Depends(get_db), current_user=Depends(get_optional_current_user)):
    return [
        format_club_response(c, current_user.student_id if current_user else None, db)
        for c in db.all("SELECT * FROM club ORDER BY created_at DESC")
    ]


@router.get("/{club_id}", response_model=ClubResponse)
def get_club_by_id(
    club_id: int, db=Depends(get_db), current_user=Depends(get_optional_current_user)
):
    club = _club(db, club_id)
    if not club:
        raise HTTPException(404, "Club not found")
    return format_club_response(club, current_user.student_id if current_user else None, db)


@router.post("", response_model=ClubResponse, status_code=status.HTTP_201_CREATED)
def create_club(club_in: ClubCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    details, settings = (club_in.details or ClubDetails(), club_in.settings or ClubSettings())
    details.lead_name = current_user.name
    cursor = db.execute(
        "INSERT INTO club (title, description, details, settings) VALUES (?, ?, ?, ?)",
        (
            club_in.title,
            club_in.description,
            json.dumps(details.model_dump()),
            json.dumps(settings.model_dump()),
        ),
    )
    cid = cursor.lastrowid
    db.execute(
        "INSERT INTO club_members (club_id, user_id, role, status) VALUES (?, ?, 'Admin', 'approved')",
        (cid, current_user.student_id),
    )
    db.commit()
    return format_club_response(_club(db, cid), current_user.student_id, db)


@router.patch("/{club_id}", response_model=ClubResponse)
def update_club(
    club_id: int, updates: ClubUpdate, db=Depends(get_db), current_user=Depends(get_current_user)
):
    club = _club(db, club_id)
    if not club:
        raise HTTPException(404, "Club not found")
    if not check_is_club_admin(club, current_user.student_id, db):
        raise HTTPException(403, "Admin permissions required to modify club settings")
    fields = {"title": updates.title, "description": updates.description}
    if updates.details is not None:
        data = _details(club).model_dump()
        data.update({k: v for k, v in updates.details.model_dump().items() if v is not None})
        fields["details"] = json.dumps(data)
    if updates.settings is not None:
        data = _settings(club).model_dump()
        data.update({k: v for k, v in updates.settings.model_dump().items() if v is not None})
        fields["settings"] = json.dumps(data)
    fields = [(k, v) for k, v in fields.items() if v is not None]
    if fields:
        db.execute(
            "UPDATE club SET " + ", ".join((f"{k} = ?" for k, _ in fields)) + " WHERE id = ?",
            tuple((v for _, v in fields)) + (club_id,),
        )
        db.commit()
    return format_club_response(_club(db, club_id), current_user.student_id, db)


@router.post("/{club_id}/join")
def join_club(
    club_id: int, req: ClubJoinRequest, db=Depends(get_db), current_user=Depends(get_current_user)
):
    club = _club(db, club_id)
    if not club:
        raise HTTPException(404, "Club not found")
    if db.one(
        "SELECT 1 FROM club_members WHERE club_id = ? AND user_id = ?",
        (club_id, current_user.student_id),
    ):
        return {"detail": "Already a member of this club", "is_joined": True}
    init_status = "approved" if _settings(club).join_format == "open" else "pending"
    db.execute(
        "INSERT INTO club_members (club_id,user_id,role,status) VALUES (?,?,'Member',?)",
        (club_id, current_user.student_id, init_status),
    )
    db.commit()
    return {
        "detail": f"Successfully requested to join {club.title}!",
        "is_joined": True,
        "status": init_status,
    }


@router.get("/{club_id}/members")
def get_club_members(club_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    if not _club(db, club_id):
        raise HTTPException(404, "Club not found")
    rows = db.all(
        "SELECT m.*,u.name,u.email,u.profile_pic FROM club_members m LEFT JOIN user u ON u.student_id=m.user_id WHERE m.club_id=?",
        (club_id,),
    )
    return [
        {**r.__dict__, "student_id": r.user_id, "department": derive_department(r.user_id)}
        for r in rows
    ]


@router.patch("/{club_id}/members/{user_id}")
def update_club_member(
    club_id: int,
    user_id: str,
    updates: ClubMemberUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    club = _club(db, club_id)
    if not club:
        raise HTTPException(404, "Club not found")
    if not check_is_club_admin(club, current_user.student_id, db):
        raise HTTPException(403, "Admin permissions required to modify member roles")
    member = db.one("SELECT * FROM club_members WHERE club_id=? AND user_id=?", (club_id, user_id))
    if not member:
        raise HTTPException(404, "Member record not found")
    removing_admin_access = (
        (updates.status is not None and updates.status != "approved")
        or (updates.role is not None and updates.role.lower() not in {"admin", "lead", "leader", "president", "director"})
    )
    if removing_admin_access and check_is_club_admin(club, member.user_id, db):
        other_admin = db.one(
            "SELECT 1 FROM club_members WHERE club_id=? AND user_id!=? AND status='approved' AND LOWER(role) IN ('admin','lead','leader','president','director')",
            (club_id, member.user_id),
        )
        if not other_admin:
            raise HTTPException(400, "Assign another club admin before removing the last admin")
    fields = [
        (k, v) for k, v in [("role", updates.role), ("status", updates.status)] if v is not None
    ]
    if fields:
        db.execute(
            "UPDATE club_members SET " + ", ".join((f"{k} = ?" for k, _ in fields)) + " WHERE club_id=? AND user_id=?",
            tuple((v for _, v in fields)) + (club_id, user_id),
        )
        db.commit()
    member = db.one("SELECT * FROM club_members WHERE club_id=? AND user_id=?", (club_id, user_id))
    return {
        "detail": "Member updated successfully",
        "user_id": member.user_id,
        "role": member.role,
        "status": member.status,
    }


@router.delete("/{club_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_club(club_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    club = _club(db, club_id)
    if not club:
        raise HTTPException(404, "Club not found")
    if not check_is_club_admin(club, current_user.student_id, db):
        raise HTTPException(403, "Admin permissions required to delete a club")
    db.execute("DELETE FROM club WHERE id=?", (club_id,))
    db.commit()
