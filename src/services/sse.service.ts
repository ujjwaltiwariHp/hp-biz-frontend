import { getAuthToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const SSE_ENDPOINT = `${API_BASE_URL}/sse/stream`;

export const createSSEConnection = (token: string): EventSource | null => {
  if (!token) {
    console.error("SSE: Cannot create connection without token");
    return null;
  }

  if (!SSE_ENDPOINT) {
    console.error("SSE: API_BASE_URL not configured");
    return null;
  }

  try {
    const timestamp = Date.now();
    const url = `${SSE_ENDPOINT}?token=${encodeURIComponent(token)}&t=${timestamp}`;

    console.log("SSE: Creating connection to", SSE_ENDPOINT.replace(API_BASE_URL || '', '...'));

    const eventSource = new EventSource(url, { withCredentials: true });

    const connectionTimeout = setTimeout(() => {
      if (eventSource.readyState !== EventSource.OPEN) {
        console.warn("SSE: Connection timeout");
        eventSource.close();
      }
    }, 10000);

    eventSource.onopen = () => {
      clearTimeout(connectionTimeout);
      console.log("SSE Connection: Established");
    };

    eventSource.onerror = (error) => {
      clearTimeout(connectionTimeout);
      console.error("SSE Connection: Error occurred", {
        readyState: eventSource.readyState,
        status: (error as any).status
      });

      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("SSE Connection: Closed by server");
      }
    };

    return eventSource;
  } catch (error) {
    console.error("SSE: Failed to create connection", error);
    return null;
  }
};

export const closeSSEConnection = (eventSource: EventSource | null) => {
  if (eventSource) {
    try {
      eventSource.close();
      console.log("SSE Connection: Manually closed");
    } catch (error) {
      console.error("SSE: Error closing connection", error);
    }
  }
};