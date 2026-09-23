import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { USE_MOCK } from "@/api";
import type { Alert, WsMessage } from "@/api/types";
import { demoBus } from "@/lib/demoBus";

export type WsStatus = "connecting" | "live" | "reconnecting" | "offline";

interface WsContextValue {
  status: WsStatus;
  alerts: Alert[];
  lastMessage: WsMessage | null;
  /** Latest INSIGHT push (idling etc.), if any. */
  insight: Extract<WsMessage, { type: "INSIGHT" }>["payload"] | null;
  etaUpdates: Record<string, { predicted_eta: string; delta_minutes?: number }>;
  telemetryStale: boolean;
  acknowledge: (alertId: string) => void;
  clearInsight: () => void;
}

const WsContext = createContext<WsContextValue | null>(null);

/**
 * WebSocket provider. In mock mode it subscribes to the deterministic demo bus;
 * in real mode it connects to VITE_WS_URL with exponential-backoff reconnect and
 * consumes the SNAPSHOT / SAFETY_ALERT / ETA_UPDATE / TELEMETRY_STALE contract.
 */
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WsStatus>("connecting");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const [insight, setInsight] = useState<WsContextValue["insight"]>(null);
  const [etaUpdates, setEtaUpdates] = useState<WsContextValue["etaUpdates"]>({});
  const [telemetryStale, setTelemetryStale] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  const handle = (msg: WsMessage) => {
    setLastMessage(msg);
    switch (msg.type) {
      case "SNAPSHOT":
        setAlerts(msg.payload.active_alerts);
        break;
      case "SAFETY_ALERT":
        setAlerts((prev) => {
          if (prev.some((a) => a.id === msg.payload.id)) return prev;
          return [msg.payload, ...prev];
        });
        break;
      case "ETA_UPDATE":
        setEtaUpdates((prev) => ({
          ...prev,
          [msg.payload.task_id]: { predicted_eta: msg.payload.predicted_eta, delta_minutes: msg.payload.delta_minutes },
        }));
        break;
      case "TELEMETRY_STALE":
        setTelemetryStale(true);
        break;
      case "TELEMETRY_TICK":
        setTelemetryStale(Boolean(msg.payload.stale));
        break;
      case "INSIGHT":
        setInsight(msg.payload);
        break;
    }
  };

  useEffect(() => {
    if (USE_MOCK) {
      setStatus("live");
      const off = demoBus.subscribe(handle);
      return off;
    }

    let closed = false;
    const url = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws";
    const token = localStorage.getItem("cat.auth.token") ?? "";

    const connect = () => {
      setStatus(retryRef.current === 0 ? "connecting" : "reconnecting");
      const ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;
      ws.onopen = () => {
        retryRef.current = 0;
        setStatus("live");
      };
      ws.onmessage = (ev) => {
        try {
          handle(JSON.parse(ev.data) as WsMessage);
        } catch {
          /* ignore malformed frame */
        }
      };
      ws.onclose = () => {
        if (closed) return;
        setStatus("reconnecting");
        const backoff = Math.min(1000 * 2 ** retryRef.current, 15000);
        retryRef.current += 1;
        setTimeout(connect, backoff);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      wsRef.current?.close();
    };
  }, []);

  const value = useMemo<WsContextValue>(
    () => ({
      status,
      alerts,
      lastMessage,
      insight,
      etaUpdates,
      telemetryStale,
      acknowledge: (id) =>
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "ACKNOWLEDGED" } : a))),
      clearInsight: () => setInsight(null),
    }),
    [status, alerts, lastMessage, insight, etaUpdates, telemetryStale],
  );

  return <WsContext.Provider value={value}>{children}</WsContext.Provider>;
}

export function useWebSocket(): WsContextValue {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
}
