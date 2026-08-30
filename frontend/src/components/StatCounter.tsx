import { Minus, Plus } from 'lucide-react';

interface Props {
  label: string;
  value: number;
  onInc: () => void;
  onDec: () => void;
}

export default function StatCounter({ label, value, onInc, onDec }: Props) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold tracking-[0.14em] text-muted">{label.toUpperCase()}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onDec} className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20" aria-label={`Diminuir ${label}`}>
          <Minus size={16} />
        </button>
        <div className="stat-well font-tech flex h-11 flex-1 items-center justify-center rounded-xl text-lg font-bold tabular-nums text-ink">
          <span key={value} className="num-pop">{value}</span>
        </div>
        <button type="button" onClick={onInc} className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-success/30 bg-success/10 text-success hover:bg-success/20" aria-label={`Aumentar ${label}`}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}