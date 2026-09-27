# Commit pipeline for HackJudge - 49 Granular File-by-File Commits
$ErrorActionPreference = "Stop"

function Make-Commit {
    param(
        [string[]]$Files,
        [string]$Message
    )
    Write-Host "Staging files: $($Files -join ', ')"
    foreach ($f in $Files) {
        git add $f
    }
    git commit -m $Message
    Write-Host "Committed: $Message" -ForegroundColor Green
}

# 1
Make-Commit -Files @(".gitignore", "frontend/.gitignore") `
    -Message "chore: establish comprehensive repository .gitignore"

# 2
Make-Commit -Files @(".env.example") `
    -Message "chore: create sanitized production and development environment template"

# 3
Make-Commit -Files @("LICENSE") `
    -Message "chore: add open source MIT license"

# 4
Make-Commit -Files @("docker-compose.yml") `
    -Message "chore: containerization with root docker-compose for multi-service offline deployment"

# 5
Make-Commit -Files @("backend/Dockerfile", "backend/requirements.txt") `
    -Message "chore(backend): add containerization Dockerfile and Python requirements"

# 6
Make-Commit -Files @("frontend/package.json", "frontend/package-lock.json", "frontend/.oxlintrc.json") `
    -Message "chore(frontend): configure package manifests, npm dependencies, and lockfile"

# 7
Make-Commit -Files @("frontend/vite.config.ts", "frontend/tsconfig.json", "frontend/tsconfig.app.json", "frontend/tsconfig.node.json", "frontend/Dockerfile", "frontend/nginx.conf") `
    -Message "chore(frontend): setup Vite build toolchain, TypeScript configuration, and Nginx container"

# 8
Make-Commit -Files @("backend/app/database.py", "backend/app/__init__.py") `
    -Message "feat(backend): configure database engine, session factory, and transaction management"

# 9
Make-Commit -Files @("backend/app/config.py") `
    -Message "feat(backend): add environment configuration with CORS policies and secret guards"

# 10
Make-Commit -Files @("backend/app/models/__init__.py", "backend/app/models/user.py") `
    -Message "feat(backend): implement user, role, and authentication data models"

# 11
Make-Commit -Files @("backend/app/models/event.py", "backend/app/models/team.py") `
    -Message "feat(backend): implement event lifecycle, track, and team membership data models"

# 12
Make-Commit -Files @("backend/app/models/project.py") `
    -Message "feat(backend): implement project submission, draft state, and repository link models"

# 13
Make-Commit -Files @("backend/app/models/judging.py") `
    -Message "feat(backend): implement rubric criteria, judge assignment, and score models"

# 14
Make-Commit -Files @("backend/app/models/voting.py", "backend/app/models/certificate.py", "backend/app/models/webhook.py", "backend/app/models/audit.py") `
    -Message "feat(backend): implement community voting, certificate, webhook, and audit log models"

# 15
Make-Commit -Files @("backend/app/schemas/__init__.py", "backend/app/schemas/user.py") `
    -Message "feat(backend): define Pydantic validation schemas for user authentication and profiles"

# 16
Make-Commit -Files @("backend/app/schemas/event.py", "backend/app/schemas/team.py", "backend/app/schemas/project.py") `
    -Message "feat(backend): define schemas for events, teams, and project submissions"

# 17
Make-Commit -Files @("backend/app/schemas/judging.py", "backend/app/schemas/voting.py", "backend/app/schemas/certificate.py", "backend/app/schemas/webhook.py", "backend/app/schemas/audit.py") `
    -Message "feat(backend): define schemas for rubrics, judging scores, votes, and audit logs"

# 18
Make-Commit -Files @("backend/app/auth/__init__.py", "backend/app/auth/password.py", "backend/app/auth/jwt.py", "backend/app/auth/dependencies.py") `
    -Message "feat(security): implement Bcrypt password hashing and HS256 JWT token generation"

# 19
Make-Commit -Files @("backend/app/permissions/role_checker.py") `
    -Message "feat(security): enforce strict role-based access control and IDOR protections"

# 20
Make-Commit -Files @("backend/app/audit/audit_service.py") `
    -Message "feat(audit): implement append-only structured audit trail service"

# 21
Make-Commit -Files @("backend/app/services/normalization_service.py") `
    -Message "feat(services): implement Z-score normalization with zero-variance protection"

# 22
Make-Commit -Files @("backend/app/services/certificate_service.py") `
    -Message "feat(services): implement cryptographic certificate generation and SVG XML escaping"

# 23
Make-Commit -Files @("backend/app/services/event_service.py", "backend/app/services/team_service.py") `
    -Message "feat(services): implement event lifecycle and team management domain logic"

# 24
Make-Commit -Files @("backend/app/services/submission_service.py", "backend/app/services/judging_service.py") `
    -Message "feat(services): implement project submission workflow and judging assignment logic"

# 25
Make-Commit -Files @("backend/app/services/voting_service.py", "backend/app/services/export_service.py", "backend/app/services/webhook_service.py") `
    -Message "feat(services): implement rate-limited voting, secure CSV exports, and webhooks"

# 26
Make-Commit -Files @("backend/app/routers/auth.py", "backend/app/routers/users.py") `
    -Message "feat(api): expose authentication and user management API endpoints"

# 27
Make-Commit -Files @("backend/app/routers/events.py", "backend/app/routers/teams.py") `
    -Message "feat(api): expose event configuration and team collaboration endpoints"

# 28
Make-Commit -Files @("backend/app/routers/projects.py", "backend/app/routers/submissions.py", "backend/app/routers/comments.py") `
    -Message "feat(api): expose project submission lifecycle and peer commenting endpoints"

# 29
Make-Commit -Files @("backend/app/routers/rubrics.py", "backend/app/routers/assignments.py", "backend/app/routers/judges.py", "backend/app/routers/scores.py") `
    -Message "feat(api): expose rubric management, judge assignment, and evaluation endpoints"

# 30
Make-Commit -Files @("backend/app/routers/normalization.py", "backend/app/routers/votes.py", "backend/app/routers/certificates.py") `
    -Message "feat(api): expose normalization, community voting, and certificate endpoints"

# 31
Make-Commit -Files @("backend/app/routers/exports.py", "backend/app/routers/webhooks.py", "backend/app/routers/audit.py") `
    -Message "feat(api): expose streaming CSV exports, webhook dispatch, and audit log endpoints"

# 32
Make-Commit -Files @("backend/app/seed/seed_data.py") `
    -Message "feat(backend): configure official Dogfood 72-Hour Hackathon fixtures and seed pipeline"

# 33
Make-Commit -Files @("backend/app/main.py") `
    -Message "feat(backend): assemble FastAPI application lifecycle, middleware, and router mounts"

# 34
Make-Commit -Files @("frontend/index.html", "frontend/src/index.css", "frontend/src/App.css", "frontend/src/types.ts", "frontend/src/vite-env.d.ts") `
    -Message "feat(frontend): establish modern design tokens, CSS styling, and global types"

# 35
Make-Commit -Files @("frontend/src/api.ts", "frontend/src/components/Icons.tsx", "frontend/src/assets/hero.png", "frontend/src/assets/react.svg", "frontend/src/assets/vite.svg", "frontend/public/favicon.svg", "frontend/public/icons.svg") `
    -Message "feat(frontend): add centralized API client and icon component library"

# 36
Make-Commit -Files @("frontend/src/layouts/PublicLayout.tsx", "frontend/src/layouts/PortalLayout.tsx", "frontend/src/components/ProtectedRoute.tsx") `
    -Message "feat(frontend): implement public layout, navigation, and protected routing guards"

# 37
Make-Commit -Files @("frontend/src/pages/public/LandingPage.tsx", "frontend/src/pages/public/EventsPage.tsx", "frontend/src/pages/public/EventDetailPage.tsx", "frontend/src/pages/public/PublicGalleryPage.tsx", "frontend/src/pages/public/ProjectDetailPage.tsx", "frontend/src/pages/public/PublicResultsPage.tsx", "frontend/src/pages/public/VerifyCertificatePage.tsx") `
    -Message "feat(frontend): build public landing page, event showcase, and project gallery"

# 38
Make-Commit -Files @("frontend/src/pages/auth/LoginPage.tsx", "frontend/src/pages/auth/RegisterPage.tsx", "frontend/src/pages/auth/ForgotPasswordPage.tsx") `
    -Message "feat(frontend): implement authentication workflows for login, registration, and reset"

# 39
Make-Commit -Files @("frontend/src/pages/participant/ParticipantDashboardPage.tsx", "frontend/src/pages/participant/ParticipantEventsPage.tsx", "frontend/src/pages/participant/ParticipantTeamPage.tsx", "frontend/src/pages/participant/ParticipantProjectPage.tsx", "frontend/src/pages/participant/ParticipantSubmissionsPage.tsx", "frontend/src/pages/participant/ParticipantResultsPage.tsx", "frontend/src/pages/participant/ParticipantCertificatesPage.tsx", "frontend/src/pages/participant/ParticipantProfilePage.tsx") `
    -Message "feat(frontend): build dedicated participant dashboard, team workspace, and project submission"

# 40
Make-Commit -Files @("frontend/src/pages/judge/JudgeDashboardPage.tsx", "frontend/src/pages/judge/JudgeProjectsPage.tsx", "frontend/src/pages/judge/JudgeEvaluatePage.tsx", "frontend/src/pages/judge/JudgeReviewsPage.tsx", "frontend/src/pages/judge/JudgeProgressPage.tsx", "frontend/src/pages/judge/JudgeProfilePage.tsx") `
    -Message "feat(frontend): build dedicated judge portal with workload isolation and rubric grading"

# 41
Make-Commit -Files @("frontend/src/pages/organizer/OrganizerDashboardPage.tsx", "frontend/src/pages/organizer/OrganizerEventsPage.tsx", "frontend/src/pages/organizer/OrganizerParticipantsPage.tsx", "frontend/src/pages/organizer/OrganizerTeamsPage.tsx", "frontend/src/pages/organizer/OrganizerProjectsPage.tsx", "frontend/src/pages/organizer/OrganizerJudgesPage.tsx", "frontend/src/pages/organizer/OrganizerAssignmentsPage.tsx", "frontend/src/pages/organizer/OrganizerRubricsPage.tsx", "frontend/src/pages/organizer/OrganizerNormalizationPage.tsx", "frontend/src/pages/organizer/OrganizerVotingPage.tsx", "frontend/src/pages/organizer/OrganizerResultsPage.tsx", "frontend/src/pages/organizer/OrganizerCertificatesPage.tsx", "frontend/src/pages/organizer/OrganizerExportsPage.tsx", "frontend/src/pages/organizer/OrganizerAuditPage.tsx", "frontend/src/pages/organizer/OrganizerSettingsPage.tsx") `
    -Message "feat(frontend): build organizer operations suite for rubrics, assignments, normalization, and exports"

# 42
Make-Commit -Files @("frontend/src/pages/admin/AdminDashboardPage.tsx", "frontend/src/pages/admin/AdminUsersPage.tsx", "frontend/src/pages/admin/AdminEventsPage.tsx", "frontend/src/pages/admin/AdminAuditPage.tsx", "frontend/src/pages/admin/AdminSystemPage.tsx", "frontend/src/pages/admin/AdminSettingsPage.tsx") `
    -Message "feat(frontend): build system administration portal for users, system metrics, and audit log viewer"

# 43
Make-Commit -Files @("frontend/src/App.tsx", "frontend/src/main.tsx", "frontend/README.md") `
    -Message "feat(frontend): assemble root application router, dynamic portal switching, and entrypoint"

# 44
Make-Commit -Files @("tests/conftest.py", "tests/test_auth.py", "tests/test_events_and_teams.py", "tests/test_submissions.py", "tests/test_judging_and_scoring.py", "tests/test_normalization.py", "tests/test_voting_and_antiabuse.py", "tests/test_exports_and_certs.py", "tests/test_end_to_end.py") `
    -Message "test: implement unit and integration test suite across auth, submissions, judging, and RBAC"

# 45
Make-Commit -Files @("scripts/acceptance_test.py", "acceptance-report.txt") `
    -Message "test: add 16-point automated Dogfood specification acceptance verification script"

# 46
Make-Commit -Files @("ARCHITECTURE.md", "DATA-MODEL.md", "JUDGING.md", "THREAT-MODEL.md") `
    -Message "docs: add comprehensive system architecture, data model, judging engine, and threat model"

# 47
Make-Commit -Files @("DOGFOOD_REQUIREMENTS.md", "DOGFOOD_REQUIREMENTS_AUDIT.md", "REBUILD_PLAN.md", "SECURITY-AUDIT.md") `
    -Message "docs: add Dogfood requirements audit, rebuild specifications, and security assessment"

# 48
Make-Commit -Files @("PRE_GITHUB_AUDIT.md", "RELEASE_CHECKLIST.md", "FINAL_PRE_PUSH_REPORT.md") `
    -Message "docs: provide pre-github engineering audit, release checklist, and final pre-push validation"

# 49
Make-Commit -Files @("README.md") `
    -Message "docs: add complete project README with quickstart, Docker offline instructions, and feature guide"

Write-Host "All 49 file-by-file commits generated successfully!" -ForegroundColor Cyan
