import { describe, expect, it } from "vitest";
import { mockClient } from "./mock";

// The mock is the contract the UI codes against — assert it returns the shapes
// (and the honesty markers) that API_CONTRACT.md mandates.
describe("mock API contract", () => {
  it("returns today's tasks with an ETA provenance", async () => {
    const tasks = await mockClient.getTodayTasks();
    expect(tasks.length).toBeGreaterThan(0);
    const t101 = tasks.find((t) => t.id === "T-101");
    expect(t101?.eta_provenance).toBe("PREDICTED");
  });

  it("labels machine health as PREDICTED and answers WHAT/WHY/ACTION", async () => {
    const h = await mockClient.getMachineHealth("EXC001");
    expect(h.provenance).toBe("PREDICTED");
    expect(h.explanation.what).toBeTruthy();
    expect(h.explanation.why).toBeTruthy();
    expect(h.explanation.action).toBeTruthy();
  });

  it("grounds the assistant and flags when data is unavailable", async () => {
    const delayed = await mockClient.askAssistant("OP1001", "why is my task delayed?");
    expect(delayed.grounded).toBe(true);
    expect(delayed.facts_used.length).toBeGreaterThan(0);

    const unknown = await mockClient.askAssistant("OP1001", "what is the meaning of life?");
    expect(unknown.data_available).toBe(false);
  });

  it("reconstructs an incident timeline on create", async () => {
    const inc = await mockClient.createIncident({
      machine_id: "EXC001",
      operator_id: "OP1001",
      type: "NEAR_MISS",
      description: "test",
      occurred_at: new Date().toISOString(),
    });
    expect(inc.timeline.length).toBeGreaterThan(0);
    expect(inc.id).toMatch(/^INC-/);
  });
});
