/**
 * Base URL for the RepoLens backend API.
 * Update this value when deploying the frontend against a different backend.
 */
export const BACKEND_URI = "http://localhost:8000";

/** Backend URL without trailing slashes, for composing endpoint paths. */
export const BACKEND_ORIGIN = BACKEND_URI.replace(/\/+$/, "");
