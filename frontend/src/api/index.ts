import type { ApiClient } from "./contract";
import { httpClient } from "./http";
import { mockClient } from "./mock";

// Default to mock so the operator UI runs and demos with no backend. Flip
// VITE_USE_MOCK=false to hit the real FastAPI backend (identical interface).
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";

export const api: ApiClient = USE_MOCK ? mockClient : httpClient;

export * from "./types";
export { ApiError } from "./http";
export { TOKEN_KEY, USER_KEY } from "./contract";
