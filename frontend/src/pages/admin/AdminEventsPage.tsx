import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Event } from '../../types';
import { Calendar, ExternalLink } from 'lucide-react';

export const AdminEventsPage: React.FC = () => {
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
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Hackathons Oversight</h1>
          <p className="page-subtitle">Inspect and monitor all competitions hosted across the self-hosted instance.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading events...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Slug</th>
                  <th>Submissions Due</th>
                  <th>Judging Closes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 700 }}>{e.title}</td>
                    <td><code>{e.slug}</code></td>
                    <td style={{ fontSize: '13px' }}>{new Date(e.submission_end_date).toLocaleString()}</td>
                    <td style={{ fontSize: '13px' }}>{new Date(e.judging_end_date).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <a href={`/events/${e.id}`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        View Public Page
                      </a>
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
