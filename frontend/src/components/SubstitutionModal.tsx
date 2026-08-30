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
    setSelectedSets((prev) => prev.includes(n) ? prev.filter((s) => s !== n) : [...prev, n].sort());
  }
  function applyPreset(preset: 'current' | 'current_and_next' | 'all') {
    if (preset === 'current') setSelectedSets([activeSet]);
    if (preset === 'current_and_next') setSelectedSets(allSets.filter((s) => s >= activeSet));
    if (preset === 'all') setSelectedSets(allSets);
  }
  function handleApply() {
    if (!newPlayer.trim() || selectedSets.length === 0) return;
    substitutePlayer(role, outPlayer, newPlayer.trim(), selectedSets);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020817]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="sub-title">
      <div className="hud-panel-hero tech-frame modal-in w-full max-w-md rounded-[22px] p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id="sub-title" className="font-tech text-xl font-extrabold tracking-wide text-ink text-glow">SUBSTITUIÇÃO</h2>
            <p className="mt-0.5 text-xs text-muted">Troque o jogador sem editar os sets manualmente.</p>
          </div>
          <button type="button" onClick={onClose} className="btn-press flex h-11 w-11 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
            <p className="mb-1 font-bold tracking-[0.16em] text-muted">ROLE</p>
            <p className="font-bold text-primary">{role}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
            <p className="mb-1 font-bold tracking-[0.16em] text-muted">SAI</p>
            <p className="font-bold text-ink">{outPlayer}</p>
          </div>
        </div>

        <p className="mb-1.5 text-xs font-bold tracking-[0.16em] text-muted">ENTRA</p>
        <input
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="Nome do novo player"
          className="mb-4 h-11 w-full rounded-xl border border-primary/25 bg-black/40 px-3 text-sm text-ink outline-none placeholder:text-subtle focus:border-primary focus:shadow-[0_0_0_3px_rgba(56,189,248,0.15)]"
        />

        <p className="mb-2 text-xs font-bold tracking-[0.16em] text-muted">APLICAR NOS SETS</p>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {allSets.map((n) => {
            const on = selectedSets.includes(n);
            return (
              <button key={n} type="button" onClick={() => toggleSet(n)} className={`btn-press min-h-11 rounded-xl border px-2 py-2 text-left text-[11px] font-bold ${on ? 'border-success/50 bg-success/10 text-success' : 'border-white/10 bg-black/20 text-muted'}`}>
                SET {n}
              </button>
            );
          })}
        </div>

        <div className="mb-5 flex gap-2">
          <button type="button" onClick={() => applyPreset('current')} className="btn-press min-h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 text-[11px] font-semibold text-ink hover:border-primary/30 hover:bg-white/[0.08]">SÓ SET ATUAL</button>
          <button type="button" onClick={() => applyPreset('current_and_next')} className="btn-press min-h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 text-[11px] font-semibold text-ink hover:border-primary/30 hover:bg-white/[0.08]">SET ATUAL + PRÓXIMOS</button>
          <button type="button" onClick={() => applyPreset('all')} className="btn-press min-h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 text-[11px] font-semibold text-ink hover:border-primary/30 hover:bg-white/[0.08]">TODOS</button>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-press min-h-11 flex-1 rounded-xl border border-danger/40 py-2 text-sm font-bold text-danger hover:bg-danger/10">CANCELAR</button>
          <button type="button" onClick={handleApply} className="btn-press min-h-11 flex-1 rounded-xl bg-gradient-to-r from-primary to-cyan py-2 text-sm font-bold text-[#03121f] hover:shadow-[0_0_20px_-4px_rgba(56,189,248,0.8)]">APLICAR SUB</button>
        </div>
      </div>
    </div>
  );
}