"""Central URL configuration for the separately deployed applications."""

BACKEND_URI = "https://backend-brown-chi-47.vercel.app"
FRONTEND_URI = "https://repo-lens-olive.vercel.app"
GITHUB_REDIRECT_URI = f"{BACKEND_URI}/auth/github/callback"
