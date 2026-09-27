import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Team, Event } from '../../types';
import { Users, Copy } from 'lucide-react';

interface OrganizerTeamsPageProps {
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const OrganizerTeamsPage: React.FC<OrganizerTeamsPageProps> = ({ onNotification }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const evList = await api.listEvents();
      setEvents(evList);
      if (evList.length > 0) {
        setSelectedEventId(evList[0].id);
        loadTeams(evList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async (evId: string) => {
    setLoading(true);
    try {
      const data = await api.listTeams(evId);
      setTeams(data);
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
          <h1 className="page-title">Formed Teams & Rosters</h1>
          <p className="page-subtitle">Track team rosters, member counts, and invite codes.</p>
        </div>

        {events.length > 1 && (
          <select
            className="select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              loadTeams(e.target.value);
            }}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="empty-state">
          <Users size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No teams formed yet</h3>
          <p className="empty-state-desc">Participants will appear here once they form teams.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Members</th>
                  <th>Invite Code</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 700 }}>{t.name}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {t.members?.map(m => (
                          <span key={m.id} className="badge badge-neutral" style={{ textTransform: 'none', fontSize: '11px' }}>
                            {m.user?.full_name} ({m.role})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td><code>{t.invite_code}</code></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(t.created_at).toLocaleDateString()}
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
