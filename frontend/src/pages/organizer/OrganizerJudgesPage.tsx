import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { User } from '../../types';
import { UserCheck, UserPlus, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface OrganizerJudgesPageProps {
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const OrganizerJudgesPage: React.FC<OrganizerJudgesPageProps> = ({ onNotification }) => {
  const [judges, setJudges] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite judge form
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadJudges();
  }, []);

  const loadJudges = async () => {
    setLoading(true);
    try {
      const data = await api.listUsers('JUDGE');
      setJudges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.register({
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        role: 'JUDGE',
        bio: bio.trim() || undefined
      });
      onNotification(`Judge account for ${fullName} successfully created!`, 'success');
      setShowInviteModal(false);
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setBio('');
      loadJudges();
    } catch (err: any) {
      onNotification(err.message || 'Failed to create judge', 'error');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Judging Panel & Evaluators</h1>
          <p className="page-subtitle">Manage official judges, invite domain experts, and monitor workloads.</p>
        </div>

        <button onClick={() => setShowInviteModal(true)} className="btn btn-primary">
          <UserPlus size={15} /> Add Judge
        </button>
      </div>

      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Onboard Official Judge</h3>
            <form onSubmit={handleCreateJudge}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="input" placeholder="Dr. Alan Turing" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="input" placeholder="aturing" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="input" placeholder="alan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Domain Bio / Expertise</label>
                <textarea className="textarea" rows={2} placeholder="AI, Cryptography, Distributed Systems..." value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={inviting}>
                  {inviting ? 'Creating...' : 'Create Judge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading judges...</p>
        </div>
      ) : judges.length === 0 ? (
        <div className="empty-state">
          <UserCheck size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No judges registered</h3>
          <p className="empty-state-desc">Click "Add Judge" to onboard your evaluation panel.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Judge Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Domain Bio</th>
                  <th>Role State</th>
                </tr>
              </thead>
              <tbody>
                {judges.map((j) => (
                  <tr key={j.id}>
                    <td style={{ fontWeight: 700 }}>{j.full_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>@{j.username}</td>
                    <td>{j.email}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{j.bio || '—'}</td>
                    <td>
                      <span className="badge badge-blue">Official Judge</span>
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
