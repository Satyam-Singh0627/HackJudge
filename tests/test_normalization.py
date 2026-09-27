import pytest

def get_auth_header(client, username, password):
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_normalization_execution_and_comparison(client):
    headers_org = get_auth_header(client, "organizer", "OrganizerPassword123!")
    events = client.get("/api/events").json()
    event_id = events[0]["id"]

    # Trigger normalization
    norm_res = client.post(f"/api/normalization/{event_id}/run", headers=headers_org)
    assert norm_res.status_code == 200
    norm_list = norm_res.json()
    assert len(norm_list) > 0

    for item in norm_list:
        assert "normalized_final_score" in item
        assert "normalized_rank" in item
        assert "raw_rank" in item
        # Normalized score should be bounded between 0 and 100
        assert 0.0 <= item["normalized_final_score"] <= 100.0

    # Test Comparison matrix
    comp_res = client.get(f"/api/normalization/{event_id}/comparison", headers=headers_org)
    assert comp_res.status_code == 200
    comp_list = comp_res.json()
    assert len(comp_list) == len(norm_list)
    for c in comp_list:
        assert "rank_delta" in c
        assert c["rank_delta"] == c["raw_rank"] - c["normalized_rank"]

def test_results_hidden_during_judging_for_participants(client):
    headers_participant = get_auth_header(client, "participant", "ParticipantPassword123!")
    events = client.get("/api/events").json()
    event_id = events[0]["id"]

    # Participant tries to access normalization rankings while status != RESULTS
    res = client.get(f"/api/normalization/{event_id}/results", headers=headers_participant)
    # The event in seed data has judging active and results date in future, so it must be 403 Forbidden!
    assert res.status_code == 403
    assert "private until published" in res.json()["detail"].lower()
