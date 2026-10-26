import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from jose import jwt

from main import app
from config import settings
from sajag_models import UserRole
from sajag_auth import (
    create_sajag_token,
    revoke_token,
    SAJAG_ISSUER,
    SAJAG_AUDIENCE,
)

client = TestClient(app)


# --- Test Fixtures & Synthetic Identities ---

@pytest.fixture
def personnel_token():
    return create_sajag_token(
        user_id="usr_personnel_001",
        service_id="CRPF-98421",
        role=UserRole.PERSONNEL,
        unit="42nd Bn CRPF",
        name="Constable Alex Mercer"
    )

@pytest.fixture
def welfare_officer_token():
    return create_sajag_token(
        user_id="usr_officer_001",
        service_id="CRPF-OFF-01",
        role=UserRole.WELFARE_OFFICER,
        unit="42nd Bn CRPF",
        name="Welfare Officer Sharma"
    )

@pytest.fixture
def commanding_officer_token():
    return create_sajag_token(
        user_id="usr_commander_001",
        service_id="CRPF-CO-01",
        role=UserRole.COMMANDING_OFFICER,
        unit="42nd Bn CRPF",
        name="Commandant V. K. Singh",
        rank="Commandant"
    )


# --- 1. Authentication Failure Tests (401 Unauthorized) ---

def test_missing_token_rejected():
    """Requests to protected SAJAG endpoints without Authorization header must return 401."""
    res = client.get("/api/sajag/profile")
    assert res.status_code == 401
    assert "credentials were not provided" in res.json()["detail"]


def test_tampered_token_signature_rejected(personnel_token):
    """Tokens with altered payload or invalid signature must be rejected with 401."""
    tampered = personnel_token[:-5] + "XXXXX"
    res = client.get("/api/sajag/profile", headers={"Authorization": f"Bearer {tampered}"})
    assert res.status_code == 401
    assert "Invalid token signature" in res.json()["detail"]


def test_expired_token_rejected():
    """Expired tokens must be strictly rejected with 401."""
    expired_token = create_sajag_token(
        user_id="usr_test_expired",
        service_id="CRPF-EXP-01",
        role=UserRole.PERSONNEL,
        unit="42nd Bn CRPF",
        name="Expired User",
        expires_delta=timedelta(seconds=-10)  # Expired in past
    )
    res = client.get("/api/sajag/profile", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json()["detail"]


def test_missing_required_claims_rejected():
    """Tokens missing mandatory security claims (e.g. role or unit) must return 401."""
    # Mint token without role
    payload = {
        "sub": "usr_incomplete",
        "service_id": "CRPF-INC-01",
        "iss": SAJAG_ISSUER,
        "aud": SAJAG_AUDIENCE,
        "exp": 9999999999
    }
    incomplete_token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    res = client.get("/api/sajag/profile", headers={"Authorization": f"Bearer {incomplete_token}"})
    assert res.status_code == 401
    assert "missing mandatory authorization claim" in res.json()["detail"]


def test_invalid_audience_or_issuer_rejected():
    """Tokens signed with wrong audience or issuer must be rejected with 401."""
    payload = {
        "sub": "usr_wrong_aud",
        "service_id": "CRPF-AUD-01",
        "role": "PERSONNEL",
        "unit": "42nd Bn CRPF",
        "iss": "untrusted-issuer",
        "aud": "wrong-audience",
        "exp": 9999999999
    }
    wrong_token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    res = client.get("/api/sajag/profile", headers={"Authorization": f"Bearer {wrong_token}"})
    assert res.status_code == 401
    assert "Invalid token claims" in res.json()["detail"]


def test_revoked_token_rejected():
    """Revoked session tokens must immediately return 401."""
    token_to_revoke = create_sajag_token(
        user_id="usr_to_be_revoked",
        service_id="CRPF-REV-01",
        role=UserRole.PERSONNEL,
        unit="42nd Bn CRPF",
        name="Revoked Officer"
    )
    revoke_token(token_to_revoke)
    res = client.get("/api/sajag/profile", headers={"Authorization": f"Bearer {token_to_revoke}"})
    assert res.status_code == 401
    assert "revoked" in res.json()["detail"]


