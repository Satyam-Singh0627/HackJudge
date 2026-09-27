from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class VoteCreate(BaseModel):
    project_id: str

class VoteOut(BaseModel):
    id: str
    event_id: str
    project_id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    project_id: str
    content: str

class CommentOut(BaseModel):
    id: str
    project_id: str
    user_id: str
    username: Optional[str] = None
    content: str
    is_moderated: bool
    created_at: datetime

    class Config:
        from_attributes = True

class VotingStatsOut(BaseModel):
    event_id: str
    total_votes: int
    user_votes_cast: int
    user_votes_remaining: int
    voting_enabled: bool
    live_results_hidden: bool
