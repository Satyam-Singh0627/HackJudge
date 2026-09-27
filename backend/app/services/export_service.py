import csv
import io
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.team import Team, TeamMember
from app.models.project import Project, Submission
from app.models.judging import JudgeAssignment, JudgeScore, ScoreNormalization
from app.models.voting import CommunityVote
from app.models.audit import AuditLog

def export_participants_csv(db: Session, event_id: str) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["User ID", "Full Name", "Username", "Email", "Role", "Active", "Created At"])

    users = db.query(User).all()
    for u in users:
        writer.writerow([u.id, u.full_name, u.username, u.email, u.role, u.is_active, u.created_at.isoformat()])
    return output.getvalue()

def export_teams_csv(db: Session, event_id: str) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Team ID", "Team Name", "Description", "Leader ID", "Leader Name", "Member Count", "Created At"])

    teams = db.query(Team).filter(Team.event_id == event_id).all()
    for t in teams:
        leader_name = t.leader.full_name if t.leader else "Unknown"
        writer.writerow([t.id, t.name, t.description or "", t.leader_id, leader_name, len(t.members), t.created_at.isoformat()])
    return output.getvalue()

def export_submissions_csv(db: Session, event_id: str) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Project ID", "Title", "Team Name", "Track", "Status", "GitHub URL", "Demo URL", "Submitted At"])

    projects = db.query(Project).filter(Project.event_id == event_id).all()
    for p in projects:
        team_name = p.team.name if p.team else ""
        track_name = p.track.name if p.track else ""
        sub_status = p.submission.status if p.submission else "DRAFT"
        sub_at = p.submission.submitted_at.isoformat() if p.submission and p.submission.submitted_at else ""
        writer.writerow([p.id, p.title, team_name, track_name, sub_status, p.github_url or "", p.demo_url or "", sub_at])
    return output.getvalue()

def export_scores_csv(db: Session, event_id: str) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Score ID", "Project ID", "Project Title", "Judge ID", "Judge Name", "Raw Score", "Weighted Score (0-100)", "Finalized", "Feedback", "Submitted At"])

    scores = (
        db.query(JudgeScore)
        .join(Project, JudgeScore.project_id == Project.id)
        .filter(Project.event_id == event_id)
        .all()
    )
    for s in scores:
        proj_title = s.project.title if s.project else ""
        judge_name = s.judge.full_name if s.judge else ""
        writer.writerow([
            s.id, s.project_id, proj_title, s.judge_id, judge_name,
            s.raw_total_score, s.weighted_total_score, s.is_finalized,
            s.feedback or "", s.submitted_at.isoformat()
        ])
    return output.getvalue()

def export_normalized_rankings_csv(db: Session, event_id: str) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Normalized Rank", "Raw Rank", "Project ID", "Project Title", "Track", "Evaluations Count", "Raw Average Score", "Normalized Z-Score", "Normalized Final Score (0-100)"])

    normalizations = (
        db.query(ScoreNormalization)
        .filter(ScoreNormalization.event_id == event_id)
        .order_by(ScoreNormalization.normalized_rank.asc())
        .all()
    )
    for n in normalizations:
        proj_title = n.project.title if n.project else ""
        track_name = n.project.track.name if n.project and n.project.track else ""
        writer.writerow([
            n.normalized_rank, n.raw_rank, n.project_id, proj_title, track_name,
            n.evaluations_count, n.raw_average_score, n.normalized_z_score, n.normalized_final_score
        ])
    return output.getvalue()

def export_audit_logs_csv(db: Session) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Audit ID", "User ID", "Action", "Resource Type", "Resource ID", "IP Address", "Details", "Created At"])

    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(1000).all()
    for l in logs:
        writer.writerow([
            l.id, l.user_id or "", l.action, l.resource_type, l.resource_id or "",
            l.ip_address or "", l.details or "", l.created_at.isoformat()
        ])
    return output.getvalue()
