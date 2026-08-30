import { ArrowLeftRight } from 'lucide-react';
import type { Lineup, StatFields } from '../types/stats';
import { ROLE_FIELDS, FIELD_LABELS } from '../types/stats';
import StatCounter from './StatCounter';
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
  onOpenSub: () => void;
}

export default function PlayerStatCard({ lineup, onInc, onDec, onOpenSub }: Props) {
  const fields = ROLE_FIELDS[lineup.role];
  const rating = calculateRating(lineup.role, lineup.stats);
  const efficiency = calculateEfficiency(lineup.stats);
  const roleStyle = ROLE_STYLES[lineup.role];

  return (
    <div className="glass-panel group rounded-2xl p-4 flex flex-col gap-4 transition-all hover:border-primary/40 hover:shadow-[0_0_30px_-10px_rgba(56,189,248,0.5)]">
      <div className="flex items-start justify-between">
        <div>
          <p className={`flex items-center gap-1.5 text-[11px] font-tech font-bold tracking-widest ${roleStyle.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${roleStyle.dot} shadow-[0_0_8px_currentColor]`} />
            {lineup.role.toUpperCase()}
          </p>
          <h3 className="text-lg font-extrabold text-white leading-tight mt-0.5">{lineup.player}</h3>
          {lineup.subInfo && (
            <p className="text-[10px] text-primary/70 mt-0.5">{lineup.subInfo}</p>
          )}
        </div>
        <button
          onClick={onOpenSub}
          className="flex items-center gap-1 text-[11px] font-semibold text-primary border border-primary/30 bg-primary/5 rounded-lg px-2 py-1 hover:bg-primary/15 hover:shadow-[0_0_12px_-2px_rgba(56,189,248,0.6)] transition-all"
        >
          <ArrowLeftRight size={12} /> SUB
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <StatCounter
            key={field}
            label={FIELD_LABELS[field]}
            value={lineup.stats[field]}
            onInc={() => onInc(field)}
            onDec={() => onDec(field)}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 pt-3 border-t border-white/10 text-center">
        <div>
          <p className="text-[10px] text-slate-400 font-bold tracking-wide">RATING</p>
          <p className="font-tech text-warning font-bold">{rating.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold tracking-wide">EFICIÊNCIA</p>
          <p className="font-tech text-cyan font-bold">{efficiency}%</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold tracking-wide">CONSISTÊNCIA</p>
          <p className="font-tech text-warning font-bold">{consistencyLabel(rating)}</p>
        </div>
      </div>
    </div>
  );
}
