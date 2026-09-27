from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class CertificateGenerateRequest(BaseModel):
    user_id: str
    event_id: str
    cert_type: str # PARTICIPANT, WINNER, JUDGE
    achievement: str # e.g. "1st Place - Overall Winner"

class CertificateOut(BaseModel):
    id: str
    event_id: str
    user_id: str
    team_id: Optional[str] = None
    recipient_name: str
    cert_type: str
    achievement: str
    issue_date: datetime
    verification_hash: str
    event_title: Optional[str] = None

    class Config:
        from_attributes = True

class CertificateVerifyOut(BaseModel):
    valid: bool
    certificate: Optional[CertificateOut] = None
    message: str
