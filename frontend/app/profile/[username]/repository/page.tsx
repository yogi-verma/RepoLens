"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiArrowUpRight, FiChevronLeft, FiChevronRight, FiExternalLink, FiGithub, FiSearch } from "react-icons/fi";
import { BACKEND_API_BASE } from "../../../config";
import Header from "../../../Header/Header";
import "./Repository.css";

type Repository = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  updated_at: string;
};

export default function ProfileRepositoriesPage() {
  return (
    <Suspense fallback={<div className="repository-route-loading"><span /> Loading repositories…</div>}>
      <ProfileRepositoriesPageContent />
    </Suspense>
  );
}

function ProfileRepositoriesPageContent() {
  const params = useParams<{ username: string }>();
  const routeUsername = decodeURIComponent(params.username);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("repotour-theme") === "light" ? "light" : "dark";
  });
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [username, setUsername] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    const background = theme === "dark" ? "#111315" : "#f7f7f4";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.style.backgroundColor = background;
    document.body.style.backgroundColor = background;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function loadRepositories() {
      setLoading(true);
      setError("");
      try {
        const sessionResponse = await fetch(`${BACKEND_API_BASE}/auth/me`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (sessionResponse.status === 401) {
          if (!cancelled) setSignedIn(false);
          return;
        }
        if (!sessionResponse.ok) throw new Error("We couldn’t load your account. Please try again.");
        const session = await sessionResponse.json() as { user?: { github_username?: string } };
        const account = session.user?.github_username;
        if (!account) throw new Error("Your GitHub username is missing from your account.");
        if (account.toLowerCase() !== routeUsername.toLowerCase()) {
          throw new Error("This repository page does not match the signed-in GitHub account.");
        }
        if (!cancelled) setUsername(account);

        const collected: Repository[] = [];
        for (let page = 1; ; page += 1) {
          const response = await fetch(
            `https://api.github.com/users/${encodeURIComponent(account)}/repos?type=owner&sort=updated&per_page=100&page=${page}`,
            { headers: { Accept: "application/vnd.github+json" }, cache: "force-cache" },
          );
          if (!response.ok) {
            throw new Error(response.status === 403
              ? "GitHub’s API rate limit has been reached. Please try again later."
              : "We couldn’t load your repositories from GitHub.");
          }
          const batch = await response.json() as Repository[];
          collected.push(...batch);
          if (batch.length < 100) break;
        }
        if (!cancelled) setRepositories(collected);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Something went wrong while loading repositories.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadRepositories();
    return () => { cancelled = true; };
  }, [routeUsername]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("repotour-theme", next);
  }

  function goToPage(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const filteredRepositories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return repositories;
    return repositories.filter((repository) =>
      repository.name.toLowerCase().includes(query)
      || repository.description?.toLowerCase().includes(query)
      || repository.language?.toLowerCase().includes(query),
    );
  }, [repositories, search]);
  const totalPages = Math.max(1, Math.ceil(filteredRepositories.length / 20));
  const visibleRepositories = filteredRepositories.slice((currentPage - 1) * 20, currentPage * 20);
  const pageWindow = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((page) => totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1);
  const paginationItems: Array<number | "ellipsis-start" | "ellipsis-end"> = [];
  pageWindow.forEach((page, index) => {
    if (index > 0 && page - pageWindow[index - 1] > 1) paginationItems.push(index === 1 ? "ellipsis-start" : "ellipsis-end");
    paginationItems.push(page);
  });

  return (
    <main className="app-shell profile-shell" data-theme={theme} suppressHydrationWarning>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <section className="repository-content">
        <div className="repository-heading">
          <div className="repository-heading-copy">
            <h1>Repositories</h1>
            <p>{username ? `Public repositories owned by @${username}.` : "Browse your public GitHub repositories."}</p>
          </div>
          <Link href="/profile" className="repository-back-action"><FiArrowLeft aria-hidden="true" /> Back</Link>
        </div>

        {loading ? (
          <div className="repository-state"><span className="profile-spinner" /> Fetching your repositories from GitHub…</div>
        ) : !signedIn ? (
          <section className="repository-state repository-empty">
            <span className="repository-state-icon"><FiGithub aria-hidden="true" /></span>
            <h2>Sign in to see your repositories</h2>
            <p>Your account is not currently connected.</p>
            <a className="repository-login-button" href={`${BACKEND_API_BASE}/auth/github`}><FiGithub aria-hidden="true" /> Continue with GitHub <FiArrowUpRight aria-hidden="true" /></a>
          </section>
        ) : error ? (
          <section className="repository-state repository-empty" role="alert">
            <span className="repository-state-icon"><FiSearch aria-hidden="true" /></span>
            <h2>Repositories couldn’t load</h2>
            <p>{error}</p>
            <Link href="/profile" className="repository-retry">Return to profile <FiArrowUpRight aria-hidden="true" /></Link>
          </section>
        ) : (
          <>
            <div className="repository-toolbar">
              <label className="repository-search">
                <FiSearch aria-hidden="true" />
                <input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search repositories" aria-label="Search repositories" />
              </label>
              <div className="repository-total"><span>TOTAL REPOSITORIES</span><strong>{repositories.length.toLocaleString()}</strong></div>
            </div>
            {visibleRepositories.length ? (
              <>
              <div className="repository-table-scroll">
                <table className="repository-table">
                  <thead>
                    <tr>
                      <th scope="col">Repository</th>
                      <th scope="col">Language</th>
                      <th scope="col">Last updated</th>
                      <th scope="col" className="repository-actions-heading">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRepositories.map((repository) => {
                      const [owner, name] = repository.full_name.split("/");
                      const updated = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(repository.updated_at));
                      return (
                        <tr key={repository.id}>
                          <td className="repository-name-cell">
                            <span className="repository-name-wrap">
                              <span className="repository-row-text">
                                <strong title={repository.name}>{repository.name}</strong>
                                <span title={repository.description || undefined}>{repository.description || "No description provided."}</span>
                              </span>
                            </span>
                          </td>
                          <td className="repository-language-cell">
                            {repository.language ? <><i className="language-dot" />{repository.language}</> : <span className="repository-no-language">—</span>}
                          </td>
                          <td className="repository-date-cell">{updated}</td>
                          <td>
                            <div className="repository-row-actions">
                              <a className="repository-github-button" href={repository.html_url} target="_blank" rel="noreferrer">
                                <FiGithub aria-hidden="true" /> GitHub repo <FiExternalLink aria-hidden="true" />
                              </a>
                              <Link className="repository-analyze-button" href={`/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`}>
                                Analyze this repo <FiArrowUpRight aria-hidden="true" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && <nav className="repository-pagination" aria-label="Repository pages">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="repository-pagination-controls">
                  <button type="button" onClick={() => goToPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} aria-label="Previous page"><FiChevronLeft aria-hidden="true" /></button>
                  {paginationItems.map((item) => item === "ellipsis-start" || item === "ellipsis-end"
                    ? <span className="repository-page-ellipsis" key={item}>…</span>
                    : <button key={item} type="button" className={item === currentPage ? "active" : ""} onClick={() => goToPage(item)} aria-current={item === currentPage ? "page" : undefined}>{item}</button>)}
                  <button type="button" onClick={() => goToPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} aria-label="Next page"><FiChevronRight aria-hidden="true" /></button>
                </div>
              </nav>}
              </>
            ) : (
              <section className="repository-state repository-empty">
                <span className="repository-state-icon"><FiSearch aria-hidden="true" /></span>
                <h2>{repositories.length ? "No matching repositories" : "No public repositories yet"}</h2>
                <p>{repositories.length ? "Try a different search term." : "Public repositories on your GitHub account will appear here."}</p>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}
