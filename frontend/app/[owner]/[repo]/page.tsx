"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "../../Header/Header";
import FilesAndFolderLayout from "../../FilesAndFolderLayout/FilesAndFolderLayout";
import type { Repository } from "../../types";

export default function RepositoryPage() {
  return <Suspense fallback={<div className="route-loading">Loading repository…</div>}><RepositoryPageContent /></Suspense>;
}

function RepositoryPageContent() {
  const params = useParams<{ owner: string; repo: string }>();
  const owner = decodeURIComponent(params.owner);
  const name = decodeURIComponent(params.repo);
  const [repository, setRepository] = useState<Repository | null>(null);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("repotour-theme") === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const background = theme === "dark" ? "#111315" : "#f7f7f4";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.style.backgroundColor = background;
    document.body.style.backgroundColor = background;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function loadRepository() {
      setRepository(null);
      setError("");
      try {
        const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Repository not found. Check the URL and make sure the repository is public."
              : response.status === 403
                ? "GitHub API rate limit reached. Please try again in a little while."
                : "Could not load this repository.",
          );
        }
        const data: Repository = await response.json();
        if (!cancelled) setRepository(data);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Something went wrong while contacting GitHub.");
      }
    }
    void loadRepository();
    return () => { cancelled = true; };
  }, [owner, name]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("repotour-theme", next);
  }

  return (
    <main className="app-shell repository-page" data-theme={theme} suppressHydrationWarning>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      {repository ? <FilesAndFolderLayout repo={repository} /> : error ? <p className="route-error" role="alert">{error}</p> : <div className="route-loading"><span className="spinner" /> Loading {owner}/{name}…</div>}
    </main>
  );
}
