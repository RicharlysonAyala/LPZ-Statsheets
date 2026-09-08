import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Lock, Pencil, RefreshCw } from 'lucide-react';
import {
  fetchTeam,
  fetchTeamMatches,
  fetchTeamRoster,
  staffUpdateTeam,
  isStaffUnlocked,
  setStaffKey,
  type TeamCard,
  type MatchHistoryRow,
  type RosterPlayer,
} from '../lib/api';
import Header from '../components/Header';

const REGION = 'SA';
const SEASON = 'Season 5';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState<TeamCard | null>(null);
  const [matches, setMatches] = useState<MatchHistoryRow[]>([]);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [staffOpen, setStaffOpen] = useState(false);

  async function reload(force = false) {
    if (!teamId) return;
    setLoading(true);
    setError('');
    try {
      // Paralelo: não espera um acabar pra começar o outro
      // force=true ignora cache (botão Atualizar)
      const [t, m, r] = await Promise.all([
        fetchTeam(teamId, { force }),
        fetchTeamMatches(teamId, { force }),
        fetchTeamRoster(teamId, { force }),
      ]);
      setTeam(t);
      setMatches(m);
      setRoster(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar time');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (loading && !team) {
    return (
      <div className="ambient-field min-h-screen p-6 text-muted">Carregando…</div>
    );
  }

  return (
    <div className="ambient-field min-h-screen">
      <div className="ambient-inner mx-auto max-w-[1100px] space-y-6 p-4 md:p-6">
        <Header />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('/teams')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-primary"
          >
            <ArrowLeft size={14} /> Times
          </button>

          <button
            type="button"
            onClick={() => reload(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-muted hover:text-primary"
            title="Ignora cache e busca de novo"
          >
            <RefreshCw size={12} /> Atualizar
          </button>
        </div>

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        {team && (
          <>
            <div className="hud-panel-hero flex flex-wrap items-center gap-5 rounded-[22px] p-5">
              {team.logo_url ? (
                <img src={team.logo_url} alt="" className="h-20 w-20 object-contain" />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black"
                  style={{ background: `${team.primary_color}33`, color: team.primary_color }}
                >
                  {team.name.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-tech text-3xl font-extrabold tracking-wide text-ink">
                  {team.name.toUpperCase()}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {REGION} — {SEASON}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  {team.division && (
                    <span
                      className="rounded px-2 py-0.5 font-bold"
                      style={{
                        background: `${team.primary_color}22`,
                        color: team.primary_color,
                      }}
                    >
                      {team.division}
                    </span>
                  )}
                  <span>{team.player_count} players</span>
                  {team.captain && <span>· Cap: {team.captain.nickname}</span>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStaffOpen(true)}
                className="btn-press flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary"
              >
                {isStaffUnlocked() ? <Pencil size={14} /> : <Lock size={14} />}
                Staff
              </button>
            </div>

            <div>
              <h2 className="font-tech mb-3 text-xs font-bold tracking-[0.2em] text-muted">
                MATCH HISTORY
              </h2>
              <div className="hud-panel overflow-hidden rounded-[18px]">
                <div className="hidden grid-cols-[80px_1fr_90px_1fr_70px_24px] gap-2 border-b border-white/5 px-4 py-2 text-[10px] font-bold tracking-wide text-muted md:grid">
                  <span>ROUND</span>
                  <span>OPPONENT</span>
                  <span>RESULT</span>
                  <span>SETS</span>
                  <span>DIV</span>
                  <span />
                </div>
                {matches.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-muted">
                    Nenhuma partida salva ainda.
                  </p>
                )}
                {matches.map((row) => (
                  <Link
                    key={row.match_id}
                    to={`/matches/${row.match_id}`}
                    className="grid grid-cols-1 gap-2 border-b border-white/5 px-4 py-3 text-sm transition-colors hover:bg-white/[0.03] md:grid-cols-[80px_1fr_90px_1fr_70px_24px] md:items-center"
                  >
                    <span className="text-xs font-bold text-muted">{row.round_label}</span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="text-[10px] text-muted">vs</span>
                      {row.opponent.logo_url ? (
                        <img
                          src={row.opponent.logo_url}
                          alt=""
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold"
                          style={{ background: `${row.opponent.primary_color}33` }}
                        >
                          {row.opponent.name.slice(0, 1)}
                        </span>
                      )}
                      <span className="truncate font-semibold text-ink">
                        {row.opponent.name}
                      </span>
                    </span>
                    <span
                      className={`font-tech text-sm font-bold ${
                        row.result.won
                          ? 'text-success'
                          : row.result.lost
                            ? 'text-danger'
                            : 'text-muted'
                      }`}
                    >
                      {row.result.won ? 'W' : row.result.lost ? 'L' : '—'} {row.result.score}
                    </span>
                    <span className="truncate text-xs text-muted">
                      {row.sets_detail || '—'}
                    </span>
                    <span className="text-xs font-bold text-primary">{row.division}</span>
                    <ChevronRight size={16} className="justify-self-end text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {staffOpen && team && (
          <StaffTeamModal
            team={team}
            roster={roster}
            onClose={() => setStaffOpen(false)}
            onSaved={() => {
              setStaffOpen(false);
              reload(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

function StaffTeamModal({
  team,
  roster,
  onClose,
  onSaved,
}: {
  team: TeamCard;
  roster: RosterPlayer[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [key, setKey] = useState('');
  const [logo, setLogo] = useState(team.logo_url ?? '');
  const [color, setColor] = useState(team.primary_color ?? '#38bdf8');
  const [division, setDivision] = useState(team.division ?? '');
  const [captainId, setCaptainId] = useState(team.captain?.id ?? '');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const unlocked = isStaffUnlocked();

  async function unlock() {
    setStaffKey(key);
    setErr('');
  }

  async function save() {
    setSaving(true);
    setErr('');
    try {
      await staffUpdateTeam(team.id, {
        logo_url: logo,
        primary_color: color,
        division,
        captain_player_id: captainId || null,
      });
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="hud-panel w-full max-w-md rounded-2xl p-5">
        <h3 className="font-tech mb-3 text-lg font-bold text-ink">Staff · {team.name}</h3>

        {!unlocked ? (
          <>
            <p className="mb-2 text-xs text-muted">Digite a STAFF_SECRET para editar.</p>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="mb-3 w-full rounded-lg border border-primary/25 bg-black/40 px-3 py-2 text-sm"
              placeholder="Staff key"
            />
            <button
              type="button"
              onClick={unlock}
              className="w-full rounded-lg bg-gradient-to-r from-primary to-cyan py-2 text-sm font-bold text-[#03121f]"
            >
              Desbloquear
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-muted">LOGO URL</label>
            <input
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full rounded-lg border border-primary/25 bg-black/40 px-3 py-2 text-sm"
              placeholder="https://..."
            />
            <label className="block text-[10px] font-bold text-muted">COR</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg bg-transparent"
            />
            <label className="block text-[10px] font-bold text-muted">DIVISÃO (DIV)</label>
            <input
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full rounded-lg border border-primary/25 bg-black/40 px-3 py-2 text-sm"
              placeholder="DIV 1"
            />
            <label className="block text-[10px] font-bold text-muted">CAPITÃO</label>
            <select
              value={captainId}
              onChange={(e) => setCaptainId(e.target.value)}
              className="w-full rounded-lg border border-primary/25 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {roster.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="w-full rounded-lg bg-gradient-to-r from-primary to-cyan py-2 text-sm font-bold text-[#03121f] disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        )}

        {err && <p className="mt-2 text-xs text-danger">{err}</p>}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-xs text-muted hover:text-ink"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}