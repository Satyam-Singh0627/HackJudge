import React, { useState } from 'react';
import { api } from '../../api';
import { User } from '../../types';
import { UserCheck, Save, ShieldCheck } from 'lucide-react';

interface ParticipantProfilePageProps {
  currentUser: User;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const ParticipantProfilePage: React.FC<ParticipantProfilePageProps> = ({ currentUser, onNotification }) => {
  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateUser(currentUser.id, { full_name: fullName.trim(), bio: bio.trim() });
      onNotification('Profile details updated successfully!', 'success');
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
          <h1 className="page-title">User Profile</h1>
          <p className="page-subtitle">Manage your account identity and biography.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="profUsername">Username</label>
            <input
              id="profUsername"
              className="input"
              value={currentUser.username}
              disabled
              style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="profEmail">Email Address</label>
            <input
              id="profEmail"
              className="input"
              value={currentUser.email}
              disabled
              style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="profRole">Account Role</label>
            <input
              id="profRole"
              className="input"
              value={currentUser.role}
              disabled
              style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="profFullName">Full Name</label>
            <input
              id="profFullName"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="profBio">Bio & Skills</label>
            <textarea
              id="profBio"
              className="textarea"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Full-stack engineer, AI enthusiast..."
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px' }}
            disabled={saving}
          >
            <Save size={15} /> {saving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};
