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
    <div className="min-h-screen text-white p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <Header />
      <Scoreboard />
      <SetTabs active={activeTab} onChange={handleTabChange} />

      {typeof activeTab === 'number' && (
        <>
          <IndicatorsBar lineups={currentLineups} />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
        <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
          Em breve: histórico de jogos e desempenho por time.
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
  );
}
