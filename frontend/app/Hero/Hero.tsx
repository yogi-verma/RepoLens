"use client";

import type { ChangeEventHandler, FormEventHandler } from "react";
import "./Hero.css";

type HeroProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  loading: boolean;
  error: string;
  hasRepository: boolean;
  onChooseRepository: (url: string) => void;
};

function GitHubMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.5-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.12.08 1.72 1.15 1.72 1.15 1 .72 2.62.51 3.26.39.1-.73.39-1.23.71-1.51-2.5-.29-5.13-1.25-5.13-5.55 0-1.22.44-2.22 1.15-3-.12-.29-.5-1.43.11-2.98 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.69.11 2.98.72.78 1.15 1.78 1.15 3 0 4.31-2.63 5.26-5.14 5.54.4.35.76 1.03.76 2.08v3.09c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
    </svg>
  );
}

export default function Hero({ value, onChange, onSubmit, loading, error, hasRepository, onChooseRepository }: HeroProps) {
  return (
    <section className={`hero ${hasRepository ? "hero-compact" : ""}`}>
      <div className="hero-eyebrow"><span className="hero-eyebrow-line" /> THE OPEN SOURCE EXPLORER</div>
      <h1>Understand any<br className="desktop-break" /> codebase, <span>instantly.</span></h1>
      <p className="hero-copy">Explore the files behind any public GitHub project.<br className="desktop-break" /> No clone, no setup — just paste a link and look around.</p>

      <form className="hero-search" onSubmit={onSubmit}>
        <span className="hero-search-icon"><GitHubMark /></span>
        <input value={value} onChange={onChange} placeholder="Paste a GitHub repository URL…" aria-label="GitHub repository URL" />
        <span className="hero-input-hint">PUBLIC REPOS</span>
        <button className="hero-start-button" type="submit" disabled={loading}>
          {loading ? <><span className="hero-spinner" /> Loading</> : <>Explore <span className="hero-button-arrow">↗</span></>}
        </button>
      </form>

      {error && <p className="hero-error" role="alert">{error}</p>}
      {!hasRepository && !error && (
        <div className="hero-try-row">
          <span>TRY A REPO</span>
          <button type="button" onClick={() => onChooseRepository("https://github.com/vercel/next.js")}>vercel / next.js <span>↗</span></button>
          <button type="button" onClick={() => onChooseRepository("https://github.com/fastapi/fastapi")}>fastapi / fastapi <span>↗</span></button>
          <button type="button" onClick={() => onChooseRepository("https://github.com/astral-sh/uv")}>astral-sh / uv <span>↗</span></button>
        </div>
      )}
    </section>
  );
}
