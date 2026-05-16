from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

security = HTTPBearer(auto_error=True)


@dataclass
class AuthUser:
    user_id: str
    email: str | None


def _decode_supabase_jwt(token: str) -> dict[str, Any]:
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    if not jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired auth token.",
        )

    audience = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")

    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience=audience,
            options={"verify_aud": True},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired auth token.",
        ) from exc

    return payload


def _get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if not url or not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase backend credentials are not configured.",
        )
    return create_client(url, key)


def _fetch_user_via_supabase(token: str) -> dict[str, Any]:
    try:
        client = _get_supabase_client()
        user_response = client.auth.get_user(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired auth token.",
        ) from exc

    user = getattr(user_response, "user", None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired auth token.",
        )

    # Convert GoTrue user object into payload-like dict used by callers.
    user_id = getattr(user, "id", None)
    email = getattr(user, "email", None)
    return {"sub": user_id, "email": email}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthUser:
    token = credentials.credentials

    # Try local JWT verification first (fast, no network).
    # If it fails (e.g., RS256 signing or secret mismatch), fallback to Supabase auth API.
    try:
        payload = _decode_supabase_jwt(token)
    except HTTPException as local_error:
        if local_error.status_code != status.HTTP_401_UNAUTHORIZED:
            raise
        payload = _fetch_user_via_supabase(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing subject.",
        )

    email = payload.get("email")
    return AuthUser(user_id=str(user_id), email=str(email) if email else None)
