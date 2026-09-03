import { useMemo, useState } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { useMatchStore } from '../store/matchStore';
import type { Lineup } from '../types/stats';
import { saveMatchStaff, ApiError, type SaveMatchPayload } from '../lib/api';

interface Props {
  onClose: () => void;
}

interface UniquePlayer {
  key: string; // "role__name", só pra usar como key do React
  role: string;
  name: string;
}

// Monta a lista de jogadores ÚNICOS que apareceram em qualquer set de um
// roster (isso já cobre substituições — quem entrou como sub também ganha
// um campo pra digitar o Discord ID dele).
function collectUniquePlayers(sideSets: Record<number, Lineup[]>, format: number): UniquePlayer[] {
  const seen = new Map<string, UniquePlayer>();
  for (let setNumber = 1; setNumber <= format; setNumber++) {
    for (const lineup of sideSets[setNumber] ?? []) {
      const key = `${lineup.role}__${lineup.player}`;
      if (!seen.has(key)) {
        seen.set(key, { key, role: lineup.role, name: lineup.player });
      }
    }
  }
  return Array.from(seen.values());
}

// Um bloco de "cargo do time" + grade de jogadores com campo de Discord ID.
// Reaproveitado duas vezes (casa e visitante) pra não duplicar JSX.
function TeamRosterFields({
  label,
  teamName,
  roleId,
  onRoleIdChange,
  players,
  discordIds,
  onDiscordIdChange,
}: {
  label: string;
  teamName: string;
  roleId: string;
  onRoleIdChange: (v: string) => void;
  players: UniquePlayer[];
  discordIds: Record<string, string>;
  onDiscordIdChange: (name: string, v: string) => void;
}) {
  return (
    <div className="mb-5 rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="font-tech text-xs font-bold tracking-wide text-primary mb-3">
        {label} · {teamName}
      </p>

      <label className="text-[10px] text-slate-500 font-semibold">ID DO CARGO NO DISCORD</label>
      <input
        value={roleId}
        onChange={(e) => onRoleIdChange(e.target.value)}
        placeholder="ID do cargo"
        className="w-full mt-1 mb-4 rounded-lg bg-black/40 border border-primary/25 px-3 py-2 text-sm outline-none focus:border-primary"
      />

      {players.length === 0 ? (
        <p className="text-xs text-slate-500">
          Nenhum jogador com estatística lançada ainda nesse lado. Preencha os cards primeiro.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {players.map((p) => (
            <div key={p.key}>
              <label className="text-[10px] text-slate-500 font-semibold">
                {p.role.toUpperCase()} · {p.name}
              </label>
              <input
                value={discordIds[p.name] ?? ''}
                onChange={(e) => onDiscordIdChange(p.name, e.target.value)}
                placeholder="ID do Discord"
                className="w-full mt-1 rounded-lg bg-black/40 border border-primary/25 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StaffSaveModal({ onClose }: Props) {
  const { sets, format, setScores, teamHomeName, teamAwayName } = useMatchStore();

  const homePlayers = useMemo(() => collectUniquePlayers(sets.home, format), [sets.home, format]);
  const awayPlayers = useMemo(() => collectUniquePlayers(sets.away, format), [sets.away, format]);

  const [teamHomeRoleId, setTeamHomeRoleId] = useState('');
  const [teamAwayRoleId, setTeamAwayRoleId] = useState('');
  const [homeDiscordIds, setHomeDiscordIds] = useState<Record<string, string>>({});
  const [awayDiscordIds, setAwayDiscordIds] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const allFilled =
    teamHomeRoleId.trim() !== '' &&
    teamAwayRoleId.trim() !== '' &&
    homePlayers.every((p) => (homeDiscordIds[p.name] ?? '').trim() !== '') &&
    awayPlayers.every((p) => (awayDiscordIds[p.name] ?? '').trim() !== '');

  function buildLineupsPayload(
    sideSets: Record<number, Lineup[]>,
    setNumber: number,
    discordIds: Record<string, string>
  ) {
    return (sideSets[setNumber] ?? []).map((lineup) => ({
      role: lineup.role,
      player_name: lineup.player,
      discord_id: (discordIds[lineup.player] ?? '').trim(),
      is_substitute: Boolean(lineup.subInfo),
      stats: {
        pontos_feitos: lineup.stats.pontosFeitos,
        pontos_tomados: lineup.stats.pontosTomados,
        block: lineup.stats.block,
        assistencias: lineup.stats.assistencias,
        erro_ofensivo: lineup.stats.erroOfensivo,
        erro_defensivo: lineup.stats.erroDefensivo,
      },
    }));
  }

  async function handleSubmit() {
    if (!allFilled) return;
    setStatus('saving');
    setErrorMessage('');

    const payload: SaveMatchPayload = {
      format,
      team_home_role_id: teamHomeRoleId.trim(),
      team_away_role_id: teamAwayRoleId.trim(),
      sets: Array.from({ length: format }, (_, i) => i + 1).map((setNumber) => ({
        set_number: setNumber,
        score_home: setScores[setNumber]?.home ?? 0,
        score_away: setScores[setNumber]?.away ?? 0,
        home_lineups: buildLineupsPayload(sets.home, setNumber, homeDiscordIds),
        away_lineups: buildLineupsPayload(sets.away, setNumber, awayDiscordIds),
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
            <TeamRosterFields
              label="TIME DA CASA"
              teamName={teamHomeName}
              roleId={teamHomeRoleId}
              onRoleIdChange={setTeamHomeRoleId}
              players={homePlayers}
              discordIds={homeDiscordIds}
              onDiscordIdChange={(name, v) => setHomeDiscordIds((prev) => ({ ...prev, [name]: v }))}
            />

            <TeamRosterFields
              label="TIME ADVERSÁRIO"
              teamName={teamAwayName}
              roleId={teamAwayRoleId}
              onRoleIdChange={setTeamAwayRoleId}
              players={awayPlayers}
              discordIds={awayDiscordIds}
              onDiscordIdChange={(name, v) => setAwayDiscordIds((prev) => ({ ...prev, [name]: v }))}
            />

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