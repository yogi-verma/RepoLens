"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiArrowUpRight, FiBookOpen, FiCalendar, FiCheck, FiExternalLink, FiGithub, FiLogOut, FiMail, FiShield, FiUser } from "react-icons/fi";
import { BACKEND_API_BASE } from "../config";
import Header from "../Header/Header";
import "./Profile.css";

type User = {
  id: string;
  github_id: number;
  github_username: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  profile_url: string;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("repotour-theme") === "light" ? "light" : "dark";
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [publicRepositories, setPublicRepositories] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    const background = theme === "dark" ? "#111315" : "#f7f7f4";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.style.backgroundColor = background;
    document.body.style.backgroundColor = background;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND_API_BASE}/auth/me`, { credentials: "include", headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error("We could not load your account right now.");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data?.user ?? null);
          setLoading(false);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "We could not load your account right now.");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const githubUsername = user?.github_username ?? "";
    if (githubUsername.length === 0) return;
    let cancelled = false;
    async function loadGitHubStats() {
      setStatsLoading(true);
      setStatsError("");
      try {
        const profileResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(githubUsername)}`, {
          headers: { Accept: "application/vnd.github+json" },
          cache: "force-cache",
        });
        if (!profileResponse.ok) throw new Error(profileResponse.status === 403 ? "GitHub API rate limit reached. Try again later." : "GitHub stats are temporarily unavailable.");
        const profile = await profileResponse.json() as { public_repos?: number };
        if (!cancelled) setPublicRepositories(Number(profile.public_repos ?? 0));
      } catch (reason) {
        if (!cancelled) setStatsError(reason instanceof Error ? reason.message : "GitHub stats are temporarily unavailable.");
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    void loadGitHubStats();
    return () => { cancelled = true; };
  }, [user?.github_username]);

  useEffect(() => {
    if (!confirmSignOut) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !signingOut) setConfirmSignOut(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmSignOut, signingOut]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("repotour-theme", next);
  }

  async function signOut() {
    setSigningOut(true);
    try {
      const response = await fetch(`${BACKEND_API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Sign out could not be completed. Please try again.");
      setUser(null);
      setSignedOut(true);
      window.dispatchEvent(new Event("repotour-auth-changed"));
      setConfirmSignOut(false);
      router.push("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign out could not be completed. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  const joinedDate = user?.created_at
    ? new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(new Date(user.created_at))
    : "—";

  return (
    <main className="app-shell profile-shell" data-theme={theme} suppressHydrationWarning>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <section className="profile-content">
        <div className="profile-heading">
          <div>
            <span className="profile-eyebrow">YOUR ACCOUNT</span>
            <h1>Profile</h1>
            <p>Your RepoLens account, connected through GitHub.</p>
          </div>
          <Link href="/" className="profile-back-action"><FiArrowLeft aria-hidden="true" /> Back</Link>
        </div>

        {loading ? (
          <div className="profile-state"><span className="profile-spinner" /> Loading your profile…</div>
        ) : error && !user ? (
          <div className="profile-state profile-state-error" role="alert">{error}</div>
        ) : signedOut || !user ? (
          <section className="profile-empty">
            <div className="profile-empty-icon"><FiUser aria-hidden="true" /></div>
            <span className="profile-eyebrow">NOT SIGNED IN</span>
            <h2>{signedOut ? "You’ve signed out" : "Your profile is waiting"}</h2>
            <p>Sign in with GitHub to see your account details here.</p>
            <a className="profile-primary-action" href={`${BACKEND_API_BASE}/auth/github`}><FiGithub aria-hidden="true" /> Continue with GitHub <FiArrowUpRight aria-hidden="true" /></a>
          </section>
        ) : (
          <>
            <section className="profile-card" aria-labelledby="profile-name">
              <div className="profile-card-glow" />
              <div className="profile-card-main">
                <div className="profile-avatar-wrap">
                  {user.avatar_url ? <img src={user.avatar_url} alt={`${user.github_username}'s GitHub avatar`} /> : <FiUser aria-hidden="true" />}
                  <span className="profile-online"><FiCheck aria-label="Connected" /></span>
                </div>
                <div className="profile-identity">
                  <span className="profile-eyebrow">GITHUB ACCOUNT</span>
                  <h2 id="profile-name">{user.name || user.github_username}</h2>
                  <a href={user.profile_url} target="_blank" rel="noreferrer" className="profile-handle">@{user.github_username} <FiExternalLink aria-hidden="true" /></a>
                </div>
                <span className="profile-connected"><span /> Connected</span>
                <Link href={`/profile/${encodeURIComponent(user.github_username)}/repository`} className="profile-repo-count" aria-label="Browse your public repositories">
                  <span className="profile-stat-icon"><FiBookOpen aria-hidden="true" /></span>
                  <div>
                    <span className="profile-stat-label">PUBLIC REPOSITORIES</span>
                    <strong>{statsLoading ? "…" : publicRepositories?.toLocaleString() ?? "—"}</strong>
                  </div>
                  <FiArrowUpRight className="profile-repo-arrow" aria-hidden="true" />
                </Link>
              </div>
              <div className="profile-card-footer">
                <span><FiCalendar aria-hidden="true" /> Member since {joinedDate}</span>
                <span><FiShield aria-hidden="true" /> Secure sign-in via GitHub</span>
              </div>
            </section>

            {statsError && <p className="profile-stats-error" role="status">{statsError} Your profile details are still available.</p>}

            <div className="profile-lower-grid">
              <section className="profile-details-card">
                <div className="profile-section-heading">
                  <div><span className="profile-eyebrow">ACCOUNT DETAILS</span><h2>Your information</h2></div>
                  <FiUser aria-hidden="true" />
                </div>
                <dl className="profile-details-list">
                  <div><dt><FiUser aria-hidden="true" /> Display name</dt><dd>{user.name || "Not provided"}</dd></div>
                  <div><dt><FiGithub aria-hidden="true" /> GitHub username</dt><dd>@{user.github_username}</dd></div>
                  <div><dt><FiMail aria-hidden="true" /> Email address</dt><dd>{user.email || "Not shared by GitHub"}</dd></div>
                  <div><dt><FiCalendar aria-hidden="true" /> Joined RepoLens</dt><dd>{joinedDate}</dd></div>
                </dl>
              </section>
              <aside className="profile-side-card">
                <div className="profile-side-icon"><FiGithub aria-hidden="true" /></div>
                <span className="profile-eyebrow">CONNECTED ACCOUNT</span>
                <h2>Your code, one click away.</h2>
                <p>Your GitHub account lets you explore public repositories. RepoLens never stores your GitHub access token.</p>
                <a href={user.profile_url} target="_blank" rel="noreferrer" className="profile-github-link">View GitHub profile <FiArrowUpRight aria-hidden="true" /></a>
                <button type="button" className="profile-signout" onClick={() => setConfirmSignOut(true)}>
                  <FiLogOut aria-hidden="true" /> Sign out
                </button>
              </aside>
            </div>
            {error && <p className="profile-inline-error" role="alert">{error}</p>}
          </>
        )}
        <footer className="profile-footer"><span>REPOLENS ACCOUNT</span><span>READ THE CODE. <FiArrowUpRight aria-hidden="true" /></span></footer>
      </section>
      {confirmSignOut && (
        <div className="signout-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !signingOut) setConfirmSignOut(false);
        }}>
          <section className="signout-modal" role="alertdialog" aria-modal="true" aria-labelledby="signout-title" aria-describedby="signout-description">
            <div className="signout-modal-icon"><FiLogOut aria-hidden="true" /></div>
            <span className="profile-eyebrow">END YOUR SESSION</span>
            <h2 id="signout-title">Are you sure you want to sign out?</h2>
            <p id="signout-description">You’ll be returned to the RepoLens home page. You can sign in again with GitHub anytime.</p>
            {error && <p className="signout-modal-error" role="alert">{error}</p>}
            <div className="signout-modal-actions">
              <button type="button" className="signout-cancel" onClick={() => setConfirmSignOut(false)} disabled={signingOut}>Cancel</button>
              <button type="button" className="signout-confirm" onClick={signOut} disabled={signingOut}>
                <FiLogOut aria-hidden="true" /> {signingOut ? "Signing out…" : "Yes, sign out"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
