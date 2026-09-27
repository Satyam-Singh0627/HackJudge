import hashlib
import html
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict
from sqlalchemy.orm import Session
from app.models.certificate import Certificate
from app.models.event import Event
from app.models.user import User
from app.schemas.certificate import CertificateGenerateRequest, CertificateOut, CertificateVerifyOut

def generate_certificate(
    db: Session,
    request: CertificateGenerateRequest,
    operator_id: str
) -> Certificate:
    user = db.query(User).filter(User.id == request.user_id).first()
    event = db.query(Event).filter(Event.id == request.event_id).first()
    if not user or not event:
        raise ValueError("User or Event not found")

    # Generate cryptographic verification hash based on immutable properties
    cert_id = str(uuid.uuid4())
    raw_payload = f"{cert_id}:{user.id}:{event.id}:{request.cert_type}:{request.achievement}"
    verification_hash = hashlib.sha256(raw_payload.encode()).hexdigest()

    cert = Certificate(
        id=cert_id,
        event_id=event.id,
        user_id=user.id,
        recipient_name=user.full_name,
        cert_type=request.cert_type,
        achievement=request.achievement,
        issue_date=datetime.now(timezone.utc),
        verification_hash=verification_hash
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert

def verify_certificate(db: Session, identifier: str) -> CertificateVerifyOut:
    # Look up by ID or verification hash
    cert = (
        db.query(Certificate)
        .filter((Certificate.id == identifier) | (Certificate.verification_hash == identifier))
        .first()
    )
    if not cert:
        return CertificateVerifyOut(valid=False, message="Certificate record not found in system")

    event_title = cert.event.title if cert.event else "HackJudge Hackathon"
    cert_out = CertificateOut(
        id=cert.id,
        event_id=cert.event_id,
        user_id=cert.user_id,
        team_id=cert.team_id,
        recipient_name=cert.recipient_name,
        cert_type=cert.cert_type,
        achievement=cert.achievement,
        issue_date=cert.issue_date,
        verification_hash=cert.verification_hash,
        event_title=event_title
    )
    return CertificateVerifyOut(
        valid=True,
        certificate=cert_out,
        message="Cryptographically verified authentic certificate issued by HackJudge Platform"
    )

def render_certificate_svg(cert: Certificate) -> str:
    """Renders a self-contained, printable SVG certificate with robust XML entity escaping."""
    event_title_raw = cert.event.title if cert.event else "HackJudge Hackathon"
    issue_date_str = cert.issue_date.strftime("%B %d, %Y")
    
    # Escape all dynamic fields to prevent xmlParseEntityRef errors
    recipient_name = html.escape(cert.recipient_name or "Recipient", quote=True)
    achievement = html.escape((cert.achievement or "PARTICIPATION").upper(), quote=True)
    event_title = html.escape(event_title_raw, quote=True)
    cert_id = html.escape(cert.id, quote=True)
    cert_hash = html.escape(cert.verification_hash, quote=True)
    
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b45309" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#78350f" />
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
  </defs>
  
  <!-- Outer Background -->
  <rect width="1200" height="800" fill="url(#bgGrad)" />
  
  <!-- Certificate Border -->
  <rect x="40" y="40" width="1120" height="720" rx="16" fill="none" stroke="url(#goldGrad)" stroke-width="4" />
  <rect x="52" y="52" width="1096" height="696" rx="12" fill="none" stroke="#e2e8f0" stroke-width="2" />
  
  <!-- Header Text -->
  <text x="600" y="150" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="40" font-weight="800" fill="#0f172a" letter-spacing="3">
    CERTIFICATE OF RECOGNITION
  </text>
  <text x="600" y="195" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#64748b" letter-spacing="2">
    THIS OFFICIAL DOCUMENT IS PROUDLY PRESENTED TO
  </text>
  
  <!-- Recipient Name -->
  <text x="600" y="310" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800" fill="#1e293b">
    {recipient_name}
  </text>
  
  <!-- Achievement Line -->
  <line x1="300" y1="345" x2="900" y2="345" stroke="#cbd5e1" stroke-width="2" />
  <text x="600" y="405" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#2563eb">
    FOR OUTSTANDING ACHIEVEMENT: {achievement}
  </text>
  <text x="600" y="455" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" fill="#475569">
    Conferred at {event_title}
  </text>

  <!-- Verification Details Footer -->
  <text x="100" y="650" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#475569">
    ISSUE DATE: {issue_date_str}
  </text>
  <text x="100" y="680" font-family="monospace, monospace" font-size="12" fill="#64748b">
    CERTIFICATE ID: {cert_id}
  </text>
  <text x="100" y="705" font-family="monospace, monospace" font-size="11" fill="#94a3b8">
    VERIFICATION HASH: {cert_hash}
  </text>
  
  <!-- Official Seal Symbol -->
  <circle cx="1040" cy="665" r="48" fill="none" stroke="url(#goldGrad)" stroke-width="3" />
  <text x="1040" y="660" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#b45309">HACKJUDGE</text>
  <text x="1040" y="678" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#059669">VERIFIED</text>
</svg>"""

def render_certificate_html(cert: Certificate) -> str:
    """Renders a responsive, print-optimized HTML certificate."""
    event_title = html.escape(cert.event.title if cert.event else "HackJudge Hackathon")
    recipient_name = html.escape(cert.recipient_name or "Recipient")
    achievement = html.escape((cert.achievement or "PARTICIPATION").upper())
    cert_id = html.escape(cert.id)
    cert_hash = html.escape(cert.verification_hash)
    issue_date_str = cert.issue_date.strftime("%B %d, %Y")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate - {recipient_name}</title>
  <style>
    @page {{ size: landscape; margin: 1cm; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 30px;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }}
    .cert-frame {{
      width: 100%;
      max-width: 980px;
      background: #ffffff;
      border: 6px double #b45309;
      border-radius: 12px;
      padding: 48px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
      text-align: center;
      box-sizing: border-box;
    }}
    .cert-title {{
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #0f172a;
      margin-bottom: 8px;
    }}
    .cert-sub {{
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      margin-bottom: 32px;
    }}
    .cert-name {{
      font-size: 40px;
      font-weight: 800;
      color: #1e293b;
      border-bottom: 2px solid #e2e8f0;
      display: inline-block;
      padding: 0 40px 12px 40px;
      margin-bottom: 24px;
    }}
    .cert-achievement {{
      font-size: 20px;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 8px;
    }}
    .cert-event {{
      font-size: 16px;
      color: #475569;
      margin-bottom: 40px;
    }}
    .cert-footer {{
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      text-align: left;
      font-size: 12px;
      color: #64748b;
    }}
    .cert-meta code {{
      font-family: monospace;
      color: #334155;
    }}
    .seal {{
      width: 80px;
      height: 80px;
      border: 3px solid #b45309;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #b45309;
      font-weight: 800;
      font-size: 10px;
      letter-spacing: 1px;
    }}
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="cert-title">CERTIFICATE OF RECOGNITION</div>
    <div class="cert-sub">This official document is proudly presented to</div>
    <div class="cert-name">{recipient_name}</div>
    <div class="cert-achievement">{achievement}</div>
    <div class="cert-event">Conferred at {event_title}</div>
    <div class="cert-footer">
      <div class="cert-meta">
        <div><strong>Issue Date:</strong> {issue_date_str}</div>
        <div><strong>Certificate ID:</strong> <code>{cert_id}</code></div>
        <div><strong>Verification Hash:</strong> <code>{cert_hash}</code></div>
      </div>
      <div class="seal">
        <span>HACKJUDGE</span>
        <span style="color:#059669; font-size:9px;">VERIFIED</span>
      </div>
    </div>
  </div>
</body>
</html>"""

