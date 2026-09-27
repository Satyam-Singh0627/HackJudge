import React, { useState } from 'react';
import { api } from '../../api';
import { User } from '../../types';
import { Save } from 'lucide-react';

interface JudgeProfilePageProps {
  currentUser: User;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const JudgeProfilePage: React.FC<JudgeProfilePageProps> = ({ currentUser, onNotification }) => {
  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateUser(currentUser.id, { full_name: fullName.trim(), bio: bio.trim() });
      onNotification('Judge profile updated!', 'success');
    } catch (err: any) {
      onNotification(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Judge Profile</h1>
          <p className="page-subtitle">Your credentials and evaluating domain expertise.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="judgeUsername">Username</label>
            <input
              id="judgeUsername"
              className="input"
              value={currentUser.username}
              disabled
              style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="judgeRole">Role</label>
            <input
              id="judgeRole"
              className="input"
              value="Official Judge"
              disabled
              style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="judgeFullName">Full Name</label>
            <input
              id="judgeFullName"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="judgeBio">Domain Experience / Judging Bio</label>
            <textarea
              id="judgeBio"
              className="textarea"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Senior Engineer, ML Researcher, Product Specialist..."
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px' }}
            disabled={saving}
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save Judge Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};
