import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token


def test_password_hashing():
    pwd = "SecurePassword123!"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_flow():
    token = create_access_token(subject="user_123")
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user_123"
    assert decoded["iss"] == "basketiq-api"


def test_user_registration(client):
    res = client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "jane.doe@example.com"
    assert data["user"]["name"] == "Jane Doe"
    assert data["user"]["initial"] == "JD"


def test_duplicate_registration_fails(client):
    payload = {
        "name": "Duplicate User",
        "email": "duplicate@example.com",
        "password": "Password123!"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 200

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_login_success(client):
    res = client.post("/api/auth/login", json={
        "email": "tester@basketiq.io",
        "password": "TestPassword123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "tester@basketiq.io"


def test_login_invalid_password(client):
    res = client.post("/api/auth/login", json={
        "email": "tester@basketiq.io",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_social_login(client):
    res = client.post("/api/auth/social-login", json={
        "provider": "Google",
        "email": "google.user@example.com",
        "name": "Google User"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "google.user@example.com"


def test_get_current_user_me(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "tester@basketiq.io"
    assert data["name"] == "Test Runner"


def test_get_current_user_unauthorized(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401
