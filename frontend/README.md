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

The backend API route is `/api`. In Vercel Services deployments, Vercel provides this route prefix through `NEXT_PUBLIC_BACKEND_URL`; local development falls back to `http://localhost:8000/api`.

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

The frontend starts GitHub OAuth through `/api/auth/github`. It calls `/api/auth/me` and `/api/auth/logout` with browser credentials so the backend's HTTP-only session cookie is sent. Vercel routes `/api/**` to FastAPI on the same origin.

Repository contents and public account repositories are fetched from GitHub's public REST API. GitHub's unauthenticated API rate limits may affect those views; the UI displays an error when GitHub returns a rate-limit response.

## Production

The frontend and backend deploy together through the root [`../vercel.json`](../vercel.json). Configure backend secrets in Vercel and set the GitHub OAuth callback to `https://<your-vercel-domain>/api/auth/github/callback`.
