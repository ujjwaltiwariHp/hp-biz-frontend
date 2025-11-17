import { getAuthToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const SSE_ENDPOINT = `${API_BASE_URL}/sse/stream`;

export const createSSEConnection = (token: string): EventSource | null => {
  if (!token) {
    return null;
  }

  const url = `${SSE_ENDPOINT}?token=${token}`;

  const eventSource = new EventSource(url, { withCredentials: true });

  eventSource.onopen = () => {
    console.log("SSE Connection: Established");
  };

  eventSource.onerror = (error) => {
    console.error("SSE Connection: Error", error);
  };

  return eventSource;
};

export const closeSSEConnection = (eventSource: EventSource | null) => {
  if (eventSource) {
    eventSource.close();
    console.log("SSE Connection: Closed");
  }
};