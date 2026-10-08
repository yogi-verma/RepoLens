"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiUser } from "react-icons/fi";
import "./Header.css";

type HeaderProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

type SignedInUser = {
  github_username: string;
  avatar_url: string | null;
};

function GitHubMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.5-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.12.08 1.72 1.15 1.72 1.15 1 .72 2.62.51 3.26.39.1-.73.39-1.23.71-1.51-2.5-.29-5.13-1.25-5.13-5.55 0-1.22.44-2.22 1.15-3-.12-.29-.5-1.43.11-2.98 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.69.11 2.98.72.78 1.15 1.78 1.15 3 0 4.31-2.63 5.26-5.14 5.54.4.35.76 1.03.76 2.08v3.09c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
    </svg>
  );
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
  const [user, setUser] = useState<SignedInUser | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function refreshUser() {
      try {
        const response = await fetch(`${apiOrigin}/auth/me`, { credentials: "include", headers: { Accept: "application/json" } });
        const data = response.ok ? await response.json() : null;
        if (!cancelled) setUser(data?.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthResolved(true);
      }
    }
    const onAuthChanged = () => { void refreshUser(); };
    void refreshUser();
    window.addEventListener("repotour-auth-changed", onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("repotour-auth-changed", onAuthChanged);
    };
  }, [apiOrigin]);

  return (
    <header className="site-header">
      <a className="site-brand" aria-label="RepoLens home">
        <span className="site-brand-mark"><GitHubMark size={21} /></span>
        <span>Repo<span className="site-brand-accent">Lens</span></span>
      </a>
      <div className="site-header-actions">
        <span className="site-header-tag"><span className="live-dot" /> PUBLIC REPOS ONLY</span>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          <span>{theme === "dark" ? "Dark" : "Light"}</span>
        </button>
        {user ? (
          <Link className="site-profile-link" href="/profile" aria-label={`View ${user.github_username}'s profile`} title={`Signed in as ${user.github_username}`}>
            {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <FiUser aria-hidden="true" />}
          </Link>
        ) : authResolved ? (
          <a className="site-auth-link" href={`${apiOrigin}/auth/github`}>
            Login / Sign up
          </a>
        ) : (
          <span className="site-profile-loading" aria-label="Checking sign-in status" />
        )}
      </div>
    </header>
  );
}
