import { Link, useParams } from "react-router-dom";
import { useTask, usePredictEta } from "@/hooks/queries";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Panel, SectionTitle, ProgressBar, Skeleton, ErrorState, KeyValue } from "@/components/ui";
import { StatusPill, ProvenanceTag } from "@/components/badges";
import { WhatWhyAction } from "@/components/WhatWhyAction";
import { cx, pct, timeOf } from "@/lib/format";
import { IconChevron, IconWeather, IconBolt } from "@/components/icons";
import type { TaskEvent } from "@/api/types";

export default function TaskDetail() {
  const { id = "" } = useParams();
  const task = useTask(id);
  const predict = usePredictEta();
  const { etaUpdates } = useWebSocket();

  const t = task.data;
  const predicted = etaUpdates[id]?.predicted_eta ?? t?.predicted_eta;
  const moved = t && predicted && predicted !== t.original_eta;

  return (
    <div className="space-y-6">
      <Link to="/tasks" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <IconChevron className="rotate-180" width={14} height={14} /> All tasks
      </Link>

      {task.isLoading ? (
        <Skeleton className="h-40" />
      ) : task.isError || !t ? (
        <ErrorState onRetry={() => task.refetch()} message="This task could not be loaded." />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-xs text-fg-faint">{t.id}</span>
                <StatusPill label={t.state.replace("_", " ")} tone={t.state === "AT_RISK" ? "warn" : t.state === "COMPLETED" ? "ok" : "info"} />
                <span className="chip bg-ink-500/70 text-fg-muted ring-1 ring-line">{t.type}</span>
              </div>
              <h2 className="h-display text-2xl text-fg">{t.title}</h2>
              <p className="mt-1 text-sm text-fg-muted">Site {t.site_id} · Machine {t.machine_id} · Priority {t.priority}</p>
            </div>
            <button className="btn-primary" disabled={predict.isPending} onClick={() => predict.mutate(id)}>
              <IconBolt width={16} height={16} /> {predict.isPending ? "Predicting…" : "Re-predict ETA"}
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Panel>
                <SectionTitle eyebrow="Progress" title="Task completion" />
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="font-display text-3xl text-fg">{pct(t.progress)}</span>
                  <span className="text-sm text-fg-muted">complete</span>
                </div>
                <ProgressBar value={t.progress} tone={t.state === "AT_RISK" ? "warning" : "cat"} className="h-3" />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <KeyValueTile label="Scheduled start" value={timeOf(t.scheduled_start)} />
                  <KeyValueTile label="Original ETA" value={timeOf(t.original_eta)} />
                  <KeyValueTile label="Predicted ETA" value={predicted ? timeOf(predicted) : "—"} accent={moved ? "text-sev-warning" : "text-fg"} />
                </div>
              </Panel>

              {(moved || predict.data) && (
                <Panel>
                  <SectionTitle eyebrow="Explainable ETA" title="Why the estimate changed" right={<ProvenanceTag provenance={predict.data?.provenance ?? t.eta_provenance} />} />
                  <WhatWhyAction
                    tone={moved ? "warning" : "info"}
                    explanation={
                      predict.data?.explanation ?? {
                        what: `ETA moved from ${timeOf(t.original_eta)} to ${predicted ? timeOf(predicted) : "—"}.`,
                        why: t.delay_reason ?? "Environmental conditions changed the average cycle time.",
                        action: "No action needed; monitor site conditions.",
                      }
                    }
                  />
                  {predict.data?.fallback_used && (
                    <p className="mt-3 text-xs text-sev-warning">
                      ML model unavailable — this estimate is a rule-based fallback (historical average).
                    </p>
                  )}
                </Panel>
              )}

              <Panel>
                <SectionTitle eyebrow="Timeline" title="Task events" />
                <Timeline events={t.events} />
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel>
                <SectionTitle eyebrow="Environment" title="Site conditions" right={<IconWeather className="text-fg-faint" />} />
                <div className="space-y-1">
                  <KeyValue k="Condition" v={t.environment.condition} />
                  <KeyValue k="Temperature" v={`${t.environment.temperature_c} °C`} />
                  <KeyValue k="Rainfall" v={<span className={t.environment.rainfall_mm > 3 ? "text-sev-warning" : ""}>{t.environment.rainfall_mm} mm</span>} />
                  <KeyValue k="Visibility" v={<span className={t.environment.visibility_km < 5 ? "text-sev-warning" : ""}>{t.environment.visibility_km} km</span>} />
                  <KeyValue k="Wind" v={`${t.environment.wind_kph} kph`} />
                  <KeyValue k="Humidity" v={`${t.environment.humidity_pct}%`} />
                </div>
                {t.delay_reason && (
                  <div className="mt-4 rounded-lg border border-sev-warning/30 bg-sev-warning/10 px-3 py-2 text-xs text-sev-warning">
                    {t.delay_reason}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KeyValueTile({ label, value, accent = "text-fg" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-600/50 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-fg-faint">{label}</div>
      <div className={cx("font-display text-lg tabular-nums", accent)}>{value}</div>
    </div>
  );
}

function Timeline({ events }: { events: TaskEvent[] }) {
  const kindColor = (k: TaskEvent["kind"]) =>
    k === "ETA" ? "bg-sev-warning" : k === "SAFETY" ? "bg-sev-high" : k === "STATE" ? "bg-cat" : "bg-fg-faint";
  return (
    <ol className="relative ml-2 space-y-4 border-l border-line pl-6">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className={cx("absolute -left-[1.72rem] top-1 h-3 w-3 rounded-full ring-4 ring-ink-700", kindColor(e.kind))} />
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-fg-faint">{timeOf(e.timestamp)}</span>
            <span className="text-sm text-fg">{e.label}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
