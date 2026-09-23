// A tiny typed event bus used ONLY in mock mode to simulate the server's
// WebSocket push stream deterministically (the DEMO.md story). In real mode the
// useWebSocket hook connects to VITE_WS_URL instead and this is never used.
import type { WsMessage } from "@/api/types";

type Listener = (m: WsMessage) => void;

const listeners = new Set<Listener>();

export const demoBus = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit(m: WsMessage) {
    listeners.forEach((fn) => fn(m));
  },
};
