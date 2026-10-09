/**
 * Vercel injects this route prefix for browser-side calls to the backend service.
 * The localhost fallback is used when running the frontend outside `vercel dev`.
 */
export const BACKEND_API_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000/api" : "/api")
).replace(/\/+$/, "");
