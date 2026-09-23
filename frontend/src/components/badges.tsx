import { useState } from "react";
import type { Provenance, Severity } from "@/api/types";
import { cx, PROVENANCE_META, SEVERITY_META } from "@/lib/format";

export function SeverityBadge({ severity, size = "sm" }: { severity: Severity; size?: "sm" | "md" }) {
  const m = SEVERITY_META[severity];
  return (
    <span
      className={cx(
        "chip ring-1",
        m.bg,
        m.text,
        m.ring,
        size === "md" && "px-3 py-1.5 text-xs",
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

/**
 * ProvenanceTag — the honesty marker required by the contract. Every intelligent
 * value (PREDICTED / SIMULATED / OBSERVED / ASSUMED) is labelled so the operator
 * never mistakes a model estimate for a measurement.
 */
export function ProvenanceTag({ provenance }: { provenance: Provenance }) {
  const [open, setOpen] = useState(false);
  const m = PROVENANCE_META[provenance];
  const tone =
    provenance === "PREDICTED"
      ? "text-sev-info border-sev-info/30 bg-sev-info/10"
      : provenance === "SIMULATED"
        ? "text-cat border-cat/30 bg-cat/10"
        : provenance === "ASSUMED"
          ? "text-fg-muted border-line bg-ink-500/60"
          : "text-ok border-ok/30 bg-ok/10";
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span className={cx("chip border", tone)}>{m.label}</span>
      {open && (
        <span className="absolute bottom-full left-1/2 z-30 mb-2 w-44 -translate-x-1/2 rounded-lg border border-line bg-ink-800 px-3 py-2 text-[11px] font-normal normal-case tracking-normal text-fg-muted shadow-pop">
          {m.hint}
        </span>
      )}
    </span>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: "ok" | "warn" | "danger" | "muted" | "info" }) {
  const map = {
    ok: "bg-ok/12 text-ok ring-ok/30",
    warn: "bg-sev-warning/12 text-sev-warning ring-sev-warning/30",
    danger: "bg-sev-critical/14 text-sev-critical ring-sev-critical/40",
    muted: "bg-ink-500/70 text-fg-muted ring-line",
    info: "bg-sev-info/12 text-sev-info ring-sev-info/30",
  } as const;
  return <span className={cx("chip ring-1", map[tone])}>{label}</span>;
}
