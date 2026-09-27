import math
from datetime import datetime, timezone
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from app.models.judging import JudgeScore, ScoreNormalization
from app.models.project import Project, Submission, SubmissionStatus
from app.models.event import Event
from app.schemas.judging import NormalizationOut, RankComparisonOut
from app.audit.audit_service import log_audit_event

def run_score_normalization(db: Session, event_id: str, operator_id: str) -> List[ScoreNormalization]:
    """
    Executes cross-judge Z-score normalization with robust edge case safeguards.
    """
    # 1. Fetch all scores for this event (either submitted or finalized)
    scores: List[JudgeScore] = (
        db.query(JudgeScore)
        .join(Project, JudgeScore.project_id == Project.id)
        .filter(Project.event_id == event_id)
        .all()
    )

    if not scores:
        return []

    # 2. Group scores by judge
    judge_scores_map: Dict[str, List[float]] = {}
    for s in scores:
        judge_scores_map.setdefault(s.judge_id, []).append(s.weighted_total_score)

    # Calculate global mean and global std dev for fallbacks
    all_scores_flat = [s.weighted_total_score for s in scores]
    global_mean = sum(all_scores_flat) / len(all_scores_flat) if all_scores_flat else 75.0
    if len(all_scores_flat) > 1:
        global_var = sum((x - global_mean) ** 2 for x in all_scores_flat) / (len(all_scores_flat) - 1)
        global_std = math.sqrt(global_var) if global_var > 0 else 10.0
    else:
        global_std = 10.0

    # 3. Compute mean and standard deviation per judge with edge case safeguards
    judge_stats: Dict[str, Tuple[float, float]] = {}
    for j_id, score_list in judge_scores_map.items():
        n = len(score_list)
        j_mean = sum(score_list) / n
        
        if n == 1:
            # Single evaluation: use global std deviation to avoid division by zero
            j_std = global_std if global_std > 0 else 10.0
        else:
            sample_var = sum((x - j_mean) ** 2 for x in score_list) / (n - 1)
            sample_std = math.sqrt(sample_var)
            
            if math.isclose(sample_std, 0.0, abs_tol=1e-6):
                # Zero variance: Judge gave identical scores to all projects
                j_std = 0.0
            elif n <= 3 and global_std > 0:
                # Small sample shrinkage prior towards global standard deviation
                shrinkage_weight = n / (n + 1.0)
                shrunk_var = shrinkage_weight * sample_var + (1.0 - shrinkage_weight) * (global_std ** 2)
                j_std = math.sqrt(shrunk_var)
            else:
                j_std = sample_std
                
        judge_stats[j_id] = (j_mean, j_std)

    # 4. Compute Z-score for each score
    project_z_scores: Dict[str, List[float]] = {}
    project_raw_scores: Dict[str, List[float]] = {}

    for s in scores:
        j_mean, j_std = judge_stats[s.judge_id]
        if math.isclose(j_std, 0.0, abs_tol=1e-6):
            # Zero variance fallback: project is exactly at judge mean
            z = 0.0
        else:
            z = (s.weighted_total_score - j_mean) / j_std

        project_z_scores.setdefault(s.project_id, []).append(z)
        project_raw_scores.setdefault(s.project_id, []).append(s.weighted_total_score)

    # 5. Aggregate project scores
    # Rescale Z-scores to human-friendly 0-100 scale: centered at 75 with std=12
    TARGET_MEAN = 75.0
    TARGET_STD = 12.0

    project_summaries = []
    for p_id in project_raw_scores.keys():
        raw_list = project_raw_scores[p_id]
        z_list = project_z_scores[p_id]
        
        raw_avg = sum(raw_list) / len(raw_list)
        z_avg = sum(z_list) / len(z_list)
        
        rescaled_score = TARGET_MEAN + (z_avg * TARGET_STD)
        rescaled_score = max(0.0, min(100.0, rescaled_score)) # Clamp between 0 and 100

        project_summaries.append({
            "project_id": p_id,
            "eval_count": len(raw_list),
            "raw_avg": round(raw_avg, 2),
            "z_avg": round(z_avg, 4),
            "final_score": round(rescaled_score, 2),
        })

    # 6. Compute Raw Ranks (higher raw_avg -> better rank)
    project_summaries.sort(key=lambda x: x["raw_avg"], reverse=True)
    for rank, item in enumerate(project_summaries, start=1):
        item["raw_rank"] = rank

    # 7. Compute Normalized Ranks (higher final_score -> better rank)
    project_summaries.sort(key=lambda x: x["final_score"], reverse=True)
    for rank, item in enumerate(project_summaries, start=1):
        item["norm_rank"] = rank

    # 8. Upsert into ScoreNormalization table
    # Clear existing normalizations for this event
    db.query(ScoreNormalization).filter(ScoreNormalization.event_id == event_id).delete()

    created_records = []
    for item in project_summaries:
        norm_record = ScoreNormalization(
            event_id=event_id,
            project_id=item["project_id"],
            evaluations_count=item["eval_count"],
            raw_average_score=item["raw_avg"],
            normalized_z_score=item["z_avg"],
            normalized_final_score=item["final_score"],
            raw_rank=item["raw_rank"],
            normalized_rank=item["norm_rank"],
            computed_at=datetime.now(timezone.utc)
        )
        db.add(norm_record)
        created_records.append(norm_record)

    db.commit()
    for rec in created_records:
        db.refresh(rec)

    log_audit_event(
        db,
        action="NORMALIZATION_RUN",
        resource_type="score_normalization",
        resource_id=event_id,
        user_id=operator_id,
        details={"projects_normalized": len(created_records)}
    )
    return created_records

def get_normalization_comparison(db: Session, event_id: str) -> List[RankComparisonOut]:
    records = (
        db.query(ScoreNormalization, Project)
        .join(Project, ScoreNormalization.project_id == Project.id)
        .filter(ScoreNormalization.event_id == event_id)
        .order_by(ScoreNormalization.normalized_rank.asc())
        .all()
    )

    comparisons = []
    for norm, proj in records:
        track_name = proj.track.name if proj.track else None
        rank_delta = norm.raw_rank - norm.normalized_rank
        comparisons.append(RankComparisonOut(
            project_id=proj.id,
            project_title=proj.title,
            track_name=track_name,
            evaluations_count=norm.evaluations_count,
            raw_average=norm.raw_average_score,
            raw_rank=norm.raw_rank,
            normalized_score=norm.normalized_final_score,
            normalized_rank=norm.normalized_rank,
            rank_delta=rank_delta
        ))
    return comparisons
