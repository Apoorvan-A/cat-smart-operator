import { describe, expect, it } from "vitest";
import { cx, pct, relAge, timeOf, SEVERITY_META, PROVENANCE_META } from "./format";

describe("format helpers", () => {
  it("cx joins truthy classes", () => {
    expect(cx("a", false, "b", null, undefined, "c")).toBe("a b c");
  });

  it("pct rounds to whole percent", () => {
    expect(pct(0.62)).toBe("62%");
    expect(pct(1)).toBe("100%");
  });

  it("relAge formats seconds and minutes", () => {
    expect(relAge(12)).toBe("12s ago");
    expect(relAge(134)).toBe("2m 14s ago");
  });

  it("timeOf renders 24h time from ISO and is safe on bad input", () => {
    expect(timeOf("not-a-date")).toBe("--:--");
    expect(timeOf("2025-05-01T14:47:00Z")).toMatch(/^\d{2}:\d{2}$/);
  });

  it("every severity and provenance has display metadata", () => {
    (["INFO", "WARNING", "HIGH", "CRITICAL"] as const).forEach((s) => expect(SEVERITY_META[s].label).toBeTruthy());
    (["REAL", "OBSERVED", "PREDICTED", "SIMULATED", "ASSUMED"] as const).forEach((p) =>
      expect(PROVENANCE_META[p].label).toBeTruthy(),
    );
  });
});
