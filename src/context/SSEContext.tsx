'use client'; // <-- FIX: Adding the directive here resolves all the reported errors

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createSSEConnection, closeSSEConnection } from "@/services/sse.service";
import { useAuth } from "@/hooks/useAuth";

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
  const { isAuthenticated } = useAuth();
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const listenersRef = useRef<Map<SSEEventType, Set<SSEListener>>>(new Map());

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
    source.onopen = () => {
        setIsConnected(true);
    };

    source.onerror = () => {
        setIsConnected(false);
    };

    source.onmessage = (event) => {
        dispatchMessage('keep-alive', event);
    };

    for (const eventType of listenersRef.current.keys()) {
        source.addEventListener(eventType, (event) => {
            dispatchMessage(eventType, event);
        });
    }
  }, [dispatchMessage]);

  const connect = useCallback(() => {
    const newSource = createSSEConnection();

    if (newSource) {
      setupSourceListeners(newSource);
      setEventSource(newSource);
    } else {
        setIsConnected(false);
    }
  }, [setupSourceListeners]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!eventSource || eventSource.readyState === EventSource.CLOSED || eventSource.readyState === EventSource.CONNECTING) {
        connect();
      }
    } else {
      closeSSEConnection(eventSource);
      setEventSource(null);
      setIsConnected(false);
    }

    return () => {
      closeSSEConnection(eventSource);
    };
  }, [isAuthenticated, connect]);

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