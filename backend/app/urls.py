"""Central URL configuration for local development and Vercel Services."""

import os

# Vercel Services injects FRONTEND_URL at runtime. Locally, use the dev servers.
FRONTEND_URI = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
BACKEND_API_PREFIX = "/api"

GITHUB_REDIRECT_URI = f"{FRONTEND_URI}{BACKEND_API_PREFIX}/auth/github/callback"
