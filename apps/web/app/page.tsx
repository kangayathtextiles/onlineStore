export default function HomePage() {
  const foundationPillars = [
    {
      title: "Backend API (FastAPI)",
      desc: "Layered architecture (API → Service → Repository → DB) with Pydantic & SQLAlchemy.",
      status: "Ready",
    },
    {
      title: "Frontend (Next.js App Router)",
      desc: "TypeScript, React 19, TailwindCSS, and feature-driven component boundaries.",
      status: "Ready",
    },
    {
      title: "Governance & Quality",
      desc: "Ruff, Mypy, Vitest, Pytest, automated GitHub CI, and strict ADR governance.",
      status: "Configured",
    },
    {
      title: "Containerization & Ops",
      desc: "Multi-stage Docker, Compose orchestration with PostgreSQL 16.",
      status: "Configured",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-16">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          PHASE 01 — FOUNDATION ESTABLISHED
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            KANGAYATH WEB
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Production-grade engineering foundation, governance framework, and scalable monorepo architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-4">
          {foundationPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-slate-100">{pillar.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {pillar.status}
                </span>
              </div>
              <p className="text-sm text-slate-400">{pillar.desc}</p>
            </div>
          ))}
        </div>

        <footer className="pt-8 border-t border-slate-800/80 text-xs text-slate-500">
          KANGAYATH WEB Engineering Foundation &bull; Next: Phase 02 Product Requirements & Domain Specification
        </footer>
      </div>
    </main>
  );
}
