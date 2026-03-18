import type { Message } from "../App";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface ChatResponse {
  reply: string;
  error: string | null;
}

/**
 * Send a message to the chat endpoint and get a response
 * @param message The user's message
 * @param history The conversation history
 * @returns The AI's reply
 */
export async function sendChatMessage(
  message: string,
  history: Message[]
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    return {
      reply: "Sorry, I couldn't reach the backend. Please check if the server is running.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

