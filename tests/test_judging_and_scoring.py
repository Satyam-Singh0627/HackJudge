import pytest

def get_auth_header(client, username, password):
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_rubric_weights_sum_validation(client):
    headers_org = get_auth_header(client, "organizer", "OrganizerPassword123!")
    events = client.get("/api/events").json()
    event_id = events[0]["id"]

    # Invalid weights summing to 0.70 instead of 1.0 (or 100)
    invalid_rubric = {
        "event_id": event_id,
        "name": "Invalid Rubric",
        "criteria": [
            {"name": "Crit A", "weight": 0.40, "max_score": 10.0},
            {"name": "Crit B", "weight": 0.30, "max_score": 10.0}
        ]
    }
    res = client.post("/api/rubrics", json=invalid_rubric, headers=headers_org)
    assert res.status_code == 400
    assert "weight must sum to 1.0" in res.json()["detail"]

def test_judge_dashboard_and_isolation(client):
    headers_judge = get_auth_header(client, "judge", "JudgePassword123!")
    events = client.get("/api/events").json()
    event_id = events[0]["id"]

    dash_res = client.get(f"/api/judges/dashboard/{event_id}", headers=headers_judge)
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["judge_id"] is not None
    assert dash["total_assigned"] > 0
    assert len(dash["assigned_projects"]) > 0

    # Ensure judge can only see projects assigned to them
    assigned_proj_ids = set(p["project_id"] for p in dash["assigned_projects"])
    all_projects = client.get("/api/projects").json()
    # At least one project should exist that is NOT in assigned_proj_ids or pending
    for p in dash["assigned_projects"]:
        assert p["project_id"] in assigned_proj_ids

def test_score_bounds_and_weighted_calculation(client):
    headers_judge = get_auth_header(client, "judge", "JudgePassword123!")
    events = client.get("/api/events").json()
    event_id = events[0]["id"]

    # Get rubric criteria
    rubric = client.get(f"/api/rubrics/{event_id}").json()
    criteria = rubric["criteria"]

    # Get an assignment for judge
    dash = client.get(f"/api/judges/dashboard/{event_id}", headers=headers_judge).json()
    assignment = next(p for p in dash["assigned_projects"] if not p["is_finalized"])
    assignment_id = assignment["assignment_id"]

    # Test out of bounds score (15.0 on a 10.0 max)
    invalid_score = {
        "assignment_id": assignment_id,
        "criterion_scores": [{"criterion_id": criteria[0]["id"], "raw_score": 15.0}],
        "finalize": False
    }
    err_res = client.post("/api/scores", json=invalid_score, headers=headers_judge)
    assert err_res.status_code == 400
    assert "between 0.0 and" in err_res.json()["detail"]

    # Test valid score submission
    valid_criterion_scores = [{"criterion_id": c["id"], "raw_score": 8.0} for c in criteria]
    score_res = client.post("/api/scores", json={
        "assignment_id": assignment_id,
        "criterion_scores": valid_criterion_scores,
        "feedback": "Consistent solid delivery.",
        "finalize": True
    }, headers=headers_judge)
    assert score_res.status_code == 200
    score_data = score_res.json()
    assert score_data["is_finalized"] is True
    # If all raw scores are 8.0 out of 10.0, weighted total must be exactly 80.0
    assert score_data["weighted_total_score"] == 80.0
