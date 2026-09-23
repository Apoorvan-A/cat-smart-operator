import type { ReactNode } from "react";
import { cx } from "@/lib/format";
import { IconInfo } from "./icons";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("panel p-5", className)}>{children}</section>;
}

export function SectionTitle({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h2 className="h-display text-lg text-fg">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function StatTile({
  label,
  value,
  unit,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  accent?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="panel-raised group relative overflow-hidden p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {icon && <span className="text-fg-faint transition-colors group-hover:text-fg-muted">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cx("stat-value", accent ?? "text-fg")}>{value}</span>
        {unit && <span className="text-sm font-medium text-fg-muted">{unit}</span>}
      </div>
      {sub && <div className="mt-1.5 text-xs text-fg-muted">{sub}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx("relative overflow-hidden rounded-lg bg-ink-500/50", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line/80 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-500/60 text-fg-faint">
        {icon ?? <IconInfo />}
      </div>
      <div>
        <p className="font-display text-sm uppercase tracking-wide text-fg">{title}</p>
        {hint && <p className="mt-1 max-w-xs text-xs text-fg-muted">{hint}</p>}
      </div>
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-sev-critical/30 bg-sev-critical/5 py-10 text-center">
      <p className="font-display text-sm uppercase tracking-wide text-sev-critical">Couldn't load data</p>
      <p className="max-w-sm text-xs text-fg-muted">{message ?? "The backend request failed. This does not affect safety monitoring."}</p>
      {onRetry && (
        <button className="btn-ghost text-xs" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function ProgressBar({ value, className, tone = "cat" }: { value: number; className?: string; tone?: "cat" | "ok" | "warning" }) {
  const bar = tone === "ok" ? "bg-ok" : tone === "warning" ? "bg-sev-warning" : "bg-cat";
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-ink-500", className)}>
      <div className={cx("h-full rounded-full transition-all duration-700", bar)} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export function KeyValue({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/70 py-2 last:border-0">
      <span className="text-xs text-fg-muted">{k}</span>
      <span className="text-sm font-medium text-fg">{v}</span>
    </div>
  );
}
