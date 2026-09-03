import { useMemo, useState } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { useMatchStore } from '../store/matchStore';
import { saveMatchStaff, ApiError, type SaveMatchPayload } from '../lib/api';

interface Props {
  onClose: () => void;
}

interface UniquePlayer {
  key: string; // "role__name", só pra usar como key do React
  role: string;
  name: string;
}

export default function StaffSaveModal({ onClose }: Props) {
  const { sets, format, setScores } = useMatchStore();

  // Monta a lista de jogadores ÚNICOS que apareceram em qualquer set da
  // partida (isso já cobre substituições — se alguém entrou como sub,
  // ele também ganha um campo pra digitar o Discord ID dele).
  const uniquePlayers = useMemo<UniquePlayer[]>(() => {
    const seen = new Map<string, UniquePlayer>();
    for (let setNumber = 1; setNumber <= format; setNumber++) {
      for (const lineup of sets[setNumber] ?? []) {
        const key = `${lineup.role}__${lineup.player}`;
        if (!seen.has(key)) {
          seen.set(key, { key, role: lineup.role, name: lineup.player });
        }
      }
    }
    return Array.from(seen.values());
  }, [sets, format]);

  const [teamHomeRoleId, setTeamHomeRoleId] = useState('');
  const [teamAwayRoleId, setTeamAwayRoleId] = useState('');
  const [discordIds, setDiscordIds] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const allFilled =
    teamHomeRoleId.trim() !== '' &&
    teamAwayRoleId.trim() !== '' &&
    uniquePlayers.every((p) => (discordIds[p.name] ?? '').trim() !== '');

  function updateDiscordId(name: string, value: string) {
    setDiscordIds((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    if (!allFilled) return;
    setStatus('saving');
    setErrorMessage('');

    const payload: SaveMatchPayload = {
      format,
      team_home_role_id: teamHomeRoleId.trim(),
      team_away_role_id: teamAwayRoleId.trim(),
      player_discord_ids: Object.fromEntries(
        Object.entries(discordIds).map(([name, id]) => [name, id.trim()])
      ),
      sets: Array.from({ length: format }, (_, i) => i + 1).map((setNumber) => ({
        set_number: setNumber,
        score_home: setScores[setNumber]?.home ?? 0,
        score_away: setScores[setNumber]?.away ?? 0,
        lineups: (sets[setNumber] ?? []).map((lineup) => ({
          role: lineup.role,
          player_name: lineup.player,
          is_substitute: Boolean(lineup.subInfo),
          stats: {
            pontos_feitos: lineup.stats.pontosFeitos,
            pontos_tomados: lineup.stats.pontosTomados,
            block: lineup.stats.block,
            assistencias: lineup.stats.assistencias,
            erro_ofensivo: lineup.stats.erroOfensivo,
            erro_defensivo: lineup.stats.erroDefensivo,
          },
        })),
      })),
    };

    try {
      await saveMatchStaff(payload);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível conectar ao servidor.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel glow-border w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-tech text-xl font-extrabold text-white text-glow">SALVAR PARTIDA (STAFF)</h2>
            <p className="text-xs text-slate-400">
              Isso grava a partida de verdade no banco de dados e conta pra liga.
            </p>
          </div>
          <button onClick={onClose} className="text-danger hover:opacity-70">
            <X size={20} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle2 className="text-success" size={40} />
            <p className="font-tech font-bold text-success">Partida salva com sucesso!</p>
            <button
              onClick={onClose}
              className="mt-2 rounded-lg bg-gradient-to-r from-primary to-cyan px-4 py-2 text-sm font-bold text-[#03121f]"
            >
              FECHAR
            </button>
          </div>
        ) : (
          <>
            {/* IDs de cargo dos dois times */}
            <p className="text-slate-400 text-xs font-bold mb-2 tracking-wide">TIMES QUE JOGARAM (ID DO CARGO)</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold">TIME DA CASA</label>
                <input
                  value={teamHomeRoleId}
                  onChange={(e) => setTeamHomeRoleId(e.target.value)}
                  placeholder="ID do cargo no Discord"
                  className="w-full mt-1 rounded-lg bg-black/40 border border-primary/25 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold">TIME ADVERSÁRIO</label>
                <input
                  value={teamAwayRoleId}
                  onChange={(e) => setTeamAwayRoleId(e.target.value)}
                  placeholder="ID do cargo no Discord"
                  className="w-full mt-1 rounded-lg bg-black/40 border border-primary/25 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* IDs de Discord de cada jogador que apareceu na partida */}
            <p className="text-slate-400 text-xs font-bold mb-2 tracking-wide">
              JOGADORES (ID DO DISCORD DE CADA UM)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              {uniquePlayers.map((p) => (
                <div key={p.key}>
                  <label className="text-[10px] text-slate-500 font-semibold">
                    {p.role.toUpperCase()} · {p.name}
                  </label>
                  <input
                    value={discordIds[p.name] ?? ''}
                    onChange={(e) => updateDiscordId(p.name, e.target.value)}
                    placeholder="ID do Discord"
                    className="w-full mt-1 rounded-lg bg-black/40 border border-primary/25 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>

            {status === 'error' && (
              <p className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {errorMessage}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-danger/40 text-danger py-2 text-sm font-bold hover:bg-danger/10"
              >
                CANCELAR
              </button>
              <button
                onClick={handleSubmit}
                disabled={!allFilled || status === 'saving'}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-cyan text-[#03121f] py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_-4px_rgba(56,189,248,0.8)] transition-shadow"
              >
                {status === 'saving' && <Loader2 size={16} className="animate-spin" />}
                CONFIRMAR E SALVAR
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}