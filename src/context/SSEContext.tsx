'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createSSEConnection, closeSSEConnection } from "@/services/sse.service";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth";

type SSEEventType =
  'new_staff_notification' |
  'leads_list_refresh' |
  'staff_list_refresh' |
  'new_sa_notification' |
  'sa_company_list_refresh' |
  'sa_subscription_status_update' |
  'sa_finance_update' |
  'keep-alive';

type SSEListener = (data: any) => void;

interface SSEContextType {
  eventSource: EventSource | null;
  subscribe: (eventType: SSEEventType, listener: SSEListener) => () => void;
  isConnected: boolean;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

export const SSEProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuth();
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const listenersRef = useRef<Map<SSEEventType, Set<SSEListener>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();

  const dispatchMessage = useCallback((eventType: SSEEventType, event: MessageEvent) => {
    const listeners = listenersRef.current.get(eventType);
    if (!listeners) return;

    let data: any;
    try {
      if (eventType === 'keep-alive' && event.data === 'heartbeat') {
          data = { type: 'heartbeat' };
      } else {
          data = JSON.parse(event.data);
      }
    } catch {
      data = event.data;
    }

    listeners.forEach(listener => listener(data));
  }, []);

  const setupSourceListeners = useCallback((source: EventSource) => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    source.onopen = () => {
        console.log("SSE Connection: Successfully Established");
        setIsConnected(true);
        setConnectionAttempts(0);
    };

    source.onerror = (error) => {
        console.error("SSE Connection: Error", error);
        setIsConnected(false);
        source.close();
    };

    source.onmessage = (event) => {
        dispatchMessage('keep-alive', event);
    };

    for (const eventType of listenersRef.current.keys()) {
        source.addEventListener(eventType, (event) => {
            dispatchMessage(eventType, event);
        });
    }

    connectionTimeoutRef.current = setTimeout(() => {
        if (source.readyState !== EventSource.OPEN) {
            console.warn("SSE Connection: Timeout - connection did not establish");
            source.close();
            setEventSource(null);
        }
    }, 5000);
  }, [dispatchMessage]);

  const connect = useCallback(() => {
    const token = getAuthToken();

    if (!token) {
        console.warn("SSE Connection: No token available");
        return;
    }

    if (connectionAttempts > 3) {
        console.error("SSE Connection: Max reconnection attempts reached");
        return;
    }

    console.log("SSE Connection: Attempting to connect...", { attempt: connectionAttempts + 1 });

    const newSource = createSSEConnection(token);

    if (newSource) {
      setupSourceListeners(newSource);
      setEventSource(newSource);
      setConnectionAttempts(prev => prev + 1);
    } else {
        console.error("SSE Connection: Failed to create connection");
        setIsConnected(false);
    }
  }, [connectionAttempts, setupSourceListeners]);

  const reconnect = useCallback(() => {
    console.log("SSE Connection: Reconnecting...");

    if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
    }

    setEventSource(null);
    setIsConnected(false);

    reconnectTimeoutRef.current = setTimeout(() => {
        connect();
    }, 2000);
  }, [eventSource, connect]);

  useEffect(() => {

    if (!isInitialized || !isAuthenticated) {
        if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
            eventSource.close();
        }
        setEventSource(null);
        setIsConnected(false);
        return;
    }

    const token = getAuthToken();

    if (!token) {
        console.warn("SSE: Token not available yet");
        return;
    }

    if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
        connect();
    }

    return () => {
      // Cleanup
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, isInitialized, connect, eventSource]);

  useEffect(() => {
    if (!isConnected && isAuthenticated && isInitialized && eventSource === null) {
        const reconnectDelay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
        console.log(`SSE: Will attempt reconnection in ${reconnectDelay}ms`);

        reconnectTimeoutRef.current = setTimeout(() => {
            connect();
        }, reconnectDelay);

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }
  }, [isConnected, isAuthenticated, isInitialized, eventSource, connectionAttempts, connect]);

  const subscribe = useCallback((eventType: SSEEventType, listener: SSEListener) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
      if (eventSource && eventSource.readyState === EventSource.OPEN) {
          eventSource.addEventListener(eventType, (event) => {
              dispatchMessage(eventType, event);
          });
      }
    }

    listenersRef.current.get(eventType)?.add(listener);

    return () => {
      listenersRef.current.get(eventType)?.delete(listener);
    };
  }, [eventSource, dispatchMessage]);

  const value = { eventSource, subscribe, isConnected };

  return <SSEContext.Provider value={value}>{children}</SSEContext.Provider>;
};

export const useSSEContext = () => {
  const context = useContext(SSEContext);
  if (context === undefined) {
    throw new Error("useSSEContext must be used within an SSEProvider");
  }
  return context;
};