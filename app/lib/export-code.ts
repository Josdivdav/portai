import JSZip from "jszip";
import { PortfolioData } from "./portfolio-data";

export function generatePortfolioFiles(data: PortfolioData): Record<string, string> {
  const safeTitle = data.fullName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  const packageJson = JSON.stringify(
    {
      name: `${safeTitle}-portfolio`,
      version: "1.0.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "eslint",
      },
      dependencies: {
        next: "16.3.4",
        react: "19.2.8",
        "react-dom": "19.2.8",
        "lucide-react": "^1.16.0",
      },
      devDependencies: {
        "@tailwindcss/postcss": "^4",
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        tailwindcss: "^4",
        typescript: "^5",
      },
    },
    null,
    2
  );

  const readmeMd = `# ${data.fullName} — Personal Portfolio

Generated with **PortAI** (AI Portfolio Engine from CV/Resume).

## 🚀 Quick Start

1. Install dependencies:
\`\`\`bash
npm install
# or pnpm install / yarn
\`\`\`

2. Run development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view your live portfolio.

## 🌐 Deploying to Production

### Deploy with Vercel (Recommended)
\`\`\`bash
npx vercel
\`\`\`

### Deploy with Netlify
\`\`\`bash
npx netlify deploy --prod
\`\`\`

---
*Built & Exported with [PortAI](https://portai.me)*
`;

  const pageTsx = `"use client";

import Link from "next/link";

const PORTFOLIO_DATA = ${JSON.stringify(data, null, 2)};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-[#0c111c] border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-lg tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {PORTFOLIO_DATA.fullName.charAt(0)}
            </span>
            <span>{PORTFOLIO_DATA.fullName}</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#projects" className="hover:text-white transition-colors">Projects</a>
            <a href="#experience" className="hover:text-white transition-colors">Experience</a>
            <a href="#skills" className="hover:text-white transition-colors">Skills</a>
            <a
              href="mailto:${data.email}"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
            >
              Get in Touch
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {PORTFOLIO_DATA.location} · Open to Select Opportunities
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white mb-6">
          {PORTFOLIO_DATA.title}
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-3xl leading-relaxed mb-8">
          {PORTFOLIO_DATA.bio}
        </p>

        {/* Social Links */}
        <div className="flex items-center gap-4 flex-wrap mb-14">
          {PORTFOLIO_DATA.github && (
            <a
              href={PORTFOLIO_DATA.github}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-medium text-sm transition-all"
            >
              GitHub ↗
            </a>
          )}
          {PORTFOLIO_DATA.linkedin && (
            <a
              href={PORTFOLIO_DATA.linkedin}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-medium text-sm transition-all"
            >
              LinkedIn ↗
            </a>
          )}
          <a
            href="mailto:${data.email}"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25"
          >
            Email Me
          </a>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {PORTFOLIO_DATA.metrics.map((m, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black text-white mb-1">{m.value}</div>
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section id="projects" className="max-w-5xl mx-auto px-6 py-16 border-t border-white/10">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Featured Projects & Case Studies</h2>
        <p className="text-slate-400 mb-8 text-sm">Deep-dive technical architectures and measurable impact.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PORTFOLIO_DATA.projects.map((project) => (
            <div key={project.id} className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 transition-all flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag, i) => (
                    <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">⚡ {project.metric}</span>
                <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                  Repository ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="max-w-5xl mx-auto px-6 py-16 border-t border-white/10">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Experience & Career History</h2>
        <p className="text-slate-400 mb-8 text-sm">Engineering leadership and infrastructure contributions.</p>

        <div className="space-y-6">
          {PORTFOLIO_DATA.experience.map((exp) => (
            <div key={exp.id} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                <h3 className="text-lg font-bold text-white">{exp.role} · <span className="text-indigo-400">{exp.company}</span></h3>
                <span className="text-xs font-semibold text-slate-400">{exp.period} · {exp.location}</span>
              </div>
              <ul className="space-y-2 mt-3">
                {exp.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-indigo-400 mt-1">▹</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="max-w-5xl mx-auto px-6 py-16 border-t border-white/10">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-6">Technical Skills & Tooling</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PORTFOLIO_DATA.skills.map((skillGroup, idx) => (
            <div key={idx} className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-3">{skillGroup.category}</h3>
              <div className="flex flex-wrap gap-2">
                {skillGroup.items.map((item, i) => (
                  <span key={i} className="text-xs font-medium px-2.5 py-1 rounded bg-white/5 text-slate-200 border border-white/10">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/10 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {PORTFOLIO_DATA.fullName}. Generated & Exported with PortAI.
      </footer>
    </div>
  );
}
`;

  const layoutTsx = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${data.fullName} — ${data.title}",
  description: "${data.tagline.replace(/"/g, '\\"')}",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
`;

  const globalsCss = `@import "tailwindcss";

:root {
  --background: #07090e;
  --foreground: #f8fafc;
}

body {
  background: var(--background);
  color: var(--foreground);
}
`;

  return {
    "package.json": packageJson,
    "README.md": readmeMd,
    "app/page.tsx": pageTsx,
    "app/layout.tsx": layoutTsx,
    "app/globals.css": globalsCss,
    "data/portfolio.json": JSON.stringify(data, null, 2),
  };
}

export async function exportPortfolioZip(data: PortfolioData): Promise<Blob> {
  const zip = new JSZip();
  const files = generatePortfolioFiles(data);

  for (const [filename, content] of Object.entries(files)) {
    zip.file(filename, content);
  }

  return await zip.generateAsync({ type: "blob" });
}
