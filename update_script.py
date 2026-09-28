import urllib.request
import json

def update_date():
    try:
        # Login
        req = urllib.request.Request(
            "http://localhost:8000/api/auth/login",
            method="POST",
            data=json.dumps({"username_or_email": "organizer", "password": "OrganizerPassword123!"}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        resp = urllib.request.urlopen(req)
        token = json.loads(resp.read().decode('utf-8'))['access_token']
        print("Logged in successfully.")

        # Patch Event
        req2 = urllib.request.Request(
            "http://localhost:8000/api/events/d60ce86a-7098-44c3-a8ee-301d0f11167d",
            method="PATCH",
            data=json.dumps({"submission_end_date": "2026-09-29T18:00:00"}).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            }
        )
        resp2 = urllib.request.urlopen(req2)
        print("Updated event successfully:")
        print(json.loads(resp2.read().decode('utf-8')))

    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    update_date()
