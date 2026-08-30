import { useState } from 'react';
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
  const { sets, incrementField, decrementField, activeSet: storeSet, setActiveSet } =
    useMatchStore();

  const [subTarget, setSubTarget] = useState<{ role: Role; player: string } | null>(null);

  const currentSetNumber = typeof activeTab === 'number' ? activeTab : storeSet;
  const currentLineups = sets[currentSetNumber] ?? [];

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    if (typeof tab === 'number') setActiveSet(tab);
  }

  return (
    <div className="ambient-field">
      <div className="ambient-inner mx-auto min-h-screen max-w-[1400px] space-y-4 p-4 md:space-y-5 md:p-6">
        <Header />
        <Scoreboard />
        <SetTabs active={activeTab} onChange={handleTabChange} />

        {typeof activeTab === 'number' && (
          <>
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
                  onOpenSub={() => setSubTarget({ role: lineup.role, player: lineup.player })}
                />
              ))}
            </div>

            <MistakeInfoBar />
          </>
        )}

        {activeTab === 'final' && (
          <>
            <IndicatorsBar
              lineups={Object.values(sets).flat().length ? currentLineups : []}
            />
            <FinalTable />
            <MistakeInfoBar />
          </>
        )}

        {activeTab === 'times' && (
          <div className="hud-panel rounded-[22px] px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <circle cx="16" cy="16" r="11" stroke="#38bdf8" strokeWidth="1.6" />
                <path d="M16 5c3.2 2.8 5 6.6 5 11s-1.8 8.2-5 11C12.8 24.2 11 20.4 11 16S12.8 7.8 16 5Z" stroke="#22d3ee" strokeWidth="1.3" />
                <path d="M5.5 16h21M8.4 10.2c4.4 1.6 10.8 1.6 15.2 0M8.4 21.8c4.4-1.6 10.8-1.6 15.2 0" stroke="#7dd3fc" strokeWidth="1.2" />
              </svg>
            </div>
            <p className="font-tech text-sm font-bold tracking-wide text-ink">TIMES</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Em breve: histórico de jogos e desempenho por time.
            </p>
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