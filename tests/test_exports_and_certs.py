import pytest

def get_auth_header(client, username, password):
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_csv_exports(client):
    headers_org = get_auth_header(client, "organizer", "OrganizerPassword123!")
    events = client.get("/api/events").json()
    event_id = events[0]["id"]

    for export_type in ["participants", "teams", "submissions", "scores", "rankings"]:
        res = client.get(f"/api/exports/{export_type}/{event_id}", headers=headers_org)
        assert res.status_code == 200
        assert res.headers["content-type"].startswith("text/csv")
        content = res.text
        assert len(content) > 10

    # Audit export
    audit_res = client.get("/api/exports/audit", headers=headers_org)
    assert audit_res.status_code == 200
    assert "Audit ID" in audit_res.text

def test_certificate_generation_and_public_verification(client):
    headers_org = get_auth_header(client, "organizer", "OrganizerPassword123!")
    users = client.get("/api/users", headers=headers_org).json()
    target_user = users[0]
    events = client.get("/api/events").json()
    event_id = events[0]["id"]

    # Generate certificate
    cert_res = client.post("/api/certificates/generate", json={
        "user_id": target_user["id"],
        "event_id": event_id,
        "cert_type": "WINNER",
        "achievement": "Best AI Innovation Award"
    }, headers=headers_org)
    assert cert_res.status_code == 201
    cert_data = cert_res.json()
    cert_id = cert_data["id"]
    verification_hash = cert_data["verification_hash"]

    # Public verification using ID
    verify_res1 = client.get(f"/api/certificates/verify/{cert_id}")
    assert verify_res1.status_code == 200
    assert verify_res1.json()["valid"] is True

    # Public verification using hash
    verify_res2 = client.get(f"/api/certificates/verify/{verification_hash}")
    assert verify_res2.status_code == 200
    assert verify_res2.json()["valid"] is True

    # SVG rendering
    svg_res = client.get(f"/api/certificates/{cert_id}/render")
    assert svg_res.status_code == 200
    assert "<svg" in svg_res.text
    assert cert_data["recipient_name"] in svg_res.text
