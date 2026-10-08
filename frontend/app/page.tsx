"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header/Header";
import Hero from "./Hero/Hero";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
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

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("repotour-theme", next);
  }

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const match = url.trim().match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/#?]+)\/([^/#?]+)(?:\/.*)?$/i);
    if (!match) {
      setError("Enter a valid public GitHub repository URL, like github.com/vercel/next.js");
      return;
    }

    const owner = match[1];
    const name = match[2].replace(/\.git$/i, "");
    setLoading(true);
    router.push(`/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);
  }

  return (
    <main className="app-shell" data-theme={theme} suppressHydrationWarning>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <Hero
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        onSubmit={start}
        loading={loading}
        error={error}
        hasRepository={false}
        onChooseRepository={setUrl}
      />
      <section className="features">
          <article className="feature-card">
            <span className="feature-number">01</span>
            <span className="feature-icon amber"><FeatureIcon name="folder" /></span>
            <h3>The whole picture</h3>
            <p>Every directory, nested and neatly<br /> organized into a file tree.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">02</span>
            <span className="feature-icon violet"><FeatureIcon name="file" /></span>
            <h3>Source, at a glance</h3>
            <p>Open files instantly and read the<br /> code without leaving the page.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">03</span>
            <span className="feature-icon green"><FeatureIcon name="search" /></span>
            <h3>Nothing to install</h3>
            <p>Public repositories, straight from<br /> GitHub to your browser.</p>
          </article>
      </section>
      <footer className="page-footer">
        <span>MADE FOR THE CURIOUS.</span>
        <span>READ THE CODE. <span className="footer-star">✳</span></span>
      </footer>
    </main>
  );
}

function FeatureIcon({ name }: { name: "folder" | "file" | "search" }) {
  const paths = {
    folder: "M3 7.5A1.5 1.5 0 0 1 4.5 6h5l2 2H19a2 2 0 0 1 2 2v7.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z",
    file: "M6 3h8l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm8 0v5h5M8 13h8M8 17h8",
    search: "m20 20-4.2-4.2M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  };
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
