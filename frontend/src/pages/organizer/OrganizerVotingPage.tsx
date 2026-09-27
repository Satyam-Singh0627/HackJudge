import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Event } from '../../types';
import { Vote, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface OrganizerVotingPageProps {
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const OrganizerVotingPage: React.FC<OrganizerVotingPageProps> = ({ onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [stats, setStats] = useState<any>(null);
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
        loadStats(evList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (evId: string) => {
    setLoading(true);
    try {
      const s = await api.getVotingStats(evId);
      setStats(s);
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
          <h1 className="page-title">Community Voting & Anti-Abuse</h1>
          <p className="page-subtitle">Configure public voting periods, inspect ballot counts, and enforce integrity constraints.</p>
        </div>

        {events.length > 1 && (
          <select
            className="select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              loadStats(e.target.value);
            }}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-card-label">Total Votes Cast</div>
          <div className="stat-card-value">{stats?.total_votes || 0}</div>
          <div className="stat-card-meta">Recorded in database</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Unique Voters</div>
          <div className="stat-card-value">{stats?.unique_voters || 0}</div>
          <div className="stat-card-meta">Verified accounts</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Anti-Abuse Rule</div>
          <div className="stat-card-value" style={{ fontSize: '18px', color: 'var(--status-success)', marginTop: '8px' }}>Enforced</div>
          <div className="stat-card-meta">1 vote per user per project (DB unique)</div>
        </div>
      </div>

      <div className="card" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px' }}>Deterministic Anti-Abuse Guarantees</h3>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <li><strong>Database Compound Uniqueness:</strong> The relational database enforces a strict unique constraint on <code>(project_id, user_id)</code>. Duplicate votes are rejected at the database engine level with HTTP 400.</li>
          <li><strong>Self-Voting Prevention:</strong> Team members are strictly prevented from voting for their own team's submissions.</li>
          <li><strong>No Positional Bias:</strong> The public project gallery supports randomized presentation seeds so projects in alphabetical or early submission positions do not receive unfair visibility advantages.</li>
          <li><strong>Rate Limiting & Audit Logging:</strong> Every cast vote creates an immutable audit record containing actor ID, IP address, and timestamp.</li>
        </ul>
      </div>
    </div>
  );
};
