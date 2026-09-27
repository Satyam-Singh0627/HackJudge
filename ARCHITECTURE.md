# System Architecture: Dogfood 2026 Hackathon Management & Judging Platform

## 1. Executive Overview
The Hackathon Management & Judging Platform is an enterprise-grade, open-source, self-hosted web application engineered specifically for running high-stakes hackathons completely offline or on self-contained local infrastructure. It features robust role-based access control (RBAC), multi-track event lifecycle enforcement, team formation workflows, submission versioning, weighted scoring, algorithmic judge assignment, statistical cross-judge score normalization (Z-score), anti-abuse community voting, local certificate generation, and an immutable audit log.

```
                           +--------------------------------------+
                           |          Client / Browser            |
                           |   (React 18 + Vite + Tailwind CSS)   |
                           +-------------------+------------------+
                                               |
                                     REST APIs / JSON
                                               |
                                               v
+-----------------------------------------------------------------------------------+
|                            FastAPI Backend Server                                 |
|                                                                                   |
|  +----------------+   +----------------+   +-----------------+   +-------------+  |
|  | Auth & RBAC    |   | Event Engine   |   | Team / Projects |   | Submissions |  |
|  +----------------+   +----------------+   +-----------------+   +-------------+  |
|                                                                                   |
|  +----------------+   +----------------+   +-----------------+   +-------------+  |
|  | Judging & Rubric|  | Normalization  |   | Voting / Anti-  |   | Audit Log & |  |
|  | Engine (Assign)|   | Service (Z-Sc) |   | Abuse Engine    |   | Certificates|  |
|  +----------------+   +----------------+   +-----------------+   +-------------+  |
|                                                                                   |
|                     SQLAlchemy 2.0 ORM / Repository Layer                         |
+-----------------------------------------------------------------------------------+
                                               |
                                        SQLAlchemy Driver
                                               |
                                               v
                           +--------------------------------------+
                           |   Relational Database Storage        |
                           |  (PostgreSQL 16 in Docker / SQLite)  |
                           +--------------------------------------+
```

---

## 2. Tier Implementation Mapping

* **T1: Core Hackathon Functionality**
  - Local authentication (Argon2 / PBKDF2-SHA256 password hashing, signed JWT session tokens).
  - RBAC roles: `ADMIN`, `ORGANIZER`, `JUDGE`, `PARTICIPANT`.
  - Event lifecycle: dynamic status resolution from backend timestamps (`DRAFT`, `REGISTRATION_OPEN`, `SUBMISSION_OPEN`, `SUBMISSION_CLOSED`, `JUDGING`, `RESULTS`, `ARCHIVED`).
  - Track & prize management.
  - Team formation: invite codes, membership validation, min/max team size constraints, leave/remove workflows.
  - Project submissions: title, description, track, GitHub URL, demo URL, video URL, tech stack tags, submission states (`DRAFT`, `SUBMITTED`, `LOCKED`, `UNDER_REVIEW`, `FINALIZED`).
  - Strict submission deadline enforcement at the database and service layer.
  - Searchable public gallery with track filters, technology filters, and privacy flags.

* **T2: Judging Engine & Integrity**
  - Customizable multi-criteria rubrics with configurable weights and maximum scores (validating $\sum weight = 100\%$).
  - Judge assignment engine:
    1. *Manual*: granular single-assignment control.
    2. *Batch*: assign pools of judges to tracks or submission subsets.
    3. *Algorithmic*: round-robin / balanced workload distribution targeting $N$ judges per project.
  - Judge isolation: judges only receive and can only view/evaluate their assigned projects.
  - Weighted scoring calculation: $\text{weighted\_score} = \frac{\text{raw}}{\text{max}} \times \text{weight}$.
  - Statistical cross-judge score normalization:
    * Robust Z-score normalization: $z = \frac{x - \mu}{\sigma}$ with zero-variance and single-eval fallback safeguards.
    * Rescaling into standardized $0 - 100$ scale for human-interpretable rankings.
    * Side-by-side comparison matrix (Raw vs Normalized rank comparison).
  - Score finalization with tamper-prevention and revision audit tracking.
  - CSV exports: participants, teams, submissions, raw scores, normalized scores, rankings, audit logs.

* **T3: Community Voting & Anti-Abuse**
  - Community public voting with configurable voting windows and vote quotas per participant.
  - Live result hiding during active voting rounds.
  - Randomized project presentation using reproducible session-based seeds to prevent positional bias.
  - Deterministic anti-abuse filters:
    * Token / user rate limiting.
    * Duplicate vote prevention on unique database constraint `(voter_id, project_id)`.
    * Rapid activity burst detection.
    * Account age requirement threshold.
  - Moderated project comments with organizer administrative controls.

* **T4: APIs, Certificates & Webhooks**
  - OpenAPI 3.0 specification auto-generated at `/docs` and `/redoc`.
  - Cryptographically verifiable digital certificates with unique UUIDs, QR verification paths, and verification endpoints (`/api/certificates/verify/{cert_id}`).
  - Local certificate rendering (HTML/SVG/PNG templates without external font or CDN dependencies).
  - Outgoing webhook dispatching for platform events (`submission.created`, `score.submitted`, `results.published`).

---

## 3. Technology Stack & Separation of Concerns

### Backend Architecture (`backend/app`)
- **Framework**: FastAPI (async HTTP handling, automatic OpenAPI schema generation, dependency injection).
- **ORM & Data Layer**: SQLAlchemy 2.0 with type annotations, relational constraints, foreign keys, and cascading rules.
- **Validation**: Pydantic v2 schemas for request validation, data serialization, and schema contracts.
- **Directory Layout**:
  ```
  backend/
    app/
      main.py               # Application entrypoint & CORS middleware
      config.py             # App settings, environment, secret keys
      database.py           # DB engine, session maker, base declarative model
      models/               # SQLAlchemy ORM models
      schemas/              # Pydantic schemas (requests, responses)
      auth/                 # Token handling, password hashing, dependencies
      permissions/          # Role checkers and policy verification
      routers/              # API endpoints organized by resource
      services/             # Pure business logic (assignment, scoring, normalization)
      judging/              # Judging calculations, rubric validation
      voting/               # Anti-abuse engine, randomized presentation
      exports/              # Streaming CSV exporters
      audit/                # Centralized audit logging helper
      seed/                 # Production-grade seed data fixtures
      certificates/         # Self-contained SVG/HTML certificate engine
      webhooks/             # Webhook dispatcher
    tests/                  # Pytest test suite (unit, integration, e2e)
    Dockerfile
    requirements.txt
  ```

### Frontend Architecture (`frontend/`)
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: Tailwind CSS and clean custom components designed for high legibility, accessible contrast, responsive layout, and desktop-first hackathon operation.
- **Routing**: React Router v6 with protected routes and role-based guards.
- **State & Data Fetching**: Centralized API service with local storage token persistence, clear error handling, empty/loading states, and live calculation previews.

---

## 4. Security & Compliance Principles
1. **Zero External Dependencies**: All fonts (system fonts), assets, stylesheets, scripts, and libraries are locally bundled. No CDN calls or cloud services.
2. **Backend Authority**: Frontend checks are purely for UX; every single mutation and query verifies identity, role, ownership, and state validity on the backend.
3. **Auditability**: All critical actions are recorded into an append-only `audit_logs` table with actor ID, IP address, action code, timestamp, and details payload.
