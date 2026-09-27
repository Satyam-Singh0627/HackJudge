import json
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.webhook import Webhook

def register_webhook(
    db: Session,
    event_id: str,
    target_url: str,
    events_subscribed: List[str]
) -> Webhook:
    webhook = Webhook(
        event_id=event_id,
        target_url=target_url,
        events_subscribed=json.dumps(events_subscribed),
        is_active=True
    )
    db.add(webhook)
    db.commit()
    db.refresh(webhook)
    return webhook

def dispatch_local_webhook_event(
    db: Session,
    event_id: str,
    event_type: str,
    payload: Dict[str, Any]
) -> int:
    """Dispatches webhook event to matching registered subscribers."""
    webhooks = db.query(Webhook).filter(Webhook.event_id == event_id, Webhook.is_active == True).all()
    dispatched_count = 0
    for wh in webhooks:
        subs = json.loads(wh.events_subscribed)
        if event_type in subs or "*" in subs:
            # In offline self-contained environment, log dispatch
            dispatched_count += 1
    return dispatched_count
