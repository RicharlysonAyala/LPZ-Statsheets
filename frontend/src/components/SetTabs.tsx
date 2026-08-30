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
    ...Array.from({ length: setCount }, (_, i) => ({
      key: i + 1,
      label: `SET ${i + 1}`,
    })),
    { key: 'final', label: 'FINAL' },
    { key: 'times', label: 'TIMES' },
  ];

  return (
    <div className="glass-panel flex flex-wrap gap-1.5 rounded-2xl p-1.5">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`font-tech px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all ${
              isActive
                ? 'bg-gradient-to-r from-primary to-cyan text-[#03121f] shadow-[0_0_20px_-4px_rgba(56,189,248,0.8)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
