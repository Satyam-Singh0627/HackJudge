from datetime import datetime, timezone, timedelta
import pytest

def get_auth_header(client, username, password):
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_submission_lifecycle_and_versioning(client):
    headers_priya = get_auth_header(client, "dev_priya", "ParticipantPassword123!")
    
    # Get seeded team for Dev Priya
    events = client.get("/api/events").json()
    event_id = events[0]["id"]
    
    my_team = client.get(f"/api/teams/my-team?event_id={event_id}", headers=headers_priya).json()
    assert my_team is not None

    # Get project
    projects = client.get("/api/projects").json()
    project = next(p for p in projects if p["team_id"] == my_team["id"])
    
    # Update project
    update_res = client.patch(f"/api/projects/{project['id']}", json={
        "title": "KernelZero: Enhanced Cryptographic Engine",
        "demo_url": "http://localhost:8000/demo/kernelzero-v2"
    }, headers=headers_priya)
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "KernelZero: Enhanced Cryptographic Engine"

    # Verify version snapshot created
    sub_id = project["submission"]["id"]
    v_res = client.get(f"/api/submissions/{sub_id}/versions", headers=headers_priya)
    assert v_res.status_code == 200
    assert len(v_res.json()) >= 1

def test_deadline_enforcement(client):
    headers_org = get_auth_header(client, "organizer", "OrganizerPassword123!")
    headers_participant = get_auth_header(client, "participant", "ParticipantPassword123!")
    
    # Create an expired event
    now = datetime.now(timezone.utc)
    expired_event = client.post("/api/events", json={
        "title": "Expired Hackathon 2025",
        "slug": "expired-hack-2025",
        "description": "Event in the past",
        "reg_start_date": (now - timedelta(days=20)).isoformat(),
        "reg_end_date": (now - timedelta(days=10)).isoformat(),
        "submission_start_date": (now - timedelta(days=10)).isoformat(),
        "submission_end_date": (now - timedelta(days=5)).isoformat(),
        "judging_start_date": (now - timedelta(days=5)).isoformat(),
        "judging_end_date": (now - timedelta(days=2)).isoformat(),
        "results_date": (now - timedelta(days=1)).isoformat(),
    }, headers=headers_org).json()

    # Participant creates a team
    t_res = client.post("/api/teams", json={
        "event_id": expired_event["id"],
        "name": "Late Comers",
        "description": "Late team"
    }, headers=headers_participant).json()

    # Attempt project creation on expired submission deadline
    p_res = client.post("/api/projects", json={
        "event_id": expired_event["id"],
        "team_id": t_res["id"],
        "title": "Late Project",
        "description": "Will fail due to deadline"
    }, headers=headers_participant)
    assert p_res.status_code in (400, 403)
    assert "closed" in p_res.json()["detail"].lower() or "passed" in p_res.json()["detail"].lower()
