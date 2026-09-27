from datetime import datetime, timezone, timedelta
import pytest

def get_auth_header(client, username, password):
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_full_hackathon_end_to_end_lifecycle(client):
    headers_org = get_auth_header(client, "organizer", "OrganizerPassword123!")
    headers_part = get_auth_header(client, "participant", "ParticipantPassword123!")
    headers_judge = get_auth_header(client, "judge", "JudgePassword123!")
    now = datetime.now(timezone.utc)

    # 1. Organizer creates event
    event_payload = {
        "title": "E2E Autonomous Challenge 2026",
        "slug": f"e2e-challenge-{int(now.timestamp())}",
        "description": "Full end-to-end verification hackathon.",
        "reg_start_date": (now - timedelta(days=2)).isoformat(),
        "reg_end_date": (now + timedelta(days=5)).isoformat(),
        "submission_start_date": (now - timedelta(days=1)).isoformat(),
        "submission_end_date": (now + timedelta(days=3)).isoformat(),
        "judging_start_date": (now - timedelta(hours=1)).isoformat(),
        "judging_end_date": (now + timedelta(days=5)).isoformat(),
        "results_date": (now + timedelta(days=6)).isoformat(),
        "min_team_size": 1,
        "max_team_size": 4,
        "voting_enabled": True
    }
    event_res = client.post("/api/events", json=event_payload, headers=headers_org)
    assert event_res.status_code == 201
    event = event_res.json()
    event_id = event["id"]

    # 2. Participant registers and creates team
    client.post(f"/api/events/{event_id}/register", headers=headers_part)
    team_res = client.post("/api/teams", json={
        "event_id": event_id,
        "name": f"E2E Team {int(now.timestamp())}",
        "description": "End to end test team"
    }, headers=headers_part)
    assert team_res.status_code == 201
    team = team_res.json()

    # 3. Team submits project
    proj_res = client.post("/api/projects", json={
        "event_id": event_id,
        "team_id": team["id"],
        "title": "E2E Autonomous Rover",
        "tagline": "Autonomous local mapping unit",
        "description": "Local offline mapping algorithm implemented in Python.",
        "technologies": "Python, SQLite, OpenCV",
        "github_url": "https://github.com/dogfood2026/e2e-rover"
    }, headers=headers_part)
    assert proj_res.status_code == 201
    project = proj_res.json()

    # Finalize submission
    finalize_res = client.post(f"/api/submissions/{project['id']}/finalize", headers=headers_part)
    assert finalize_res.status_code == 200
    assert finalize_res.json()["status"] == "SUBMITTED"

    # 4. Organizer creates rubric
    rubric_res = client.post("/api/rubrics", json={
        "event_id": event_id,
        "name": "E2E Scoring Rubric",
        "criteria": [
            {"name": "Architecture", "weight": 0.50, "max_score": 10.0},
            {"name": "Execution", "weight": 0.50, "max_score": 10.0}
        ]
    }, headers=headers_org)
    assert rubric_res.status_code == 201
    rubric = rubric_res.json()

    # 5. Organizer assigns judge algorithmically
    assign_res = client.post("/api/assignments/algorithmic", json={
        "event_id": event_id,
        "judges_per_project": 1
    }, headers=headers_org)
    assert assign_res.status_code == 201
    assignments = assign_res.json()
    assert len(assignments) >= 1
    assignment = assignments[0]

    # 6. Judge evaluates project
    # Fetch judge who got assigned
    assigned_judge_id = assignment["judge_id"]
    judge_user = client.get(f"/api/users/{assigned_judge_id}", headers=headers_org).json()
    pwd = "AdminPassword123!" if judge_user["username"] == "admin" else "JudgePassword123!"
    headers_assigned_judge = get_auth_header(client, judge_user["username"], pwd)

    criteria_scores = [
        {"criterion_id": rubric["criteria"][0]["id"], "raw_score": 9.0},
        {"criterion_id": rubric["criteria"][1]["id"], "raw_score": 8.0}
    ]
    score_res = client.post("/api/scores", json={
        "assignment_id": assignment["id"],
        "criterion_scores": criteria_scores,
        "feedback": "Flawless end-to-end execution.",
        "finalize": True
    }, headers=headers_assigned_judge)
    assert score_res.status_code == 200
    assert score_res.json()["weighted_total_score"] == 85.0 # (9/10*50) + (8/10*50) = 45 + 40 = 85.0

    # 7. Normalization runs
    norm_res = client.post(f"/api/normalization/{event_id}/run", headers=headers_org)
    assert norm_res.status_code == 200
    norm_data = norm_res.json()
    assert len(norm_data) >= 1
    assert norm_data[0]["project_title"] == "E2E Autonomous Rover"

    # 8. Public gallery displays project
    gallery_res = client.get(f"/api/projects/gallery/{event_id}")
    assert gallery_res.status_code == 200
    gallery_titles = [g["title"] for g in gallery_res.json()]
    assert "E2E Autonomous Rover" in gallery_titles
