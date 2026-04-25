"""Unit tests for app/core/security — no DB or network required."""
import time
import uuid
from datetime import timedelta
from unittest.mock import patch

import pytest
from fastapi import HTTPException

# We patch settings.JWT_SECRET before importing the module functions so that
# the module-level `settings` object used inside security.py sees our value.
TEST_SECRET = "test-secret-for-unit-tests"


@pytest.fixture(autouse=True)
def patch_jwt_secret(monkeypatch):
    """Ensure every test in this module uses a known JWT secret."""
    with patch("app.core.security.settings") as mock_settings:
        mock_settings.JWT_SECRET = TEST_SECRET
        yield mock_settings


# Import after patching is set up via the fixture — but since autouse runs
# before the test body, we import at module level and rely on the patch
# replacing the `settings` name inside the security module at call time.
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        hashed = hash_password("mysecretpassword")
        assert hashed != "mysecretpassword"

    def test_verify_correct_password(self):
        plain = "correct-horse-battery"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("correct-password")
        assert verify_password("wrong-password", hashed) is False

    def test_hash_is_different_each_call(self):
        # bcrypt uses a random salt, so two hashes of the same password differ
        h1 = hash_password("same-password")
        h2 = hash_password("same-password")
        assert h1 != h2

    def test_verify_both_hashes_accept_same_plain(self):
        plain = "same-password"
        h1 = hash_password(plain)
        h2 = hash_password(plain)
        assert verify_password(plain, h1) is True
        assert verify_password(plain, h2) is True

    def test_empty_password_round_trip(self):
        hashed = hash_password("")
        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False


# ---------------------------------------------------------------------------
# JWT encode / decode
# ---------------------------------------------------------------------------

class TestJWT:
    def test_encode_decode_round_trip(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id)
        decoded = decode_access_token(token)
        assert decoded == user_id

    def test_different_users_produce_different_tokens(self):
        id1 = uuid.uuid4()
        id2 = uuid.uuid4()
        assert create_access_token(id1) != create_access_token(id2)

    def test_invalid_token_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token("this.is.not.a.valid.token")
        assert exc_info.value.status_code == 401

    def test_tampered_token_raises_401(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id)
        # Flip the last character to tamper with the signature
        tampered = token[:-1] + ("A" if token[-1] != "A" else "B")
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(tampered)
        assert exc_info.value.status_code == 401

    def test_expired_token_raises_401(self):
        """Token with a past expiry should be rejected."""
        from datetime import datetime, timezone
        from jose import jwt as jose_jwt
        from app.core import security as sec

        expired_payload = {
            "sub": str(uuid.uuid4()),
            "exp": datetime(2000, 1, 1, tzinfo=timezone.utc),
        }
        expired_token = jose_jwt.encode(expired_payload, TEST_SECRET, algorithm=sec.ALGORITHM)
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(expired_token)
        assert exc_info.value.status_code == 401

    def test_token_with_missing_sub_raises_401(self):
        from datetime import datetime, timedelta, timezone
        from jose import jwt as jose_jwt
        from app.core import security as sec

        payload = {"exp": datetime.now(timezone.utc) + timedelta(days=1)}
        token = jose_jwt.encode(payload, TEST_SECRET, algorithm=sec.ALGORITHM)
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(token)
        assert exc_info.value.status_code == 401
