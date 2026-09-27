import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import { Project, Rubric, User } from '../../types';
import {
  Scale, ExternalLink,
  AlertCircle, ArrowLeft, Lock, Star,
  Save, CheckCircle2, Info
} from 'lucide-react';
import { GithubIcon } from '../../components/Icons';

interface JudgeEvaluatePageProps {
  currentUser: User;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const JudgeEvaluatePage: React.FC<JudgeEvaluatePageProps> = ({ onNotification }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const assignmentIdParam = searchParams.get('assignment');
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<string>('');
  const [assignmentId, setAssignmentId] = useState<string>(assignmentIdParam || '');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProjectAndRubric(projectId);
    }
  }, [projectId]);

  const loadProjectAndRubric = async (pId: string) => {
    setLoading(true);
    try {
      const proj = await api.getProject(pId);
      setProject(proj);

      if (proj.event_id) {
        // Load rubric for the event
        const r = await api.getRubric(proj.event_id);
        setRubric(r);

        // Find assignment ID if not passed as URL query
        const dash = await api.getJudgeDashboard(proj.event_id);
        const match = dash.assigned_projects.find(a => a.project_id === pId);
        if (match) {
          setAssignmentId(match.assignment_id);
          if (match.assignment_status === 'COMPLETED' || match.is_finalized || match.status === 'COMPLETED') {
            setIsLocked(true);
          }
        } else if (!assignmentIdParam) {
          throw new Error('This project is not assigned to your judging queue.');
        }

        // Initialize score map with default 0 or existing
        const initialScores: Record<string, number> = {};
        r.criteria.forEach(c => {
          initialScores[c.id] = c.max_score / 2; // default midpoint
        });
        setScores(initialScores);
      }
    } catch (err: any) {
      onNotification(err.message || 'Cannot access this project. You may not be assigned to evaluate it.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (criterionId: string, val: number, maxScore: number) => {
    if (isLocked) return;
    const clamped = Math.max(0, Math.min(val, maxScore));
    setScores(prev => ({ ...prev, [criterionId]: clamped }));
  };

  // Live Calculations
  const calculateTotals = () => {
    if (!rubric) return { rawTotal: 0, weightedTotal: 0 };
    let rawTotal = 0;
    let weightedTotal = 0;

    rubric.criteria.forEach(c => {
      const s = scores[c.id] || 0;
      rawTotal += s;
      const proportion = c.max_score > 0 ? (s / c.max_score) : 0;
      weightedTotal += (proportion * c.weight * 100);
    });

    return { rawTotal, weightedTotal };
  };

  const { rawTotal, weightedTotal } = calculateTotals();

  const handleSaveOrSubmit = async (finalize: boolean) => {
    if (!assignmentId) {
      onNotification('Assignment identifier missing', 'error');
      return;
    }

    if (finalize && !window.confirm('Submit final evaluation? Scores will be locked and factored into the cross-judge normalization run.')) {
      return;
    }

    setSubmitting(true);
    try {
      const criterionScores = Object.entries(scores).map(([cId, score]) => ({
        criterion_id: cId,
        raw_score: score
      }));

      await api.submitScore({
        assignment_id: assignmentId,
        criterion_scores: criterionScores,
        feedback: feedback.trim() || undefined,
        finalize
      });

      if (finalize) {
        setIsLocked(true);
        onNotification('Evaluation successfully finalized and locked!', 'success');
        navigate('/judge/dashboard');
      } else {
        onNotification('Evaluation draft saved.', 'success');
      }
    } catch (err: any) {
      onNotification(err.message || 'Failed to submit evaluation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <p>Loading project details and scoring rubric...</p>
      </div>
    );
  }

  if (!project || !rubric) {
    return (
      <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
        <AlertCircle size={36} color="var(--status-danger)" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Evaluation Not Permitted</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          This project is either not assigned to your judging panel or could not be loaded.
        </p>
        <Link to="/judge/dashboard" className="btn btn-secondary">Return to Queue</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '18px' }}>
        <Link to="/judge/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} /> Back to Judging Workstation
        </Link>
      </div>

      {/* Project Meta Card */}
      <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-blue">
                {project.track ? project.track.name : 'General Track'}
              </span>
              <span className="badge badge-neutral" style={{ textTransform: 'none' }}>
                Team: {project.team ? project.team.name : '—'}
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800 }}>{project.title}</h1>
            {project.tagline && <p style={{ fontSize: '14px', color: 'var(--brand-primary)', fontWeight: 600, marginTop: '4px' }}>{project.tagline}</p>}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: '13px', gap: '6px' }}>
                <GithubIcon size={14} /> Repository
              </a>
            )}
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '13px', gap: '6px' }}>
                <ExternalLink size={14} /> Live Demo
              </a>
            )}
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
          {project.description}
        </p>

        {Boolean(project.technologies) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(typeof project.technologies === 'string'
              ? project.technologies.split(',').map(t => t.trim()).filter(Boolean)
              : (Array.isArray(project.technologies) ? project.technologies : [])
            ).map((t: string, idx: number) => (
              <span key={idx} className="badge badge-neutral" style={{ textTransform: 'none', fontSize: '11px' }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rubric Evaluation Form */}
      <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={20} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Evaluation Rubric: {rubric.name}</h2>
          </div>
          {isLocked && (
            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} /> Evaluation Finalized & Locked
            </span>
          )}
        </div>

        {/* Live Score Summary Banner */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Raw Point Total</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {rawTotal.toFixed(1)} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ {rubric.criteria.reduce((s, c) => s + c.max_score, 0)} pts</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Normalized Weighted Score</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '2px' }}>
              {weightedTotal.toFixed(1)} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 100.0</span>
            </div>
          </div>
        </div>

        {/* Criteria Sliders / Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {rubric.criteria.map((c) => {
            const currentVal = scores[c.id] || 0;
            const weightPct = Math.round(c.weight * 100);

            return (
              <div
                key={c.id}
                style={{
                  padding: '20px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '15px' }}>{c.name}</span>
                    <span className="badge badge-neutral" style={{ marginLeft: '10px', fontSize: '11px' }}>
                      Weight: {weightPct}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {currentVal}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ {c.max_score}</span>
                  </div>
                </div>

                {c.description && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                    {c.description}
                  </p>
                )}

                {/* Range Slider & Number Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input
                    type="range"
                    min={0}
                    max={c.max_score}
                    step={0.5}
                    value={currentVal}
                    onChange={(e) => handleScoreChange(c.id, parseFloat(e.target.value), c.max_score)}
                    disabled={isLocked}
                    style={{ flex: 1, accentColor: 'var(--brand-primary)', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                  />
                  <input
                    type="number"
                    min={0}
                    max={c.max_score}
                    step={0.5}
                    value={currentVal}
                    onChange={(e) => handleScoreChange(c.id, parseFloat(e.target.value) || 0, c.max_score)}
                    disabled={isLocked}
                    className="input"
                    style={{ width: '70px', padding: '6px', textAlign: 'center' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Qualitative Feedback */}
        <div style={{ marginTop: '24px' }}>
          <label className="form-label" htmlFor="judgeFeedback">Private Feedback & Notes (for Organizer & Team)</label>
          <textarea
            id="judgeFeedback"
            className="textarea"
            rows={3}
            placeholder="Constructive feedback, technical strengths, or areas for improvement..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isLocked}
          />
        </div>

        {/* Form Submission Actions */}
        {!isLocked && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <button
              type="button"
              onClick={() => handleSaveOrSubmit(false)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              <Save size={15} /> Save Draft Evaluation
            </button>
            <button
              type="button"
              onClick={() => handleSaveOrSubmit(true)}
              className="btn btn-primary"
              disabled={submitting}
            >
              <CheckCircle2 size={15} /> {submitting ? 'Submitting...' : 'Finalize & Lock Score'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
