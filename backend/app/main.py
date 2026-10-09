from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ASCENDING

from app.config import settings
from app.database import client
from app.models import USERS_COLLECTION
from app.routes.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.mongo_client = client
    app.state.database = client[settings.mongodb_database]
    await app.state.database[USERS_COLLECTION].create_index(
        [("github_id", ASCENDING)], unique=True
    )
    yield
    await client.close()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)
app.include_router(auth_router)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
async def readiness() -> dict[str, str]:
    await client.admin.command("ping")
    return {"status": "ready", "database": "connected"}
