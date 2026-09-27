import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api';
import { User, Event } from './types';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

// Layouts & Guards
import { PublicLayout } from './layouts/PublicLayout';
import { PortalLayout } from './layouts/PortalLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { EventsPage } from './pages/public/EventsPage';
import { EventDetailPage } from './pages/public/EventDetailPage';
import { PublicGalleryPage } from './pages/public/PublicGalleryPage';
import { ProjectDetailPage } from './pages/public/ProjectDetailPage';
import { PublicResultsPage } from './pages/public/PublicResultsPage';
import { VerifyCertificatePage } from './pages/public/VerifyCertificatePage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Participant Pages
import { ParticipantDashboardPage } from './pages/participant/ParticipantDashboardPage';
import { ParticipantEventsPage } from './pages/participant/ParticipantEventsPage';
import { ParticipantTeamPage } from './pages/participant/ParticipantTeamPage';
import { ParticipantProjectPage } from './pages/participant/ParticipantProjectPage';
import { ParticipantSubmissionsPage } from './pages/participant/ParticipantSubmissionsPage';
import { ParticipantResultsPage } from './pages/participant/ParticipantResultsPage';
import { ParticipantCertificatesPage } from './pages/participant/ParticipantCertificatesPage';
import { ParticipantProfilePage } from './pages/participant/ParticipantProfilePage';

// Judge Pages
import { JudgeDashboardPage } from './pages/judge/JudgeDashboardPage';
import { JudgeProjectsPage } from './pages/judge/JudgeProjectsPage';
import { JudgeEvaluatePage } from './pages/judge/JudgeEvaluatePage';
import { JudgeReviewsPage } from './pages/judge/JudgeReviewsPage';
import { JudgeProgressPage } from './pages/judge/JudgeProgressPage';
import { JudgeProfilePage } from './pages/judge/JudgeProfilePage';

// Organizer Pages
import { OrganizerDashboardPage } from './pages/organizer/OrganizerDashboardPage';
import { OrganizerEventsPage } from './pages/organizer/OrganizerEventsPage';
import { OrganizerParticipantsPage } from './pages/organizer/OrganizerParticipantsPage';
import { OrganizerTeamsPage } from './pages/organizer/OrganizerTeamsPage';
import { OrganizerProjectsPage } from './pages/organizer/OrganizerProjectsPage';
import { OrganizerJudgesPage } from './pages/organizer/OrganizerJudgesPage';
import { OrganizerAssignmentsPage } from './pages/organizer/OrganizerAssignmentsPage';
import { OrganizerRubricsPage } from './pages/organizer/OrganizerRubricsPage';
import { OrganizerNormalizationPage } from './pages/organizer/OrganizerNormalizationPage';
import { OrganizerVotingPage } from './pages/organizer/OrganizerVotingPage';
import { OrganizerResultsPage } from './pages/organizer/OrganizerResultsPage';
import { OrganizerExportsPage } from './pages/organizer/OrganizerExportsPage';
import { OrganizerCertificatesPage } from './pages/organizer/OrganizerCertificatesPage';
import { OrganizerAuditPage } from './pages/organizer/OrganizerAuditPage';
import { OrganizerSettingsPage } from './pages/organizer/OrganizerSettingsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminSystemPage } from './pages/admin/AdminSystemPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [user, evList] = await Promise.all([
          api.getMe().catch(() => null),
          api.listEvents().catch(() => [])
        ]);
        if (user) setCurrentUser(user);
        setEvents(evList);
        if (evList.length > 0) setSelectedEvent(evList[0]);
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  const handleLogout = () => {
    api.clearToken();
    setCurrentUser(null);
    showNotification('Signed out successfully.');
  };

  if (initializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            HackJudge
          </div>
          <p style={{ fontSize: '13px' }}>Connecting to local platform backend...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Toast Notification Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          background: toast.type === 'error' ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
          border: `1px solid ${toast.type === 'error' ? 'var(--status-danger-border)' : 'var(--status-success-border)'}`,
          color: toast.type === 'error' ? 'var(--status-danger)' : 'var(--status-success)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '8px' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      <Routes>
        {/* PUBLIC WEBSITE ROUTES */}
        <Route element={<PublicLayout currentUser={currentUser} onLogout={handleLogout} />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage currentUser={currentUser} onNotification={showNotification} />} />
          <Route path="/events/:eventId/projects" element={<PublicGalleryPage currentUser={currentUser} onNotification={showNotification} />} />
          <Route path="/events/:eventId/results" element={<PublicResultsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage currentUser={currentUser} onNotification={showNotification} />} />
          <Route path="/verify" element={<VerifyCertificatePage onNotification={showNotification} />} />
          <Route path="/verify/:identifier" element={<VerifyCertificatePage onNotification={showNotification} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={setCurrentUser} onNotification={showNotification} />} />
          <Route path="/register" element={<RegisterPage onLoginSuccess={setCurrentUser} onNotification={showNotification} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* PARTICIPANT PORTAL */}
        <Route
          path="/participant"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['PARTICIPANT', 'ADMIN', 'ORGANIZER']}>
              <PortalLayout
                currentUser={currentUser!}
                onLogout={handleLogout}
                events={events}
                selectedEvent={selectedEvent}
                onSelectEvent={setSelectedEvent}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/participant/dashboard" replace />} />
          <Route path="dashboard" element={<ParticipantDashboardPage currentUser={currentUser!} onNotification={showNotification} />} />
          <Route path="events" element={<ParticipantEventsPage />} />
          <Route path="team" element={<ParticipantTeamPage currentUser={currentUser!} onNotification={showNotification} />} />
          <Route path="project" element={<ParticipantProjectPage currentUser={currentUser!} onNotification={showNotification} />} />
          <Route path="submissions" element={<ParticipantSubmissionsPage currentUser={currentUser!} />} />
          <Route path="results" element={<ParticipantResultsPage />} />
          <Route path="certificates" element={<ParticipantCertificatesPage currentUser={currentUser!} />} />
          <Route path="profile" element={<ParticipantProfilePage currentUser={currentUser!} onNotification={showNotification} />} />
        </Route>

        {/* JUDGE PORTAL */}
        <Route
          path="/judge"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['JUDGE', 'ADMIN']}>
              <PortalLayout
                currentUser={currentUser!}
                onLogout={handleLogout}
                events={events}
                selectedEvent={selectedEvent}
                onSelectEvent={setSelectedEvent}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/judge/dashboard" replace />} />
          <Route path="dashboard" element={<JudgeDashboardPage currentUser={currentUser!} onNotification={showNotification} />} />
          <Route path="projects" element={<JudgeProjectsPage />} />
          <Route path="projects/:projectId" element={<JudgeEvaluatePage currentUser={currentUser!} onNotification={showNotification} />} />
          <Route path="reviews" element={<JudgeReviewsPage />} />
          <Route path="progress" element={<JudgeProgressPage />} />
          <Route path="profile" element={<JudgeProfilePage currentUser={currentUser!} onNotification={showNotification} />} />
        </Route>

        {/* ORGANIZER PORTAL */}
        <Route
          path="/organizer"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['ORGANIZER', 'ADMIN']}>
              <PortalLayout
                currentUser={currentUser!}
                onLogout={handleLogout}
                events={events}
                selectedEvent={selectedEvent}
                onSelectEvent={setSelectedEvent}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/organizer/dashboard" replace />} />
          <Route path="dashboard" element={<OrganizerDashboardPage currentUser={currentUser!} onNotification={showNotification} />} />
          <Route path="events" element={<OrganizerEventsPage onNotification={showNotification} />} />
          <Route path="participants" element={<OrganizerParticipantsPage />} />
          <Route path="teams" element={<OrganizerTeamsPage onNotification={showNotification} />} />
          <Route path="projects" element={<OrganizerProjectsPage />} />
          <Route path="judges" element={<OrganizerJudgesPage onNotification={showNotification} />} />
          <Route path="assignments" element={<OrganizerAssignmentsPage onNotification={showNotification} />} />
          <Route path="rubrics" element={<OrganizerRubricsPage onNotification={showNotification} />} />
          <Route path="judging" element={<OrganizerDashboardPage currentUser={currentUser!} onNotification={showNotification} />} />
          <Route path="normalization" element={<OrganizerNormalizationPage onNotification={showNotification} />} />
          <Route path="voting" element={<OrganizerVotingPage onNotification={showNotification} />} />
          <Route path="results" element={<OrganizerResultsPage onNotification={showNotification} />} />
          <Route path="exports" element={<OrganizerExportsPage />} />
          <Route path="certificates" element={<OrganizerCertificatesPage onNotification={showNotification} />} />
          <Route path="audit" element={<OrganizerAuditPage />} />
          <Route path="settings" element={<OrganizerSettingsPage />} />
        </Route>

        {/* ADMIN PORTAL */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['ADMIN']}>
              <PortalLayout
                currentUser={currentUser!}
                onLogout={handleLogout}
                events={events}
                selectedEvent={selectedEvent}
                onSelectEvent={setSelectedEvent}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage currentUser={currentUser!} />} />
          <Route path="users" element={<AdminUsersPage onNotification={showNotification} />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="system" element={<AdminSystemPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
