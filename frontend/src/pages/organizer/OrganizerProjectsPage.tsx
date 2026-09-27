import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Project, Event } from '../../types';
import { FolderGit2, Search, ExternalLink, Filter } from 'lucide-react';
import { GithubIcon } from '../../components/Icons';

export const OrganizerProjectsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const evList = await api.listEvents();
      setEvents(evList);
      if (evList.length > 0) {
        setSelectedEventId(evList[0].id);
        loadProjects(evList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async (evId: string) => {
    setLoading(true);
    try {
      const data = await api.listProjects(evId);
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.team?.name && p.team.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || p.submission_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Project Submissions</h1>
          <p className="page-subtitle">Inspect and monitor participant project entries across the hackathon.</p>
        </div>

        {events.length > 1 && (
          <select
            className="select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              loadProjects(e.target.value);
            }}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <input
            type="text"
            className="input"
            placeholder="Search by project name or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Submission States</option>
            <option value="DRAFT">Draft</option>
            <option value="FINAL">Finalized & Locked</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading projects...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FolderGit2 size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No matching submissions found</h3>
          <p className="empty-state-desc">Try clearing your filters or check back once teams submit drafts.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Team</th>
                  <th>Track</th>
                  <th>Status</th>
                  <th>Repositories & Demos</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>
                      <Link to={`/projects/${p.id}`} style={{ color: 'var(--text-primary)' }}>
                        {p.title}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.team?.name || '—'}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'none' }}>
                        {p.track?.name || 'General'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.submission_status === 'FINAL' ? 'badge-success' : 'badge-warning'}`}>
                        {p.submission_status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {p.github_url && (
                          <a href={p.github_url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }} title="GitHub">
                            <GithubIcon size={14} />
                          </a>
                        )}
                        {p.demo_url && (
                          <a href={p.demo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)' }} title="Demo">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
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
        </div>
      )}
    </div>
  );
};
