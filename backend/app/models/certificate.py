import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    recipient_name = Column(String(255), nullable=False)
    cert_type = Column(String(50), nullable=False) # PARTICIPANT, WINNER, JUDGE
    achievement = Column(String(255), nullable=False) # e.g. "1st Place Winner", "Distinguished Judge", "Participant"
    issue_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    verification_hash = Column(String(64), unique=True, index=True, nullable=False)

    event = relationship("Event")
    user = relationship("User")
    team = relationship("Team")
