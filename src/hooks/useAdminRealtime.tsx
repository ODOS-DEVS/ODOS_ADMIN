import { API_BASE_URL } from "@/api/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type AdminRealtimeEventEnvelope = {
  type: string;
  payload?: unknown;
  occurred_at?: string;
};

type AdminRealtimeContextValue = {
  connectionState: "disconnected" | "connecting" | "connected";
  subscribe: (
    eventType: string,
    handler: (event: AdminRealtimeEventEnvelope) => void,
  ) => () => void;
};

const AdminRealtimeContext = createContext<AdminRealtimeContextValue | undefined>(undefined);
const MAX_RECONNECT_DELAY_MS = 10000;

function buildWebSocketUrl(token: string) {
  const base = API_BASE_URL.replace(/\/api\/?$/, "");
  const wsBase = base.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://");
  return `${wsBase}/api/ws?token=${encodeURIComponent(token)}`;
}

export function AdminRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { adminUser, refreshAdminUser, token } = useAdminAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isDocumentVisibleRef = useRef(true);
  const latestTokenRef = useRef<string | null>(null);
  const listenersRef = useRef<
    Map<string, Set<(event: AdminRealtimeEventEnvelope) => void>>
  >(new Map());
  const [connectionState, setConnectionState] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    reconnectAttemptRef.current = 0;
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setConnectionState("disconnected");
  }, [clearReconnectTimeout]);

  const dispatchEvent = useCallback((event: AdminRealtimeEventEnvelope) => {
    const exactListeners = listenersRef.current.get(event.type);
    exactListeners?.forEach((handler) => handler(event));

    const wildcardListeners = listenersRef.current.get("*");
    wildcardListeners?.forEach((handler) => handler(event));
  }, []);

  const handleSocketMessage = useCallback(
    async (raw: string) => {
      try {
        const event = JSON.parse(raw) as AdminRealtimeEventEnvelope;
        dispatchEvent(event);

        if (event.type === "account.updated") {
          await refreshAdminUser();
        }
      } catch {
        // Ignore malformed realtime messages.
      }
    },
    [dispatchEvent, refreshAdminUser],
  );

  const connect = useCallback(
    (nextToken: string) => {
      if (!isDocumentVisibleRef.current) {
        return;
      }

      clearReconnectTimeout();

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      setConnectionState("connecting");
      const socket = new WebSocket(buildWebSocketUrl(nextToken));
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        setConnectionState("connected");
      };

      socket.onmessage = (event) => {
        void handleSocketMessage(String(event.data ?? ""));
      };

      socket.onerror = () => {
        setConnectionState("disconnected");
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }
        setConnectionState("disconnected");

        if (!latestTokenRef.current || !isDocumentVisibleRef.current) {
          return;
        }

        const attempt = reconnectAttemptRef.current + 1;
        reconnectAttemptRef.current = attempt;
        const delay = Math.min(1000 * 2 ** (attempt - 1), MAX_RECONNECT_DELAY_MS);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          if (!latestTokenRef.current || !isDocumentVisibleRef.current) {
            return;
          }
          connect(latestTokenRef.current);
        }, delay);
      };
    },
    [clearReconnectTimeout, handleSocketMessage],
  );

  useEffect(() => {
    latestTokenRef.current = token;
    if (!token || !adminUser) {
      disconnect();
      return;
    }

    if (!isDocumentVisibleRef.current) {
      return;
    }

    connect(token);

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [adminUser, connect, disconnect, token]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isDocumentVisibleRef.current = document.visibilityState === "visible";
      if (isDocumentVisibleRef.current) {
        const activeToken = latestTokenRef.current;
        if (activeToken && !socketRef.current) {
          connect(activeToken);
        }
        return;
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [connect]);

  const subscribe = useCallback(
    (eventType: string, handler: (event: AdminRealtimeEventEnvelope) => void) => {
      const bucket = listenersRef.current.get(eventType) ?? new Set();
      bucket.add(handler);
      listenersRef.current.set(eventType, bucket);

      return () => {
        const currentBucket = listenersRef.current.get(eventType);
        if (!currentBucket) {
          return;
        }

        currentBucket.delete(handler);
        if (currentBucket.size === 0) {
          listenersRef.current.delete(eventType);
        }
      };
    },
    [],
  );

  const value = useMemo<AdminRealtimeContextValue>(
    () => ({
      connectionState,
      subscribe,
    }),
    [connectionState, subscribe],
  );

  return (
    <AdminRealtimeContext.Provider value={value}>{children}</AdminRealtimeContext.Provider>
  );
}

export function useAdminRealtime() {
  const context = useContext(AdminRealtimeContext);
  if (!context) {
    throw new Error("useAdminRealtime must be used within AdminRealtimeProvider");
  }

  return context;
}
