import { useHandover } from "@/hooks/queries";
import { Panel, SectionTitle, Skeleton, StatTile } from "@/components/ui";
import { SeverityBadge, StatusPill } from "@/components/badges";
import { cx, timeOf } from "@/lib/format";
import { IconCheck, IconClock, IconHeart, IconShield, IconFuel, IconHandover } from "@/components/icons";

export default function Handover() {
  const handover = useHandover();
  const h = handover.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionTitle eyebrow="Shift handover" title="End-of-shift summary" />
        {h && (
          <div className="text-right text-xs text-fg-muted">
            Auto-generated {timeOf(h.generated_at)} · Shift {h.shift_id}
          </div>
        )}
      </div>

      {handover.isLoading || !h ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Tasks completed" value={h.tasks_completed.length} icon={<IconCheck width={16} height={16} />} sub={`${h.tasks_remaining.length} remaining`} />
            <StatTile
              label="Machine health"
              value={Math.round(h.machine_health.health_score * 100)}
              accent={h.machine_health.state === "NORMAL" ? "text-ok" : "text-sev-warning"}
              icon={<IconHeart width={16} height={16} />}
              sub={h.machine_health.state}
            />
            <StatTile label="Safety events" value={h.safety_events.count} icon={<IconShield width={16} height={16} />} sub={`Highest: ${h.safety_events.highest}`} />
            <StatTile label="Fuel used" value={h.fuel_used_l} unit="L" icon={<IconFuel width={16} height={16} />} sub="This shift" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <SectionTitle eyebrow="Work" title="Tasks" />
              <div className="space-y-4">
                <div>
                  <div className="eyebrow mb-2 text-ok/80">Completed</div>
                  <ul className="space-y-2">
                    {h.tasks_completed.map((t) => (
                      <li key={t.id} className="flex items-center gap-2 rounded-lg border border-line bg-ink-600/50 px-3 py-2">
                        <IconCheck width={15} height={15} className="text-ok" />
                        <span className="font-mono text-xs text-fg-faint">{t.id}</span>
                        <span className="text-sm text-fg">{t.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="eyebrow mb-2">Remaining</div>
                  <ul className="space-y-2">
                    {h.tasks_remaining.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-ink-600/50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <IconClock width={15} height={15} className="text-fg-faint" />
                          <span className="font-mono text-xs text-fg-faint">{t.id}</span>
                          <span className="text-sm text-fg">{t.title}</span>
                        </div>
                        <StatusPill label={t.state.replace("_", " ")} tone={t.state === "AT_RISK" ? "warn" : "muted"} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>

            <div className="space-y-6">
              <Panel>
                <SectionTitle eyebrow="Attention" title="Abnormal behavior" />
                <ul className="space-y-2">
                  {h.abnormal_behavior.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-lg border border-sev-warning/25 bg-sev-warning/5 px-3 py-2 text-sm text-fg">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sev-warning" />
                      {b}
                    </li>
                  ))}
                </ul>
              </Panel>

              {h.maintenance_recommendation && (
                <Panel>
                  <SectionTitle eyebrow="Maintenance" title="Recommendation" />
                  <div className="flex items-start gap-3 rounded-lg border border-sev-info/25 bg-sev-info/5 px-3 py-3">
                    <SeverityBadge severity="INFO" />
                    <p className="text-sm text-fg">{h.maintenance_recommendation}</p>
                  </div>
                </Panel>
              )}

              <Panel>
                <SectionTitle eyebrow="Next operator" title="Pending actions" right={<IconHandover className="text-fg-faint" />} />
                <ol className="space-y-2">
                  {h.pending_actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-lg border border-line bg-ink-600/50 px-3 py-2">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cat/15 text-[11px] font-bold text-cat">{i + 1}</span>
                      <span className="text-sm text-fg">{a}</span>
                    </li>
                  ))}
                </ol>
              </Panel>
            </div>
          </div>

          <div className={cx("rounded-xl border border-line bg-ink-700/60 px-4 py-3 text-xs text-fg-muted")}>
            Machine <span className="text-fg">{h.machine_id}</span> handed over by{" "}
            <span className="text-fg">{h.operator.name}</span> in{" "}
            <span className={h.machine_health.state === "NORMAL" ? "text-ok" : "text-sev-warning"}>{h.machine_health.state}</span> health. A new operator can resume from the pending actions above.
          </div>
        </>
      )}
    </div>
  );
}
