import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { User } from '../../types';
import { Award, UserPlus, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

interface RegisterPageProps {
  onLoginSuccess: (user: User) => void;
  onNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onLoginSuccess, onNotification }) => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'PARTICIPANT' | 'JUDGE'>('PARTICIPANT');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      setError('Please fill out all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.register({
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        role,
        bio: bio.trim() || undefined
      });

      // Automatically sign in upon successful registration
      const res = await api.login(username.trim(), password);
      onLoginSuccess(res.user);
      onNotification(`Welcome to HackJudge, ${res.user.full_name}! Account created.`, 'success');

      if (res.user.role === 'JUDGE') {
        navigate('/judge/dashboard');
      } else {
        navigate('/participant/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Username or email may already be registered.');
      onNotification(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px - 140px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      background: 'var(--bg-surface)'
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div className="card" style={{ padding: '36px 32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'var(--brand-primary)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Award size={24} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Create your HackJudge Account
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Join the self-hosted platform to build or evaluate hackathons
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{
              background: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--status-danger)',
              fontSize: '13px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className="input"
                placeholder="Ada Lovelace"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  className="input"
                  placeholder="alovelace"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="role">Primary Intent</label>
                <select
                  id="role"
                  className="select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'PARTICIPANT' | 'JUDGE')}
                >
                  <option value="PARTICIPANT">Participant (Build & Submit)</option>
                  <option value="JUDGE">Judge (Evaluate Projects)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="ada@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password (min. 8 characters)</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bio">Bio or Skills (Optional)</label>
              <textarea
                id="bio"
                className="textarea"
                rows={2}
                placeholder="Full-stack engineer, AI researcher, designer..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: 700, marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'} <UserPlus size={16} />
            </button>
          </form>

          {/* Switch to Login */}
          <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Already registered?{' '}
            </span>
            <Link to="/login" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-primary)' }}>
              Sign in instead
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div style={{ marginTop: '16px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          <ShieldCheck size={14} />
          <span>Local database storage. Passwords hashed using bcrypt.</span>
        </div>
      </div>
    </div>
  );
};
