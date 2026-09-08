import { cacheGet, cacheSet, cacheInvalidatePrefix, CacheKeys } from './cache';

// Configure VITE_API_URL na Vercel (e em frontend/.env no local):
// VITE_API_URL=https://lpz-statsheets.onrender.com
// SEM barra no final.
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(
  /\/$/,
  ''
);

// ---------------------------------------------------------------------------
// Staff key (localStorage)
// ---------------------------------------------------------------------------

export function getStaffKey(): string {
  return localStorage.getItem('lpz_staff_key') ?? '';
}

export function setStaffKey(key: string) {
  localStorage.setItem('lpz_staff_key', key.trim());
}

export function clearStaffKey() {
  localStorage.removeItem('lpz_staff_key');
}

export function isStaffUnlocked(): boolean {
  return getStaffKey().length > 0;
}

// ---------------------------------------------------------------------------
// Tipos — Save partida
// ---------------------------------------------------------------------------

export interface SaveMatchLineupPayload {
  role: string;
  player_name: string;
  discord_id: string;
  is_substitute: boolean;
  stats: {
    pontos_feitos: number;
    pontos_tomados: number;
    block: number;
    assistencias: number;
    erro_ofensivo: number;
    erro_defensivo: number;
  };
}

export interface SaveMatchSetPayload {
  set_number: number;
  score_home: number;
  score_away: number;
  home_lineups: SaveMatchLineupPayload[];
  away_lineups: SaveMatchLineupPayload[];
}

export interface SaveMatchPayload {
  format: 3 | 5;
  team_home_role_id: string;
  team_away_role_id: string;
  round_label?: string;
  sets: SaveMatchSetPayload[];
}

export interface SaveMatchResponse {
  match_id: string;
  status: string;
  winner_team_id: string | null;
  sets_home: number;
  sets_away: number;
}

// ---------------------------------------------------------------------------
// Tipos — Times / Match history
// ---------------------------------------------------------------------------

export interface TeamCard {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  discord_role_id: string | null;
  division: string | null;
  player_count: number;
  captain: {
    id: string;
    nickname: string;
    discord_avatar_url: string | null;
  } | null;
}

export interface MatchHistoryRow {
  match_id: string;
  round_label: string;
  opponent: {
    id: string | null;
    name: string;
    logo_url: string | null;
    primary_color: string;
  };
  result: { won: boolean; lost: boolean; score: string };
  sets_detail: string;
  division: string;
  format: number;
  finished_at: string | null;
}

export interface TeamStaffUpdatePayload {
  logo_url?: string | null;
  primary_color?: string | null;
  division?: string | null;
  captain_player_id?: string | null;
}

export interface RosterPlayer {
  id: string;
  nickname: string;
  discord_id?: string | null;
  discord_avatar_url?: string | null;
}

// ---------------------------------------------------------------------------
// Erros
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Fetch base
// ---------------------------------------------------------------------------

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  const key = getStaffKey();
  if (key) headers.set('X-Staff-Key', key);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      `Não foi possível conectar em ${API_BASE_URL}. Confira VITE_API_URL e se o backend está no ar.`
    );
  }

  if (!res.ok) {
    let detail = `Erro ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') detail = body.detail;
      else if (Array.isArray(body?.detail)) {
        detail = body.detail
          .map((d: { msg?: string }) => d.msg ?? JSON.stringify(d))
          .join(' | ');
      }
    } catch {
      // ignore
    }
    throw new ApiError(detail, res.status);
  }

  // 204 / corpo vazio
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// Salvar partida (Staff) — invalida cache de times/partidas
// ---------------------------------------------------------------------------

export async function saveMatchStaff(payload: SaveMatchPayload): Promise<SaveMatchResponse> {
  const json = (await apiFetch('/matches/save-full', {
    method: 'POST',
    body: JSON.stringify(payload),
  })) as SaveMatchResponse;

  // Partida nova → match history e listas não podem ficar desatualizados
  cacheInvalidatePrefix('teams');
  cacheInvalidatePrefix('matches');

  return json;
}

// ---------------------------------------------------------------------------
// Times (com cache)
// ---------------------------------------------------------------------------

export async function fetchTeams(opts?: { force?: boolean }): Promise<TeamCard[]> {
  if (!opts?.force) {
    const hit = cacheGet<TeamCard[]>(CacheKeys.teams);
    if (hit) return hit;
  }

  const data = (await apiFetch('/teams')) as TeamCard[];
  cacheSet(CacheKeys.teams, data);

  // Popular cache de cada time → abrir detalhe depois da lista não refaz GET
  for (const t of data) {
    cacheSet(CacheKeys.team(t.id), t);
  }

  return data;
}

export async function fetchTeam(id: string, opts?: { force?: boolean }): Promise<TeamCard> {
  const key = CacheKeys.team(id);
  if (!opts?.force) {
    const hit = cacheGet<TeamCard>(key);
    if (hit) return hit;
  }

  const data = (await apiFetch(`/teams/${id}`)) as TeamCard;
  cacheSet(key, data);
  return data;
}

export async function fetchTeamMatches(
  id: string,
  opts?: { force?: boolean }
): Promise<MatchHistoryRow[]> {
  const key = CacheKeys.teamMatches(id);
  if (!opts?.force) {
    const hit = cacheGet<MatchHistoryRow[]>(key);
    if (hit) return hit;
  }

  const data = (await apiFetch(`/teams/${id}/matches`)) as MatchHistoryRow[];
  cacheSet(key, data);
  return data;
}

export async function fetchTeamRoster(
  id: string,
  opts?: { force?: boolean }
): Promise<RosterPlayer[]> {
  const key = CacheKeys.teamRoster(id);
  if (!opts?.force) {
    const hit = cacheGet<RosterPlayer[]>(key);
    if (hit) return hit;
  }

  const data = (await apiFetch(`/teams/${id}/roster`)) as RosterPlayer[];
  cacheSet(key, data);
  return data;
}

export async function fetchMatchStatsheet(matchId: string, opts?: { force?: boolean }) {
  const key = CacheKeys.matchStatsheet(matchId);
  if (!opts?.force) {
    const hit = cacheGet(key);
    if (hit) return hit;
  }

  const data = await apiFetch(`/teams/matches/${matchId}/statsheet`);
  // Jogo já fechado: pode cachear um pouco mais
  cacheSet(key, data, 5 * 60_000);
  return data;
}

export async function staffUpdateTeam(
  id: string,
  payload: TeamStaffUpdatePayload
): Promise<TeamCard> {
  const data = (await apiFetch(`/teams/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })) as TeamCard;

  // Logo / DIV / capitão mudaram → lista e detalhe precisam refrescar
  cacheInvalidatePrefix('teams');

  return data;
}