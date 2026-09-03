import type { Role, StatFields } from '../types/stats';

const BASE_RATING = 10.0;

type Weights = {
  pf: number; pt: number; eo: number; ed: number; ast: number; blk: number;
};

const WEIGHTS: Record<string, Weights> = {
  default: { pf: 0.8, pt: -0.8, eo: -0.3, ed: -0.3, ast: 0.3, blk: 0.4 },
  Setter: { pf: 1, pt: -0.2, eo: -0.6, ed: -0.5, ast: 0.6, blk: 0.5 },
  'Ds Tsk': { pf: 1, pt: -0.8, eo: -0.6, ed: -0.3, ast: 0.6, blk: 0.0 },
};

export function calculateRating(role: Role, stats: StatFields): number {
  const w = WEIGHTS[role] ?? WEIGHTS.default;
  const totalActions =
    stats.pontosFeitos + stats.pontosTomados + stats.erroOfensivo +
    stats.erroDefensivo + stats.assistencias + stats.block;

  if (totalActions === 0) return 0;

  const raw =
    stats.pontosFeitos * w.pf +
    stats.pontosTomados * w.pt +
    stats.erroOfensivo * w.eo +
    stats.erroDefensivo * w.ed +
    stats.assistencias * w.ast +
    stats.block * w.blk;

  const rating = BASE_RATING + raw;
  return Math.round(Math.min(10, Math.max(0, rating)) * 10) / 10;
}

export function calculateEfficiency(stats: StatFields): number {
  const positivos = stats.pontosFeitos + stats.assistencias + stats.block;
  const negativos = stats.erroOfensivo + stats.erroDefensivo;
  const total = positivos + negativos + stats.pontosTomados;
  if (total === 0) return 0;
  return Math.round((positivos / total) * 1000) / 10;
}

export function consistencyLabel(rating: number): string {
  if (rating === 0) return '—';
  if (rating >= 8) return 'ALTA';
  if (rating >= 5) return 'MÉDIA';
  return 'BAIXA';
}

export function overallPerformance(avgRating: number): string {
  if (avgRating >= 9) return 'EXCELENTE';
  if (avgRating >= 7) return 'BOM';
  if (avgRating >= 5) return 'MÉDIO';
  return 'RUIM';
}
