from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.webhook import Webhook
from app.schemas.webhook import WebhookCreate, WebhookOut
from app.permissions.role_checker import require_organizer
from app.services.webhook_service import register_webhook

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("", response_model=WebhookOut, status_code=status.HTTP_201_CREATED)
def create_webhook(
    wh_in: WebhookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    wh = register_webhook(db, wh_in.event_id, wh_in.target_url, wh_in.events_subscribed)
    return wh

@router.get("/{event_id}", response_model=List[WebhookOut])
def list_event_webhooks(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    return db.query(Webhook).filter(Webhook.event_id == event_id).all()
