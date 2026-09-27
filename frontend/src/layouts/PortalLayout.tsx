import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { User, Event } from '../types';
import {
  Award, LayoutDashboard, Calendar, Users, FolderGit2,
  FileCheck2, Trophy, ShieldCheck, UserCheck, Scale,
  Sliders, Vote, Download, FileText, Settings, LogOut,
  ChevronRight, BarChart3, CheckCircle2, Clock, Globe,
  Shield, Cpu, Layers, ExternalLink
} from 'lucide-react';

interface PortalLayoutProps {
  currentUser: User;
  onLogout: () => void;
  events?: Event[];
  selectedEvent?: Event | null;
  onSelectEvent?: (e: Event) => void;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  currentUser,
  onLogout,
  events = [],
  selectedEvent = null,
  onSelectEvent
}) => {
  const navigate = useNavigate();

  const role = currentUser.role.toUpperCase();

  // Navigation Items per Role
  const getNavSections = () => {
    switch (role) {
      case 'PARTICIPANT':
        return [
          {
            title: 'Participant Portal',
            items: [
              { to: '/participant/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
              { to: '/participant/events', label: 'My Events', icon: <Calendar size={18} /> },
              { to: '/participant/team', label: 'My Team', icon: <Users size={18} /> },
              { to: '/participant/project', label: 'My Project', icon: <FolderGit2 size={18} /> },
              { to: '/participant/submissions', label: 'Submissions', icon: <FileCheck2 size={18} /> },
              { to: '/participant/results', label: 'Results', icon: <Trophy size={18} /> },
              { to: '/participant/certificates', label: 'Certificates', icon: <ShieldCheck size={18} /> },
              { to: '/participant/profile', label: 'Profile', icon: <UserCheck size={18} /> },
            ]
          }
        ];
      case 'JUDGE':
        return [
          {
            title: 'Judge Portal',
            items: [
              { to: '/judge/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
              { to: '/judge/projects', label: 'Assigned Projects', icon: <FolderGit2 size={18} /> },
              { to: '/judge/reviews', label: 'Evaluation Reviews', icon: <FileCheck2 size={18} /> },
              { to: '/judge/progress', label: 'Judging Progress', icon: <BarChart3 size={18} /> },
              { to: '/judge/profile', label: 'Profile', icon: <UserCheck size={18} /> },
            ]
          }
        ];
      case 'ORGANIZER':
        return [
          {
            title: 'Hackathon Ops',
            items: [
              { to: '/organizer/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
              { to: '/organizer/events', label: 'Events', icon: <Calendar size={18} /> },
              { to: '/organizer/participants', label: 'Participants', icon: <UserCheck size={18} /> },
              { to: '/organizer/teams', label: 'Teams', icon: <Users size={18} /> },
              { to: '/organizer/projects', label: 'Projects', icon: <FolderGit2 size={18} /> },
            ]
          },
          {
            title: 'Judging & Scoring',
            items: [
              { to: '/organizer/judges', label: 'Judges', icon: <UserCheck size={18} /> },
              { to: '/organizer/assignments', label: 'Assignments', icon: <Sliders size={18} /> },
              { to: '/organizer/rubrics', label: 'Rubrics Builder', icon: <Scale size={18} /> },
              { to: '/organizer/judging', label: 'Live Judging', icon: <BarChart3 size={18} /> },
              { to: '/organizer/normalization', label: 'Normalization (Z-Score)', icon: <Cpu size={18} /> },
            ]
          },
          {
            title: 'Results & Platform',
            items: [
              { to: '/organizer/voting', label: 'Community Voting', icon: <Vote size={18} /> },
              { to: '/organizer/results', label: 'Publish Results', icon: <Trophy size={18} /> },
              { to: '/organizer/exports', label: 'CSV Exports', icon: <Download size={18} /> },
              { to: '/organizer/certificates', label: 'Certificates', icon: <ShieldCheck size={18} /> },
              { to: '/organizer/audit', label: 'Audit Logs', icon: <FileText size={18} /> },
              { to: '/organizer/settings', label: 'Settings', icon: <Settings size={18} /> },
            ]
          }
        ];
      case 'ADMIN':
        return [
          {
            title: 'System Administration',
            items: [
              { to: '/admin/dashboard', label: 'Admin Dashboard', icon: <LayoutDashboard size={18} /> },
              { to: '/admin/users', label: 'Users & Roles', icon: <Users size={18} /> },
              { to: '/admin/events', label: 'All Events', icon: <Calendar size={18} /> },
              { to: '/admin/system', label: 'System Health', icon: <Cpu size={18} /> },
              { to: '/admin/audit', label: 'System Audit Logs', icon: <FileText size={18} /> },
              { to: '/admin/settings', label: 'Platform Settings', icon: <Settings size={18} /> },
            ]
          }
        ];
      default:
        return [];
    }
  };

  const navSections = getNavSections();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-surface)' }}>
      {/* Persistent Left Sidebar */}
      <aside style={{
        width: '260px',
        background: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 30
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
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
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>HackJudge</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Self-Hosted Platform</div>
            </div>
          </Link>
        </div>

        {/* Role Badge Indicator */}
        <div style={{ padding: '12px 20px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Workspace
            </span>
            <span className={`badge ${
              role === 'ADMIN' ? 'badge-danger' :
              role === 'ORGANIZER' ? 'badge-warning' :
              role === 'JUDGE' ? 'badge-blue' : 'badge-success'
            }`}>
              {role}
            </span>
          </div>
          {selectedEvent && (
            <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedEvent.title}
            </div>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {navSections.map((sec, idx) => (
            <div key={idx} style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
                letterSpacing: '0.05em',
                padding: '0 10px',
                marginBottom: '6px'
              }}>
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {sec.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--brand-primary-subtle)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    })}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Public Gallery Link & User Footer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-primary)'
        }}>
          {selectedEvent && (
            <Link
              to={`/events/${selectedEvent.id}/projects`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'var(--bg-subtle)',
                marginBottom: '12px',
                textDecoration: 'none'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} /> Public Gallery
              </span>
              <ExternalLink size={12} />
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
                color: 'var(--brand-primary)'
              }}>
                {currentUser.full_name ? currentUser.full_name[0].toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {currentUser.full_name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  @{currentUser.username}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-sm)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--status-danger)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header style={{
          height: '56px',
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>HackJudge</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{role.charAt(0) + role.slice(1).toLowerCase()} Portal</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {events.length > 1 && onSelectEvent && (
              <select
                className="select"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
                value={selectedEvent?.id || ''}
                onChange={(e) => {
                  const ev = events.find(item => item.id === e.target.value);
                  if (ev) onSelectEvent(ev);
                }}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            )}
            <Link to="/events" className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }}>
              Browse Hackathons
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
