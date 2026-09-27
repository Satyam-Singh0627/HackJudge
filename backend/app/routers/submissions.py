from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Submission, SubmissionVersion
from app.schemas.project import SubmissionOut, SubmissionVersionOut
from app.auth.dependencies import get_current_user
from app.services.submission_service import finalize_submission

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.post("/{project_id}/finalize", response_model=SubmissionOut)
def finalize_project_submission(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return finalize_submission(db, project_id, current_user)

@router.get("/{submission_id}/versions", response_model=List[SubmissionVersionOut])
def get_submission_versions(
    submission_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return submission.versions
