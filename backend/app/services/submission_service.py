import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.project import Project, Submission, SubmissionVersion, SubmissionStatus
from app.models.team import Team, TeamMember
from app.models.event import Event
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.audit.audit_service import log_audit_event
from app.services.event_service import is_submission_open

def get_project(db: Session, project_id: str) -> Optional[Project]:
    return db.query(Project).filter(Project.id == project_id).first()

def get_team_project(db: Session, team_id: str) -> Optional[Project]:
    return db.query(Project).filter(Project.team_id == team_id).first()

def create_project(db: Session, project_in: ProjectCreate, user: User) -> Project:
    # Check team membership
    member = db.query(TeamMember).filter(
        TeamMember.team_id == project_in.team_id,
        TeamMember.user_id == user.id
    ).first()
    if not member and user.role not in ("ADMIN", "ORGANIZER"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Must be a member of the team to submit a project")

    # Check if team already has a project
    existing = get_team_project(db, project_in.team_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This team already has a project registered")

    # Check deadline
    event = db.query(Event).filter(Event.id == project_in.event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    if not is_submission_open(event) and user.role not in ("ADMIN", "ORGANIZER"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Submissions are currently closed for this event")

    project = Project(
        team_id=project_in.team_id,
        event_id=project_in.event_id,
        track_id=project_in.track_id,
        title=project_in.title,
        tagline=project_in.tagline,
        description=project_in.description,
        github_url=project_in.github_url,
        demo_url=project_in.demo_url,
        video_url=project_in.video_url,
        technologies=project_in.technologies,
        logo_url=project_in.logo_url,
        is_published=True
    )
    db.add(project)
    db.flush()

    submission = Submission(
        project_id=project.id,
        status=SubmissionStatus.DRAFT,
    )
    db.add(submission)
    db.commit()
    db.refresh(project)

    log_audit_event(
        db,
        action="PROJECT_CREATED",
        resource_type="project",
        resource_id=project.id,
        user_id=user.id,
        details={"title": project.title, "event_id": project.event_id}
    )
    return project

def update_project(db: Session, project_id: str, project_update: ProjectUpdate, user: User) -> Project:
    project = get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Verify authorization
    member = db.query(TeamMember).filter(
        TeamMember.team_id == project.team_id,
        TeamMember.user_id == user.id
    ).first()
    is_staff = user.role in ("ADMIN", "ORGANIZER")
    if not member and not is_staff:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this project")

    # Deadline enforcement
    event = db.query(Event).filter(Event.id == project.event_id).first()
    if not is_submission_open(event) and not is_staff:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Submission deadline has passed. Modifications are locked.")

    # Status enforcement
    if project.submission and project.submission.status in (SubmissionStatus.LOCKED, SubmissionStatus.FINALIZED) and not is_staff:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Submission is locked and cannot be edited")

    # Save a version snapshot before updating
    if project.submission:
        v_count = db.query(SubmissionVersion).filter(SubmissionVersion.submission_id == project.submission.id).count()
        snapshot_data = {
            "title": project.title,
            "description": project.description,
            "github_url": project.github_url,
            "demo_url": project.demo_url,
            "video_url": project.video_url,
            "technologies": project.technologies,
            "track_id": project.track_id
        }
        version = SubmissionVersion(
            submission_id=project.submission.id,
            version_number=v_count + 1,
            payload_snapshot=json.dumps(snapshot_data)
        )
        db.add(version)

    update_data = project_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(project, field, val)
    project.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(project)

    log_audit_event(
        db,
        action="SUBMISSION_UPDATED",
        resource_type="project",
        resource_id=project.id,
        user_id=user.id,
        details=list(update_data.keys())
    )
    return project

def finalize_submission(db: Session, project_id: str, user: User) -> Submission:
    project = get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    member = db.query(TeamMember).filter(
        TeamMember.team_id == project.team_id,
        TeamMember.user_id == user.id
    ).first()
    if not member and user.role not in ("ADMIN", "ORGANIZER"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to submit this project")

    event = db.query(Event).filter(Event.id == project.event_id).first()
    if not is_submission_open(event) and user.role not in ("ADMIN", "ORGANIZER"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Submission deadline has passed")

    submission = project.submission
    if not submission:
        submission = Submission(project_id=project.id)
        db.add(submission)

    submission.status = SubmissionStatus.SUBMITTED
    submission.submitted_at = datetime.now(timezone.utc)
    submission.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(submission)

    log_audit_event(
        db,
        action="SUBMISSION_FINALIZED",
        resource_type="submission",
        resource_id=submission.id,
        user_id=user.id,
        details={"project_id": project.id, "title": project.title}
    )
    return submission
