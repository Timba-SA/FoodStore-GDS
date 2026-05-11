"""Integration-style tests for auth router endpoints.

Tests HTTP layer: status codes, response bodies, rate-limit headers.
Uses FastAPI TestClient with mocked AuthService to avoid DB dependency.

Covers tasks 5.1 (login/logout/me success+failure) and 5.3 (rate limiting 429).
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.modules.auth.schemas import TokenResponse, UserResponse
from app.modules.auth.service import AuthService


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def client():
    """Sync TestClient — works with async FastAPI via ASGI transport."""
    return TestClient(app, raise_server_exceptions=False)


def make_token_response(email: str = "user@example.com") -> TokenResponse:
    user = UserResponse(
        id=1,
        nombre="Test User",
        email=email,
        numero_telefono=None,
        roles=["customer"],
        creado_en=datetime.now(timezone.utc),
        actualizado_en=datetime.now(timezone.utc),
    )
    return TokenResponse(
        access_token="access.token.here",
        refresh_token="refresh-uuid-here",
        token_type="Bearer",
        user=user,
    )


# ============================================================================
# /auth/login (task 5.1)
# ============================================================================


class TestLoginEndpoint:
    def test_login_success_returns_200(self, client):
        with patch.object(AuthService, "login", AsyncMock(return_value=make_token_response())):
            resp = client.post(
                "/api/v1/auth/login",
                json={"email": "user@example.com", "password": "ValidPass123!"},
            )
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["token_type"] == "Bearer"
        assert body["user"]["email"] == "user@example.com"

    def test_login_invalid_credentials_returns_401(self, client):
        with patch.object(AuthService, "login", AsyncMock(side_effect=ValueError("Invalid credentials"))):
            resp = client.post(
                "/api/v1/auth/login",
                json={"email": "user@example.com", "password": "WrongPass!"},
            )
        assert resp.status_code == 401
        body = resp.json()
        assert body["detail"]["error"] == "invalid_credentials"

    def test_login_missing_email_returns_422(self, client):
        resp = client.post("/api/v1/auth/login", json={"password": "ValidPass123!"})
        assert resp.status_code == 422

    def test_login_missing_password_returns_422(self, client):
        resp = client.post("/api/v1/auth/login", json={"email": "user@example.com"})
        assert resp.status_code == 422

    def test_login_invalid_email_format_returns_422(self, client):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "not-an-email", "password": "ValidPass123!"},
        )
        assert resp.status_code == 422


# ============================================================================
# /auth/register (task 5.1)
# ============================================================================


class TestRegisterEndpoint:
    def test_register_success_returns_201(self, client):
        with patch.object(AuthService, "register", AsyncMock(return_value=make_token_response())):
            resp = client.post(
                "/api/v1/auth/register",
                json={
                    "nombre": "Juan Pérez",
                    "email": "juan@example.com",
                    "password": "ValidPass123!",
                },
            )
        assert resp.status_code == 201
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body

    def test_register_duplicate_email_returns_409(self, client):
        with patch.object(
            AuthService, "register", AsyncMock(side_effect=ValueError("El email ya está registrado"))
        ):
            resp = client.post(
                "/api/v1/auth/register",
                json={
                    "nombre": "Juan",
                    "email": "taken@example.com",
                    "password": "ValidPass123!",
                },
            )
        assert resp.status_code == 409
        body = resp.json()
        assert body["detail"]["error"] == "email_conflict"

    def test_register_password_too_short_returns_422(self, client):
        resp = client.post(
            "/api/v1/auth/register",
            json={"nombre": "Juan", "email": "j@example.com", "password": "short"},
        )
        assert resp.status_code == 422

    def test_register_nombre_too_short_returns_422(self, client):
        resp = client.post(
            "/api/v1/auth/register",
            json={"nombre": "A", "email": "j@example.com", "password": "ValidPass123!"},
        )
        assert resp.status_code == 422


# ============================================================================
# /auth/refresh (task 5.1 + 5.2)
# ============================================================================


class TestRefreshEndpoint:
    def test_refresh_success_returns_200(self, client):
        with patch.object(AuthService, "refresh", AsyncMock(return_value=make_token_response())):
            resp = client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": "some-valid-uuid"},
            )
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body

    def test_refresh_invalid_token_returns_401(self, client):
        with patch.object(
            AuthService, "refresh", AsyncMock(side_effect=ValueError("Invalid refresh token"))
        ):
            resp = client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": "bad-token"},
            )
        assert resp.status_code == 401
        body = resp.json()
        assert body["detail"]["error"] == "invalid_refresh_token"

    def test_refresh_expired_token_returns_401_with_code(self, client):
        with patch.object(
            AuthService, "refresh", AsyncMock(side_effect=ValueError("Refresh token expired"))
        ):
            resp = client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": "expired-token"},
            )
        assert resp.status_code == 401
        body = resp.json()
        assert body["detail"]["error"] == "token_expired"

    def test_refresh_replay_returns_401_with_replay_code(self, client):
        with patch.object(
            AuthService,
            "refresh",
            AsyncMock(side_effect=ValueError("Refresh token reuse detected — all sessions revoked")),
        ):
            resp = client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": "replayed-token"},
            )
        assert resp.status_code == 401
        body = resp.json()
        assert body["detail"]["error"] == "token_replay_detected"

    def test_refresh_missing_body_returns_422(self, client):
        resp = client.post("/api/v1/auth/refresh", json={})
        assert resp.status_code == 422


# ============================================================================
# /auth/logout (task 5.1)
# ============================================================================


class TestLogoutEndpoint:
    def test_logout_success_returns_200(self, client):
        with patch.object(AuthService, "logout", AsyncMock(return_value=None)):
            resp = client.post(
                "/api/v1/auth/logout",
                json={"refresh_token": "some-token"},
            )
        assert resp.status_code == 200
        assert resp.json()["message"] == "Logged out successfully"

    def test_logout_unknown_token_still_returns_200(self, client):
        """Logout is idempotent — unknown tokens don't return errors."""
        with patch.object(AuthService, "logout", AsyncMock(return_value=None)):
            resp = client.post(
                "/api/v1/auth/logout",
                json={"refresh_token": "totally-unknown-token"},
            )
        assert resp.status_code == 200


# ============================================================================
# /auth/me (task 5.1)
# ============================================================================


class TestMeEndpoint:
    def test_me_without_token_returns_401(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    def test_me_with_invalid_token_returns_401(self, client):
        resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert resp.status_code == 401

    def test_me_with_valid_token_returns_200(self, client):
        user_resp = UserResponse(
            id=1,
            nombre="Test User",
            email="user@example.com",
            numero_telefono=None,
            roles=["customer"],
            creado_en=datetime.now(timezone.utc),
            actualizado_en=datetime.now(timezone.utc),
        )
        with patch(
            "app.modules.auth.router.get_current_user",
            AsyncMock(return_value=user_resp),
        ):
            resp = client.get(
                "/api/v1/auth/me",
                headers={"Authorization": "Bearer some.valid.token"},
            )
        assert resp.status_code == 200
        body = resp.json()
        assert body["email"] == "user@example.com"
        assert "customer" in body["roles"]


# ============================================================================
# Rate limiting — 429 body contract (task 5.3)
# ============================================================================


class TestRateLimitBody:
    """Verify the 429 error body format without triggering actual rate limits.

    We test the handler directly rather than exhausting real limits
    to keep tests fast and deterministic.
    """

    def test_rate_limit_handler_returns_correct_body(self):
        """Test that our custom 429 handler produces the right contract."""
        from app.core.rate_limit import rate_limit_exceeded_handler
        from fastapi import Request
        from slowapi.errors import RateLimitExceeded

        # Build a minimal mock request
        mock_request = MagicMock(spec=Request)
        mock_exc = MagicMock(spec=RateLimitExceeded)
        mock_exc.retry_after = 60
        mock_exc.limit = "5/minute"

        response = rate_limit_exceeded_handler(mock_request, mock_exc)

        assert response.status_code == 429
        import json
        body = json.loads(response.body)
        assert body["error"] == "rate_limit_exceeded"
        assert "retry_after" in body
        assert "message" in body

    def test_rate_limit_response_includes_retry_after_header(self):
        from app.core.rate_limit import rate_limit_exceeded_handler
        from fastapi import Request
        from slowapi.errors import RateLimitExceeded

        mock_request = MagicMock(spec=Request)
        mock_exc = MagicMock(spec=RateLimitExceeded)
        mock_exc.retry_after = 30
        mock_exc.limit = "3/minute"

        response = rate_limit_exceeded_handler(mock_request, mock_exc)

        # Headers should include Retry-After
        headers = dict(response.headers)
        assert "retry-after" in headers or "Retry-After" in headers
