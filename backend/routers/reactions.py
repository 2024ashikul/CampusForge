from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from database import get_db
from schemas import PostReactionCreate, PostReactionResponse

router = APIRouter(prefix="/posts/{post_id}/reactions", tags=["Reactions"])
VALID_REACTIONS = {"heart", "like", "fire", "clap"}


@router.get("", response_model=List[PostReactionResponse])
def get_reactions(post_id: int, db=Depends(get_db)):
    if not db.one("SELECT 1 FROM posts WHERE id = ?", (post_id,)):
        raise HTTPException(404, "Post not found")
    return [
        r.__dict__ for r in db.all("SELECT * FROM post_reactions WHERE post_id = ?", (post_id,))
    ]


@router.post("", response_model=PostReactionResponse, status_code=status.HTTP_201_CREATED)
def add_or_update_reaction(
    post_id: int,
    reaction_in: PostReactionCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if reaction_in.reaction_type not in VALID_REACTIONS:
        raise HTTPException(
            400, f"Invalid reaction_type. Must be one of: {', '.join(sorted(VALID_REACTIONS))}"
        )
    if not db.one("SELECT 1 FROM posts WHERE id = ?", (post_id,)):
        raise HTTPException(404, "Post not found")
    existing = db.one(
        "SELECT * FROM post_reactions WHERE post_id = ? AND user_id = ?",
        (post_id, current_user.student_id),
    )
    if existing and existing.reaction_type == reaction_in.reaction_type:
        db.execute("DELETE FROM post_reactions WHERE post_id = ? AND user_id = ?", (post_id, current_user.student_id))
        db.commit()
        raise HTTPException(204, "Reaction removed")
    if existing:
        db.execute(
            "UPDATE post_reactions SET reaction_type = ? WHERE post_id = ? AND user_id = ?",
            (reaction_in.reaction_type, post_id, current_user.student_id),
        )
        db.commit()
        return db.one("SELECT * FROM post_reactions WHERE post_id = ? AND user_id = ?", (post_id, current_user.student_id)).__dict__
    db.execute(
        "INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)",
        (post_id, current_user.student_id, reaction_in.reaction_type),
    )
    db.commit()
    return db.one("SELECT * FROM post_reactions WHERE post_id = ? AND user_id = ?", (post_id, current_user.student_id)).__dict__


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def remove_reaction(post_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    cursor = db.execute(
        "DELETE FROM post_reactions WHERE post_id = ? AND user_id = ?",
        (post_id, current_user.student_id),
    )
    if not cursor.rowcount:
        raise HTTPException(404, "No reaction found to remove")
    db.commit()
