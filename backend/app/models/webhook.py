import uuid
import secrets
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    target_url = Column(String(500), nullable=False)
    secret_token = Column(String(64), default=lambda: secrets.token_hex(20), nullable=False)
    events_subscribed = Column(Text, nullable=False) # JSON list of events e.g. ["score.submitted", "team.created"]
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    event = relationship("Event")
