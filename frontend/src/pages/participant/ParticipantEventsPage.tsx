import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Event } from '../../types';
import { Calendar, Users, ArrowRight, ExternalLink, AlertCircle } from 'lucide-react';

export const ParticipantEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.listEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Registered Hackathons</h1>
          <p className="page-subtitle">Events and competitions you are actively enrolled in.</p>
        </div>
        <Link to="/events" className="btn btn-secondary">Explore More Hackathons</Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <Calendar size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No events registered</h3>
          <p className="empty-state-desc">You have not registered for any active competitions yet.</p>
          <Link to="/events" className="btn btn-primary">Browse Hackathons</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {events.map((ev) => (
            <div key={ev.id} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '8px' }}>Enrolled</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{ev.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Submission Cutoff: {new Date(ev.submission_end_date).toLocaleString()}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to={`/events/${ev.id}`} className="btn btn-secondary" style={{ fontSize: '13px' }}>
                  Event Details
                </Link>
                <Link to={`/events/${ev.id}/projects`} className="btn btn-secondary" style={{ fontSize: '13px' }}>
                  Public Gallery
                </Link>
                <Link to="/participant/project" className="btn btn-primary" style={{ fontSize: '13px' }}>
                  Submission
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
