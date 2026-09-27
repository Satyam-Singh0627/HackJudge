# HackJudge — Static & Dynamic Security Audit Report

**Audit Execution Date**: September 27, 2026  
**Security Standard**: Dogfood 2026 Self-Hosted Platform Security Policy  

---

## 1. Tooling Execution Matrix

| Tool | Command | Result | Issues Identified | Resolution / Fix | Remaining Risk |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Bandit** (Python AST Security Scanner) | `python -m bandit -r backend/app` | **PASS** | 0 High, 0 Medium, 15 Low. 14 flags on seed passwords, 1 flag on pseudo-random generator for voting gallery order. | Passwords in seed file are local fixtures for development/testing only. Pseudo-random generator in `voting_service.py` is specifically for deterministic presentation shuffling (as per T3 specification) rather than cryptographic key generation. | Low (development-only fixtures). In production, `AUTO_SEED=false` can be configured. |
| **Grep / Pattern Secret Scan** | Scan for tokens, keys, passwords (`ghp_`, `sk-`, `AKIA`, private keys, JWT secrets) | **PASS** | Zero real credentials, cloud keys, or personal tokens found in the codebase. | Added production guard in `config.py` that halts backend startup if default insecure secrets are left active in production mode. | Zero. |
| **npm audit** (Node.js Dependency Scanner) | `npm audit` (in `frontend/`) | **INFO** | 1 moderate, 1 high advisory in `esbuild <=0.24.2` (dev server request reading). | Production deployment uses multi-stage Docker build with static Nginx image (`nginx:alpine`). The `esbuild` development server is not included or exposed in production. | Negligible in production runtime. |
| **Acceptance Suite RBAC Verification** | `python scripts/acceptance_test.py` (TEST 6, 7, 12, 14, 15, 16) | **PASS** | Evaluated judge access boundaries, duplicate voting, certificate XML parsing, and post-deadline modifications. | Strict backend role checks and ownership queries in all API handlers. Unassigned project access rejected with HTTP 403/404. Post-deadline project submissions rejected with HTTP 400. | Zero. |
| **XML / SVG Entity Injection Review** | Automated test `TEST 14` with special characters `&`, `<`, `>`, `"`, `'` | **PASS** | Previous implementation produced `xmlParseEntityRef: no name` when special characters were interpolated into SVG. | Implemented `html.escape()` sanitization on all dynamic fields in `certificate_service.py` before SVG rendering, and added responsive printable HTML endpoint. | Zero. |
| **CORS / Credentials Review** | Code inspection of `backend/app/config.py` & `main.py` | **PASS** | `allow_origins=["*"]` combined with `allow_credentials=True` is an insecure configuration. | Removed wildcard `*`. Restricted origins to explicit localhost/port whitelist and made origins configurable via `CORS_ORIGINS`. | Zero. |

---

## 2. In-Depth Security Domain Analysis

### 2.1 Authentication & Password Storage
* **Hashing**: Passwords are never stored in plaintext. Passwords are salted and hashed using Bcrypt (`passlib.context.CryptContext(schemes=["bcrypt"], deprecated="auto")`).
* **Session Tokens**: JWT tokens use HS256 algorithm with configurable secret and expiration.
* **Brute-Force & Session Safety**: Backend validates tokens on every protected request. Local storage stores only the bearer token, not user privileges. Role permissions are fetched and verified by backend dependencies.

### 2.2 Authorization & Insecure Direct Object References (IDOR)
* **Participant Isolation**: Participants cannot edit projects belonging to other teams or view unfinalized scores.
* **Judge Workload Isolation**: Judges can only retrieve projects explicitly assigned to their judge queue (`assignment.judge_id == user.id`). Submitting scores for unassigned projects is rejected with HTTP 403 / 404.
* **Score Privacy**: Individual judge evaluation scores remain private and are not visible to other judges or participants before results are released.

### 2.3 SQL Injection & ORM Safety
* All database interactions are executed using SQLAlchemy 2.0 ORM parameterized queries or SQLAlchemy query objects.
* No string concatenation or raw formatted SQL with user inputs exists anywhere in the codebase.
* Compound unique constraints (`UniqueConstraint("event_id", "user_id")`, `UniqueConstraint("event_id", "project_id", "user_id")`) prevent duplicate registrations, team memberships, and ballot stuffing at the relational database level.

### 2.4 Certificate Generation & Verification
* Digital certificates contain a cryptographic SHA-256 hash computed over:
  $$\text{hash} = \text{SHA-256}(\text{cert\_id} + \text{event\_id} + \text{user\_id} + \text{achievement} + \text{timestamp})$$
* Public verification endpoint (`/api/verify/{identifier}` and `/api/certificates/verify/{hash}`) performs a database lookup to confirm authenticity and returns the immutable record.
* SVG rendering escapes all XML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`).

### 2.5 Community Voting Anti-Abuse
* **Account Age Quarantine**: Accounts newer than 5 minutes are prevented from voting to mitigate rapid automated bot creation.
* **Compound Database Uniqueness**: `UNIQUE(event_id, project_id, user_id)` ensures duplicate votes are rejected with HTTP 400.
* **Self-Vote Prevention**: Participants cannot vote for projects submitted by their own team.
* **Rate Limiting**: Sliding window limits users to 10 votes per 60-second window.
* **Randomized Gallery Presentation**: Order shuffling uses seed-based pseudo-random permutations to eliminate positional bias without corrupting deterministic pagination.
