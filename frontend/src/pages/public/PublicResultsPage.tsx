import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import { NormalizationRecord, Event } from '../../types';
import { Trophy, Award, Lock, ArrowLeft, AlertCircle, Medal } from 'lucide-react';

export const PublicResultsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [results, setResults] = useState<NormalizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      loadResults(eventId);
    }
  }, [eventId]);

  const loadResults = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [evData, resData] = await Promise.all([
        api.getEvent(id).catch(() => null),
        api.getNormalizationResults(id).catch((err: any) => {
          if (err.message && (err.message.includes('not yet released') || err.message.includes('403') || err.message.includes('hidden'))) {
            setIsLocked(true);
            return [];
          }
          throw err;
        })
      ]);

      if (evData) setEvent(evData);
      setResults(resData);
    } catch (err: any) {
      setError(err.message || 'Failed to load event results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        <p>Loading published competition results...</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '40px 24px' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '20px' }}>
        {eventId && (
          <Link to={`/events/${eventId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Back to Event Overview
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {event ? `${event.title} — Official Standings` : 'Competition Results'}
          </h1>
          <p className="page-subtitle">
            Final rankings computed using cross-judge Z-score normalization to ensure grading fairness.
          </p>
        </div>
      </div>

      {/* Results Locked State */}
      {isLocked ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Lock size={26} color="var(--text-muted)" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
            Results Are Currently Hidden
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
            Judging evaluations are still underway or the organizer has not yet released the final standings for this event. Results will be published on{' '}
            {event?.results_date ? new Date(event.results_date).toLocaleString() : 'the scheduled release date'}.
          </p>
          <Link to={`/events/${eventId}`} className="btn btn-secondary">
            Return to Event Details
          </Link>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <Trophy size={40} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No normalized results published yet</h3>
          <p className="empty-state-desc">
            The organizer has not yet executed or published the final normalization run for this event.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Medal size={18} color="var(--status-warning)" />
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Official Final Standings</span>
            </div>
            <span className="badge badge-success">Results Released</span>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                  <th>Project Name</th>
                  <th>Team</th>
                  <th style={{ textAlign: 'right' }}>Normalized Z-Score</th>
                  <th style={{ textAlign: 'right' }}>Evaluations Count</th>
                  <th style={{ textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => {
                  const rank = r.normalized_rank || r.rank || idx + 1;
                  return (
                    <tr key={r.id}>
                      <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '16px' }}>
                        {rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : `#${rank}`}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        <Link to={`/projects/${r.project_id}`} style={{ color: 'var(--text-primary)' }}>
                          {r.project_title || r.project?.title || 'Project Submission'}
                        </Link>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {r.track_name || r.project?.team?.name || '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                        {(r.normalized_score ?? r.normalized_z_score ?? 0).toFixed(3)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        {r.evaluations_count}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link to={`/projects/${r.project_id}`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
