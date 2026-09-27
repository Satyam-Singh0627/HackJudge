from datetime import datetime, timezone, timedelta
import pytest

def get_auth_header(client, username, password):
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_event_lifecycle_and_creation(client):
    headers = get_auth_header(client, "organizer", "OrganizerPassword123!")
    now = datetime.now(timezone.utc)
    
    event_payload = {
        "title": "Summer Build Fest 2026",
        "slug": "summer-build-2026",
        "description": "A high-intensity local systems hackathon.",
        "reg_start_date": (now - timedelta(days=2)).isoformat(),
        "reg_end_date": (now + timedelta(days=5)).isoformat(),
        "submission_start_date": (now - timedelta(days=1)).isoformat(),
        "submission_end_date": (now + timedelta(days=4)).isoformat(),
        "judging_start_date": (now + timedelta(days=4)).isoformat(),
        "judging_end_date": (now + timedelta(days=7)).isoformat(),
        "results_date": (now + timedelta(days=8)).isoformat(),
        "min_team_size": 1,
        "max_team_size": 3,
        "voting_enabled": True
    }
    
    res = client.post("/api/events", json=event_payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["slug"] == "summer-build-2026"
    assert data["status"] in ("SUBMISSION_OPEN", "REGISTRATION_OPEN")

def test_team_creation_and_invite_join(client):
    headers_priya = get_auth_header(client, "dev_priya", "ParticipantPassword123!")
    
    # Dev priya already has a team from seed in dogfood-2026, so let's get events
    events = client.get("/api/events").json()
    target_event = next(e for e in events if e["slug"] == "summer-build-2026")
    
    # Create new team in summer-build-2026
    team_res = client.post("/api/teams", json={
        "event_id": target_event["id"],
        "name": "Quantum Solvers",
        "description": "Solving optimization problems"
    }, headers=headers_priya)
    assert team_res.status_code == 201
    team = team_res.json()
    invite_code = team["invite_code"]

    # Dev liam joins the team via invite code
    headers_liam = get_auth_header(client, "dev_liam", "ParticipantPassword123!")
    join_res = client.post("/api/teams/join", json={"invite_code": invite_code}, headers=headers_liam)
    assert join_res.status_code == 200
    assert len(join_res.json()["members"]) == 2

def test_prevent_duplicate_membership_in_same_event(client):
    headers_priya = get_auth_header(client, "dev_priya", "ParticipantPassword123!")
    events = client.get("/api/events").json()
    target_event = next(e for e in events if e["slug"] == "summer-build-2026")

    # Priya attempts to create a second team in the same event
    dup_team = client.post("/api/teams", json={
        "event_id": target_event["id"],
        "name": "Second Team Attempt",
        "description": "Should fail"
    }, headers=headers_priya)
    assert dup_team.status_code == 400
    assert "already belongs to a team" in dup_team.json()["detail"]
