import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAcknowledgeAlert } from "@/hooks/queries";
import { SeverityBadge } from "./badges";
import { IconAlert, IconCheck, IconX } from "./icons";
import { cx, SEVERITY_META } from "@/lib/format";

/**
 * Global safety overlay. When a HIGH/CRITICAL alert arrives over the WebSocket,
 * it surfaces above everything — safety is never buried under analytics. The
 * operator acknowledges here or from the Safety Center; both write an audit
 * record via the REST endpoint (never over WS).
 */
export function CriticalAlertOverlay() {
  const { alerts, acknowledge } = useWebSocket();
  const ack = useAcknowledgeAlert();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const active = alerts.find(
    (a) => (a.severity === "HIGH" || a.severity === "CRITICAL") && a.status === "ACTIVE" && !dismissed.has(a.id),
  );

  // Best-effort haptic nudge on new critical alert.
  useEffect(() => {
    if (active && "vibrate" in navigator) navigator.vibrate?.(120);
  }, [active?.id]);

  if (!active) return null;
  const m = SEVERITY_META[active.severity];

  const onAck = () => {
    acknowledge(active.id);
    ack.mutate({ id: active.id });
    setDismissed((s) => new Set(s).add(active.id));
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-4">
      <div
        className={cx(
          "pointer-events-auto w-full max-w-2xl animate-slide-up overflow-hidden rounded-2xl border bg-ink-800/95 shadow-pop backdrop-blur",
          m.ring,
          "ring-1",
        )}
      >
        <div className={cx("h-1 w-full", m.dot)} />
        <div className="flex items-start gap-4 p-4">
          <div className={cx("relative grid h-11 w-11 shrink-0 place-items-center rounded-xl", m.bg, m.text)}>
            <span className={cx("absolute inset-0 animate-pulse-ring rounded-xl", m.dot)} />
            <IconAlert width={22} height={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={active.severity} />
              <span className="eyebrow">Safety alert</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-fg">{active.summary}</p>
            {active.recommended_action && (
              <p className="mt-0.5 text-xs text-fg-muted">
                <span className="font-semibold text-fg">Action · </span>
                {active.recommended_action}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2">
            <button className="btn-primary text-sm" onClick={onAck} disabled={ack.isPending}>
              <IconCheck width={16} height={16} /> Acknowledge
            </button>
            <button
              className="inline-flex items-center justify-center gap-1 text-xs text-fg-faint hover:text-fg-muted"
              onClick={() => setDismissed((s) => new Set(s).add(active.id))}
            >
              <IconX width={13} height={13} /> Snooze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
