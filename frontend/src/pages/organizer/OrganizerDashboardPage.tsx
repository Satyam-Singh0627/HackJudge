import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Event, Project, Team, User } from '../../types';
import {
  Calendar, Users, FolderGit2, CheckCircle2,
  Clock, BarChart3, Scale, Cpu, Download,
  ArrowRight, ShieldCheck, Trophy, Layers
} from 'lucide-react';

interface OrganizerDashboardPageProps {
  currentUser: User;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const OrganizerDashboardPage: React.FC<OrganizerDashboardPageProps> = ({ currentUser, onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [judges, setJudges] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [evList, userList] = await Promise.all([
        api.listEvents(),
        api.listUsers('JUDGE').catch(() => [])
      ]);
      setEvents(evList);
      setJudges(userList);

      if (evList.length > 0) {
        const ev = evList[0];
        setSelectedEvent(ev);
        await loadEventStats(ev.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEventStats = async (evId: string) => {
    try {
      const [projList, teamList] = await Promise.all([
        api.listProjects(evId).catch(() => []),
        api.listTeams(evId).catch(() => [])
      ]);
      setProjects(projList);
      setTeams(teamList);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <p>Loading real-time organizer metrics from database...</p>
      </div>
    );
  }

  const finalizedProjects = projects.filter(p => p.submission_status === 'FINAL');
  const draftProjects = projects.filter(p => p.submission_status !== 'FINAL');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">Organizer Operations Dashboard</h1>
          <p className="page-subtitle">Real-time database metrics for competition lifecycle management.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {events.length > 1 && (
            <select
              className="select"
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const ev = events.find(item => item.id === e.target.value);
                if (ev) {
                  setSelectedEvent(ev);
                  loadEventStats(ev.id);
                }
              }}
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          )}

          <Link to="/organizer/events" className="btn btn-secondary">
            Configure Event
          </Link>
          <Link to="/organizer/normalization" className="btn btn-primary">
            Run Normalization <Cpu size={14} />
          </Link>
        </div>
      </div>

      {/* Real Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-card-label">Teams Formed</div>
          <div className="stat-card-value">{teams.length}</div>
          <div className="stat-card-meta">In current event</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Projects Created</div>
          <div className="stat-card-value">{projects.length}</div>
          <div className="stat-card-meta">{finalizedProjects.length} finalized & locked</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Active Judges</div>
          <div className="stat-card-value">{judges.length}</div>
          <div className="stat-card-meta">Panel workload active</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Voting Status</div>
          <div className="stat-card-value" style={{ color: selectedEvent?.voting_enabled ? 'var(--status-success)' : 'var(--text-muted)' }}>
            {selectedEvent?.voting_enabled ? 'Active' : 'Disabled'}
          </div>
          <div className="stat-card-meta">Anti-abuse constraints on</div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Submissions & Event Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Submissions Review */}
          <div className="card">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderGit2 size={18} color="var(--brand-primary)" />
                <span style={{ fontWeight: 800, fontSize: '15px' }}>Project Submissions Status</span>
              </div>
              <Link to="/organizer/projects" style={{ fontSize: '13px', fontWeight: 600 }}>View All ({projects.length})</Link>
            </div>

            <div className="panel-body" style={{ padding: 0 }}>
              {projects.length === 0 ? (
                <div className="empty-state" style={{ border: 'none' }}>
                  <FolderGit2 size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No projects submitted yet.</p>
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Team</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.slice(0, 5).map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 700 }}>{p.title}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{p.team?.name || '—'}</td>
                          <td>
                            <span className={`badge ${p.submission_status === 'FINAL' ? 'badge-success' : 'badge-warning'}`}>
                              {p.submission_status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link to={`/projects/${p.id}`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                              Inspect
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Ops Controls */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Judging & Scoring Workflow</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <Link to="/organizer/rubrics" className="card" style={{ padding: '16px', textDecoration: 'none', background: 'var(--bg-surface)' }}>
                <Scale size={20} color="var(--brand-primary)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>1. Rubric Builder</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Configure 100% weights</div>
              </Link>
              <Link to="/organizer/assignments" className="card" style={{ padding: '16px', textDecoration: 'none', background: 'var(--bg-surface)' }}>
                <Users size={20} color="var(--brand-primary)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>2. Balanced Assignment</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Algorithmic distribution</div>
              </Link>
              <Link to="/organizer/normalization" className="card" style={{ padding: '16px', textDecoration: 'none', background: 'var(--bg-surface)' }}>
                <Cpu size={20} color="var(--brand-primary)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>3. Score Normalization</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Z-Score ranking preview</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Deadlines, Export & Audit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Lifecycle Dates */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Lifecycle Deadlines
            </h4>
            {selectedEvent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Registration Ends</span>
                  <span style={{ fontWeight: 600 }}>{new Date(selectedEvent.reg_end_date).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Submissions Cutoff</span>
                  <span style={{ fontWeight: 600, color: 'var(--status-danger)' }}>{new Date(selectedEvent.submission_end_date).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Judging Concludes</span>
                  <span style={{ fontWeight: 600 }}>{new Date(selectedEvent.judging_end_date).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Results Release</span>
                  <span style={{ fontWeight: 600, color: 'var(--status-success)' }}>{new Date(selectedEvent.results_date).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No event selected.</p>
            )}
          </div>

          {/* Direct CSV Downloads */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Streaming CSV Data Exports
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href={api.getExportUrl('rankings', selectedEvent?.id)}
                download
                className="btn btn-secondary"
                style={{ fontSize: '12px', justifyContent: 'flex-start' }}
              >
                <Download size={13} /> Export Normalized Rankings
              </a>
              <a
                href={api.getExportUrl('scores', selectedEvent?.id)}
                download
                className="btn btn-secondary"
                style={{ fontSize: '12px', justifyContent: 'flex-start' }}
              >
                <Download size={13} /> Export Raw Judge Scores
              </a>
              <a
                href={api.getExportUrl('teams', selectedEvent?.id)}
                download
                className="btn btn-secondary"
                style={{ fontSize: '12px', justifyContent: 'flex-start' }}
              >
                <Download size={13} /> Export Teams & Members
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
