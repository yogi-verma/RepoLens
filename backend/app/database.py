from fastapi import Request
from pymongo import AsyncMongoClient

from app.config import settings

# Fail quickly on serverless platforms when the deployment's database URI is
# missing or unreachable, rather than spending the whole function timeout here.
client = AsyncMongoClient(
    settings.mongodb_uri,
    serverSelectionTimeoutMS=5_000,
    connectTimeoutMS=5_000,
)


def get_database(request: Request):
    return request.app.state.database
