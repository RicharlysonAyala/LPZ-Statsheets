import { useMatchStore } from '../store/matchStore';
import { calculateRating, calculateEfficiency } from '../lib/scoring';
import type { Role, StatFields } from '../types/stats';

interface AggregatedRow {
  key: string;
  role: string;
  player: string;
  isSub: boolean;
  stats: StatFields;
  rating: number;
  efficiency: number;
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

function ratingTone(rating: number, hasData: boolean): string {
  if (!hasData || rating === 0) return 'text-muted';
  if (rating >= 8) return 'text-success';
  if (rating >= 5) return 'text-warning';
  return 'text-danger';
}

export default function FinalTable() {
  const { sets, format, activeTeamSide} = useMatchStore();
  const activeSets = sets[activeTeamSide];
  const setNumbers = Array.from({ length: format }, (_, i) => i + 1);

  const map = new Map<string, AggregatedRow>();
  setNumbers.forEach((setNumber) => {
    (activeSets[setNumber] ?? []).forEach((lineup) => {
      const key = `${lineup.role}__${lineup.player}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          role: lineup.role,
          player: lineup.player,
          isSub: Boolean(lineup.subInfo),
          stats: emptyStats(),
          rating: 0,
          efficiency: 0,
          hasData: false,
        });
      }
      const row = map.get(key)!;
      const totalActions =
        lineup.stats.pontosFeitos +
        lineup.stats.pontosTomados +
        lineup.stats.block +
        lineup.stats.assistencias +
        lineup.stats.erroOfensivo +
        lineup.stats.erroDefensivo;
      if (totalActions > 0) row.hasData = true;
      if (lineup.subInfo) row.isSub = true;

      (Object.keys(row.stats) as (keyof StatFields)[]).forEach((field) => {
        row.stats[field] += lineup.stats[field];
      });
    });
  });

  const rows = Array.from(map.values())
    .map((row) => {
      const rating = calculateRating(row.role as Role, row.stats);
      const efficiency = calculateEfficiency(row.stats);
      return { ...row, rating, efficiency };
    })
    .sort((a, b) => b.rating - a.rating);

  const withData = rows.filter((r) => r.hasData);
  const mvp = withData.length
    ? withData.reduce((a, b) => (b.rating > a.rating ? b : a))
    : null;
  const worst = withData.length
    ? withData.reduce((a, b) => (b.rating < a.rating ? b : a))
    : null;

  return (
    <div className="space-y-4">
      {/* Tabela */}
      <div className="hud-panel overflow-hidden rounded-[22px]">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <p className="font-tech text-xs font-bold tracking-[0.2em] text-muted">
            TABELA FINAL · MD{format}
          </p>
          <p className="text-[10px] text-muted">Soma de todos os sets</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/8 text-[10px] font-bold tracking-[0.14em] text-muted">
                <th className="px-4 py-3 font-semibold">JOGADOR</th>
                <th className="px-3 py-3 font-semibold">ROLE</th>
                <th className="px-3 py-3 text-center font-semibold">PF</th>
                <th className="px-3 py-3 text-center font-semibold">PT</th>
                <th className="px-3 py-3 text-center font-semibold">BLK</th>
                <th className="px-3 py-3 text-center font-semibold">AST</th>
                <th className="px-3 py-3 text-center font-semibold">EO</th>
                <th className="px-3 py-3 text-center font-semibold">ED</th>
                <th className="px-3 py-3 text-center font-semibold">EFF</th>
                <th className="px-4 py-3 text-right font-semibold">RATING</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isMvp = mvp?.key === row.key;
                const isWorst = worst?.key === row.key && worst.key !== mvp?.key;
                return (
                  <tr
                    key={row.key}
                    className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${
                      isMvp ? 'bg-success/5' : isWorst ? 'bg-danger/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-bold text-ink">{row.player}</span>
                        {row.isSub && (
                          <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                            SUB
                          </span>
                        )}
                        {isMvp && (
                          <span className="shrink-0 rounded-full border border-success/30 bg-success/10 px-1.5 py-0.5 text-[9px] font-bold text-success">
                            MVP
                          </span>
                        )}
                        {isWorst && (
                          <span className="shrink-0 rounded-full border border-danger/30 bg-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-danger">
                            WORST
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[11px] font-semibold text-muted">{row.role}</span>
                    </td>
                    <td className="font-tech px-3 py-3 text-center text-sm tabular-nums text-ink">
                      {row.stats.pontosFeitos}
                    </td>
                    <td className="font-tech px-3 py-3 text-center text-sm tabular-nums text-ink">
                      {row.stats.pontosTomados}
                    </td>
                    <td className="font-tech px-3 py-3 text-center text-sm tabular-nums text-ink">
                      {row.stats.block}
                    </td>
                    <td className="font-tech px-3 py-3 text-center text-sm tabular-nums text-ink">
                      {row.stats.assistencias}
                    </td>
                    <td className="font-tech px-3 py-3 text-center text-sm tabular-nums text-danger/90">
                      {row.stats.erroOfensivo}
                    </td>
                    <td className="font-tech px-3 py-3 text-center text-sm tabular-nums text-danger/90">
                      {row.stats.erroDefensivo}
                    </td>
                    <td className="font-tech px-3 py-3 text-center text-sm tabular-nums text-cyan">
                      {row.hasData ? `${row.efficiency}%` : '—'}
                    </td>
                    <td
                      className={`font-tech px-4 py-3 text-right text-base font-extrabold tabular-nums ${ratingTone(
                        row.rating,
                        row.hasData
                      )}`}
                    >
                      {row.hasData ? row.rating.toFixed(1) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Nenhum jogador neste time ainda.
          </p>
        )}
      </div>

      <p className="px-1 text-[10px] text-muted">
        PF pontos feitos · PT pontos tomados · BLK block · AST assistências · EO erro ofensivo · ED
        erro defensivo · EFF eficiência
      </p>
    </div>
  );
}