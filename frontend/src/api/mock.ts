// Deterministic in-browser mock of the API_CONTRACT. Lets the operator UI run,
// demo, and be reviewed with NO backend — while matching the exact shapes the
// real FastAPI backend will return, so switching to it is one env flag.
//
// Everything here is clearly SIMULATED/PREDICTED via the `provenance` fields the
// contract mandates — the UI never presents mock numbers as real telemetry.
import type { ApiClient } from "./contract";
import { TOKEN_KEY, USER_KEY } from "./contract";
import { demoBus } from "@/lib/demoBus";
import type {
  Alert,
  AssistantResponse,
  EtaPrediction,
  FuelAnalytics,
  Incident,
  LoginResponse,
  Machine,
  MachineHealth,
  Operator,
  ProductivityAnalytics,
  SafetyEvent,
  ShiftHandover,
  Task,
  TaskDetail,
  TelemetryResponse,
  TrainingRecord,
  User,
  WorkZone,
} from "./types";

const DAY = "2025-05-01";
const iso = (hhmm: string) => `${DAY}T${hhmm}:00Z`;
const delay = <T>(v: T, ms = 260): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));

const OPERATOR: Operator = {
  id: "OP1001",
  name: "Jane Doe",
  role: "OPERATOR",
  current_machine_id: "EXC001",
  current_shift_id: "SH-2025-05-01-A",
};

const MACHINE: Machine = {
  id: "EXC001",
  type: "EXCAVATOR",
  model: "CAT 320",
  site_id: "SITE-A",
  status: "OPERATING",
  engine_hours: 1526.5,
};

// ── Mutable demo state ───────────────────────────────────────────────────────
let idlingElevated = false; // flips true during the demo idling beat
let proximityActive = false;

const store = {
  tasks: [
    {
      id: "T-100",
      title: "Site clearing — access road",
      type: "GRADING",
      priority: "MEDIUM",
      site_id: "SITE-A",
      machine_id: "EXC001",
      state: "COMPLETED",
      progress: 1,
      scheduled_start: iso("06:30"),
      original_eta: iso("07:45"),
      predicted_eta: iso("07:41"),
      eta_provenance: "OBSERVED",
    },
    {
      id: "T-101",
      title: "Trench excavation — north lot",
      type: "EXCAVATION",
      priority: "HIGH",
      site_id: "SITE-A",
      machine_id: "EXC001",
      state: "IN_PROGRESS",
      progress: 0.62,
      scheduled_start: iso("08:00"),
      original_eta: iso("14:30"),
      predicted_eta: iso("14:30"),
      eta_provenance: "PREDICTED",
    },
    {
      id: "T-102",
      title: "Load spoil to haul trucks — bay 3",
      type: "LOADING",
      priority: "MEDIUM",
      site_id: "SITE-A",
      machine_id: "EXC001",
      state: "SCHEDULED",
      progress: 0,
      scheduled_start: iso("15:00"),
      original_eta: iso("16:15"),
      predicted_eta: iso("16:15"),
      eta_provenance: "PREDICTED",
    },
  ] as Task[],

  alerts: [] as Alert[],

  safetyEvents: [
    {
      id: "SE-8990",
      timestamp: iso("09:12"),
      type: "SEATBELT_UNFASTENED",
      severity: "HIGH",
      machine_id: "EXC001",
      operator_id: "OP1001",
      location: { lat: 12.34, lng: 56.78 },
      telemetry_context: { seatbelt_status: "UNFASTENED", machine_state: "OPERATING", speed: 0 },
      provenance: "SIMULATED",
      recommended_action: "Fasten seatbelt before operating",
      acknowledged: true,
    },
  ] as SafetyEvent[],

  incidents: [] as Incident[],
};

const health = (): MachineHealth => ({
  machine_id: "EXC001",
  state: idlingElevated ? "WARNING" : "NORMAL",
  health_score: idlingElevated ? 0.79 : 0.86,
  provenance: "PREDICTED",
  signals: [
    { name: "engine_temperature", value: idlingElevated ? 101.4 : 95.2, unit: "°C", state: idlingElevated ? "WARNING" : "NORMAL" },
    { name: "hydraulic_pressure", value: 210, unit: "bar", state: "WARNING" },
    { name: "engine_load", value: idlingElevated ? 0.34 : 0.71, unit: "", state: "NORMAL" },
    { name: "fuel_rate", value: idlingElevated ? 8.9 : 6.2, unit: "L/h", state: idlingElevated ? "WARNING" : "NORMAL" },
    { name: "idle_time", value: idlingElevated ? 42 : 21, unit: "min", state: idlingElevated ? "WARNING" : "NORMAL" },
    { name: "cycle_time", value: 41.5, unit: "s", state: "NORMAL" },
  ],
  explanation: idlingElevated
    ? {
        what: "Engine temperature and fuel rate rose while engine load fell.",
        why: "Idle time is 42 min vs a recent baseline of 21 min — the machine is running but not working.",
        action: "Shut the engine down during extended waits to protect the machine and cut fuel burn.",
      }
    : {
        what: "All monitored signals are within normal operating bands.",
        why: "Hydraulic pressure sits at the top of its normal range but is trending flat.",
        action: "No action required. Continue the current task.",
      },
});

function telemetryRow(ageSeconds: number): TelemetryResponse {
  const stale = ageSeconds > 30;
  return {
    stale,
    last_update_age_seconds: ageSeconds,
    rows: [
      {
        timestamp: iso("13:58"),
        machine_id: "EXC001",
        operator_id: "OP1001",
        engine_hours: 1526.5,
        fuel_used: idlingElevated ? 6.1 : 4.4,
        fuel_rate: idlingElevated ? 8.9 : 6.2,
        load_cycles: idlingElevated ? 3 : 11,
        idle_time: idlingElevated ? 42 : 21,
        cycle_time: 41.5,
        engine_temperature: idlingElevated ? 101.4 : 95.2,
        hydraulic_pressure: 210,
        engine_load: idlingElevated ? 0.34 : 0.71,
        speed: 0,
        latitude: 12.34,
        longitude: 56.78,
        seatbelt_status: "FASTENED",
        warning_code: null,
        machine_state: "OPERATING",
      },
    ],
  };
}

const training: TrainingRecord[] = [
  {
    module_id: "TR-EXC-SAFE",
    title: "Safe Excavator Operation",
    status: "RECOMMENDED",
    reason: "3 proximity alerts occurred during recent shifts",
    provenance: "OBSERVED",
    completion: 0,
    duration_min: 25,
    format: "VIDEO",
  },
  {
    module_id: "TR-IDLE-FUEL",
    title: "Fuel-Efficient Operation & Idle Management",
    status: "RECOMMENDED",
    reason: "Extended idle pattern detected this shift",
    provenance: "OBSERVED",
    completion: 0,
    duration_min: 18,
    format: "VIDEO",
  },
  {
    module_id: "TR-TRENCH-SIM",
    title: "Trenching Simulation — Slope & Shoring",
    status: "IN_PROGRESS",
    reason: "Assigned for current task type",
    provenance: "ASSUMED",
    completion: 0.4,
    duration_min: 40,
    format: "SIMULATION",
  },
  {
    module_id: "TR-PROX-AWARE",
    title: "Work-Zone Proximity Awareness",
    status: "COMPLETED",
    reason: "Annual certification",
    provenance: "OBSERVED",
    completion: 1,
    duration_min: 30,
    format: "INSTRUCTOR",
  },
];

// ── The scripted DEMO.md story, emitted over the demo bus as WS messages ─────
let demoRunning = false;
export function runDemoSequence() {
  if (demoRunning) return;
  demoRunning = true;

  const proximityAlert: Alert = {
    id: "AL-501",
    severity: "HIGH",
    status: "ACTIVE",
    count: 1,
    grouped_event_ids: ["SE-9001"],
    summary: "Worker W103 at 3.2 m — inside the 5 m safety zone",
    type: "PROXIMITY_HAZARD",
    recommended_action: "Stop swing. Confirm worker is clear before continuing.",
    created_at: iso("14:04"),
  };

  const proximityEvent: SafetyEvent = {
    id: "SE-9001",
    timestamp: iso("14:04"),
    type: "PROXIMITY_HAZARD",
    severity: "HIGH",
    machine_id: "EXC001",
    operator_id: "OP1001",
    location: { lat: 12.341, lng: 56.781 },
    telemetry_context: { distance_m: 3.2, threshold_m: 5, entity: "W103" },
    provenance: "SIMULATED",
    recommended_action: "Stop swing. Confirm worker is clear before continuing.",
    acknowledged: false,
  };

  // t+1.2s — proximity HIGH alert
  setTimeout(() => {
    proximityActive = true;
    store.safetyEvents = [proximityEvent, ...store.safetyEvents];
    store.alerts = [proximityAlert, ...store.alerts];
    demoBus.emit({ type: "SAFETY_ALERT", payload: proximityAlert });
  }, 1200);

  // t+4s — idling insight
  setTimeout(() => {
    idlingElevated = true;
    demoBus.emit({
      type: "INSIGHT",
      payload: {
        title: "Unusual idling detected",
        severity: "WARNING",
        explanation: {
          what: "Idle time is 42 minutes this shift.",
          why: "Your recent average is 21 minutes — a 100% increase.",
          action: "Consider shutting down the engine during extended waiting periods.",
        },
      },
    });
  }, 4000);

  // t+6.5s — ETA moves 14:30 → 14:47 from worsening weather
  setTimeout(() => {
    const t = store.tasks.find((x) => x.id === "T-101");
    if (t) {
      t.predicted_eta = iso("14:47");
      t.state = "AT_RISK";
    }
    demoBus.emit({
      type: "ETA_UPDATE",
      payload: { task_id: "T-101", predicted_eta: iso("14:47"), delta_minutes: 17 },
    });
  }, 6500);

  setTimeout(() => (demoRunning = false), 8000);
}

export function resetDemo() {
  idlingElevated = false;
  proximityActive = false;
  demoRunning = false;
  store.alerts = [];
  store.safetyEvents = store.safetyEvents.filter((e) => e.id !== "SE-9001");
  const t = store.tasks.find((x) => x.id === "T-101");
  if (t) {
    t.predicted_eta = iso("14:30");
    t.state = "IN_PROGRESS";
  }
}

// ── The mock client ──────────────────────────────────────────────────────────
export const mockClient: ApiClient = {
  async login(username) {
    const user: User = { id: "OP1001", name: "Jane Doe", role: "OPERATOR" };
    const res: LoginResponse = { access_token: `mock.${username}.jwt`, token_type: "bearer", user };
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return delay(res, 500);
  },
  async me() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) throw new Error("UNAUTHORIZED");
    return JSON.parse(raw) as User;
  },

  getOperator: () => delay(OPERATOR),
  getMachine: () => delay(MACHINE),
  getMachineHealth: () => delay(health()),
  getTelemetry: () => delay(telemetryRow(3)),

  getTodayTasks: () => delay([...store.tasks]),
  async getTask(id) {
    const t = store.tasks.find((x) => x.id === id);
    if (!t) throw new Error("NOT_FOUND");
    const detail: TaskDetail = {
      ...t,
      delay_reason: t.predicted_eta === iso("14:47") ? "Heavy rainfall increased average cycle time ~12%" : null,
      environment: {
        temperature_c: 17,
        rainfall_mm: t.predicted_eta === iso("14:47") ? 6.4 : 0.2,
        wind_kph: 14,
        visibility_km: t.predicted_eta === iso("14:47") ? 3.1 : 9.5,
        humidity_pct: 78,
        condition: t.predicted_eta === iso("14:47") ? "Heavy rain" : "Overcast",
      },
      events: [
        { timestamp: iso("08:00"), label: "Task started", kind: "STATE" },
        { timestamp: iso("11:20"), label: "Reached 40% — on schedule", kind: "NOTE" },
        ...(t.predicted_eta === iso("14:47")
          ? ([
              { timestamp: iso("14:02"), label: "Rainfall began — visibility dropping", kind: "NOTE" },
              { timestamp: iso("14:03"), label: "ETA moved 14:30 → 14:47", kind: "ETA" },
            ] as TaskDetail["events"])
          : []),
      ],
    };
    return delay(detail);
  },
  async predictEta(id) {
    const t = store.tasks.find((x) => x.id === id);
    const moved = t?.predicted_eta === iso("14:47");
    const res: EtaPrediction = {
      task_id: id,
      predicted_eta: moved ? iso("14:47") : iso("14:30"),
      delta_minutes: moved ? 17 : 0,
      provenance: "PREDICTED",
      explanation: moved
        ? {
            what: "ETA moved from 14:30 to 14:47 (+17 min).",
            why: "Heavy rainfall increased average cycle time ~12% and reduced visibility to 3.1 km.",
            action: "No action needed; monitor site drainage and keep the bench clear.",
          }
        : {
            what: "ETA holds at 14:30.",
            why: "Cycle times and environmental conditions match the plan.",
            action: "Continue current pace.",
          },
      fallback_used: false,
    };
    return delay(res, 650);
  },
  async startTask(id) {
    const t = store.tasks.find((x) => x.id === id)!;
    t.state = "IN_PROGRESS";
    return delay(t);
  },
  async completeTask(id) {
    const t = store.tasks.find((x) => x.id === id)!;
    t.state = "COMPLETED";
    t.progress = 1;
    return delay(t);
  },

  getSafetyEvents: (opts) =>
    delay(store.safetyEvents.filter((e) => (opts?.severity ? e.severity === opts.severity : true))),
  getAlerts: (opts) => delay(store.alerts.filter((a) => (opts?.status ? a.status === opts.status : true))),
  async acknowledgeAlert(id, note) {
    const a = store.alerts.find((x) => x.id === id);
    if (!a) throw new Error("NOT_FOUND");
    a.status = "ACKNOWLEDGED";
    store.safetyEvents.forEach((e) => a.grouped_event_ids.includes(e.id) && (e.acknowledged = true));
    void note;
    return delay(a, 300);
  },
  async escalateAlert(id, toRole) {
    const a = store.alerts.find((x) => x.id === id)!;
    a.status = "ESCALATED";
    void toRole;
    return delay(a, 300);
  },

  getWorkZone: () =>
    delay<WorkZone>({
      machine_id: "EXC001",
      threshold_m: 5,
      provenance: "SIMULATED",
      entities: [
        { id: "EXC001", kind: "MACHINE", label: "You · EXC001", x: 0, y: 0 },
        {
          id: "W103",
          kind: "WORKER",
          label: "Worker W103",
          x: proximityActive ? 2.4 : 7.8,
          y: proximityActive ? -2.1 : 5.2,
          distance_m: proximityActive ? 3.2 : 9.4,
        },
        { id: "W104", kind: "WORKER", label: "Worker W104", x: -9.5, y: 6.0, distance_m: 11.2 },
        { id: "TRK-7", kind: "VEHICLE", label: "Haul truck 7", x: 12, y: -8, distance_m: 14.4 },
        { id: "RZ-1", kind: "RESTRICTED", label: "Trench edge — restricted", x: -6, y: -10, distance_m: 11.7 },
      ],
    }),

  getIncidents: () => delay([...store.incidents]),
  async getIncident(id) {
    const i = store.incidents.find((x) => x.id === id);
    if (!i) throw new Error("NOT_FOUND");
    return delay(i);
  },
  async createIncident(input) {
    const id = `INC-${String(store.incidents.length + 1).padStart(3, "0")}`;
    const incident: Incident = {
      id,
      machine_id: input.machine_id,
      operator_id: input.operator_id,
      type: (input.type as Incident["type"]) ?? "OTHER",
      description: input.description,
      occurred_at: input.occurred_at,
      review_status: "OPEN",
      notes: [],
      timeline: [
        { timestamp: iso("14:02"), source: "WEATHER", label: "Rainfall began (6.4 mm)", detail: "Visibility 3.1 km" },
        { timestamp: iso("14:04"), source: "SAFETY", label: "Proximity hazard — W103 at 3.2 m", detail: "HIGH severity" },
        { timestamp: iso("14:04"), source: "TELEMETRY", label: "Machine operating, speed 0", detail: "Seatbelt fastened" },
      ],
    };
    store.incidents = [incident, ...store.incidents];
    return delay(incident, 400);
  },

  getTraining: () => delay(training),
  bookInstructor: () => delay({ ok: true } as const, 400),

  getFuelAnalytics: () =>
    delay<FuelAnalytics>({
      fuel_per_hour: idlingElevated ? 8.9 : 6.2,
      fuel_per_cycle: 0.9,
      idle_fuel_estimate: idlingElevated ? 5.4 : 3.1,
      baseline_fuel_per_cycle: 0.72,
      provenance: "OBSERVED",
      insight: {
        what: `Idle time up ${idlingElevated ? "100%" : "12%"} vs the machine's recent baseline.`,
        why: idlingElevated ? "Extended idle periods on 3 cycles this shift." : "Minor waits between load cycles.",
        action: idlingElevated ? "Shut down during waits — est. 2.3 L/h recoverable." : "Within normal range; no action.",
      },
    }),
  getProductivity: () =>
    delay<ProductivityAnalytics>({
      cycles_per_hour: idlingElevated ? 9.4 : 13.1,
      idle_percentage: idlingElevated ? 34 : 18,
      task_completion_rate: 0.92,
      productive_time_pct: idlingElevated ? 66 : 82,
      provenance: "OBSERVED",
      insight: {
        what: "Productive operating time is 82% of engine-on time.",
        why: "Cycle times are steady; idle percentage is the main lever.",
        action: "Trimming idle to baseline would add ~1.6 cycles/hour.",
      },
      trend: [
        { t: "08:00", cycles: 12, idle: 16 },
        { t: "09:00", cycles: 13, idle: 15 },
        { t: "10:00", cycles: 14, idle: 14 },
        { t: "11:00", cycles: 13, idle: 17 },
        { t: "12:00", cycles: 11, idle: 22 },
        { t: "13:00", cycles: 12, idle: 24 },
        { t: "14:00", cycles: idlingElevated ? 9 : 13, idle: idlingElevated ? 34 : 18 },
      ],
    }),

  async askAssistant(_operatorId, question) {
    const ql = question.toLowerCase();
    let res: AssistantResponse;
    if (ql.includes("delay") || ql.includes("eta") || ql.includes("late")) {
      res = {
        answer:
          "Your task T-101 ETA moved from 14:30 to 14:47 (+17 min). Heavy rainfall started at 14:02, cutting visibility to 3.1 km and raising average cycle time about 12%. No action is required — monitor site drainage.",
        grounded: true,
        facts_used: [
          { tool: "tasks.predict_eta", task_id: "T-101" },
          { tool: "weather.current", site_id: "SITE-A" },
        ],
        provenance: "PREDICTED",
        data_available: true,
      };
    } else if (ql.includes("fuel")) {
      res = {
        answer:
          "So far this shift the machine has used about 4.4 L, running at 6.2 L/h. Idle burn is roughly 3.1 L. Idle time is above your recent baseline — shutting down during waits would recover fuel.",
        grounded: true,
        facts_used: [{ tool: "analytics.fuel", machine_id: "EXC001" }],
        provenance: "OBSERVED",
        data_available: true,
      };
    } else if (ql.includes("safe") || ql.includes("warning") || ql.includes("alert")) {
      res = {
        answer: proximityActive
          ? "There is one active HIGH safety alert: worker W103 is 3.2 m from your machine, inside the 5 m zone. Stop swing and confirm the worker is clear before continuing."
          : "No active safety alerts right now. The last event was a resolved seatbelt warning at 09:12.",
        grounded: true,
        facts_used: [{ tool: "safety.alerts", status: "ACTIVE" }],
        provenance: "SIMULATED",
        data_available: true,
      };
    } else if (ql.includes("machine") || ql.includes("health") || ql.includes("normal")) {
      res = {
        answer: idlingElevated
          ? "Machine health is WARNING (score 0.79). Engine temperature rose to 101°C and fuel rate to 8.9 L/h while engine load dropped — consistent with extended idling, not a fault. Shutting down during waits will bring these back to baseline."
          : "Machine health is NORMAL (score 0.86). All signals are within normal bands; hydraulic pressure sits at the top of its normal range but is flat.",
        grounded: true,
        facts_used: [{ tool: "machines.health", machine_id: "EXC001" }],
        provenance: "PREDICTED",
        data_available: true,
      };
    } else if (ql.includes("previous shift") || ql.includes("last shift") || ql.includes("handover")) {
      res = {
        answer:
          "The previous shift completed the access-road grading (T-100) and left the trench excavation at 62%. One seatbelt warning was raised and resolved. Machine was handed over in NORMAL health.",
        grounded: true,
        facts_used: [{ tool: "shifts.handover", shift_id: "SH-2025-05-01-A" }],
        provenance: "OBSERVED",
        data_available: true,
      };
    } else {
      res = {
        answer:
          "I can answer from live backend facts about your task, machine health, fuel, safety alerts, and shift handover. I don't have data to answer that one — try asking why your task is delayed, or how your machine is doing.",
        grounded: false,
        facts_used: [],
        provenance: "ASSUMED",
        data_available: false,
      };
    }
    return delay(res, 700);
  },

  getHandover: () =>
    delay<ShiftHandover>({
      shift_id: "SH-2025-05-01-A",
      operator: { id: "OP1001", name: "Jane Doe", role: "OPERATOR" },
      machine_id: "EXC001",
      generated_at: iso("15:00"),
      tasks_completed: [{ id: "T-100", title: "Site clearing — access road" }],
      tasks_remaining: [
        { id: "T-101", title: "Trench excavation — north lot", state: "AT_RISK" },
        { id: "T-102", title: "Load spoil to haul trucks — bay 3", state: "SCHEDULED" },
      ],
      machine_health: { state: idlingElevated ? "WARNING" : "NORMAL", health_score: idlingElevated ? 0.79 : 0.86 },
      safety_events: { count: proximityActive ? 2 : 1, highest: "HIGH" },
      fuel_used_l: 26.8,
      abnormal_behavior: [
        "Extended idle pattern detected (42 min vs 21 min baseline).",
        proximityActive ? "One proximity hazard — worker within 5 m zone." : "",
      ].filter(Boolean),
      maintenance_recommendation:
        "Hydraulic pressure at top of normal range on consecutive shifts — recommend inspection at next service.",
      pending_actions: [
        "Trench excavation (T-101) 62% complete — resume at north lot bench.",
        "Complete recommended training: Safe Excavator Operation.",
      ],
    }),
};
