import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Event, NormalizationRecord } from '../../types';
import { Trophy, Medal, Lock, ArrowRight } from 'lucide-react';

export const ParticipantResultsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [results, setResults] = useState<NormalizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const evList = await api.listEvents();
      setEvents(evList);
      if (evList.length > 0) {
        setSelectedEventId(evList[0].id);
        loadResults(evList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (evId: string) => {
    setLoading(true);
    setIsLocked(false);
    try {
      const res = await api.getNormalizationResults(evId);
      setResults(res);
    } catch (err: any) {
      if (err.message && (err.message.includes('not yet released') || err.message.includes('403') || err.message.includes('hidden'))) {
        setIsLocked(true);
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const activeEvent = events.find(e => e.id === selectedEventId);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hackathon Results & Standings</h1>
          <p className="page-subtitle">Official final rankings computed via cross-judge normalization.</p>
        </div>

        {events.length > 1 && (
          <select
            className="select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              loadResults(e.target.value);
            }}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading results...</p>
        </div>
      ) : isLocked ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Lock size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Results Pending Release</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
            The judging panel is currently completing evaluations. Standings will become visible once the organizer officially publishes the final scores.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <Trophy size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No results published</h3>
          <p className="empty-state-desc">No normalization run has been recorded for this event yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                  <th>Project</th>
                  <th>Team</th>
                  <th style={{ textAlign: 'right' }}>Normalized Z-Score</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={r.id}>
                    <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '15px' }}>
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${r.normalized_rank || r.rank || idx + 1}`}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <Link to={`/projects/${r.project_id}`} style={{ color: 'var(--text-primary)' }}>
                        {r.project_title || r.project?.title || 'Project'}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.track_name || r.project?.team?.name || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                      {(r.normalized_score ?? r.normalized_z_score ?? 0).toFixed(3)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Link to={`/projects/${r.project_id}`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        View
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
