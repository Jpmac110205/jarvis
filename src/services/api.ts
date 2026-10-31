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
  memory_status?: string;
}
export interface DocumentAttachment {
  document_key: string;
  filename: string;
  characters?: number | null;
  full_text_available?: boolean;
  indexed?: boolean;
}
export interface UserMemory {
  markdown: string;
  revision: number;
  auto_update: boolean;
  updated_at: string | null;
}
export async function sendChatMessage(
  message: string,
  requestId: string,
  attachmentKeys: string[] = [],
  onProgress?: (text: string) => void,
): Promise<ChatResponse> {
  const response = await fetch(apiUrl("/chat"), {
    method: "POST",
    credentials: "include",
    signal: AbortSignal.timeout(240000),
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      message,
      request_id: requestId,
      attachment_keys: attachmentKeys,
      stream: true,
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      typeof body.detail === "string"
        ? body.detail
        : "Message couldn't be sent. Please try again.",
    );
  }
  // Compatible with older deployments during a frontend/backend rolling update.
  if (!response.headers.get("Content-Type")?.includes("text/event-stream"))
    return response.json() as Promise<ChatResponse>;
  if (!response.body)
    throw new Error(
      "The response stream was unavailable. Please retry your draft.",
    );
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let partial = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      buffer = buffer.replace(/\r\n/g, "\n");
      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) >= 0) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const payload = frame
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!payload) continue;
        const event = JSON.parse(payload);
        if (event.type === "error")
          throw new ApiError(
            event.status || 503,
            event.detail ||
              "The reply was interrupted. Please retry your draft.",
          );
        if (event.type === "delta" && typeof event.text === "string") {
          partial += event.text;
          onProgress?.(partial);
        }
        if (event.type === "done" && typeof event.reply === "string")
          return event as ChatResponse;
      }
      if (done)
        throw new Error(
          "The reply was interrupted before it was confirmed saved. Retry your draft to recover or complete it.",
        );
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
