import { useMachine, useMachineHealth, useTelemetry, useFuel } from "@/hooks/queries";
import { useWebSocket } from "@/hooks/useWebSocket";
import { HealthRing } from "@/components/HealthRing";
import { WhatWhyAction } from "@/components/WhatWhyAction";
import { StaleBanner } from "@/components/status";
import { Panel, SectionTitle, Skeleton, KeyValue } from "@/components/ui";
import { ProvenanceTag, StatusPill } from "@/components/badges";
import { cx, healthColor } from "@/lib/format";
import { IconTemp, IconGauge, IconFuel, IconExcavator } from "@/components/icons";
import type { HealthSignal, HealthState } from "@/api/types";

const stateTone: Record<HealthState, "ok" | "warn" | "danger"> = {
  NORMAL: "ok",
  WARNING: "warn",
  DEGRADED: "danger",
  CRITICAL: "danger",
};

export default function MachineHealth() {
  const machine = useMachine();
  const health = useMachineHealth();
  const telemetry = useTelemetry();
  const fuel = useFuel();
  const { telemetryStale } = useWebSocket();

  const stale = telemetryStale || telemetry.data?.stale;
  const h = health.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="eyebrow mb-1">Machine health</div>
          <h2 className="h-display flex items-center gap-2 text-2xl text-fg">
            <IconExcavator className="text-cat" />
            {machine.data ? `${machine.data.model} · ${machine.data.id}` : "…"}
          </h2>
        </div>
        {machine.data && <StatusPill label={machine.data.status} tone={machine.data.status === "OPERATING" ? "ok" : "muted"} />}
      </div>

      {stale && <StaleBanner ageSeconds={telemetry.data?.last_update_age_seconds ?? 134} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="flex flex-col items-center justify-center lg:col-span-1">
          {health.isLoading || !h ? (
            <Skeleton className="h-44 w-44 rounded-full" />
          ) : (
            <>
              <HealthRing score={h.health_score} state={h.state} size={200} />
              <div className="mt-4 flex items-center gap-2">
                <StatusPill label={`${h.state} state`} tone={stateTone[h.state]} />
                <ProvenanceTag provenance={h.provenance} />
              </div>
              <p className="mt-2 text-center text-xs text-fg-muted">
                Composite score from {h.signals.length} monitored signals
              </p>
            </>
          )}
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionTitle eyebrow="Signals" title="Live machine signals" />
          {health.isLoading || !h ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {h.signals.map((s) => (
                <SignalTile key={s.name} signal={s} dimmed={stale} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {h && (
        <Panel>
          <SectionTitle eyebrow="Assessment" title="What the machine is telling you" right={<ProvenanceTag provenance={h.provenance} />} />
          <WhatWhyAction explanation={h.explanation} tone={h.state === "NORMAL" ? "info" : "warning"} />
        </Panel>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Panel>
          <SectionTitle eyebrow="Telemetry" title="Latest reading" right={<IconGauge className="text-fg-faint" />} />
          {telemetry.data?.rows[0] && !stale ? (
            <div className="space-y-1">
              <KeyValue k="Engine hours" v={telemetry.data.rows[0].engine_hours} />
              <KeyValue k="Engine load" v={`${Math.round(telemetry.data.rows[0].engine_load * 100)}%`} />
              <KeyValue k="Fuel used (shift)" v={`${telemetry.data.rows[0].fuel_used} L`} />
              <KeyValue k="Load cycles" v={telemetry.data.rows[0].load_cycles} />
              <KeyValue k="Idle time" v={`${telemetry.data.rows[0].idle_time} min`} />
              <KeyValue k="Seatbelt" v={<span className={telemetry.data.rows[0].seatbelt_status === "UNFASTENED" ? "text-sev-high" : "text-ok"}>{telemetry.data.rows[0].seatbelt_status}</span>} />
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-fg-muted">
              No live reading — telemetry feed is unavailable. Last known state shown above is not live.
            </p>
          )}
        </Panel>

        <Panel>
          <SectionTitle eyebrow="Fuel & idle" title="Consumption" right={<IconFuel className="text-fg-faint" />} />
          {fuel.data && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Metric label="L / hour" value={fuel.data.fuel_per_hour} />
                <Metric label="L / cycle" value={fuel.data.fuel_per_cycle} />
                <Metric label="Idle est." value={`${fuel.data.idle_fuel_estimate} L`} />
              </div>
              <div className="mt-4">
                <WhatWhyAction explanation={fuel.data.insight} provenance={fuel.data.provenance} tone="warning" />
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

function SignalTile({ signal, dimmed }: { signal: HealthSignal; dimmed?: boolean }) {
  const icon =
    signal.name.includes("temp") ? <IconTemp width={16} height={16} /> :
    signal.name.includes("fuel") ? <IconFuel width={16} height={16} /> :
    <IconGauge width={16} height={16} />;
  return (
    <div className={cx("rounded-xl border bg-ink-600/60 p-3 transition-opacity", dimmed && "opacity-50", signal.state === "NORMAL" ? "border-line" : "border-sev-warning/30")}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="truncate text-[11px] uppercase tracking-wide text-fg-faint">{signal.name.replace(/_/g, " ")}</span>
        <span className={healthColor(signal.state)}>{icon}</span>
      </div>
      <div className={cx("font-display text-xl tabular-nums", healthColor(signal.state))}>
        {signal.value}
        <span className="ml-0.5 text-xs font-medium text-fg-muted">{signal.unit}</span>
      </div>
      <div className={cx("mt-1 text-[10px] font-semibold uppercase tracking-wide", healthColor(signal.state))}>{signal.state}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-ink-600/50 px-3 py-2 text-center">
      <div className="font-display text-lg text-fg">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-fg-faint">{label}</div>
    </div>
  );
}
