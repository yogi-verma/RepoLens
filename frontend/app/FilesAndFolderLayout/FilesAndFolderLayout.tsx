"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/ai";
import { FaCodeBranch } from "react-icons/fa";
import { GoRepoForked } from "react-icons/go";
import "./FileAndFolderLayout.css";
import type { Repository } from "../types";
type TreeItem = { path: string; type: "blob" | "tree"; size?: number };
type TreeNode = { name: string; path: string; type: "blob" | "tree"; children: TreeNode[]; size?: number };
type BranchItem = { name: string };
type CommitSummary = { total: number; lastCommitAt: string | null };
const emptyCommitSummary: CommitSummary = { total: 0, lastCommitAt: null };

const paths: Record<string, string> = {
  folder: "M3 7.5A1.5 1.5 0 0 1 4.5 6h5l2 2H19a2 2 0 0 1 2 2v7.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z",
  file: "M6 3h8l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm8 0v5h5M8 13h8M8 17h8",
  search: "m20 20-4.2-4.2M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  fork: "M6 3v12a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8 M6 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  github: "M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.5-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.12.08 1.72 1.15 1.72 1.15 1 .72 2.62.51 3.26.39.1-.73.39-1.23.71-1.51-2.5-.29-5.13-1.25-5.13-5.55 0-1.22.44-2.22 1.15-3-.12-.29-.5-1.43.11-2.98 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.69.11 2.98.72.78 1.15 1.78 1.15 3 0 4.31-2.63 5.26-5.14 5.54.4.35.76 1.03.76 2.08v3.09c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z",
  history: "M3 12a9 9 0 1 0 2.64-6.36L3 8.25M3 3v5.25h5.25M12 7v5l3.5 2",
  commit: "M8 12h8M3 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Zm12 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z",
};

function Icon({ name, size = 16, filled = false }: { name: string; size?: number; filled?: boolean }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.file} /></svg>;
}

function makeTree(items: TreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const item of items) {
    const parts = item.path.split("/");
    let current = root;
    let fullPath = "";
    parts.forEach((part, index) => {
      fullPath = fullPath ? `${fullPath}/${part}` : part;
      let node = current.find((entry) => entry.name === part);
      if (!node) {
        node = {
          name: part,
          path: fullPath,
          type: index === parts.length - 1 ? item.type : "tree",
          children: [],
          size: index === parts.length - 1 ? item.size : undefined,
        };
        current.push(node);
      }
      if (index === parts.length - 1) {
        node.type = item.type;
        node.size = item.size;
      }
      current = node.children;
    });
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === "tree" ? -1 : 1);
    nodes.forEach((node) => sort(node.children));
  };
  sort(root);
  return root;
}

function fileTone(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["ts", "tsx", "js", "jsx"].includes(ext ?? "")) return "file-blue";
  if (ext === "py") return "file-yellow";
  if (["css", "scss"].includes(ext ?? "")) return "file-purple";
  if (["md", "mdx"].includes(ext ?? "")) return "file-green";
  return "";
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function formatCount(count = 0) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(count);
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Unknown";
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  const [unit, divisor] = units.find(([, size]) => Math.abs(seconds) >= size) ?? ["second", 1];
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(Math.round(seconds / divisor), unit);
}

export default function FilesAndFolderLayout({ repo }: { repo: Repository }) {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [branch, setBranch] = useState(repo.default_branch);
  const [commitSummary, setCommitSummary] = useState<CommitSummary>(emptyCommitSummary);
  const [commitsLoading, setCommitsLoading] = useState(true);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [content, setContent] = useState("");
  const [filter, setFilter] = useState("");
  const [goToFile, setGoToFile] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [treeLoading, setTreeLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const branchPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      setBranchesLoading(true);
      setTreeLoading(true);
      setCommitsLoading(true);
      setError("");
      try {
        const [branchList, treeData] = await Promise.all([
          loadAllBranches(repo.full_name),
          loadTree(repo.full_name, repo.default_branch),
        ]);
        if (cancelled) return;
        setCommitsLoading(true);
        setBranches(branchList);
        setBranch(repo.default_branch);
        setTree(makeTree(treeData.tree));
        setExpanded(new Set([""]));
        void loadCommitSummary(repo.full_name, repo.default_branch)
          .then((summary) => { if (!cancelled) setCommitSummary(summary); })
          .catch(() => { if (!cancelled) setCommitSummary(emptyCommitSummary); })
          .finally(() => { if (!cancelled) setCommitsLoading(false); });
        if (treeData.truncated) setError("This repository is large; GitHub returned a partial file list.");
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Could not load repository branches and files.");
          setCommitsLoading(false);
        }
      } finally {
        if (!cancelled) {
          setBranchesLoading(false);
          setTreeLoading(false);
        }
      }
    }
    void initialize();
    return () => { cancelled = true; };
  }, [repo.default_branch, repo.full_name]);

  useEffect(() => {
    if (!branchMenuOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !branchPickerRef.current?.contains(event.target)) setBranchMenuOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setBranchMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [branchMenuOpen]);

  async function switchBranch(nextBranch: string) {
    if (!nextBranch || nextBranch === branch) return;
    const currentRequest = ++requestId.current;
    setTreeLoading(true);
    setCommitsLoading(true);
    setError("");
    setSelected(null);
    setContent("");
    try {
      const [treeData, nextCommitSummary] = await Promise.all([
        loadTree(repo.full_name, nextBranch),
        loadCommitSummary(repo.full_name, nextBranch).catch(() => emptyCommitSummary),
      ]);
      if (currentRequest !== requestId.current) return;
      setTree(makeTree(treeData.tree));
      setBranch(nextBranch);
      setCommitSummary(nextCommitSummary);
      setExpanded(new Set([""]));
      setFilter("");
      if (treeData.truncated) setError("This repository is large; GitHub returned a partial file list.");
    } catch (reason) {
      if (currentRequest === requestId.current) setError(reason instanceof Error ? reason.message : "Could not switch to this branch.");
    } finally {
      if (currentRequest === requestId.current) {
        setTreeLoading(false);
        setCommitsLoading(false);
      }
    }
  }

  async function openFile(node: TreeNode) {
    if (node.type !== "blob") return;
    setSelected(node);
    setFileLoading(true);
    setContent("");
    try {
      const path = node.path.split("/").map(encodeURIComponent).join("/");
      const response = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${path}?ref=${encodeURIComponent(branch)}`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!response.ok) throw new Error(response.status === 403 ? "GitHub API rate limit reached." : "Could not load this file.");
      const data = await response.json();
      if (data.encoding !== "base64" || !data.content) throw new Error("This file is too large or cannot be displayed as text.");
      const bytes = Uint8Array.from(atob(data.content.replace(/\s/g, "")), (char) => char.charCodeAt(0));
      setContent(new TextDecoder().decode(bytes));
    } catch (reason) {
      setContent(reason instanceof Error ? reason.message : "Could not read this file.");
    } finally {
      setFileLoading(false);
    }
  }

  function toggleFolder(path: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  const visibleTree = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return tree;
    const prune = (nodes: TreeNode[]): TreeNode[] => nodes.flatMap((node) => {
      const children = prune(node.children);
      return node.name.toLowerCase().includes(query) || children.length ? [{ ...node, children }] : [];
    });
    return prune(tree);
  }, [filter, tree]);

  const allFiles = useMemo(() => {
    const files: TreeNode[] = [];
    const collect = (nodes: TreeNode[]) => nodes.forEach((node) => {
      if (node.type === "blob") files.push(node);
      else collect(node.children);
    });
    collect(tree);
    return files;
  }, [tree]);
  const fileMatches = goToFile.trim()
    ? allFiles.filter((file) => file.path.toLowerCase().includes(goToFile.trim().toLowerCase())).slice(0, 8)
    : [];

  const countFiles = (nodes: TreeNode[]): number => nodes.reduce((count, node) => count + (node.type === "blob" ? 1 : countFiles(node.children)), 0);
  const breadcrumbs = selected?.path.split("/") ?? [];

  function renderNodes(nodes: TreeNode[], depth = 0): React.ReactNode {
    return nodes.map((node) => {
      const folder = node.type === "tree";
      const open = filter ? true : expanded.has(node.path);
      return (
        <div key={node.path}>
          <button
            className={`tree-row ${selected?.path === node.path ? "tree-row-selected" : ""}`}
            style={{ paddingLeft: `${14 + depth * 17}px` }}
            onClick={() => folder ? toggleFolder(node.path) : void openFile(node)}
            title={node.path}
          >
            {folder ? <span className="chevron">{open ? <AiFillCaretDown aria-hidden="true" /> : <AiFillCaretUp aria-hidden="true" />}</span> : <span className="chevron spacer" />}
            <span className={folder ? "folder-icon" : `file-icon ${fileTone(node.name)}`}><Icon name={folder ? "folder" : "file"} size={15} filled={folder} /></span>
            <span className="tree-name">{node.name}</span>
            {!folder && <span className="tree-size">{formatBytes(node.size)}</span>}
          </button>
          {folder && open && node.children.length > 0 && renderNodes(node.children, depth + 1)}
        </div>
      );
    });
  }

  return (
    <section className="workspace" aria-label="Repository explorer">
      <div className="repo-bar">
        <div className="repo-identity">
          <span className="repo-icon"><Icon name="github" size={17} filled /></span>
          <div>
            <div className="repo-name-line"><span className="repo-owner">{repo.full_name.split("/")[0]} /</span><span className="repo-name">{repo.name}</span><span className="public-badge">PUBLIC</span></div>
            <div className="repo-description">{repo.description || "No description provided."}</div>
          </div>
        </div>
        <div className="repo-stats">
          <span className="repo-stat"><Icon name="eye" size={16} /><b>{formatCount(repo.subscribers_count ?? repo.watchers_count)}</b><small>Watch</small></span>
          <span className="repo-stat"><GoRepoForked size={16} aria-hidden="true" /><b>{formatCount(repo.forks_count)}</b><small>Fork</small></span>
          <span className="repo-stat"><Icon name="star" size={16} /><b>{formatCount(repo.stargazers_count)}</b><small>Star</small></span>
        </div>
      </div>

      <div className="repository-toolbar">
        <div className="branch-controls">
          <div className="branch-picker-wrap" ref={branchPickerRef}>
            <button
              type="button"
              className="branch-picker"
              onClick={() => setBranchMenuOpen((open) => !open)}
              disabled={branchesLoading || treeLoading || branches.length === 0}
              aria-label={`Current branch: ${branch || "Loading branches"}`}
              aria-haspopup="listbox"
              aria-expanded={branchMenuOpen}
              aria-controls="repository-branch-list"
            >
              <FaCodeBranch className="branch-picker-icon" aria-hidden="true" />
              <span className="branch-picker-current">{branchesLoading ? "Loading branches…" : branch}</span>
              {branchesLoading ? <span className="branch-loading-dot" aria-hidden="true" /> : <AiFillCaretDown className={`branch-picker-caret ${branchMenuOpen ? "is-open" : ""}`} aria-hidden="true" />}
            </button>
            {branchMenuOpen && !branchesLoading && <div className="branch-menu" id="repository-branch-list" role="listbox" aria-label="Repository branches">
              <div className="branch-menu-heading">Switch branches</div>
              {branches.map((item) => <button
                type="button"
                role="option"
                aria-selected={branch === item.name}
                className={`branch-option ${branch === item.name ? "branch-option-selected" : ""}`}
                key={item.name}
                title={item.name}
                onClick={() => { setBranchMenuOpen(false); void switchBranch(item.name); }}
              >
                <FaCodeBranch aria-hidden="true" />
                <span>{item.name}</span>
                {branch === item.name && <span className="branch-option-check" aria-hidden="true">✓</span>}
              </button>)}
            </div>}
          </div>
          <span className="branch-total">{branchesLoading ? "Loading branches…" : <><b>{branches.length.toLocaleString()}</b> branches</>}</span>
        </div>
        <div className="go-to-file-wrap">
          <label className="go-to-file"><Icon name="search" size={17} /><input value={goToFile} onChange={(event) => setGoToFile(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && fileMatches[0]) { event.preventDefault(); void openFile(fileMatches[0]); setGoToFile(""); } }} placeholder="Go to file" aria-label="Search files in repository" /></label>
          {goToFile.trim() && <div className="file-search-results">{fileMatches.length ? fileMatches.map((file) => <button key={file.path} type="button" onClick={() => { void openFile(file); setGoToFile(""); }}><Icon name="file" size={14} /><span>{file.path}</span></button>) : <p>No matching files</p>}</div>}
        </div>
        <div className="repository-toolbar-actions">
          <a href={repo.html_url} target="_blank" rel="noreferrer" className="github-open">View on GitHub <span>↗</span></a>
        </div>
      </div>

      <div className="repository-body">
      <div className="explorer-grid">
        <aside className="file-sidebar">
          <div className="sidebar-heading"><div><span className="sidebar-title">EXPLORER</span><span className="file-count">{countFiles(tree)} files</span></div><button className="icon-button" onClick={() => setExpanded(new Set([""]))} title="Collapse folders" aria-label="Collapse folders"><AiFillCaretUp aria-hidden="true" /></button></div>
          <label className="filter-box"><Icon name="search" size={14} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter files…" /></label>
          <div className="file-tree"><div className="file-tree-inner">{renderNodes(visibleTree)}</div></div>
          <div className="sidebar-footer"><span className="live-dot" /> Browsing public source</div>
        </aside>
        <div className="code-pane">
          <div className="code-toolbar"><div className="breadcrumbs">{selected ? breadcrumbs.map((crumb, index) => <span className={index === breadcrumbs.length - 1 ? "crumb-current" : ""} key={`${crumb}-${index}`}>{crumb}{index < breadcrumbs.length - 1 && <span className="crumb-separator">/</span>}</span>) : <span className="crumb-placeholder">Select a file to preview</span>}</div>{selected && <span className="code-language">{selected.path.split(".").pop()?.toUpperCase()}</span>}</div>
          <div className="code-content">
            {treeLoading ? <div className="loading-preview"><span className="spinner" /> Loading {branch || "repository"}…</div> : !selected ? <div className="empty-preview"><div className="empty-art"><div className="empty-art-back">{`{ }`}</div><div className="empty-art-front"><span className="art-line wide" /><span className="art-line mid" /><span className="art-line short" /><span className="art-line wide" /><span className="art-line tiny" /></div><span className="empty-cursor">↖</span></div><h2>Your code, in context.</h2><p>Choose any file in the explorer to read its<br className="desktop-break" /> contents right here.</p><span className="empty-shortcut"><span>⌘</span> Pick a file to get started</span></div> : fileLoading ? <div className="loading-preview"><span className="spinner" /> Fetching file from GitHub…</div> : <div className="source-code">{content.split("\n").map((line, index) => <div className="code-line" key={index}><span className="line-number">{index + 1}</span><code>{line || " "}</code></div>)}</div>}
          </div>
          <div className="code-status"><span><span className="status-green" /> {selected ? selected.path : "Ready to explore"}</span><span>UTF-8 <span className="status-separator">·</span> GitHub API</span></div>
        </div>
      </div>
      <aside className="repo-about">
        <h2>About</h2>
        <p>{repo.description || "No description provided."}</p>
        {repo.topics && repo.topics.length > 0 && <div className="repo-topics">{repo.topics.slice(0, 8).map((topic) => <span key={topic}>{topic}</span>)}</div>}
        {repo.language && <div className="about-language"><i />{repo.language}</div>}
        {repo.license && <div className="about-license">{repo.license.name}</div>}
        <div className="about-divider" />
        <div className="about-stat"><Icon name="star" size={16} /><span>{formatCount(repo.stargazers_count)} stars</span></div>
        <div className="about-stat"><Icon name="eye" size={16} /><span>{formatCount(repo.subscribers_count ?? repo.watchers_count)} watching</span></div>
        <div className="about-stat"><GoRepoForked size={16} aria-hidden="true" /><span>{formatCount(repo.forks_count)} forks</span></div>
        <div className="about-stat"><FaCodeBranch className="about-branch-icon" aria-hidden="true" /><span>{branches.length.toLocaleString()} branches</span></div>
        <div className="about-stat"><Icon name="commit" size={16} /><span>{commitsLoading ? "Loading commits…" : `${commitSummary.total.toLocaleString()} commits`}</span></div>
        <div className="about-stat" title={commitSummary.lastCommitAt ? new Date(commitSummary.lastCommitAt).toLocaleString() : undefined}><Icon name="history" size={16} /><span>{commitsLoading ? "Loading last commit…" : `Last commit ${commitSummary.lastCommitAt ? formatRelativeTime(commitSummary.lastCommitAt) : "unavailable"}`}</span></div>
      </aside>
      </div>
      {error && <p className="explorer-error" role="alert">{error}</p>}
    </section>
  );
}

async function loadTree(fullName: string, branch: string): Promise<{ tree: TreeItem[]; truncated?: boolean }> {
  const response = await fetch(`https://api.github.com/repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error(response.status === 403 ? "GitHub API rate limit reached." : "Could not load files for this branch.");
  return response.json();
}

async function loadAllBranches(fullName: string): Promise<BranchItem[]> {
  const allBranches: BranchItem[] = [];
  for (let page = 1; ; page += 1) {
    const response = await fetch(`https://api.github.com/repos/${fullName}/branches?per_page=100&page=${page}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(response.status === 403 ? "GitHub API rate limit reached while loading branches." : "Could not load repository branches.");
    const batch: BranchItem[] = await response.json();
    allBranches.push(...batch);
    if (batch.length < 100) return allBranches;
  }
}

async function loadCommitSummary(fullName: string, branch: string): Promise<CommitSummary> {
  const response = await fetch(`https://api.github.com/repos/${fullName}/commits?sha=${encodeURIComponent(branch)}&per_page=1`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error("Could not load commit history.");
  const commits: { commit?: { author?: { date?: string }; committer?: { date?: string } } }[] = await response.json();
  const link = response.headers.get("Link") ?? "";
  const lastPage = link.match(/[?&]page=(\d+)[^>]*>\s*;\s*rel="last"/);
  return {
    total: lastPage ? Number(lastPage[1]) : commits.length,
    lastCommitAt: commits[0]?.commit?.committer?.date ?? commits[0]?.commit?.author?.date ?? null,
  };
}
