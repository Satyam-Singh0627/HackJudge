import React from 'react';
import { Link } from 'react-router-dom';
import {
  Award, ShieldCheck, Scale, Cpu, Terminal, Users,
  FolderGit2, CheckCircle2, ArrowRight, BarChart3,
  Layers, Lock, Database, FileSpreadsheet, Globe, Check
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <section style={{
        padding: '72px 24px 64px 24px',
        borderBottom: '1px solid var(--border-color)',
        background: 'linear-gradient(180deg, #ffffff 0%, var(--bg-surface) 100%)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: 'var(--brand-primary-subtle)', border: '1px solid var(--brand-primary-border)', marginBottom: '24px' }}>
            <Terminal size={14} color="var(--brand-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-primary)' }}>
              Open, Self-Hosted Hackathon Management & Judging Platform
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: '52px',
            fontWeight: 900,
            lineHeight: 1.15,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: '20px',
            maxWidth: '860px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Run Hackathons. Judge Fairly. <br />
            <span style={{ color: 'var(--brand-primary)' }}>Ship With Confidence.</span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 36px auto',
            lineHeight: 1.6
          }}>
            HackJudge is a complete, self-hostable operating system for hackathons. From team formation and deadline-enforced submissions to weighted rubrics and mathematical cross-judge Z-score normalization.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link to="/events" className="btn btn-primary" style={{ padding: '12px 26px', fontSize: '15px', fontWeight: 700 }}>
              Explore Hackathons <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 600 }}>
              Host a Hackathon
            </Link>
          </div>

          {/* Product Preview Visual */}
          <div style={{
            marginTop: '56px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)',
            background: 'var(--bg-primary)'
          }}>
            {/* Mock Header Bar */}
            <div style={{
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border-color)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '12px' }}>
                  HackJudge Operations Dashboard — Score Normalization Engine
                </span>
              </div>
              <span className="badge badge-neutral" style={{ fontSize: '10px' }}>Algorithm Active</span>
            </div>

            {/* Dashboard Visual Mock */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: 'var(--bg-surface)' }}>
              <div className="stat-card">
                <div className="stat-card-label">Normalization Method</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '8px' }}>Z-Score (μ=0, σ=1)</div>
                <div className="stat-card-meta">Cross-Judge Variance Adjusted</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Rubric Constraints</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--status-success)', marginTop: '8px' }}>100% Weighted</div>
                <div className="stat-card-meta">5 Evaluated Criteria</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Judge Workload</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>Balanced Batch</div>
                <div className="stat-card-meta">Strict Role Isolation</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Verification</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--status-success)', marginTop: '8px' }}>SHA-256 Hashed</div>
                <div className="stat-card-meta">Tamper-Proof Certificates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>
            Lifecycle Architecture
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            How HackJudge Works
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px' }}>
            A disciplined, four-stage pipeline designed for integrity and fair competition.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {[
            {
              step: '01',
              title: 'Create Event',
              desc: 'Configure registration periods, submission cutoffs, custom tracks, prizes, and team constraints.'
            },
            {
              step: '02',
              title: 'Build Teams',
              desc: 'Participants register, form squads via cryptographic invite codes, and maintain project drafts.'
            },
            {
              step: '03',
              title: 'Submit Projects',
              desc: 'Strict deadline enforcement ensures timely submission of repositories, demos, and tech stacks.'
            },
            {
              step: '04',
              title: 'Judge & Publish',
              desc: 'Judges evaluate isolated assignments; normalization mitigates grading bias before release.'
            }
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ padding: '24px 20px', position: 'relative' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--brand-primary-border)', marginBottom: '12px' }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Real Product Capabilities / Features */}
      <section id="features" style={{ padding: '80px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>
              Core Capabilities
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
              Built for Serious Hackathon Organizers
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Every feature is backed by real relational database logic and strict server-side validation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              {
                icon: <Scale size={22} color="var(--brand-primary)" />,
                title: 'Weighted Rubrics',
                desc: 'Design criteria with custom weights enforced to exactly 100%. Raw and weighted scores computed automatically.'
              },
              {
                icon: <Cpu size={22} color="var(--brand-primary)" />,
                title: 'Z-Score Normalization',
                desc: 'Eliminate tough vs lenient judge bias with statistical Z-scores: z = (x - μ) / σ, with zero-variance protection.'
              },
              {
                icon: <Lock size={22} color="var(--brand-primary)" />,
                title: 'Strict Judge Isolation',
                desc: 'Judges only see their assigned submissions. Scores of other judges are strictly inaccessible to prevent groupthink.'
              },
              {
                icon: <Users size={22} color="var(--brand-primary)" />,
                title: 'Balanced Assignment',
                desc: 'Assign judges manually or algorithmically distribute projects evenly across the judging panel.'
              },
              {
                icon: <FolderGit2 size={22} color="var(--brand-primary)" />,
                title: 'Deadline Enforcement',
                desc: 'Immutable submission lock at the configured deadline timestamp. Backend rejects late edits automatically.'
              },
              {
                icon: <Globe size={22} color="var(--brand-primary)" />,
                title: 'Anti-Abuse Voting',
                desc: 'Community voting with database compound uniqueness constraints and rate limiting to prevent manipulation.'
              },
              {
                icon: <FileSpreadsheet size={22} color="var(--brand-primary)" />,
                title: 'Local CSV Exports',
                desc: 'Stream full exports for teams, participants, raw judge evaluations, and final normalized rankings.'
              },
              {
                icon: <Award size={22} color="var(--brand-primary)" />,
                title: 'Digital Certificates',
                desc: 'Issue SHA-256 verified certificates with XML-escaped vector rendering and printable HTML formats.'
              },
              {
                icon: <Database size={22} color="var(--brand-primary)" />,
                title: 'Self-Hosted & Offline',
                desc: 'Deploy with a single docker-compose command. Zero external network calls or cloud auth dependencies.'
              }
            ].map((f, idx) => (
              <div key={idx} className="card" style={{ padding: '24px', background: 'var(--bg-primary)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Breakdown Section */}
      <section style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>
            Multi-Role Architecture
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            Independent Portals for Every Stakeholder
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px' }}>
            No mixed views. Each role gets a dedicated workflow, permission scope, and persistent navigation.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {/* For Participants */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span className="badge badge-success">Participant</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>For Participants</h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-success)" /> Discover hackathons and view track details
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-success)" /> Create or join teams with invite links
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-success)" /> Submit project drafts, repos, and demo URLs
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-success)" /> Track submission countdowns and view final results
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-success)" /> Download verifiable digital certificates
              </li>
            </ul>
          </div>

          {/* For Judges */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span className="badge badge-blue">Judge</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>For Judges</h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--brand-primary)" /> Access only strictly assigned projects
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--brand-primary)" /> Score with live weighted rubric calculations
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--brand-primary)" /> Provide private qualitative feedback
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--brand-primary)" /> Monitor pending and completed review progress
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--brand-primary)" /> Finalize reviews with immutable submission locks
              </li>
            </ul>
          </div>

          {/* For Organizers */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span className="badge badge-warning">Organizer</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>For Organizers</h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-warning)" /> Configure event lifecycle dates, tracks, and prizes
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-warning)" /> Build 100% validated weighted scoring rubrics
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-warning)" /> Algorithmic, balanced judge assignment
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-warning)" /> Run Z-score normalization with raw vs normalized preview
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-warning)" /> Export CSVs, publish results, and issue certificates
              </li>
            </ul>
          </div>

          {/* For Admins */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span className="badge badge-danger">Admin</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>For Admins</h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-danger)" /> Manage users, role upgrades, and account states
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-danger)" /> Global event oversight across all active competitions
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-danger)" /> Inspect comprehensive, immutable platform audit logs
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-danger)" /> System health diagnostics, offline status, and API specs
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="var(--status-danger)" /> Highest privilege controls with backend authorization
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Self-Hosting / Open Source Section */}
      <section id="self-hosted" style={{
        padding: '80px 24px',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <Terminal size={24} color="var(--brand-primary)" />
          </div>

          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Completely Self-Hosted. Zero Cloud Lock-In.
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
            Run on your own infrastructure. No telemetry, no third-party cloud auth, no external API dependencies. Once containers are launched, HackJudge operates fully air-gapped without internet access.
          </p>

          <div style={{
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: '13px',
            maxWidth: '540px',
            margin: '0 auto 36px auto',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ color: '#64748b', marginBottom: '8px' }}># Clone repository and launch containers</div>
            <div style={{ color: '#38bdf8' }}>$ git clone https://github.com/hackathon-raptors/hackjudge.git</div>
            <div style={{ color: '#38bdf8' }}>$ cd hackjudge</div>
            <div style={{ color: '#4ade80' }}>$ docker compose up -d</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              View API Documentation
            </a>
            <Link to="/events" className="btn btn-primary">
              Discover Hackathons <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
