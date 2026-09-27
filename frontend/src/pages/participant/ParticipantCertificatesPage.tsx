import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Certificate, User } from '../../types';
import { Award, ShieldCheck, Printer, ExternalLink } from 'lucide-react';

interface ParticipantCertificatesPageProps {
  currentUser: User;
}

export const ParticipantCertificatesPage: React.FC<ParticipantCertificatesPageProps> = ({ currentUser }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const data = await api.getUserCertificates(currentUser.id);
      setCertificates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Digital Certificates & Credentials</h1>
          <p className="page-subtitle">Cryptographically verified proof of achievement issued to your account.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading digital certificates...</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="empty-state">
          <Award size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
          <h3 className="empty-state-title">No certificates issued yet</h3>
          <p className="empty-state-desc">
            Certificates are issued by hackathon organizers following evaluation and results publication.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {certificates.map((cert) => (
            <div key={cert.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--brand-primary-subtle)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={18} />
                </div>
                <div>
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>Official Credential</span>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
                    {cert.achievement}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5, flex: 1 }}>
                Issued for outstanding performance at <strong>{cert.event_title || 'Hackathon'}</strong>.
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginBottom: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div>Date: {new Date(cert.issue_date).toLocaleDateString()}</div>
                <div style={{ marginTop: '2px' }}>ID: <code style={{ fontSize: '10px' }}>{cert.id.substring(0, 16)}...</code></div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to={`/verify/${cert.verification_hash}`} className="btn btn-primary" style={{ flex: 1, fontSize: '12px', padding: '6px' }}>
                  <ShieldCheck size={13} /> Verify & View
                </Link>
                <a
                  href={`http://localhost:8000/api/certificates/${cert.id}/html`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                  title="Printable HTML"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
