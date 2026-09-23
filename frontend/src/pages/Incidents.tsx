import { useState } from "react";
import { useIncidents, useCreateIncident, OP, MACHINE } from "@/hooks/queries";
import { Panel, SectionTitle, Skeleton, EmptyState } from "@/components/ui";
import { StatusPill } from "@/components/badges";
import { cx, timeOf } from "@/lib/format";
import { IconAlert, IconClock } from "@/components/icons";
import type { Incident, IncidentTimelineEntry } from "@/api/types";

const TYPES = ["NEAR_MISS", "COLLISION", "ROLLOVER", "EQUIPMENT_DAMAGE", "OTHER"] as const;

export default function Incidents() {
  const incidents = useIncidents();
  const create = useCreateIncident();
  const [type, setType] = useState<(typeof TYPES)[number]>("NEAR_MISS");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Incident | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    const res = await create.mutateAsync({
      machine_id: MACHINE,
      operator_id: OP,
      type,
      description: description.trim(),
      occurred_at: new Date().toISOString(),
    });
    setSelected(res);
    setDescription("");
  };

  const active = selected ?? incidents.data?.[0] ?? null;

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Incidents" title="Report & reconstruct" />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Report form + list */}
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <SectionTitle eyebrow="New report" title="Log an incident" />
            <form onSubmit={submit} className="space-y-3">
              <div>
                <span className="eyebrow mb-1.5 block">Type</span>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cx(
                        "chip border transition-colors",
                        type === t ? "border-cat/50 bg-cat/10 text-cat" : "border-line bg-ink-600 text-fg-muted hover:text-fg",
                      )}
                    >
                      {t.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="eyebrow mb-1.5 block">What happened?</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the event. The system captures telemetry, nearby safety events and weather automatically."
                  className="w-full resize-none rounded-xl border border-line bg-ink-700 px-3 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:border-cat/50 focus:outline-none focus:ring-2 focus:ring-cat/15"
                />
              </div>
              <button className="btn-primary w-full" disabled={create.isPending || !description.trim()}>
                {create.isPending ? "Filing…" : "File incident & reconstruct timeline"}
              </button>
            </form>
          </Panel>

          <Panel>
            <SectionTitle eyebrow="Log" title="Recent incidents" />
            {incidents.isLoading ? (
              <Skeleton className="h-16" />
            ) : (incidents.data?.length ?? 0) === 0 ? (
              <EmptyState title="No incidents logged" icon={<IconAlert />} hint="Filed incidents will be listed here with a reconstructed timeline." />
            ) : (
              <ul className="space-y-2">
                {incidents.data!.map((i) => (
                  <li key={i.id}>
                    <button
                      onClick={() => setSelected(i)}
                      className={cx(
                        "w-full rounded-xl border p-3 text-left transition-colors",
                        active?.id === i.id ? "border-cat/40 bg-cat/5" : "border-line bg-ink-600/50 hover:border-line",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-fg-faint">{i.id}</span>
                        <StatusPill label={i.review_status.replace("_", " ")} tone={i.review_status === "CLOSED" ? "ok" : "warn"} />
                      </div>
                      <p className="mt-1 truncate text-sm text-fg">{i.description}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Reconstruction */}
        <div className="lg:col-span-3">
          <Panel className="min-h-[300px]">
            {active ? (
              <>
                <SectionTitle
                  eyebrow={`${active.id} · ${active.type.replace("_", " ")}`}
                  title="Reconstructed timeline"
                  right={<StatusPill label={active.review_status.replace("_", " ")} tone="warn" />}
                />
                <p className="mb-5 rounded-lg border border-line bg-ink-600/50 px-3 py-2 text-sm text-fg-muted">
                  {active.description}
                </p>
                <div className="eyebrow mb-3">What was happening around {timeOf(active.occurred_at)}</div>
                <ol className="relative ml-2 space-y-4 border-l border-line pl-6">
                  {active.timeline.map((t, i) => (
                    <TimelineRow key={i} entry={t} />
                  ))}
                </ol>
              </>
            ) : (
              <EmptyState title="Select or file an incident" icon={<IconClock />} hint="The system reconstructs telemetry, safety events and weather around the moment it occurred." />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ entry }: { entry: IncidentTimelineEntry }) {
  const color =
    entry.source === "SAFETY" ? "bg-sev-high" : entry.source === "WEATHER" ? "bg-sev-info" : "bg-cat";
  return (
    <li className="relative">
      <span className={cx("absolute -left-[1.72rem] top-1 h-3 w-3 rounded-full ring-4 ring-ink-700", color)} />
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-fg-faint">{timeOf(entry.timestamp)}</span>
        <span className="chip bg-ink-500/70 text-[10px] text-fg-muted ring-1 ring-line">{entry.source}</span>
      </div>
      <p className="mt-0.5 text-sm text-fg">{entry.label}</p>
      {entry.detail && <p className="text-xs text-fg-muted">{entry.detail}</p>}
    </li>
  );
}
