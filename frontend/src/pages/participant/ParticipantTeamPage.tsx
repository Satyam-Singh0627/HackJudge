import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Team, Event, User } from '../../types';
import {
  Users, UserPlus, Key, LogOut, CheckCircle2,
  AlertCircle, Copy, Shield, Trash2
} from 'lucide-react';

interface ParticipantTeamPageProps {
  currentUser: User;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const ParticipantTeamPage: React.FC<ParticipantTeamPageProps> = ({ currentUser, onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const evList = await api.listEvents();
      setEvents(evList);
      if (evList.length > 0) {
        setSelectedEventId(evList[0].id);
        loadTeamForEvent(evList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamForEvent = async (evId: string) => {
    setLoading(true);
    try {
      const myTeam = await api.getMyTeam(evId);
      setTeam(myTeam);
    } catch (err) {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !selectedEventId) return;

    setCreating(true);
    try {
      const newTeam = await api.createTeam({
        event_id: selectedEventId,
        name: teamName.trim(),
        description: teamDesc.trim() || undefined
      });
      setTeam(newTeam);
      setTeamName('');
      setTeamDesc('');
      onNotification(`Team "${newTeam.name}" created successfully!`, 'success');
    } catch (err: any) {
      onNotification(err.message || 'Failed to create team', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    try {
      const joinedTeam = await api.joinTeam(joinCode.trim());
      setTeam(joinedTeam);
      setJoinCode('');
      onNotification(`Joined team "${joinedTeam.name}"!`, 'success');
    } catch (err: any) {
      onNotification(err.message || 'Invalid or expired invite code', 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleCopyInvite = (code: string) => {
    navigator.clipboard.writeText(code);
    onNotification('Invite code copied to clipboard!', 'success');
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!team) return;
    if (!window.confirm('Are you sure you want to remove this member from the team?')) return;

    try {
      await api.removeTeamMember(team.id, memberUserId);
      onNotification('Member removed from team', 'success');
      loadTeamForEvent(selectedEventId);
    } catch (err: any) {
      onNotification(err.message || 'Failed to remove member', 'error');
    }
  };

  const activeEvent = events.find(e => e.id === selectedEventId);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Management</h1>
          <p className="page-subtitle">Form your squad, invite teammates, or join an existing team.</p>
        </div>

        {events.length > 1 && (
          <div>
            <select
              className="select"
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                loadTeamForEvent(e.target.value);
              }}
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading team configuration...</p>
        </div>
      ) : team ? (
        /* Team Overview Card */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-success">Active Team</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {activeEvent?.title}
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800 }}>{team.name}</h2>
                {team.description && (
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {team.description}
                  </p>
                )}
              </div>

              {/* Invite Code Box */}
              {team.invite_code && (
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Invite Code
                    </div>
                    <code style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                      {team.invite_code}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopyInvite(team.invite_code!)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    title="Copy Invite Code"
                  >
                    <Copy size={13} /> Copy
                  </button>
                </div>
              )}
            </div>

            {/* Team Members List */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
                  Team Members ({team.members ? team.members.length : 1} / {activeEvent?.max_team_size || 4})
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Limits: {activeEvent?.min_team_size || 1} to {activeEvent?.max_team_size || 4} members
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {team.members?.map((m) => {
                  const isLeader = m.role === 'LEADER';
                  const isSelf = m.user_id === currentUser.id;

                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '14px 18px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'var(--bg-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: 'var(--brand-primary)'
                        }}>
                          {m.user?.full_name ? m.user.full_name[0] : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>
                            {m.user?.full_name} {isSelf && '(You)'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            @{m.user?.username} • Joined {new Date(m.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`badge ${isLeader ? 'badge-blue' : 'badge-neutral'}`}>
                          {m.role}
                        </span>
                        {!isLeader && (
                          <button
                            onClick={() => handleRemoveMember(m.user_id)}
                            className="btn btn-subtle"
                            style={{ padding: '6px', color: 'var(--status-danger)' }}
                            title="Remove Member"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Team Formation / Join Card */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Create Team */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Users size={20} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Create New Team</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Form a squad as team leader. You will receive a unique invite code to share with teammates.
            </p>

            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label className="form-label" htmlFor="createTeamName">Team Name</label>
                <input
                  id="createTeamName"
                  className="input"
                  placeholder="e.g. Neural Dynamics"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="createTeamDesc">Team Focus (Optional)</label>
                <textarea
                  id="createTeamDesc"
                  className="textarea"
                  rows={2}
                  placeholder="Brief description of your focus or project concept..."
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '6px' }}
                disabled={creating || !teamName.trim()}
              >
                {creating ? 'Creating...' : 'Create Team'}
              </button>
            </form>
          </div>

          {/* Join Existing Team */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Key size={20} color="var(--status-success)" />
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Join Existing Team</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Have an invite code from your team leader? Enter it here to join their squad.
            </p>

            <form onSubmit={handleJoinTeam}>
              <div className="form-group">
                <label className="form-label" htmlFor="joinInviteCode">Invite Code</label>
                <input
                  id="joinInviteCode"
                  className="input"
                  placeholder="e.g. 7f8a9b2c"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '26px' }}
                disabled={joining || !joinCode.trim()}
              >
                {joining ? 'Joining...' : 'Join Team with Code'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
