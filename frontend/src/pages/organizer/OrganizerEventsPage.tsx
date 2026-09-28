import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Event } from '../../types';
import { Calendar, Plus, Save, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface OrganizerEventsPageProps {
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const OrganizerEventsPage: React.FC<OrganizerEventsPageProps> = ({ onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // New/Edit Event Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [regStart, setRegStart] = useState('');
  const [regEnd, setRegEnd] = useState('');
  const [subStart, setSubStart] = useState('');
  const [subEnd, setSubEnd] = useState('');
  const [judgeStart, setJudgeStart] = useState('');
  const [judgeEnd, setJudgeEnd] = useState('');
  const [resultsDate, setResultsDate] = useState('');
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.listEvents();
      setEvents(data);
    } catch (err: any) {
      onNotification(err.message || 'Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (ev: Event) => {
    setTitle(ev.title);
    setSlug(ev.slug);
    setDescription(ev.description);
    setRegStart(new Date(ev.reg_start_date).toISOString().slice(0, 16));
    setRegEnd(new Date(ev.reg_end_date).toISOString().slice(0, 16));
    setSubStart(new Date(ev.submission_start_date).toISOString().slice(0, 16));
    setSubEnd(new Date(ev.submission_end_date).toISOString().slice(0, 16));
    setJudgeStart(new Date(ev.judging_start_date).toISOString().slice(0, 16));
    setJudgeEnd(new Date(ev.judging_end_date).toISOString().slice(0, 16));
    setResultsDate(new Date(ev.results_date).toISOString().slice(0, 16));
    setMinTeamSize(ev.min_team_size);
    setMaxTeamSize(ev.max_team_size);
    setVotingEnabled(ev.voting_enabled);
    setEditingEventId(ev.id);
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setIsCreating(false);
    setTitle('');
    setSlug('');
    setDescription('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) {
      onNotification('Event title and slug are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const payload: Partial<Event> = {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || undefined,
        reg_start_date: regStart ? new Date(regStart).toISOString() : now.toISOString(),
        reg_end_date: regEnd ? new Date(regEnd).toISOString() : new Date(now.getTime() + 7 * 86400000).toISOString(),
        submission_start_date: subStart ? new Date(subStart).toISOString() : now.toISOString(),
        submission_end_date: subEnd ? new Date(subEnd).toISOString() : new Date(now.getTime() + 5 * 86400000).toISOString(),
        judging_start_date: judgeStart ? new Date(judgeStart).toISOString() : new Date(now.getTime() + 5 * 86400000).toISOString(),
        judging_end_date: judgeEnd ? new Date(judgeEnd).toISOString() : new Date(now.getTime() + 7 * 86400000).toISOString(),
        results_date: resultsDate ? new Date(resultsDate).toISOString() : new Date(now.getTime() + 8 * 86400000).toISOString(),
        min_team_size: minTeamSize,
        max_team_size: maxTeamSize,
        voting_enabled: votingEnabled
      };

      if (editingEventId) {
        const updated = await api.updateEventDetails(editingEventId, payload);
        setEvents(prev => prev.map(ev => ev.id === editingEventId ? updated : ev));
        cancelEdit();
        onNotification(`Event "${updated.title}" successfully updated!`, 'success');
      } else {
        const created = await api.createEvent(payload);
        setEvents(prev => [created, ...prev]);
        cancelEdit();
        onNotification(`Event "${created.title}" successfully created!`, 'success');
      }
    } catch (err: any) {
      onNotification(err.message || 'Failed to save event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Lifecycle Management</h1>
          <p className="page-subtitle">Configure competition rules, timeline windows, and participation parameters.</p>
        </div>

        <button
          onClick={() => {
            if (isCreating) {
              cancelEdit();
            } else {
              setIsCreating(true);
            }
          }}
          className="btn btn-primary"
        >
          <Plus size={15} /> {isCreating ? 'Cancel' : 'Create New Event'}
        </button>
      </div>

      {/* Creation/Edit Modal / Inline Form */}
      {(isCreating || editingEventId) && (
        <div className="card" style={{ padding: '28px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>{editingEventId ? 'Edit Event Details' : 'Create New Hackathon Event'}</h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="evTitle">Event Title</label>
                <input
                  id="evTitle"
                  className="input"
                  placeholder="e.g. AI Systems Hackathon 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="evSlug">URL Slug</label>
                <input
                  id="evSlug"
                  className="input"
                  placeholder="ai-systems-2026"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="evDesc">Description</label>
              <textarea
                id="evDesc"
                className="textarea"
                rows={3}
                placeholder="Comprehensive overview of challenge tracks, goals, and expectations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Registration Deadline</label>
                <input type="datetime-local" className="input" value={regEnd} onChange={(e) => setRegEnd(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Submission Deadline</label>
                <input type="datetime-local" className="input" value={subEnd} onChange={(e) => setSubEnd(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Judging Period End</label>
                <input type="datetime-local" className="input" value={judgeEnd} onChange={(e) => setJudgeEnd(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Results Release</label>
                <input type="datetime-local" className="input" value={resultsDate} onChange={(e) => setResultsDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'center', marginTop: '12px' }}>
              <div className="form-group">
                <label className="form-label">Min Team Size</label>
                <input type="number" min={1} max={10} className="input" value={minTeamSize} onChange={(e) => setMinTeamSize(parseInt(e.target.value) || 1)} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Team Size</label>
                <input type="number" min={1} max={20} className="input" value={maxTeamSize} onChange={(e) => setMaxTeamSize(parseInt(e.target.value) || 4)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                <input type="checkbox" id="evVoting" checked={votingEnabled} onChange={(e) => setVotingEnabled(e.target.checked)} />
                <label htmlFor="evVoting" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Enable Community Voting</label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button type="button" onClick={cancelEdit} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={15} /> {submitting ? 'Saving...' : 'Save Detailed Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <Calendar size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No events configured</h3>
          <p className="empty-state-desc">Create your first hackathon competition to begin registering participants.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {events.map((ev) => (
            <div key={ev.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className="badge badge-success">Active</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Slug: {ev.slug}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{ev.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '640px' }}>
                    {ev.description || 'Configured competition'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEdit(ev)} className="btn btn-secondary" style={{ fontSize: '12px' }}>
                    Edit Details
                  </button>
                  <a href={`/events/${ev.id}`} className="btn btn-secondary" style={{ fontSize: '12px' }}>
                    Public Page
                  </a>
                  <a href={`/organizer/rubrics`} className="btn btn-secondary" style={{ fontSize: '12px' }}>
                    Rubric
                  </a>
                  <a href={`/organizer/assignments`} className="btn btn-primary" style={{ fontSize: '12px' }}>
                    Judges
                  </a>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Submission Due</span>
                  <span style={{ fontWeight: 600 }}>{new Date(ev.submission_end_date).toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Judging Ends</span>
                  <span style={{ fontWeight: 600 }}>{new Date(ev.judging_end_date).toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Team Limits</span>
                  <span style={{ fontWeight: 600 }}>{ev.min_team_size} – {ev.max_team_size} members</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Community Voting</span>
                  <span style={{ fontWeight: 600, color: ev.voting_enabled ? 'var(--status-success)' : 'var(--text-muted)' }}>
                    {ev.voting_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
