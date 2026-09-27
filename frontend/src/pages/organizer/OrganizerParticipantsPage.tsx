import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { User } from '../../types';
import { Users, Mail, ShieldCheck } from 'lucide-react';

export const OrganizerParticipantsPage: React.FC = () => {
  const [participants, setParticipants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const data = await api.listUsers('PARTICIPANT');
      setParticipants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Enrolled Participants</h1>
          <p className="page-subtitle">Directory of registered builders competing in your hackathons.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading participants...</p>
        </div>
      ) : participants.length === 0 ? (
        <div className="empty-state">
          <Users size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No participants registered yet</h3>
          <p className="empty-state-desc">Share your hackathon registration URL to onboard developers.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Participant Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Bio / Skills</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.full_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>@{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-success">{u.role}</span></td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{u.bio || '—'}</td>
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
