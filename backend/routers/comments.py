from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import CommentModel, PostModel, UserModel
from schemas import CommentCreate, CommentResponse
from auth import get_current_user, get_optional_current_user

router = APIRouter(prefix="/posts/{post_id}/comments", tags=["Comments"])


def _format(comment: CommentModel) -> CommentResponse:
    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        parent_id=comment.parent_id,
        content=comment.content,
        created_at=comment.created_at,
        author_name=comment.author.name if comment.author else "Unknown",
        author_pic=comment.author.profile_pic if comment.author else None,
        replies=[],  # flat list — frontend assembles threads by parent_id
    )


@router.get("", response_model=List[CommentResponse])
def get_comments(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
):
    """Return all comments for a post, flat. Frontend groups by parent_id."""
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = (
        db.query(CommentModel)
        .filter(CommentModel.post_id == post_id)
        .order_by(CommentModel.created_at.asc())
        .all()
    )
    return [_format(c) for c in comments]


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if comment_in.parent_id is not None:
        parent = db.query(CommentModel).filter(CommentModel.id == comment_in.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")
        if parent.post_id != post_id:
            raise HTTPException(status_code=400, detail="Parent comment belongs to a different post")
        if parent.parent_id is not None:
            raise HTTPException(
                status_code=400,
                detail="Only 1 level of threading allowed — cannot reply to a reply"
            )

    comment = CommentModel(
        post_id=post_id,
        user_id=current_user.student_id,
        parent_id=comment_in.parent_id,
        content=comment_in.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _format(comment)


@router.patch("/{comment_id}", response_model=CommentResponse)
def update_comment(
    post_id: int,
    comment_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    comment = db.query(CommentModel).filter(
        CommentModel.id == comment_id,
        CommentModel.post_id == post_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.student_id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's comment")

    comment.content = comment_in.content
    db.commit()
    db.refresh(comment)
    return _format(comment)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    post_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    comment = db.query(CommentModel).filter(
        CommentModel.id == comment_id,
        CommentModel.post_id == post_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.student_id:
        raise HTTPException(status_code=403, detail="Cannot delete another user's comment")
    db.delete(comment)
    db.commit()
    return None
