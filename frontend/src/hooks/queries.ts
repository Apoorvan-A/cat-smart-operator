// TanStack Query hooks — one per contract resource. Centralising them keeps
// query keys consistent and gives every screen the same loading/error surface.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";

const OP = "OP1001";
const MACHINE = "EXC001";
const SHIFT = "SH-2025-05-01-A";

export const keys = {
  operator: ["operator", OP] as const,
  machine: ["machine", MACHINE] as const,
  health: ["health", MACHINE] as const,
  telemetry: ["telemetry", MACHINE] as const,
  tasks: ["tasks", "today"] as const,
  task: (id: string) => ["task", id] as const,
  safetyEvents: ["safety", "events"] as const,
  alerts: ["safety", "alerts"] as const,
  workZone: ["workzone", MACHINE] as const,
  incidents: ["incidents"] as const,
  training: ["training", OP] as const,
  fuel: ["analytics", "fuel", MACHINE] as const,
  productivity: ["analytics", "productivity", MACHINE] as const,
  handover: ["handover", SHIFT] as const,
};

export const useOperator = () => useQuery({ queryKey: keys.operator, queryFn: () => api.getOperator(OP) });
export const useMachine = () => useQuery({ queryKey: keys.machine, queryFn: () => api.getMachine(MACHINE) });
export const useMachineHealth = () =>
  useQuery({ queryKey: keys.health, queryFn: () => api.getMachineHealth(MACHINE), refetchInterval: 15000 });
export const useTelemetry = () =>
  useQuery({ queryKey: keys.telemetry, queryFn: () => api.getTelemetry(MACHINE), refetchInterval: 10000 });
export const useTasks = () => useQuery({ queryKey: keys.tasks, queryFn: () => api.getTodayTasks() });
export const useTask = (id: string) => useQuery({ queryKey: keys.task(id), queryFn: () => api.getTask(id), enabled: !!id });
export const useSafetyEvents = () => useQuery({ queryKey: keys.safetyEvents, queryFn: () => api.getSafetyEvents() });
export const useAlerts = () =>
  useQuery({ queryKey: keys.alerts, queryFn: () => api.getAlerts(), refetchInterval: 8000 });
export const useWorkZone = () =>
  useQuery({ queryKey: keys.workZone, queryFn: () => api.getWorkZone(MACHINE), refetchInterval: 5000 });
export const useIncidents = () => useQuery({ queryKey: keys.incidents, queryFn: () => api.getIncidents() });
export const useTraining = () => useQuery({ queryKey: keys.training, queryFn: () => api.getTraining(OP) });
export const useFuel = () => useQuery({ queryKey: keys.fuel, queryFn: () => api.getFuelAnalytics(MACHINE) });
export const useProductivity = () =>
  useQuery({ queryKey: keys.productivity, queryFn: () => api.getProductivity(MACHINE) });
export const useHandover = () => useQuery({ queryKey: keys.handover, queryFn: () => api.getHandover(SHIFT) });

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.acknowledgeAlert(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.alerts });
      qc.invalidateQueries({ queryKey: keys.safetyEvents });
    },
  });
}

export function usePredictEta() {
  return useMutation({ mutationFn: (taskId: string) => api.predictEta(taskId) });
}

export function useAskAssistant() {
  return useMutation({ mutationFn: (question: string) => api.askAssistant(OP, question) });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createIncident>[0]) => api.createIncident(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.incidents }),
  });
}

export { OP, MACHINE, SHIFT };
