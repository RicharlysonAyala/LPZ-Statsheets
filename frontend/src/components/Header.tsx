export default function Header() {
  return (
    <header className="flex items-center justify-between gap-4 px-1">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative shrink-0">
          <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur-lg" />
          <div className="relative h-12 w-12 overflow-hidden rounded-[14px] border border-primary/25 bg-surface shadow-[0_0_0_1px_rgba(56,189,248,0.12)]">
            <img src="/brand/lpz-logo.png" alt="LPZ" className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.28em] text-primary/80">LPZ SYSTEMS</p>
          <h1 className="font-tech truncate text-[1.35rem] font-bold leading-none tracking-wide text-ink">
            LPZ <span className="text-primary text-glow">STATSSHEETS</span>
          </h1>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
        <span className="live-dot" aria-hidden="true" />
        <span className="text-[10px] font-semibold tracking-[0.22em] text-muted">VOLLEYBALL LEGENDS</span>
      </div>
    </header>
  );
}