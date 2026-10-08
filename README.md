# RepoLens

RepoLens is a web app for exploring public GitHub repositories in the browser. Paste a repository URL to inspect its folders, files, branches, commits, and source without cloning the project. Sign in with GitHub to view your account profile and browse your public repositories.

## Project structure

```text
RepoLens/
├── backend/    FastAPI API, GitHub OAuth, MongoDB persistence
└── frontend/   Next.js application
```

Each app has its own setup guide:

- [Frontend guide](frontend/README.md)
- [Backend guide](backend/README.md)

## Features

- Browse public repository files and folder trees.
- Switch branches and read file contents in the browser.
- View repository metadata and commit information.
- Sign in or sign up through GitHub OAuth.
- View account details and browse public repositories in a searchable, paginated table.
- Switch between dark and light themes.

## Requirements

- Node.js 20.9+ and npm
- Python 3.11+
- MongoDB Community Server or MongoDB Atlas
- A GitHub OAuth App for sign-in

## Local setup

### 1. Configure the backend

Follow [backend/README.md](backend/README.md) to configure `backend/.env`, connect MongoDB, install Python requirements, and start the API at `http://localhost:8000`.

### 2. Configure the frontend

In a second terminal:

```bash
cd frontend
npm ci
```

Copy `frontend/.env.example` to `frontend/.env.local` if the API is not running at the default URL. Then start Next.js:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub OAuth setup

Register an OAuth App in GitHub Developer settings with:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:8000/auth/github/callback`

Place its client ID and client secret in `backend/.env`. Set a random `JWT_SECRET` of at least 32 characters. The backend uses the access token only during sign-in to read basic account details and does not store it. RepoLens only browses public repositories.

## Data and API limits

MongoDB stores the signed-in user's GitHub account metadata. Repository listings and repository contents are retrieved from GitHub's public REST API. GitHub's unauthenticated API rate limit may apply; the frontend displays a message if GitHub limits a request.

## Security

- Never commit `.env`, `.env.local`, MongoDB credentials, OAuth secrets, or production signing keys.
- Use HTTPS and set `COOKIE_SECURE=true` in production.
- Configure the production OAuth callback, CORS origins, frontend URL, and cookie domain for your deployed hosts.
- Restrict MongoDB network access to trusted application hosts.
