from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.judging import JudgeAssignment, JudgeScore
from app.models.project import Project
from app.schemas.user import UserOut
from app.auth.dependencies import get_current_user
from app.permissions.role_checker import require_judge, require_organizer

router = APIRouter(prefix="/judges", tags=["Judges"])

@router.get("", response_model=List[UserOut])
def list_available_judges(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    judges = db.query(User).filter(
        User.role.in_([UserRole.JUDGE.value, UserRole.ADMIN.value]),
        User.is_active == True
    ).all()
    return judges

@router.get("/dashboard/{event_id}")
def get_judge_dashboard(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_judge)
):
    """
    Judge Dashboard: Shows ONLY assigned projects for the calling judge.
    Strict backend role isolation.
    """
    assignments = (
        db.query(JudgeAssignment)
        .filter(JudgeAssignment.event_id == event_id, JudgeAssignment.judge_id == current_user.id)
        .all()
    )

    total_assigned = len(assignments)
    completed = 0
    pending = 0
    projects_list = []

    for a in assignments:
        is_completed = a.status == "COMPLETED" or (a.score and a.score.is_finalized)
        if is_completed:
            completed += 1
        else:
            pending += 1

        project = a.project
        score_data = None
        if a.score:
            score_data = {
                "score_id": a.score.id,
                "raw_total": a.score.raw_total_score,
                "weighted_total": a.score.weighted_total_score,
                "feedback": a.score.feedback,
                "is_finalized": a.score.is_finalized,
                "submitted_at": a.score.submitted_at.isoformat() if a.score.submitted_at else None
            }

        projects_list.append({
            "assignment_id": a.id,
            "project_id": project.id,
            "title": project.title,
            "tagline": project.tagline,
            "description": project.description,
            "track_name": project.track.name if project.track else None,
            "github_url": project.github_url,
            "demo_url": project.demo_url,
            "video_url": project.video_url,
            "technologies": project.technologies,
            "assignment_status": a.status,
            "is_evaluated": a.score is not None,
            "is_finalized": a.score.is_finalized if a.score else False,
            "score": score_data
        })

    progress_pct = round((completed / total_assigned * 100), 1) if total_assigned > 0 else 0.0

    return {
        "event_id": event_id,
        "judge_id": current_user.id,
        "judge_name": current_user.full_name,
        "total_assigned": total_assigned,
        "completed": completed,
        "pending": pending,
        "progress_percentage": progress_pct,
        "assigned_projects": projects_list
    }
