from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    github_id: int
    github_username: str
    name: str | None
    email: str | None
    avatar_url: str | None
    profile_url: str
    created_at: datetime


class SessionResponse(BaseModel):
    user: UserResponse
