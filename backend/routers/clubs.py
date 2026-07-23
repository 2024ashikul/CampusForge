import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import ClubModel, ClubMemberModel, UserModel
from schemas import ClubCreate, ClubResponse, ClubJoinRequest, ClubUpdate, ClubMemberUpdate
from auth import get_current_user, get_optional_current_user

router = APIRouter(prefix="/clubs", tags=["Clubs"])


def check_is_club_admin(club: ClubModel, user_id: int, db: Session) -> bool:
    if not user_id:
        return False
    # Check if lead name matches user name or if member entry has Admin/Lead role
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user and club.lead_name and user.name.lower() == club.lead_name.lower():
        return True

    member = db.query(ClubMemberModel).filter(
        ClubMemberModel.club_id == club.id,
        ClubMemberModel.user_id == user_id
    ).first()
    if member and member.role and member.role.lower() in ["admin", "lead", "leader", "president", "director"]:
        return True
    return False


def format_club_response(club: ClubModel, current_user_id: Optional[int] = None, db: Session = None) -> ClubResponse:
    parsed_tags = []
    if club.tags:
        try:
            parsed_tags = json.loads(club.tags) if club.tags.startswith('[') else [t.strip() for t in club.tags.split(',')]
        except Exception:
            parsed_tags = []

    member_count = db.query(ClubMemberModel).filter(ClubMemberModel.club_id == club.id).count() if db else len(club.members)
    
    is_joined = False
    user_role = "EXTERNAL"
    member_role = None
    member_status = None

    if current_user_id and db:
        joined_entry = db.query(ClubMemberModel).filter(
            ClubMemberModel.club_id == club.id,
            ClubMemberModel.user_id == current_user_id
        ).first()

        if check_is_club_admin(club, current_user_id, db):
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
        category=club.category or "technical",
        is_recruiting=club.is_recruiting if club.is_recruiting is not None else 1,
        join_format=club.join_format or "open",
        membership_fee=club.membership_fee or "free",
        lead_name=club.lead_name or "Club Lead",
        tags=parsed_tags,
        base_department=club.base_department or "Engineering",
        image_url=club.image_url,
        created_at=club.created_at,
        member_count=member_count,
        is_joined=is_joined,
        user_role=user_role,
        member_role=member_role,
        member_status=member_status,
    )


@router.get("", response_model=List[ClubResponse])
def get_all_clubs(db: Session = Depends(get_db), current_user: Optional[UserModel] = Depends(get_optional_current_user)):
    clubs = db.query(ClubModel).all()
    user_id = current_user.id if current_user else None
    return [format_club_response(c, current_user_id=user_id, db=db) for c in clubs]


@router.get("/{club_id}", response_model=ClubResponse)
def get_club_by_id(club_id: int, db: Session = Depends(get_db), current_user: Optional[UserModel] = Depends(get_optional_current_user)):
    club = db.query(ClubModel).filter(ClubModel.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    user_id = current_user.id if current_user else None
    return format_club_response(club, current_user_id=user_id, db=db)


@router.post("", response_model=ClubResponse, status_code=status.HTTP_201_CREATED)
def create_club(club_in: ClubCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    tags_str = json.dumps(club_in.tags) if club_in.tags is not None else None
    new_club = ClubModel(
        title=club_in.title,
        description=club_in.description,
        category=club_in.category,
        is_recruiting=club_in.is_recruiting,
        join_format=club_in.join_format,
        membership_fee=club_in.membership_fee,
        lead_name=current_user.name,
        tags=tags_str,
        base_department=club_in.base_department,
        image_url=club_in.image_url,
    )
    db.add(new_club)
    db.commit()
    db.refresh(new_club)

    # Auto add creator as Lead Admin
    membership = ClubMemberModel(
        club_id=new_club.id,
        user_id=current_user.id,
        role="Admin",
        status="approved",
        payment_status="free"
    )
    db.add(membership)
    db.commit()

    return format_club_response(new_club, current_user_id=current_user.id, db=db)


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
    
    if not check_is_club_admin(club, current_user.id, db):
        raise HTTPException(status_code=403, detail="Admin permissions required to modify club settings")

    if updates.title is not None:
        club.title = updates.title
    if updates.description is not None:
        club.description = updates.description
    if updates.category is not None:
        club.category = updates.category
    if updates.is_recruiting is not None:
        club.is_recruiting = updates.is_recruiting
    if updates.join_format is not None:
        club.join_format = updates.join_format
    if updates.membership_fee is not None:
        club.membership_fee = updates.membership_fee
    if updates.lead_name is not None:
        club.lead_name = updates.lead_name
    if updates.base_department is not None:
        club.base_department = updates.base_department
    if updates.tags is not None:
        club.tags = json.dumps(updates.tags)

    db.commit()
    db.refresh(club)
    return format_club_response(club, current_user_id=current_user.id, db=db)


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
        ClubMemberModel.user_id == current_user.id
    ).first()

    if existing:
        return {"detail": "Already a member of this club", "is_joined": True}

    # If join format requires interview/portfolio review, set status to pending, else approved
    init_status = "approved" if club.join_format == "open" else "pending"

    membership = ClubMemberModel(
        club_id=club_id,
        user_id=current_user.id,
        role="Member",
        status=init_status,
        payment_status="completed" if club.membership_fee != "free" else "free",
        payment_method=req.payment_method if club.membership_fee != "free" else None
    )
    db.add(membership)
    db.commit()

    return {
        "detail": f"Successfully requested to join {club.title}!",
        "is_joined": True,
        "status": init_status,
        "payment_status": membership.payment_status,
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
            "department": u.department if u else "",
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

    if not check_is_club_admin(club, current_user.id, db):
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
    return {"detail": "Member updated successfully", "member_id": member.id, "role": member.role, "status": member.status}
