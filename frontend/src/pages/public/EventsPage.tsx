import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Event } from '../../types';
import {
  Calendar, Users, Trophy, Layers, Clock, ArrowRight,
  ShieldCheck, AlertCircle, Search
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const regStart = new Date(event.reg_start_date);
    const regEnd = new Date(event.reg_end_date);
    const subEnd = new Date(event.submission_end_date);
    const judgeEnd = new Date(event.judging_end_date);

    if (now < regStart) return { label: 'Upcoming', badge: 'badge-neutral' };
    if (now <= regEnd) return { label: 'Registration Open', badge: 'badge-success' };
    if (now <= subEnd) return { label: 'Hacking / Submissions Open', badge: 'badge-blue' };
    if (now <= judgeEnd) return { label: 'Under Judging', badge: 'badge-warning' };
    return { label: 'Completed', badge: 'badge-neutral' };
  };

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(filter.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="page-container" style={{ padding: '40px 24px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Explore Hackathons</h1>
          <p className="page-subtitle">
            Browse active and upcoming competitions managed on the HackJudge platform.
          </p>
        </div>

        {/* Filter Input */}
        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="input"
            placeholder="Search hackathons..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
          <p>Loading hackathon listings from local database...</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: '24px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', color: 'var(--status-danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <AlertCircle size={18} />
            <span>Unable to retrieve events</span>
          </div>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredEvents.length === 0 && (
        <div className="empty-state">
          <Calendar size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No hackathons found</h3>
          <p className="empty-state-desc">
            {filter ? 'No hackathons matched your search query.' : 'No events have been created in this database yet.'}
          </p>
          <Link to="/register" className="btn btn-primary">
            Host First Hackathon
          </Link>
        </div>
      )}

      {/* Event Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {filteredEvents.map((event) => {
          const status = getEventStatus(event);
          const totalPrize = event.prizes ? event.prizes.reduce((sum, p) => sum + (p.amount_usd || p.cash_value || 0), 0) : 0;

          return (
            <div key={event.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="panel-body" style={{ flex: 1 }}>
                {/* Status & Dates */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span className={`badge ${status.badge}`}>
                    {status.label}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={13} /> {event.min_team_size} - {event.max_team_size} members
                  </span>
                </div>

                {/* Title */}
                <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
                  <Link to={`/events/${event.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                    {event.title}
                  </Link>
                </h2>

                {/* Description */}
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: '20px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {event.description || 'Join builders worldwide to build next-generation applications.'}
                </p>

                {/* Tracks preview */}
                {event.tracks && event.tracks.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Tracks
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {event.tracks.map((t) => (
                        <span key={t.id} className="badge badge-neutral" style={{ textTransform: 'none', fontSize: '11px' }}>
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta Attributes */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '14px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Submission Due</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {new Date(event.submission_end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Prize Pool</span>
                    <span style={{ fontWeight: 700, color: 'var(--status-success)' }}>
                      {totalPrize > 0 ? `₹${totalPrize.toLocaleString()}` : 'Recognition & Trophies'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div style={{
                padding: '14px 20px',
                background: 'var(--bg-subtle)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomLeftRadius: 'var(--radius-lg)',
                borderBottomRightRadius: 'var(--radius-lg)'
              }}>
                <Link to={`/events/${event.id}/projects`} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  View Project Gallery
                </Link>
                <Link to={`/events/${event.id}`} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                  View Event <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
