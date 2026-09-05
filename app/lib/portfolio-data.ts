export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  metric: string;
  repoUrl: string;
  liveUrl?: string;
  isLive: boolean;
  category: "ai" | "infra" | "frontend" | "mobile";
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  highlights: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
}

export interface PortfolioData {
  slug: string;
  fullName: string;
  title: string;
  tagline: string;
  bio: string;
  email: string;
  github: string;
  linkedin: string;
  twitter?: string;
  location: string;
  theme: "obsidian" | "violet" | "emerald" | "minimal";
  metrics: {
    label: string;
    value: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  cvFileName?: string;
  lastParsedAt?: string;
}

export const DEFAULT_PORTFOLIO: PortfolioData = {
  slug: "alex-rivera",
  fullName: "Alex Rivera",
  title: "Staff AI Systems Engineer",
  tagline: "Architecting autonomous agent execution runtimes & high-throughput vector search infrastructure.",
  bio: "Staff AI Systems Engineer with 8+ years building distributed execution engines, high-dimensional vector search pipelines, and developer tooling. Previously scaled core infrastructure at scale-ups from 0 to 10M+ daily active requests with sub-second latency.",
  email: "alex.rivera@portai.dev",
  github: "https://github.com/alexrivera",
  linkedin: "https://linkedin.com/in/alexrivera-ai",
  twitter: "https://x.com/alexrivera_dev",
  location: "San Francisco, CA",
  theme: "obsidian",
  cvFileName: "Alex_Rivera_Staff_Engineer_CV.pdf",
  lastParsedAt: "Just now",
  metrics: [
    { label: "Daily Agent Steps", value: "100M+" },
    { label: "Vector Query Latency", value: "<25ms" },
    { label: "Years Experience", value: "8+ Yrs" },
    { label: "Open Source Stars", value: "4.8k★" },
  ],
  skills: [
    {
      category: "Languages & Runtimes",
      items: ["Rust", "TypeScript", "Python", "Go", "WebAssembly", "Node.js"],
    },
    {
      category: "Frameworks & UI",
      items: ["Next.js 16", "React 19", "Turbopack", "Tailwind CSS", "GraphQL"],
    },
    {
      category: "AI & Distributed Systems",
      items: ["PyTorch", "Vector Embeddings", "Qdrant", "Redis", "Kafka", "Docker", "Kubernetes"],
    },
  ],
  projects: [
    {
      id: "proj-1",
      title: "Autonomous Agent Execution Runtime",
      description:
        "Engineered a multi-tenant agent execution pipeline processing 100M+ steps daily with sub-second feedback loops and isolated memory sandboxes.",
      tags: ["Rust", "WebAssembly", "TypeScript", "Next.js 16"],
      metric: "100M+ daily agent steps",
      repoUrl: "https://github.com/alexrivera/agent-runtime",
      liveUrl: "https://agent-runtime.dev",
      isLive: true,
      category: "ai",
    },
    {
      id: "proj-2",
      title: "Distributed Vector Search Engine",
      description:
        "High-throughput indexing pipeline integrating high-dimensional vector embeddings with relational graph queries and sub-25ms latency.",
      tags: ["Python", "PyTorch", "Qdrant", "Rust Core"],
      metric: "1.2B vectors queried in <25ms",
      repoUrl: "https://github.com/alexrivera/vector-graph",
      liveUrl: "https://vector-graph.dev",
      isLive: true,
      category: "ai",
    },
    {
      id: "proj-3",
      title: "Real-time Edge Analytics Platform",
      description:
        "Edge-native analytics platform supporting real-time streaming queries, multi-region caching, and zero cold starts.",
      tags: ["React 19", "Turbopack", "Server Actions", "Redis"],
      metric: "Sub-10ms edge cache resolution",
      repoUrl: "https://github.com/alexrivera/edge-analytics",
      isLive: true,
      category: "infra",
    },
    {
      id: "proj-4",
      title: "Design System & Component Engine",
      description:
        "Enterprise design tokens architecture and headless component system adopted by 40+ engineers across 12 product squads.",
      tags: ["TypeScript", "Tailwind CSS", "Figma API", "Radix"],
      metric: "10x component adoption velocity",
      repoUrl: "https://github.com/alexrivera/design-engine",
      isLive: true,
      category: "frontend",
    },
  ],
  experience: [
    {
      id: "exp-1",
      role: "Staff Infrastructure & AI Engineer",
      company: "Aether AI Platforms",
      period: "2023 — Present",
      location: "San Francisco, CA",
      highlights: [
        "Led architecture for multi-tenant agent runtime processing 100M+ daily steps with 99.999% uptime.",
        "Engineered custom Rust WebAssembly sandboxes reducing cold-start compute latency by 72%.",
        "Mentored a distributed team of 14 engineers across systems and platform squads.",
      ],
    },
    {
      id: "exp-2",
      role: "Senior Distributed Systems Engineer",
      company: "Nexus Data Labs",
      period: "2020 — 2023",
      location: "Remote / New York",
      highlights: [
        "Designed vector embedding search cluster querying 1.2B high-dimensional embeddings with <25ms p99.",
        "Migrated monolithic analytics backend to event-driven Kafka and Redis stream pipelines.",
      ],
    },
  ],
  education: [
    {
      degree: "B.S. in Computer Science & Artificial Intelligence",
      institution: "University of California, Berkeley",
      year: "2016 — 2020",
    },
  ],
};

export const SAMPLE_CVS: Record<string, PortfolioData> = {
  ai_staff: DEFAULT_PORTFOLIO,
  fullstack: {
    slug: "jordan-lee",
    fullName: "Jordan Lee",
    title: "Senior Full-Stack & Frontend Architect",
    tagline: "Building high-performance design systems, real-time web applications, and developer tools.",
    bio: "Full-stack developer with 6+ years specializing in Next.js, TypeScript, React 19, and GraphQL. Created open-source libraries with 12k+ GitHub stars and engineered web platforms serving 5M+ monthly users.",
    email: "jordan.lee@portai.dev",
    github: "https://github.com/jordanlee",
    linkedin: "https://linkedin.com/in/jordanlee-dev",
    location: "Austin, TX",
    theme: "emerald",
    cvFileName: "Jordan_Lee_Fullstack_Architect.pdf",
    lastParsedAt: "Just now",
    metrics: [
      { label: "Monthly Active Users", value: "5M+" },
      { label: "Lighthouse Score", value: "100/100" },
      { label: "Years Experience", value: "6+ Yrs" },
      { label: "NPM Downloads", value: "2.4M/mo" },
    ],
    skills: [
      {
        category: "Frontend & UI",
        items: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS", "Framer Motion"],
      },
      {
        category: "Backend & Cloud",
        items: ["Node.js", "PostgreSQL", "Prisma", "Supabase", "AWS Lambda", "Redis"],
      },
    ],
    projects: [
      {
        id: "proj-fs-1",
        title: "Collaborative Canvas Engine",
        description: "Real-time infinite canvas architecture with CRDT synchronization and sub-16ms multiplayer rendering.",
        tags: ["TypeScript", "WebSockets", "React 19", "WebGPU"],
        metric: "Sub-16ms 60fps multiplayer rendering",
        repoUrl: "https://github.com/jordanlee/canvas-engine",
        isLive: true,
        category: "frontend",
      },
      {
        id: "proj-fs-2",
        title: "Headless Commerce Platform",
        description: "High-speed storefront architecture delivering 100/100 Lighthouse performance with edge SSR.",
        tags: ["Next.js 16", "Tailwind CSS", "Stripe", "GraphQL"],
        metric: "100/100 Lighthouse Performance",
        repoUrl: "https://github.com/jordanlee/commerce-engine",
        isLive: true,
        category: "frontend",
      },
    ],
    experience: [
      {
        id: "exp-fs-1",
        role: "Senior Frontend Architect",
        company: "Veloce Technologies",
        period: "2021 — Present",
        location: "Austin, TX",
        highlights: [
          "Re-architected core web application into Next.js App Router, boosting organic search traffic by 340%.",
          "Built design tokens pipeline bridging Figma variables to Tailwind CSS utility classes.",
        ],
      },
    ],
    education: [
      {
        degree: "B.S. in Software Engineering",
        institution: "University of Texas at Austin",
        year: "2017 — 2021",
      },
    ],
  },
};

export function createEmptyPortfolio(name = "", email = ""): PortfolioData {
  const safeSlug = (name || "my-portfolio")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    slug: safeSlug || "my-portfolio",
    fullName: name || "Developer",
    title: "",
    tagline: "",
    bio: "",
    email: email || "",
    github: "",
    linkedin: "",
    twitter: "",
    location: "",
    theme: "obsidian",
    metrics: [],
    skills: [],
    projects: [],
    experience: [],
    education: [],
    cvFileName: undefined,
    lastParsedAt: undefined,
  };
}

export function parseCvToPortfolio(fileName: string, name?: string, email?: string): PortfolioData {
  const cleanBase = fileName.replace(/\.[^/.]+$/, "").replace(/[-_](cv|resume)/i, "");
  let resolvedName = name?.trim();
  if (!resolvedName || resolvedName === "User" || resolvedName === "Developer") {
    if (cleanBase && !cleanBase.toLowerCase().includes("resume") && !cleanBase.toLowerCase().includes("cv")) {
      const parts = cleanBase.split(/[-_\s]+/).map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      if (parts.length >= 2) resolvedName = parts.join(" ");
    }
  }
  if (!resolvedName) resolvedName = "Developer";
  const safeSlug = resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return {
    slug: safeSlug || "portfolio",
    fullName: resolvedName,
    title: "Software Systems Engineer",
    tagline: "Building high-performance distributed systems & resilient web architecture.",
    bio: `Software Engineer specializing in modern web architecture, scalable backend services, and developer tooling. Extracted and parsed from ${fileName}.`,
    email: email || "",
    github: `https://github.com/${safeSlug}`,
    linkedin: `https://linkedin.com/in/${safeSlug}`,
    location: "Remote / San Francisco",
    theme: "obsidian",
    cvFileName: fileName,
    lastParsedAt: "Just now",
    metrics: [
      { label: "Production Uptime", value: "99.9%" },
      { label: "Test Coverage", value: ">92%" },
      { label: "Engineering Impact", value: "High" },
      { label: "Lighthouse Score", value: "98/100" },
    ],
    skills: [
      {
        category: "Core Stack",
        items: ["TypeScript", "Next.js", "React", "Node.js", "Tailwind CSS"],
      },
      {
        category: "Cloud & Infrastructure",
        items: ["Docker", "PostgreSQL", "Redis", "CI/CD", "AWS"],
      },
    ],
    projects: [
      {
        id: `proj-${Date.now()}-1`,
        title: "Fullstack Architecture Platform",
        description: `Extracted from ${fileName}: Scalable web architecture with optimized client-side state and edge caching.`,
        tags: ["Next.js", "TypeScript", "Tailwind CSS"],
        metric: "Sub-second response latency",
        repoUrl: `https://github.com/${safeSlug}/web-platform`,
        isLive: true,
        category: "frontend",
      },
      {
        id: `proj-${Date.now()}-2`,
        title: "Distributed Data Engine",
        description: `Extracted from ${fileName}: High-throughput background processing service with concurrent task workers.`,
        tags: ["Node.js", "PostgreSQL", "Docker", "Redis"],
        metric: "10k+ events processed/sec",
        repoUrl: `https://github.com/${safeSlug}/data-engine`,
        isLive: true,
        category: "infra",
      },
    ],
    experience: [
      {
        id: `exp-${Date.now()}-1`,
        role: "Software Engineer",
        company: "Tech Systems",
        period: "2022 — Present",
        location: "Remote",
        highlights: [
          `Extracted from ${fileName}: Led key feature development and increased deployment velocity.`,
          "Implemented test suites and maintained production infrastructure reliability.",
        ],
      },
    ],
    education: [
      {
        degree: "B.S. in Computer Science",
        institution: "University",
        year: "Recent",
      },
    ],
  };
}
