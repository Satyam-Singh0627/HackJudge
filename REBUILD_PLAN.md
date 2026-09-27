# HackJudge Rebuild Plan & Architectural Assessment

## Executive Summary
This document outlines the systematic transformation of **HackJudge** (formerly titled "HackJudge 2026") into an authentic, production-grade, multi-role, self-hostable hackathon management and judging platform aligned with the Dogfood 2026 specifications.

The current codebase contains solid relational database models, cryptographic certificate generation, role-based backend authorization, and Z-score normalization algorithms, but suffered from a single-page prototype frontend, dark neon AI dashboard styling, modal login, lack of URL-driven routing, and an XML parse entity bug in SVG certificates.

---

## 1. What Is Reusable

### Backend & Database (High Integrity & High Reuse)
- **SQLAlchemy Relational Database Schema (`backend/app/models/`)**:
  - `User`, `Event`, `EventRegistration`, `Track`, `Prize`, `Team`, `TeamMember`, `TeamInvite`, `Project`, `Submission`, `SubmissionVersion`, `Rubric`, `RubricCriterion`, `JudgeAssignment`, `JudgeScore`, `CriterionScore`, `ScoreNormalization`, `CommunityVote`, `Comment`, `AuditLog`, `Certificate`, `Webhook`.
  - Proper relational foreign keys, composite constraints (e.g. `(project_id, user_id)` unique voting constraint), and audit relations.
- **Backend Role-Based Security (`backend/app/permissions/role_checker.py`)**:
  - `require_admin`, `require_organizer`, `require_judge`, `require_participant` dependency checks on FastAPI routes.
- **Normalization Algorithm (`backend/app/services/normalization_service.py`)**:
  - Full cross-judge Z-score algorithm: $z = \frac{x - \mu}{\sigma}$, with robust handling for zero-variance ($\sigma = 0$), sample size scaling, missing evaluations, and ranking generation.
- **Export Engine (`backend/app/services/export_service.py`)**:
  - Local streaming CSV exports for participants, teams, submissions, raw judge scores, normalized rankings, and audit logs.
- **Acceptance Test Infrastructure (`scripts/acceptance_test.py` & Pytest test suite)**:
  - 22 comprehensive Pytest unit/integration tests and automated acceptance testing.

---

## 2. What Must Be Rewritten / Replaced

### Frontend Architectural Rework
- **Eliminate Single-Page State Switching**:
  - Replace the monolithic view state in `App.tsx` with **React Router (`react-router-dom`)**.
  - Direct browser URLs (`/events`, `/events/:id`, `/participant/dashboard`, `/judge/projects/:id`, `/organizer/normalization`) must resolve cleanly, survive page refreshes, and support browser forward/back buttons.
- **Replace Authentication Modal with Dedicated Pages**:
  - Create dedicated `/login`, `/register`, and `/forgot-password` pages.
  - Remove all "Quick Switch Demo Account" toolbar buttons and prototype demo tags from public views.
- **De-AI the Styling (Switch to Light-First Clean SaaS)**:
  - Transition from dark navy neon styling (`#0a0e17`) to a crisp light SaaS theme (white `#ffffff` / light gray `#f8fafc`, deep charcoal `#0f172a` text, subtle borders `#e2e8f0`, restrained indigo accent `#2563eb`).
  - Simple, non-glowing cards, standard SaaS tables, and distinct state badges.
- **Fix Certificate XML Parsing Bug**:
  - SVG generation in `backend/app/services/certificate_service.py` failed with `xmlParseEntityRef: no name` when fields like `achievement` contained `&` (e.g. "AI & Agents").
  - Fix by escaping XML entities using `html.escape()` and providing both valid SVG and a printable HTML/CSS certificate view.
- **Role Isolation & Independent Portals**:
  - Provide distinct, persistent sidebar layouts for each role:
    - **Participant Portal (`/participant/*`)**: Dashboard, My Events, My Team, My Project, Submissions, Results, Certificates, Profile.
    - **Judge Portal (`/judge/*`)**: Dashboard, Assigned Projects, Project Evaluation (with live weighted rubric calculator), Progress, Profile. Strict boundary: judge only sees assigned projects.
    - **Organizer Portal (`/organizer/*`)**: Dashboard (real DB stats), Events, Participants, Teams, Projects, Judges, Assignments, Rubrics, Normalization, Voting, Results, Exports, Audit Logs, Settings.
    - **Admin Portal (`/admin/*`)**: System Dashboard, Users, Events, System Status, Audit Logs, Settings.
- **Professional Public Experience**:
  - `/`: Professional landing page with Hero, Features, 4-step How It Works, Role Breakdown, Open Source / Self-Hosting section, and Footer.
  - `/events`: Event discovery with status badges, dates, tracks, prizes, and team constraints.
  - `/events/:id`: Rich event detail page with timeline, rules, tracks, prizes, judging criteria, FAQ.
  - `/events/:id/projects`: Public gallery with search, track filter, tech filter, randomized ordering, and pagination.
  - `/projects/:id`: Dedicated project view with description, team members, demo/repo links, comments, and community voting when open.
  - `/verify/:id`: Standalone public cryptographic certificate verification page.

---

## 3. Dogfood Requirements Gap Analysis

| Dogfood Requirement | Current Implementation Status | Gap / Required Action |
|:---|:---:|:---|
| **Branding & Identity** | Partial | Brand updated to **HackJudge**; tagline "Open, Self-Hosted Hackathon Management & Judging". |
| **Direct URLs & Routing** | Missing | Need `react-router-dom` with deep links and persistent sessions across reload. |
| **Light-First SaaS Design** | Missing | Need modern neutral palette, clean typography, subtle borders, high contrast. |
| **Dedicated Auth Pages** | Missing | Implement `/login`, `/register`, `/forgot-password` with token storage. |
| **Participant Team Workflows** | Partial | Needs standalone `/participant/team` page with invite links, create team, member removal. |
| **Participant Project Submissions**| Partial | Dedicated `/participant/project` page with draft saving, deadline countdown, finalize. |
| **Judge Workload Isolation** | Partial | Strictly restrict evaluation to assigned projects; interactive rubric scoring with live weighted sums. |
| **Rubric Builder** | Partial | Visual builder validating 100% total weight and positive criterion scores. |
| **Score Normalization** | Present | Dedicated UI at `/organizer/normalization` showing formulas, raw judge stats, Z-scores, and ranking comparison. |
| **Certificate Verification** | Buggy | Fix SVG XML escaping and provide high-fidelity printable HTML certificate. |
| **Acceptance Test Suite** | High | Run all 16 specified workflow checks and write results to `acceptance-report.txt`. |

---

## 4. Security & Role-Based Authorization
1. **Frontend Route Guards**:
   - `ProtectedRoute` component inspects the verified `User.role` from the backend (`GET /api/auth/me`).
   - If unauthenticated, redirect to `/login?redirect=...`.
   - If unauthorized for the target portal (e.g. participant trying to visit `/organizer/dashboard`), redirect to their authorized role dashboard.
2. **Backend Enforcement**:
   - Every sensitive endpoint has `Depends(require_organizer)`, `Depends(require_judge)`, or `Depends(require_admin)`.
   - Judges cannot evaluate unassigned projects (enforced at `backend/app/routers/scores.py`).
   - Non-team members cannot edit project submissions (enforced at `backend/app/routers/projects.py`).

---

## 5. Route Architecture

```
/                                   -> Public Landing Page
/events                             -> Event Discovery
/events/:id                         -> Event Details & Registration
/events/:id/projects                -> Public Project Gallery
/events/:id/results                 -> Public Results (if published)
/projects/:id                       -> Project Details & Community Voting
/verify                             -> Public Certificate Verification Search
/verify/:identifier                 -> Public Certificate Verification Result
/login                              -> Sign In Page
/register                           -> Account Registration
/forgot-password                    -> Password Reset

/participant                        -> Participant Base (Redirects to /participant/dashboard)
  /participant/dashboard            -> Deadlines, Registered Events, Team Status
  /participant/events               -> My Registered Events & Actions
  /participant/team                 -> Team Formation, Invites, Member Management
  /participant/project              -> Project Editor, Drafts, Links, Finalization
  /participant/submissions          -> Submission Status & History
  /participant/results              -> Published Event Results & Standings
  /participant/certificates         -> Earned Digital Certificates
  /participant/profile              -> User Profile

/judge                              -> Judge Base (Redirects to /judge/dashboard)
  /judge/dashboard                  -> Workload Progress, Deadlines, Assignments
  /judge/projects                   -> Assigned Projects List
  /judge/projects/:id               -> Interactive Rubric Evaluation Form
  /judge/reviews                    -> Completed Evaluations History
  /judge/progress                   -> Judging Progress & Statistics
  /judge/profile                    -> User Profile

/organizer                          -> Organizer Base (Redirects to /organizer/dashboard)
  /organizer/dashboard              -> Live DB Metrics & Lifecycle Progress
  /organizer/events                 -> Event Management & Configuration
  /organizer/participants           -> Registered Participants Directory
  /organizer/teams                  -> Formed Teams Directory
  /organizer/projects               -> All Submissions & Statuses
  /organizer/judges                 -> Judge Directory & Workload
  /organizer/assignments            -> Manual & Algorithmic Judge Assignment
  /organizer/rubrics                -> Visual Rubric Builder (100% Weight Validation)
  /organizer/judging                -> Live Judging Overview & Scores
  /organizer/normalization          -> Z-Score Normalization Engine & Comparison Matrix
  /organizer/voting                 -> Community Voting Management & Stats
  /organizer/results                -> Results Publication Controls & Rankings
  /organizer/exports                -> Streaming CSV Exports
  /organizer/certificates           -> Certificate Issuer
  /organizer/audit                  -> Immutable Platform Audit Logs
  /organizer/settings               -> Event & Platform Settings

/admin                              -> Admin Base (Redirects to /admin/dashboard)
  /admin/dashboard                  -> System Overview & Aggregate Metrics
  /admin/users                      -> User Management & Role Assignment
  /admin/events                     -> Global Event Oversight
  /admin/system                     -> System Health, Environment, Offline Status
  /admin/audit                      -> System-wide Audit Trail
  /admin/settings                   -> Global Security & Platform Configuration
```

---

## 6. Execution Plan
1. **Fix Certificate XML Bug**: Escape dynamic entities in `backend/app/services/certificate_service.py` and verify SVG/HTML renders without error.
2. **Install React Router**: Add `react-router-dom` to `frontend/package.json`.
3. **Revamp CSS (`index.css`)**: Implement modern light-first SaaS styling (GitHub/Linear-inspired).
4. **Build Core Navigation & Layouts**:
   - `Navbar` & `Footer` for public routes.
   - `SidebarLayout` for authenticated role portals.
5. **Implement Public Pages**:
   - Landing Page (`/`) with Hero, Capabilities, 4-step How It Works, Roles, Self-Hosting info.
   - Event Discovery (`/events`), Detail (`/events/:id`), Gallery (`/events/:id/projects`), Project Detail (`/projects/:id`), Certificate Verification (`/verify/:id`).
6. **Implement Dedicated Auth Pages**:
   - `/login`, `/register`, `/forgot-password`.
7. **Implement Role Portals**:
   - Participant Portal with complete Team and Submission workflows.
   - Judge Portal with assigned project list, isolated rubric evaluation, and live weighted math.
   - Organizer Portal with comprehensive event management, balanced judge assignment, rubric builder, Z-score normalization preview, and CSV exports.
   - Admin Portal with user role management, system health, and audit logs.
8. **Run Acceptance Testing & Generate Reports**:
   - Update `scripts/acceptance_test.py` to test all 16 items.
   - Run acceptance tests and generate `acceptance-report.txt`.
   - Create `DOGFOOD_REQUIREMENTS.md`.
