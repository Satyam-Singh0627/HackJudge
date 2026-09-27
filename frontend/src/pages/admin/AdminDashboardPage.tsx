import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { User, Event, AuditLog } from '../../types';
import { Shield, Users, Calendar, Cpu, FileText, ArrowRight } from 'lucide-react';

interface AdminDashboardPageProps {
  currentUser: User;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    setLoading(true);
    try {
      const [uList, evList, aList] = await Promise.all([
        api.listUsers().catch(() => []),
        api.listEvents().catch(() => []),
        api.getAuditLogs().catch(() => [])
      ]);
      setUsers(uList);
      setEvents(evList);
      setAuditLogs(aList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">Global System Administration</h1>
          <p className="page-subtitle">Platform health, global entity oversight, and highest-privilege controls.</p>
        </div>
        <span className="badge badge-danger" style={{ fontSize: '12px' }}>Superuser Authority</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-card-label">Total Users</div>
          <div className="stat-card-value">{users.length}</div>
          <div className="stat-card-meta">Across all roles</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Hackathons</div>
          <div className="stat-card-value">{events.length}</div>
          <div className="stat-card-meta">Created on platform</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Audit Log Count</div>
          <div className="stat-card-value">{auditLogs.length}</div>
          <div className="stat-card-meta">Security events logged</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">System Health</div>
          <div className="stat-card-value" style={{ color: 'var(--status-success)' }}>100%</div>
          <div className="stat-card-meta">All services operational</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>User Accounts</h3>
            <Link to="/admin/users" style={{ fontSize: '13px' }}>Manage Users</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.slice(0, 5).map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>{u.full_name} (@{u.username})</span>
                <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'ORGANIZER' ? 'badge-warning' : u.role === 'JUDGE' ? 'badge-blue' : 'badge-neutral'}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Recent Audit Activity</h3>
            <Link to="/admin/audit" style={{ fontSize: '13px' }}>View Full Audit Trail</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {auditLogs.slice(0, 5).map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>{a.action}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
