import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { User, Event, Team, Project } from '../../types';
import {
  Calendar, Users, FolderGit2, Clock, CheckCircle2,
  AlertCircle, ArrowRight, ShieldCheck, Trophy
} from 'lucide-react';

interface ParticipantDashboardPageProps {
  currentUser: User;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const ParticipantDashboardPage: React.FC<ParticipantDashboardPageProps> = ({ currentUser, onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const evList = await api.listEvents();
      setEvents(evList);
      if (evList.length > 0) {
        const ev = evList[0];
        setActiveEvent(ev);
        const [myTeam, allProjects] = await Promise.all([
          api.getMyTeam(ev.id).catch(() => null),
          api.listProjects(ev.id).catch(() => [])
        ]);
        setTeam(myTeam);

        if (myTeam) {
          const myProj = allProjects.find(p => p.team_id === myTeam.id);
          if (myProj) setProject(myProj);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <p>Loading participant dashboard...</p>
      </div>
    );
  }

  const now = new Date();
  const subDeadline = activeEvent ? new Date(activeEvent.submission_end_date) : null;
  const isPastDeadline = subDeadline ? now > subDeadline : false;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Greeting */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">Welcome back, {currentUser.full_name}</h1>
          <p className="page-subtitle">
            Manage your team, track submission deadlines, and monitor evaluation progress.
          </p>
        </div>

        {activeEvent && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={`/events/${activeEvent.id}/projects`} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              Public Gallery
            </Link>
            <Link to="/participant/project" className="btn btn-primary" style={{ fontSize: '13px' }}>
              {project ? 'Edit Submission' : 'Create Project'} <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-card-label">Active Event</div>
          <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeEvent ? activeEvent.title : 'None registered'}
          </div>
          <div className="stat-card-meta">
            {activeEvent ? `Ends ${new Date(activeEvent.submission_end_date).toLocaleDateString()}` : '—'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Team Status</div>
          <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '8px', color: team ? 'var(--status-success)' : 'var(--status-warning)' }}>
            {team ? team.name : 'No Team Formed'}
          </div>
          <div className="stat-card-meta">
            {team ? `${team.members ? team.members.length : 1} Members` : 'Create or join a team'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Submission State</div>
          <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '8px', color: (project?.submission?.status || project?.submission_status) === 'FINAL' ? 'var(--status-success)' : 'var(--brand-primary)' }}>
            {project ? (project.submission?.status || project.submission_status || 'DRAFT') : 'Not Started'}
          </div>
          <div className="stat-card-meta">
            {isPastDeadline ? 'Submissions Closed' : 'Hacking In Progress'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Judging Progress</div>
          <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '8px', color: 'var(--text-secondary)' }}>
            {activeEvent && now > new Date(activeEvent.judging_start_date) ? 'Under Review' : 'Pending Judging'}
          </div>
          <div className="stat-card-meta">
            Cross-Judge Z-Score Normalization
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Project Card */}
          <div className="card">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderGit2 size={18} color="var(--brand-primary)" />
                <span style={{ fontWeight: 800, fontSize: '15px' }}>My Project Submission</span>
              </div>
              {project && (
                <span className={`badge ${(project.submission?.status || project.submission_status) === 'FINAL' ? 'badge-success' : 'badge-warning'}`}>
                  {project.submission?.status || project.submission_status || 'DRAFT'}
                </span>
              )}
            </div>

            <div className="panel-body">
              {project ? (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>{project.title}</h3>
                  {project.tagline && <p style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '12px' }}>{project.tagline}</p>}
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
                    {project.description}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: '12px' }}>
                        GitHub Repo
                      </a>
                    )}
                    {project.demo_url && (
                      <a href={project.demo_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '12px' }}>
                        Live Demo
                      </a>
                    )}
                    <Link to="/participant/project" className="btn btn-secondary" style={{ fontSize: '12px' }}>
                      Edit Project Details
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <FolderGit2 size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 12px auto' }} />
                  <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>No project created yet</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                    Form a team and initialize your hackathon submission before the deadline.
                  </p>
                  <Link to="/participant/project" className="btn btn-primary" style={{ fontSize: '13px' }}>
                    Initialize Project
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Team Members Card */}
          <div className="card">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--brand-primary)" />
                <span style={{ fontWeight: 800, fontSize: '15px' }}>My Team</span>
              </div>
              <Link to="/participant/team" style={{ fontSize: '13px', fontWeight: 600 }}>Manage Team</Link>
            </div>
            <div className="panel-body">
              {team ? (
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>{team.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {team.members?.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                        <span style={{ fontWeight: 600 }}>{m.user?.full_name} (@{m.user?.username})</span>
                        <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    You have not created or joined a team for this hackathon yet.
                  </p>
                  <Link to="/participant/team" className="btn btn-secondary" style={{ fontSize: '13px' }}>
                    Create or Join Team
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Status Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Timeline / Countdown */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Clock size={16} color="var(--brand-primary)" />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Submission Countdown</span>
            </div>
            {activeEvent ? (
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Due Date:</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', marginBottom: '12px' }}>
                  {new Date(activeEvent.submission_end_date).toLocaleString()}
                </div>
                {isPastDeadline ? (
                  <div style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600 }}>
                    Submissions are closed. Entries are locked for judging.
                  </div>
                ) : (
                  <div style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600 }}>
                    Hacking is active. You may edit drafts until the deadline.
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No active event timeline.</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="card" style={{ padding: '20px' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
              Participant Shortlinks
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <Link to="/participant/events" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>My Registered Events</span>
                <ArrowRight size={13} color="var(--text-muted)" />
              </Link>
              <Link to="/participant/certificates" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Earned Certificates</span>
                <ArrowRight size={13} color="var(--text-muted)" />
              </Link>
              <Link to="/participant/results" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Official Results</span>
                <ArrowRight size={13} color="var(--text-muted)" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
