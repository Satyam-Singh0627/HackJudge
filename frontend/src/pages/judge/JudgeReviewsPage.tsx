import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { JudgeDashboardData } from '../../types';
import { FileCheck2, ArrowRight } from 'lucide-react';

export const JudgeReviewsPage: React.FC = () => {
  const [dashData, setDashData] = useState<JudgeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const evList = await api.listEvents();
      if (evList.length > 0) {
        const data = await api.getJudgeDashboard(evList[0].id);
        setDashData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const assigned = dashData?.assigned_projects || [];
  const completed = assigned.filter(a => a.assignment_status === 'COMPLETED' || a.is_finalized || a.status === 'COMPLETED');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Evaluation Reviews</h1>
          <p className="page-subtitle">Submissions where you have submitted finalized rubric scores.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading evaluation records...</p>
        </div>
      ) : completed.length === 0 ? (
        <div className="empty-state">
          <FileCheck2 size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No completed reviews yet</h3>
          <p className="empty-state-desc">Evaluate assigned projects from your queue to populate your review history.</p>
          <Link to="/judge/projects" className="btn btn-primary">Go to Assigned Queue</Link>
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
                  <th>Evaluation State</th>
                  <th style={{ textAlign: 'right' }}>Score Record</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((a) => (
                  <tr key={a.assignment_id}>
                    <td style={{ fontWeight: 700 }}>{a.project_title || a.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.team_name}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'none' }}>
                        {a.track_name || 'General'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">Finalized & Locked</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/judge/projects/${a.project_id}?assignment=${a.assignment_id}`}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Inspect Submission
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
