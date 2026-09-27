# HackJudge: Open, Self-Hosted Hackathon Management & Judging

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-brightgreen.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)]()
[![React 19](https://img.shields.io/badge/React-19-blue.svg)]()
[![Docker Ready](https://img.shields.io/badge/Docker-Compose-2496ED.svg)]()
[![Offline Capable](https://img.shields.io/badge/Network-100%25%20Offline-success.svg)]()
[![Acceptance Tests](https://img.shields.io/badge/Acceptance%20Suite-16%2F16%20PASS-success.svg)]()

> A production-quality, open-source, self-hosted hackathon management and judging platform engineered to meet and exceed the **Dogfood 2026 Hackathon Specification**.

---

## 1. Product Identity & Design

**HackJudge** is an offline-capable, high-integrity hackathon platform designed for university, enterprise, and decentralized developer events.

* **Product Name**: HackJudge
* **Tagline**: *"Open, Self-Hosted Hackathon Management & Judging"*
* **Visual Direction**: Light-first SaaS interface with deep charcoal typography, subtle borders, restrained blue accent, and responsive multi-device layouts. No generic dark neon glowing AI aesthetics.
* **Architecture**: Strict multi-page client routing (`react-router-dom`), full URL bookmarking, persistent sessions across reloads, and decoupled role-isolated portals.

---

## 2. Information & Route Architecture

```
PUBLIC SURFACE
  ├── / (Landing Page: Hero, Value Props, Flow, Role Features, Self-Hosting Specs)
  ├── /events (Public Event Directory)
  ├── /events/:id (Event Detail, Rules, Tracks, Timeline, FAQs)
  ├── /events/:id/projects (Searchable Public Project Gallery with Filter & Order)
  ├── /projects/:id (Project Deep View, Demo URLs, Repositories, Community Voting)
  ├── /events/:id/results (Public Results with Raw & Normalized Metrics)
  ├── /verify (Certificate Authenticity Verification)
  └── /verify/:hash (Direct Cryptographic Certificate Lookup)

AUTHENTICATION
  ├── /login (Dedicated Auth Page with Email/Password & Persistent Sessions)
  ├── /register (Account Registration with Password Validation)
  └── /forgot-password (Self-Hosted Password Recovery Workflow)

ROLE-SPECIFIC PORTALS (Persistent Sidebars & Strict Backend RBAC)
  ├── /participant
  │     ├── /participant/dashboard (Deadlines, Team, Status, Notifications)
  │     ├── /participant/events (Registered Hackathons)
  │     ├── /participant/team (Team Formation, Member Invites, Roster)
  │     ├── /participant/project (Project Profile, Demos, Tech Stack)
  │     ├── /participant/submissions (Draft / Final Submission & Timestamps)
  │     ├── /participant/results (Live Ranking & Evaluation Summaries)
  │     ├── /participant/certificates (Digital Verified Credentials)
  │     └── /participant/profile (Participant Identity & Settings)
  │
  ├── /judge
  │     ├── /judge/dashboard (Assigned Workload, Review Progress, Pending Actions)
  │     ├── /judge/projects (Assigned Project Queue with Track Filters)
  │     ├── /judge/projects/:id (Interactive Multi-Criteria Rubric Evaluation)
  │     ├── /judge/reviews (Completed & Finalized Evaluation Archive)
  │     ├── /judge/progress (Workload Percentage & Completion Metrics)
  │     └── /judge/profile (Judge Credentials & Panel Status)
  │
  ├── /organizer
  │     ├── /organizer/dashboard (Real-Time Database Statistics & Competition Metrics)
  │     ├── /organizer/events (Event Configuration, Deadlines & Tracks)
  │     ├── /organizer/participants (Participant Roster & Registration Management)
  │     ├── /organizer/teams (Team Formations & Member Limits)
  │     ├── /organizer/projects (Master Project Directory)
  │     ├── /organizer/judges (Judge Roster & Workload Capacity)
  │     ├── /organizer/assignments (Manual & Algorithmic Balanced Assignment)
  │     ├── /organizer/rubrics (Weighted Rubric Builder with 100% Validation)
  │     ├── /organizer/normalization (Cross-Judge Z-Score Normalization Engine)
  │     ├── /organizer/voting (Community Voting Governance & Anti-Abuse Rules)
  │     ├── /organizer/results (Results Publication & Score Visibility Controls)
  │     ├── /organizer/exports (Local Streaming CSV Reports)
  │     ├── /organizer/certificates (Batch Verifiable Certificate Generation)
  │     ├── /organizer/audit (Immutable Platform Audit Logs)
  │     └── /organizer/settings (Competition Rules & Preferences)
  │
  └── /admin
        ├── /admin/dashboard (Global System Health & Metrics)
        ├── /admin/users (RBAC User Administration & Privilege Control)
        ├── /admin/events (Platform-Wide Event Supervision)
        ├── /admin/system (Database Diagnostics & Health Monitoring)
        ├── /admin/audit (Full Platform Security Audit Trail)
        └── /admin/settings (Global Instance Configuration)
```

---

## 3. Core Capabilities & Mathematical Rigor

1. **Role-Isolated Portals**: Strict backend authorization enforcement for Participants, Judges, Organizers, and Admins. Judges cannot view or score unassigned projects. Participants cannot tamper with projects after deadlines.
2. **Weighted Rubric Scoring**: Custom multi-criteria rubrics with automated weight validation ($\sum w = 100\%$).
3. **Algorithmic Judge Assignment**: Automated round-robin workload distribution targeting $K$ judges per submission while preventing conflicts of interest.
4. **Statistical Cross-Judge Z-Score Normalization**:
   $$z = \frac{x - \mu}{\sigma}$$
   Removes harsh/lenient judge bias with safeguards for zero-variance ($\sigma = 0$), single evaluations, and small-sample shrinkage. Previews both Raw and Normalized rankings before publication.
5. **Anti-Abuse Public Voting**: Sybil prevention quarantine, compound DB uniqueness constraints (`UNIQUE(user_id, project_id)`), sliding-window rate limiting, and reproducible randomized presentation order.
6. **Local Verifiable Certificates**: Cryptographically hashed, tamper-evident digital certificates rendered via valid escaped standalone SVG templates and printable HTML. Fixes all XML parsing issues (`xmlParseEntityRef`).
7. **Append-Only Audit Trail**: Full journal of every sensitive action with actor tracking and timestamping.
8. **100% Offline Capable**: Zero CDN dependencies, zero external font calls, zero third-party auth services.

---

## 4. Quick Start with Docker Compose

The complete platform (PostgreSQL, Backend API, and Frontend Nginx) initializes with a single command:

```bash
docker compose up
```

### Local URLs:
* **Frontend Web Application**: [http://localhost:5173](http://localhost:5173) (or [http://localhost:80](http://localhost:80))
* **Backend REST API**: [http://localhost:8000/api](http://localhost:8000/api)
* **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc API Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **System Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 5. Seeded Test Credentials

The database automatically initializes with realistic fixtures for testing and evaluation:

| Role | Username | Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin@hackathon.local` | `AdminPassword123!` | `/admin/dashboard` |
| **Organizer** | `organizer` | `organizer@hackathon.local` | `OrganizerPassword123!` | `/organizer/dashboard` |
| **Judge** | `judge` | `judge@hackathon.local` | `JudgePassword123!` | `/judge/dashboard` |
| **Participant** | `participant` | `participant@hackathon.local` | `ParticipantPassword123!` | `/participant/dashboard` |

*Additional Seeded Judges*: `judge_elena`, `judge_kenji` (Password: `JudgePassword123!`).  
*Additional Seeded Participants*: `dev_priya`, `dev_liam`, `dev_amara`, `dev_carlos`, `dev_sophie`, `dev_yuki` (Password: `ParticipantPassword123!`).

---

## 6. Local Standalone Setup (Without Docker)

You can also run both the backend and frontend directly on your local workstation using Python and Node.js.

### Prerequisites:
* Python 3.11+
* Node.js 18+ and npm

### 6.1 Backend Setup:
```bash
# From workspace root
pip install -r backend/requirements.txt

# Start backend (auto-seeds SQLite database 'hackathon.db')
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

### 6.2 Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

---

## 7. Automated Acceptance Suite & Verification

The repository includes a comprehensive 16-test acceptance suite that validates every end-to-end workflow, security boundary, and tier specification requirement:

```bash
# Execute the full 16-point automated acceptance suite
python scripts/acceptance_test.py
```

This generates `acceptance-report.txt` verifying:
* **TEST 1**: Create event
* **TEST 2**: Register participant
* **TEST 3**: Create team
* **TEST 4**: Submit project
* **TEST 5**: Assign judge
* **TEST 6**: Verify judge can access assigned project
* **TEST 7**: Verify judge cannot access unassigned project (HTTP 403/404)
* **TEST 8**: Submit evaluation & weighted rubric scoring
* **TEST 9**: Run Z-score normalization
* **TEST 10**: Verify raw vs. normalized ranking
* **TEST 11**: Cast community vote
* **TEST 12**: Prevent duplicate vote (HTTP 400 compound constraint)
* **TEST 13**: Export streaming CSV
* **TEST 14**: Verify digital certificate & XML escaping
* **TEST 15**: Verify backend role isolation across all tiers
* **TEST 16**: Verify deadline enforcement

To run the complete Pytest integration suite:
```bash
python -m pytest -v
```

---

## 8. License

HackJudge is open-source software licensed under the [MIT License](LICENSE).
