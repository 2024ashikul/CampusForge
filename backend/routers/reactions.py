from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import PostReactionModel, PostModel, UserModel
from schemas import PostReactionCreate, PostReactionResponse
from auth import get_current_user

router = APIRouter(prefix="/posts/{post_id}/reactions", tags=["Reactions"])

VALID_REACTIONS = {"heart", "like", "fire", "clap"}


@router.get("", response_model=List[PostReactionResponse])
def get_reactions(
    post_id: int,
    db: Session = Depends(get_db),
):
    """List all reactions for a post."""
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return db.query(PostReactionModel).filter(PostReactionModel.post_id == post_id).all()


@router.post("", response_model=PostReactionResponse, status_code=status.HTTP_201_CREATED)
def add_or_update_reaction(
    post_id: int,
    reaction_in: PostReactionCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Add a reaction to a post. If the user already reacted:
    - Same reaction_type → remove it (toggle off).
    - Different reaction_type → switch to new type.
    """
    if reaction_in.reaction_type not in VALID_REACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid reaction_type. Must be one of: {', '.join(sorted(VALID_REACTIONS))}"
        )

    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = db.query(PostReactionModel).filter(
        PostReactionModel.post_id == post_id,
        PostReactionModel.user_id == current_user.student_id
    ).first()

    if existing:
        if existing.reaction_type == reaction_in.reaction_type:
            # Toggle off — remove reaction
            db.delete(existing)
            db.commit()
            raise HTTPException(status_code=204, detail="Reaction removed")
        else:
            # Switch reaction type
            existing.reaction_type = reaction_in.reaction_type
            db.commit()
            db.refresh(existing)
            return existing

    reaction = PostReactionModel(
        post_id=post_id,
        user_id=current_user.student_id,
        reaction_type=reaction_in.reaction_type,
    )
    db.add(reaction)
    db.commit()
    db.refresh(reaction)
    return reaction


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def remove_reaction(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Explicitly remove current user's reaction from a post."""
    existing = db.query(PostReactionModel).filter(
        PostReactionModel.post_id == post_id,
        PostReactionModel.user_id == current_user.student_id
    ).first()
    if not existing:
        raise HTTPException(status_code=404, detail="No reaction found to remove")
    db.delete(existing)
    db.commit()
    return None
