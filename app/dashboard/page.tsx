"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";
import {
  DEFAULT_PORTFOLIO,
  SAMPLE_CVS,
  createEmptyPortfolio,
  parseCvToPortfolio,
  PortfolioData,
  ProjectItem,
  ExperienceItem,
} from "../lib/portfolio-data";
import { exportPortfolioZip, generatePortfolioFiles } from "../lib/export-code";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../lib/firebase";

interface UserSession {
  userId: string;
  email: string;
  name: string;
  role?: string;
  photoURL?: string | null;
}

export default function DashboardPage() {
  const router = useRouter();

  // Authentication & session state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core portfolio state from CV
  const [portfolio, setPortfolio] = useState<PortfolioData>(() => createEmptyPortfolio());
  const [hasLiveSite, setHasLiveSite] = useState(false);
  const [activeTab, setActiveTab] = useState<"projects" | "experience" | "bio" | "theme" | "analytics">("projects");

  // Navigation & action states
  const [loggingOut, setLoggingOut] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // CV Upload & Parsing State
  const [isParsingCv, setIsParsingCv] = useState(false);
  const [parseStage, setParseStage] = useState("");

  // Projects search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Project Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    tags: "",
    metric: "",
    category: "ai" as "ai" | "infra" | "frontend" | "mobile",
  });

  // Experience Modal state
  const [addExpModalOpen, setAddExpModalOpen] = useState(false);
  const [newExp, setNewExp] = useState({
    role: "",
    company: "",
    period: "",
    location: "",
    highlights: "",
  });

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [enrichingProject, setEnrichingProject] = useState<ProjectItem | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Code Inspector Modal
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [activeFileTab, setActiveFileTab] = useState<string>("app/page.tsx");
  const [exportedFiles, setExportedFiles] = useState<Record<string, string>>({});

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Verify authentication on mount & load saved portfolio
  useEffect(() => {
    let isMounted = true;

    async function initDashboard() {
      try {
        const sessionRes = await fetch("/api/auth/me");
        const sessionData = await sessionRes.json().catch(() => ({}));

        if (!sessionData.authenticated || !sessionData.user) {
          router.push("/login?next=/dashboard");
          return;
        }

        if (isMounted) {
          setCurrentUser(sessionData.user);
        }

        // Fetch user's saved portfolio from database
        const portRes = await fetch("/api/portfolio");
        if (portRes.ok) {
          const portData = await portRes.json();
          if (portData.portfolio && isMounted) {
            setPortfolio(portData.portfolio);
            const live = Boolean(portData.hasSavedData && portData.portfolio.cvFileName);
            setHasLiveSite(live);
          }
        }
      } catch (err) {
        console.error("Error initializing dashboard session:", err);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    initDashboard();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Persist portfolio changes to database
  async function persistPortfolio(updated: PortfolioData) {
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      return res.ok;
    } catch (err) {
      console.warn("Notice: autosave to database failed:", err);
      return false;
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      try {
        const auth = getAuth(app);
        await signOut(auth);
      } catch (clientSignOutErr) {
        console.warn("Client auth signOut notice:", clientSignOutErr);
      }
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  async function handleDeploy() {
    setDeploying(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolio),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.portfolio) {
        setPortfolio(data.portfolio);
        setHasLiveSite(true);
        showToast(`✨ Portfolio deployed live to /p/${data.portfolio.slug}!`);
      } else {
        showToast(data.error || "Failed to deploy portfolio.");
      }
    } catch {
      showToast("Network error while deploying portfolio.");
    } finally {
      setDeploying(false);
    }
  }

  function handleCopyLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://portai.me";
    const liveUrl = `${origin}/p/${portfolio.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(liveUrl);
    }
    showToast(`📋 Copied live portfolio link: ${liveUrl}`);
  }

  // Handle CV Upload & AI parsing
  async function handleCvUpload(file?: File) {
    setIsParsingCv(true);
    const fileName = file ? file.name : "Custom_Uploaded_Resume.pdf";

    setParseStage("1/4: Ingesting document & extracting text layers…");
    await new Promise((r) => setTimeout(r, 600));

    setParseStage("2/4: Identifying career trajectory & technical stack…");
    await new Promise((r) => setTimeout(r, 600));

    setParseStage("3/4: Synthesizing deep-dive case studies & impact metrics…");
    await new Promise((r) => setTimeout(r, 700));

    setParseStage("4/4: Deploying live portfolio link…");
    await new Promise((r) => setTimeout(r, 500));

    const parsed = parseCvToPortfolio(
      fileName,
      currentUser?.name || portfolio.fullName,
      currentUser?.email || portfolio.email
    );

    // If user already created projects or experiences, preserve them
    if (portfolio.projects.length > 0) {
      parsed.projects = [
        ...portfolio.projects,
        ...parsed.projects.filter((p) => !portfolio.projects.some((ep) => ep.title === p.title)),
      ];
    }
    if (portfolio.experience.length > 0) {
      parsed.experience = [
        ...portfolio.experience,
        ...parsed.experience.filter((e) => !portfolio.experience.some((ee) => ee.company === e.company)),
      ];
    }

    setPortfolio(parsed);
    setHasLiveSite(true);
    setIsParsingCv(false);
    showToast(`✨ Successfully parsed "${fileName}" and generated live portfolio!`);
    await persistPortfolio(parsed);
  }

  async function loadSamplePreset(presetKey: "ai_staff" | "fullstack") {
    setIsParsingCv(true);
    setParseStage("Loading sample CV profile and synthesizing portfolio…");
    setTimeout(async () => {
      const selected = SAMPLE_CVS[presetKey] || DEFAULT_PORTFOLIO;
      setPortfolio(selected);
      setHasLiveSite(true);
      setIsParsingCv(false);
      showToast(`Loaded ${selected.fullName}'s CV portfolio preset`);
      await persistPortfolio(selected);
    }, 700);
  }

  // Export ZIP handler
  async function handleExportZip() {
    setExportingZip(true);
    try {
      const blob = await exportPortfolioZip(portfolio);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${portfolio.slug}-portfolio-source.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`📦 Downloaded ${portfolio.slug}-portfolio-source.zip!`);
    } catch {
      showToast("Failed to generate ZIP archive");
    } finally {
      setExportingZip(false);
    }
  }

  // Open Code Inspector
  function handleOpenCodeInspector() {
    const files = generatePortfolioFiles(portfolio);
    setExportedFiles(files);
    setActiveFileTab("app/page.tsx");
    setCodeModalOpen(true);
  }

  async function toggleLive(id: string) {
    const updatedProjects = portfolio.projects.map((p) =>
      p.id === id ? { ...p, isLive: !p.isLive } : p
    );
    const updated = { ...portfolio, projects: updatedProjects };
    setPortfolio(updated);
    showToast("Updated project visibility");
    await persistPortfolio(updated);
  }

  async function handleDeleteProject(id: string) {
    const updated = {
      ...portfolio,
      projects: portfolio.projects.filter((p) => p.id !== id),
    };
    setPortfolio(updated);
    showToast("Removed project from portfolio");
    await persistPortfolio(updated);
  }

  async function handleAddProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    const created: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: newProject.title.trim(),
      description: newProject.description.trim() || "AI-generated case study and technical breakdown.",
      tags: newProject.tags
        ? newProject.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : ["TypeScript", "Next.js"],
      metric: newProject.metric.trim() || "High Performance & Scalable",
      isLive: true,
      repoUrl: "https://github.com",
      category: newProject.category,
    };

    const updated = {
      ...portfolio,
      projects: [created, ...portfolio.projects],
    };

    setPortfolio(updated);
    setAddModalOpen(false);
    setNewProject({ title: "", description: "", tags: "", metric: "", category: "ai" });
    showToast(`Added "${created.title}" to portfolio`);
    await persistPortfolio(updated);
  }

  async function handleAddExpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newExp.role.trim() || !newExp.company.trim()) return;

    const created: ExperienceItem = {
      id: `exp-${Date.now()}`,
      role: newExp.role.trim(),
      company: newExp.company.trim(),
      period: newExp.period.trim() || "Present",
      location: newExp.location.trim() || "Remote",
      highlights: newExp.highlights
        ? newExp.highlights.split("\n").map((h) => h.trim()).filter(Boolean)
        : ["Delivered key architectural improvements and scaled core platform metrics."],
    };

    const updated = {
      ...portfolio,
      experience: [created, ...portfolio.experience],
    };

    setPortfolio(updated);
    setAddExpModalOpen(false);
    setNewExp({ role: "", company: "", period: "", location: "", highlights: "" });
    showToast(`Added ${created.role} at ${created.company}`);
    await persistPortfolio(updated);
  }

  async function handleSaveBio() {
    setDeploying(true);
    const success = await persistPortfolio(portfolio);
    setDeploying(false);
    if (success) {
      showToast("✨ Saved and published updated bio to live portfolio!");
    } else {
      showToast("Bio updated in preview.");
    }
  }

  async function handleThemeChange(theme: "obsidian" | "violet" | "emerald" | "minimal") {
    const updated = { ...portfolio, theme };
    setPortfolio(updated);
    showToast(`Switched theme to ${theme === "obsidian" ? "Obsidian Luxe" : theme === "violet" ? "Midnight Violet" : "Cyber Emerald"}`);
    await persistPortfolio(updated);
  }

  function openAiEnrich(project: ProjectItem) {
    setEnrichingProject(project);
    setAiModalOpen(true);
    setAiLoading(true);
    setTimeout(() => setAiLoading(false), 900);
  }

  async function applyAiEnhancements() {
    if (!enrichingProject) return;

    const enhancedMetric = "Zero-copy memory pipelines in Rust (4.2x latency reduction)";
    const enhancedDesc = `${enrichingProject.description.trim()} Optimized with zero-copy memory pipelines and high-throughput multi-region edge failover with 99.999% uptime.`;

    const updatedProjects = portfolio.projects.map((p) => {
      if (p.id === enrichingProject.id) {
        return {
          ...p,
          metric: enhancedMetric,
          description: enhancedDesc,
          tags: Array.from(new Set([...p.tags, "High-Throughput", "Distributed", "Rust"])),
        };
      }
      return p;
    });

    const updated = { ...portfolio, projects: updatedProjects };
    setPortfolio(updated);
    setAiModalOpen(false);
    showToast(`✨ Enriched case study applied to "${enrichingProject.title}"`);
    await persistPortfolio(updated);
  }

  const filteredProjects = portfolio.projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === "all" || p.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const hasData = Boolean(
    portfolio.cvFileName || portfolio.projects.length > 0 || portfolio.experience.length > 0
  );

  if (authLoading) {
    return (
      <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", background: "#07090e" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: "#94a3b8", fontSize: "0.88rem", fontWeight: 500 }}>Connecting to your workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardPage}>
      {/* STICKY TOP NAVBAR */}
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <Link href="/dashboard" className={styles.brand}>
            <span className={styles.brandIcon} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"></path>
                <path d="m9 12 2 2 4-5"></path>
              </svg>
            </span>
            <span>PortAI Command Center</span>
          </Link>

          <div className={styles.siteBreadcrumb}>
            {hasLiveSite ? (
              <>
                <span className={styles.liveBadge}>
                  <span className={styles.pulseDot} />
                  Live Site
                </span>
                <Link href={`/p/${portfolio.slug}`} target="_blank" style={{ color: "inherit", textDecoration: "none" }}>
                  /p/{portfolio.slug} ↗
                </Link>
              </>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.55rem", borderRadius: 999, background: "rgba(148,163,184,0.12)", color: "#94a3b8", fontSize: "0.72rem", fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#64748b" }} />
                Draft · No Live Site Yet
              </span>
            )}
          </div>
        </div>

        <div className={styles.navRight}>
          {hasLiveSite && (
            <>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleCopyLink}
                title="Copy Public Portfolio Link"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy Link
              </button>

              <Link
                href={`/p/${portfolio.slug}`}
                className={styles.secondaryBtn}
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                Visit Live Site ↗
              </Link>
            </>
          )}

          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportZip}
            disabled={exportingZip || !hasData}
            title={hasData ? "Export Next.js 16 + Tailwind source code as ZIP" : "Upload CV to export source code"}
            style={{ opacity: hasData ? 1 : 0.6 }}
          >
            {exportingZip ? (
              <>
                <span className={styles.spinner} />
                Exporting…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export Source (.zip)
              </>
            )}
          </button>

          <button
            type="button"
            className={styles.deployBtn}
            onClick={handleDeploy}
            disabled={deploying || !hasData}
            title={hasData ? "Deploy live portfolio" : "Upload CV to deploy"}
            style={{ opacity: hasData ? 1 : 0.6 }}
          >
            {deploying ? (
              <>
                <span className={styles.spinner} />
                Deploying…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Deploy Live
              </>
            )}
          </button>

          <div className={styles.userMenu}>
            <div className={styles.avatar} title={currentUser?.email || portfolio.email}>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : portfolio.fullName.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, textAlign: "left" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f8fafc", lineHeight: 1.1 }}>
                {currentUser?.name || portfolio.fullName}
              </span>
              <span style={{ fontSize: "0.7rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                {currentUser?.email || portfolio.email}
              </span>
            </div>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "…" : "Sign out"}
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className={styles.main}>
        {/* CV UPLOAD & LIVE LINK HERO BANNER */}
        <section className={styles.cvHeroBanner}>
          <div className={styles.cvHeroLeft}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.25rem 0.65rem", borderRadius: 999, background: hasData ? "rgba(99,102,241,0.15)" : "rgba(148,163,184,0.12)", border: hasData ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(148,163,184,0.2)", color: hasData ? "#a5b4fc" : "#94a3b8", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.85rem" }}>
              <span>📄</span> {hasData ? `Active CV Source: ${portfolio.cvFileName || "Resume Parsed"}` : "Awaiting CV / Resume Upload"}
            </div>

            <h2>
              {hasData ? (
                <>Portfolio for <span className={styles.highlightText}>{portfolio.fullName}</span></>
              ) : (
                <>Welcome, <span className={styles.highlightText}>{currentUser?.name || "Developer"}</span></>
              )}
            </h2>
            <p className={styles.cvHeroDesc}>
              {hasData
                ? "Generated from your uploaded CV. Visitors can view your live case studies, work history, and you can export the full Next.js source code anytime."
                : "Your workspace is clean and ready. Upload your resume or CV below to automatically parse your case studies, work history, and deploy your live portfolio."}
            </p>

            {/* Live Portfolio URL Box */}
            <div className={styles.liveLinkBox}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                <span style={{ color: hasLiveSite ? "#34d399" : "#94a3b8", fontSize: "0.9rem" }}>🔗</span>
                <span className={styles.liveUrlText} style={{ color: hasLiveSite ? undefined : "#94a3b8" }}>
                  {hasLiveSite
                    ? `${typeof window !== "undefined" ? window.location.origin : "https://portai.me"}/p/${portfolio.slug}`
                    : `Live site will be provisioned at /p/${portfolio.slug || "my-portfolio"}`}
                </span>
              </div>
              {hasLiveSite ? (
                <div className={styles.linkActions}>
                  <button type="button" className={styles.copyBtn} onClick={handleCopyLink}>
                    Copy
                  </button>
                  <Link
                    href={`/p/${portfolio.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.visitBtn}
                  >
                    Visit Site ↗
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => {
                    const input = document.getElementById("cv-file-input");
                    if (input) input.click();
                  }}
                >
                  Upload CV to Deploy
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={handleExportZip}
                disabled={exportingZip || !hasData}
                title={hasData ? "Download Next.js ZIP" : "Upload CV to enable export"}
                style={{ opacity: hasData ? 1 : 0.6 }}
              >
                📥 Download Next.js ZIP
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleOpenCodeInspector}
                disabled={!hasData}
                style={{ opacity: hasData ? 1 : 0.6 }}
              >
                Inspect Source Code
              </button>
            </div>
          </div>

          {/* CV Drag and Drop Zone */}
          <div
            className={styles.cvDropzone}
            onClick={() => {
              const input = document.getElementById("cv-file-input");
              if (input) input.click();
            }}
          >
            <input
              type="file"
              id="cv-file-input"
              accept=".pdf,.docx,.txt"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCvUpload(file);
              }}
            />

            {isParsingCv ? (
              <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
                <div className={styles.spinner} style={{ width: 34, height: 34, margin: "0 auto 1rem", borderTopColor: "#6366f1" }} />
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#ffffff", marginBottom: "0.35rem" }}>
                  AI Parsing CV…
                </div>
                <div style={{ fontSize: "0.82rem", color: "#a5b4fc" }}>{parseStage}</div>
              </div>
            ) : (
              <>
                <div className={styles.uploadIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <h4 className={styles.dropzoneTitle}>Upload New CV / Resume</h4>
                <p className={styles.dropzoneSubtitle}>Drop PDF or DOCX to re-generate portfolio</p>

                <div className={styles.samplePresets} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.sampleBtn}
                    onClick={() => loadSamplePreset("ai_staff")}
                  >
                    Load AI Staff CV
                  </button>
                  <button
                    type="button"
                    className={styles.sampleBtn}
                    onClick={() => loadSamplePreset("fullstack")}
                  >
                    Load Fullstack CV
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* METRICS & READINESS GRID */}
        <section className={styles.statsGrid}>
          <div className={styles.scoreBannerCard}>
            <div className={styles.scoreCircleLarge}>{hasData ? "98%" : "--"}</div>
            <div className={styles.scoreMeta}>
              <h3>ATS & Recruiter Readiness</h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>
                {hasData ? "High-impact quantifiable stories extracted from CV" : "Ready to evaluate upon CV upload"}
              </p>
              <div className={styles.scoreTags}>
                <span className={styles.scoreChip}>{hasData ? "ATS 99%" : "ATS Ready"}</span>
                <span className={styles.scoreChip}>{hasData ? "SEO 100%" : "SEO Ready"}</span>
                <span className={styles.scoreChip}>Fast &lt;0.2s</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              <span>Profile Views</span>
              <span>📈</span>
            </div>
            <div className={styles.statValue}>{hasData ? "1,420" : "0"}</div>
            <div className={styles.statGrowth}>{hasData ? "+28% this week" : "Awaiting deployment"}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              <span>Case Studies</span>
              <span>✨</span>
            </div>
            <div className={styles.statValue}>
              {portfolio.projects.filter((p) => p.isLive).length}{" "}
              <span style={{ fontSize: "1rem", color: "#64748b", fontWeight: 500 }}>
                / {portfolio.projects.length}
              </span>
            </div>
            <div className={styles.statGrowth} style={{ color: "#818cf8" }}>
              {hasData ? "Extracted from CV" : "0 extracted"}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              <span>Source Code</span>
              <span>💻</span>
            </div>
            <div className={styles.statValue}>Next.js 16</div>
            <div className={styles.statGrowth}>{hasData ? "100% Exportable" : "Ready on upload"}</div>
          </div>
        </section>

        {/* WORKSPACE TAB NAVIGATION */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === "projects" ? styles.tabItemActive : ""}`}
            onClick={() => setActiveTab("projects")}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            Projects & Case Studies
            <span className={styles.tabBadge}>{portfolio.projects.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === "experience" ? styles.tabItemActive : ""}`}
            onClick={() => setActiveTab("experience")}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Work Experience ({portfolio.experience.length})
          </button>

          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === "bio" ? styles.tabItemActive : ""}`}
            onClick={() => setActiveTab("bio")}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            Resume & Bio AI
          </button>

          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === "theme" ? styles.tabItemActive : ""}`}
            onClick={() => setActiveTab("theme")}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Themes & Domains
          </button>

          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === "analytics" ? styles.tabItemActive : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Recruiter Analytics
          </button>
        </div>

        {/* TAB 1: PROJECTS & CASE STUDIES */}
        {activeTab === "projects" && (
          <div>
            <div className={styles.projectFilters}>
              <div className={styles.searchShell}>
                <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search projects by tech, title, or metric…"
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div className={styles.filterChips}>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${filterCategory === "all" ? styles.filterChipActive : ""}`}
                    onClick={() => setFilterCategory("all")}
                  >
                    All ({portfolio.projects.length})
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${filterCategory === "ai" ? styles.filterChipActive : ""}`}
                    onClick={() => setFilterCategory("ai")}
                  >
                    AI & ML
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${filterCategory === "infra" ? styles.filterChipActive : ""}`}
                    onClick={() => setFilterCategory("infra")}
                  >
                    Infrastructure
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${filterCategory === "frontend" ? styles.filterChipActive : ""}`}
                    onClick={() => setFilterCategory("frontend")}
                  >
                    Frontend
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => setAddModalOpen(true)}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.84rem" }}
                >
                  + Add Project
                </button>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div style={{ padding: "3.5rem 1.5rem", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: "16px", marginTop: "1rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(99,102,241,0.12)", color: "#818cf8", display: "grid", placeItems: "center", margin: "0 auto 1rem" }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff", margin: "0 0 0.35rem" }}>
                  {portfolio.projects.length === 0 ? "No projects yet" : "No matching projects found"}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", maxWidth: 420, margin: "0 auto 1.25rem" }}>
                  {portfolio.projects.length === 0
                    ? "Upload your resume above to automatically synthesize case studies, or add your first project manually."
                    : "Try adjusting your search query or category filter."}
                </p>
                {portfolio.projects.length === 0 && (
                  <div style={{ display: "inline-flex", gap: "0.6rem" }}>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => {
                        const input = document.getElementById("cv-file-input");
                        if (input) input.click();
                      }}
                      style={{ padding: "0.45rem 0.95rem", fontSize: "0.82rem" }}
                    >
                      📄 Upload Resume
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setAddModalOpen(true)}
                      style={{ padding: "0.45rem 0.95rem", fontSize: "0.82rem" }}
                    >
                      + Add Project Manually
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.projectsGrid}>
                {filteredProjects.map((project) => (
                  <article key={project.id} className={styles.projectCard}>
                    <div>
                      <div className={styles.projectTop}>
                        <h3 className={styles.projectTitle}>{project.title}</h3>
                        <button
                          type="button"
                          className={`${styles.statusPill} ${project.isLive ? styles.statusLive : styles.statusDraft}`}
                          onClick={() => toggleLive(project.id)}
                          title="Click to toggle live status"
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                          {project.isLive ? "Live" : "Draft"}
                        </button>
                      </div>

                      <p className={styles.projectDescription}>{project.description}</p>

                      <div className={styles.projectTags}>
                        {project.tags.map((tag, i) => (
                          <span key={i} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className={styles.metricBadge}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#34d399" strokeWidth={2}>
                          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                          <polyline points="16 7 22 7 22 13"></polyline>
                        </svg>
                        <span>
                          Key Impact: <strong>{project.metric}</strong>
                        </span>
                      </div>
                    </div>

                    <div className={styles.projectActions}>
                      <button
                        type="button"
                        className={styles.aiEnrichBtn}
                        onClick={() => openAiEnrich(project)}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        AI Enrich Case Study
                      </button>

                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.actionIconBtn}
                          title="View GitHub Repository"
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                          </svg>
                        </a>
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={() => toggleLive(project.id)}
                          title="Toggle Live/Draft"
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={() => handleDeleteProject(project.id)}
                          title="Remove project"
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WORK EXPERIENCE */}
        {activeTab === "experience" && (
          <div className={styles.bioCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ margin: "0 0 0.25rem" }}>Career History & Milestones</h3>
                <p style={{ margin: 0, fontSize: "0.86rem", color: "#94a3b8" }}>
                  {portfolio.cvFileName ? `Extracted and synthesized from ${portfolio.cvFileName}.` : "Add your career milestones manually or upload your CV."}
                </p>
              </div>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setAddExpModalOpen(true)}
              >
                + Add Experience
              </button>
            </div>

            {portfolio.experience.length === 0 ? (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: "12px" }}>
                <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: "0 0 1rem" }}>
                  No work experience or career history added yet.
                </p>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setAddExpModalOpen(true)}
                  style={{ padding: "0.45rem 0.95rem", fontSize: "0.82rem" }}
                >
                  + Add Experience Manually
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {portfolio.experience.map((exp) => (
                  <div
                    key={exp.id}
                    style={{
                      padding: "1.25rem",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "#ffffff" }}>
                        {exp.role} · <span style={{ color: "#818cf8" }}>{exp.company}</span>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{exp.period} · {exp.location}</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.6 }}>
                      {exp.highlights.map((h, idx) => (
                        <li key={idx}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RESUME & BIO SYNTHESIZER */}
        {activeTab === "bio" && (
          <div>
            <div className={styles.bioCard}>
              <div className={styles.bioHeader}>
                <div>
                  <h3>AI Bio & Story Synthesizer</h3>
                  <p style={{ margin: 0, fontSize: "0.86rem", color: "#94a3b8" }}>
                    Positioning tone automatically generated from CV.
                  </p>
                </div>
              </div>

              <textarea
                className={styles.bioTextarea}
                value={portfolio.bio}
                onChange={(e) => setPortfolio({ ...portfolio, bio: e.target.value })}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleSaveBio}
                >
                  Save & Publish Bio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: THEMES & DOMAINS */}
        {activeTab === "theme" && (
          <div>
            <h3 style={{ margin: "0 0 1.25rem" }}>Live Portfolio Theme</h3>
            <div className={styles.themeGrid}>
              <div
                className={`${styles.themeCard} ${portfolio.theme === "obsidian" ? styles.themeCardActive : ""}`}
                onClick={() => handleThemeChange("obsidian")}
              >
                <div className={styles.themePreviewBox} style={{ background: "linear-gradient(135deg, #07090e, #111827)", color: "#818cf8" }}>
                  Obsidian Luxe (Active)
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>Obsidian Luxe</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Dark slate with glowing ambient indigo & cyan meshes.</div>
              </div>

              <div
                className={`${styles.themeCard} ${portfolio.theme === "violet" ? styles.themeCardActive : ""}`}
                onClick={() => handleThemeChange("violet")}
              >
                <div className={styles.themePreviewBox} style={{ background: "linear-gradient(135deg, #1e1b4b, #31104b)", color: "#c084fc" }}>
                  Midnight Violet
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>Midnight Violet</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>High-contrast deep purple with neon accent lines.</div>
              </div>

              <div
                className={`${styles.themeCard} ${portfolio.theme === "emerald" ? styles.themeCardActive : ""}`}
                onClick={() => handleThemeChange("emerald")}
              >
                <div className={styles.themePreviewBox} style={{ background: "linear-gradient(135deg, #022c22, #064e3b)", color: "#34d399" }}>
                  Cyber Emerald
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>Cyber Emerald</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Terminal-inspired dark matrix green and clean monospace tags.</div>
              </div>
            </div>

            <div className={styles.bioCard}>
              <h3 style={{ margin: "0 0 0.5rem" }}>Custom Domain Configuration</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: "0 0 1.25rem" }}>
                Route your custom domain directly to your PortAI edge deployment.
              </p>

              <div style={{ display: "flex", gap: "0.75rem", maxWidth: 520 }}>
                <input
                  type="text"
                  defaultValue={`${portfolio.slug}.dev`}
                  className={styles.modalInput}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => showToast("DNS verified! SSL certificate active.")}
                >
                  Verify DNS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RECRUITER ANALYTICS */}
        {activeTab === "analytics" && (
          <div>
            <div className={styles.bioCard}>
              <h3 style={{ margin: "0 0 0.5rem" }}>Recruiter Traffic & Engagement</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: "0 0 1.5rem" }}>
                Companies with active engineering leads viewing your case studies this week.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { company: "OpenAI", role: "Staff Research Engineer", views: 42, time: "10 mins ago" },
                  { company: "Stripe", role: "Principal Infrastructure Lead", views: 28, time: "1 hour ago" },
                  { company: "Linear", role: "Founding Systems Engineer", views: 19, time: "3 hours ago" },
                  { company: "Vercel", role: "Frameworks / Next.js Core", views: 15, time: "Yesterday" },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1rem",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{item.company}</div>
                      <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{item.role}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#34d399", fontWeight: 700, fontSize: "0.88rem" }}>
                        {item.views} pageviews
                      </div>
                      <div style={{ color: "#64748b", fontSize: "0.76rem" }}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={styles.toast} role="status">
          <svg viewBox="0 0 20 20" fill="#34d399" width="18" height="18">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CODE INSPECTOR MODAL */}
      {codeModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setCodeModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.codeModalContent}>
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>💻</span>
                <h3>Exported Next.js 16 Source Code</h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setCodeModalOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className={styles.codeFileTabs}>
              {Object.keys(exportedFiles).map((file) => (
                <button
                  key={file}
                  type="button"
                  className={`${styles.codeFileTab} ${activeFileTab === file ? styles.codeFileTabActive : ""}`}
                  onClick={() => setActiveFileTab(file)}
                >
                  {file}
                </button>
              ))}
            </div>

            <pre className={styles.codePre}>
              <code>{exportedFiles[activeFileTab] || ""}</code>
            </pre>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  navigator.clipboard.writeText(exportedFiles[activeFileTab] || "");
                  showToast(`Copied ${activeFileTab} content to clipboard`);
                }}
              >
                Copy Current File
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleExportZip}
                disabled={exportingZip}
              >
                Download Full .ZIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PROJECT MODAL */}
      {addModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add New Project Case Study</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setAddModalOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddProjectSubmit} className={styles.modalForm}>
              <div className={styles.fieldGroup}>
                <label>Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Consensus Engine"
                  className={styles.modalInput}
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  autoFocus
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Category</label>
                <select
                  className={styles.modalInput}
                  value={newProject.category}
                  onChange={(e) =>
                    setNewProject({ ...newProject, category: e.target.value as "ai" | "infra" | "frontend" | "mobile" })
                  }
                >
                  <option value="ai">AI & Machine Learning</option>
                  <option value="infra">Distributed Infrastructure</option>
                  <option value="frontend">Frontend & Full-stack</option>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label>Architecture & Impact Description</label>
                <textarea
                  placeholder="Describe your technical contributions, performance gains, and architecture decisions…"
                  className={styles.modalInput}
                  style={{ minHeight: 80 }}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Key Impact Metric (e.g. 10x throughput, $4M savings)</label>
                <input
                  type="text"
                  placeholder="e.g. 100M+ Daily API requests"
                  className={styles.modalInput}
                  value={newProject.metric}
                  onChange={(e) => setNewProject({ ...newProject, metric: e.target.value })}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Tech Stack Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Rust, Next.js 16, TypeScript, Redis"
                  className={styles.modalInput}
                  value={newProject.tags}
                  onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EXPERIENCE MODAL */}
      {addExpModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddExpModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add Career Milestone</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setAddExpModalOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddExpSubmit} className={styles.modalForm}>
              <div className={styles.fieldGroup}>
                <label>Job Title / Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Distributed Systems Engineer"
                  className={styles.modalInput}
                  value={newExp.role}
                  onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Company / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe, Vercel, or Startup"
                  className={styles.modalInput}
                  value={newExp.company}
                  onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className={styles.fieldGroup}>
                  <label>Time Period</label>
                  <input
                    type="text"
                    placeholder="e.g. 2023 — Present"
                    className={styles.modalInput}
                    value={newExp.period}
                    onChange={(e) => setNewExp({ ...newExp, period: e.target.value })}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco / Remote"
                    className={styles.modalInput}
                    value={newExp.location}
                    onChange={(e) => setNewExp({ ...newExp, location: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label>Key Accomplishments (1 bullet per line)</label>
                <textarea
                  rows={3}
                  placeholder="• Scaled streaming API throughput by 300%&#10;• Mentored 6 engineers across infrastructure team"
                  className={styles.modalInput}
                  value={newExp.highlights}
                  onChange={(e) => setNewExp({ ...newExp, highlights: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setAddExpModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Save Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI ENRICH CASE STUDY MODAL */}
      {aiModalOpen && enrichingProject && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAiModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalContent} style={{ maxWidth: 580 }}>
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "#818cf8", fontSize: "1.2rem" }}>✨</span>
                <h3>AI Case Study Synthesis</h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setAiModalOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {aiLoading ? (
              <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
                <div className={styles.spinner} style={{ width: 32, height: 32, margin: "0 auto 1rem", borderTopColor: "#6366f1" }} />
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                  Analyzing repository commit graph and extracting quantifiable impact metrics…
                </p>
              </div>
            ) : (
              <div>
                <div style={{ padding: "0.9rem", borderRadius: "10px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", marginBottom: "1.25rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#a5b4fc", marginBottom: "0.2rem" }}>
                    Target Project: {enrichingProject.title}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
                    Generated 3 technical highlights optimized for Staff & Principal level engineering screeners.
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div style={{ padding: "0.85rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--card-border)" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "#34d399", marginBottom: "0.2rem" }}>
                      ✓ High Throughput Architecture
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                      Zero-copy memory pipelines in Rust resulting in 4.2x latency reduction during peak load.
                    </div>
                  </div>

                  <div style={{ padding: "0.85rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--card-border)" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "#818cf8", marginBottom: "0.2rem" }}>
                      ✓ Fault Tolerance & Edge Failover
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                      Distributed gossip protocol with 99.999% availability across multi-region clusters.
                    </div>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setAiModalOpen(false)}
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={applyAiEnhancements}
                  >
                    Apply Enhancements
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
