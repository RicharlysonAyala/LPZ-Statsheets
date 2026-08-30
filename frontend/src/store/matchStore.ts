import { create } from 'zustand';
import type { Lineup, Role, StatFields } from '../types/stats';
import { EMPTY_STATS } from '../types/stats';

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultLineup(role: Role, player: string): Lineup {
  return { id: makeId(), role, player, stats: { ...EMPTY_STATS } };
}

const DEFAULT_ROSTER: [Role, string][] = [
  ['Ponteiro', 'Jogador 1'],
  ['Oposto', 'Jogador 2'],
  ['Líbero', 'Jogador 3'],
  ['Ds Spiker', 'Jogador 4'],
  ['Ds Tsk', 'Jogador 5'],
  ['Setter', 'Jogador 6'],
];

interface MatchState {
  format: 3 | 5;
  activeSet: number; // 1..5, ou 0 para representar a aba FINAL
  scoreHome: number;
  scoreAway: number;
  teamHomeName: string;
  teamAwayName: string;
  sets: Record<number, Lineup[]>; // set_number -> escalação/estatísticas daquele set

  setActiveSet: (n: number) => void;
  setFormat: (f: 3 | 5) => void;
  incrementField: (setNumber: number, lineupId: string, field: keyof StatFields) => void;
  decrementField: (setNumber: number, lineupId: string, field: keyof StatFields) => void;
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
  scoreHome: 0,
  scoreAway: 0,
  teamHomeName: 'Time A',
  teamAwayName: 'Time B',
  sets: buildInitialSets(),

  setActiveSet: (n) => set({ activeSet: n }),
  setFormat: (f) => set({ format: f }),

  incrementField: (setNumber, lineupId, field) => {
    const sets = { ...get().sets };
    sets[setNumber] = sets[setNumber].map((l) =>
      l.id === lineupId ? { ...l, stats: { ...l.stats, [field]: l.stats[field] + 1 } } : l
    );
    set({ sets });
  },

  decrementField: (setNumber, lineupId, field) => {
    const sets = { ...get().sets };
    sets[setNumber] = sets[setNumber].map((l) =>
      l.id === lineupId
        ? { ...l, stats: { ...l.stats, [field]: Math.max(0, l.stats[field] - 1) } }
        : l
    );
    set({ sets });
  },

  substitutePlayer: (role, outPlayer, inPlayer, applyToSets) => {
    const sets = { ...get().sets };
    applyToSets.forEach((setNumber) => {
      sets[setNumber] = sets[setNumber].map((l) =>
        l.role === role && l.player === outPlayer
          ? {
              ...defaultLineup(role, inPlayer),
              subInfo: `SUB SET ${setNumber}: ${outPlayer} → ${inPlayer}`,
            }
          : l
      );
    });
    set({ sets });
  },

  resetSet: (setNumber) => {
    const sets = { ...get().sets };
    sets[setNumber] = DEFAULT_ROSTER.map(([role, player]) => defaultLineup(role, player));
    set({ sets });
  },
}));
