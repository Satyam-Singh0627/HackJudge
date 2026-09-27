import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Event, Project, User, JudgeDashboardData } from '../../types';
import { Sliders, Users, FolderGit2, CheckCircle2, Play, Plus, ArrowRight } from 'lucide-react';

interface OrganizerAssignmentsPageProps {
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const OrganizerAssignmentsPage: React.FC<OrganizerAssignmentsPageProps> = ({ onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [judges, setJudges] = useState<User[]>([]);
  const [judgesPerProject, setJudgesPerProject] = useState(2);
  const [loading, setLoading] = useState(true);
  const [assigningAlgo, setAssigningAlgo] = useState(false);

  // Manual assign state
  const [manualJudgeId, setManualJudgeId] = useState('');
  const [manualProjectId, setManualProjectId] = useState('');
  const [assigningManual, setAssigningManual] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evList, judgeList] = await Promise.all([
        api.listEvents(),
        api.listUsers('JUDGE').catch(() => [])
      ]);
      setEvents(evList);
      setJudges(judgeList);

      if (evList.length > 0) {
        setSelectedEventId(evList[0].id);
        const projList = await api.listProjects(evList[0].id);
        setProjects(projList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = async (evId: string) => {
    setSelectedEventId(evId);
    setLoading(true);
    try {
      const projList = await api.listProjects(evId);
      setProjects(projList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAlgorithmicAssignment = async () => {
    if (!selectedEventId) return;
    if (judges.length === 0) {
      onNotification('No judges registered to assign.', 'error');
      return;
    }
    if (projects.length === 0) {
      onNotification('No projects available for judging assignment.', 'error');
      return;
    }

    setAssigningAlgo(true);
    try {
      const res = await api.assignJudgeAlgorithmic({
        event_id: selectedEventId,
        judges_per_project: judgesPerProject
      });
      onNotification(`Balanced assignment complete: generated assignments for ${res.length || 'all'} projects.`, 'success');
    } catch (err: any) {
      onNotification(err.message || 'Algorithmic assignment failed', 'error');
    } finally {
      setAssigningAlgo(false);
    }
  };

  const handleManualAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !manualJudgeId || !manualProjectId) {
      onNotification('Select both a project and a judge.', 'error');
      return;
    }

    setAssigningManual(true);
    try {
      await api.assignJudgeManual({
        event_id: selectedEventId,
        judge_id: manualJudgeId,
        project_id: manualProjectId
      });
      onNotification('Judge successfully assigned to project!', 'success');
      setManualJudgeId('');
      setManualProjectId('');
    } catch (err: any) {
      onNotification(err.message || 'Failed to assign judge', 'error');
    } finally {
      setAssigningManual(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Judge Panel & Workload Assignment</h1>
          <p className="page-subtitle">Distribute projects evenly to avoid grading fatigue and enforce blind review boundaries.</p>
        </div>

        {events.length > 1 && (
          <select
            className="select"
            value={selectedEventId}
            onChange={(e) => handleSelectEvent(e.target.value)}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Assignment Methods Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Method 1: Algorithmic Balanced Distribution */}
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Sliders size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Algorithmic Balanced Batch</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
            Evenly distributes submissions across all active judges with conflict-of-interest prevention and uniform workload distribution.
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="numJudges">Target Judges Per Submission</label>
            <input
              id="numJudges"
              type="number"
              min={1}
              max={10}
              className="input"
              value={judgesPerProject}
              onChange={(e) => setJudgesPerProject(parseInt(e.target.value) || 1)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Available Judges: {judges.length}</span>
            <span>Total Projects: {projects.length}</span>
          </div>

          <button
            onClick={handleAlgorithmicAssignment}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px' }}
            disabled={assigningAlgo || judges.length === 0 || projects.length === 0}
          >
            <Play size={14} /> {assigningAlgo ? 'Running Balanced Distribution...' : 'Run Balanced Assignment'}
          </button>
        </div>

        {/* Method 2: Manual Direct Assignment */}
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Plus size={20} color="var(--status-success)" />
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Manual Targeted Assignment</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
            Explicitly assign a specific domain expert or technical sponsor to review a candidate project.
          </p>

          <form onSubmit={handleManualAssignment}>
            <div className="form-group">
              <label className="form-label" htmlFor="manualSelectProj">Target Project</label>
              <select
                id="manualSelectProj"
                className="select"
                value={manualProjectId}
                onChange={(e) => setManualProjectId(e.target.value)}
                required
              >
                <option value="">Select candidate submission...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title} ({p.team?.name || 'No team'})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="manualSelectJudge">Assign Judge</label>
              <select
                id="manualSelectJudge"
                className="select"
                value={manualJudgeId}
                onChange={(e) => setManualJudgeId(e.target.value)}
                required
              >
                <option value="">Select official judge...</option>
                {judges.map(j => (
                  <option key={j.id} value={j.id}>{j.full_name} (@{j.username})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '16px' }}
              disabled={assigningManual || !manualProjectId || !manualJudgeId}
            >
              <Plus size={14} /> {assigningManual ? 'Assigning...' : 'Assign Judge Manually'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
