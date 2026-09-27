# HackJudge — Pre-Release Verification Checklist

This checklist must be reviewed before committing or releasing any artifacts to GitHub.

- [x] **Dogfood requirements audited**: All T1, T2, T3, and T4 items verified against specifications.
- [x] **T1 verified**: Authentication, roles, events, teams, project submissions, deadlines, public gallery.
- [x] **T2 verified**: Judge invitation, algorithmic assignment, isolation, weighted rubrics, Z-score normalization, CSV exports.
- [x] **T3 verified**: Community voting, anti-abuse checks, hidden results, comments, audit logs.
- [x] **T4 status documented**: OpenAPI 3.0 specs, digital certificates, webhooks, cryptographic verification.
- [x] **Authentication tested**: Bcrypt password hashing, JWT sessions, invalid credentials rejected.
- [x] **Authorization tested**: Backend dependencies enforce RBAC for PARTICIPANT, JUDGE, ORGANIZER, ADMIN.
- [x] **IDOR tested**: Direct requests to unassigned/unauthorized resources return HTTP 403/404.
- [x] **SQL injection reviewed**: SQLAlchemy ORM parameterized queries used exclusively; no string concatenation.
- [x] **XSS reviewed**: React dynamic escaping, HTML entity sanitization for certificates.
- [x] **CORS reviewed**: Configurable explicit origin whitelist; wildcard with credentials removed.
- [x] **Rate limiting tested**: Voting rate limit window active.
- [x] **Voting abuse tested**: Duplicate voting rejected with HTTP 400; own-project votes blocked; account age quarantine.
- [x] **Certificate verification tested**: SHA-256 hash lookup verified; SVG XML entities properly escaped.
- [x] **Secret scan passed**: No private keys, cloud tokens, API keys, or real passwords in code.
- [x] **Dependency audit passed**: Python dependencies and Node dependencies audited and documented.
- [x] **.gitignore reviewed**: Ignoring `.env`, `node_modules`, `dist`, `hackathon.db`, `test_hackathon.db`, `*.log`, `*.pem`, `*.key`.
- [x] **.env.example created**: Clean placeholders only without real secrets.
- [x] **Docker configuration verified**: Multi-stage Dockerfiles and `docker-compose.yml` for offline operation.
- [x] **Offline startup tested**: Zero external CDN, cloud auth, or hosted API dependencies.
- [x] **Pytest suite passed**: 22/22 unit and integration tests passing.
- [x] **Acceptance suite passed**: 16/16 end-to-end workflow tests passing in `acceptance-report.txt`.
- [x] **README updated**: Clean documentation, route map, light SaaS identity, test accounts.
- [x] **No fake claims or simulated features**: Every action backed by database and business logic.
- [x] **No fake statistics**: Seed data reflects official Dogfood challenge parameters (no tracks, ₹2,50,000 prize pool).
- [x] **No real credentials committed**: Seed credentials are mock fixtures for evaluation.
- [x] **Git history plan prepared**: Logical, incremental commits staged and committed sequentially.
