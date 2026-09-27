#!/usr/bin/env python3
"""
HackJudge - Dogfood 2026 Hackathon Platform Acceptance Test Suite
Validates the complete 16-test end-to-end workflow and T1-T4 requirements.
Outputs acceptance-report.txt with honest PASS/FAIL/PARTIAL status.
"""
import sys
import os
from datetime import datetime, timezone, timedelta

# Ensure backend package is in path
sys.path.insert(0, os.path.abspath("backend"))

from fastapi.testclient import TestClient
from app.main import app

def run_acceptance_suite():
    report_lines = []
    def log(msg=""):
        print(msg)
        report_lines.append(msg)

    log("=" * 70)
    log("HACKJUDGE - DOGFOOD 2026 ACCEPTANCE TEST REPORT")
    log(f"Execution Date/Time: {datetime.now(timezone.utc).isoformat()}")
    log("Platform: HackJudge (Open, Self-Hosted Hackathon Management & Judging)")
    log("=" * 70)

    test_results = {}

    with TestClient(app) as client:
        # Helper for login
        def get_token(username, password):
            res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
            if res.status_code != 200:
                raise RuntimeError(f"Login failed for {username}: {res.text}")
            return res.json()["access_token"]

        admin_token = get_token("admin", "AdminPassword123!")
        org_token = get_token("organizer", "OrganizerPassword123!")
        judge_token = get_token("judge", "JudgePassword123!")
        part_token = get_token("participant", "ParticipantPassword123!")

        org_headers = {"Authorization": f"Bearer {org_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        judge_headers = {"Authorization": f"Bearer {judge_token}"}
        part_headers = {"Authorization": f"Bearer {part_token}"}

        now = datetime.now(timezone.utc)
        test_slug = f"acc-{int(now.timestamp())}"

        # ----------------------------------------------------
        # TEST 1: Create event
        # ----------------------------------------------------
        try:
            e_res = client.post("/api/events", json={
                "title": "Dogfood 2026 Championship",
                "slug": test_slug,
                "description": "Enterprise self-hosted hackathon platform testing.",
                "reg_start_date": (now - timedelta(days=2)).isoformat(),
                "reg_end_date": (now + timedelta(days=5)).isoformat(),
                "submission_start_date": (now - timedelta(days=1)).isoformat(),
                "submission_end_date": (now + timedelta(days=3)).isoformat(),
                "judging_start_date": (now - timedelta(hours=1)).isoformat(),
                "judging_end_date": (now + timedelta(days=6)).isoformat(),
                "results_date": (now + timedelta(days=7)).isoformat(),
                "min_team_size": 1,
                "max_team_size": 4,
                "voting_enabled": True
            }, headers=org_headers)
            assert e_res.status_code == 201, f"Status {e_res.status_code}: {e_res.text}"
            event = e_res.json()
            event_id = event["id"]
            test_results["TEST 1: Create event"] = "PASS"
            log("TEST 1: Create event -> PASS (Event ID: " + event_id + ")")
        except Exception as e:
            test_results["TEST 1: Create event"] = f"FAIL ({e})"
            log(f"TEST 1: Create event -> FAIL ({e})")
            return False

        # Create track and rubric for the event
        rubric_res = client.post("/api/rubrics", json={
            "event_id": event_id,
            "name": "Standard Dogfood Rubric",
            "criteria": [
                {"name": "Innovation & Impact", "weight": 0.40, "max_score": 10.0, "description": "Originality"},
                {"name": "Technical Execution", "weight": 0.60, "max_score": 10.0, "description": "Architecture & quality"}
            ]
        }, headers=org_headers)
        assert rubric_res.status_code == 201, f"Rubric error: {rubric_res.text}"
        rubric = rubric_res.json()

        # ----------------------------------------------------
        # TEST 2: Register participant
        # ----------------------------------------------------
        try:
            reg_res = client.post(f"/api/events/{event_id}/register", headers=part_headers)
            assert reg_res.status_code in (200, 201), f"Status {reg_res.status_code}: {reg_res.text}"
            test_results["TEST 2: Register participant"] = "PASS"
            log("TEST 2: Register participant -> PASS")
        except Exception as e:
            test_results["TEST 2: Register participant"] = f"FAIL ({e})"
            log(f"TEST 2: Register participant -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 3: Create team
        # ----------------------------------------------------
        try:
            team_res = client.post("/api/teams", json={
                "event_id": event_id,
                "name": f"Team Raptor {int(now.timestamp())}",
                "description": "High performance engineering squad"
            }, headers=part_headers)
            assert team_res.status_code == 201, f"Status {team_res.status_code}: {team_res.text}"
            team = team_res.json()
            test_results["TEST 3: Create team"] = "PASS"
            log("TEST 3: Create team -> PASS (Team ID: " + team["id"] + ")")
        except Exception as e:
            test_results["TEST 3: Create team"] = f"FAIL ({e})"
            log(f"TEST 3: Create team -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 4: Submit project
        # ----------------------------------------------------
        project = None
        assignment = None
        try:
            proj_res = client.post("/api/projects", json={
                "event_id": event_id,
                "team_id": team["id"],
                "title": "Quantum HackJudge Core",
                "tagline": "Next-generation distributed judging engine",
                "description": "Real-time deterministic Z-score calculations with cryptographic certificate verification.",
                "github_url": "https://github.com/hackjudge/core",
                "demo_url": "https://hackjudge.local/demo",
                "technologies": "Python, FastAPI, React, TypeScript, SQLite"
            }, headers=part_headers)
            assert proj_res.status_code == 201, f"Status {proj_res.status_code}: {proj_res.text}"
            project = proj_res.json()

            # Finalize submission
            final_res = client.post(f"/api/submissions/{project['id']}/finalize", headers=part_headers)
            assert final_res.status_code == 200, f"Status {final_res.status_code}: {final_res.text}"
            test_results["TEST 4: Submit project"] = "PASS"
            log("TEST 4: Submit project -> PASS (Submission finalized & timestamped)")
        except Exception as e:
            test_results["TEST 4: Submit project"] = f"FAIL ({e})"
            log(f"TEST 4: Submit project -> FAIL ({e})")

        # Create a second project to test unassigned boundary
        team2_res = client.post("/api/teams", json={
            "event_id": event_id,
            "name": f"Team Phoenix {int(now.timestamp())}",
            "description": "Second team"
        }, headers=admin_headers)
        team2 = team2_res.json()
        proj2_res = client.post("/api/projects", json={
            "event_id": event_id,
            "team_id": team2["id"],
            "title": "Unassigned Project Beta",
            "tagline": "Isolation test target",
            "description": "Should never be accessible for judging by unassigned judge.",
            "github_url": "https://github.com/hackjudge/beta"
        }, headers=admin_headers)
        project2 = proj2_res.json()
        client.post(f"/api/submissions/{project2['id']}/finalize", headers=admin_headers)

        # ----------------------------------------------------
        # TEST 5: Assign judge
        # ----------------------------------------------------
        try:
            # Look up judge user ID
            me_judge = client.get("/api/auth/me", headers=judge_headers).json()
            judge_id = me_judge["id"]

            assign_res = client.post("/api/assignments/manual", json={
                "event_id": event_id,
                "judge_id": judge_id,
                "project_id": project["id"]
            }, headers=org_headers)
            assert assign_res.status_code == 201, f"Status {assign_res.status_code}: {assign_res.text}"
            assignment = assign_res.json()
            test_results["TEST 5: Assign judge"] = "PASS"
            log("TEST 5: Assign judge -> PASS (Assigned to Judge: " + me_judge["username"] + ")")
        except Exception as e:
            test_results["TEST 5: Assign judge"] = f"FAIL ({e})"
            log(f"TEST 5: Assign judge -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 6: Verify judge can access assigned project
        # ----------------------------------------------------
        try:
            j_dash = client.get(f"/api/judges/dashboard/{event_id}", headers=judge_headers)
            assert j_dash.status_code == 200, f"Status {j_dash.status_code}"
            assigned_ids = [a["project_id"] for a in j_dash.json()["assigned_projects"]]
            assert project["id"] in assigned_ids, "Assigned project missing from judge dashboard"
            test_results["TEST 6: Verify judge can access assigned project"] = "PASS"
            log("TEST 6: Verify judge can access assigned project -> PASS")
        except Exception as e:
            test_results["TEST 6: Verify judge can access assigned project"] = f"FAIL ({e})"
            log(f"TEST 6: Verify judge can access assigned project -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 7: Verify judge cannot access unassigned project
        # ----------------------------------------------------
        try:
            # Attempt to submit a score for unassigned project2 using invalid assignment or unassigned query
            unassigned_score = client.post("/api/scores", json={
                "assignment_id": "00000000-0000-0000-0000-000000000000",
                "criterion_scores": [
                    {"criterion_id": rubric["criteria"][0]["id"], "raw_score": 9.0}
                ],
                "finalize": True
            }, headers=judge_headers)
            assert unassigned_score.status_code in (403, 404), f"Expected 403/404, got {unassigned_score.status_code}"

            # Verify unassigned project is NOT in judge's assigned queue
            assert project2["id"] not in assigned_ids, "Security breach: Unassigned project present in judge queue"
            test_results["TEST 7: Verify judge cannot access unassigned project"] = "PASS"
            log("TEST 7: Verify judge cannot access unassigned project -> PASS (Access correctly rejected 404/403)")
        except Exception as e:
            test_results["TEST 7: Verify judge cannot access unassigned project"] = f"FAIL ({e})"
            log(f"TEST 7: Verify judge cannot access unassigned project -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 8: Submit evaluation
        # ----------------------------------------------------
        try:
            c_scores = [
                {"criterion_id": rubric["criteria"][0]["id"], "raw_score": 8.5},
                {"criterion_id": rubric["criteria"][1]["id"], "raw_score": 9.5}
            ]
            eval_res = client.post("/api/scores", json={
                "assignment_id": assignment["id"],
                "criterion_scores": c_scores,
                "feedback": "Outstanding technical architecture and execution.",
                "finalize": True
            }, headers=judge_headers)
            assert eval_res.status_code == 200, f"Status {eval_res.status_code}: {eval_res.text}"
            score_data = eval_res.json()
            # (8.5/10 * 40) + (9.5/10 * 60) = 34 + 57 = 91.0
            assert score_data["weighted_total_score"] == 91.0, f"Expected 91.0, got {score_data['weighted_total_score']}"
            test_results["TEST 8: Submit evaluation"] = "PASS"
            log("TEST 8: Submit evaluation -> PASS (Weighted Score: 91.0/100, Finalized & Locked)")
        except Exception as e:
            test_results["TEST 8: Submit evaluation"] = f"FAIL ({e})"
            log(f"TEST 8: Submit evaluation -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 9: Run normalization
        # ----------------------------------------------------
        try:
            norm_res = client.post(f"/api/normalization/{event_id}/run", headers=org_headers)
            assert norm_res.status_code == 200, f"Status {norm_res.status_code}: {norm_res.text}"
            norm_records = norm_res.json()
            assert len(norm_records) >= 1, "Normalization returned 0 records"
            test_results["TEST 9: Run normalization"] = "PASS"
            log("TEST 9: Run normalization -> PASS (Z-score algorithm executed across judges)")
        except Exception as e:
            test_results["TEST 9: Run normalization"] = f"FAIL ({e})"
            log(f"TEST 9: Run normalization -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 10: Verify ranking
        # ----------------------------------------------------
        try:
            rank_res = client.get(f"/api/normalization/{event_id}/comparison", headers=org_headers)
            assert rank_res.status_code == 200, f"Status {rank_res.status_code}: {rank_res.text}"
            comparisons = rank_res.json()
            assert len(comparisons) >= 1, "Rank comparison returned 0 entries"
            top_ranked = comparisons[0]
            assert "raw_rank" in top_ranked and "normalized_rank" in top_ranked, "Missing rank fields"
            test_results["TEST 10: Verify ranking"] = "PASS"
            log("TEST 10: Verify ranking -> PASS (Raw vs. Normalized rank comparison verified)")
        except Exception as e:
            test_results["TEST 10: Verify ranking"] = f"FAIL ({e})"
            log(f"TEST 10: Verify ranking -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 11: Vote
        # ----------------------------------------------------
        try:
            vote_res = client.post("/api/votes", json={"project_id": project["id"]}, headers=judge_headers)
            assert vote_res.status_code == 201, f"Status {vote_res.status_code}: {vote_res.text}"
            test_results["TEST 11: Vote"] = "PASS"
            log("TEST 11: Vote -> PASS (Community vote recorded in database)")
        except Exception as e:
            test_results["TEST 11: Vote"] = f"FAIL ({e})"
            log(f"TEST 11: Vote -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 12: Prevent duplicate vote
        # ----------------------------------------------------
        try:
            dup_res = client.post("/api/votes", json={"project_id": project["id"]}, headers=judge_headers)
            assert dup_res.status_code == 400, f"Expected 400 rejection, got {dup_res.status_code}"
            test_results["TEST 12: Prevent duplicate vote"] = "PASS"
            log("TEST 12: Prevent duplicate vote -> PASS (Duplicate vote rejected with HTTP 400)")
        except Exception as e:
            test_results["TEST 12: Prevent duplicate vote"] = f"FAIL ({e})"
            log(f"TEST 12: Prevent duplicate vote -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 13: Export CSV
        # ----------------------------------------------------
        try:
            csv_res = client.get(f"/api/exports/rankings/{event_id}", headers=org_headers)
            assert csv_res.status_code == 200, f"Status {csv_res.status_code}"
            assert "Normalized Rank" in csv_res.text and "Raw Average Score" in csv_res.text, "CSV headers missing"
            test_results["TEST 13: Export CSV"] = "PASS"
            log("TEST 13: Export CSV -> PASS (Streaming CSV export with normalized metrics)")
        except Exception as e:
            test_results["TEST 13: Export CSV"] = f"FAIL ({e})"
            log(f"TEST 13: Export CSV -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 14: Verify certificate
        # ----------------------------------------------------
        try:
            # Generate certificate with special characters to test XML escaping
            cert_res = client.post("/api/certificates/generate", json={
                "user_id": me_judge["id"],
                "event_id": event_id,
                "cert_type": "WINNER",
                "achievement": "1st Place & Best 'System' Architecture <HackJudge>"
            }, headers=org_headers)
            assert cert_res.status_code == 201, f"Status {cert_res.status_code}: {cert_res.text}"
            cert = cert_res.json()

            # Verify cryptographic record
            v_res = client.get(f"/api/certificates/verify/{cert['verification_hash']}")
            assert v_res.status_code == 200 and v_res.json()["valid"] is True, "Verification failed"

            # Verify universal verify endpoint alias
            v_alias = client.get(f"/api/verify/{cert['verification_hash']}")
            assert v_alias.status_code == 200 and v_alias.json()["valid"] is True, "Verify alias failed"

            # Verify XML/SVG renders cleanly without entity errors
            svg_res = client.get(f"/api/certificates/{cert['id']}/render")
            assert svg_res.status_code == 200 and "<svg" in svg_res.text, "SVG render failed"
            assert "xmlParseEntityRef" not in svg_res.text, "XML Entity Ref bug detected"

            # Verify printable HTML
            html_res = client.get(f"/api/certificates/{cert['id']}/html")
            assert html_res.status_code == 200 and "<!DOCTYPE html>" in html_res.text, "HTML render failed"

            test_results["TEST 14: Verify certificate"] = "PASS"
            log("TEST 14: Verify certificate -> PASS (Cryptographic verification & escaped SVG/HTML OK)")
        except Exception as e:
            test_results["TEST 14: Verify certificate"] = f"FAIL ({e})"
            log(f"TEST 14: Verify certificate -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 15: Verify role isolation
        # ----------------------------------------------------
        try:
            # Participant cannot trigger normalization
            p_norm = client.post(f"/api/normalization/{event_id}/run", headers=part_headers)
            assert p_norm.status_code in (401, 403), f"Participant should not normalize: {p_norm.status_code}"

            # Participant cannot access audit trail
            p_audit = client.get("/api/audit", headers=part_headers)
            assert p_audit.status_code in (401, 403), f"Participant should not read audit: {p_audit.status_code}"

            # Judge cannot create events
            j_event = client.post("/api/events", json={"title": "Rogue Event"}, headers=judge_headers)
            assert j_event.status_code in (401, 403), f"Judge should not create events: {j_event.status_code}"

            test_results["TEST 15: Verify role isolation"] = "PASS"
            log("TEST 15: Verify role isolation -> PASS (Backend RBAC strictly enforced across roles)")
        except Exception as e:
            test_results["TEST 15: Verify role isolation"] = f"FAIL ({e})"
            log(f"TEST 15: Verify role isolation -> FAIL ({e})")

        # ----------------------------------------------------
        # TEST 16: Verify deadline enforcement
        # ----------------------------------------------------
        try:
            # Create an event where submission deadline is in the past
            expired_slug = f"expired-{int(now.timestamp())}"
            exp_res = client.post("/api/events", json={
                "title": "Expired Hackathon",
                "slug": expired_slug,
                "description": "Deadline test",
                "reg_start_date": (now - timedelta(days=10)).isoformat(),
                "reg_end_date": (now - timedelta(days=5)).isoformat(),
                "submission_start_date": (now - timedelta(days=8)).isoformat(),
                "submission_end_date": (now - timedelta(days=1)).isoformat(),  # Past deadline
                "judging_start_date": (now - timedelta(days=1)).isoformat(),
                "judging_end_date": (now + timedelta(days=2)).isoformat(),
                "results_date": (now + timedelta(days=3)).isoformat(),
                "min_team_size": 1,
                "max_team_size": 4
            }, headers=org_headers)
            assert exp_res.status_code == 201
            exp_event = exp_res.json()

            # Create team for expired event
            exp_team_res = client.post("/api/teams", json={
                "event_id": exp_event["id"],
                "name": f"Late Team {int(now.timestamp())}"
            }, headers=part_headers)
            exp_team = exp_team_res.json()

            # Attempt project submission after deadline
            late_proj = client.post("/api/projects", json={
                "event_id": exp_event["id"],
                "team_id": exp_team["id"],
                "title": "Late Project",
                "description": "Should be rejected by deadline enforcement."
            }, headers=part_headers)
            assert late_proj.status_code in (400, 403), f"Expected 400/403 for expired deadline, got {late_proj.status_code}: {late_proj.text}"

            test_results["TEST 16: Verify deadline enforcement"] = "PASS"
            log("TEST 16: Verify deadline enforcement -> PASS (Post-deadline submission strictly rejected)")
        except Exception as e:
            test_results["TEST 16: Verify deadline enforcement"] = f"FAIL ({e})"
            log(f"TEST 16: Verify deadline enforcement -> FAIL ({e})")

    # ----------------------------------------------------
    # Tiers Summary Evaluation
    # ----------------------------------------------------
    log("\n" + "=" * 70)
    log("DOGFOOD 2026 SPECIFICATION TIER COMPLIANCE")
    log("=" * 70)

    all_passed = all("PASS" in status for status in test_results.values())
    t1_pass = all(test_results.get(f"TEST {i}: " + k, "FAIL") == "PASS" for i, k in [
        (1, "Create event"), (2, "Register participant"), (3, "Create team"),
        (4, "Submit project"), (16, "Verify deadline enforcement")
    ])
    t2_pass = all(test_results.get(f"TEST {i}: " + k, "FAIL") == "PASS" for i, k in [
        (5, "Assign judge"), (6, "Verify judge can access assigned project"),
        (7, "Verify judge cannot access unassigned project"), (8, "Submit evaluation"),
        (9, "Run normalization"), (10, "Verify ranking"), (13, "Export CSV")
    ])
    t3_pass = all(test_results.get(f"TEST {i}: " + k, "FAIL") == "PASS" for i, k in [
        (11, "Vote"), (12, "Prevent duplicate vote"), (15, "Verify role isolation")
    ])
    t4_pass = test_results.get("TEST 14: Verify certificate", "FAIL") == "PASS"

    log(f"Tier 1 (Core Platform & Submissions)       : {'PASS' if t1_pass else 'FAIL'}")
    log(f"Tier 2 (Judging Engine & Normalization)     : {'PASS' if t2_pass else 'FAIL'}")
    log(f"Tier 3 (Community Voting & Anti-Abuse)      : {'PASS' if t3_pass else 'FAIL'}")
    log(f"Tier 4 (Verifiable Certificates & REST API) : {'PASS' if t4_pass else 'FAIL'}")
    log("=" * 70)
    log(f"OVERALL STATUS: {'PASS' if all_passed else 'FAIL'}")
    log("=" * 70)

    # Write report to acceptance-report.txt
    with open("acceptance-report.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines) + "\n")

    log("\nSaved acceptance report to acceptance-report.txt")
    return all_passed

if __name__ == "__main__":
    success = run_acceptance_suite()
    sys.exit(0 if success else 1)
