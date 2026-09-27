from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.judging import JudgeScore, JudgeAssignment
from app.schemas.judging import ScoreSubmitRequest, ScoreOut, CriterionScoreOut
from app.auth.dependencies import get_current_user
from app.permissions.role_checker import require_judge, require_organizer
from app.services.judging_service import submit_or_update_score

router = APIRouter(prefix="/scores", tags=["Scoring"])

def score_to_out(s: JudgeScore) -> ScoreOut:
    crit_outs = []
    for cs in s.criterion_scores:
        crit_outs.append(CriterionScoreOut(
            id=cs.id,
            criterion_id=cs.criterion_id,
            criterion_name=cs.criterion.name if cs.criterion else None,
            raw_score=cs.raw_score,
            max_score=cs.max_score,
            weight=cs.weight,
            weighted_score=cs.weighted_score
        ))
    return ScoreOut(
        id=s.id,
        assignment_id=s.assignment_id,
        judge_id=s.judge_id,
        project_id=s.project_id,
        rubric_id=s.rubric_id,
        raw_total_score=s.raw_total_score,
        weighted_total_score=s.weighted_total_score,
        feedback=s.feedback,
        is_finalized=s.is_finalized,
        submitted_at=s.submitted_at,
        updated_at=s.updated_at,
        criterion_scores=crit_outs
    )

@router.post("", response_model=ScoreOut)
def record_score(
    score_req: ScoreSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_judge)
):
    score = submit_or_update_score(db, score_req, current_user)
    return score_to_out(score)

@router.get("/assignment/{assignment_id}", response_model=Optional[ScoreOut])
def get_score_by_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(JudgeAssignment).filter(JudgeAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    # Only assigned judge or organizer/admin can view score
    if assignment.judge_id != current_user.id and current_user.role not in ("ORGANIZER", "ADMIN"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to view this evaluation")

    if not assignment.score:
        return None
    return score_to_out(assignment.score)

@router.get("/project/{project_id}", response_model=List[ScoreOut])
def get_scores_for_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    """Organizer view: inspect all evaluations received by a project."""
    scores = db.query(JudgeScore).filter(JudgeScore.project_id == project_id).all()
    return [score_to_out(s) for s in scores]
