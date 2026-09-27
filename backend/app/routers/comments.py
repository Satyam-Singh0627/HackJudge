from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.voting import Comment
from app.schemas.voting import CommentCreate, CommentOut
from app.auth.dependencies import get_current_user
from app.services.voting_service import add_comment
from app.audit.audit_service import log_audit_event

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.post("", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def post_comment(
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = add_comment(db, comment_in, current_user)
    return CommentOut(
        id=comment.id,
        project_id=comment.project_id,
        user_id=comment.user_id,
        username=current_user.username,
        content=comment.content,
        is_moderated=comment.is_moderated,
        created_at=comment.created_at
    )

@router.get("/project/{project_id}", response_model=List[CommentOut])
def get_project_comments(project_id: str, db: Session = Depends(get_db)):
    comments = (
        db.query(Comment)
        .filter(Comment.project_id == project_id, Comment.is_moderated == False)
        .order_by(Comment.created_at.desc())
        .all()
    )
    return [
        CommentOut(
            id=c.id,
            project_id=c.project_id,
            user_id=c.user_id,
            username=c.user.username if c.user else "Anonymous",
            content=c.content,
            is_moderated=c.is_moderated,
            created_at=c.created_at
        )
        for c in comments
    ]

@router.delete("/{comment_id}", status_code=status.HTTP_200_OK)
def delete_comment(
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Comment).filter(Comment.id == comment_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    if c.user_id != current_user.id and current_user.role not in ("ORGANIZER", "ADMIN"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

    db.delete(c)
    db.commit()
    log_audit_event(db, "COMMENT_DELETED", "comment", comment_id, current_user.id)
    return {"success": True, "message": "Comment deleted"}
