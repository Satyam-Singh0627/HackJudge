# Threat Model & Security Posture

## 1. Overview & Threat Vectors
Hackathon management platforms are high-stakes systems subject to manipulation, collusion, and unauthorized tampering. This document outlines the threat landscape and corresponding technical mitigations built into the platform.

---

## 2. Threat Analysis & Mitigations

### 2.1 Sybil Voting & Ballot Stuffing
* **Threat**: Malicious participants script automated accounts or leverage open endpoints to cast hundreds of community votes for their own or friends' projects.
* **Mitigations**:
  1. **Strict Authentication & Unique Constraints**: Community voting requires an authenticated account. Unique compound constraint `UNIQUE(user_id, project_id)` enforced at the database level eliminates double-voting.
  2. **Account Age Threshold**: The system rejects votes from accounts created within a configurable quarantine window (e.g. created after voting opened).
  3. **Rate Limiting & Rapid Burst Detection**: Sliding window rate limits block repeated voting attempts within short temporal intervals.
  4. **Hidden Live Standings**: Public voting results are masked until voting concludes, denying attackers real-time feedback loops on whether their vote inflation is succeeding.
  5. **Audit Logging**: Every vote cast or rejected logs IP address, user agent, and timestamp for post-event forensic review.

### 2.2 Deadline Gaming & Late Submissions
* **Threat**: Teams modify code repositories or submission fields after the submission deadline has elapsed.
* **Mitigations**:
  1. **Backend Timestamp Verification**: Every submission endpoint independently verifies the event's `submission_end_date` against UTC server time. Frontend timer states are untrusted.
  2. **Immutability upon Lock**: Once an event enters `JUDGING` status or submissions close, submissions transition to `LOCKED`. All PUT/PATCH requests return `403 Forbidden` or `400 Bad Request`.
  3. **Submission Version Snapshots**: Any pre-deadline edit archives the prior state in `submission_versions` with an immutable snapshot, ensuring historical traceability.

### 2.3 Judge Collusion & Rogue Scoring
* **Threat**: A biased judge awards 100/100 to a favored team and zeroes out competitors, or attempts to score unassigned projects.
* **Mitigations**:
  1. **Strict Assignment Authorization**: Endpoints `/api/scores` check that the requesting judge has an active `judge_assignments` record for that specific `project_id`. Unauthorized scores return `403 Forbidden`.
  2. **Statistical Z-Score Normalization**: A rogue judge awarding extreme scores has their variance calculated. Normalization neutralizes artificial hyper-inflation or severe deflation.
  3. **Rubric Bounds Enforcement**: Pydantic schemas validate that criteria scores $R_c \in [0, M_c]$. Negative or out-of-range numbers are rejected with `422 Unprocessable Entity`.
  4. **Score Finalization Lock**: Once finalized, scores cannot be modified without organizer intervention, and all updates record an audit log.

### 2.4 Insecure Direct Object References (IDOR) & Privilege Escalation
* **Threat**: A participant queries or modifies another team's project, deletes members, or accesses organizer/judge private evaluation data.
* **Mitigations**:
  1. **Dual-Layer Authorization**: FastAPI dependency injection (`get_current_user`, `require_role`, `verify_team_member`, `verify_submission_owner`) checks ownership on every single endpoint.
  2. **Role Isolation**: Judge notes and raw judge scores are strictly filtered out of participant responses.
  3. **JWT Cryptographic Integrity**: Session tokens are cryptographically signed using HS256 with strong server-held secret keys and short TTLs.

### 2.5 Submission Scraping & Sensitive Data Exposure
* **Threat**: Public gallery endpoints leaking internal judging comments, participant contact info, or hidden audit logs.
* **Mitigations**:
  1. **Dedicated Public DTOs**: Public gallery endpoints use strict Pydantic response models (`ProjectPublicOut`) that explicitly omit judge comments, internal scores, emails, and audit trails.
  2. **Published Filter**: Only projects belonging to published events with status `SUBMITTED` or later appear in public search results.

---

## 3. Security Audit Checklist
- [x] Password storage using salted cryptographic hashing (Argon2 / PBKDF2).
- [x] Input sanitization and parameterized queries via SQLAlchemy 2.0 ORM (eliminating SQL Injection).
- [x] Strict CORS policy with configurable allowed origins.
- [x] Immutable append-only audit trail for all write operations.
- [x] Zero external CDN/cloud calls: operates hermetically in offline local environments.
