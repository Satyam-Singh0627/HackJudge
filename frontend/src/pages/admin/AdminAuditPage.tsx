import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { AuditLog } from '../../types';
import { FileText, Download } from 'lucide-react';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
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
          <h1 className="page-title">Global Security Audit Log</h1>
          <p className="page-subtitle">Platform-wide immutable event logging with actor attribution and IP tracking.</p>
        </div>

        <a
          href={api.getExportUrl('audit')}
          download
          className="btn btn-secondary"
        >
          <Download size={14} /> Export Audit Log CSV
        </a>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading audit logs...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Actor ID</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(l.created_at).toLocaleString()}</td>
                    <td><span className="badge badge-neutral">{l.action}</span></td>
                    <td>{l.resource_type} {l.resource_id ? `(${l.resource_id.substring(0, 8)})` : ''}</td>
                    <td><code>{l.user_id ? l.user_id.substring(0, 12) + '...' : 'System'}</code></td>
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
