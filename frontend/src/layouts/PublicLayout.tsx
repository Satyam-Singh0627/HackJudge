import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';
import { Award, Terminal, ExternalLink, LogIn, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';

interface PublicLayoutProps {
  currentUser: User | null;
  onLogout: () => void;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getDashboardRoute = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN': return '/admin/dashboard';
      case 'ORGANIZER': return '/organizer/dashboard';
      case 'JUDGE': return '/judge/dashboard';
      default: return '/participant/dashboard';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      {/* Top Navigation */}
      <header style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo & Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Award size={18} />
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                HackJudge
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <Link to="/#features" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Features</Link>
            <Link to="/#how-it-works" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>How It Works</Link>
            <Link to="/events" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Explore Hackathons</Link>
            <Link to="/verify" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Verify Certificate</Link>
            <Link to="/#self-hosted" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Open Source</Link>
          </nav>

          {/* Auth Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => navigate(getDashboardRoute(currentUser.role))}
                  className="btn btn-primary"
                  style={{ fontSize: '13px' }}
                >
                  Go to {currentUser.role} Portal <ArrowRight size={14} />
                </button>
                <button
                  onClick={onLogout}
                  className="btn btn-secondary"
                  style={{ fontSize: '13px' }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to="/login" className="btn btn-secondary" style={{ fontSize: '13px' }}>
                  <LogIn size={14} /> Sign In
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ fontSize: '13px' }}>
                  <UserPlus size={14} /> Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
        padding: '48px 24px 24px 24px',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '32px', marginBottom: '36px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Award size={20} color="var(--brand-primary)" />
                <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>HackJudge</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '340px', lineHeight: 1.6 }}>
                Open, Self-Hosted Hackathon Management & Judging. Built for organizers who demand transparent rubrics, balanced judge distribution, and mathematical Z-score score normalization.
              </p>
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <span className="badge badge-neutral" style={{ textTransform: 'none' }}>
                  <Terminal size={12} /> Docker Compose Ready
                </span>
                <span className="badge badge-neutral" style={{ textTransform: 'none' }}>
                  <ShieldCheck size={12} /> 100% Offline Capable
                </span>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: '12px' }}>
                Product
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><Link to="/events" style={{ color: 'var(--text-muted)' }}>Hackathon Discovery</Link></li>
                <li><Link to="/#features" style={{ color: 'var(--text-muted)' }}>Weighted Rubrics</Link></li>
                <li><Link to="/#features" style={{ color: 'var(--text-muted)' }}>Z-Score Normalization</Link></li>
                <li><Link to="/verify" style={{ color: 'var(--text-muted)' }}>Certificate Verification</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: '12px' }}>
                Portals
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><Link to="/login" style={{ color: 'var(--text-muted)' }}>Participant Portal</Link></li>
                <li><Link to="/login" style={{ color: 'var(--text-muted)' }}>Judge Portal</Link></li>
                <li><Link to="/login" style={{ color: 'var(--text-muted)' }}>Organizer Portal</Link></li>
                <li><Link to="/login" style={{ color: 'var(--text-muted)' }}>Admin Portal</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: '12px' }}>
                Open Source
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>Local REST API (Swagger)</a></li>
                <li><a href="http://localhost:8000/redoc" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>ReDoc Documentation</a></li>
                <li><Link to="/#self-hosted" style={{ color: 'var(--text-muted)' }}>Self-Hosting Guide</Link></li>
                <li><span style={{ color: 'var(--text-muted)' }}>MIT License</span></li>
              </ul>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              &copy; {new Date().getFullYear()} HackJudge. Open, Self-Hosted Hackathon Management & Judging.
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Zero Cloud Dependencies</span>
              <span>•</span>
              <span>PostgreSQL & SQLite Support</span>
              <span>•</span>
              <span>Offline First</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
