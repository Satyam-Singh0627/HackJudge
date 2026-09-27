import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Event, NormalizationRecord, RankComparisonRecord } from '../../types';
import {
  Cpu, Play, ArrowUpDown, AlertCircle, CheckCircle2,
  HelpCircle, Download, Scale
} from 'lucide-react';

interface OrganizerNormalizationPageProps {
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const OrganizerNormalizationPage: React.FC<OrganizerNormalizationPageProps> = ({ onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [results, setResults] = useState<NormalizationRecord[]>([]);
  const [comparisons, setComparisons] = useState<RankComparisonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'comparison' | 'records' | 'math'>('comparison');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const evList = await api.listEvents();
      setEvents(evList);
      if (evList.length > 0) {
        setSelectedEventId(evList[0].id);
        loadNormalizationData(evList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadNormalizationData = async (evId: string) => {
    setLoading(true);
    try {
      const [resData, compData] = await Promise.all([
        api.getNormalizationResults(evId).catch(() => []),
        api.getNormalizationComparison(evId).catch(() => [])
      ]);
      setResults(resData);
      setComparisons(compData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunNormalization = async () => {
    if (!selectedEventId) return;
    if (!window.confirm('Execute mathematical cross-judge Z-score normalization? This will recalculate all normalized ranks and record an audit log.')) {
      return;
    }

    setRunning(true);
    try {
      const updated = await api.runNormalization(selectedEventId);
      setResults(updated);
      const updatedComp = await api.getNormalizationComparison(selectedEventId);
      setComparisons(updatedComp);
      onNotification(`Normalization executed! Processed ${updated.length} entries.`, 'success');
    } catch (err: any) {
      onNotification(err.message || 'Normalization run failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cross-Judge Score Normalization</h1>
          <p className="page-subtitle">
            Eliminates grading disparity between lenient and strict judges using transparent Z-scores.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {events.length > 1 && (
            <select
              className="select"
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                loadNormalizationData(e.target.value);
              }}
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleRunNormalization}
            className="btn btn-primary"
            disabled={running || !selectedEventId}
          >
            <Play size={14} /> {running ? 'Computing Z-Scores...' : 'Run Normalization Algorithm'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-item ${activeTab === 'comparison' ? 'active' : ''}`} onClick={() => setActiveTab('comparison')}>
          Rank Comparison (Raw vs Normalized)
        </button>
        <button className={`tab-item ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>
          Detailed Normalization Records
        </button>
        <button className={`tab-item ${activeTab === 'math' ? 'active' : ''}`} onClick={() => setActiveTab('math')}>
          Mathematical Methodology & Edge Cases
        </button>
      </div>

      {/* Tab 1: Comparison Matrix */}
      {activeTab === 'comparison' && (
        <div className="card">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpDown size={18} color="var(--brand-primary)" />
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Raw vs Normalized Ranking Shift</span>
            </div>
            <span className="badge badge-blue">Audit Logged</span>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            {comparisons.length === 0 ? (
              <div className="empty-state" style={{ border: 'none' }}>
                <Cpu size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 10px auto' }} />
                <h3 className="empty-state-title">No Normalization Executed Yet</h3>
                <p className="empty-state-desc">Click "Run Normalization Algorithm" to execute Z-score scaling and generate comparisons.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Team</th>
                    <th style={{ textAlign: 'center' }}>Raw Rank</th>
                    <th style={{ textAlign: 'right' }}>Raw Avg</th>
                    <th style={{ textAlign: 'center' }}>Normalized Rank</th>
                    <th style={{ textAlign: 'right' }}>Z-Score Total</th>
                    <th style={{ textAlign: 'center' }}>Rank Shift</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((c) => {
                    const shift = c.raw_rank - c.normalized_rank;
                    return (
                      <tr key={c.project_id}>
                        <td style={{ fontWeight: 700 }}>{c.project_title}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{c.team_name}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>#{c.raw_rank}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{c.raw_average.toFixed(1)}</td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--brand-primary)' }}>#{c.normalized_rank}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand-primary)' }}>
                          {c.normalized_score.toFixed(3)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {shift > 0 ? (
                            <span className="badge badge-success">+{shift} positions</span>
                          ) : shift < 0 ? (
                            <span className="badge badge-danger">{shift} positions</span>
                          ) : (
                            <span className="badge badge-neutral">No shift</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Detailed Records */}
      {activeTab === 'records' && (
        <div className="card">
          <div className="table-container">
            {results.length === 0 ? (
              <div className="empty-state" style={{ border: 'none' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No normalized records generated yet.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Project ID</th>
                    <th style={{ textAlign: 'right' }}>Normalized Z-Score</th>
                    <th style={{ textAlign: 'right' }}>Evaluations Count</th>
                    <th>Run Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 800 }}>#{r.rank || idx + 1}</td>
                      <td><code>{r.project_id}</code></td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand-primary)' }}>
                        {r.normalized_score.toFixed(4)}
                      </td>
                      <td style={{ textAlign: 'right' }}>{r.evaluations_count}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Mathematical Methodology */}
      {activeTab === 'math' && (
        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>
            Mathematical Specification: Cross-Judge Z-Score Normalization
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
            In traditional hackathon judging, participants evaluated by strict judges are unfairly penalized relative to those judged by lenient evaluators. HackJudge solves this through standard statistical normalization across each judge's assigned evaluations.
          </p>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px', fontFamily: 'monospace' }}>
            <div style={{ fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '8px' }}>
              Standard Formulation:
            </div>
            <div style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '12px' }}>
              z = (x - μ) / σ
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Where:<br />
              • <strong>x</strong> = Raw weighted score given by Judge J to Project P<br />
              • <strong>μ</strong> = Mean of all scores submitted by Judge J in this event<br />
              • <strong>σ</strong> = Sample standard deviation of scores submitted by Judge J
            </div>
          </div>

          <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>Edge Case Handling</h4>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li><strong>Zero Variance (σ = 0):</strong> If a judge awards identical scores to all submissions, σ is zero. The system avoids division-by-zero by setting z = 0 for all their reviews.</li>
            <li><strong>Small Sample Size:</strong> When a judge evaluates fewer than 3 projects, variance estimates are dampened toward the panel global mean to avoid amplification artifacts.</li>
            <li><strong>Missing Evaluations:</strong> Projects are evaluated based on the mean of available normalized Z-scores, preventing bias from unsubmitted reviews.</li>
          </ul>
        </div>
      )}
    </div>
  );
};
