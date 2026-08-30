import { FileText, MessageSquare, Save, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMatchStore } from '../store/matchStore';

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
      title="Clique para editar o placar"
      className="font-tech score-glow rounded-lg text-5xl font-extrabold leading-none tabular-nums transition-opacity hover:opacity-80 md:text-6xl"
    >
      {String(value).padStart(2, '0')}
    </button>
  );
}

export default function Scoreboard() {
  const {
    scoreHome,
    scoreAway,
    resetSet,
    activeSet,
    teamHomeName,
    teamAwayName,
    format,
    setScoreHome,
    setScoreAway,
  } = useMatchStore();
  const pips = Array.from({ length: format }, (_, i) => i + 1);

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
        </div>

        <div className="flex items-center justify-center gap-5 md:gap-8">
          <div className="text-right">
            <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-muted">{teamHomeName.toUpperCase()}</p>
            <EditableScore value={scoreHome} onCommit={setScoreHome} />
          </div>
          <div className="flex flex-col items-center gap-2 pt-3">
            <span className="font-tech text-sm font-bold text-primary">×</span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-tech text-[10px] font-bold tracking-[0.18em] text-primary">
              SET {activeSet}
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
            <EditableScore value={scoreAway} onCommit={setScoreAway} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" className="btn-press flex min-h-11 items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2 text-[11px] font-bold tracking-wide text-success hover:bg-success/20">
            <Save size={14} /> SALVAR PARTIDA
          </button>
          <button type="button" onClick={() => resetSet(activeSet)} className="btn-press flex min-h-11 items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2 text-[11px] font-bold tracking-wide text-danger hover:bg-danger/20">
            <RotateCcw size={14} /> RESET SET
          </button>
        </div>
      </div>
    </section>
  );
}