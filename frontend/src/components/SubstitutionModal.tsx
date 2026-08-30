import { useState } from 'react';
import { X } from 'lucide-react';
import type { Role } from '../types/stats';
import { useMatchStore } from '../store/matchStore';

interface Props {
  role: Role;
  outPlayer: string;
  activeSet: number;
  onClose: () => void;
}

export default function SubstitutionModal({ role, outPlayer, activeSet, onClose }: Props) {
  const format = useMatchStore((s) => s.format);
  const substitutePlayer = useMatchStore((s) => s.substitutePlayer);
  const allSets = Array.from({ length: format }, (_, i) => i + 1);

  const [newPlayer, setNewPlayer] = useState('');
  const [selectedSets, setSelectedSets] = useState<number[]>(allSets);

  function toggleSet(n: number) {
    setSelectedSets((prev) =>
      prev.includes(n) ? prev.filter((s) => s !== n) : [...prev, n].sort()
    );
  }

  function applyPreset(preset: 'current' | 'current_and_next' | 'all') {
    if (preset === 'current') setSelectedSets([activeSet]);
    if (preset === 'current_and_next')
      setSelectedSets(allSets.filter((s) => s >= activeSet));
    if (preset === 'all') setSelectedSets(allSets);
  }

  function handleApply() {
    if (!newPlayer.trim() || selectedSets.length === 0) return;
    substitutePlayer(role, outPlayer, newPlayer.trim(), selectedSets);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel glow-border w-full max-w-md rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-tech text-xl font-extrabold text-white text-glow">SUBSTITUIÇÃO</h2>
            <p className="text-xs text-slate-400">Troque o jogador sem editar os sets manualmente.</p>
          </div>
          <button onClick={onClose} className="text-danger hover:opacity-70">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div>
            <p className="text-slate-400 font-bold mb-1 tracking-wide">ROLE</p>
            <p className="font-bold text-primary">{role}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold mb-1 tracking-wide">SAI</p>
            <p className="font-bold text-white">{outPlayer}</p>
          </div>
        </div>

        <p className="text-slate-400 text-xs font-bold mb-1 tracking-wide">ENTRA</p>
        <input
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="Nome do novo player"
          className="w-full rounded-lg bg-black/40 border border-primary/25 px-3 py-2 text-sm mb-4 outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(56,189,248,0.15)] transition-shadow"
        />

        <p className="text-slate-400 text-xs font-bold mb-2 tracking-wide">APLICAR NOS SETS</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {allSets.map((n) => (
            <button
              key={n}
              onClick={() => toggleSet(n)}
              className={`rounded-lg border px-2 py-2 text-[11px] font-bold text-left transition-all ${
                selectedSets.includes(n)
                  ? 'border-success/50 bg-success/10 text-success shadow-[0_0_12px_-4px_rgba(52,211,153,0.6)]'
                  : 'border-white/10 bg-black/20 text-slate-400'
              }`}
            >
              SET {n}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => applyPreset('current')}
            className="flex-1 rounded-lg bg-white/5 border border-white/10 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/10 hover:border-primary/30"
          >
            SÓ SET ATUAL
          </button>
          <button
            onClick={() => applyPreset('current_and_next')}
            className="flex-1 rounded-lg bg-white/5 border border-white/10 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/10 hover:border-primary/30"
          >
            SET ATUAL + PRÓXIMOS
          </button>
          <button
            onClick={() => applyPreset('all')}
            className="flex-1 rounded-lg bg-white/5 border border-white/10 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/10 hover:border-primary/30"
          >
            TODOS
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-danger/40 text-danger py-2 text-sm font-bold hover:bg-danger/10"
          >
            CANCELAR
          </button>
          <button
            onClick={handleApply}
            className="flex-1 rounded-lg bg-gradient-to-r from-primary to-cyan text-[#03121f] py-2 text-sm font-bold hover:shadow-[0_0_20px_-4px_rgba(56,189,248,0.8)] transition-shadow"
          >
            APLICAR SUB
          </button>
        </div>
      </div>
    </div>
  );
}
