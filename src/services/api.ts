export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(
  /\/$/,
  "",
);
export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("prodigy_session");
  return token ? { "X-Session-Token": token } : {};
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    credentials: "include",
    signal:
      options.signal ??
      AbortSignal.timeout(
        path === "/chat" ? 240000 : path === "/upload" ? 180000 : 30000,
      ),
    headers: { ...authHeaders(), ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      typeof body.detail === "string"
        ? body.detail
        : `Request failed (${response.status}). Please try again.`,
    );
  }
  return response.json() as Promise<T>;
}

export function connectGoogle() {
  window.location.assign(apiUrl("/auth/google/login"));
}

export interface ChatResponse {
  reply: string;
  error: string | null;
  route?: string;
}
export function sendChatMessage(
  message: string,
  requestId: string,
): Promise<ChatResponse> {
  return apiRequest("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, request_id: requestId }),
  });
}
