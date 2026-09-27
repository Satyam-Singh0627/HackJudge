import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { JudgeDashboardData, Event, User } from '../../types';
import {
  FolderGit2, CheckCircle2, Clock, BarChart3,
  ArrowRight, Scale, ShieldCheck, AlertCircle
} from 'lucide-react';

interface JudgeDashboardPageProps {
  currentUser: User;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const JudgeDashboardPage: React.FC<JudgeDashboardPageProps> = ({ currentUser, onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dashData, setDashData] = useState<JudgeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const evList = await api.listEvents();
      setEvents(evList);
      if (evList.length > 0) {
        setSelectedEvent(evList[0]);
        loadJudgeDashboard(evList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadJudgeDashboard = async (evId: string) => {
    setLoading(true);
    try {
      const data = await api.getJudgeDashboard(evId);
      setDashData(data);
    } catch (err: any) {
      onNotification(err.message || 'Failed to load assigned judge assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <p>Loading assigned judging workload...</p>
      </div>
    );
  }

  const assigned = dashData?.assigned_projects || [];
  const completed = assigned.filter(a => a.is_finalized || a.assignment_status === 'COMPLETED');
  const pending = assigned.filter(a => !(a.is_finalized || a.assignment_status === 'COMPLETED'));
  const progressPct = assigned.length > 0 ? Math.round((completed.length / assigned.length) * 100) : 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">Judge Workstation</h1>
          <p className="page-subtitle">
            Welcome, {currentUser.full_name}. You have strict, isolated access to your designated evaluation panel.
          </p>
        </div>

        {events.length > 1 && (
          <select
            className="select"
            style={{ width: 'auto' }}
            value={selectedEvent?.id || ''}
            onChange={(e) => {
              const ev = events.find(item => item.id === e.target.value);
              if (ev) {
                setSelectedEvent(ev);
                loadJudgeDashboard(ev.id);
              }
            }}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-card-label">Assigned Projects</div>
          <div className="stat-card-value">{assigned.length}</div>
          <div className="stat-card-meta">Allocated to you</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Pending Reviews</div>
          <div className="stat-card-value" style={{ color: pending.length > 0 ? 'var(--status-warning)' : 'var(--status-success)' }}>
            {pending.length}
          </div>
          <div className="stat-card-meta">Awaiting evaluation</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Completed Reviews</div>
          <div className="stat-card-value" style={{ color: 'var(--status-success)' }}>
            {completed.length}
          </div>
          <div className="stat-card-meta">Finalized scores</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Progress Percentage</div>
          <div className="stat-card-value" style={{ color: 'var(--brand-primary)' }}>
            {progressPct}%
          </div>
          <div className="stat-card-meta">Judging deadline: {selectedEvent?.judging_end_date ? new Date(selectedEvent.judging_end_date).toLocaleDateString() : 'Active'}</div>
        </div>
      </div>

      {/* Assigned Projects Table */}
      <div className="card">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderGit2 size={18} color="var(--brand-primary)" />
            <span style={{ fontWeight: 800, fontSize: '15px' }}>Assigned Project Queue</span>
          </div>
          <span className="badge badge-neutral">Role Isolated</span>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          {assigned.length === 0 ? (
            <div className="empty-state" style={{ border: 'none' }}>
              <Scale size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 12px auto' }} />
              <h3 className="empty-state-title">No projects assigned yet</h3>
              <p className="empty-state-desc">
                The hackathon organizer has not yet assigned any project submissions to your judging queue.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Team</th>
                    <th>Track</th>
                    <th>Evaluation Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assigned.map((a) => {
                    const isDone = a.is_finalized || a.assignment_status === 'COMPLETED';
                    return (
                      <tr key={a.assignment_id}>
                        <td style={{ fontWeight: 700 }}>
                          {a.title || a.project_title}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {a.team_name || '—'}
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ textTransform: 'none' }}>
                            {a.track_name || 'General'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${isDone ? 'badge-success' : 'badge-warning'}`}>
                            {isDone ? 'Evaluated' : 'Pending Review'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/judge/projects/${a.project_id}?assignment=${a.assignment_id}`}
                            className={`btn ${isDone ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                          >
                            {isDone ? 'View Score' : 'Evaluate'} <ArrowRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
