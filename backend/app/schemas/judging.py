from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# Rubric Criteria Schemas
class CriterionBase(BaseModel):
    name: str
    description: Optional[str] = None
    weight: float = Field(..., gt=0.0, le=1.0) # e.g. 0.25 for 25%
    max_score: float = Field(default=10.0, gt=0.0)
    sort_order: int = 0
    is_active: bool = True

class CriterionCreate(CriterionBase):
    pass

class CriterionOut(CriterionBase):
    id: str
    rubric_id: str

    class Config:
        from_attributes = True

# Rubric Schemas
class RubricBase(BaseModel):
    name: str
    is_active: bool = True

class RubricCreate(RubricBase):
    event_id: str
    criteria: List[CriterionCreate]

class RubricUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class RubricOut(RubricBase):
    id: str
    event_id: str
    version: int
    created_at: datetime
    criteria: List[CriterionOut] = []

    class Config:
        from_attributes = True

# Judge Assignment Schemas
class AssignmentCreate(BaseModel):
    event_id: str
    judge_id: str
    project_id: str

class BatchAssignmentCreate(BaseModel):
    event_id: str
    judge_ids: List[str]
    project_ids: List[str]

class AlgorithmicAssignmentCreate(BaseModel):
    event_id: str
    judges_per_project: int = Field(default=3, ge=1)
    judge_ids: Optional[List[str]] = None # If null, all judges in system or registered
    project_ids: Optional[List[str]] = None # If null, all submitted projects in event

class AssignmentOut(BaseModel):
    id: str
    event_id: str
    judge_id: str
    project_id: str
    status: str
    assigned_at: datetime
    judge_name: Optional[str] = None
    project_title: Optional[str] = None
    is_scored: bool = False

    class Config:
        from_attributes = True

# Scoring Schemas
class CriterionScoreIn(BaseModel):
    criterion_id: str
    raw_score: float = Field(..., ge=0.0)

class ScoreSubmitRequest(BaseModel):
    assignment_id: str
    criterion_scores: List[CriterionScoreIn]
    feedback: Optional[str] = None
    finalize: bool = False

class CriterionScoreOut(BaseModel):
    id: str
    criterion_id: str
    criterion_name: Optional[str] = None
    raw_score: float
    max_score: float
    weight: float
    weighted_score: float

    class Config:
        from_attributes = True

class ScoreOut(BaseModel):
    id: str
    assignment_id: str
    judge_id: str
    project_id: str
    rubric_id: str
    raw_total_score: float
    weighted_total_score: float
    feedback: Optional[str] = None
    is_finalized: bool
    submitted_at: datetime
    updated_at: datetime
    criterion_scores: List[CriterionScoreOut] = []

    class Config:
        from_attributes = True

# Normalization & Comparison Schemas
class NormalizationOut(BaseModel):
    id: str
    event_id: str
    project_id: str
    project_title: str
    track_name: Optional[str] = None
    evaluations_count: int
    raw_average_score: float
    normalized_z_score: float
    normalized_final_score: float
    raw_rank: int
    normalized_rank: int
    computed_at: datetime

    class Config:
        from_attributes = True

class RankComparisonOut(BaseModel):
    project_id: str
    project_title: str
    track_name: Optional[str] = None
    evaluations_count: int
    raw_average: float
    raw_rank: int
    normalized_score: float
    normalized_rank: int
    rank_delta: int # raw_rank - normalized_rank (positive means normalization helped them move up)
