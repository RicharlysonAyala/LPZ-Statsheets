import { create } from 'zustand';
import type { Lineup, Role, StatFields } from '../types/stats';
import { EMPTY_STATS } from '../types/stats';

export type TeamSide = 'home' | 'away';

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultLineup(role: Role, player: string): Lineup {
  return { id: makeId(), role, player, stats: { ...EMPTY_STATS } };
}

const DEFAULT_ROSTER: [Role, string][] = [
  ['Ponteiro', 'Jogador 1'],
  ['Setter', 'Jogador 2'],
  ['Oposto', 'Jogador 3'],
  ['Ds Spiker', 'Jogador 4'],
  ['Líbero', 'Jogador 5'],
  ['Ds Tsk', 'Jogador 6'],
];

interface MatchState {
  format: 3 | 5;
  activeSet: number; // 1..5, ou 0 = aba FINAL
  activeTeamSide: TeamSide;
  setScores: Record<number, { home: number; away: number }>;
  teamHomeName: string;
  teamAwayName: string;
  sets: {
    home: Record<number, Lineup[]>;
    away: Record<number, Lineup[]>;
  };

  setActiveSet: (n: number) => void;
  setFormat: (f: 3 | 5) => void;
  toggleTeamSide: () => void;
  setTeamName: (side: TeamSide, name: string) => void;
  incrementField: (setNumber: number, lineupId: string, field: keyof StatFields) => void;
  decrementField: (setNumber: number, lineupId: string, field: keyof StatFields) => void;
  setField: (setNumber: number, lineupId: string, field: keyof StatFields, value: number) => void;
  renamePlayer: (setNumber: number, lineupId: string, newName: string) => void;
  clearPlayerStats: (setNumber: number, lineupId: string) => void;
  setScore: (setNumber: number, side: 'home' | 'away', value: number) => void;
  substitutePlayer: (
    role: Role,
    outPlayer: string,
    inPlayer: string,
    applyToSets: number[]
  ) => void;
  resetSet: (setNumber: number) => void;
}

function buildInitialSets(): Record<number, Lineup[]> {
  const sets: Record<number, Lineup[]> = {};
  for (let i = 1; i <= 5; i++) {
    sets[i] = DEFAULT_ROSTER.map(([role, player]) => defaultLineup(role, player));
  }
  return sets;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  format: 3,
  activeSet: 1,
  activeTeamSide: 'home',
  setScores: {
    1: { home: 0, away: 0 },
    2: { home: 0, away: 0 },
    3: { home: 0, away: 0 },
    4: { home: 0, away: 0 },
    5: { home: 0, away: 0 },
  },
  teamHomeName: 'Time Casa',
  teamAwayName: 'Time Visitante',
  sets: {
    home: buildInitialSets(),
    away: buildInitialSets(),
  },

  setActiveSet: (n) => set({ activeSet: n }),

  setFormat: (f) => set({ format: f }),

  toggleTeamSide: () =>
    set({ activeTeamSide: get().activeTeamSide === 'home' ? 'away' : 'home' }),

  setTeamName: (side, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (side === 'home') set({ teamHomeName: trimmed });
    else set({ teamAwayName: trimmed });
  },

  incrementField: (setNumber, lineupId, field) => {
    const side = get().activeTeamSide;
    const sideSets = { ...get().sets[side] };
    sideSets[setNumber] = sideSets[setNumber].map((l) =>
      l.id === lineupId
        ? { ...l, stats: { ...l.stats, [field]: l.stats[field] + 1 } }
        : l
    );
    set({ sets: { ...get().sets, [side]: sideSets } });
  },

  decrementField: (setNumber, lineupId, field) => {
    const side = get().activeTeamSide;
    const sideSets = { ...get().sets[side] };
    sideSets[setNumber] = sideSets[setNumber].map((l) =>
      l.id === lineupId
        ? {
            ...l,
            stats: {
              ...l.stats,
              [field]: Math.max(0, l.stats[field] - 1),
            },
          }
        : l
    );
    set({ sets: { ...get().sets, [side]: sideSets } });
  },

  setField: (setNumber, lineupId, field, value) => {
    const side = get().activeTeamSide;
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    const sideSets = { ...get().sets[side] };
    sideSets[setNumber] = sideSets[setNumber].map((l) =>
      l.id === lineupId ? { ...l, stats: { ...l.stats, [field]: safeValue } } : l
    );
    set({ sets: { ...get().sets, [side]: sideSets } });
  },

  /**
   * RENAME = correção de nome da mesma pessoa.
   * Propaga para TODOS os sets do mesmo lado onde aquele role ainda tem o nome antigo.
   * Assim "Jogador 1" → "tone" some de todos os sets e o modal Staff não duplica.
   */
  renamePlayer: (setNumber, lineupId, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const side = get().activeTeamSide;
    const sideSets = { ...get().sets[side] };
    const target = sideSets[setNumber]?.find((l) => l.id === lineupId);
    if (!target) return;

    const oldName = target.player;
    const role = target.role;
    if (oldName === trimmed) return;

    // Atualiza todos os sets 1..5 desse lado
    for (let i = 1; i <= 5; i++) {
      sideSets[i] = (sideSets[i] ?? []).map((l) =>
        l.role === role && l.player === oldName ? { ...l, player: trimmed } : l
      );
    }

    set({ sets: { ...get().sets, [side]: sideSets } });
  },

  clearPlayerStats: (setNumber, lineupId) => {
    const side = get().activeTeamSide;
    const sideSets = { ...get().sets[side] };
    sideSets[setNumber] = sideSets[setNumber].map((l) =>
      l.id === lineupId ? { ...l, stats: { ...EMPTY_STATS } } : l
    );
    set({ sets: { ...get().sets, [side]: sideSets } });
  },

  setScore: (setNumber, side, value) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    const setScores = { ...get().setScores };
    setScores[setNumber] = { ...setScores[setNumber], [side]: safeValue };
    set({ setScores });
  },

  /**
   * SUB = troca de pessoa (identidade nova) nos sets escolhidos.
   * Sets não selecionados mantêm o jogador antigo (é intencional).
   */
  substitutePlayer: (role, outPlayer, inPlayer, applyToSets) => {
    const side = get().activeTeamSide;
    const sideSets = { ...get().sets[side] };
    applyToSets.forEach((setNumber) => {
      sideSets[setNumber] = sideSets[setNumber].map((l) =>
        l.role === role && l.player === outPlayer
          ? {
              ...defaultLineup(role, inPlayer),
              subInfo: `SUB SET ${setNumber}: ${outPlayer} → ${inPlayer}`,
            }
          : l
      );
    });
    set({ sets: { ...get().sets, [side]: sideSets } });
  },

  resetSet: (setNumber) => {
    const side = get().activeTeamSide;
    const sideSets = { ...get().sets[side] };
    sideSets[setNumber] = DEFAULT_ROSTER.map(([role, player]) => defaultLineup(role, player));
    const setScores = { ...get().setScores, [setNumber]: { home: 0, away: 0 } };
    set({ sets: { ...get().sets, [side]: sideSets }, setScores });
  },
}));