import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { User } from '../../types';
import { Users, Shield, CheckCircle2 } from 'lucide-react';

interface AdminUsersPageProps {
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ onNotification }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.updateUser(userId, { role: newRole } as any);
      onNotification(`User role updated to ${newRole}!`, 'success');
      loadUsers();
    } catch (err: any) {
      onNotification(err.message || 'Failed to update role', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Accounts & Role Permissions</h1>
          <p className="page-subtitle">Assign system roles (Participant, Judge, Organizer, Admin) with immediate backend enforcement.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading user accounts...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Assign Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.full_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>@{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'ORGANIZER' ? 'badge-warning' : u.role === 'JUDGE' ? 'badge-blue' : 'badge-neutral'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="PARTICIPANT">Participant</option>
                        <option value="JUDGE">Judge</option>
                        <option value="ORGANIZER">Organizer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
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
