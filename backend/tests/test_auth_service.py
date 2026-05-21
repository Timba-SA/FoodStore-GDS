"""Unit tests for AuthService — password, token creation, refresh/rotation, logout, replay.

Covers tasks 5.1 (login/me), 5.2 (rotation/replay), via unit tests with mocked DB.
"""

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch, call

import pytest
from jose import jwt

from app.modules.auth.service import AuthService, pwd_context
from app.modules.auth.schemas import RegisterRequest, TokenPayload
from app.db.models.usuario import RefreshToken


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_settings():
    s = MagicMock()
    s.SECRET_KEY = "test-secret-key-for-jwt"
    s.ALGORITHM = "HS256"
    s.ACCESS_TOKEN_EXPIRE_MINUTES = 30
    s.REFRESH_TOKEN_EXPIRE_DAYS = 7
    s.RATE_LIMIT_LOGIN = "5/minute"
    s.RATE_LIMIT_REGISTER = "3/minute"
    s.RATE_LIMIT_REFRESH = "10/minute"
    return s


@pytest.fixture
def mock_session():
    return AsyncMock()


@pytest.fixture
async def service(mock_session, mock_settings):
    with patch("app.modules.auth.service.get_settings", return_value=mock_settings):
        svc = AuthService(mock_session)
        yield svc


def make_user(user_id: int = 1, email: str = "user@example.com") -> MagicMock:
    user = MagicMock()
    user.id = user_id
    user.email = email
    user.nombre = "Test User"
    user.hashed_password = AuthService.hash_password("ValidPass123!")
    user.numero_telefono = None
    user.activo = True
    user.deleted_at = None
    user.created_at = datetime.now(timezone.utc)
    user.updated_at = datetime.now(timezone.utc)
    return user


def make_refresh_token(
    user_id: int = 1,
    raw: str | None = None,
    revoked: bool = False,
    expired: bool = False,
    family_id: str | None = None,
) -> tuple[str, RefreshToken]:
    """Return (raw_token, RefreshToken ORM-like object)."""
    raw = raw or str(uuid.uuid4())
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    expires_at = (
        datetime.now(timezone.utc) - timedelta(hours=1)
        if expired
        else datetime.now(timezone.utc) + timedelta(days=7)
    )
    rt = MagicMock(spec=RefreshToken)
    rt.id = 42
    rt.usuario_id = user_id
    rt.token_hash = token_hash
    rt.expires_at = expires_at
    rt.revoked_at = datetime.now(timezone.utc) if revoked else None
    rt.replaced_by_id = None
    rt.family_id = family_id or str(uuid.uuid4())
    return raw, rt


# ============================================================================
# Password hashing
# ============================================================================


class TestPasswordHashing:
    def test_hash_creates_bcrypt(self):
        h = AuthService.hash_password("Secret123!")
        assert h.startswith("$2")
        assert len(h) > 20

    def test_same_password_different_hashes(self):
        p = "Secret123!"
        h1 = AuthService.hash_password(p)
        h2 = AuthService.hash_password(p)
        assert h1 != h2

    def test_verify_correct_password(self):
        p = "Secret123!"
        assert AuthService.verify_password(p, AuthService.hash_password(p)) is True

    def test_verify_wrong_password(self):
        assert AuthService.verify_password("Wrong!", AuthService.hash_password("Secret123!")) is False

    def test_verify_empty_password(self):
        assert AuthService.verify_password("", AuthService.hash_password("Secret123!")) is False


# ============================================================================
# Access token — creation & decoding (task 5.1)
# ============================================================================


class TestAccessToken:
    def test_create_returns_valid_jwt(self, service):
        token = service.create_access_token(1, "a@b.com", ["customer"])
        assert isinstance(token, str)
        assert token.count(".") == 2

    def test_payload_fields(self, service):
        token = service.create_access_token(1, "a@b.com", ["customer", "admin"])
        claims = jwt.get_unverified_claims(token)
        assert claims["user_id"] == 1
        assert claims["email"] == "a@b.com"
        assert set(claims["roles"]) == {"customer", "admin"}
        assert "exp" in claims and "iat" in claims

    def test_decode_valid_token(self, service):
        token = service.create_access_token(1, "a@b.com", ["customer"])
        payload = service.decode_access_token(token)
        assert payload is not None
        assert payload.user_id == 1
        assert payload.email == "a@b.com"

    def test_decode_invalid_token_returns_none(self, service):
        assert service.decode_access_token("not.a.token") is None

    def test_decode_expired_token_returns_none(self, service, mock_settings):
        expired_payload = {
            "user_id": 1,
            "email": "a@b.com",
            "roles": [],
            "exp": (datetime.now(timezone.utc) - timedelta(hours=1)).timestamp(),
            "iat": (datetime.now(timezone.utc) - timedelta(hours=2)).timestamp(),
        }
        token = jwt.encode(expired_payload, mock_settings.SECRET_KEY, algorithm="HS256")
        assert service.decode_access_token(token) is None

    def test_decode_wrong_secret_returns_none(self, service):
        payload = {
            "user_id": 1,
            "email": "a@b.com",
            "roles": [],
            "exp": (datetime.now(timezone.utc) + timedelta(hours=1)).timestamp(),
            "iat": datetime.now(timezone.utc).timestamp(),
        }
        token = jwt.encode(payload, "wrong-secret", algorithm="HS256")
        assert service.decode_access_token(token) is None


# ============================================================================
# Login (task 5.1)
# ============================================================================


class TestLogin:
    async def test_login_success_returns_token_response(self, service, mock_session):
        user = make_user()
        # Mock get_user_by_email
        result = MagicMock()
        result.scalars.return_value.first.return_value = user
        mock_session.execute.return_value = result

        # Mock get_user_roles
        roles_result = MagicMock()
        roles_result.scalars.return_value.all.return_value = []
        mock_session.execute.side_effect = [result, roles_result, roles_result]

        with patch.object(service, "get_user_by_email", AsyncMock(return_value=user)), \
             patch.object(service, "get_user_roles", AsyncMock(return_value=["customer"])), \
             patch.object(service, "_create_refresh_token_record", AsyncMock(return_value=("raw-token", MagicMock()))):
            resp = await service.login("user@example.com", "ValidPass123!")

        assert resp.access_token
        assert resp.refresh_token == "raw-token"
        assert resp.user.email == "user@example.com"

    async def test_login_wrong_password_raises_value_error(self, service):
        user = make_user()
        with patch.object(service, "get_user_by_email", AsyncMock(return_value=user)):
            with pytest.raises(ValueError, match="Invalid credentials"):
                await service.login("user@example.com", "WrongPassword!")

    async def test_login_user_not_found_raises_value_error(self, service):
        with patch.object(service, "get_user_by_email", AsyncMock(return_value=None)):
            with pytest.raises(ValueError, match="Invalid credentials"):
                await service.login("nobody@example.com", "AnyPass123!")


# ============================================================================
# Refresh + rotation (task 5.2)
# ============================================================================


class TestRefreshRotation:
    async def test_valid_token_rotates_successfully(self, service):
        raw, rt = make_refresh_token()
        user = make_user(user_id=rt.usuario_id)

        with patch.object(service.token_repo, "get_by_token_hash", AsyncMock(return_value=rt)), \
             patch.object(service, "get_user_by_id", AsyncMock(return_value=user)), \
             patch.object(service, "get_user_roles", AsyncMock(return_value=["customer"])), \
             patch.object(service.token_repo, "revoke_family_single", AsyncMock()) as mock_revoke, \
             patch.object(service, "_create_refresh_token_record", AsyncMock(return_value=("new-raw", MagicMock(id=99)))), \
             patch.object(service.token_repo, "link_replaced_by", AsyncMock()) as mock_link, \
             patch.object(service, "_build_user_response", AsyncMock(return_value=MagicMock(id=user.id, email=user.email, nombre=user.nombre, numero_telefono=None, roles=["customer"], creado_en=user.created_at, actualizado_en=user.updated_at))):
            resp = await service.refresh(raw)

        assert resp.refresh_token == "new-raw"
        assert resp.access_token
        mock_revoke.assert_awaited_once_with(rt.id)
        mock_link.assert_awaited_once()

    async def test_expired_token_raises_value_error(self, service):
        raw, rt = make_refresh_token(expired=True)

        with patch.object(service.token_repo, "get_by_token_hash", AsyncMock(return_value=rt)):
            with pytest.raises(ValueError, match="expired"):
                await service.refresh(raw)

    async def test_nonexistent_token_raises_value_error(self, service):
        with patch.object(service.token_repo, "get_by_token_hash", AsyncMock(return_value=None)):
            with pytest.raises(ValueError, match="Invalid refresh token"):
                await service.refresh(str(uuid.uuid4()))


# ============================================================================
# Replay detection (task 5.2)
# ============================================================================


class TestReplayDetection:
    async def test_revoked_token_triggers_family_revocation(self, service):
        """Using a revoked token must revoke the entire family and raise 401."""
        raw, rt = make_refresh_token(revoked=True)

        with patch.object(service.token_repo, "get_by_token_hash", AsyncMock(return_value=rt)), \
             patch.object(service.token_repo, "revoke_family", AsyncMock()) as mock_revoke:
            with pytest.raises(ValueError, match="reuse detected"):
                await service.refresh(raw)

        mock_revoke.assert_awaited_once_with(rt.family_id)

    async def test_replay_does_not_issue_new_token(self, service):
        """On replay, _create_refresh_token_record must NOT be called."""
        raw, rt = make_refresh_token(revoked=True)

        with patch.object(service.token_repo, "get_by_token_hash", AsyncMock(return_value=rt)), \
             patch.object(service.token_repo, "revoke_family", AsyncMock()), \
             patch.object(service, "_create_refresh_token_record", AsyncMock()) as mock_create:
            with pytest.raises(ValueError):
                await service.refresh(raw)

        mock_create.assert_not_awaited()

    async def test_two_tokens_same_family_replay_revokes_all(self, service):
        """If an old token from a family is reused, the whole family is nuked."""
        family_id = str(uuid.uuid4())
        raw, rt = make_refresh_token(revoked=True, family_id=family_id)

        with patch.object(service.token_repo, "get_by_token_hash", AsyncMock(return_value=rt)), \
             patch.object(service.token_repo, "revoke_family", AsyncMock()) as mock_rf:
            with pytest.raises(ValueError):
                await service.refresh(raw)

        mock_rf.assert_awaited_once_with(family_id)


# ============================================================================
# Logout (task 5.1)
# ============================================================================


class TestLogout:
    async def test_logout_revokes_token(self, service):
        raw, rt = make_refresh_token()

        with patch.object(service.token_repo, "get_by_token_hash", AsyncMock(return_value=rt)), \
             patch.object(service.token_repo, "revoke_family_single", AsyncMock()) as mock_rev:
            await service.logout(raw)

        mock_rev.assert_awaited_once_with(rt.id)

    async def test_logout_already_revoked_is_idempotent(self, service):
        """Calling logout on an already-revoked token should NOT call revoke again."""
        raw, rt = make_refresh_token(revoked=True)

        with patch.object(service.token_repo, "get_by_token_hash", AsyncMock(return_value=rt)), \
             patch.object(service.token_repo, "revoke_family_single", AsyncMock()) as mock_rev:
            await service.logout(raw)

        mock_rev.assert_not_awaited()

    async def test_logout_unknown_token_is_idempotent(self, service):
        """Calling logout with an unknown token should not raise."""
        with patch.object(service.token_repo, "get_by_token_hash", AsyncMock(return_value=None)), \
             patch.object(service.token_repo, "revoke_family_single", AsyncMock()) as mock_rev:
            await service.logout("unknown-raw-token")

        mock_rev.assert_not_awaited()


# ============================================================================
# get_current_user / /me (task 5.1)
# ============================================================================


class TestGetCurrentUser:
    async def test_valid_token_returns_user(self, service):
        user = make_user()
        token = service.create_access_token(user.id, user.email, ["customer"])

        with patch.object(service, "get_user_by_id", AsyncMock(return_value=user)):
            result = await service.get_current_user(token)

        assert result.id == user.id

    async def test_invalid_token_raises_value_error(self, service):
        with pytest.raises(ValueError, match="Invalid or expired"):
            await service.get_current_user("bad.token.here")

    async def test_inactive_user_raises_value_error(self, service):
        user = make_user()
        user.activo = False
        token = service.create_access_token(user.id, user.email, ["customer"])

        with patch.object(service, "get_user_by_id", AsyncMock(return_value=user)):
            with pytest.raises(ValueError, match="inactive"):
                await service.get_current_user(token)
