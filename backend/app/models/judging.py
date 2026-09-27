import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Rubric(Base):
    __tablename__ = "rubrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    criteria = relationship("RubricCriterion", back_populates="rubric", cascade="all, delete-orphan", order_by="RubricCriterion.sort_order")

class RubricCriterion(Base):
    __tablename__ = "rubric_criteria"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rubric_id = Column(String(36), ForeignKey("rubrics.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    weight = Column(Float, nullable=False) # e.g. 0.25 for 25% or 25.0
    max_score = Column(Float, default=10.0, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    rubric = relationship("Rubric", back_populates="criteria")

class JudgeAssignment(Base):
    __tablename__ = "judge_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    judge_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, COMPLETED, EXCUSED
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    judge = relationship("User")
    project = relationship("Project", back_populates="judge_assignments")
    score = relationship("JudgeScore", back_populates="assignment", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("judge_id", "project_id", name="uq_judge_project_assignment"),
    )

class JudgeScore(Base):
    __tablename__ = "judge_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = Column(String(36), ForeignKey("judge_assignments.id", ondelete="CASCADE"), unique=True, nullable=False)
    judge_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    rubric_id = Column(String(36), ForeignKey("rubrics.id", ondelete="CASCADE"), nullable=False)

    raw_total_score = Column(Float, nullable=False) # Sum of raw scores or percentage
    weighted_total_score = Column(Float, nullable=False) # 0-100 weighted scale
    feedback = Column(Text, nullable=True)
    is_finalized = Column(Boolean, default=False, nullable=False)

    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    assignment = relationship("JudgeAssignment", back_populates="score")
    judge = relationship("User")
    project = relationship("Project", back_populates="scores")
    criterion_scores = relationship("CriterionScore", back_populates="judge_score", cascade="all, delete-orphan")

class CriterionScore(Base):
    __tablename__ = "criterion_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    score_id = Column(String(36), ForeignKey("judge_scores.id", ondelete="CASCADE"), nullable=False, index=True)
    criterion_id = Column(String(36), ForeignKey("rubric_criteria.id", ondelete="CASCADE"), nullable=False)

    raw_score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    weighted_score = Column(Float, nullable=False)

    judge_score = relationship("JudgeScore", back_populates="criterion_scores")
    criterion = relationship("RubricCriterion")

class ScoreNormalization(Base):
    __tablename__ = "score_normalizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)

    evaluations_count = Column(Integer, nullable=False)
    raw_average_score = Column(Float, nullable=False)
    normalized_z_score = Column(Float, nullable=False)
    normalized_final_score = Column(Float, nullable=False) # Rescaled 0-100
    raw_rank = Column(Integer, nullable=False)
    normalized_rank = Column(Integer, nullable=False)

    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    project = relationship("Project")

    __table_args__ = (
        UniqueConstraint("event_id", "project_id", name="uq_event_project_normalization"),
    )
