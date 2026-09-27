from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.judging import JudgeAssignment
from app.schemas.judging import (
    AssignmentCreate, BatchAssignmentCreate, AlgorithmicAssignmentCreate, AssignmentOut
)
from app.auth.dependencies import get_current_user
from app.permissions.role_checker import require_organizer
from app.services.judging_service import (
    assign_judge_manual, assign_judge_batch, assign_judge_algorithmic
)
from app.audit.audit_service import log_audit_event

router = APIRouter(prefix="/assignments", tags=["Judge Assignments"])

def assignment_to_out(a: JudgeAssignment) -> AssignmentOut:
    return AssignmentOut(
        id=a.id,
        event_id=a.event_id,
        judge_id=a.judge_id,
        project_id=a.project_id,
        status=a.status,
        assigned_at=a.assigned_at,
        judge_name=a.judge.full_name if a.judge else None,
        project_title=a.project.title if a.project else None,
        is_scored=a.score is not None
    )

@router.get("", response_model=List[AssignmentOut])
def list_assignments(
    event_id: str,
    judge_id: Optional[str] = None,
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(JudgeAssignment).filter(JudgeAssignment.event_id == event_id)
    # Judges can only see their own assignments unless organizer/admin
    if current_user.role not in ("ORGANIZER", "ADMIN"):
        query = query.filter(JudgeAssignment.judge_id == current_user.id)
    else:
        if judge_id:
            query = query.filter(JudgeAssignment.judge_id == judge_id)
        if project_id:
            query = query.filter(JudgeAssignment.project_id == project_id)
            
    assignments = query.all()
    return [assignment_to_out(a) for a in assignments]

@router.post("/manual", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_manual_assignment(
    assignment_in: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    a = assign_judge_manual(db, assignment_in, current_user.id)
    return assignment_to_out(a)

@router.post("/batch", response_model=List[AssignmentOut], status_code=status.HTTP_201_CREATED)
def create_batch_assignment(
    batch_in: BatchAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    assignments = assign_judge_batch(db, batch_in, current_user.id)
    return [assignment_to_out(a) for a in assignments]

@router.post("/algorithmic", response_model=List[AssignmentOut], status_code=status.HTTP_201_CREATED)
def create_algorithmic_assignment(
    algo_in: AlgorithmicAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    assignments = assign_judge_algorithmic(db, algo_in, current_user.id)
    return [assignment_to_out(a) for a in assignments]

@router.delete("/{assignment_id}", status_code=status.HTTP_200_OK)
def remove_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    a = db.query(JudgeAssignment).filter(JudgeAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    db.delete(a)
    db.commit()
    log_audit_event(db, "JUDGE_UNASSIGNED", "judge_assignment", assignment_id, current_user.id)
    return {"success": True, "message": "Assignment deleted"}
