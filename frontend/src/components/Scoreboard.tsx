import { FileText, MessageSquare, Save, RotateCcw } from 'lucide-react';
import { useMatchStore } from '../store/matchStore';

export default function Scoreboard() {
  const { scoreHome, scoreAway, resetSet, activeSet } = useMatchStore();

  return (
    <div className="glass-panel rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 hover:border-primary/40 transition-colors">
          <FileText size={14} className="text-primary" /> UPDATE LOG
        </button>
        <button className="flex flex-col items-start rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 hover:border-primary/40 transition-colors">
          <span className="flex items-center gap-2">
            <MessageSquare size={14} className="text-primary" /> FEEDBACK
          </span>
          <span className="text-[10px] font-normal text-slate-400">
            Envie sugestões/melhorias ou bugs
          </span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-tech text-3xl font-black text-white text-glow">{scoreHome}</span>
        <span className="font-tech text-lg font-bold text-primary">X</span>
        <span className="font-tech text-3xl font-black text-white text-glow">{scoreAway}</span>
        <span className="ml-2 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-[11px] font-bold text-primary tracking-wider">
          SET {activeSet}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 text-success px-3 py-2 text-xs font-bold hover:bg-success/20 hover:shadow-[0_0_16px_-2px_rgba(52,211,153,0.5)] transition-all">
          <Save size={14} /> SALVAR PARTIDA
        </button>
        <button
          onClick={() => resetSet(activeSet)}
          className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/30 text-danger px-3 py-2 text-xs font-bold hover:bg-danger/20 hover:shadow-[0_0_16px_-2px_rgba(251,113,133,0.5)] transition-all"
        >
          <RotateCcw size={14} /> RESET SET
        </button>
      </div>
    </div>
  );
}
