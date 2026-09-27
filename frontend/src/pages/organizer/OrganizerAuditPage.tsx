import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { AuditLog } from '../../types';
import { FileText, ShieldCheck } from 'lucide-react';

export const OrganizerAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Audit Trail</h1>
          <p className="page-subtitle">Immutable chronological record of critical security and judging operations.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading audit trail...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <FileText size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No audit records found</h3>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Resource Type</th>
                  <th>Resource ID</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${
                        l.action.includes('NORMALIZATION') ? 'badge-blue' :
                        l.action.includes('LOGIN') ? 'badge-neutral' :
                        l.action.includes('REGISTER') ? 'badge-success' : 'badge-warning'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{l.resource_type}</td>
                    <td><code style={{ fontSize: '11px' }}>{l.resource_id ? l.resource_id.substring(0, 16) + '...' : '—'}</code></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.ip_address || '127.0.0.1'}</td>
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
