import { FileText, MessageSquare, Save, RotateCcw, Camera, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMatchStore } from '../store/matchStore';
import StaffSaveModal from './StaffSaveModal';

// Número do placar que vira um <input> ao clicar, e volta a ser texto
// grande (com o brilho "score-glow") quando não está em edição.
function EditableScore({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(value));

  useEffect(() => {
    if (!editing) setText(String(value));
  }, [value, editing]);

  function commit() {
    const parsed = parseInt(text, 10);
    onCommit(Number.isNaN(parsed) ? 0 : parsed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={0}
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="font-tech score-glow w-[1.6em] rounded-lg border border-primary/40 bg-black/30 text-center text-5xl font-extrabold leading-none tabular-nums outline-none focus:ring-2 focus:ring-primary/40 md:text-6xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Clique para editar o placar deste set"
      className="font-tech score-glow rounded-lg text-5xl font-extrabold leading-none tabular-nums transition-opacity hover:opacity-80 md:text-6xl"
    >
      {String(value).padStart(2, '0')}
    </button>
  );
}

export default function Scoreboard() {
  const {
    resetSet,
    activeSet,
    teamHomeName,
    teamAwayName,
    format,
    setFormat,
    setScores,
    setScore,
  } = useMatchStore();
  const pips = Array.from({ length: format }, (_, i) => i + 1);

  // Placar do SET ATUAL especificamente (não mais um valor único pra partida)
  const currentSetScore = setScores[activeSet] ?? { home: 0, away: 0 };

  // Quantos sets cada time já venceu, comparando o placar de cada set já jogado
  const setsWonHome = Array.from({ length: format }, (_, i) => i + 1).filter(
    (n) => (setScores[n]?.home ?? 0) > (setScores[n]?.away ?? 0)
  ).length;
  const setsWonAway = Array.from({ length: format }, (_, i) => i + 1).filter(
    (n) => (setScores[n]?.away ?? 0) > (setScores[n]?.home ?? 0)
  ).length;

  // Menu "SALVAR PARTIDA" (Staff / Print) e o modal do Staff
  const [menuOpen, setMenuOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <section className="hud-panel-hero tech-frame rounded-[22px] px-4 py-4 md:px-6 md:py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-press flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[11px] font-semibold tracking-wide text-ink hover:border-primary/40 hover:bg-white/[0.07]">
            <FileText size={14} className="text-primary" /> UPDATE LOG
          </button>
          <button type="button" className="btn-press flex min-h-11 flex-col items-start justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-ink hover:border-primary/40 hover:bg-white/[0.07]">
            <span className="flex items-center gap-2">
              <MessageSquare size={14} className="text-primary" /> FEEDBACK
            </span>
            <span className="text-[10px] font-medium text-muted">Envie sugestões/melhorias ou bugs</span>
          </button>

          {/* Seletor MD3 / MD5 — define quantos sets a partida tem */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
            {([3, 5] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFormat(opt)}
                className={`font-tech min-h-9 rounded-lg px-3 text-[11px] font-bold tracking-wide transition-colors ${
                  format === opt
                    ? 'bg-gradient-to-r from-primary to-cyan text-[#03121f]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={opt === 3 ? 'Melhor de 3 sets' : 'Melhor de 5 sets (playoffs)'}
              >
                MD{opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-5 md:gap-8">
          <div className="text-right">
            <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-muted">{teamHomeName.toUpperCase()}</p>
            <EditableScore value={currentSetScore.home} onCommit={(v) => setScore(activeSet, 'home', v)} />
          </div>
          <div className="flex flex-col items-center gap-2 pt-3">
            <span className="font-tech text-sm font-bold text-primary">×</span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-tech text-[10px] font-bold tracking-[0.18em] text-primary">
              SET {activeSet}
            </span>
            <span className="font-tech text-[10px] font-bold text-slate-400">
              SETS {setsWonHome}-{setsWonAway}
            </span>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {pips.map((n) => (
                <span
                  key={n}
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-[250ms] ${
                    n === activeSet ? 'w-4 bg-primary' : n < activeSet ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-white/15'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-left">
            <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-muted">{teamAwayName.toUpperCase()}</p>
            <EditableScore value={currentSetScore.away} onCommit={(v) => setScore(activeSet, 'away', v)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="btn-press flex min-h-11 items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2 text-[11px] font-bold tracking-wide text-success hover:bg-success/20"
            >
              <Save size={14} /> SALVAR PARTIDA
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 rounded-xl border border-primary/25 bg-surface/95 backdrop-blur-xl p-2 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setStaffModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-ink hover:bg-primary/10"
                >
                  <ShieldCheck size={15} className="text-primary" />
                  <span>
                    Salvar Partida (Staff)
                    <span className="block text-[10px] font-normal text-slate-400">Registra oficialmente na liga</span>
                  </span>
                </button>
                <button
                  type="button"
                  disabled
                  title="Em breve"
                  className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-slate-500"
                >
                  <Camera size={15} />
                  <span>
                    Tirar Print
                    <span className="block text-[10px] font-normal text-slate-500">Uso pessoal — em breve</span>
                  </span>
                </button>
              </div>
            )}
          </div>

          <button type="button" onClick={() => resetSet(activeSet)} className="btn-press flex min-h-11 items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2 text-[11px] font-bold tracking-wide text-danger hover:bg-danger/20">
            <RotateCcw size={14} /> RESET SET
          </button>
        </div>
      </div>

      {staffModalOpen && <StaffSaveModal onClose={() => setStaffModalOpen(false)} />}
    </section>
  );
}