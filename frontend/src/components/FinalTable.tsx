import { useMatchStore } from '../store/matchStore';
import { calculateRating } from '../lib/scoring';
import type { StatFields } from '../types/stats';

interface AggregatedRow {
  key: string;
  role: string;
  player: string;
  isSub: boolean;
  stats: StatFields;
  rating: number;
  hasData: boolean;
}

function emptyStats(): StatFields {
  return {
    pontosFeitos: 0,
    pontosTomados: 0,
    block: 0,
    assistencias: 0,
    erroOfensivo: 0,
    erroDefensivo: 0,
  };
}

export default function FinalTable() {
  const { sets, format } = useMatchStore();
  const setNumbers = Array.from({ length: format }, (_, i) => i + 1);

  // Agrega estatísticas por (role + player) somando todos os sets
  const map = new Map<string, AggregatedRow>();
  setNumbers.forEach((setNumber) => {
    (sets[setNumber] ?? []).forEach((lineup) => {
      const key = `${lineup.role}__${lineup.player}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          role: lineup.role,
          player: lineup.player,
          isSub: Boolean(lineup.subInfo),
          stats: emptyStats(),
          rating: 0,
          hasData: false,
        });
      }
      const row = map.get(key)!;
      const totalActions =
        lineup.stats.pontosFeitos + lineup.stats.pontosTomados + lineup.stats.block +
        lineup.stats.assistencias + lineup.stats.erroOfensivo + lineup.stats.erroDefensivo;
      if (totalActions > 0) row.hasData = true;

      (Object.keys(row.stats) as (keyof StatFields)[]).forEach((field) => {
        row.stats[field] += lineup.stats[field];
      });
    });
  });

  const rows = Array.from(map.values()).map((row) => ({
    ...row,
    rating: calculateRating(row.role as never, row.stats),
  }));

  const withData = rows.filter((r) => r.hasData);
  const mvp = withData.length
    ? withData.reduce((a, b) => (b.rating > a.rating ? b : a))
    : null;
  const worst = withData.length
    ? withData.reduce((a, b) => (b.rating < a.rating ? b : a))
    : null;

  return (
    <div className="glass-panel rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] text-slate-400 font-bold tracking-wide border-b border-white/10">
            <th className="px-4 py-3">JOGADOR</th>
            <th className="px-4 py-3">P. FEITOS</th>
            <th className="px-4 py-3">P. TOMADOS</th>
            <th className="px-4 py-3">BLOCK</th>
            <th className="px-4 py-3">ASSISTS</th>
            <th className="px-4 py-3">E. OFENSIVO</th>
            <th className="px-4 py-3">E. DEFENSIVO</th>
            <th className="px-4 py-3">RATING</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
              <td className="px-4 py-3 font-bold text-white">
                {row.role} | {row.player}{' '}
                {mvp && row.key === mvp.key && (
                  <span className="ml-2 rounded bg-success/15 border border-success/30 text-success text-[10px] font-bold px-1.5 py-0.5 shadow-[0_0_10px_-3px_rgba(52,211,153,0.7)]">
                    MVP
                  </span>
                )}
                {worst && row.key === worst.key && worst.key !== mvp?.key && (
                  <span className="ml-2 rounded bg-danger/15 border border-danger/30 text-danger text-[10px] font-bold px-1.5 py-0.5">
                    WORST
                  </span>
                )}
                {row.isSub && (
                  <span className="ml-2 rounded bg-primary/15 border border-primary/30 text-primary text-[10px] font-bold px-1.5 py-0.5">
                    SUB
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-300 font-tech">{row.stats.pontosFeitos}</td>
              <td className="px-4 py-3 text-slate-300 font-tech">{row.stats.pontosTomados}</td>
              <td className="px-4 py-3 text-slate-300 font-tech">{row.stats.block}</td>
              <td className="px-4 py-3 text-slate-300 font-tech">{row.stats.assistencias}</td>
              <td className="px-4 py-3 text-slate-300 font-tech">{row.stats.erroOfensivo}</td>
              <td className="px-4 py-3 text-slate-300 font-tech">{row.stats.erroDefensivo}</td>
              <td className="px-4 py-3 font-tech font-bold text-warning">
                {row.hasData ? row.rating.toFixed(1) : '0'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
