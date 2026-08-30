import { useMatchStore } from '../store/matchStore';

export type TabKey = number | 'final' | 'times';

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export default function SetTabs({ active, onChange }: Props) {
  const format = useMatchStore((s) => s.format);
  const setCount = format === 5 ? 5 : 3;

  const tabs: { key: TabKey; label: string }[] = [
    ...Array.from({ length: setCount }, (_, i) => ({ key: i + 1, label: `SET ${i + 1}` })),
    { key: 'final', label: 'FINAL' },
    { key: 'times', label: 'TIMES' },
  ];

  return (
    <div className="hud-panel flex flex-wrap gap-1 rounded-[18px] p-1.5" role="tablist" aria-label="Sets da partida">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={String(tab.key)}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`btn-press min-h-11 flex-1 font-tech px-4 py-2 rounded-xl text-xs font-bold tracking-wider ${
              isActive
                ? 'bg-gradient-to-r from-primary to-cyan text-[#03121f] shadow-[0_0_20px_-4px_rgba(56,189,248,0.7)]'
                : 'text-muted hover:bg-white/5 hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}