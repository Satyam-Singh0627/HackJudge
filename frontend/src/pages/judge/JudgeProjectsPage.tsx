import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { JudgeDashboardData, Event } from '../../types';
import { FolderGit2, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export const JudgeProjectsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [dashData, setDashData] = useState<JudgeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const evList = await api.listEvents();
      setEvents(evList);
      if (evList.length > 0) {
        setSelectedEventId(evList[0].id);
        loadQueue(evList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async (evId: string) => {
    setLoading(true);
    try {
      const data = await api.getJudgeDashboard(evId);
      setDashData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const assigned = dashData?.assigned_projects || [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assigned Projects Queue</h1>
          <p className="page-subtitle">Submissions assigned to your judging panel for formal rubric evaluation.</p>
        </div>

        {events.length > 1 && (
          <select
            className="select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              loadQueue(e.target.value);
            }}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading assigned projects...</p>
        </div>
      ) : assigned.length === 0 ? (
        <div className="empty-state">
          <FolderGit2 size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No projects currently assigned</h3>
          <p className="empty-state-desc">The organizer has not allocated any entries to your panel yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Team</th>
                  <th>Track</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assigned.map((a) => {
                  const isDone = a.is_finalized || a.assignment_status === 'COMPLETED';
                  return (
                    <tr key={a.assignment_id}>
                      <td style={{ fontWeight: 700 }}>{a.title || a.project_title}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{a.team_name || '—'}</td>
                      <td>
                        <span className="badge badge-neutral" style={{ textTransform: 'none' }}>
                          {a.track_name || 'General'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isDone ? 'badge-success' : 'badge-warning'}`}>
                          {isDone ? 'Completed' : 'Pending Review'}
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
        </div>
      )}
    </div>
  );
};
