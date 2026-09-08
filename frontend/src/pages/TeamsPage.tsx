import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { fetchTeams, type TeamCard } from '../lib/api';
import Header from '../components/Header';

const REGION = 'SA';
const SEASON = 'Season 5';

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="ambient-field min-h-screen">
      <div className="ambient-inner mx-auto max-w-[1400px] space-y-5 p-4 md:p-6">
        <Header />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              to="/"
              className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-primary"
            >
              <ArrowLeft size={14} /> Statsheet
            </Link>
            <h2 className="font-tech text-2xl font-extrabold tracking-wide text-ink text-glow">
              TIMES
            </h2>
            <p className="text-xs text-muted">
              {REGION} — {SEASON}
            </p>
          </div>
        </div>

        {loading && <p className="text-sm text-muted">Carregando times…</p>}
        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teams.map((t) => (
            <Link
              key={t.id}
              to={`/teams/${t.id}`}
              className="hud-panel hud-panel-interactive group flex flex-col overflow-hidden rounded-[20px] border border-white/10"
              style={{ boxShadow: `0 0 0 1px ${t.primary_color}33` }}
            >
              <div className="flex items-center justify-between px-4 pt-3">
                <p className="font-tech text-sm font-bold tracking-wide text-ink truncate">
                  {t.name.toUpperCase()}
                </p>
                <span className="text-[10px] text-muted whitespace-nowrap">
                  {t.player_count} players
                </span>
              </div>

              <div className="flex flex-1 items-center justify-center px-4 py-8">
                {t.logo_url ? (
                  <img
                    src={t.logo_url}
                    alt={t.name}
                    className="max-h-28 max-w-full object-contain"
                  />
                ) : (
                  <div
                    className="flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-black text-white/80"
                    style={{ background: `${t.primary_color}33` }}
                  >
                    {t.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-white/5 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  {t.captain?.discord_avatar_url ? (
                    <img
                      src={t.captain.discord_avatar_url}
                      alt=""
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <Users size={14} className="text-muted" />
                  )}
                  <span className="truncate text-xs text-muted">
                    {t.captain?.nickname ?? 'Sem capitão'}
                  </span>
                </div>
                {t.division && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: `${t.primary_color}22`,
                      color: t.primary_color,
                    }}
                  >
                    {t.division}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {!loading && teams.length === 0 && (
          <p className="text-sm text-muted">
            Nenhum time ainda. Vincule times pelo bot do Discord.
          </p>
        )}
      </div>
    </div>
  );
}