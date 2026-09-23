import type { Alert } from "@/api/types";
import { SeverityBadge, StatusPill } from "./badges";
import { IconAlert, IconCheck, IconChevron } from "./icons";
import { cx, SEVERITY_META, timeOf } from "@/lib/format";

const statusTone = (s: Alert["status"]) =>
  s === "ACKNOWLEDGED" ? "ok" : s === "ESCALATED" ? "danger" : s === "RESOLVED" ? "muted" : "warn";

export function AlertCard({
  alert,
  onAcknowledge,
  onEscalate,
  busy,
}: {
  alert: Alert;
  onAcknowledge?: (id: string) => void;
  onEscalate?: (id: string) => void;
  busy?: boolean;
}) {
  const m = SEVERITY_META[alert.severity];
  const active = alert.status === "ACTIVE" || alert.status === "CREATED";
  return (
    <div
      className={cx(
        "panel-raised relative overflow-hidden p-4 transition-shadow",
        active && "ring-1",
        active && m.ring,
      )}
    >
      <div className={cx("absolute left-0 top-0 h-full w-1", m.dot)} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cx("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg", m.bg, m.text)}>
            <IconAlert width={18} height={18} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={alert.severity} />
              {alert.count > 1 && (
                <span className="chip bg-ink-500/70 text-fg-muted ring-1 ring-line">×{alert.count} grouped</span>
              )}
              <StatusPill label={alert.status} tone={statusTone(alert.status)} />
            </div>
            <p className="mt-2 text-sm font-medium text-fg">{alert.summary}</p>
            {alert.recommended_action && (
              <p className="mt-1 text-xs text-fg-muted">
                <span className="font-semibold text-fg">Action · </span>
                {alert.recommended_action}
              </p>
            )}
          </div>
        </div>
        {alert.created_at && <span className="shrink-0 font-mono text-xs text-fg-faint">{timeOf(alert.created_at)}</span>}
      </div>

      {active && (onAcknowledge || onEscalate) && (
        <div className="mt-4 flex items-center gap-2 border-t border-line/70 pt-3">
          {onAcknowledge && (
            <button className="btn-primary flex-1 text-sm" disabled={busy} onClick={() => onAcknowledge(alert.id)}>
              <IconCheck width={16} height={16} /> Acknowledge
            </button>
          )}
          {onEscalate && (
            <button className="btn-ghost text-sm" disabled={busy} onClick={() => onEscalate(alert.id)}>
              Escalate <IconChevron width={14} height={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
