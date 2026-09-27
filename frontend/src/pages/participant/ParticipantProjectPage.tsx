import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Project, Event, Team, User } from '../../types';
import {
  FolderGit2, Save, Send, Clock, CheckCircle2,
  AlertCircle, Lock, ExternalLink, Video
} from 'lucide-react';
import { GithubIcon } from '../../components/Icons';

interface ParticipantProjectPageProps {
  currentUser: User;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const ParticipantProjectPage: React.FC<ParticipantProjectPageProps> = ({ currentUser, onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [trackId, setTrackId] = useState('');
  const [techInput, setTechInput] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const evList = await api.listEvents();
      setEvents(evList);
      if (evList.length > 0) {
        const ev = evList[0];
        setSelectedEvent(ev);
        await loadProjectForEvent(ev.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectForEvent = async (evId: string) => {
    const myTeam = await api.getMyTeam(evId).catch(() => null);
    setTeam(myTeam);

    if (myTeam) {
      const allProjects = await api.listProjects(evId).catch(() => []);
      const myProj = allProjects.find(p => p.team_id === myTeam.id);
      if (myProj) {
        setProject(myProj);
        setTitle(myProj.title || '');
        setTagline(myProj.tagline || '');
        setDescription(myProj.description || '');
        setTrackId(myProj.track_id || '');
        setTechInput(myProj.technologies || '');
        setGithubUrl(myProj.github_url || '');
        setDemoUrl(myProj.demo_url || '');
      } else {
        setProject(null);
        setTitle('');
        setTagline('');
        setDescription('');
      }
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !team) {
      onNotification('You must form a team before initializing a project.', 'error');
      return;
    }
    if (!title.trim()) {
      onNotification('Project title is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Project> = {
        event_id: selectedEvent.id,
        team_id: team.id,
        title: title.trim(),
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        track_id: trackId || undefined,
        technologies: techInput.trim() || undefined,
        github_url: githubUrl.trim() || undefined,
        demo_url: demoUrl.trim() || undefined,
      };

      let saved: Project;
      if (project) {
        saved = await api.updateProject(project.id, payload);
      } else {
        saved = await api.createProject(payload);
      }

      setProject(saved);
      onNotification('Project draft saved successfully!', 'success');
    } catch (err: any) {
      onNotification(err.message || 'Failed to save project draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!project) return;
    if (!window.confirm('Are you sure you want to finalize this submission? Once finalized, your entry will be ready for the judging panel.')) return;

    setFinalizing(true);
    try {
      await api.finalizeSubmission(project.id);
      onNotification('Submission finalized! Your entry is officially locked and submitted.', 'success');
      if (selectedEvent) {
        loadProjectForEvent(selectedEvent.id);
      }
    } catch (err: any) {
      onNotification(err.message || 'Failed to finalize submission', 'error');
    } finally {
      setFinalizing(false);
    }
  };

  const now = new Date();
  const deadline = selectedEvent ? new Date(selectedEvent.submission_end_date) : null;
  const isPastDeadline = deadline ? now > deadline : false;
  const currentStatus = project?.submission?.status || project?.submission_status || 'DRAFT';
  const isFinalized = currentStatus === 'FINAL';

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Submission</h1>
          <p className="page-subtitle">Configure your project metadata, repository links, and finalize entry.</p>
        </div>

        {/* Status Badge */}
        {project && (
          <span className={`badge ${isFinalized ? 'badge-success' : 'badge-warning'}`}>
            Status: {currentStatus}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading project details...</p>
        </div>
      ) : !team ? (
        <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
          <AlertCircle size={36} color="var(--status-warning)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Team Required</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            To create or edit a project submission, you must first create or join a team for this hackathon.
          </p>
          <a href="/participant/team" className="btn btn-primary">Go to Team Management</a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Form */}
          <div className="card" style={{ padding: '28px' }}>
            <form onSubmit={handleSaveDraft}>
              <div className="form-group">
                <label className="form-label" htmlFor="projTitle">Project Title</label>
                <input
                  id="projTitle"
                  className="input"
                  placeholder="e.g. Agentic Health Scanner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPastDeadline || isFinalized}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="projTagline">Short Tagline</label>
                <input
                  id="projTagline"
                  className="input"
                  placeholder="One sentence describing what your project does"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  disabled={isPastDeadline || isFinalized}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="projTrack">Competition Track</label>
                <select
                  id="projTrack"
                  className="select"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  disabled={isPastDeadline || isFinalized}
                >
                  <option value="">General Track (Default)</option>
                  {selectedEvent?.tracks?.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="projDesc">Detailed Description & Architecture</label>
                <textarea
                  id="projDesc"
                  className="textarea"
                  rows={6}
                  placeholder="Explain problem statement, technical architecture, and implementation details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPastDeadline || isFinalized}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="projTech">Technologies Used (comma separated)</label>
                <input
                  id="projTech"
                  className="input"
                  placeholder="React, FastAPI, SQLite, Docker, Python"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  disabled={isPastDeadline || isFinalized}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="projGithub">GitHub / Code URL</label>
                  <input
                    id="projGithub"
                    type="url"
                    className="input"
                    placeholder="https://github.com/org/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    disabled={isPastDeadline || isFinalized}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="projDemo">Demo / Video URL</label>
                  <input
                    id="projDemo"
                    type="url"
                    className="input"
                    placeholder="https://demo.example.com"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    disabled={isPastDeadline || isFinalized}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={saving || isPastDeadline || isFinalized}
                >
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Draft'}
                </button>

                {project && !isFinalized && !isPastDeadline && (
                  <button
                    type="button"
                    onClick={handleFinalize}
                    className="btn btn-primary"
                    disabled={finalizing}
                  >
                    <Send size={15} /> {finalizing ? 'Finalizing...' : 'Finalize & Submit'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Submission Guidance & Deadline Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock size={16} color="var(--brand-primary)" />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Submission Cutoff</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Deadline: {selectedEvent?.submission_end_date ? new Date(selectedEvent.submission_end_date).toLocaleString() : 'N/A'}
              </div>
              {isPastDeadline ? (
                <div style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600 }}>
                  Submissions are closed. Backend rejects modifications after the cutoff.
                </div>
              ) : isFinalized ? (
                <div style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600 }}>
                  Your submission is finalized and queued for judge evaluation!
                </div>
              ) : (
                <div style={{ background: 'var(--brand-primary-subtle)', color: 'var(--brand-primary)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600 }}>
                  Draft mode active. Remember to finalize before the deadline!
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Submission Checklist
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color={title ? "var(--status-success)" : "var(--text-tertiary)"} />
                  Project Title & Tagline
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color={description ? "var(--status-success)" : "var(--text-tertiary)"} />
                  Architecture Overview
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color={githubUrl ? "var(--status-success)" : "var(--text-tertiary)"} />
                  Public Code Repository
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color={demoUrl ? "var(--status-success)" : "var(--text-tertiary)"} />
                  Working Demo Link
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
