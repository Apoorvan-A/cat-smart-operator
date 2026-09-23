import type { HealthState } from "@/api/types";

const stateColor: Record<HealthState, string> = {
  NORMAL: "#22C55E",
  WARNING: "#F5A623",
  DEGRADED: "#F97316",
  CRITICAL: "#EF4444",
};

/** Radial machine-health gauge. Glanceable: colour + score + state word. */
export function HealthRing({ score, state, size = 168 }: { score: number; state: HealthState; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, score)) * c;
  const color = stateColor[state];

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E2431" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-4xl tabular-nums text-fg">{Math.round(score * 100)}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color }}>
          {state}
        </span>
      </div>
    </div>
  );
}
