import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Rubric, RubricCriterion, Event } from '../../types';
import { Scale, Plus, Trash2, Save, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface OrganizerRubricsPageProps {
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const OrganizerRubricsPage: React.FC<OrganizerRubricsPageProps> = ({ onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [rubricName, setRubricName] = useState('Standard Hackathon Rubric');
  const [criteria, setCriteria] = useState<{ id?: string; name: string; description: string; weight: number; max_score: number }[]>([
    { name: 'Innovation & Novelty', description: 'Uniqueness of approach and creative problem solving', weight: 0.20, max_score: 10 },
    { name: 'Technical Implementation', description: 'Code architecture, execution completeness, and engineering depth', weight: 0.30, max_score: 10 },
    { name: 'Impact & Feasibility', description: 'Real-world utility and practical domain viability', weight: 0.20, max_score: 10 },
    { name: 'UX & Design', description: 'Clarity of interface, user flow, and interaction design', weight: 0.15, max_score: 10 },
    { name: 'Presentation & Demo', description: 'Pitch clarity and working demonstration quality', weight: 0.15, max_score: 10 },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const evList = await api.listEvents();
      setEvents(evList);
      if (evList.length > 0) {
        setSelectedEventId(evList[0].id);
        loadRubricForEvent(evList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRubricForEvent = async (evId: string) => {
    setLoading(true);
    try {
      const r = await api.getRubric(evId);
      if (r) {
        setRubric(r);
        setRubricName(r.name);
        setCriteria(r.criteria.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          weight: c.weight,
          max_score: c.max_score
        })));
      }
    } catch (err) {
      // Keep default criteria if no rubric exists
    } finally {
      setLoading(false);
    }
  };

  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const totalWeightPct = Math.round(totalWeight * 100);
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;

  const handleAddCriterion = () => {
    setCriteria(prev => [
      ...prev,
      { name: 'New Criterion', description: '', weight: 0.10, max_score: 10 }
    ]);
  };

  const handleRemoveCriterion = (idx: number) => {
    if (criteria.length <= 1) {
      onNotification('Rubric must have at least one criterion.', 'error');
      return;
    }
    setCriteria(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateCriterion = (idx: number, field: string, val: any) => {
    setCriteria(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSaveRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      onNotification('Please select a hackathon event.', 'error');
      return;
    }

    if (!isWeightValid) {
      onNotification(`Total criterion weight must sum exactly to 100% (currently ${totalWeightPct}%).`, 'error');
      return;
    }

    // Validate positive max scores
    for (const c of criteria) {
      if (c.max_score <= 0) {
        onNotification(`Maximum score for "${c.name}" must be greater than zero.`, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const saved = await api.createRubric({
        event_id: selectedEventId,
        name: rubricName.trim(),
        criteria: criteria.map(c => ({
          name: c.name.trim(),
          description: c.description.trim() || undefined,
          weight: c.weight,
          max_score: c.max_score
        }))
      });
      setRubric(saved);
      onNotification('Weighted rubric successfully validated and saved!', 'success');
    } catch (err: any) {
      onNotification(err.message || 'Failed to save rubric', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Visual Rubric Builder</h1>
          <p className="page-subtitle">Configure weighted criteria for blind judging panels. Backend validates 100% weight sum.</p>
        </div>

        {events.length > 1 && (
          <select
            className="select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              loadRubricForEvent(e.target.value);
            }}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        )}
      </div>

      <div className="card" style={{ padding: '28px' }}>
        <form onSubmit={handleSaveRubric}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <label className="form-label" htmlFor="rubricName">Rubric Title</label>
              <input
                id="rubricName"
                className="input"
                value={rubricName}
                onChange={(e) => setRubricName(e.target.value)}
                required
              />
            </div>

            {/* Total Weight Indicator */}
            <div style={{
              background: isWeightValid ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
              border: `1px solid ${isWeightValid ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: isWeightValid ? 'var(--status-success)' : 'var(--status-danger)' }}>
                Total Allocated Weight
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: isWeightValid ? 'var(--status-success)' : 'var(--status-danger)', marginTop: '2px' }}>
                {totalWeightPct}% / 100%
              </div>
            </div>
          </div>

          {/* Criteria List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {criteria.map((c, idx) => (
              <div
                key={idx}
                style={{
                  padding: '20px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>Criterion Name</label>
                    <input
                      className="input"
                      value={c.name}
                      onChange={(e) => handleUpdateCriterion(idx, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>Weight (0.01 - 1.0)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        step="0.05"
                        min="0.01"
                        max="1.0"
                        className="input"
                        value={c.weight}
                        onChange={(e) => handleUpdateCriterion(idx, 'weight', parseFloat(e.target.value) || 0)}
                        required
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {Math.round(c.weight * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>Max Score</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="input"
                      value={c.max_score}
                      onChange={(e) => handleUpdateCriterion(idx, 'max_score', parseFloat(e.target.value) || 10)}
                      required
                    />
                  </div>

                  <div style={{ paddingTop: '20px' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(idx)}
                      className="btn btn-subtle"
                      style={{ color: 'var(--status-danger)', padding: '8px' }}
                      title="Remove Criterion"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    className="input"
                    placeholder="Evaluation guidance or criterion description for judges..."
                    value={c.description}
                    onChange={(e) => handleUpdateCriterion(idx, 'description', e.target.value)}
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <button
              type="button"
              onClick={handleAddCriterion}
              className="btn btn-secondary"
            >
              <Plus size={15} /> Add Criterion
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !isWeightValid}
            >
              <Save size={15} /> {saving ? 'Validating & Saving...' : 'Save & Enforce Rubric'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
