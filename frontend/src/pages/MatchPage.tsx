import { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import Scoreboard from '../components/Scoreboard';
import SetTabs from '../components/SetTabs';
import type { TabKey } from '../components/SetTabs';
import IndicatorsBar from '../components/IndicatorsBar';
import MistakeInfoBar from '../components/MistakeInfoBar';
import PlayerStatCard from '../components/PlayerStatCard';
import SubstitutionModal from '../components/SubstitutionModal';
import FinalTable from '../components/FinalTable';
import { useMatchStore } from '../store/matchStore';
import type { Role, StatFields } from '../types/stats';

export default function MatchPage() {
  const [activeTab, setActiveTab] = useState<TabKey>(1);
  const printArmId = useMatchStore((s) => s.printArmId);
  const prevPrintArmId = useRef(0);
  const {
    sets,
    activeTeamSide,
    teamHomeName,
    teamAwayName,
    incrementField,
    decrementField,
    setField,
    renamePlayer,
    clearPlayerStats,
    activeSet: storeSet,
    setActiveSet,
  } = useMatchStore();

  const [subTarget, setSubTarget] = useState<{ role: Role; player: string } | null>(null);

  const currentSetNumber = typeof activeTab === 'number' ? activeTab : storeSet;
  // Sempre lê do roster do time ATIVO (o botão TROCAR muda isso).
  const currentLineups = sets[activeTeamSide][currentSetNumber] ?? [];
  const activeTeamName = activeTeamSide === 'home' ? teamHomeName : teamAwayName;

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    if (typeof tab === 'number') setActiveSet(tab);
  }

  // Quando o Scoreboard pede print, força a aba FINAL e libera a captura
  useEffect(() => {
    if (printArmId === 0 || printArmId === prevPrintArmId.current) return;
    prevPrintArmId.current = printArmId;

    const previousTab = activeTab;
    setActiveTab('final');

    let cancelled = false;

    (async () => {
      // 2 frames + delay curto: React pinta a tabela FINAL
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      await new Promise((r) => setTimeout(r, 80));
      if (cancelled) return;

      window.dispatchEvent(new CustomEvent('lpz-print-ready'));

      // Devolve a aba depois do capture (o Scoreboard espera ~mesmo tempo)
      window.setTimeout(() => {
        if (!cancelled) setActiveTab(previousTab);
      }, 1200);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printArmId]);

  return (
    <div className="ambient-field">
      <div
        id="statsheet-root"
        className="ambient-inner mx-auto min-h-screen max-w-[1400px] space-y-4 p-4 md:space-y-5 md:p-6"
      >
        <Header />
        <Scoreboard />
        <SetTabs active={activeTab} onChange={handleTabChange} />

        {typeof activeTab === 'number' && (
          <>
            <div className="flex items-center gap-2 px-1 whitespace-nowrap">
              <span className={`h-2 w-2 rounded-full ${activeTeamSide === 'home' ? 'bg-primary' : 'bg-magenta'}`} style={{ boxShadow: '0 0 8px currentColor' }} />
              <p className="font-tech whitespace-nowrap text-xs font-bold tracking-[0.18em] text-slate-300">
                ESCALAÇÃO: {activeTeamName.toUpperCase()}
              </p>
            </div>

            <IndicatorsBar lineups={currentLineups} />

            <div className="stagger-in grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {currentLineups.map((lineup) => (
                <PlayerStatCard
                  key={lineup.id}
                  lineup={lineup}
                  onInc={(field: keyof StatFields) =>
                    incrementField(currentSetNumber, lineup.id, field)
                  }
                  onDec={(field: keyof StatFields) =>
                    decrementField(currentSetNumber, lineup.id, field)
                  }
                  onSet={(field: keyof StatFields, value: number) =>
                    setField(currentSetNumber, lineup.id, field, value)
                  }
                  onRename={(newName: string) =>
                    renamePlayer(currentSetNumber, lineup.id, newName)
                  }
                  onClear={() => clearPlayerStats(currentSetNumber, lineup.id)}
                  onOpenSub={() => setSubTarget({ role: lineup.role, player: lineup.player })}
                />
              ))}
            </div>

            <MistakeInfoBar />
          </>
        )}

        {activeTab === 'final' && (
          <>
            <div className="flex items-center gap-2 px-1">
              <span className={`h-2 w-2 rounded-full ${activeTeamSide === 'home' ? 'bg-primary' : 'bg-magenta'}`} style={{ boxShadow: '0 0 8px currentColor' }} />
              <p className="font-tech whitespace-nowrap text-xs font-bold tracking-[0.18em] text-slate-300">
                FINAL: {activeTeamName.toUpperCase()}
              </p>
            </div>
            <IndicatorsBar lineups={currentLineups} />
            <FinalTable />
            <MistakeInfoBar />
          </>
        )}

        {activeTab === 'times' && (
          <div className="hud-panel rounded-[22px] px-6 py-14 text-center">
            <p className="font-tech text-sm font-bold tracking-wide text-ink">TIMES</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Lista de times, match history e statsheets salvas.
            </p>
            <a
              href="/teams"
              className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-primary to-cyan px-5 py-2.5 text-sm font-bold text-[#03121f]"
            >
              Abrir aba Times
            </a>
          </div>
        )}

        {subTarget && (
          <SubstitutionModal
            role={subTarget.role}
            outPlayer={subTarget.player}
            activeSet={currentSetNumber}
            onClose={() => setSubTarget(null)}
          />
        )}
      </div>
    </div>
  );
}