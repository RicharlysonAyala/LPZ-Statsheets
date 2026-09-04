import { ArrowLeftRight, Eraser, Pencil, Check } from 'lucide-react';
import { useState } from 'react';
import type { Lineup, StatFields } from '../types/stats';
import { ROLE_FIELDS, FIELD_LABELS } from '../types/stats';
import StatCounter from './StatCounter';
import RatingRing from './RatingRing';
import { calculateRating, calculateEfficiency, consistencyLabel } from '../lib/scoring';

const ROLE_STYLES: Record<string, { text: string; dot: string }> = {
  Ponteiro: { text: 'text-primary', dot: 'bg-primary' },
  Oposto: { text: 'text-amber-400', dot: 'bg-amber-400' },
  Líbero: { text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'Ds Spiker': { text: 'text-purple-400', dot: 'bg-purple-400' },
  'Ds Tsk': { text: 'text-yellow-300', dot: 'bg-yellow-300' },
  Setter: { text: 'text-pink-400', dot: 'bg-pink-400' },
};

interface Props {
  lineup: Lineup;
  onInc: (field: keyof StatFields) => void;
  onDec: (field: keyof StatFields) => void;
  onSet: (field: keyof StatFields, value: number) => void;
  onRename: (newName: string) => void;
  onClear: () => void;
  onOpenSub: () => void;
}

export default function PlayerStatCard({
  lineup,
  onInc,
  onDec,
  onSet,
  onRename,
  onClear,
  onOpenSub,
}: Props) {
  const fields = ROLE_FIELDS[lineup.role];
  const rating = calculateRating(lineup.role, lineup.stats);
  const efficiency = calculateEfficiency(lineup.stats);
  const consistency = consistencyLabel(rating);
  const roleStyle = ROLE_STYLES[lineup.role];

  // Controla se o nome do jogador está em modo de edição
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(lineup.player);

  function startEditing() {
    setNameDraft(lineup.player);
    setEditingName(true);
  }

  function commitName() {
    if (nameDraft.trim()) onRename(nameDraft);
    setEditingName(false);
  }

  return (
    <article className="hud-panel hud-panel-interactive group flex flex-col gap-4 rounded-[22px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <RatingRing value={rating} />
          <div className="min-w-0 flex-1">
            <p className={`flex items-center gap-1.5 font-tech text-[11px] font-bold tracking-[0.18em] ${roleStyle.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${roleStyle.dot}`} style={{ boxShadow: '0 0 8px currentColor' }} />
              {lineup.role.toUpperCase()}
            </p>

            {/* Nome do jogador: clique no lápis pra editar direto no card */}
            {editingName ? (
              <div className="mt-1 flex items-center gap-1.5">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitName();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  onBlur={commitName}
                  className="min-w-0 flex-1 rounded-lg border border-primary/40 bg-black/30 px-2 py-1 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={commitName}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success"
                  aria-label="Confirmar nome"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEditing}
                className="group/name mt-0.5 flex max-w-full items-center gap-1.5 text-left"
                title="Clique para editar o nome"
              >
                <h3 className="truncate text-lg font-extrabold leading-tight text-ink">{lineup.player}</h3>
                <Pencil size={12} className="shrink-0 text-muted opacity-0 transition-opacity group-hover/name:opacity-100" />
              </button>
            )}

            {lineup.subInfo && <p className="mt-0.5 text-[10px] text-primary/80">{lineup.subInfo}</p>}
          </div>
        </div>

        <div className="player-card-actions flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onClear}
            title="Limpar estatísticas deste jogador neste set"
            className="btn-press flex min-h-11 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-muted hover:border-danger/40 hover:text-danger"
          >
            <Eraser size={12} /> LIMPAR
          </button>
          <button
            type="button"
            onClick={onOpenSub}
            className="btn-press flex min-h-11 items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/15"
          >
            <ArrowLeftRight size={12} /> SUB
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <StatCounter
            key={field}
            label={FIELD_LABELS[field]}
            value={lineup.stats[field]}
            onInc={() => onInc(field)}
            onDec={() => onDec(field)}
            onSet={(value) => onSet(field, value)}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-white/8 pt-3">
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.14em] text-muted">RATING</p>
          <p className="font-tech font-bold text-warning tabular-nums">{rating.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.14em] text-muted">EFICIÊNCIA</p>
          <p className="font-tech font-bold text-cyan tabular-nums">{efficiency}%</p>
          <div className="meter-track mx-auto mt-1 max-w-[72px]">
            <div className="meter-fill bg-cyan" style={{ width: `${Math.min(100, efficiency)}%` }} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.14em] text-muted">CONSISTÊNCIA</p>
          <p className={`font-tech font-bold ${
            consistency === 'ALTA' ? 'text-success' : consistency === 'MÉDIA' ? 'text-warning' : consistency === 'BAIXA' ? 'text-danger' : 'text-muted'
          }`}>{consistency}</p>
        </div>
      </div>
    </article>
  );
}