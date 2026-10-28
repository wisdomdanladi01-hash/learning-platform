from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from jwt import InvalidTokenError

from app.core.config import settings

_password_hasher = PasswordHasher()
_dummy_password_hash = _password_hasher.hash("dummy-password-used-for-timing")


def require_jwt_secret() -> str:
    secret = settings.jwt_secret_key
    if len(secret.encode("utf-8")) < 32:
        raise ValueError("JWT_SECRET_KEY must contain at least 32 bytes.")
    return secret


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def burn_password_check(password: str) -> None:
    verify_password(password, _dummy_password_hash)


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": str(user_id), "type": "access", "iat": now, "exp": expires_at},
        require_jwt_secret(),
        algorithm="HS256",
    )


def decode_access_token(token: str) -> int:
    payload = jwt.decode(
        token,
        require_jwt_secret(),
        algorithms=["HS256"],
        options={"require": ["exp", "sub", "type"]},
    )
    if payload.get("type") != "access":
        raise InvalidTokenError("Token is not an access token.")
    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject.isdecimal():
        raise InvalidTokenError("Token subject is invalid.")
    return int(subject)
