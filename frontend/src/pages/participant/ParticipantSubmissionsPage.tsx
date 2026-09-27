import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Project, Event, User } from '../../types';
import { FileCheck2, FolderGit2, ArrowRight, ExternalLink } from 'lucide-react';

interface ParticipantSubmissionsPageProps {
  currentUser: User;
}

export const ParticipantSubmissionsPage: React.FC<ParticipantSubmissionsPageProps> = ({ currentUser }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await api.listProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Submission History & Status</h1>
          <p className="page-subtitle">Track project versions, confirmation timestamps, and review statuses.</p>
        </div>
        <Link to="/participant/project" className="btn btn-primary" style={{ fontSize: '13px' }}>
          Open Submission Editor
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading submission records...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FileCheck2 size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No submissions recorded</h3>
          <p className="empty-state-desc">You have not drafted or submitted any projects yet.</p>
          <Link to="/participant/project" className="btn btn-primary">Create First Submission</Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>
                      <Link to={`/projects/${p.id}`} style={{ color: 'var(--text-primary)' }}>
                        {p.title}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.team?.name || '—'}</td>
                    <td>
                      <span className={`badge ${(p.submission?.status || p.submission_status) === 'FINAL' ? 'badge-success' : 'badge-warning'}`}>
                        {p.submission?.status || p.submission_status || 'DRAFT'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(p.updated_at || p.created_at || Date.now()).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to="/participant/project" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        View / Edit
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
