export default function Header() {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl animate-pulse-glow" />
        <img
          src="/brand/lpz-logo.png"
          alt="LPZ"
          className="relative h-12 w-12 object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]"
        />
      </div>
      <div>
        <h1 className="font-tech text-xl font-extrabold tracking-wider text-white text-glow">
          LPZ <span className="text-primary">STATSSHEETS</span>
        </h1>
        <p className="text-[11px] text-slate-400 font-medium tracking-wide">
          Volleyball Legends · Performance Tracker
        </p>
      </div>
    </div>
  );
}
