import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAlerts, useSafetyEvents, useAcknowledgeAlert, keys } from "@/hooks/queries";
import { useWebSocket } from "@/hooks/useWebSocket";
import { AlertCard } from "@/components/AlertCard";
import { Panel, SectionTitle, Skeleton, EmptyState } from "@/components/ui";
import { SeverityBadge, ProvenanceTag } from "@/components/badges";
import { cx, timeOf } from "@/lib/format";
import { IconShield, IconSeatbelt, IconWorker, IconBolt } from "@/components/icons";
import type { SafetyEvent, SafetyEventType } from "@/api/types";

const EVENT_ICON: Partial<Record<SafetyEventType, JSX.Element>> = {
  SEATBELT_UNFASTENED: <IconSeatbelt width={16} height={16} />,
  PROXIMITY_HAZARD: <IconWorker width={16} height={16} />,
  OVERSPEED: <IconBolt width={16} height={16} />,
};

export default function Safety() {
  const alerts = useAlerts();
  const events = useSafetyEvents();
  const ack = useAcknowledgeAlert();
  const qc = useQueryClient();
  const { alerts: liveAlerts, acknowledge } = useWebSocket();

  const escalate = useMutation({
    mutationFn: (id: string) => api.escalateAlert(id, "SUPERVISOR"),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.alerts }),
  });

  const merged = [...(alerts.data ?? []), ...liveAlerts].filter(
    (a, i, arr) => arr.findIndex((x) => x.id === a.id) === i,
  );
  const active = merged.filter((a) => a.status === "ACTIVE" || a.status === "CREATED");
  const resolved = merged.filter((a) => a.status !== "ACTIVE" && a.status !== "CREATED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle eyebrow="Safety center" title="Alerts & safety events" />
        <div className="rounded-xl border border-line bg-ink-700 px-3 py-2 text-xs text-fg-muted">
          Critical safety logic is <span className="font-semibold text-cat">deterministic</span> — rules, not AI.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Alerts */}
        <div className="space-y-6 lg:col-span-3">
          <Panel>
            <SectionTitle
              eyebrow="Requires action"
              title={`Active alerts${active.length ? ` · ${active.length}` : ""}`}
            />
            {alerts.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : active.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-ok/25 bg-ok/5 px-4 py-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ok/15 text-ok">
                  <IconShield />
                </span>
                <div>
                  <p className="font-display text-sm uppercase tracking-wide text-ok">All clear</p>
                  <p className="text-xs text-fg-muted">No active safety alerts on your machine.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {active.map((a) => (
                  <AlertCard
                    key={a.id}
                    alert={a}
                    busy={ack.isPending || escalate.isPending}
                    onAcknowledge={(id) => {
                      acknowledge(id);
                      ack.mutate({ id });
                    }}
                    onEscalate={(id) => escalate.mutate(id)}
                  />
                ))}
              </div>
            )}
          </Panel>

          {resolved.length > 0 && (
            <Panel>
              <SectionTitle eyebrow="Resolved & escalated" title="Alert history" />
              <div className="space-y-3">
                {resolved.map((a) => (
                  <AlertCard key={a.id} alert={a} />
                ))}
              </div>
            </Panel>
          )}
        </div>

        {/* Event feed */}
        <div className="lg:col-span-2">
          <Panel>
            <SectionTitle eyebrow="Audit feed" title="Safety events" />
            {events.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : (events.data?.length ?? 0) === 0 ? (
              <EmptyState title="No safety events" hint="Detected events (seatbelt, proximity, overspeed) appear here." />
            ) : (
              <ol className="space-y-3">
                {events.data!.map((e) => (
                  <EventItem key={e.id} event={e} />
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function EventItem({ event }: { event: SafetyEvent }) {
  return (
    <li className={cx("rounded-xl border bg-ink-600/50 p-3", event.acknowledged ? "border-line" : "border-sev-high/30")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-500 text-fg-muted">
            {EVENT_ICON[event.type] ?? <IconShield width={16} height={16} />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-fg">{event.type.replace(/_/g, " ")}</span>
              <SeverityBadge severity={event.severity} />
            </div>
            <p className="mt-0.5 text-xs text-fg-muted">{event.recommended_action}</p>
          </div>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-fg-faint">{timeOf(event.timestamp)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <ProvenanceTag provenance={event.provenance} />
        <span className={cx("text-[11px] font-semibold", event.acknowledged ? "text-ok" : "text-sev-high")}>
          {event.acknowledged ? "Acknowledged" : "Unacknowledged"}
        </span>
      </div>
    </li>
  );
}
