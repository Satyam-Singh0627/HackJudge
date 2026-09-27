import math
from datetime import datetime, timezone
from typing import Optional, List, Dict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.judging import (
    Rubric, RubricCriterion, JudgeAssignment, JudgeScore, CriterionScore
)
from app.models.project import Project, Submission, SubmissionStatus
from app.models.team import TeamMember
from app.models.user import User, UserRole
from app.models.event import Event
from app.schemas.judging import (
    RubricCreate, CriterionCreate, AssignmentCreate,
    BatchAssignmentCreate, AlgorithmicAssignmentCreate, ScoreSubmitRequest
)
from app.audit.audit_service import log_audit_event

# ----------------- Rubrics -----------------

def create_rubric(db: Session, rubric_in: RubricCreate, user_id: str) -> Rubric:
    # Validate criteria weights sum to ~1.0 (or ~100)
    total_weight = sum(c.weight for c in rubric_in.criteria)
    if not (math.isclose(total_weight, 1.0, rel_tol=1e-2) or math.isclose(total_weight, 100.0, rel_tol=1e-2)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Total criterion weight must sum to 1.0 (or 100). Current sum: {total_weight}"
        )
    
    # Normalize weights to 0.0 - 1.0 scale if provided as 0-100
    norm_factor = 1.0 if total_weight <= 1.05 else 100.0

    rubric = Rubric(
        event_id=rubric_in.event_id,
        name=rubric_in.name,
        is_active=rubric_in.is_active,
    )
    db.add(rubric)
    db.flush()

    for idx, crit in enumerate(rubric_in.criteria):
        criterion = RubricCriterion(
            rubric_id=rubric.id,
            name=crit.name,
            description=crit.description,
            weight=crit.weight / norm_factor,
            max_score=crit.max_score,
            sort_order=crit.sort_order or idx,
            is_active=crit.is_active,
        )
        db.add(criterion)

    db.commit()
    db.refresh(rubric)

    log_audit_event(
        db,
        action="RUBRIC_CREATED",
        resource_type="rubric",
        resource_id=rubric.id,
        user_id=user_id,
        details={"name": rubric.name, "criteria_count": len(rubric_in.criteria)}
    )
    return rubric

def get_event_rubric(db: Session, event_id: str) -> Optional[Rubric]:
    return db.query(Rubric).filter(Rubric.event_id == event_id, Rubric.is_active == True).order_by(Rubric.version.desc()).first()

# ----------------- Judge Assignments -----------------

def assign_judge_manual(db: Session, assignment_in: AssignmentCreate, operator_id: str) -> JudgeAssignment:
    # Check existing
    existing = db.query(JudgeAssignment).filter(
        JudgeAssignment.judge_id == assignment_in.judge_id,
        JudgeAssignment.project_id == assignment_in.project_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Judge is already assigned to this project")

    # Conflict of interest check: judge cannot evaluate project of a team they belong to
    project = db.query(Project).filter(Project.id == assignment_in.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    team_member = db.query(TeamMember).filter(
        TeamMember.team_id == project.team_id,
        TeamMember.user_id == assignment_in.judge_id
    ).first()
    if team_member:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Conflict of interest: Judge is a member of this project's team")

    assignment = JudgeAssignment(
        event_id=assignment_in.event_id,
        judge_id=assignment_in.judge_id,
        project_id=assignment_in.project_id,
        status="PENDING"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    log_audit_event(
        db,
        action="JUDGE_ASSIGNED",
        resource_type="judge_assignment",
        resource_id=assignment.id,
        user_id=operator_id,
        details={"judge_id": assignment.judge_id, "project_id": assignment.project_id}
    )
    return assignment

def assign_judge_batch(db: Session, batch_in: BatchAssignmentCreate, operator_id: str) -> List[JudgeAssignment]:
    created = []
    for p_id in batch_in.project_ids:
        project = db.query(Project).filter(Project.id == p_id).first()
        if not project:
            continue
        for j_id in batch_in.judge_ids:
            # Check collision
            dup = db.query(JudgeAssignment).filter(
                JudgeAssignment.judge_id == j_id,
                JudgeAssignment.project_id == p_id
            ).first()
            if dup:
                continue
            # Check conflict of interest
            conflict = db.query(TeamMember).filter(
                TeamMember.team_id == project.team_id,
                TeamMember.user_id == j_id
            ).first()
            if conflict:
                continue
            
            assignment = JudgeAssignment(
                event_id=batch_in.event_id,
                judge_id=j_id,
                project_id=p_id,
                status="PENDING"
            )
            db.add(assignment)
            created.append(assignment)
    db.commit()
    for a in created:
        db.refresh(a)
    return created

def assign_judge_algorithmic(db: Session, algo_in: AlgorithmicAssignmentCreate, operator_id: str) -> List[JudgeAssignment]:
    # 1. Fetch eligible judges
    if algo_in.judge_ids:
        judges = db.query(User).filter(User.id.in_(algo_in.judge_ids), User.is_active == True).all()
    else:
        judges = db.query(User).filter(User.role.in_([UserRole.JUDGE.value, UserRole.ADMIN.value]), User.is_active == True).all()

    if not judges:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No eligible judges available for assignment")

    # 2. Fetch projects
    if algo_in.project_ids:
        projects = db.query(Project).filter(Project.id.in_(algo_in.project_ids)).all()
    else:
        # All submitted projects in event
        projects = (
            db.query(Project)
            .join(Submission, Project.id == Submission.project_id)
            .filter(Project.event_id == algo_in.event_id, Submission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.UNDER_REVIEW]))
            .all()
        )

    if not projects:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No eligible submitted projects found for assignment")

    # Track current load per judge
    judge_load: Dict[str, int] = {j.id: 0 for j in judges}
    existing_assignments = db.query(JudgeAssignment).filter(JudgeAssignment.event_id == algo_in.event_id).all()
    for ea in existing_assignments:
        if ea.judge_id in judge_load:
            judge_load[ea.judge_id] += 1

    # Team membership conflict map
    team_memberships = db.query(TeamMember).all()
    conflict_map = set((tm.user_id, tm.team_id) for tm in team_memberships)

    target_per_proj = min(algo_in.judges_per_project, len(judges))
    new_assignments = []

    for project in projects:
        # Count existing assignments for this project
        assigned_judge_ids = set(ea.judge_id for ea in existing_assignments if ea.project_id == project.id)
        needed = target_per_proj - len(assigned_judge_ids)
        if needed <= 0:
            continue

        # Sort judges by current workload ascending
        available_judges = [
            j for j in judges
            if j.id not in assigned_judge_ids and (j.id, project.team_id) not in conflict_map
        ]
        available_judges.sort(key=lambda j: judge_load[j.id])

        selected = available_judges[:needed]
        for judge in selected:
            assignment = JudgeAssignment(
                event_id=algo_in.event_id,
                judge_id=judge.id,
                project_id=project.id,
                status="PENDING"
            )
            db.add(assignment)
            new_assignments.append(assignment)
            judge_load[judge.id] += 1
            assigned_judge_ids.add(judge.id)

    db.commit()
    for a in new_assignments:
        db.refresh(a)

    log_audit_event(
        db,
        action="ALGORITHMIC_ASSIGNMENT_EXECUTED",
        resource_type="judge_assignment",
        resource_id=algo_in.event_id,
        user_id=operator_id,
        details={"assignments_created": len(new_assignments), "target_per_proj": target_per_proj}
    )
    return new_assignments

# ----------------- Scoring Engine -----------------

def submit_or_update_score(db: Session, score_req: ScoreSubmitRequest, user: User) -> JudgeScore:
    assignment = db.query(JudgeAssignment).filter(JudgeAssignment.id == score_req.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Judge assignment not found")

    # Enforce role isolation: only assigned judge or admin can submit evaluation
    if assignment.judge_id != user.id and user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You are not the assigned judge for this project"
        )

    # Check if existing score is finalized
    existing_score = db.query(JudgeScore).filter(JudgeScore.assignment_id == assignment.id).first()
    if existing_score and existing_score.is_finalized and user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Evaluation has already been finalized and cannot be modified."
        )

    rubric = get_event_rubric(db, assignment.event_id)
    if not rubric:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active rubric configured for this event")

    criteria_dict = {c.id: c for c in rubric.criteria if c.is_active}
    
    # Calculate score contributions
    raw_total = 0.0
    weighted_total = 0.0
    scores_to_record = []

    for item in score_req.criterion_scores:
        crit = criteria_dict.get(item.criterion_id)
        if not crit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Criterion {item.criterion_id} does not belong to active rubric"
            )
        if item.raw_score < 0.0 or item.raw_score > crit.max_score:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Score for '{crit.name}' must be between 0.0 and {crit.max_score}. Received: {item.raw_score}"
            )
        
        # Contribution: (raw / max) * weight * 100
        contrib = (item.raw_score / crit.max_score) * crit.weight * 100.0
        raw_total += item.raw_score
        weighted_total += contrib
        scores_to_record.append((crit, item.raw_score, contrib))

    if existing_score:
        judge_score = existing_score
        judge_score.raw_total_score = round(raw_total, 2)
        judge_score.weighted_total_score = round(weighted_total, 2)
        judge_score.feedback = score_req.feedback
        judge_score.is_finalized = score_req.finalize
        judge_score.updated_at = datetime.now(timezone.utc)
        
        # Delete old criterion scores and re-add
        db.query(CriterionScore).filter(CriterionScore.score_id == judge_score.id).delete()
    else:
        judge_score = JudgeScore(
            assignment_id=assignment.id,
            judge_id=assignment.judge_id,
            project_id=assignment.project_id,
            rubric_id=rubric.id,
            raw_total_score=round(raw_total, 2),
            weighted_total_score=round(weighted_total, 2),
            feedback=score_req.feedback,
            is_finalized=score_req.finalize
        )
        db.add(judge_score)
        db.flush()

    for crit, raw_val, contrib_val in scores_to_record:
        cs = CriterionScore(
            score_id=judge_score.id,
            criterion_id=crit.id,
            raw_score=raw_val,
            max_score=crit.max_score,
            weight=crit.weight,
            weighted_score=round(contrib_val, 2)
        )
        db.add(cs)

    if score_req.finalize:
        assignment.status = "COMPLETED"

    db.commit()
    db.refresh(judge_score)

    log_audit_event(
        db,
        action="SCORE_FINALIZED" if score_req.finalize else "SCORE_SAVED",
        resource_type="judge_score",
        resource_id=judge_score.id,
        user_id=user.id,
        details={
            "project_id": assignment.project_id,
            "weighted_score": judge_score.weighted_total_score,
            "is_finalized": score_req.finalize
        }
    )
    return judge_score
