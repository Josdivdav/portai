"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import styles from "./portfolio.module.css";
import { DEFAULT_PORTFOLIO, SAMPLE_CVS, PortfolioData } from "../../lib/portfolio-data";
import { exportPortfolioZip } from "../../lib/export-code";

export default function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [data, setData] = useState<PortfolioData | null>(() => {
    if (slug === "jordan-lee") return SAMPLE_CVS.fullstack;
    if (slug === "alex-rivera") return DEFAULT_PORTFOLIO;
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return slug !== "jordan-lee" && slug !== "alex-rivera";
  });
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPortfolio() {
      try {
        const res = await fetch(`/api/portfolio?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.portfolio && isMounted) {
            setData(json.portfolio);
            setNotFound(false);
          }
        } else if (res.status === 404) {
          if (isMounted) setNotFound(true);
        }
      } catch (err) {
        console.warn("Could not load published portfolio:", err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPortfolio();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleExportZip() {
    setExporting(true);
    try {
      const blob = await exportPortfolioZip(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.slug}-portfolio-source.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export ZIP");
    } finally {
      setExporting(false);
    }
  }

  function handleCopy() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", background: "#07090e" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: "#94a3b8", fontSize: "0.88rem" }}>Loading portfolio…</span>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", background: "#07090e", color: "#f8fafc", padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
        <div style={{ maxWidth: 460, width: "100%", padding: "2.5rem 2rem", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
          <div style={{ width: 50, height: 50, borderRadius: "12px", background: "rgba(99,102,241,0.15)", color: "#818cf8", display: "grid", placeItems: "center", margin: "0 auto 1.25rem", fontSize: "1.4rem" }}>
            🌐
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 0.6rem", color: "#ffffff" }}>Portfolio Not Published Yet</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6, margin: "0 0 1.75rem" }}>
            The portfolio at <code style={{ color: "#a5b4fc", background: "rgba(99,102,241,0.12)", padding: "0.2rem 0.45rem", borderRadius: 6 }}>/p/{slug}</code> has not been deployed yet.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <Link
              href="/dashboard"
              style={{ padding: "0.6rem 1.25rem", borderRadius: "10px", background: "#6366f1", color: "#ffffff", fontWeight: 700, textDecoration: "none", fontSize: "0.88rem" }}
            >
              Open Dashboard
            </Link>
            <Link
              href="/"
              style={{ padding: "0.6rem 1.25rem", borderRadius: "10px", background: "rgba(255,255,255,0.08)", color: "#ffffff", fontWeight: 600, textDecoration: "none", fontSize: "0.88rem" }}
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.portfolioWrapper}>
      {/* Top PortAI Banner */}
      <header className={styles.topBanner}>
        <Link href="/" className={styles.bannerBrand}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "#4f46e5",
              display: "grid",
              placeItems: "center",
              fontSize: "0.75rem",
              color: "#ffffff",
              fontWeight: 800,
            }}
          >
            P
          </span>
          <span>
            Generated from {data.cvFileName || "CV"} with <strong>PortAI</strong>
          </span>
        </Link>

        <div className={styles.bannerActions}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportZip}
            disabled={exporting}
          >
            {exporting ? (
              "Exporting…"
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export Source Code (.zip)
              </>
            )}
          </button>

          <Link
            href="/dashboard"
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#cbd5e1",
              textDecoration: "none",
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              background: "#1e293b",
              border: "1px solid #334155",
            }}
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className={styles.container}>
        {/* Hero Section */}
        <section>
          <div className={styles.heroBadge}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
            {data.location} · Verified Portfolio
          </div>

          <div className={styles.heroName}>{data.fullName}</div>
          <h1 className={styles.heroTitle}>{data.title}</h1>
          <p className={styles.heroBio}>{data.bio}</p>

          <div className={styles.socialRow}>
            {data.github && (
              <a href={data.github} target="_blank" rel="noreferrer" className={styles.socialPill}>
                GitHub ↗
              </a>
            )}
            {data.linkedin && (
              <a href={data.linkedin} target="_blank" rel="noreferrer" className={styles.socialPill}>
                LinkedIn ↗
              </a>
            )}
            <a
              href={`mailto:${data.email}`}
              className={styles.socialPill}
              style={{ background: "#4f46e5", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#ffffff", fontWeight: 700 }}
            >
              Get in Touch
            </a>
          </div>

          {/* Metrics Grid */}
          <div className={styles.metricsGrid}>
            {data.metrics.map((m, i) => (
              <div key={i} className={styles.metricCard}>
                <div className={styles.metricVal}>{m.value}</div>
                <div className={styles.metricLbl}>{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Projects */}
        <section className={styles.section} id="projects">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Projects & Case Studies</h2>
            <p className={styles.sectionSubtitle}>
              Synthesized from repository analysis and CV technical highlights.
            </p>
          </div>

          <div className={styles.projectsGrid}>
            {data.projects.map((project) => (
              <article key={project.id} className={styles.projectCard}>
                <div>
                  <h3 className={styles.projectTitle}>{project.title}</h3>
                  <p className={styles.projectDesc}>{project.description}</p>
                  <div className={styles.tags}>
                    {project.tags.map((tag, idx) => (
                      <span key={idx} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.85rem", borderTop: "1px solid var(--border)" }}>
                  <span className={styles.impactBadge}>⚡ {project.metric}</span>
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.82rem", fontWeight: 600, color: "#60a5fa", textDecoration: "none" }}
                  >
                    View Code ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Experience Timeline */}
        <section className={styles.section} id="experience">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Work Experience</h2>
            <p className={styles.sectionSubtitle}>Career trajectory and technical impact milestones.</p>
          </div>

          <div className={styles.experienceList}>
            {data.experience.map((exp) => (
              <div key={exp.id} className={styles.experienceItem}>
                <div className={styles.expHeader}>
                  <h3 className={styles.expRole}>
                    {exp.role} · <span className={styles.expCompany}>{exp.company}</span>
                  </h3>
                  <span className={styles.expPeriod}>
                    {exp.period} · {exp.location}
                  </span>
                </div>
                <ul className={styles.expHighlights}>
                  {exp.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Skills Grid */}
        <section className={styles.section} id="skills">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Technical Skills & Core Tooling</h2>
            <p className={styles.sectionSubtitle}>
              Categorized technologies extracted from hands-on production experience.
            </p>
          </div>

          <div className={styles.skillsGrid}>
            {data.skills.map((skillGroup, i) => (
              <div key={i} className={styles.skillBox}>
                <div className={styles.skillCat}>{skillGroup.category}</div>
                <div className={styles.skillPills}>
                  {skillGroup.items.map((skill, idx) => (
                    <span key={idx} className={styles.skillPill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Action Dock */}
      <div className={styles.floatingDock}>
        <button type="button" className={styles.dockBtn} onClick={handleCopy}>
          {copied ? "✓ Copied Link" : "Copy Link"}
        </button>
        <button
          type="button"
          className={`${styles.dockBtn} ${styles.dockBtnPrimary}`}
          onClick={handleExportZip}
          disabled={exporting}
        >
          {exporting ? "Exporting…" : "Export Next.js Source (.zip)"}
        </button>
        <Link href="/signup" className={styles.dockBtn}>
          Build with PortAI ↗
        </Link>
      </div>
    </div>
  );
}
