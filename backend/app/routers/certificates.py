from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.certificate import Certificate
from app.schemas.certificate import (
    CertificateGenerateRequest, CertificateOut, CertificateVerifyOut
)
from app.auth.dependencies import get_current_user
from app.permissions.role_checker import require_organizer
from app.services.certificate_service import (
    generate_certificate, verify_certificate, render_certificate_svg, render_certificate_html
)

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.post("/generate", response_model=CertificateOut, status_code=status.HTTP_201_CREATED)
def create_certificate(
    cert_req: CertificateGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    try:
        cert = generate_certificate(db, cert_req, current_user.id)
        return CertificateOut(
            id=cert.id,
            event_id=cert.event_id,
            user_id=cert.user_id,
            team_id=cert.team_id,
            recipient_name=cert.recipient_name,
            cert_type=cert.cert_type,
            achievement=cert.achievement,
            issue_date=cert.issue_date,
            verification_hash=cert.verification_hash,
            event_title=cert.event.title if cert.event else None
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/verify/{identifier}", response_model=CertificateVerifyOut)
def verify_cert(identifier: str, db: Session = Depends(get_db)):
    """Public verification endpoint."""
    return verify_certificate(db, identifier)

@router.get("/{cert_id}/render")
def render_cert(cert_id: str, db: Session = Depends(get_db)):
    """Returns self-contained SVG certificate."""
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    svg_content = render_certificate_svg(cert)
    return Response(content=svg_content, media_type="image/svg+xml")

@router.get("/{cert_id}/html")
def render_cert_html(cert_id: str, db: Session = Depends(get_db)):
    """Returns responsive printable HTML certificate."""
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    html_content = render_certificate_html(cert)
    return Response(content=html_content, media_type="text/html")

@router.get("/user/{user_id}", response_model=List[CertificateOut])
def get_user_certificates(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    certs = db.query(Certificate).filter(Certificate.user_id == user_id).all()
    return [
        CertificateOut(
            id=c.id,
            event_id=c.event_id,
            user_id=c.user_id,
            team_id=c.team_id,
            recipient_name=c.recipient_name,
            cert_type=c.cert_type,
            achievement=c.achievement,
            issue_date=c.issue_date,
            verification_hash=c.verification_hash,
            event_title=c.event.title if c.event else None
        )
        for c in certs
    ]
