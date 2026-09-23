import type { Explanation, Provenance } from "@/api/types";
import { ProvenanceTag } from "./badges";
import { cx } from "@/lib/format";

/**
 * The product's explainability contract, made visible: every intelligent
 * feature answers WHAT happened, WHY it matters, and what ACTION to take.
 */
export function WhatWhyAction({
  explanation,
  provenance,
  tone = "info",
  compact = false,
}: {
  explanation: Explanation;
  provenance?: Provenance;
  tone?: "info" | "warning" | "high";
  compact?: boolean;
}) {
  const rail =
    tone === "high" ? "before:bg-sev-high" : tone === "warning" ? "before:bg-sev-warning" : "before:bg-sev-info";
  return (
    <div
      className={cx(
        "relative rounded-xl border border-line bg-ink-600/50 pl-5 pr-4 py-4",
        "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-full",
        rail,
      )}
    >
      {provenance && (
        <div className="mb-3 flex justify-end">
          <ProvenanceTag provenance={provenance} />
        </div>
      )}
      <dl className={cx("grid gap-3", compact ? "sm:grid-cols-3" : "")}>
        <Row label="What" text={explanation.what} />
        <Row label="Why" text={explanation.why} />
        <Row label="Action" text={explanation.action} accent />
      </dl>
    </div>
  );
}

function Row({ label, text, accent }: { label: string; text: string; accent?: boolean }) {
  return (
    <div>
      <dt className="eyebrow mb-1">{label}</dt>
      <dd className={cx("text-sm leading-relaxed", accent ? "font-medium text-fg" : "text-fg-muted")}>{text}</dd>
    </div>
  );
}
