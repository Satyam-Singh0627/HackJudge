from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.user import User
from app.models.project import Project, Submission, SubmissionStatus
from app.models.team import TeamMember
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut, ProjectPublicOut
from app.auth.dependencies import get_current_user, get_current_user_optional
from app.services.submission_service import create_project, update_project, get_project
from app.services.voting_service import get_randomized_gallery_projects

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectOut])
def list_projects(event_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    if event_id:
        query = query.filter(Project.event_id == event_id)
    return query.all()

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_new_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_project(db, project_in, current_user)

@router.get("/gallery/{event_id}", response_model=List[ProjectPublicOut])
def get_public_gallery(
    event_id: str,
    q: Optional[str] = None,
    track_id: Optional[str] = None,
    tech: Optional[str] = None,
    seed: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Searchable public gallery.
    Excludes internal judging data and supports randomized presentation.
    """
    if seed:
        projects = get_randomized_gallery_projects(db, event_id, seed_token=seed)
    else:
        projects = (
            db.query(Project)
            .filter(Project.event_id == event_id, Project.is_published == True)
            .all()
        )

    results: List[ProjectPublicOut] = []
    q_lower = q.lower() if q else None
    tech_lower = tech.lower() if tech else None

    for p in projects:
        # Filter by track
        if track_id and p.track_id != track_id:
            continue
        
        # Filter by technology tag
        if tech_lower:
            p_tech = (p.technologies or "").lower()
            if tech_lower not in p_tech:
                continue

        # Filter by text search query
        if q_lower:
            haystack = f"{p.title} {p.tagline or ''} {p.description} {p.technologies or ''}".lower()
            if q_lower not in haystack:
                continue

        votes_count = len(p.votes) if p.votes else 0
        sub_status = p.submission.status if p.submission else "DRAFT"
        team_name = p.team.name if p.team else ""
        track_name = p.track.name if p.track else ""

        results.append(ProjectPublicOut(
            id=p.id,
            event_id=p.event_id,
            track_id=p.track_id,
            title=p.title,
            tagline=p.tagline,
            description=p.description,
            github_url=p.github_url,
            demo_url=p.demo_url,
            video_url=p.video_url,
            technologies=p.technologies,
            logo_url=p.logo_url,
            team_name=team_name,
            track_name=track_name,
            submission_status=sub_status,
            votes_count=votes_count,
            created_at=p.created_at
        ))

    return results

@router.get("/{project_id}", response_model=ProjectOut)
def get_project_by_id(project_id: str, db: Session = Depends(get_db)):
    project = get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project

@router.patch("/{project_id}", response_model=ProjectOut)
def update_project_by_id(
    project_id: str,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return update_project(db, project_id, project_update, current_user)
