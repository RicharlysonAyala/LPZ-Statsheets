import { AlertTriangle, ShieldAlert, Star, LineChart } from 'lucide-react';
import type { Lineup } from '../types/stats';
import { calculateRating, overallPerformance } from '../lib/scoring';

interface Props {
  lineups: Lineup[];
}

const CARDS_META = [
  { icon: AlertTriangle, color: 'text-warning', glow: 'shadow-[0_0_16px_-4px_rgba(251,191,36,0.6)]' },
  { icon: ShieldAlert, color: 'text-danger', glow: 'shadow-[0_0_16px_-4px_rgba(251,113,133,0.6)]' },
  { icon: Star, color: 'text-primary', glow: 'shadow-[0_0_16px_-4px_rgba(56,189,248,0.6)]' },
  { icon: LineChart, color: 'text-cyan', glow: 'shadow-[0_0_16px_-4px_rgba(34,211,238,0.6)]' },
];

export default function IndicatorsBar({ lineups }: Props) {
  const totalErrors = lineups.reduce(
    (acc, l) => acc + l.stats.erroOfensivo + l.stats.erroDefensivo,
    0
  );

  const worst = lineups.length
    ? lineups.reduce((prev, curr) =>
        curr.stats.pontosTomados + curr.stats.erroDefensivo >
        prev.stats.pontosTomados + prev.stats.erroDefensivo
          ? curr
          : prev
      )
    : null;
  const weakPoint = worst ? `PONTOS TOMADOS NO ${worst.role.toUpperCase()}` : '—';

  const ratings = lineups.map((l) => calculateRating(l.role, l.stats)).filter((r) => r > 0);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const items = [
    { label: 'ERROS TOTAIS', value: totalErrors.toString() },
    { label: 'PONTO FRACO', value: weakPoint, small: true },
    { label: 'RATING MÉDIO', value: avgRating.toFixed(1) },
    { label: 'DESEMPENHO', value: overallPerformance(avgRating), small: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {items.map((item, i) => {
        const meta = CARDS_META[i];
        const Icon = meta.icon;
        return (
          <div
            key={item.label}
            className="glass-panel flex items-center gap-3 rounded-xl px-4 py-3"
          >
            <div className={`h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center ${meta.glow}`}>
              <Icon className={meta.color} size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold tracking-wide">{item.label}</p>
              <p className={`font-tech font-extrabold text-white ${item.small ? 'text-sm' : 'text-xl'}`}>
                {item.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
