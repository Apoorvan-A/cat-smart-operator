// Real HTTP client — talks to the FastAPI backend defined in API_CONTRACT.md.
// Used when VITE_USE_MOCK=false. Kept deliberately thin: typed fetch + the
// standard error envelope + bearer auth.
import type { ApiClient } from "./contract";
import { TOKEN_KEY } from "./contract";
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
  Severity,
  ShiftHandover,
  Task,
  TaskDetail,
  TelemetryResponse,
  TrainingRecord,
  User,
  WorkZone,
} from "./types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

/** Error carrying the contract's error code so the UI can react (e.g. STALE). */
export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let code = "INTERNAL";
    let message = res.statusText;
    try {
      const body = await res.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(code, message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const q = (params: Record<string, string | number | undefined>) => {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return s ? `?${s}` : "";
};

export const httpClient: ApiClient = {
  login: (username, password) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<User>("/auth/me"),

  getOperator: (id) => request<Operator>(`/operators/${id}`),
  getMachine: (id) => request<Machine>(`/machines/${id}`),
  getMachineHealth: (id) => request<MachineHealth>(`/machines/${id}/health`),
  getTelemetry: (id, opts) => request<TelemetryResponse>(`/machines/${id}/telemetry${q({ limit: opts?.limit })}`),

  getTodayTasks: () => request<Task[]>("/tasks/today"),
  getTask: (id) => request<TaskDetail>(`/tasks/${id}`),
  predictEta: (id) => request<EtaPrediction>(`/tasks/${id}/predict-eta`, { method: "POST", body: "{}" }),
  startTask: (id) => request<Task>(`/tasks/${id}/start`, { method: "POST", body: "{}" }),
  completeTask: (id) => request<Task>(`/tasks/${id}/complete`, { method: "POST", body: "{}" }),

  getSafetyEvents: (opts) =>
    request<SafetyEvent[]>(`/safety/events${q({ machine_id: opts?.machineId, severity: opts?.severity as Severity })}`),
  getAlerts: (opts) => request<Alert[]>(`/safety/alerts${q({ status: opts?.status })}`),
  acknowledgeAlert: (id, note) =>
    request<Alert>(`/safety/alerts/${id}/acknowledge`, { method: "POST", body: JSON.stringify({ note }) }),
  escalateAlert: (id, toRole) =>
    request<Alert>(`/safety/alerts/${id}/escalate`, { method: "POST", body: JSON.stringify({ to_role: toRole }) }),

  getWorkZone: (machineId) => request<WorkZone>(`/safety/work-zone${q({ machine_id: machineId })}`),

  getIncidents: () => request<Incident[]>("/incidents"),
  getIncident: (id) => request<Incident>(`/incidents/${id}`),
  createIncident: (input) => request<Incident>("/incidents", { method: "POST", body: JSON.stringify(input) }),

  getTraining: (operatorId) => request<TrainingRecord[]>(`/operators/${operatorId}/training`),
  bookInstructor: (moduleId, operatorId, slot) =>
    request<{ ok: true }>(`/training/${moduleId}/book-instructor`, {
      method: "POST",
      body: JSON.stringify({ operator_id: operatorId, slot }),
    }),

  getFuelAnalytics: (machineId) => request<FuelAnalytics>(`/analytics/fuel${q({ machine_id: machineId })}`),
  getProductivity: (machineId) => request<ProductivityAnalytics>(`/analytics/productivity${q({ machine_id: machineId })}`),

  askAssistant: (operatorId, question) =>
    request<AssistantResponse>("/assistant/query", {
      method: "POST",
      body: JSON.stringify({ operator_id: operatorId, question }),
    }),

  getHandover: (shiftId) => request<ShiftHandover>(`/shifts/${shiftId}/handover`),
};
