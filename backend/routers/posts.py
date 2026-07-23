import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import PostModel, UserModel, ClubModel
from schemas import PostCreate, PostResponse
from auth import get_current_user

router = APIRouter(prefix="/posts", tags=["Posts"])


def format_post_response(post: PostModel) -> PostResponse:
    author_name = "Anonymous"
    author_association = "STUDENT"

    if post.author_club:
        author_name = post.author_club.title
        author_association = "CLUB"
    elif post.author_user:
        author_name = post.author_user.name
        author_association = "STUDENT"

    parsed_tags = []
    if post.tags:
        try:
            parsed_tags = json.loads(post.tags) if post.tags.startswith('[') else [t.strip() for t in post.tags.split(',')]
        except Exception:
            parsed_tags = []

    parsed_attachments = []
    if post.attachments:
        try:
            parsed_attachments = json.loads(post.attachments)
        except Exception:
            parsed_attachments = []

    return PostResponse(
        id=post.id,
        title=post.title,
        description=post.description,
        post_type=post.post_type,
        status=post.status,
        user_id=post.user_id,
        club_id=post.club_id,
        tags=parsed_tags,
        attachments=parsed_attachments,
        created_at=post.created_at,
        author_name=author_name,
        author_association=author_association,
    )


@router.get("", response_model=List[PostResponse])
def list_posts(
    post_type: Optional[str] = Query(None, description="Filter by post_type"),
    club_id: Optional[int] = Query(None, description="Filter by club_id"),
    user_id: Optional[int] = Query(None, description="Filter by user_id"),
    status: Optional[str] = Query("published", description="Filter by status"),
    db: Session = Depends(get_db),
):
    query = db.query(PostModel)
    if post_type:
        query = query.filter(PostModel.post_type == post_type)
    if club_id:
        query = query.filter(PostModel.club_id == club_id)
    if user_id:
        query = query.filter(PostModel.user_id == user_id)
    if status:
        query = query.filter(PostModel.status == status)
    posts = query.order_by(PostModel.created_at.desc()).all()
    return [format_post_response(p) for p in posts]


@router.get("/{post_id}", response_model=PostResponse)
def get_post_by_id(post_id: int, db: Session = Depends(get_db)):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return format_post_response(post)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: PostCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if post_in.club_id:
        club = db.query(ClubModel).filter(ClubModel.id == post_in.club_id).first()
        if not club:
            raise HTTPException(status_code=400, detail="Associated club_id does not exist")

    tags_str = json.dumps(post_in.tags) if post_in.tags is not None else None
    attachments_str = json.dumps(post_in.attachments) if post_in.attachments is not None else None

    new_post = PostModel(
        title=post_in.title,
        description=post_in.description,
        post_type=post_in.post_type,
        status=post_in.status,
        user_id=current_user.id if not post_in.club_id else None,
        club_id=post_in.club_id,
        tags=tags_str,
        attachments=attachments_str,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return format_post_response(new_post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete another user's post")
    db.delete(post)
    db.commit()
    return None
