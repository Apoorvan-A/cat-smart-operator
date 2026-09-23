import type { WsStatus } from "@/hooks/useWebSocket";
import { cx, relAge } from "@/lib/format";

/** Live connection pill — reflects the WebSocket contract's real state. */
export function LiveIndicator({ status }: { status: WsStatus }) {
  const map: Record<WsStatus, { label: string; dot: string; text: string }> = {
    live: { label: "Live", dot: "bg-ok", text: "text-ok" },
    connecting: { label: "Connecting", dot: "bg-sev-warning", text: "text-sev-warning" },
    reconnecting: { label: "Reconnecting", dot: "bg-sev-warning", text: "text-sev-warning" },
    offline: { label: "Offline", dot: "bg-sev-critical", text: "text-sev-critical" },
  };
  const m = map[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-700/70 px-3 py-1.5">
      <span className="relative flex h-2 w-2">
        {status === "live" && <span className={cx("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", m.dot)} />}
        <span className={cx("relative inline-flex h-2 w-2 rounded-full", m.dot)} />
      </span>
      <span className={cx("text-xs font-semibold uppercase tracking-wide", m.text)}>{m.label}</span>
    </span>
  );
}

/**
 * StaleBanner — the fail-safe telemetry state. When the feed is stale we say so
 * plainly and never render fake live values (contract + reliability rule).
 */
export function StaleBanner({ ageSeconds }: { ageSeconds: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sev-warning/40 bg-sev-warning/10 px-4 py-3">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sev-warning opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sev-warning" />
      </span>
      <div className="text-sm">
        <span className="font-semibold text-sev-warning">Telemetry unavailable</span>
        <span className="text-fg-muted"> — last update {relAge(ageSeconds)}. Showing last known state, not live data.</span>
      </div>
    </div>
  );
}
