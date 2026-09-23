// The API surface the UI consumes. Both the real HTTP client and the mock
// implement this identical interface, so switching between them is one env flag.
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

export interface ApiClient {
  // auth
  login(username: string, password: string): Promise<LoginResponse>;
  me(): Promise<User>;

  // operator / machine
  getOperator(id: string): Promise<Operator>;
  getMachine(id: string): Promise<Machine>;
  getMachineHealth(id: string): Promise<MachineHealth>;
  getTelemetry(id: string, opts?: { limit?: number }): Promise<TelemetryResponse>;

  // tasks
  getTodayTasks(): Promise<Task[]>;
  getTask(id: string): Promise<TaskDetail>;
  predictEta(id: string): Promise<EtaPrediction>;
  startTask(id: string): Promise<Task>;
  completeTask(id: string): Promise<Task>;

  // safety
  getSafetyEvents(opts?: { machineId?: string; severity?: Severity }): Promise<SafetyEvent[]>;
  getAlerts(opts?: { status?: string }): Promise<Alert[]>;
  acknowledgeAlert(id: string, note?: string): Promise<Alert>;
  escalateAlert(id: string, toRole: string): Promise<Alert>;

  // work zone
  getWorkZone(machineId: string): Promise<WorkZone>;

  // incidents
  getIncidents(): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident>;
  createIncident(input: {
    machine_id: string;
    operator_id: string;
    type: string;
    description: string;
    occurred_at: string;
  }): Promise<Incident>;

  // training
  getTraining(operatorId: string): Promise<TrainingRecord[]>;
  bookInstructor(moduleId: string, operatorId: string, slot: string): Promise<{ ok: true }>;

  // analytics
  getFuelAnalytics(machineId: string): Promise<FuelAnalytics>;
  getProductivity(machineId: string): Promise<ProductivityAnalytics>;

  // assistant
  askAssistant(operatorId: string, question: string): Promise<AssistantResponse>;

  // handover
  getHandover(shiftId: string): Promise<ShiftHandover>;
}

export const TOKEN_KEY = "cat.auth.token";
export const USER_KEY = "cat.auth.user";
