# RepoLens backend

RepoLens's API is a FastAPI service that handles GitHub OAuth, signed-in sessions, user persistence in MongoDB, and health checks.

## Features

- GitHub OAuth authorization-code flow with state validation and PKCE.
- HTTP-only, signed session cookie for browser authentication.
- MongoDB persistence for basic GitHub account details.
- Public repository browsing remains available through GitHub's public REST API.
- Readiness endpoint that checks the MongoDB connection.

The GitHub access token is only used during sign-in to retrieve the user's profile and verified primary email. It is not saved in MongoDB or returned to the frontend. OAuth requests ask for `read:user` and `user:email`; RepoLens does not request access to private repositories.

## Requirements

- Python 3.11 or newer
- MongoDB Community Server or a MongoDB Atlas cluster
- A GitHub OAuth App

Docker and Podman are not required.

## Configuration

Copy `.env.example` to `.env` and fill in the values:

| Variable | Purpose |
| --- | --- |
| `GITHUB_CLIENT_ID` | Client ID from the GitHub OAuth App. |
| `GITHUB_CLIENT_SECRET` | Client secret from the GitHub OAuth App. Keep it private. |
| `GITHUB_REDIRECT_URI` | OAuth callback URL; local default is `http://localhost:8000/auth/github/callback`. |
| `JWT_SECRET` | Random secret of at least 32 characters for signing sessions. |
| `JWT_EXPIRES_MINUTES` | Session duration in minutes. |
| `MONGODB_URI` | MongoDB connection string. Local default: `mongodb://localhost:27017/`. |
| `MONGODB_DATABASE` | MongoDB database name. |
| `FRONTEND_URL` | Frontend URL to redirect to after OAuth. Local default: `http://localhost:3000`. |
| `CORS_ORIGINS` | Comma-separated frontend origins allowed to call the API. |
| `COOKIE_SECURE` | Set `true` when serving over HTTPS. Keep `false` for local HTTP development. |
| `COOKIE_DOMAIN` | Optional cookie domain; leave empty for local development. |

Create a GitHub OAuth App in GitHub Developer settings. Use the frontend URL as its homepage and set **Authorization callback URL** to exactly the same value as `GITHUB_REDIRECT_URI`.

For Atlas, use the connection string provided by the cluster, replace its username/password placeholders, URL-encode reserved characters in the password, and allow your application host in Atlas Network Access. Never commit `.env` or publish MongoDB credentials.

## Run locally

Open a terminal in `backend` and create a virtual environment:

### Windows PowerShell

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

MongoDB must be reachable at `MONGODB_URI` before the API starts. The service creates the `users` collection's unique index on `github_id` at startup.

## API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness check. |
| `GET` | `/health/ready` | Checks that MongoDB responds to a ping. |
| `GET` | `/auth/github` | Starts GitHub sign-in. |
| `GET` | `/auth/github/callback` | Completes sign-in and sets the session cookie. |
| `GET` | `/auth/me` | Returns the current signed-in user. |
| `POST` | `/auth/logout` | Clears the session cookie. |

Interactive API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

## Production notes

Serve the frontend and API over HTTPS, set `COOKIE_SECURE=true`, use a long random `JWT_SECRET`, restrict CORS to the production frontend origin, and store secrets in the hosting provider's secret manager. Use a managed MongoDB deployment with network access restricted to the API host.
