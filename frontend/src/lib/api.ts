// Configure VITE_API_URL na Vercel (e em frontend/.env no local):
// VITE_API_URL=https://lpz-statsheets.onrender.com
// SEM barra no final.
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

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
  const url = `${API_BASE_URL}/matches/save-full`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Erro de rede / CORS / backend dormindo / URL errada
    const hint =
      err instanceof TypeError
        ? ' (provável CORS, backend dormindo no Render free, ou URL errada)'
        : '';
    throw new ApiError(
      `Não foi possível conectar em ${API_BASE_URL}.${hint} Confira VITE_API_URL e o CORS no backend.`
    );
  }

  if (!res.ok) {
    let detail = `Erro ${res.status} ao salvar a partida.`;
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') detail = body.detail;
      else if (Array.isArray(body?.detail)) {
        detail = body.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join(' | ');
      }
    } catch {
      // ignore
    }
    throw new ApiError(detail, res.status);
  }

  return res.json();
}