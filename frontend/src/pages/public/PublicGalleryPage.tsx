import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import { ProjectPublic, Event, User } from '../../types';
import {
  FolderGit2, Search, ExternalLink, Heart, MessageSquare,
  Shuffle, ArrowUpDown, Filter, Layers, AlertCircle
} from 'lucide-react';
import { GithubIcon } from '../../components/Icons';

interface PublicGalleryPageProps {
  currentUser: User | null;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const PublicGalleryPage: React.FC<PublicGalleryPageProps> = ({ currentUser, onNotification }) => {
  const { eventId } = useParams<{ eventId: string }>();

  const [projects, setProjects] = useState<ProjectPublic[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [randomSeed, setRandomSeed] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'votes' | 'title'>('default');

  useEffect(() => {
    if (eventId) {
      loadEventAndGallery(eventId);
    }
  }, [eventId]);

  const loadEventAndGallery = async (evId: string, customSeed?: string) => {
    setLoading(true);
    try {
      const [evData, galData] = await Promise.all([
        api.getEvent(evId).catch(() => null),
        api.getPublicGallery(evId, {
          q: searchQuery || undefined,
          track_id: selectedTrack || undefined,
          tech: selectedTech || undefined,
          seed: customSeed !== undefined ? customSeed : randomSeed || undefined
        })
      ]);
      if (evData) setEvent(evData);
      setProjects(galData);
    } catch (err: any) {
      onNotification(err.message || 'Failed to load project gallery', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventId) {
      loadEventAndGallery(eventId);
    }
  };

  const handleShuffle = () => {
    const newSeed = Math.random().toString(36).substring(2, 9);
    setRandomSeed(newSeed);
    if (eventId) {
      loadEventAndGallery(eventId, newSeed);
    }
    onNotification('Project gallery display order randomized via seed.', 'success');
  };

  const handleVote = async (projId: string) => {
    if (!currentUser) {
      onNotification('Please sign in to cast a community vote.', 'error');
      return;
    }
    try {
      const res = await api.castVote(projId);
      onNotification(res.message || 'Vote registered successfully!', 'success');
      // Update local count
      setProjects(prev => prev.map(p => p.id === projId ? { ...p, votes_count: p.votes_count + 1 } : p));
    } catch (err: any) {
      onNotification(err.message || 'Vote could not be cast', 'error');
    }
  };

  const displayedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'votes') return b.votes_count - a.votes_count;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0; // default order from API / seed
  });

  return (
    <div className="page-container" style={{ padding: '40px 24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <Link to="/events" style={{ color: 'var(--text-muted)' }}>Events</Link>
            <span>/</span>
            {event && <Link to={`/events/${event.id}`} style={{ color: 'var(--text-muted)' }}>{event.title}</Link>}
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Project Gallery</span>
          </div>
          <h1 className="page-title">
            {event ? `${event.title} — Submissions` : 'Public Project Gallery'}
          </h1>
          <p className="page-subtitle">
            Browse confirmed entries, explore repositories, and participate in community voting.
          </p>
        </div>

        {/* Shuffle Button to prevent positional bias */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleShuffle}
            className="btn btn-secondary"
            title="Randomize gallery order to eliminate presentation bias"
          >
            <Shuffle size={14} /> Randomize Order
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '28px' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
          <div>
            <input
              type="text"
              className="input"
              placeholder="Search projects by title, tagline, or tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <select
              className="select"
              value={selectedTrack}
              onChange={(e) => {
                setSelectedTrack(e.target.value);
              }}
            >
              <option value="">All Tracks</option>
              {event?.tracks?.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              className="select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="default">Default (Fair Ordering)</option>
              <option value="votes">Most Community Votes</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '40px' }}>
            <Search size={15} /> Filter
          </button>
        </form>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
          <p>Loading confirmed project submissions from database...</p>
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="empty-state">
          <FolderGit2 size={40} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No projects found</h3>
          <p className="empty-state-desc">
            No submissions matched your filter criteria or no submissions have been finalized for this event yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {displayedProjects.map((project) => (
            <div key={project.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="panel-body" style={{ flex: 1 }}>
                {/* Track badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="badge badge-blue">
                    {project.track_name || 'General Track'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Team: {project.team_name}
                  </span>
                </div>

                {/* Project Title */}
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
                  <Link to={`/projects/${project.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                    {project.title}
                  </Link>
                </h3>

                {/* Tagline */}
                {project.tagline && (
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '10px' }}>
                    {project.tagline}
                  </p>
                )}

                {/* Description Snippet */}
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {project.description}
                </p>

                {/* Technologies */}
                {project.technologies && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {(typeof project.technologies === 'string' ? project.technologies.split(',') : []).map((t, idx) => (
                      <span key={idx} className="badge badge-neutral" style={{ textTransform: 'none', fontSize: '11px' }}>
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div style={{
                padding: '12px 20px',
                background: 'var(--bg-subtle)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomLeftRadius: 'var(--radius-lg)',
                borderBottomRightRadius: 'var(--radius-lg)'
              }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                      title="GitHub Repository"
                    >
                      <GithubIcon size={14} /> Code
                    </a>
                  )}
                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--brand-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                      title="Live Demo"
                    >
                      <ExternalLink size={14} /> Demo
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleVote(project.id)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px', gap: '5px' }}
                    title="Cast Community Vote"
                  >
                    <Heart size={13} color="var(--status-danger)" fill={project.votes_count > 0 ? "var(--status-danger)" : "none"} />
                    <span>{project.votes_count}</span>
                  </button>
                  <Link to={`/projects/${project.id}`} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    View Project
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
