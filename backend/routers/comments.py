from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user, get_optional_current_user
from database import get_db
from schemas import CommentCreate, CommentResponse

router = APIRouter(prefix="/posts/{post_id}/comments", tags=["Comments"])


def _format(comment, db):
    author = db.one("SELECT name, profile_pic FROM user WHERE student_id = ?", (comment.user_id,))
    return {
        **comment.__dict__,
        "author_name": author.name if author else "Unknown",
        "author_pic": author.profile_pic if author else None,
    }


@router.get("", response_model=List[CommentResponse])
def get_comments(post_id: int, db=Depends(get_db), current_user=Depends(get_optional_current_user)):
    if not db.one("SELECT 1 FROM posts WHERE id = ?", (post_id,)):
        raise HTTPException(404, "Post not found")
    return [
        _format(c, db)
        for c in db.all("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at", (post_id,))
    ]


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    comment_in: CommentCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not db.one("SELECT 1 FROM posts WHERE id = ?", (post_id,)):
        raise HTTPException(404, "Post not found")
    if comment_in.parent_id is not None:
        parent = db.one("SELECT * FROM comments WHERE id = ?", (comment_in.parent_id,))
        if not parent:
            raise HTTPException(404, "Parent comment not found")
        if parent.post_id != post_id:
            raise HTTPException(400, "Parent comment belongs to a different post")
        if parent.parent_id is not None:
            raise HTTPException(400, "Only 1 level of threading allowed — cannot reply to a reply")
    cursor = db.execute(
        "INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)",
        (post_id, current_user.student_id, comment_in.parent_id, comment_in.content),
    )
    db.commit()
    return _format(db.one("SELECT * FROM comments WHERE id = ?", (cursor.lastrowid,)), db)


@router.patch("/{comment_id}", response_model=CommentResponse)
def update_comment(
    post_id: int,
    comment_id: int,
    comment_in: CommentCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    comment = db.one("SELECT * FROM comments WHERE id = ? AND post_id = ?", (comment_id, post_id))
    if not comment:
        raise HTTPException(404, "Comment not found")
    if comment.user_id != current_user.student_id:
        raise HTTPException(403, "Cannot edit another user's comment")
    db.execute("UPDATE comments SET content = ? WHERE id = ?", (comment_in.content, comment_id))
    db.commit()
    return _format(db.one("SELECT * FROM comments WHERE id = ?", (comment_id,)), db)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    post_id: int, comment_id: int, db=Depends(get_db), current_user=Depends(get_current_user)
):
    comment = db.one("SELECT * FROM comments WHERE id = ? AND post_id = ?", (comment_id, post_id))
    if not comment:
        raise HTTPException(404, "Comment not found")
    if comment.user_id != current_user.student_id:
        raise HTTPException(403, "Cannot delete another user's comment")
    db.execute("DELETE FROM comments WHERE id = ?", (comment_id,))
    db.commit()
