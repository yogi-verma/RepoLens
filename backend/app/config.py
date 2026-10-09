import os
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.urls import FRONTEND_URI, GITHUB_REDIRECT_URI


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "RepoLens API"
    mongodb_uri: str = "mongodb://localhost:27017/"
    mongodb_database: str = "repotour"
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = GITHUB_REDIRECT_URI
    frontend_url: str = FRONTEND_URI
    cors_origins: str = FRONTEND_URI
    jwt_secret: str = ""
    jwt_expires_minutes: int = Field(default=10080, ge=5, le=43200)
    cookie_secure: bool = False
    cookie_domain: str | None = None
    session_cookie_name: str = "repotour_session"
    oauth_state_cookie_name: str = "repotour_github_state"
    oauth_verifier_cookie_name: str = "repotour_github_verifier"

    @property
    def allowed_origins(self) -> list[str]:
        origins = [
            origin.strip().rstrip("/")
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]
        frontend_origin = self.frontend_url.rstrip("/")
        if frontend_origin not in origins:
            origins.append(frontend_origin)
        return origins

    @property
    def secure_cookies(self) -> bool:
        return self.cookie_secure or os.getenv("VERCEL") == "1"

    @property
    def cookie_samesite(self) -> str:
        return "none" if self.secure_cookies else "lax"

    @property
    def github_oauth_configured(self) -> bool:
        return bool(self.github_client_id and self.github_client_secret)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
