# RepoLens frontend

The RepoLens web interface is built with Next.js App Router, React, TypeScript, and CSS. It lets people browse public GitHub repositories without cloning them.

## Features

- Explore public repository files, branches, commits, and source files.
- Search a signed-in GitHub user's public repositories and page through the list 20 at a time.
- Open a repository in RepoLens or directly on GitHub.
- Sign in with GitHub and view account details on the profile page.
- Switch between dark and light themes.

## Requirements

- Node.js 20.9 or newer
- npm
- The RepoLens FastAPI backend running at `http://localhost:8000`

## Local development

From the `frontend` directory:

```bash
npm ci
```

Copy `.env.example` to `.env.local` and set the backend URL if it differs from the default:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Start the backend separately; its setup is documented in [`../backend/README.md`](../backend/README.md).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js in development mode. |
| `npm run build` | Create a production build. |
| `npm start` | Serve a production build. |
| `npm run lint` | Run ESLint. |

## Authentication and API

The frontend starts GitHub OAuth by navigating to the backend's `/auth/github` endpoint. It calls `/auth/me` and `/auth/logout` with browser credentials so the backend's HTTP-only session cookie is sent. Configure the backend CORS origin to include `http://localhost:3000`.

Repository contents and public account repositories are fetched from GitHub's public REST API. GitHub's unauthenticated API rate limits may affect those views; the UI displays an error when GitHub returns a rate-limit response.

## Production

Set `NEXT_PUBLIC_API_URL` to the deployed API origin before building. Configure the backend's OAuth redirect URL, frontend URL, CORS origins, secure cookies, and database connection for the production domains. Use HTTPS for both applications.
