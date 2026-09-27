import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import { Project, Comment, User, Event } from '../../types';
import {
  FolderGit2, ExternalLink, Heart, MessageSquare,
  Users, Layers, ArrowLeft, Send, AlertCircle, ShieldCheck
} from 'lucide-react';
import { GithubIcon } from '../../components/Icons';

interface ProjectDetailPageProps {
  currentUser: User | null;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ currentUser, onNotification }) => {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [voteCount, setVoteCount] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
      loadComments(projectId);
    }
  }, [projectId]);

  const loadProject = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getProject(id);
      setProject(data);
      if (data.event_id) {
        const ev = await api.getEvent(data.event_id).catch(() => null);
        if (ev) setEvent(ev);
      }
    } catch (err: any) {
      onNotification(err.message || 'Failed to load project details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (id: string) => {
    try {
      const data = await api.getComments(id);
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async () => {
    if (!currentUser) {
      onNotification('Please sign in to cast a community vote.', 'error');
      return;
    }
    if (!projectId) return;

    try {
      const res = await api.castVote(projectId);
      setVoteCount(prev => prev + 1);
      onNotification(res.message || 'Vote registered successfully!', 'success');
    } catch (err: any) {
      onNotification(err.message || 'Vote failed', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !projectId) return;
    if (!currentUser) {
      onNotification('Please sign in to post a comment.', 'error');
      return;
    }

    setSubmittingComment(true);
    try {
      const comm = await api.addComment(projectId, newComment.trim());
      setComments(prev => [comm, ...prev]);
      setNewComment('');
      onNotification('Comment posted successfully!', 'success');
    } catch (err: any) {
      onNotification(err.message || 'Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        <p>Loading project submission details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container" style={{ padding: '60px 24px' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <AlertCircle size={36} color="var(--status-danger)" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Project Not Found</h2>
          <p style={{ color: 'var(--text-muted)', margin: '8px 0 20px 0' }}>The requested submission could not be located.</p>
          <Link to="/events" className="btn btn-secondary">Browse Hackathons</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '40px 24px', maxWidth: '1000px' }}>
      {/* Back link */}
      <div style={{ marginBottom: '20px' }}>
        {project.event_id ? (
          <Link to={`/events/${project.event_id}/projects`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Back to Event Project Gallery
          </Link>
        ) : (
          <Link to="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Back to Events
          </Link>
        )}
      </div>

      {/* Main Project Card */}
      <div className="card" style={{ padding: '36px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-blue">
                {project.track ? project.track.name : 'General Competition'}
              </span>
              <span className="badge badge-neutral" style={{ textTransform: 'none' }}>
                Status: {project.submission?.status || project.submission_status || 'SUBMITTED'}
              </span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {project.title}
            </h1>
            {project.tagline && (
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--brand-primary)' }}>
                {project.tagline}
              </p>
            )}
          </div>

          {/* Voting Action */}
          <div>
            <button
              onClick={handleVote}
              className="btn btn-secondary"
              style={{ padding: '10px 18px', gap: '8px', fontWeight: 700 }}
              title="Support this project"
            >
              <Heart size={16} color="var(--status-danger)" />
              <span>Vote ({voteCount})</span>
            </button>
          </div>
        </div>

        {/* Project Links Row */}
        <div style={{ display: 'flex', gap: '16px', padding: '14px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', flexWrap: 'wrap' }}>
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '13px', gap: '6px' }}
            >
              <GithubIcon size={15} /> Source Code
            </a>
          )}
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ fontSize: '13px', gap: '6px' }}
            >
              <ExternalLink size={15} /> Live Demonstration
            </a>
          )}
        </div>

        {/* Description Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
            Project Overview & Architecture
          </h3>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {project.description}
          </div>
        </div>

        {/* Technologies */}
        {project.technologies && (
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Technologies & Stacks
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(typeof project.technologies === 'string' ? project.technologies.split(',') : []).map((tech, idx) => (
                <span key={idx} className="badge badge-neutral" style={{ textTransform: 'none', padding: '4px 10px', fontSize: '12px' }}>
                  {tech.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Team Details */}
        {project.team && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Team
            </h4>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {project.team.name}
            </div>
            {project.team.members && project.team.members.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {project.team.members.map((m) => (
                  <span key={m.id} className="badge badge-neutral" style={{ textTransform: 'none' }}>
                    <Users size={12} /> {m.user ? m.user.full_name : 'Member'} ({m.role})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Community Comments Section */}
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <MessageSquare size={20} color="var(--brand-primary)" />
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Community Feedback & Questions</h3>
        </div>

        {/* Post Comment Form */}
        <form onSubmit={handleAddComment} style={{ marginBottom: '28px' }}>
          <div className="form-group">
            <textarea
              className="textarea"
              rows={3}
              placeholder={currentUser ? "Leave feedback or ask a technical question..." : "Sign in to post a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!currentUser || submittingComment}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!currentUser || submittingComment || !newComment.trim()}
              style={{ fontSize: '13px' }}
            >
              <Send size={14} /> {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>

        {/* Comments List */}
        {comments.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            No comments posted yet. Be the first to share feedback!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comments.map((comm) => (
              <div key={comm.id} style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {comm.username || (comm.user ? comm.user.full_name : 'Community Member')}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {new Date(comm.created_at).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {comm.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
