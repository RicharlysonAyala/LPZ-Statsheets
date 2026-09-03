// Endereço do backend. Configure a variável de ambiente VITE_API_URL na
// Vercel apontando pro seu backend do Render (ex: https://statssheets-backend.onrender.com).
// Em desenvolvimento local (npm run dev), se não configurar nada, cai no
// localhost:8000, que é onde o "uvicorn app.main:app --reload" roda.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export interface SaveMatchLineupPayload {
  role: string;
  player_name: string;
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
  lineups: SaveMatchLineupPayload[];
}

export interface SaveMatchPayload {
  format: 3 | 5;
  team_home_role_id: string;
  team_away_role_id: string;
  player_discord_ids: Record<string, string>; // nome local do jogador -> Discord ID
  sets: SaveMatchSetPayload[];
}

export interface SaveMatchResponse {
  match_id: string;
  status: string;
  winner_team_id: string | null;
  sets_home: number;
  sets_away: number;
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export async function saveMatchStaff(payload: SaveMatchPayload): Promise<SaveMatchResponse> {
  const res = await fetch(`${API_BASE_URL}/matches/save-full`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.detail ?? `Erro ${res.status} ao salvar a partida.`, res.status);
  }

  return res.json();
}