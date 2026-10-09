from __future__ import annotations

import base64
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Response, status
from fastapi.responses import RedirectResponse
from pymongo import ReturnDocument

from app.config import settings
from app.database import get_database
from app.models import USERS_COLLECTION
from app.schemas import SessionResponse
from app.security import create_session_token, read_session_user_id

router = APIRouter(prefix="/auth", tags=["authentication"])
OAUTH_CALLBACK_PATH = "/api/auth/github/callback"
GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API_URL = "https://api.github.com"
GITHUB_API_VERSION = "2022-11-28"


def _oauth_ready() -> None:
    if not settings.github_oauth_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
        )
    if len(settings.jwt_secret) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Session signing is not configured. Set JWT_SECRET to a random value of at least 32 characters.",
        )


def _frontend_redirect(reason: str) -> RedirectResponse:
    separator = "&" if "?" in settings.frontend_url else "?"
    return RedirectResponse(f"{settings.frontend_url}{separator}{urlencode({'auth': 'error', 'reason': reason})}", status_code=303)


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.jwt_expires_minutes * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
        domain=settings.cookie_domain,
    )


async def _github_json(client: httpx.AsyncClient, path: str, token: str) -> Any:
    response = await client.get(
        f"{GITHUB_API_URL}{path}",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
            "User-Agent": "RepoLens",
        },
    )
    response.raise_for_status()
    return response.json()


async def _primary_verified_email(client: httpx.AsyncClient, token: str) -> str | None:
    try:
        emails = await _github_json(client, "/user/emails", token)
    except (httpx.HTTPError, ValueError):
        return None

    if not isinstance(emails, list):
        return None
    for item in emails:
        if isinstance(item, dict) and item.get("primary") and item.get("verified"):
            return item.get("email")
    return None


@router.get("/github", summary="Start GitHub sign-in")
async def github_login() -> RedirectResponse:
    _oauth_ready()
    state = secrets.token_urlsafe(32)
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode("ascii")).digest()).rstrip(b"=").decode("ascii")
    query = urlencode(
        {
            "client_id": settings.github_client_id,
            "redirect_uri": settings.github_redirect_uri,
            "scope": "read:user user:email",
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            "allow_signup": "true",
        }
    )
    redirect = RedirectResponse(f"{GITHUB_AUTHORIZE_URL}?{query}", status_code=302)
    redirect.set_cookie(
        key=settings.oauth_state_cookie_name,
        value=state,
        max_age=600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path=OAUTH_CALLBACK_PATH,
    )
    redirect.set_cookie(
        key=settings.oauth_verifier_cookie_name,
        value=code_verifier,
        max_age=600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path=OAUTH_CALLBACK_PATH,
    )
    return redirect


@router.get("/github/callback", summary="Complete GitHub sign-in")
async def github_callback(
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    state_cookie: str | None = Cookie(default=None, alias=settings.oauth_state_cookie_name),
    code_verifier: str | None = Cookie(default=None, alias=settings.oauth_verifier_cookie_name),
    database=Depends(get_database),
) -> Response:
    if error:
        response = _frontend_redirect("github_denied")
        response.delete_cookie(settings.oauth_state_cookie_name, path=OAUTH_CALLBACK_PATH)
        response.delete_cookie(settings.oauth_verifier_cookie_name, path=OAUTH_CALLBACK_PATH)
        return response

    if (
        not code
        or not state
        or not state_cookie
        or not code_verifier
        or not secrets.compare_digest(state, state_cookie)
    ):
        response = _frontend_redirect("invalid_oauth_state")
        response.delete_cookie(settings.oauth_state_cookie_name, path=OAUTH_CALLBACK_PATH)
        response.delete_cookie(settings.oauth_verifier_cookie_name, path=OAUTH_CALLBACK_PATH)
        return response

    _oauth_ready()
    token: str
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            token_response = await client.post(
                GITHUB_TOKEN_URL,
                headers={"Accept": "application/json", "User-Agent": "RepoLens"},
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                    "redirect_uri": settings.github_redirect_uri,
                    "code_verifier": code_verifier,
                },
            )
            token_response.raise_for_status()
            token_data = token_response.json()
            token = token_data.get("access_token", "") if isinstance(token_data, dict) else ""
            if not token:
                raise ValueError("GitHub did not return an access token.")

            profile = await _github_json(client, "/user", token)
            if not isinstance(profile, dict) or not profile.get("id") or not profile.get("login"):
                raise ValueError("GitHub returned an invalid user profile.")
            email = profile.get("email") or await _primary_verified_email(client, token)
    except (httpx.HTTPError, ValueError, KeyError):
        response = _frontend_redirect("github_authentication_failed")
        response.delete_cookie(settings.oauth_state_cookie_name, path=OAUTH_CALLBACK_PATH)
        response.delete_cookie(settings.oauth_verifier_cookie_name, path=OAUTH_CALLBACK_PATH)
        return response

    now = datetime.now(timezone.utc)
    user = await database[USERS_COLLECTION].find_one_and_update(
        {"github_id": int(profile["id"])},
        {
            "$set": {
                "github_username": str(profile["login"]),
                "name": profile.get("name"),
                "email": email,
                "avatar_url": profile.get("avatar_url"),
                "profile_url": str(profile.get("html_url") or f"https://github.com/{profile['login']}"),
                "updated_at": now,
            },
            "$setOnInsert": {"id": str(uuid4()), "created_at": now},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    response = RedirectResponse(settings.frontend_url, status_code=303)
    response.delete_cookie(settings.oauth_state_cookie_name, path=OAUTH_CALLBACK_PATH)
    response.delete_cookie(settings.oauth_verifier_cookie_name, path=OAUTH_CALLBACK_PATH)
    _set_session_cookie(response, create_session_token(UUID(user["id"])))
    return response


@router.get("/me", response_model=SessionResponse, summary="Get the signed-in user")
async def current_user(
    session_cookie: str | None = Cookie(default=None, alias=settings.session_cookie_name),
    database=Depends(get_database),
) -> SessionResponse:
    if not session_cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in to continue.")

    user_id: UUID = read_session_user_id(session_cookie)
    user = await database[USERS_COLLECTION].find_one({"id": str(user_id)})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="This account no longer exists.")
    return SessionResponse(user=user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Sign out")
async def logout() -> Response:
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
        domain=settings.cookie_domain,
        secure=settings.cookie_secure,
        httponly=True,
        samesite="lax",
    )
    return response
