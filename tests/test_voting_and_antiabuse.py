import pytest

def get_auth_header(client, username, password):
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_community_voting_and_duplicate_prevention(client):
    headers_sophie = get_auth_header(client, "dev_sophie", "ParticipantPassword123!")
    projects = client.get("/api/projects").json()
    # Choose a project that dev_sophie does not own (e.g. p2)
    target_project = next(p for p in projects if "KernelZero" in p["team"]["name"])

    # Cast vote
    vote_res = client.post("/api/votes", json={"project_id": target_project["id"]}, headers=headers_sophie)
    assert vote_res.status_code == 201

    # Duplicate vote attempt
    dup_res = client.post("/api/votes", json={"project_id": target_project["id"]}, headers=headers_sophie)
    assert dup_res.status_code == 400
    assert "already voted" in dup_res.json()["detail"].lower()

def test_prevent_voting_for_own_project(client):
    headers_priya = get_auth_header(client, "dev_priya", "ParticipantPassword123!")
    projects = client.get("/api/projects").json()
    own_project = next(p for p in projects if "KernelZero" in p["team"]["name"])

    res = client.post("/api/votes", json={"project_id": own_project["id"]}, headers=headers_priya)
    assert res.status_code == 400
    assert "cannot vote for your own team" in res.json()["detail"].lower()

def test_randomized_gallery_presentation(client):
    events = client.get("/api/events").json()
    event_id = events[0]["id"]

    res1 = client.get(f"/api/projects/gallery/{event_id}?seed=user_session_alpha")
    res2 = client.get(f"/api/projects/gallery/{event_id}?seed=user_session_alpha")
    assert res1.status_code == 200
    assert res2.status_code == 200
    # Reproducible seed returns identical order for the same seed
    ids1 = [p["id"] for p in res1.json()]
    ids2 = [p["id"] for p in res2.json()]
    assert ids1 == ids2

def test_comments_and_moderation(client):
    headers_liam = get_auth_header(client, "dev_liam", "ParticipantPassword123!")
    projects = client.get("/api/projects").json()
    project_id = projects[0]["id"]

    # Post comment
    c_res = client.post("/api/comments", json={
        "project_id": project_id,
        "content": "Impressive real-time architecture!"
    }, headers=headers_liam)
    assert c_res.status_code == 201
    comment_id = c_res.json()["id"]

    # Delete own comment
    del_res = client.delete(f"/api/comments/{comment_id}", headers=headers_liam)
    assert del_res.status_code == 200
