import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { Certificate } from '../../types';
import { Award, Search, Printer, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';

interface VerifyCertificatePageProps {
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const VerifyCertificatePage: React.FC<VerifyCertificatePageProps> = ({ onNotification }) => {
  const { identifier: paramIdentifier } = useParams<{ identifier?: string }>();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(paramIdentifier || '');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paramIdentifier) {
      setIdentifier(paramIdentifier);
      performVerification(paramIdentifier);
    }
  }, [paramIdentifier]);

  const performVerification = async (queryId: string) => {
    if (!queryId.trim()) return;
    setLoading(true);
    setCertificate(null);
    setValid(null);
    try {
      const res = await api.verifyCertificate(queryId.trim());
      setValid(res.valid);
      setMessage(res.message);
      if (res.valid && res.certificate) {
        setCertificate(res.certificate);
        onNotification('Authentic certificate record verified against database.', 'success');
      } else {
        onNotification(res.message || 'Certificate verification failed', 'error');
      }
    } catch (err: any) {
      setValid(false);
      setMessage(err.message || 'Record not found.');
      onNotification(err.message || 'Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    navigate(`/verify/${encodeURIComponent(identifier.trim())}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container" style={{ padding: '40px 24px', maxWidth: '960px' }}>
      {/* Search Bar Panel */}
      <div className="card" style={{ padding: '32px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--brand-primary-subtle)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Cryptographic Certificate Verification</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Inspect official, tamper-proof credentials issued by HackJudge
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <input
            className="input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Paste Certificate UUID (e.g. 550e8400-...) or SHA-256 hash..."
            required
            style={{ fontSize: '14px' }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            <Search size={15} /> {loading ? 'Checking...' : 'Verify Authenticity'}
          </button>
        </form>
      </div>

      {/* Verification Status Banner */}
      {valid !== null && (
        <div style={{ marginBottom: '28px' }}>
          {valid && certificate ? (
            <div style={{
              background: 'var(--status-success-bg)',
              border: '1px solid var(--status-success-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--status-success)' }}>
                <CheckCircle2 size={24} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>Official Certificate Verified Authentic</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Database record matches immutable verification hash.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handlePrint} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  <Printer size={14} /> Print Certificate
                </button>
                <a
                  href={`http://localhost:8000/api/certificates/${certificate.id}/html`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <ExternalLink size={14} /> Printable HTML View
                </a>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--status-danger)'
            }}>
              <AlertTriangle size={24} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '15px' }}>Record Not Found / Unverified</div>
                <div style={{ fontSize: '12px' }}>
                  {message || 'No official hackathon certificate matches the provided identifier.'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verified Certificate Display (High-Fidelity Printable Canvas) */}
      {valid && certificate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Printable HTML Certificate Card */}
          <div className="card" style={{
            padding: '48px 36px',
            border: '4px double #b45309',
            background: '#ffffff',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '2px', color: '#0f172a', marginBottom: '8px' }}>
              CERTIFICATE OF RECOGNITION
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748b', marginBottom: '32px' }}>
              This official document is proudly presented to
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b', borderBottom: '2px solid #e2e8f0', display: 'inline-block', padding: '0 40px 10px 40px', marginBottom: '24px' }}>
              {certificate.recipient_name}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '8px' }}>
              FOR OUTSTANDING ACHIEVEMENT: {certificate.achievement?.toUpperCase()}
            </div>
            <div style={{ fontSize: '15px', color: '#475569', marginBottom: '40px' }}>
              Conferred at {certificate.event_title || 'HackJudge Hackathon'}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '20px',
              textAlign: 'left',
              fontSize: '11px',
              color: '#64748b'
            }}>
              <div>
                <div><strong>Issue Date:</strong> {new Date(certificate.issue_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div style={{ marginTop: '3px' }}><strong>Certificate ID:</strong> <code style={{ color: '#0f172a' }}>{certificate.id}</code></div>
                <div style={{ marginTop: '3px' }}><strong>SHA-256 Hash:</strong> <code style={{ color: '#0f172a' }}>{certificate.verification_hash}</code></div>
              </div>
              <div style={{
                width: '72px',
                height: '72px',
                border: '2px solid #b45309',
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b45309',
                fontWeight: 800,
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                <span>HACKJUDGE</span>
                <span style={{ color: '#059669', fontSize: '8px' }}>VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Technical Metadata Panel */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Tamper-Proof Audit Attributes
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: 600 }}>RECIPIENT NAME</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{certificate.recipient_name}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: 600 }}>ACHIEVEMENT / RECOGNITION</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{certificate.achievement}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: 600 }}>CERTIFICATE UUID</span>
                <code style={{ fontSize: '12px' }}>{certificate.id}</code>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: 600 }}>CRYPTOGRAPHIC VERIFICATION HASH</span>
                <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{certificate.verification_hash}</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
