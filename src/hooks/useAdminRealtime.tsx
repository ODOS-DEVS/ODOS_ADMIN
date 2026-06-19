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
  const { adminUser, isHydrating, refreshAdminUser, token } = useAdminAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const connectGenerationRef = useRef(0);
  const isDocumentVisibleRef = useRef(true);
  const latestTokenRef = useRef<string | null>(null);
  const connectedUrlRef = useRef<string | null>(null);
  const shouldReconnectRef = useRef(false);
  const refreshAdminUserRef = useRef(refreshAdminUser);
  const listenersRef = useRef<
    Map<string, Set<(event: AdminRealtimeEventEnvelope) => void>>
  >(new Map());
  const [connectionState, setConnectionState] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  refreshAdminUserRef.current = refreshAdminUser;

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const teardownSocket = useCallback((socket: WebSocket | null) => {
    if (!socket) {
      return;
    }

    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  }, []);

  const dispatchEvent = useCallback((event: AdminRealtimeEventEnvelope) => {
    listenersRef.current.get(event.type)?.forEach((handler) => handler(event));
    listenersRef.current.get("*")?.forEach((handler) => handler(event));
  }, []);

  const handleSocketMessage = useCallback(
    async (raw: string) => {
      try {
        const event = JSON.parse(raw) as AdminRealtimeEventEnvelope;
        dispatchEvent(event);

        if (event.type === "account.updated") {
          await refreshAdminUserRef.current();
        }
      } catch {
        // Ignore malformed realtime messages.
      }
    },
    [dispatchEvent],
  );

  const connectRef = useRef<(nextToken: string) => void>(() => {});

  const scheduleReconnect = useCallback(
    (nextToken: string) => {
      if (!shouldReconnectRef.current || !isDocumentVisibleRef.current) {
        return;
      }

      clearReconnectTimeout();
      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;
      const delay = Math.min(1000 * 2 ** (attempt - 1), MAX_RECONNECT_DELAY_MS);

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        if (!shouldReconnectRef.current || latestTokenRef.current !== nextToken) {
          return;
        }
        connectRef.current(nextToken);
      }, delay);
    },
    [clearReconnectTimeout],
  );

  const connect = useCallback(
    (nextToken: string) => {
      if (!isDocumentVisibleRef.current) {
        return;
      }

      const nextUrl = buildWebSocketUrl(nextToken);
      const existingSocket = socketRef.current;

      if (
        existingSocket &&
        connectedUrlRef.current === nextUrl &&
        (existingSocket.readyState === WebSocket.OPEN ||
          existingSocket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      shouldReconnectRef.current = true;
      clearReconnectTimeout();

      if (existingSocket) {
        teardownSocket(existingSocket);
        socketRef.current = null;
      }

      const generation = connectGenerationRef.current + 1;
      connectGenerationRef.current = generation;

      setConnectionState("connecting");
      const socket = new WebSocket(nextUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (connectGenerationRef.current !== generation) {
          return;
        }

        reconnectAttemptRef.current = 0;
        connectedUrlRef.current = nextUrl;
        setConnectionState("connected");
      };

      socket.onmessage = (event) => {
        if (connectGenerationRef.current !== generation) {
          return;
        }
        void handleSocketMessage(String(event.data ?? ""));
      };

      socket.onerror = () => {
        if (connectGenerationRef.current !== generation) {
          return;
        }
        setConnectionState("disconnected");
      };

      socket.onclose = () => {
        if (connectGenerationRef.current !== generation) {
          return;
        }

        if (socketRef.current === socket) {
          socketRef.current = null;
        }
        connectedUrlRef.current = null;
        setConnectionState("disconnected");

        if (!shouldReconnectRef.current || latestTokenRef.current !== nextToken) {
          return;
        }

        if (!isDocumentVisibleRef.current) {
          return;
        }

        scheduleReconnect(nextToken);
      };
    },
    [clearReconnectTimeout, handleSocketMessage, scheduleReconnect, teardownSocket],
  );

  connectRef.current = connect;

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    connectGenerationRef.current += 1;
    clearReconnectTimeout();
    reconnectAttemptRef.current = 0;
    connectedUrlRef.current = null;
    teardownSocket(socketRef.current);
    socketRef.current = null;
    setConnectionState("disconnected");
  }, [clearReconnectTimeout, teardownSocket]);

  const adminUserId = adminUser?.id ?? null;

  useEffect(() => {
    latestTokenRef.current = token;

    if (isHydrating) {
      return;
    }

    if (!token || !adminUserId) {
      disconnect();
      return;
    }

    if (!isDocumentVisibleRef.current) {
      return;
    }

    connect(token);

    return () => {
      shouldReconnectRef.current = false;
      connectGenerationRef.current += 1;
      clearReconnectTimeout();
      teardownSocket(socketRef.current);
      socketRef.current = null;
      connectedUrlRef.current = null;
      setConnectionState("disconnected");
    };
  }, [adminUserId, connect, disconnect, isHydrating, clearReconnectTimeout, teardownSocket, token]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isDocumentVisibleRef.current = document.visibilityState === "visible";
      if (isDocumentVisibleRef.current) {
        const activeToken = latestTokenRef.current;
        if (activeToken && adminUserId && !socketRef.current) {
          shouldReconnectRef.current = true;
          connect(activeToken);
        }
        return;
      }

      shouldReconnectRef.current = false;
      clearReconnectTimeout();
      connectGenerationRef.current += 1;
      teardownSocket(socketRef.current);
      socketRef.current = null;
      connectedUrlRef.current = null;
      setConnectionState("disconnected");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [adminUserId, clearReconnectTimeout, connect, teardownSocket]);

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
