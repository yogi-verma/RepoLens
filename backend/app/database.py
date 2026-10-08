from fastapi import Request
from pymongo import AsyncMongoClient

from app.config import settings

client = AsyncMongoClient(settings.mongodb_uri)


def get_database(request: Request):
    return request.app.state.database
