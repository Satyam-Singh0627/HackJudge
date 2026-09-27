import React from 'react';
import { Settings, ShieldCheck, Database, Key } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Platform Configuration</h1>
          <p className="page-subtitle">Security parameters, cryptographic keys, and host runtime settings.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>Security & Token Settings</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>JWT Algorithm</span>
            <span style={{ fontWeight: 700 }}>HS256 (HMAC with SHA-256)</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Token Expiry Window</span>
            <span style={{ fontWeight: 700 }}>1440 Minutes (24 Hours)</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Password Hashing Algorithm</span>
            <span style={{ fontWeight: 700 }}>Bcrypt (Salted & Multi-Round)</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Certificate Verification Hashing</span>
            <span style={{ fontWeight: 700 }}>SHA-256 Hash Digest</span>
          </div>
        </div>
      </div>
    </div>
  );
};
