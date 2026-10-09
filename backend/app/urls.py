"""Central URL configuration for the frontend and backend deployments."""

# Update these two origins when deploying the applications.
BACKEND_URI = "http://localhost:8000"
FRONTEND_URI = "http://localhost:3000"

GITHUB_REDIRECT_URI = f"{BACKEND_URI.rstrip('/')}/auth/github/callback"
