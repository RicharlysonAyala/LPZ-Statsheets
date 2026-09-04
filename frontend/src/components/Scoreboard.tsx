import {
  Save,
  RotateCcw,
  Camera,
  ShieldCheck,
  ArrowLeftRight,
  Loader2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useMatchStore } from '../store/matchStore';
import StaffSaveModal from './StaffSaveModal';

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
    activeTeamSide,
    toggleTeamSide,
  } = useMatchStore();

  const pips = Array.from({ length: format }, (_, i) => i + 1);
  const currentSetScore = setScores[activeSet] ?? { home: 0, away: 0 };

  const setsWonHome = Array.from({ length: format }, (_, i) => i + 1).filter(
    (n) => (setScores[n]?.home ?? 0) > (setScores[n]?.away ?? 0)
  ).length;
  const setsWonAway = Array.from({ length: format }, (_, i) => i + 1).filter(
    (n) => (setScores[n]?.away ?? 0) > (setScores[n]?.home ?? 0)
  ).length;

  const [menuOpen, setMenuOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const isAway = activeTeamSide === 'away';

  async function handlePrint() {
    setMenuOpen(false);
    const root = document.getElementById('statsheet-root');
    if (!root) {
      alert('Não achei a área da statsheet para capturar.');
      return;
    }

    setPrinting(true);
    try {
      // Espera um frame pra UI do menu fechar antes do capture
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const canvas = await html2canvas(root, {
        backgroundColor: '#050b18',
        scale: Math.min(2, window.devicePixelRatio || 2),
        useCORS: true,
        logging: false,
        // Ignora botões de menu/modais se estiverem no DOM
        ignoreElements: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          return (
            el.dataset?.printHide === 'true' ||
            el.classList.contains('fixed') // modais fixed
          );
        },
      });

      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const filename = `lpz-statsheet-${teamHomeName}-vs-${teamAwayName}-set${activeSet}-${stamp}.png`
        .replace(/\s+/g, '_')
        .toLowerCase();

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert('Falha ao gerar o print. Tente de novo ou use outro navegador.');
    } finally {
      setPrinting(false);
    }
  }

  return (
    <section className="hud-panel-hero tech-frame rounded-[22px] p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
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

          {/* TROCAR: casa = magenta; visitante = azul primary do site */}
          <button
            type="button"
            onClick={toggleTeamSide}
            className={`btn-press flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2 text-[11px] font-bold tracking-wide transition-colors ${
              isAway
                ? 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/25'
                : 'border-magenta/30 bg-magenta/10 text-magenta hover:bg-magenta/20'
            }`}
            title="Alternar qual time você está preenchendo"
          >
            <ArrowLeftRight size={14} />
            TROCAR
            <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px]">
              {isAway ? teamAwayName.toUpperCase() : teamHomeName.toUpperCase()}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-5 md:gap-8">
          <div className="text-right">
            <p
              className={`mb-1 text-[10px] font-semibold tracking-[0.2em] ${
                activeTeamSide === 'home' ? 'text-primary' : 'text-muted'
              }`}
            >
              {teamHomeName.toUpperCase()}
            </p>
            <EditableScore
              value={currentSetScore.home}
              onCommit={(v) => setScore(activeSet, 'home', v)}
            />
          </div>

          <div className="flex flex-col items-center gap-2 pt-3">
            <span className="font-tech text-sm font-bold text-primary">×</span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-tech text-[10px] font-bold tracking-[0.18em] text-primary">
              SET {activeSet}
            </span>
            <div className="flex items-center gap-1.5 pt-1">
              {pips.map((n) => {
                const sh = setScores[n]?.home ?? 0;
                const sa = setScores[n]?.away ?? 0;
                const homeWon = sh > sa && sh > 0;
                const awayWon = sa > sh && sa > 0;
                return (
                  <span
                    key={n}
                    className={`h-2 w-2 rounded-full ${
                      homeWon
                        ? 'bg-primary'
                        : awayWon
                          ? 'bg-magenta'
                          : 'bg-white/15'
                    }`}
                    title={`Set ${n}: ${sh}x${sa}`}
                  />
                );
              })}
            </div>
            <p className="font-tech text-[10px] font-bold tracking-wide text-slate-400">
              {setsWonHome} – {setsWonAway}
            </p>
          </div>

          <div className="text-left">
            <p
              className={`mb-1 text-[10px] font-semibold tracking-[0.2em] ${
                activeTeamSide === 'away' ? 'text-primary' : 'text-muted'
              }`}
            >
              {teamAwayName.toUpperCase()}
            </p>
            <EditableScore
              value={currentSetScore.away}
              onCommit={(v) => setScore(activeSet, 'away', v)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2" data-print-hide="true">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              disabled={printing}
              className="btn-press flex min-h-11 items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2 text-[11px] font-bold tracking-wide text-success hover:bg-success/20 disabled:opacity-50"
            >
              {printing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {printing ? 'GERANDO…' : 'SALVAR PARTIDA'}
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
                    <span className="block text-[10px] font-normal text-slate-400">
                      Registra oficialmente na liga
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={printing}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-ink hover:bg-primary/10 disabled:opacity-50"
                >
                  <Camera size={15} className="text-cyan" />
                  <span>
                    Tirar Print
                    <span className="block text-[10px] font-normal text-slate-400">
                      Uso pessoal — não grava na liga
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => resetSet(activeSet)}
            className="btn-press flex min-h-11 items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2 text-[11px] font-bold tracking-wide text-danger hover:bg-danger/20"
          >
            <RotateCcw size={14} /> RESET SET
          </button>
        </div>
      </div>

      {staffModalOpen && <StaffSaveModal onClose={() => setStaffModalOpen(false)} />}
    </section>
  );
}