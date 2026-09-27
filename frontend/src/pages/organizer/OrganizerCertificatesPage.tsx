import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { User, Event, Certificate } from '../../types';
import { Award, ShieldCheck, Plus, CheckCircle2, ExternalLink } from 'lucide-react';

interface OrganizerCertificatesPageProps {
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const OrganizerCertificatesPage: React.FC<OrganizerCertificatesPageProps> = ({ onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [certType, setCertType] = useState('WINNER');
  const [achievement, setAchievement] = useState('1st Place - Grand Champion');
  const [issuing, setIssuing] = useState(false);
  const [issuedCert, setIssuedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [evList, userList] = await Promise.all([
        api.listEvents(),
        api.listUsers()
      ]);
      setEvents(evList);
      setUsers(userList);
      if (evList.length > 0) setSelectedEventId(evList[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !targetUserId || !achievement.trim()) return;

    setIssuing(true);
    try {
      const cert = await api.generateCertificate({
        user_id: targetUserId,
        event_id: selectedEventId,
        cert_type: certType,
        achievement: achievement.trim()
      });
      setIssuedCert(cert);
      onNotification(`Certificate generated with SHA-256 verification hash!`, 'success');
    } catch (err: any) {
      onNotification(err.message || 'Failed to issue certificate', 'error');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Digital Certificate Issuer</h1>
          <p className="page-subtitle">Generate cryptographically hashed certificates with XML-safe vector rendering.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Issuance Form */}
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Issue Official Credential</h3>
          <form onSubmit={handleIssueCertificate}>
            <div className="form-group">
              <label className="form-label">Event</label>
              <select className="select" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} required>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Recipient User</label>
              <select className="select" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} required>
                <option value="">Select recipient...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} (@{u.username})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Certificate Type</label>
              <select className="select" value={certType} onChange={(e) => setCertType(e.target.value)}>
                <option value="WINNER">Winner / Champion</option>
                <option value="RUNNER_UP">Runner Up / Track Winner</option>
                <option value="PARTICIPATION">Official Participation</option>
                <option value="JUDGE">Honorary Judge</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Achievement / Recognition Title</label>
              <input
                className="input"
                placeholder="e.g. 1st Place — AI & Systems Track"
                value={achievement}
                onChange={(e) => setAchievement(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={issuing || !targetUserId}>
              <Award size={15} /> {issuing ? 'Cryptographically Signing...' : 'Issue & Hash Certificate'}
            </button>
          </form>
        </div>

        {/* Issued Preview */}
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Latest Issued Certificate</h3>
          {issuedCert ? (
            <div>
              <div style={{ background: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '16px', color: 'var(--status-success)' }}>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>Successfully Created & Stored</div>
                <div style={{ fontSize: '12px' }}>Recipient: {issuedCert.recipient_name}</div>
              </div>

              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <div><strong>Achievement:</strong> {issuedCert.achievement}</div>
                <div><strong>UUID:</strong> <code>{issuedCert.id}</code></div>
                <div><strong>SHA-256:</strong> <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{issuedCert.verification_hash}</code></div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`/verify/${issuedCert.verification_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: '12px' }}
                >
                  <ShieldCheck size={13} /> Open Verification Page <ExternalLink size={12} />
                </a>
                <a
                  href={`http://localhost:8000/api/certificates/${issuedCert.id}/html`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px' }}
                >
                  Printable HTML View
                </a>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Fill in the form to generate a cryptographic certificate.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
