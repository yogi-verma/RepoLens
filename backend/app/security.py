from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import HTTPException, status

from app.config import settings

JWT_ISSUER = "repotour-api"


def _jwt_key() -> str:
    if len(settings.jwt_secret) < 32:
        raise RuntimeError("JWT_SECRET must be set to a random value of at least 32 characters.")
    return settings.jwt_secret


def create_session_token(user_id: UUID) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user_id),
            "iss": JWT_ISSUER,
            "iat": now,
            "exp": now + timedelta(minutes=settings.jwt_expires_minutes),
        },
        _jwt_key(),
        algorithm="HS256",
    )


def read_session_user_id(token: str) -> UUID:
    try:
        payload = jwt.decode(
            token,
            _jwt_key(),
            algorithms=["HS256"],
            issuer=JWT_ISSUER,
            options={"require": ["sub", "iss", "iat", "exp"]},
        )
        return UUID(payload["sub"])
    except (jwt.PyJWTError, ValueError, RuntimeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is invalid or has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
