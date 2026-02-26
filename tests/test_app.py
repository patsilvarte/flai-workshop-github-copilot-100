import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset participant lists before each test to ensure isolation."""
    original = {name: list(details["participants"]) for name, details in activities.items()}
    yield
    for name, participants in original.items():
        activities[name]["participants"] = participants


# ---------------------------------------------------------------------------
# GET /activities
# ---------------------------------------------------------------------------

def test_get_activities_returns_200():
    response = client.get("/activities")
    assert response.status_code == 200


def test_get_activities_returns_dict():
    response = client.get("/activities")
    data = response.json()
    assert isinstance(data, dict)
    assert len(data) > 0


def test_get_activities_contains_expected_fields():
    response = client.get("/activities")
    data = response.json()
    for activity in data.values():
        assert "description" in activity
        assert "schedule" in activity
        assert "max_participants" in activity
        assert "participants" in activity


# ---------------------------------------------------------------------------
# POST /activities/{activity_name}/signup
# ---------------------------------------------------------------------------

def test_signup_success():
    response = client.post(
        "/activities/Chess Club/signup",
        params={"email": "newstudent@mergington.edu"},
    )
    assert response.status_code == 200
    assert "newstudent@mergington.edu" in response.json()["message"]


def test_signup_adds_participant():
    client.post(
        "/activities/Chess Club/signup",
        params={"email": "newstudent@mergington.edu"},
    )
    response = client.get("/activities")
    participants = response.json()["Chess Club"]["participants"]
    assert "newstudent@mergington.edu" in participants


def test_signup_activity_not_found():
    response = client.post(
        "/activities/Nonexistent Activity/signup",
        params={"email": "student@mergington.edu"},
    )
    assert response.status_code == 404


def test_signup_already_registered():
    client.post(
        "/activities/Chess Club/signup",
        params={"email": "duplicate@mergington.edu"},
    )
    response = client.post(
        "/activities/Chess Club/signup",
        params={"email": "duplicate@mergington.edu"},
    )
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# DELETE /activities/{activity_name}/signup
# ---------------------------------------------------------------------------

def test_unregister_success():
    # First sign up
    client.post(
        "/activities/Chess Club/signup",
        params={"email": "todelete@mergington.edu"},
    )
    response = client.delete(
        "/activities/Chess Club/signup",
        params={"email": "todelete@mergington.edu"},
    )
    assert response.status_code == 200
    assert "todelete@mergington.edu" in response.json()["message"]


def test_unregister_removes_participant():
    client.post(
        "/activities/Chess Club/signup",
        params={"email": "todelete@mergington.edu"},
    )
    client.delete(
        "/activities/Chess Club/signup",
        params={"email": "todelete@mergington.edu"},
    )
    response = client.get("/activities")
    participants = response.json()["Chess Club"]["participants"]
    assert "todelete@mergington.edu" not in participants


def test_unregister_activity_not_found():
    response = client.delete(
        "/activities/Nonexistent Activity/signup",
        params={"email": "student@mergington.edu"},
    )
    assert response.status_code == 404


def test_unregister_not_signed_up():
    response = client.delete(
        "/activities/Chess Club/signup",
        params={"email": "notregistered@mergington.edu"},
    )
    assert response.status_code == 404
