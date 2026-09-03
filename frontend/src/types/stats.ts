// Papéis (posições) suportados pelo sistema
export type Role =
  | 'Ponteiro'
  | 'Setter'
  | 'Oposto'
  | 'Ds Spiker'
  | 'Líbero'
  | 'Ds Tsk';

// Campos de estatística que existem (nem todo papel usa todos)
export interface StatFields {
  pontosFeitos: number;
  pontosTomados: number; // não existe para Setter (usa "block")
  block: number; // só Setter
  assistencias: number; // Setter e Ds Tsk
  erroOfensivo: number;
  erroDefensivo: number;
}

export const EMPTY_STATS: StatFields = {
  pontosFeitos: 0,
  pontosTomados: 0,
  block: 0,
  assistencias: 0,
  erroOfensivo: 0,
  erroDefensivo: 0,
};

// Quais campos aparecem no card de cada papel, na ordem visual
export const ROLE_FIELDS: Record<Role, (keyof StatFields)[]> = {
  Ponteiro: ['pontosFeitos', 'pontosTomados', 'erroOfensivo', 'erroDefensivo'],
  Oposto: ['pontosFeitos', 'pontosTomados', 'erroOfensivo', 'erroDefensivo'],
  Líbero: ['pontosFeitos', 'pontosTomados', 'erroOfensivo', 'erroDefensivo'],
  'Ds Spiker': ['pontosFeitos', 'pontosTomados', 'erroOfensivo', 'erroDefensivo'],
  'Ds Tsk': ['assistencias', 'pontosFeitos', 'pontosTomados', 'erroOfensivo', 'erroDefensivo'],
  Setter: ['assistencias', 'block', 'pontosFeitos', 'erroOfensivo', 'erroDefensivo'],
};

export const FIELD_LABELS: Record<keyof StatFields, string> = {
  pontosFeitos: 'Pontos Feitos',
  pontosTomados: 'Pontos Tomados',
  block: 'Block',
  assistencias: 'Assistências',
  erroOfensivo: 'Erro Ofensivo',
  erroDefensivo: 'Erro Defensivo',
};

export interface Lineup {
  id: string; // id único do "slot" (papel + jogador no set atual)
  role: Role;
  player: string;
  stats: StatFields;
  subInfo?: string; // ex: "SUB SET 1: Dren -> zlucky"
}

export interface SubstitutionRecord {
  role: Role;
  outPlayer: string;
  inPlayer: string;
  appliesToSets: number[]; // ex: [1,2,3]
}
