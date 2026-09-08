import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchMatchStatsheet } from '../lib/api';
import Header from '../components/Header';

export default function MatchStatsheetPage() {
  const { matchId } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!matchId) return;
    fetchMatchStatsheet(matchId)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [matchId]);

  return (
    <div className="ambient-field min-h-screen">
      <div className="ambient-inner mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
        <Header />
        <Link to={-1 as any} className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary">
          <ArrowLeft size={14} /> Voltar
        </Link>
        {error && <p className="text-xs text-danger">{error}</p>}
        {!data && !error && <p className="text-sm text-muted">Carregando statsheet…</p>}
        {data && (
          <>
            <div className="hud-panel-hero rounded-[22px] p-5 text-center">
              <p className="text-xs text-muted">{data.round_label ?? 'Partida'}</p>
              <h1 className="font-tech mt-1 text-xl font-extrabold text-ink">
                {data.team_home?.name ?? 'Home'} × {data.team_away?.name ?? 'Away'}
              </h1>
              <p className="mt-1 text-sm text-muted">MD{data.format}</p>
            </div>
            {data.sets?.map((s: any) => (
              <div key={s.set_number} className="hud-panel rounded-[18px] p-4">
                <p className="font-tech mb-3 text-xs font-bold text-primary">
                  SET {s.set_number} — {s.score_home}×{s.score_away}
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {s.lineups?.map((l: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted">{l.role}</p>
                        <p className="font-semibold text-ink">{l.player?.nickname}</p>
                      </div>
                      <p className="font-tech font-bold text-primary">{l.rating?.toFixed?.(1) ?? l.rating}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}