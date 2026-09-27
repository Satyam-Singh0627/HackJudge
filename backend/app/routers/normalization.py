from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.event import Event
from app.models.judging import ScoreNormalization
from app.models.project import Project
from app.schemas.judging import NormalizationOut, RankComparisonOut
from app.auth.dependencies import get_current_user
from app.permissions.role_checker import require_organizer
from app.services.normalization_service import run_score_normalization, get_normalization_comparison

router = APIRouter(prefix="/normalization", tags=["Normalization"])

@router.post("/{event_id}/run", response_model=List[NormalizationOut])
def trigger_normalization(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    records = run_score_normalization(db, event_id, current_user.id)
    out_list = []
    for r in records:
        proj = db.query(Project).filter(Project.id == r.project_id).first()
        out_list.append(NormalizationOut(
            id=r.id,
            event_id=r.event_id,
            project_id=r.project_id,
            project_title=proj.title if proj else "Unknown",
            track_name=proj.track.name if proj and proj.track else None,
            evaluations_count=r.evaluations_count,
            raw_average_score=r.raw_average_score,
            normalized_z_score=r.normalized_z_score,
            normalized_final_score=r.normalized_final_score,
            raw_rank=r.raw_rank,
            normalized_rank=r.normalized_rank,
            computed_at=r.computed_at
        ))
    return out_list

@router.get("/{event_id}/results", response_model=List[NormalizationOut])
def get_normalization_results(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # During active judging before results are published, only organizers/admins can view rankings
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    is_staff = current_user.role in ("ORGANIZER", "ADMIN")
    is_results_published = event.get_derived_status() == "RESULTS"

    if not is_staff and not is_results_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Official results and rankings are kept private until published."
        )

    records = (
        db.query(ScoreNormalization)
        .filter(ScoreNormalization.event_id == event_id)
        .order_by(ScoreNormalization.normalized_rank.asc())
        .all()
    )

    out_list = []
    for r in records:
        proj = db.query(Project).filter(Project.id == r.project_id).first()
        out_list.append(NormalizationOut(
            id=r.id,
            event_id=r.event_id,
            project_id=r.project_id,
            project_title=proj.title if proj else "Unknown",
            track_name=proj.track.name if proj and proj.track else None,
            evaluations_count=r.evaluations_count,
            raw_average_score=r.raw_average_score,
            normalized_z_score=r.normalized_z_score,
            normalized_final_score=r.normalized_final_score,
            raw_rank=r.raw_rank,
            normalized_rank=r.normalized_rank,
            computed_at=r.computed_at
        ))
    return out_list

@router.get("/{event_id}/comparison", response_model=List[RankComparisonOut])
def get_comparison(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    """Organizer view: side-by-side comparison of Raw Rank vs Normalized Rank."""
    return get_normalization_comparison(db, event_id)
