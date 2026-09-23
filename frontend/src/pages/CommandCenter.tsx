import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useMachine, useMachineHealth, useTasks, useAlerts, useFuel } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { USE_MOCK } from "@/api";
import { runDemoSequence, resetDemo } from "@/api/mock";
import { HealthRing } from "@/components/HealthRing";
import { WhatWhyAction } from "@/components/WhatWhyAction";
import { AlertCard } from "@/components/AlertCard";
import { Panel, SectionTitle, ProgressBar, Skeleton, EmptyState } from "@/components/ui";
import { SeverityBadge, ProvenanceTag, StatusPill } from "@/components/badges";
import { useAcknowledgeAlert } from "@/hooks/queries";
import { cx, healthColor, pct, timeOf } from "@/lib/format";
import {
  IconShield,
  IconHeart,
  IconClock,
  IconSpark,
  IconBolt,
  IconExcavator,
  IconChevron,
  IconClipboard,
  IconFuel,
} from "@/components/icons";

export default function CommandCenter() {
  const { user } = useAuth();
  const machine = useMachine();
  const health = useMachineHealth();
  const tasks = useTasks();
  const alerts = useAlerts();
  const fuel = useFuel();
  const { insight, etaUpdates, alerts: liveAlerts } = useWebSocket();
  const ack = useAcknowledgeAlert();

  const activeAlerts = [...(alerts.data ?? []), ...liveAlerts]
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .filter((a) => a.status === "ACTIVE" || a.status === "CREATED");
  const current = tasks.data?.find((t) => t.state === "IN_PROGRESS" || t.state === "AT_RISK") ?? tasks.data?.[0];
  const etaOverride = current ? etaUpdates[current.id] : undefined;
  const predictedEta = etaOverride?.predicted_eta ?? current?.predicted_eta;
  const etaMoved = current && predictedEta && predictedEta !== current.original_eta;

  const highestSeverity = activeAlerts.reduce<"none" | "warn" | "high">((acc, a) => {
    if (a.severity === "CRITICAL" || a.severity === "HIGH") return "high";
    if (a.severity === "WARNING" && acc === "none") return "warn";
    return acc;
  }, "none");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header + demo control */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-1">{greeting}</div>
          <h2 className="h-display text-2xl text-fg sm:text-3xl">{user?.name?.split(" ")[0] ?? "Operator"}, here's your shift</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-700 px-2.5 py-1">
              <IconExcavator width={16} height={16} className="text-cat" />
              {machine.data ? `${machine.data.model} · ${machine.data.id}` : "…"}
            </span>
            <span className="text-fg-faint">Shift SH-2025-05-01-A · Site A</span>
          </div>
        </div>
        {USE_MOCK && (
          <div className="flex items-center gap-2">
            <button className="btn-ghost text-sm" onClick={() => { resetDemo(); window.location.reload(); }}>
              Reset
            </button>
            <button className="btn-primary text-sm" onClick={() => runDemoSequence()}>
              <IconBolt width={16} height={16} /> Play demo event
            </button>
          </div>
        )}
      </div>

      {/* The four glanceable answers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnswerCard
          question="Am I safe?"
          icon={<IconShield />}
          loading={alerts.isLoading}
          tone={highestSeverity === "high" ? "danger" : highestSeverity === "warn" ? "warn" : "ok"}
          headline={activeAlerts.length === 0 ? "All clear" : `${activeAlerts.length} active alert${activeAlerts.length > 1 ? "s" : ""}`}
          detail={activeAlerts[0]?.summary ?? "No active safety alerts on your machine."}
          to="/safety"
        />
        <AnswerCard
          question="Is my machine healthy?"
          icon={<IconHeart />}
          loading={health.isLoading}
          tone={health.data?.state === "NORMAL" ? "ok" : health.data?.state === "WARNING" ? "warn" : "danger"}
          headline={health.data ? `${health.data.state} · ${Math.round(health.data.health_score * 100)}` : "—"}
          detail={health.data?.explanation.what ?? "Loading machine signals…"}
          to="/machine"
        />
        <AnswerCard
          question="Am I on track?"
          icon={<IconClock />}
          loading={tasks.isLoading}
          tone={etaMoved ? "warn" : "ok"}
          headline={current ? `${pct(current.progress)} · ETA ${predictedEta ? timeOf(predictedEta) : "—"}` : "No task"}
          detail={current ? current.title : "No active task assigned."}
          to={current ? `/tasks/${current.id}` : "/tasks"}
        />
        <AnswerCard
          question="Anything unusual?"
          icon={<IconSpark />}
          loading={fuel.isLoading}
          tone={insight ? "warn" : "ok"}
          headline={insight ? insight.title : "Nominal"}
          detail={insight ? insight.explanation.what : "No abnormal operating patterns detected."}
          to="/analytics"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: current task + intelligence */}
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <SectionTitle
              eyebrow="Current task"
              title={current?.title ?? "No active task"}
              right={current && <StatusPill label={current.state.replace("_", " ")} tone={current.state === "AT_RISK" ? "warn" : "info"} />}
            />
            {tasks.isLoading ? (
              <Skeleton className="h-24" />
            ) : current ? (
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-fg-muted">Progress</span>
                    <span className="font-display text-lg text-fg">{pct(current.progress)}</span>
                  </div>
                  <ProgressBar value={current.progress} tone={current.state === "AT_RISK" ? "warning" : "cat"} />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat label="Priority" value={current.priority} />
                  <MiniStat label="Type" value={current.type} />
                  <MiniStat label="Original ETA" value={timeOf(current.original_eta)} />
                  <MiniStat
                    label="Predicted ETA"
                    value={predictedEta ? timeOf(predictedEta) : "—"}
                    accent={etaMoved ? "text-sev-warning" : "text-fg"}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <ProvenanceTag provenance={current.eta_provenance} />
                  <Link to={`/tasks/${current.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-cat hover:text-cat-bright">
                    Task detail <IconChevron width={14} height={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState title="No active task" hint="Scheduled tasks will appear here when your shift begins." />
            )}
          </Panel>

          {etaMoved && current && (
            <Panel>
              <SectionTitle eyebrow="Why your ETA changed" title="Dynamic task estimate" />
              <WhatWhyAction
                provenance="PREDICTED"
                tone="warning"
                explanation={{
                  what: `ETA moved from ${timeOf(current.original_eta)} to ${predictedEta ? timeOf(predictedEta) : "—"} (+${etaOverride?.delta_minutes ?? 17} min).`,
                  why: "Heavy rainfall increased average cycle time ~12% and cut visibility to 3.1 km.",
                  action: "No action needed; monitor site drainage and keep the bench clear.",
                }}
              />
            </Panel>
          )}

          {insight && (
            <Panel>
              <SectionTitle
                eyebrow="Operating insight"
                title={insight.title}
                right={<SeverityBadge severity={insight.severity} />}
              />
              <WhatWhyAction explanation={insight.explanation} tone="warning" />
            </Panel>
          )}
        </div>

        {/* Right: safety + health snapshot + training */}
        <div className="space-y-6">
          <Panel>
            <SectionTitle eyebrow="Machine" title="Health snapshot" />
            {health.isLoading ? (
              <div className="grid place-items-center py-6">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : health.data ? (
              <div className="flex flex-col items-center gap-4">
                <HealthRing score={health.data.health_score} state={health.data.state} />
                <div className="grid w-full grid-cols-2 gap-2">
                  {health.data.signals.slice(0, 4).map((s) => (
                    <div key={s.name} className="rounded-lg border border-line bg-ink-600/60 px-3 py-2">
                      <div className="truncate text-[11px] uppercase tracking-wide text-fg-faint">{s.name.replace(/_/g, " ")}</div>
                      <div className={cx("font-display text-base tabular-nums", healthColor(s.state))}>
                        {s.value}
                        <span className="ml-0.5 text-[11px] text-fg-muted">{s.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/machine" className="inline-flex items-center gap-1 text-sm font-medium text-cat hover:text-cat-bright">
                  Full machine health <IconChevron width={14} height={14} />
                </Link>
              </div>
            ) : null}
          </Panel>

          <Panel>
            <SectionTitle
              eyebrow="Safety"
              title="Active alerts"
              right={<Link to="/safety" className="text-xs font-medium text-cat hover:text-cat-bright">View all</Link>}
            />
            {activeAlerts.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-ok/25 bg-ok/5 px-4 py-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ok/15 text-ok">
                  <IconShield width={16} height={16} />
                </span>
                <p className="text-sm text-fg-muted">No active safety alerts. You're clear to operate.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.slice(0, 2).map((a) => (
                  <AlertCard key={a.id} alert={a} busy={ack.isPending} onAcknowledge={(id) => ack.mutate({ id })} />
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <SectionTitle eyebrow="Fuel" title="Efficiency" />
            {fuel.data && (
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-600 text-cat">
                  <IconFuel />
                </span>
                <div className="flex-1">
                  <div className="font-display text-xl text-fg">
                    {fuel.data.fuel_per_hour}
                    <span className="ml-1 text-xs font-medium text-fg-muted">L/h</span>
                  </div>
                  <div className="text-xs text-fg-muted">{fuel.data.insight.what}</div>
                </div>
                <ProvenanceTag provenance={fuel.data.provenance} />
              </div>
            )}
          </Panel>

          <Link to="/training" className="block">
            <div className="panel-raised group flex items-center gap-4 p-4 transition-colors hover:border-cat/40">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-cat/15 text-cat">
                <IconClipboard />
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-fg">Recommended training</div>
                <div className="text-xs text-fg-muted">Safe Excavator Operation · 3 proximity alerts recently</div>
              </div>
              <IconChevron className="text-fg-faint transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AnswerCard({
  question,
  icon,
  headline,
  detail,
  tone,
  to,
  loading,
}: {
  question: string;
  icon: ReactNode;
  headline: string;
  detail: string;
  tone: "ok" | "warn" | "danger";
  to: string;
  loading?: boolean;
}) {
  const toneRing = tone === "danger" ? "ring-sev-high/40" : tone === "warn" ? "ring-sev-warning/30" : "ring-ok/25";
  const toneText = tone === "danger" ? "text-sev-high" : tone === "warn" ? "text-sev-warning" : "text-ok";
  const toneBg = tone === "danger" ? "bg-sev-high/12" : tone === "warn" ? "bg-sev-warning/12" : "bg-ok/12";
  return (
    <Link
      to={to}
      className={cx("panel-raised group relative flex flex-col gap-3 p-4 ring-1 transition-all hover:-translate-y-0.5 hover:shadow-pop", toneRing)}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fg-muted">{question}</span>
        <span className={cx("grid h-8 w-8 place-items-center rounded-lg", toneBg, toneText)}>{icon}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <div className={cx("font-display text-xl leading-tight", toneText)}>{headline}</div>
      )}
      <p className="line-clamp-2 text-xs text-fg-muted">{detail}</p>
    </Link>
  );
}

function MiniStat({ label, value, accent = "text-fg" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-600/50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-fg-faint">{label}</div>
      <div className={cx("font-display text-base", accent)}>{value}</div>
    </div>
  );
}
