interface Props {
  value: number;
  size?: number;
}

function ringColor(value: number): string {
  if (value <= 0) return 'rgba(139, 163, 199, 0.35)';
  if (value >= 8) return '#34d399';
  if (value >= 5) return '#fbbf24';
  return '#fb7185';
}

export default function RatingRing({ value, size = 56 }: Props) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  const r = 20;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const color = ringColor(value);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="shrink-0"
      aria-label={`Rating ${value.toFixed(1)}`}
    >
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.25" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 24 24)"
        style={{ transition: 'stroke-dasharray 400ms cubic-bezier(0.22, 1, 0.36, 1)' }}
      />
      <text
        x="24"
        y="24.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#e6f1ff"
        fontSize="11"
        fontWeight="700"
        fontFamily="Oxanium, Manrope, sans-serif"
      >
        {value.toFixed(1)}
      </text>
    </svg>
  );
}