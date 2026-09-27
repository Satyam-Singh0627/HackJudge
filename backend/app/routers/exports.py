from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.permissions.role_checker import require_organizer
from app.services.export_service import (
    export_participants_csv, export_teams_csv, export_submissions_csv,
    export_scores_csv, export_normalized_rankings_csv, export_audit_logs_csv
)

router = APIRouter(prefix="/exports", tags=["Exports"])

def csv_response(content: str, filename: str) -> Response:
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/participants/{event_id}")
def export_participants(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    csv_data = export_participants_csv(db, event_id)
    return csv_response(csv_data, f"participants_{event_id}.csv")

@router.get("/teams/{event_id}")
def export_teams(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    csv_data = export_teams_csv(db, event_id)
    return csv_response(csv_data, f"teams_{event_id}.csv")

@router.get("/submissions/{event_id}")
def export_submissions(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    csv_data = export_submissions_csv(db, event_id)
    return csv_response(csv_data, f"submissions_{event_id}.csv")

@router.get("/scores/{event_id}")
def export_scores(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    csv_data = export_scores_csv(db, event_id)
    return csv_response(csv_data, f"scores_{event_id}.csv")

@router.get("/rankings/{event_id}")
def export_rankings(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    csv_data = export_normalized_rankings_csv(db, event_id)
    return csv_response(csv_data, f"rankings_{event_id}.csv")

@router.get("/audit")
def export_audit(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    csv_data = export_audit_logs_csv(db)
    return csv_response(csv_data, "audit_logs.csv")
