import React from 'react';
import { Settings, ShieldCheck, Database, Terminal } from 'lucide-react';

export const OrganizerSettingsPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hackathon Platform Settings</h1>
          <p className="page-subtitle">Self-hosted environment and storage parameters.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>Environment Diagnostics</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Deployment Architecture</span>
            <span style={{ fontWeight: 700 }}>Self-Hosted Docker Compose</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Offline Mode</span>
            <span className="badge badge-success">Active (Zero Cloud Auth)</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Normalization Method</span>
            <span style={{ fontWeight: 700 }}>Standard Z-Score (μ=0, σ=1)</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Certificate Vector Rendering</span>
            <span className="badge badge-success">XML-Escaped & Printable HTML</span>
          </div>
        </div>
      </div>
    </div>
  );
};
