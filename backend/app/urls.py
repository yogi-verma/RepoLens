"""Central URL configuration for the frontend and backend deployments."""

# Update these two origins when deploying the applications.
BACKEND_URI = "https://backend-brown-chi-47.vercel.app"
FRONTEND_URI = "https://repo-lens-olive.vercel.app/"

GITHUB_REDIRECT_URI = f"{BACKEND_URI.rstrip('/')}/auth/github/callback"
