import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { NormalizationRecord, Event } from '../../types';
import { Trophy, CheckCircle2, Lock, Globe, ExternalLink } from 'lucide-react';

interface OrganizerResultsPageProps {
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const OrganizerResultsPage: React.FC<OrganizerResultsPageProps> = ({ onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [results, setResults] = useState<NormalizationRecord[]>([]);
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
    try {
      const data = await api.getNormalizationResults(evId);
      setResults(data);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const activeEvent = events.find(e => e.id === selectedEventId);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Results & Public Standings</h1>
          <p className="page-subtitle">Inspect normalized standings and manage public results release.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
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

          {activeEvent && (
            <a
              href={`/events/${activeEvent.id}/results`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              <Globe size={14} /> View Public Results Page <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading results...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <Trophy size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No results to publish</h3>
          <p className="empty-state-desc">Run the normalization engine first from the Normalization page.</p>
          <Link to="/organizer/normalization" className="btn btn-primary">Go to Normalization</Link>
        </div>
      ) : (
        <div className="card">
          <div className="panel-header">
            <span style={{ fontWeight: 800, fontSize: '15px' }}>Official Final Standings (Calculated via Z-Score)</span>
            <span className="badge badge-success">Normalized</span>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                  <th>Project</th>
                  <th>Team</th>
                  <th style={{ textAlign: 'right' }}>Normalized Z-Score</th>
                  <th style={{ textAlign: 'right' }}>Evaluations Count</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={r.id}>
                    <td style={{ textAlign: 'center', fontWeight: 800 }}>
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${r.rank || idx + 1}`}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <Link to={`/projects/${r.project_id}`} style={{ color: 'var(--text-primary)' }}>
                        {r.project?.title || 'Project'}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.project?.team?.name || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand-primary)' }}>
                      {r.normalized_score.toFixed(3)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{r.evaluations_count}</td>
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
