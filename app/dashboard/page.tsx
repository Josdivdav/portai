"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { DEFAULT_PORTFOLIO, SAMPLE_CVS, PortfolioData, ProjectItem } from "../lib/portfolio-data";
import { exportPortfolioZip, generatePortfolioFiles } from "../lib/export-code";

export default function DashboardPage() {
  const router = useRouter();

  // Core portfolio state from CV
  const [portfolio, setPortfolio] = useState<PortfolioData>(DEFAULT_PORTFOLIO);
  const [activeTab, setActiveTab] = useState<"projects" | "experience" | "bio" | "theme" | "analytics">("projects");

  // Navigation & session state
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

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    tags: "",
    metric: "",
    category: "ai" as "ai" | "infra" | "frontend" | "mobile",
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

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  async function handleDeploy() {
    setDeploying(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setDeploying(false);
    showToast(`✨ Portfolio deployed live to portai.me/p/${portfolio.slug} in 1.1s!`);
  }

  function handleCopyLink() {
    const liveUrl = `${window.location.origin}/p/${portfolio.slug}`;
    navigator.clipboard.writeText(liveUrl);
    showToast(`📋 Copied live portfolio link: ${liveUrl}`);
  }

  // Handle CV Upload & AI parsing simulation
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

    setPortfolio((prev) => ({
      ...prev,
      cvFileName: fileName,
      lastParsedAt: "Just now",
    }));

    setIsParsingCv(false);
    showToast(`✨ Successfully parsed "${fileName}" and generated live portfolio!`);
  }

  function loadSamplePreset(presetKey: "ai_staff" | "fullstack") {
    setIsParsingCv(true);
    setParseStage("Loading sample CV profile and synthesizing portfolio…");
    setTimeout(() => {
      const selected = SAMPLE_CVS[presetKey] || DEFAULT_PORTFOLIO;
      setPortfolio(selected);
      setIsParsingCv(false);
      showToast(`Loaded ${selected.fullName}'s CV portfolio preset`);
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

  function toggleLive(id: string) {
    setPortfolio((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, isLive: !p.isLive } : p)),
    }));
    showToast("Updated project visibility");
  }

  function handleAddProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    const created: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: newProject.title.trim(),
      description: newProject.description.trim() || "AI-generated case study and technical breakdown.",
      tags: newProject.tags
        ? newProject.tags.split(",").map((t) => t.trim())
        : ["TypeScript", "Next.js"],
      metric: newProject.metric.trim() || "High Performance & Scalable",
      isLive: true,
      repoUrl: "https://github.com/alexrivera",
      category: newProject.category,
    };

    setPortfolio((prev) => ({
      ...prev,
      projects: [created, ...prev.projects],
    }));

    setAddModalOpen(false);
    setNewProject({ title: "", description: "", tags: "", metric: "", category: "ai" });
    showToast(`Added "${created.title}" to portfolio`);
  }

  function openAiEnrich(project: ProjectItem) {
    setEnrichingProject(project);
    setAiModalOpen(true);
    setAiLoading(true);
    setTimeout(() => setAiLoading(false), 900);
  }

  const filteredProjects = portfolio.projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === "all" || p.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

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
            <span className={styles.liveBadge}>
              <span className={styles.pulseDot} />
              Live Site
            </span>
            <span>portai.me/p/{portfolio.slug}</span>
          </div>
        </div>

        <div className={styles.navRight}>
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

          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportZip}
            disabled={exportingZip}
            title="Export Next.js 16 + Tailwind source code as ZIP"
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
            disabled={deploying}
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
            <div className={styles.avatar}>{portfolio.fullName.charAt(0)}</div>
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
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.25rem 0.65rem", borderRadius: 999, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.85rem" }}>
              <span>📄</span> Active CV Source: {portfolio.cvFileName || "Resume Parsed"}
            </div>

            <h2>
              Portfolio for <span className={styles.highlightText}>{portfolio.fullName}</span>
            </h2>
            <p className={styles.cvHeroDesc}>
              Generated from your uploaded CV. Visitors can view your live case studies, work history, and you can export the full Next.js source code anytime.
            </p>

            {/* Live Portfolio URL Box */}
            <div className={styles.liveLinkBox}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                <span style={{ color: "#34d399", fontSize: "0.9rem" }}>🔗</span>
                <span className={styles.liveUrlText}>
                  https://portai.me/p/{portfolio.slug}
                </span>
              </div>
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
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={handleExportZip}
                disabled={exportingZip}
              >
                📥 Download Next.js ZIP
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleOpenCodeInspector}
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
            <div className={styles.scoreCircleLarge}>98%</div>
            <div className={styles.scoreMeta}>
              <h3>ATS & Recruiter Readiness</h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>
                High-impact quantifiable stories extracted from CV
              </p>
              <div className={styles.scoreTags}>
                <span className={styles.scoreChip}>ATS 99%</span>
                <span className={styles.scoreChip}>SEO 100%</span>
                <span className={styles.scoreChip}>Fast &lt;0.2s</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              <span>Profile Views</span>
              <span>📈</span>
            </div>
            <div className={styles.statValue}>1,420</div>
            <div className={styles.statGrowth}>+28% this week</div>
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
              Extracted from CV
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              <span>Source Code</span>
              <span>💻</span>
            </div>
            <div className={styles.statValue}>Next.js 16</div>
            <div className={styles.statGrowth}>100% Exportable</div>
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
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: WORK EXPERIENCE */}
        {activeTab === "experience" && (
          <div className={styles.bioCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ margin: "0 0 0.25rem" }}>Career History & Milestones</h3>
                <p style={{ margin: 0, fontSize: "0.86rem", color: "#94a3b8" }}>
                  Extracted and synthesized from {portfolio.cvFileName || "CV"}.
                </p>
              </div>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => showToast("Added experience slot")}
              >
                + Add Experience
              </button>
            </div>

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
                  onClick={() => showToast("Saved and published updated bio to live portfolio")}
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
                onClick={() => {
                  setPortfolio({ ...portfolio, theme: "obsidian" });
                  showToast("Switched theme to Obsidian Luxe");
                }}
              >
                <div className={styles.themePreviewBox} style={{ background: "linear-gradient(135deg, #07090e, #111827)", color: "#818cf8" }}>
                  Obsidian Luxe (Active)
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>Obsidian Luxe</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Dark slate with glowing ambient indigo & cyan meshes.</div>
              </div>

              <div
                className={`${styles.themeCard} ${portfolio.theme === "violet" ? styles.themeCardActive : ""}`}
                onClick={() => {
                  setPortfolio({ ...portfolio, theme: "violet" });
                  showToast("Switched theme to Midnight Violet");
                }}
              >
                <div className={styles.themePreviewBox} style={{ background: "linear-gradient(135deg, #1e1b4b, #31104b)", color: "#c084fc" }}>
                  Midnight Violet
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>Midnight Violet</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>High-contrast deep purple with neon accent lines.</div>
              </div>

              <div
                className={`${styles.themeCard} ${portfolio.theme === "emerald" ? styles.themeCardActive : ""}`}
                onClick={() => {
                  setPortfolio({ ...portfolio, theme: "emerald" });
                  showToast("Switched theme to Cyber Emerald");
                }}
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
                    onClick={() => {
                      setAiModalOpen(false);
                      showToast(`✨ Enriched case study applied to "${enrichingProject.title}"`);
                    }}
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
