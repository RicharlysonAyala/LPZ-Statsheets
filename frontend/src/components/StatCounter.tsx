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
      <p className="text-[10px] tracking-wider text-slate-400 font-bold mb-1.5">
        {label.toUpperCase()}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onDec}
          className="h-9 w-9 shrink-0 rounded-lg bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 hover:shadow-[0_0_12px_-2px_rgba(251,113,133,0.6)] flex items-center justify-center transition-all"
          aria-label={`Diminuir ${label}`}
        >
          <Minus size={16} />
        </button>
        <div className="font-tech flex-1 h-9 rounded-lg bg-black/40 border border-primary/20 flex items-center justify-center font-bold text-lg text-white">
          {value}
        </div>
        <button
          onClick={onInc}
          className="h-9 w-9 shrink-0 rounded-lg bg-success/10 border border-success/30 text-success hover:bg-success/20 hover:shadow-[0_0_12px_-2px_rgba(52,211,153,0.6)] flex items-center justify-center transition-all"
          aria-label={`Aumentar ${label}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
