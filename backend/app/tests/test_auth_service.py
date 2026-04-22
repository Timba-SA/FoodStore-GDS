"""Unit tests for AuthService - password hashing, token creation, token validation."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta, timezone
import uuid

from app.modules.auth.service import AuthService, pwd_context
from app.modules.auth.schemas import RegisterRequest, TokenPayload
from app.db.models.usuario import Usuario, Rol, RefreshToken


@pytest.fixture
def mock_settings():
    """Mock settings fixture."""
    settings = MagicMock()
    settings.SECRET_KEY = "test-secret-key-for-jwt"
    settings.ALGORITHM = "HS256"
    settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
    settings.REFRESH_TOKEN_EXPIRE_DAYS = 7
    return settings


@pytest.fixture
def mock_session():
    """Mock AsyncSession fixture."""
    return AsyncMock()


@pytest.fixture
async def auth_service(mock_session, mock_settings):
    """Create AuthService with mocked session and settings."""
    with patch("app.modules.auth.service.get_settings", return_value=mock_settings):
        service = AuthService(mock_session)
        yield service


# ============================================================================
# PASSWORD HASHING TESTS
# ============================================================================

class TestPasswordHashing:
    """Test password hashing and verification."""

    def test_hash_password_creates_valid_hash(self):
        """Test that hash_password creates a valid bcrypt hash."""
        password = "MySecurePassword123!"
        hashed = AuthService.hash_password(password)
        
        # Hash should not be the plain password
        assert hashed != password
        # Hash should be a bcrypt hash (starts with $2)
        assert hashed.startswith("$2")
        # Hash should be longer than password
        assert len(hashed) > len(password)

    def test_hash_password_different_hashes_for_same_password(self):
        """Test that hashing same password twice produces different hashes."""
        password = "MySecurePassword123!"
        hash1 = AuthService.hash_password(password)
        hash2 = AuthService.hash_password(password)
        
        # Different hashes (bcrypt uses salt)
        assert hash1 != hash2
        # But both should verify against the password
        assert pwd_context.verify(password, hash1)
        assert pwd_context.verify(password, hash2)

    def test_verify_password_correct_password(self):
        """Test verify_password with correct password."""
        password = "MySecurePassword123!"
        hashed = AuthService.hash_password(password)
        
        assert AuthService.verify_password(password, hashed) is True

    def test_verify_password_incorrect_password(self):
        """Test verify_password with incorrect password."""
        password = "MySecurePassword123!"
        wrong_password = "WrongPassword456!"
        hashed = AuthService.hash_password(password)
        
        assert AuthService.verify_password(wrong_password, hashed) is False

    def test_verify_password_empty_password(self):
        """Test verify_password with empty password."""
        password = "MySecurePassword123!"
        hashed = AuthService.hash_password(password)
        
        assert AuthService.verify_password("", hashed) is False


# ============================================================================
# ACCESS TOKEN TESTS
# ============================================================================

class TestAccessTokenCreation:
    """Test JWT access token creation and validation."""

    @pytest.mark.asyncio
    async def test_create_access_token_valid_structure(self, auth_service, mock_settings):
        """Test that created access token has valid JWT structure."""
        user_id = 1
        email = "user@example.com"
        roles = ["customer"]
        
        token = auth_service.create_access_token(user_id, email, roles)
        
        # Should be a string (JWT)
        assert isinstance(token, str)
        # JWT has 3 parts separated by dots
        assert token.count(".") == 2

    @pytest.mark.asyncio
    async def test_create_access_token_payload_correct(self, auth_service, mock_settings):
        """Test that access token contains correct payload."""
        from jose import jwt
        
        user_id = 1
        email = "user@example.com"
        roles = ["customer"]
        
        token = auth_service.create_access_token(user_id, email, roles)
        
        # Decode without verification (for testing payload)
        payload = jwt.get_unverified_claims(token)
        
        assert payload["user_id"] == user_id
        assert payload["email"] == email
        assert payload["roles"] == roles
        assert "exp" in payload
        assert "iat" in payload

    @pytest.mark.asyncio
    async def test_create_access_token_expiry_correct(self, auth_service, mock_settings):
        """Test that access token has correct expiry time."""
        from jose import jwt
        
        user_id = 1
        email = "user@example.com"
        roles = ["customer"]
        
        before_creation = datetime.now(timezone.utc)
        token = auth_service.create_access_token(user_id, email, roles)
        after_creation = datetime.now(timezone.utc)
        
        payload = jwt.get_unverified_claims(token)
        exp_timestamp = payload["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
        
        # Expiry should be approximately ACCESS_TOKEN_EXPIRE_MINUTES in the future
        expected_expiry = before_creation + timedelta(minutes=mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # Allow 5 second tolerance
        assert (exp_datetime - expected_expiry).total_seconds() < 5

    @pytest.mark.asyncio
    async def test_create_access_token_different_users(self, auth_service):
        """Test that different users get different tokens."""
        token1 = auth_service.create_access_token(1, "user1@example.com", ["customer"])
        token2 = auth_service.create_access_token(2, "user2@example.com", ["customer"])
        
        assert token1 != token2


# ============================================================================
# REFRESH TOKEN TESTS
# ============================================================================

class TestRefreshTokenCreation:
    """Test refresh token creation and storage."""

    @pytest.mark.asyncio
    async def test_create_refresh_token_valid_uuid(self, auth_service, mock_session):
        """Test that refresh token is a valid UUID."""
        user_id = 1
        
        token = await auth_service.create_refresh_token(user_id)
        
        # Should be a valid UUID format
        try:
            uuid.UUID(token)
            assert True
        except ValueError:
            pytest.fail(f"Token {token} is not a valid UUID")

    @pytest.mark.asyncio
    async def test_create_refresh_token_stored_in_db(self, auth_service, mock_session):
        """Test that refresh token is added to session."""
        user_id = 1
        
        token = await auth_service.create_refresh_token(user_id)
        
        # Session.add and flush should have been called
        mock_session.add.assert_called_once()
        mock_session.flush.assert_called()
        
        # Check the RefreshToken object
        added_token = mock_session.add.call_args[0][0]
        assert isinstance(added_token, RefreshToken)
        assert added_token.usuario_id == user_id
        assert added_token.token == token
        assert added_token.is_revoked is False

    @pytest.mark.asyncio
    async def test_create_refresh_token_expiry_correct(self, auth_service, mock_session, mock_settings):
        """Test that refresh token has correct expiry."""
        user_id = 1
        
        before_creation = datetime.now(timezone.utc)
        await auth_service.create_refresh_token(user_id)
        after_creation = datetime.now(timezone.utc)
        
        added_token = mock_session.add.call_args[0][0]
        expires_at = added_token.expires_at
        
        expected_expiry = before_creation + timedelta(days=mock_settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        # Allow 5 second tolerance
        assert abs((expires_at - expected_expiry).total_seconds()) < 5

    @pytest.mark.asyncio
    async def test_create_refresh_token_different_tokens(self, auth_service, mock_session):
        """Test that creating multiple tokens produces different values."""
        user_id = 1
        
        token1 = await auth_service.create_refresh_token(user_id)
        mock_session.reset_mock()
        token2 = await auth_service.create_refresh_token(user_id)
        
        assert token1 != token2


# ============================================================================
# TOKEN DECODING TESTS
# ============================================================================

class TestTokenDecoding:
    """Test JWT token decoding and validation."""

    @pytest.mark.asyncio
    async def test_decode_token_valid_token(self, auth_service):
        """Test decoding a valid token."""
        user_id = 1
        email = "user@example.com"
        roles = ["customer"]
        
        token = auth_service.create_access_token(user_id, email, roles)
        payload = auth_service.decode_token(token)
        
        assert payload is not None
        assert payload.user_id == user_id
        assert payload.email == email
        assert payload.roles == roles

    def test_decode_token_invalid_token(self, auth_service):
        """Test decoding an invalid token."""
        invalid_token = "invalid.token.here"
        
        payload = auth_service.decode_token(invalid_token)
        
        assert payload is None

    def test_decode_token_wrong_secret(self, auth_service):
        """Test decoding a token signed with wrong secret."""
        from jose import jwt
        from datetime import datetime, timezone
        
        # Create token with different secret
        payload = {
            "user_id": 1,
            "email": "user@example.com",
            "roles": ["customer"],
            "exp": (datetime.now(timezone.utc) + timedelta(minutes=30)).timestamp(),
            "iat": datetime.now(timezone.utc).timestamp(),
        }
        
        wrong_secret = "wrong-secret-key"
        token = jwt.encode(payload, wrong_secret, algorithm="HS256")
        
        # Should return None because secret is wrong
        result = auth_service.decode_token(token)
        assert result is None

    def test_decode_token_missing_required_fields(self, auth_service):
        """Test decoding a token missing user_id or email."""
        from jose import jwt
        from datetime import datetime, timezone
        
        # Token without user_id
        payload_no_user = {
            "email": "user@example.com",
            "roles": ["customer"],
            "exp": (datetime.now(timezone.utc) + timedelta(minutes=30)).timestamp(),
            "iat": datetime.now(timezone.utc).timestamp(),
        }
        
        token = jwt.encode(payload_no_user, auth_service.settings.SECRET_KEY, algorithm="HS256")
        result = auth_service.decode_token(token)
        
        assert result is None

    def test_decode_token_expired_token(self, auth_service):
        """Test decoding an expired token."""
        from jose import jwt
        from datetime import datetime, timezone
        
        # Create expired token
        payload = {
            "user_id": 1,
            "email": "user@example.com",
            "roles": ["customer"],
            "exp": (datetime.now(timezone.utc) - timedelta(hours=1)).timestamp(),
            "iat": (datetime.now(timezone.utc) - timedelta(hours=2)).timestamp(),
        }
        
        token = jwt.encode(payload, auth_service.settings.SECRET_KEY, algorithm="HS256")
        result = auth_service.decode_token(token)
        
        assert result is None
