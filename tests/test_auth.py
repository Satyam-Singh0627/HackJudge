import pytest

def test_login_success(client):
    res = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPassword123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"
    assert data["user"]["username"] == "admin"

def test_login_invalid_password(client):
    res = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    assert "Incorrect" in res.json()["detail"]

def test_get_current_user_me(client):
    # Login as organizer
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "organizer",
        "password": "OrganizerPassword123!"
    })
    token = login_res.json()["access_token"]
    
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "organizer"
    assert me_res.json()["role"] == "ORGANIZER"

def test_registration_and_duplicate_prevention(client):
    new_user = {
        "email": "testnewuser@hackathon.local",
        "username": "testnewuser",
        "full_name": "Test New User",
        "password": "NewUserPassword123!",
        "role": "PARTICIPANT"
    }
    # Register
    res = client.post("/api/auth/register", json=new_user)
    assert res.status_code == 201
    assert res.json()["username"] == "testnewuser"

    # Duplicate registration
    dup_res = client.post("/api/auth/register", json=new_user)
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.json()["detail"]

def test_role_isolation_participant_cannot_access_audit(client):
    # Login as participant
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "participant",
        "password": "ParticipantPassword123!"
    })
    token = login_res.json()["access_token"]

    # Attempt to access audit logs (only ORGANIZER / ADMIN)
    audit_res = client.get("/api/audit", headers={"Authorization": f"Bearer {token}"})
    assert audit_res.status_code == 403
    assert "Forbidden" in audit_res.json()["detail"]
