import { useWorkZone } from "@/hooks/queries";
import { ProximityRadar } from "@/components/ProximityRadar";
import { Panel, SectionTitle, Skeleton } from "@/components/ui";
import { ProvenanceTag, StatusPill } from "@/components/badges";
import { cx } from "@/lib/format";
import { IconWorker, IconTruck, IconExcavator, IconShield } from "@/components/icons";
import type { ZoneEntity } from "@/api/types";

const KIND_ICON = (k: ZoneEntity["kind"]) =>
  k === "WORKER" ? <IconWorker width={16} height={16} /> :
  k === "VEHICLE" ? <IconTruck width={16} height={16} /> :
  k === "MACHINE" ? <IconExcavator width={16} height={16} /> :
  <IconShield width={16} height={16} />;

export default function WorkZone() {
  const zone = useWorkZone();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle eyebrow="Live work zone" title="Proximity & geofencing" />
        {zone.data && <ProvenanceTag provenance={zone.data.provenance} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <SectionTitle
            eyebrow={`Safety threshold · ${zone.data?.threshold_m ?? 5} m`}
            title="Top-down proximity radar"
          />
          {zone.isLoading || !zone.data ? (
            <div className="grid place-items-center py-10">
              <Skeleton className="h-72 w-72 rounded-full" />
            </div>
          ) : (
            <ProximityRadar zone={zone.data} />
          )}
        </Panel>

        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <SectionTitle eyebrow="Tracked" title="Objects in range" />
            {zone.isLoading || !zone.data ? (
              <div className="space-y-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : (
              <ul className="space-y-2">
                {zone.data.entities
                  .filter((e) => e.kind !== "MACHINE")
                  .sort((a, b) => (a.distance_m ?? 99) - (b.distance_m ?? 99))
                  .map((e) => {
                    const breach = (e.distance_m ?? 99) <= zone.data!.threshold_m;
                    return (
                      <li
                        key={e.id}
                        className={cx(
                          "flex items-center gap-3 rounded-xl border bg-ink-600/50 p-3",
                          breach ? "border-sev-critical/40 bg-sev-critical/5" : "border-line",
                        )}
                      >
                        <span className={cx("grid h-9 w-9 place-items-center rounded-lg", breach ? "bg-sev-critical/15 text-sev-critical" : "bg-ink-500 text-fg-muted")}>
                          {KIND_ICON(e.kind)}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-fg">{e.label}</div>
                          <div className="text-[11px] uppercase tracking-wide text-fg-faint">{e.kind}</div>
                        </div>
                        <div className="text-right">
                          <div className={cx("font-display text-lg tabular-nums", breach ? "text-sev-critical" : "text-fg")}>
                            {e.distance_m?.toFixed(1)}
                            <span className="text-xs text-fg-muted">m</span>
                          </div>
                          {breach && <StatusPill label="In zone" tone="danger" />}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </Panel>

          <div className="rounded-xl border border-line bg-ink-700/60 p-4 text-xs leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">How this works.</span> Positions are a simulated proximity feed
            (real sensors would replace it 1:1). When an object crosses the {zone.data?.threshold_m ?? 5} m ring, a
            deterministic rule raises a <span className="text-sev-high">HIGH</span> safety alert — no model decides
            whether it's dangerous.
          </div>
        </div>
      </div>
    </div>
  );
}
