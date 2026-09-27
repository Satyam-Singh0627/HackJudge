import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True) # e.g. SCORE_CREATED, TEAM_CREATED, VOTE_CAST
    resource_type = Column(String(100), nullable=False) # e.g. project, score, event, team
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True) # JSON details
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User")
