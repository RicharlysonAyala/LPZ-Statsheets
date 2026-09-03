// Endereço do backend. Configure a variável de ambiente VITE_API_URL na
// Vercel apontando pro seu backend do Render (ex: https://lpz-statsheets.onrender.com).
// Em desenvolvimento local (npm run dev), crie um arquivo frontend/.env com
// essa mesma variável — o painel de env vars da Vercel NÃO se aplica ao
// "npm run dev" rodando na sua máquina, só ao site publicado.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

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
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/matches/save-full`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Erro de REDE (não chegou nem a receber resposta do servidor).
    // Motivos comuns: URL errada/vazia, backend fora do ar, ou CORS.
    throw new ApiError(
      `Não foi possível conectar em ${API_BASE_URL}. Confira se essa é a URL certa do backend e se ele está no ar.`
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.detail ?? `Erro ${res.status} ao salvar a partida.`, res.status);
  }

  return res.json();
}