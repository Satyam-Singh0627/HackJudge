import uuid
import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.event import Event, Track, Prize, EventRegistration
from app.models.team import Team, TeamMember
from app.models.project import Project, Submission, SubmissionStatus, SubmissionVersion
from app.models.judging import (
    Rubric, RubricCriterion, JudgeAssignment, JudgeScore, CriterionScore, ScoreNormalization
)
from app.models.voting import CommunityVote, Comment
from app.models.audit import AuditLog
from app.models.certificate import Certificate
from app.auth.password import get_password_hash
from app.services.normalization_service import run_score_normalization

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).filter(User.username == "admin").first():
        return

    now = datetime.now(timezone.utc)
    
    # ---------------- 1. Users ----------------
    users_data = [
        # System Admin
        {"username": "admin", "email": "admin@hackathon.local", "name": "System Administrator", "role": UserRole.ADMIN.value, "pwd": "AdminPassword123!"},
        # Organizer
        {"username": "organizer", "email": "organizer@hackathon.local", "name": "Sarah Chen (Organizer)", "role": UserRole.ORGANIZER.value, "pwd": "OrganizerPassword123!"},
        # 3 Judges
        {"username": "judge", "email": "judge@hackathon.local", "name": "Dr. Marcus Vance (Judge)", "role": UserRole.JUDGE.value, "pwd": "JudgePassword123!"},
        {"username": "judge_elena", "email": "elena.judge@hackathon.local", "name": "Elena Rostova (Judge)", "role": UserRole.JUDGE.value, "pwd": "JudgePassword123!"},
        {"username": "judge_kenji", "email": "kenji.judge@hackathon.local", "name": "Kenji Sato (Judge)", "role": UserRole.JUDGE.value, "pwd": "JudgePassword123!"},
        # Default Participant
        {"username": "participant", "email": "participant@hackathon.local", "name": "Alex Rivera", "role": UserRole.PARTICIPANT.value, "pwd": "ParticipantPassword123!"},
        # Additional Participants (teams)
        {"username": "dev_priya", "email": "priya@hackathon.local", "name": "Priya Sharma", "role": UserRole.PARTICIPANT.value, "pwd": "ParticipantPassword123!"},
        {"username": "dev_liam", "email": "liam@hackathon.local", "name": "Liam O'Connor", "role": UserRole.PARTICIPANT.value, "pwd": "ParticipantPassword123!"},
        {"username": "dev_amara", "email": "amara@hackathon.local", "name": "Amara Okafor", "role": UserRole.PARTICIPANT.value, "pwd": "ParticipantPassword123!"},
        {"username": "dev_carlos", "email": "carlos@hackathon.local", "name": "Carlos Mendez", "role": UserRole.PARTICIPANT.value, "pwd": "ParticipantPassword123!"},
        {"username": "dev_sophie", "email": "sophie@hackathon.local", "name": "Sophie Martin", "role": UserRole.PARTICIPANT.value, "pwd": "ParticipantPassword123!"},
        {"username": "dev_yuki", "email": "yuki@hackathon.local", "name": "Yuki Tanaka", "role": UserRole.PARTICIPANT.value, "pwd": "ParticipantPassword123!"},
    ]

    user_map = {}
    for ud in users_data:
        u = User(
            id=str(uuid.uuid4()),
            username=ud["username"],
            email=ud["email"],
            full_name=ud["name"],
            hashed_password=get_password_hash(ud["pwd"]),
            role=ud["role"],
            bio=f"{ud['name']} profile",
            is_active=True,
            created_at=now - timedelta(days=5) # 5 days old (passes voting anti-abuse quarantine)
        )
        db.add(u)
        user_map[ud["username"]] = u
    db.flush()

    # ---------------- 2. Event ----------------
    organizer = user_map["organizer"]
    # Official Dogfood Challenge Timeline:
    # Registration: Aug 24 - Sept 28, 2026 | Hacking: Sept 25, 18:00 UTC - Sept 28, 18:00 UTC
    # Judging: Sept 28, 18:00 UTC - Oct 8, 2026 | Winners: Oct 9, 2026
    event = Event(
        id=str(uuid.uuid4()),
        title="Dogfood | 72-Hour Hackathon",
        slug="dogfood-2026",
        description="HackJudge is the open-source, self-hostable platform built for the Dogfood challenge. Participants build a modern, high-integrity platform that manages registration, team formation, submissions, judging with multi-criteria rubrics, Z-score normalization, community voting, results, verifiable certificates, CSV exports, and immutable auditability.",
        reg_start_date=datetime(2026, 8, 24, 0, 0, 0, tzinfo=timezone.utc),
        reg_end_date=datetime(2026, 9, 28, 18, 0, 0, tzinfo=timezone.utc),
        submission_start_date=datetime(2026, 9, 25, 18, 0, 0, tzinfo=timezone.utc),
        submission_end_date=datetime(2026, 9, 28, 18, 0, 0, tzinfo=timezone.utc),
        judging_start_date=datetime(2026, 9, 28, 18, 0, 0, tzinfo=timezone.utc),
        judging_end_date=datetime(2026, 10, 8, 23, 59, 59, tzinfo=timezone.utc),
        results_date=datetime(2026, 10, 9, 18, 0, 0, tzinfo=timezone.utc),
        min_team_size=1,
        max_team_size=4,
        voting_enabled=True,
        voting_start_date=datetime(2026, 9, 25, 18, 0, 0, tzinfo=timezone.utc),
        voting_end_date=datetime(2026, 10, 8, 23, 59, 59, tzinfo=timezone.utc),
        votes_per_user=3,
        hide_live_voting_results=True,
        created_by_id=organizer.id,
        created_at=datetime(2026, 8, 24, 0, 0, 0, tzinfo=timezone.utc)
    )
    db.add(event)
    db.flush()

    # ---------------- 3. Tracks & Prizes ----------------
    # Dogfood explicitly states: "There are no tracks."
    # The platform supports tracks dynamically for other events, but Dogfood has no tracks.

    # Official Dogfood Prize Pool (Total: ₹2,50,000)
    prizes_data = [
        Prize(id=str(uuid.uuid4()), event_id=event.id, title="1st Place Champion", description="₹80,000 — Top overall platform architecture, execution, and completeness.", amount_usd=80000.0),
        Prize(id=str(uuid.uuid4()), event_id=event.id, title="2nd Place", description="₹50,000 — Runner-up hackathon management platform implementation.", amount_usd=50000.0),
        Prize(id=str(uuid.uuid4()), event_id=event.id, title="3rd Place", description="₹35,000 — Third place platform implementation.", amount_usd=35000.0),
        Prize(id=str(uuid.uuid4()), event_id=event.id, title="4th Place", description="₹20,000 — Fourth place platform implementation.", amount_usd=20000.0),
        Prize(id=str(uuid.uuid4()), event_id=event.id, title="5th Place", description="₹15,000 — Fifth place platform implementation.", amount_usd=15000.0),
        Prize(id=str(uuid.uuid4()), event_id=event.id, title="Best Judging Engine", description="₹10,000 — Most rigorous scoring engine, rubric validation, and statistical Z-score normalization.", amount_usd=10000.0),
        Prize(id=str(uuid.uuid4()), event_id=event.id, title="Write Up Quest Winner #1", description="₹10,000 — Outstanding architectural documentation and system design explanation.", amount_usd=10000.0),
        Prize(id=str(uuid.uuid4()), event_id=event.id, title="Write Up Quest Winner #2", description="₹10,000 — Outstanding architectural documentation and engineering writeup.", amount_usd=10000.0),
        Prize(id=str(uuid.uuid4()), event_id=event.id, title="Write Up Quest Winner #3", description="₹10,000 — Outstanding architectural documentation and system design explanation.", amount_usd=10000.0),
        Prize(id=str(uuid.uuid4()), event_id=event.id, title="Write Up Quest Winner #4", description="₹10,000 — Outstanding architectural documentation and engineering writeup.", amount_usd=10000.0),
    ]
    db.add_all(prizes_data)
    db.flush()

    # Event Registrations
    for u in user_map.values():
        reg = EventRegistration(event_id=event.id, user_id=u.id, registered_at=datetime(2026, 8, 25, 12, 0, 0, tzinfo=timezone.utc))
        db.add(reg)
    db.flush()

    # ---------------- 4. Teams & Members ----------------
    team1 = Team(id=str(uuid.uuid4()), event_id=event.id, name="HackRaptors Core", description="Building high-integrity distributed hackathon management.", leader_id=user_map["participant"].id, invite_code="TEAM_RAPTOR_01")
    team2 = Team(id=str(uuid.uuid4()), event_id=event.id, name="KernelZero Team", description="Deterministic offline-first judging and audit database engine.", leader_id=user_map["dev_priya"].id, invite_code="TEAM_KZ_02")
    team3 = Team(id=str(uuid.uuid4()), event_id=event.id, name="CertiShield Systems", description="Tamper-evident verifiable certificate and score integrity engine.", leader_id=user_map["dev_amara"].id, invite_code="TEAM_SHIELD_03")
    team4 = Team(id=str(uuid.uuid4()), event_id=event.id, name="MatrixJudge Studio", description="Self-hosted multi-role hackathon platform with Z-score normalization.", leader_id=user_map["dev_sophie"].id, invite_code="TEAM_MATRIX_04")
    db.add_all([team1, team2, team3, team4])
    db.flush()

    # Add Members
    memberships = [
        TeamMember(team_id=team1.id, user_id=user_map["participant"].id, role="LEADER"),
        TeamMember(team_id=team1.id, user_id=user_map["dev_liam"].id, role="MEMBER"),
        TeamMember(team_id=team2.id, user_id=user_map["dev_priya"].id, role="LEADER"),
        TeamMember(team_id=team2.id, user_id=user_map["dev_carlos"].id, role="MEMBER"),
        TeamMember(team_id=team3.id, user_id=user_map["dev_amara"].id, role="LEADER"),
        TeamMember(team_id=team3.id, user_id=user_map["dev_yuki"].id, role="MEMBER"),
        TeamMember(team_id=team4.id, user_id=user_map["dev_sophie"].id, role="LEADER"),
    ]
    db.add_all(memberships)
    db.flush()

    # ---------------- 5. Projects & Submissions ----------------
    p1 = Project(
        id=str(uuid.uuid4()),
        team_id=team1.id,
        event_id=event.id,
        track_id=None,
        title="HackJudge: Production-Grade Hackathon Platform",
        tagline="Open, self-hosted hackathon management and judging platform with Z-score normalization",
        description="HackJudge manages the entire hackathon lifecycle completely offline: participant registration, team formation, submissions, judge workload distribution, weighted rubrics, statistical normalization, community voting, and verifiable certificates.",
        github_url="https://github.com/dogfood2026/hackjudge",
        demo_url="http://localhost:5173",
        technologies="Python, FastAPI, React, TypeScript, SQLite, PostgreSQL, Docker",
        is_published=True
    )
    p2 = Project(
        id=str(uuid.uuid4()),
        team_id=team2.id,
        event_id=event.id,
        track_id=None,
        title="KernelZero: Immutable Audit Ledger & Judging Platform",
        tagline="Cryptographic audit logging and score verification for self-hosted competitions",
        description="KernelZero provides append-only cryptographic provenance trees for judging records, guaranteeing mathematical detection of unauthorized evaluation alterations.",
        github_url="https://github.com/dogfood2026/kernelzero",
        demo_url="http://localhost:8000/docs",
        technologies="FastAPI, Python, SQLAlchemy, SHA-256, SQLite",
        is_published=True
    )
    p3 = Project(
        id=str(uuid.uuid4()),
        team_id=team3.id,
        event_id=event.id,
        track_id=None,
        title="CertiShield: Cryptographic Certificate & Credential Verification",
        tagline="Tamper-evident digital certificates with offline verification and anti-abuse protection",
        description="Generates valid standalone SVG and printable HTML digital certificates with SHA-256 hashes verified against local database records.",
        github_url="https://github.com/dogfood2026/certishield",
        technologies="Python, FastAPI, SVG, HTML5, SQLite",
        is_published=True
    )
    p4 = Project(
        id=str(uuid.uuid4()),
        team_id=team4.id,
        event_id=event.id,
        track_id=None,
        title="MatrixJudge: Cross-Judge Statistical Normalization Engine",
        tagline="Robust Z-score normalization with small-sample shrinkage and zero-variance protection",
        description="Eliminates harsh and lenient judge bias across unequal panel distributions with automated CSV export and rank comparison matrices.",
        github_url="https://github.com/dogfood2026/matrixjudge",
        technologies="Python, NumPy, FastAPI, SQLite",
        is_published=True
    )
    db.add_all([p1, p2, p3, p4])
    db.flush()

    # Submissions
    for proj in [p1, p2, p3, p4]:
        sub = Submission(
            project_id=proj.id,
            status=SubmissionStatus.SUBMITTED,
            submitted_at=now - timedelta(hours=24)
        )
        db.add(sub)
        db.flush()
        v = SubmissionVersion(
            submission_id=sub.id,
            version_number=1,
            payload_snapshot=json.dumps({"title": proj.title, "description": proj.description})
        )
        db.add(v)
    db.flush()

    # ---------------- 6. Rubric & Criteria ----------------
    rubric = Rubric(
        id=str(uuid.uuid4()),
        event_id=event.id,
        name="Dogfood 2026 Official Judging Rubric",
        is_active=True,
        version=1
    )
    db.add(rubric)
    db.flush()

    crit_data = [
        {"name": "Technical Execution & Architecture", "weight": 0.30, "max": 10.0, "order": 1, "desc": "Clean code structure, error handling, local deployment capability, and architectural robustness."},
        {"name": "Innovation & Originality", "weight": 0.25, "max": 10.0, "order": 2, "desc": "Novelty of the solution and unique technical approach to solving the problem."},
        {"name": "Impact & Practical Utility", "weight": 0.25, "max": 10.0, "order": 3, "desc": "Measurable value to end users and effective problem-domain resolution."},
        {"name": "User Experience & Presentation", "weight": 0.20, "max": 10.0, "order": 4, "desc": "Intuitive workflow, legibility, and quality of demonstration."},
    ]
    crit_entities = []
    for cd in crit_data:
        c = RubricCriterion(
            rubric_id=rubric.id,
            name=cd["name"],
            description=cd["desc"],
            weight=cd["weight"],
            max_score=cd["max"],
            sort_order=cd["order"],
            is_active=True
        )
        db.add(c)
        crit_entities.append(c)
    db.flush()

    # ---------------- 7. Judge Assignments & Scoring ----------------
    j1, j2, j3 = user_map["judge"], user_map["judge_elena"], user_map["judge_kenji"]
    
    # We assign:
    # p1: j1 (completed), j2 (completed), j3 (completed)
    # p2: j1 (completed), j2 (completed), j3 (pending)
    # p3: j1 (completed), j2 (pending), j3 (completed)
    # p4: j1 (pending), j2 (completed), j3 (pending)
    
    assignment_configs = [
        # (judge, project, status, raw_scores_dict, feedback)
        (j1, p1, "COMPLETED", {0: 9.0, 1: 9.5, 2: 9.0, 3: 8.5}, "Outstanding decentralized design and seamless local-only operation."),
        (j2, p1, "COMPLETED", {0: 8.5, 1: 9.0, 2: 8.5, 3: 8.0}, "Very strong agent coordination mechanics."),
        (j3, p1, "COMPLETED", {0: 9.5, 1: 9.0, 2: 9.0, 3: 9.0}, "Excellent presentation and solid test coverage."),

        (j1, p2, "COMPLETED", {0: 9.5, 1: 8.5, 2: 9.5, 3: 8.0}, "Cryptographic rigor is rock solid. Impressive performance."),
        (j2, p2, "COMPLETED", {0: 9.0, 1: 8.0, 2: 9.0, 3: 8.5}, "Great backend architecture and clean separation of concerns."),
        (j3, p2, "PENDING", None, None),

        (j1, p3, "COMPLETED", {0: 8.0, 1: 8.0, 2: 8.5, 3: 8.0}, "Useful edge telemetry tool with clear practical utility."),
        (j2, p3, "PENDING", None, None),
        (j3, p3, "COMPLETED", {0: 8.5, 1: 7.5, 2: 8.0, 3: 8.5}, "Good security posture, would like to see automated stress tests."),

        (j1, p4, "PENDING", None, None),
        (j2, p4, "COMPLETED", {0: 7.5, 1: 8.5, 2: 7.5, 3: 8.0}, "Promising local code analysis assistant."),
        (j3, p4, "PENDING", None, None),
    ]

    for judge, proj, a_status, raw_dict, fback in assignment_configs:
        assignment = JudgeAssignment(
            event_id=event.id,
            judge_id=judge.id,
            project_id=proj.id,
            status=a_status,
            assigned_at=now - timedelta(hours=12)
        )
        db.add(assignment)
        db.flush()

        if a_status == "COMPLETED" and raw_dict:
            raw_sum = 0.0
            weighted_sum = 0.0
            crit_scores = []
            for idx, c in enumerate(crit_entities):
                r_val = raw_dict[idx]
                contrib = (r_val / c.max_score) * c.weight * 100.0
                raw_sum += r_val
                weighted_sum += contrib
                crit_scores.append((c, r_val, contrib))

            js = JudgeScore(
                assignment_id=assignment.id,
                judge_id=judge.id,
                project_id=proj.id,
                rubric_id=rubric.id,
                raw_total_score=round(raw_sum, 2),
                weighted_total_score=round(weighted_sum, 2),
                feedback=fback,
                is_finalized=True,
                submitted_at=now - timedelta(hours=6)
            )
            db.add(js)
            db.flush()

            for crit, r_val, contrib in crit_scores:
                cs = CriterionScore(
                    score_id=js.id,
                    criterion_id=crit.id,
                    raw_score=r_val,
                    max_score=crit.max_score,
                    weight=crit.weight,
                    weighted_score=round(contrib, 2)
                )
                db.add(cs)

    db.commit()

    # ---------------- 8. Run Initial Normalization ----------------
    run_score_normalization(db, event.id, organizer.id)

    # ---------------- 9. Community Votes & Comments ----------------
    voters = [user_map["participant"], user_map["dev_priya"], user_map["dev_liam"], user_map["dev_amara"]]
    v_pairs = [
        (user_map["participant"], p2),
        (user_map["participant"], p3),
        (user_map["dev_priya"], p1),
        (user_map["dev_priya"], p4),
        (user_map["dev_liam"], p2),
        (user_map["dev_amara"], p1),
    ]
    for voter, proj in v_pairs:
        cv = CommunityVote(
            event_id=event.id,
            project_id=proj.id,
            user_id=voter.id,
            ip_address="127.0.0.1",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) HackathonClient/1.0"
        )
        db.add(cv)

    comments_data = [
        (p1, user_map["dev_priya"], "The local mesh discovery protocol is remarkably elegant! Tested with 3 nodes seamlessly."),
        (p1, user_map["dev_carlos"], "Great UI feedback during sync disconnection. Clean work!"),
        (p2, user_map["participant"], "The audit hash tree implementation is super fast and zero-overhead."),
        (p3, user_map["dev_sophie"], "Very relevant utility for privacy-conscious environments."),
    ]
    for proj, commenter, txt in comments_data:
        cm = Comment(
            project_id=proj.id,
            user_id=commenter.id,
            content=txt,
            is_moderated=False,
            created_at=now - timedelta(hours=5)
        )
        db.add(cm)

    # ---------------- 10. Audit Logs ----------------
    audit_entries = [
        AuditLog(user_id=organizer.id, action="EVENT_CREATED", resource_type="event", resource_id=event.id, details=json.dumps({"title": event.title})),
        AuditLog(user_id=organizer.id, action="RUBRIC_CREATED", resource_type="rubric", resource_id=rubric.id, details=json.dumps({"name": rubric.name})),
        AuditLog(user_id=user_map["participant"].id, action="TEAM_CREATED", resource_type="team", resource_id=team1.id, details=json.dumps({"team_name": team1.name})),
        AuditLog(user_id=user_map["participant"].id, action="SUBMISSION_FINALIZED", resource_type="submission", resource_id=p1.id, details=json.dumps({"title": p1.title})),
        AuditLog(user_id=organizer.id, action="ALGORITHMIC_ASSIGNMENT_EXECUTED", resource_type="judge_assignment", resource_id=event.id, details=json.dumps({"assignments_created": 11})),
        AuditLog(user_id=j1.id, action="SCORE_FINALIZED", resource_type="judge_score", resource_id=p1.id, details=json.dumps({"weighted_score": 90.0})),
        AuditLog(user_id=organizer.id, action="NORMALIZATION_RUN", resource_type="score_normalization", resource_id=event.id, details=json.dumps({"projects_normalized": 4})),
    ]
    db.add_all(audit_entries)

    # ---------------- 11. Initial Winner Certificate ----------------
    cert = Certificate(
        id=str(uuid.uuid4()),
        event_id=event.id,
        user_id=user_map["participant"].id,
        team_id=team1.id,
        recipient_name=user_map["participant"].full_name,
        cert_type="WINNER",
        achievement="1st Place - Grand Champion",
        issue_date=now,
        verification_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
    db.add(cert)

    db.commit()
    print("Database successfully seeded with realistic production-grade hackathon fixture data!")
