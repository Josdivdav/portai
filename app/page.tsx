import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[550px] h-[550px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 font-extrabold text-xl tracking-tight">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 font-black">
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
          <span className="text-white">PortAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-4 py-2 rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
          >
            Create Your Portfolio Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto py-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          CV / Resume ➔ Live Portfolio + Full Source Export
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1] mb-6">
          Upload your CV. Get a <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">live portfolio & exported Next.js code</span> in minutes.
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
          Drop in your resume. PortAI automatically synthesizes high-impact case studies, provisions a hosted live link (<code className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-sm font-mono">portai.me/p/your-name</code>), and lets you download 100% of the Next.js source code.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center mb-16">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-xl shadow-indigo-600/30 hover:-translate-y-0.5 transition-all text-base"
          >
            Upload CV & Generate Portfolio ➔
          </Link>
          <Link
            href="/p/alex-rivera"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-all text-base backdrop-blur-md"
          >
            View Live Sample Portfolio ↗
          </Link>
        </div>

        {/* 3 Step Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-black mb-4">
              1
            </div>
            <h3 className="font-bold text-white text-base mb-2">Upload Resume or CV</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accepts PDF, DOCX, or text. AI parses work history, technical skills, and quantifiable achievements.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-black mb-4">
              2
            </div>
            <h3 className="font-bold text-white text-base mb-2">Hosted Live Link</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant hosted URL (<code className="text-cyan-400 font-mono">portai.me/p/name</code>) ready to send to recruiters and hiring managers.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-black mb-4">
              3
            </div>
            <h3 className="font-bold text-white text-base mb-2">Export Next.js Source (.zip)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full code ownership. Download complete Next.js 16 + Tailwind CSS project to deploy on Vercel or Netlify.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-white/10 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PortAI. Built for engineers, designers, and creators worldwide.
      </footer>
    </div>
  );
}
