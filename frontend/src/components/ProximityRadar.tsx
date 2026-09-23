import type { WorkZone, ZoneEntity } from "@/api/types";
import { cx } from "@/lib/format";

const KIND_STYLE: Record<ZoneEntity["kind"], { fill: string; label: string }> = {
  MACHINE: { fill: "#FFCD11", label: "Machine" },
  WORKER: { fill: "#EF4444", label: "Worker" },
  VEHICLE: { fill: "#3B82F6", label: "Vehicle" },
  RESTRICTED: { fill: "#F97316", label: "Restricted" },
};

/**
 * Simplified top-down work-zone radar. The operator's machine sits at the
 * origin; the yellow ring is the safety threshold. Anything breaching it pulses
 * red. Deliberately schematic — a credible operator view, not a fake GPS map.
 */
export function ProximityRadar({ zone, size = 340 }: { zone: WorkZone; size?: number }) {
  const half = size / 2;
  const maxRange = 16; // metres shown edge-to-edge (radius)
  const scale = (half - 24) / maxRange;
  const thresholdPx = zone.threshold_m * scale;

  const project = (e: ZoneEntity) => ({ cx: half + e.x * scale, cy: half - e.y * scale });
  const breaching = zone.entities.filter((e) => e.kind !== "MACHINE" && (e.distance_m ?? 99) <= zone.threshold_m);

  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} className="mx-auto max-w-[380px]">
        <defs>
          <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#12161F" />
            <stop offset="100%" stopColor="#0B0E14" />
          </radialGradient>
          <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.28" />
          </linearGradient>
        </defs>

        <circle cx={half} cy={half} r={half - 8} fill="url(#radar-bg)" stroke="#232A36" />
        {[0.33, 0.66, 1].map((f) => (
          <circle key={f} cx={half} cy={half} r={(half - 24) * f} fill="none" stroke="#1E2431" strokeDasharray="2 5" />
        ))}
        <line x1={half} y1={16} x2={half} y2={size - 16} stroke="#1E2431" />
        <line x1={16} y1={half} x2={size - 16} y2={half} stroke="#1E2431" />

        {/* rotating sweep */}
        <g className="origin-center animate-sweep" style={{ transformBox: "fill-box" }}>
          <path d={`M ${half} ${half} L ${half} 24 A ${half - 24} ${half - 24} 0 0 1 ${half + (half - 24) * 0.5} ${half - (half - 24) * 0.87} Z`} fill="url(#sweep)" />
        </g>

        {/* safety threshold ring */}
        <circle
          cx={half}
          cy={half}
          r={thresholdPx}
          fill="rgba(255,205,17,0.05)"
          stroke="#FFCD11"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
        <text x={half + thresholdPx - 4} y={half - 6} fill="#C9A21A" fontSize="10" textAnchor="end" className="font-mono">
          {zone.threshold_m} m
        </text>

        {/* entities */}
        {zone.entities.map((e) => {
          const { cx: ex, cy: ey } = project(e);
          const st = KIND_STYLE[e.kind];
          const isBreach = e.kind !== "MACHINE" && (e.distance_m ?? 99) <= zone.threshold_m;
          if (e.kind === "MACHINE") {
            return (
              <g key={e.id}>
                <circle cx={ex} cy={ey} r={9} fill={st.fill} />
                <circle cx={ex} cy={ey} r={9} fill="none" stroke="#0B0E14" strokeWidth={2} />
              </g>
            );
          }
          if (e.kind === "RESTRICTED") {
            return <rect key={e.id} x={ex - 6} y={ey - 6} width={12} height={12} rx={2} fill={st.fill} fillOpacity={0.7} transform={`rotate(45 ${ex} ${ey})`} />;
          }
          return (
            <g key={e.id}>
              {isBreach && <circle cx={ex} cy={ey} r={7} fill={st.fill} className="origin-center animate-pulse-ring" style={{ transformBox: "fill-box" }} />}
              <circle cx={ex} cy={ey} r={6} fill={st.fill} />
              {e.distance_m !== undefined && (
                <text x={ex + 10} y={ey + 3} fill="#93A0B4" fontSize="9" className="font-mono">
                  {e.distance_m.toFixed(1)}m
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-fg-muted">
        {Object.values(KIND_STYLE).map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill }} />
            {s.label}
          </span>
        ))}
      </div>

      {breaching.length > 0 && (
        <div className={cx("mt-3 rounded-lg border border-sev-critical/40 bg-sev-critical/10 px-3 py-2 text-center text-xs font-medium text-sev-critical")}>
          {breaching.length} object inside the {zone.threshold_m} m safety zone
        </div>
      )}
    </div>
  );
}
