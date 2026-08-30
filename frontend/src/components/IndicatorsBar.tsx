import { AlertTriangle, ShieldAlert, Star, LineChart } from 'lucide-react';
import type { Lineup } from '../types/stats';
import { calculateRating, overallPerformance } from '../lib/scoring';

interface Props { lineups: Lineup[]; }

const CARDS_META = [
  { icon: AlertTriangle, color: 'text-warning', ring: 'border-warning/25 bg-warning/10' },
  { icon: ShieldAlert, color: 'text-danger', ring: 'border-danger/25 bg-danger/10' },
  { icon: Star, color: 'text-primary', ring: 'border-primary/25 bg-primary/10' },
  { icon: LineChart, color: 'text-cyan', ring: 'border-cyan/25 bg-cyan/10' },
];

export default function IndicatorsBar({ lineups }: Props) {
  const totalErrors = lineups.reduce((acc, l) => acc + l.stats.erroOfensivo + l.stats.erroDefensivo, 0);
  const worst = lineups.length
    ? lineups.reduce((prev, curr) =>
        curr.stats.pontosTomados + curr.stats.erroDefensivo >
        prev.stats.pontosTomados + prev.stats.erroDefensivo ? curr : prev)
    : null;
  const weakPoint = worst ? `PONTOS TOMADOS NO ${worst.role.toUpperCase()}` : '—';
  const ratings = lineups.map((l) => calculateRating(l.role, l.stats)).filter((r) => r > 0);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const performance = overallPerformance(avgRating);

  const items = [
    { label: 'ERROS TOTAIS', value: totalErrors.toString(), meter: Math.min(100, totalErrors * 8) },
    { label: 'PONTO FRACO', value: weakPoint, small: true, meter: worst ? 62 : 0 },
    { label: 'RATING MÉDIO', value: avgRating.toFixed(1), meter: avgRating * 10 },
    { label: 'DESEMPENHO', value: performance, small: true, meter: avgRating * 10 },
  ];

  return (
    <div className="stagger-in grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, i) => {
        const meta = CARDS_META[i];
        const Icon = meta.icon;
        return (
          <div key={item.label} className="hud-panel flex items-center gap-3.5 rounded-[18px] px-4 py-3.5">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${meta.ring}`}>
              <Icon className={meta.color} size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-[0.16em] text-muted">{item.label}</p>
              <p className={`font-tech font-extrabold text-ink truncate ${item.small ? 'text-sm' : 'text-xl'}`}>
                {item.value}
              </p>
              <div className="meter-track mt-1.5">
                <div
                  className={`meter-fill ${i === 0 ? 'bg-warning' : i === 1 ? 'bg-danger' : i === 2 ? 'bg-primary' : 'bg-cyan'}`}
                  style={{ width: `${item.meter}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}