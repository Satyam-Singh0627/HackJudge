from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, HttpUrl

class WebhookCreate(BaseModel):
    event_id: str
    target_url: str
    events_subscribed: List[str] # e.g. ["score.submitted", "team.created"]

class WebhookOut(BaseModel):
    id: str
    event_id: str
    target_url: str
    secret_token: str
    events_subscribed: str # JSON string
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
