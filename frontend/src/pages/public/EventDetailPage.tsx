import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { Event, User } from '../../types';
import {
  Calendar, Clock, Users, Trophy, Layers, CheckCircle2,
  AlertCircle, ArrowRight, ExternalLink, Scale, ShieldCheck
} from 'lucide-react';

interface EventDetailPageProps {
  currentUser: User | null;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({ currentUser, onNotification }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'tracks' | 'prizes' | 'rules' | 'faq'>('overview');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEvent(eventId);
    }
  }, [eventId]);

  const loadEvent = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEvent(id);
      setEvent(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!currentUser) {
      navigate(`/login?redirect=/events/${eventId}`);
      return;
    }
    if (!eventId) return;

    setRegistering(true);
    try {
      await api.registerForEvent(eventId);
      onNotification('Successfully registered for hackathon!', 'success');
      navigate('/participant/team');
    } catch (err: any) {
      onNotification(err.message || 'Registration failed', 'error');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        <p>Loading hackathon details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="page-container" style={{ padding: '60px 24px' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <AlertCircle size={36} color="var(--status-danger)" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Event Not Found</h2>
          <p style={{ color: 'var(--text-muted)', margin: '8px 0 20px 0' }}>{error || 'Unable to retrieve hackathon details.'}</p>
          <Link to="/events" className="btn btn-secondary">Back to Events Directory</Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const regEnd = new Date(event.reg_end_date);
  const subEnd = new Date(event.submission_end_date);
  const resultsDate = new Date(event.results_date);

  const isRegistrationOpen = now <= regEnd;
  const isSubmissionOpen = now <= subEnd;
  const isResultsReleased = now >= resultsDate;

  return (
    <div className="page-container" style={{ padding: '40px 24px' }}>
      {/* Event Header Banner */}
      <div className="card" style={{ padding: '36px', marginBottom: '32px', background: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span className={`badge ${isRegistrationOpen ? 'badge-success' : isSubmissionOpen ? 'badge-blue' : 'badge-neutral'}`}>
                {isRegistrationOpen ? 'Registration Open' : isSubmissionOpen ? 'Submissions Open' : 'Under Judging / Completed'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Slug: {event.slug}
              </span>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              {event.title}
            </h1>

            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '700px' }}>
              {event.description || 'Welcome to this competition managed and judged on the HackJudge platform.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
            {isRegistrationOpen ? (
              <button
                onClick={handleRegister}
                className="btn btn-primary"
                style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 700 }}
                disabled={registering}
              >
                {registering ? 'Registering...' : currentUser ? 'Register for Event' : 'Sign In to Register'} <ArrowRight size={15} />
              </button>
            ) : isSubmissionOpen ? (
              <Link to="/participant/project" className="btn btn-primary" style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 700 }}>
                Submit Project <ArrowRight size={15} />
              </Link>
            ) : (
              <Link to={`/events/${event.id}/results`} className="btn btn-secondary" style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 700 }}>
                View Final Results <Trophy size={15} />
              </Link>
            )}

            <Link to={`/events/${event.id}/projects`} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '13px' }}>
              Browse Public Gallery <ExternalLink size={13} />
            </Link>
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registration Deadline</div>
            <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
              {new Date(event.reg_end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submissions Due</div>
            <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
              {new Date(event.submission_end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Team Limits</div>
            <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
              {event.min_team_size} – {event.max_team_size} members
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Community Voting</div>
            <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px', color: event.voting_enabled ? 'var(--status-success)' : 'var(--text-muted)' }}>
              {event.voting_enabled ? 'Active / Enabled' : 'Disabled'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={`tab-item ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
          Timeline
        </button>
        <button className={`tab-item ${activeTab === 'tracks' ? 'active' : ''}`} onClick={() => setActiveTab('tracks')}>
          Tracks ({event.tracks ? event.tracks.length : 0})
        </button>
        <button className={`tab-item ${activeTab === 'prizes' ? 'active' : ''}`} onClick={() => setActiveTab('prizes')}>
          Prizes ({event.prizes ? event.prizes.length : 0})
        </button>
        <button className={`tab-item ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>
          Rules & Requirements
        </button>
        <button className={`tab-item ${activeTab === 'faq' ? 'active' : ''}`} onClick={() => setActiveTab('faq')}>
          FAQ
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>About the Hackathon</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
              {event.description || 'This hackathon brings builders together to tackle challenging domain problems. All projects submitted undergo structured rubric evaluation by verified judges, followed by cross-judge Z-score normalization.'}
            </p>

            <h4 style={{ fontSize: '15px', fontWeight: 700, marginTop: '24px', marginBottom: '10px' }}>Judging & Normalization Philosophy</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              HackJudge uses an open, mathematical evaluation system. Rather than averaging subjective scores, judge variance is normalized across panels so participants are evaluated strictly on merit.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px' }}>
              {currentUser?.role === 'PARTICIPANT' ? (
                <>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Participant Actions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link to="/participant/team" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <Users size={15} /> Create or Join Team
                    </Link>
                    <Link to="/participant/project" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <Layers size={15} /> Draft Submission
                    </Link>
                    <Link to={`/events/${event.id}/projects`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <CheckCircle2 size={15} /> Public Project Gallery
                    </Link>
                  </div>
                </>
              ) : currentUser?.role === 'JUDGE' ? (
                <>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Judge Workstation</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link to="/judge/dashboard" className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <Scale size={15} /> Go to Judge Dashboard
                    </Link>
                    <Link to="/judge/projects" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <CheckCircle2 size={15} /> Assigned Projects Queue
                    </Link>
                  </div>
                </>
              ) : currentUser?.role === 'ORGANIZER' ? (
                <>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Organizer Controls</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link to="/organizer/dashboard" className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <ShieldCheck size={15} /> Organizer Operations
                    </Link>
                    <Link to="/organizer/projects" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <Layers size={15} /> Review All Projects
                    </Link>
                  </div>
                </>
              ) : currentUser?.role === 'ADMIN' ? (
                <>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>System Admin</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link to="/admin/dashboard" className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <ShieldCheck size={15} /> Admin Console
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Get Started</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link to={`/login?redirect=/events/${event.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Sign In to Participate
                    </Link>
                    <Link to="/register" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      Create New Account
                    </Link>
                    <Link to={`/events/${event.id}/projects`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', marginTop: '6px' }}>
                      <CheckCircle2 size={15} /> Browse Project Gallery
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={18} color="var(--brand-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Integrity Guaranteed</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Submissions are locked at the deadline. Judge evaluations are isolated to prevent panel collusion.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>Hackathon Milestones</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { label: 'Registration Window', start: event.reg_start_date, end: event.reg_end_date },
              { label: 'Hacking & Project Submission', start: event.submission_start_date, end: event.submission_end_date },
              { label: 'Rubric Judging Period', start: event.judging_start_date, end: event.judging_end_date },
              { label: 'Final Results & Normalization Release', start: event.results_date, end: event.results_date }
            ].map((m, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brand-primary-subtle)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{m.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Starts: {new Date(m.start).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Deadline</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    {new Date(m.end).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tracks' && (
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Competition Tracks</h3>
          {event.tracks && event.tracks.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {event.tracks.map((t) => (
                <div key={t.id} style={{ padding: '18px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {t.name}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {t.description || 'Projects focusing on this problem space will be grouped for focused judging.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Open track. All projects compete in the general category.</p>
          )}
        </div>
      )}

      {activeTab === 'prizes' && (
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Prizes & Awards</h3>
          {event.prizes && event.prizes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {event.prizes.map((p) => (
                <div key={p.id} style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Trophy size={18} color="var(--status-warning)" />
                    <span style={{ fontWeight: 800, fontSize: '16px' }}>{p.title}</span>
                  </div>
                  {(p.amount_usd || p.cash_value) ? (
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--status-success)', margin: '8px 0' }}>
                      ₹{(p.amount_usd || p.cash_value)?.toLocaleString()}
                    </div>
                  ) : null}
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {p.description || 'Awarded to the top submission based on verified judging rubrics.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Recognition certificates issued upon completion.</p>
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Rules & Submission Guidelines</h3>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li><strong>Team Limits:</strong> Teams must have between {event.min_team_size} and {event.max_team_size} members. Solo participation is permitted only if minimum size is 1.</li>
            <li><strong>Original Code:</strong> Projects must be authored during the hackathon period. Libraries, frameworks, and open-source tooling are permitted with attribution.</li>
            <li><strong>Strict Deadline Enforcement:</strong> Submissions must be finalized before the cutoff timestamp. Late submissions are automatically rejected by server logic.</li>
            <li><strong>Submission Deliverables:</strong> A valid public/inspectable code repository (GitHub/GitLab) and working demo URL are mandatory.</li>
            <li><strong>Judging Integrity:</strong> Judges conduct independent blind reviews using weighted rubrics. Attempts to contact or influence judges will result in disqualification.</li>
          </ul>
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Frequently Asked Questions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Can I edit my project after submitting?
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                You may save drafts and edit your project as many times as you like prior to the submission deadline. Once the deadline passes or you finalize, the entry is locked for judging.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                How does score normalization work?
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Because different judges have varying baselines (lenient vs tough), HackJudge calculates statistical Z-scores across each judge's assignments. This ensures rankings reflect relative quality rather than panel variance.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Are certificates cryptographically verifiable?
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Yes. Every certificate includes an immutable SHA-256 hash that anyone can independently verify on the public <Link to="/verify">/verify</Link> page.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
