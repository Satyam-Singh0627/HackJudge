from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.judging import Rubric
from app.schemas.judging import RubricCreate, RubricOut
from app.auth.dependencies import get_current_user
from app.permissions.role_checker import require_organizer
from app.services.judging_service import create_rubric, get_event_rubric

router = APIRouter(prefix="/rubrics", tags=["Rubrics"])

@router.post("", response_model=RubricOut, status_code=status.HTTP_201_CREATED)
def create_event_rubric(
    rubric_in: RubricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    return create_rubric(db, rubric_in, current_user.id)

@router.get("/{event_id}", response_model=RubricOut)
def get_rubric(event_id: str, db: Session = Depends(get_db)):
    rubric = get_event_rubric(db, event_id)
    if not rubric:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active rubric found for this event")
    return rubric
