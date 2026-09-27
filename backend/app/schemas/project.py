from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.team import TeamOut
from app.schemas.event import TrackOut

class SubmissionVersionOut(BaseModel):
    id: str
    version_number: int
    payload_snapshot: str
    created_at: datetime

    class Config:
        from_attributes = True

class SubmissionOut(BaseModel):
    id: str
    project_id: str
    status: str
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    versions: List[SubmissionVersionOut] = []

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    title: str
    tagline: Optional[str] = None
    description: str
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    video_url: Optional[str] = None
    technologies: Optional[str] = None # JSON string or comma-separated
    logo_url: Optional[str] = None

class ProjectCreate(ProjectBase):
    team_id: str
    event_id: str
    track_id: Optional[str] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    track_id: Optional[str] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    video_url: Optional[str] = None
    technologies: Optional[str] = None
    logo_url: Optional[str] = None
    is_published: Optional[bool] = None

class ProjectOut(ProjectBase):
    id: str
    team_id: str
    event_id: str
    track_id: Optional[str] = None
    is_published: bool
    created_at: datetime
    updated_at: datetime
    team: Optional[TeamOut] = None
    track: Optional[TrackOut] = None
    submission: Optional[SubmissionOut] = None

    class Config:
        from_attributes = True

class ProjectPublicOut(BaseModel):
    id: str
    event_id: str
    track_id: Optional[str] = None
    title: str
    tagline: Optional[str] = None
    description: str
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    video_url: Optional[str] = None
    technologies: Optional[str] = None
    logo_url: Optional[str] = None
    team_name: Optional[str] = None
    track_name: Optional[str] = None
    submission_status: Optional[str] = None
    votes_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
