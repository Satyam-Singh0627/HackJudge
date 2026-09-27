import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class SubmissionStatus(str):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    LOCKED = "LOCKED"
    UNDER_REVIEW = "UNDER_REVIEW"
    FINALIZED = "FINALIZED"

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), unique=True, nullable=False)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    track_id = Column(String(36), ForeignKey("tracks.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(255), nullable=False)
    tagline = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    github_url = Column(String(500), nullable=True)
    demo_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    technologies = Column(Text, nullable=True) # JSON list or comma-separated tags
    logo_url = Column(String(500), nullable=True)
    is_published = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    team = relationship("Team", back_populates="project")
    event = relationship("Event")
    track = relationship("Track")
    submission = relationship("Submission", back_populates="project", uselist=False, cascade="all, delete-orphan")
    judge_assignments = relationship("JudgeAssignment", back_populates="project", cascade="all, delete-orphan")
    scores = relationship("JudgeScore", back_populates="project", cascade="all, delete-orphan")
    votes = relationship("CommunityVote", back_populates="project", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="project", cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False)
    status = Column(String(50), default=SubmissionStatus.DRAFT, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    project = relationship("Project", back_populates="submission")
    versions = relationship("SubmissionVersion", back_populates="submission", cascade="all, delete-orphan")

class SubmissionVersion(Base):
    __tablename__ = "submission_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    payload_snapshot = Column(Text, nullable=False) # JSON serialization of snapshot
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    submission = relationship("Submission", back_populates="versions")
