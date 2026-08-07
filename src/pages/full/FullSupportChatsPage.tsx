import {
  ArrowLeft,
  Check,
  Clock3,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  getSupportChatMessages,
  getSupportChatThreads,
  sendSupportChatMessage,
  updateSupportChatThreadStatus,
} from "@/api/chatApi";
import {
  mapSupportChatMessage,
  mapSupportChatThread,
} from "@/api/mappers";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { LoadingState } from "@/components/ui/LoadingState";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  useAdminRealtime,
  type AdminRealtimeEventEnvelope,
} from "@/hooks/useAdminRealtime";
import { useQueueSearchParams } from "@/hooks/useQueueSearchParams";
import { useToast } from "@/hooks/useToast";
import type { SupportChatMessage, SupportChatStatus, SupportChatThread } from "@/types";
import { formatDateTime } from "@/utils/format";

type SupportThreadRealtimePayload = {
  id: string;
  customer_user_id: string;
  vendor_user_id: string;
  thread_type: "support";
  subject?: string | null;
  store: {
    id: string;
    title: string;
    image_key?: string | null;
    image_url?: string | null;
  };
  counterpart: {
    user_id: string;
    name: string;
    avatar_url?: string | null;
    role: "customer" | "vendor" | "admin";
  };
  support_status?: "waiting_on_admin" | "waiting_on_customer" | "resolved" | null;
  assigned_admin_user_id?: string | null;
  assigned_admin_name?: string | null;
  assigned_admin_at?: string | null;
  resolved_at?: string | null;
  last_message_text?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
};

type SupportMessageRealtimePayload = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  sender_role: "customer" | "vendor" | "admin";
  body: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
};

type SupportMessagesReadRealtimePayload = {
  thread_id: string;
  reader_user_id: string;
  message_ids: string[];
  read_at: string;
};

type StatusTone = "success" | "warning" | "info";

const roleCopy = {
  customer: "Customer",
  vendor: "Vendor",
  admin: "Admin",
} as const;

const statusFilters: Array<SupportChatStatus | "all"> = [
  "all",
  "waiting_on_admin",
  "waiting_on_customer",
  "resolved",
];

const statusFilterLabels: Record<SupportChatStatus | "all", string> = {
  all: "All",
  waiting_on_admin: "Waiting on admin",
  waiting_on_customer: "Waiting on user",
  resolved: "Resolved",
};

const statusRailClass: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
};

const statusPillClass: Record<StatusTone, string> = {
  success: "border-success/25 bg-success-soft text-success",
  warning: "border-warning/25 bg-warning-soft text-warning",
  info: "border-info/25 bg-info-soft text-info",
};

function sortThreads(threads: SupportChatThread[]) {
  return [...threads].sort((left, right) => {
    const leftTime = new Date(left.lastMessageAt ?? left.updatedAt).getTime();
    const rightTime = new Date(right.lastMessageAt ?? right.updatedAt).getTime();
    return rightTime - leftTime;
  });
}

function upsertThread(threads: SupportChatThread[], nextThread: SupportChatThread) {
  const existingIndex = threads.findIndex((thread) => thread.id === nextThread.id);
  if (existingIndex < 0) {
    return sortThreads([nextThread, ...threads]);
  }

  const next = [...threads];
  next[existingIndex] = {
    ...next[existingIndex],
    ...nextThread,
  };
  return sortThreads(next);
}

function upsertMessage(messages: SupportChatMessage[], nextMessage: SupportChatMessage) {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);
  if (existingIndex < 0) {
    return [...messages, nextMessage].sort(
      (left, right) => new Date(left.time).getTime() - new Date(right.time).getTime(),
    );
  }

  const next = [...messages];
  next[existingIndex] = nextMessage;
  return next.sort(
    (left, right) => new Date(left.time).getTime() - new Date(right.time).getTime(),
  );
}

function isSameChatDay(left: string, right: string) {
  const a = new Date(left);
  const b = new Date(right);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMessageDayLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  if (isSameChatDay(value, now.toISOString())) {
    return "Today";
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameChatDay(value, yesterday.toISOString())) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatThreadTime(value?: string | null) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getSupportStatusMeta(
  status: SupportChatStatus | null | undefined,
  role: SupportChatThread["counterpart"]["role"],
): { label: string; tone: StatusTone } {
  if (status === "resolved") {
    return { label: "Resolved", tone: "success" };
  }

  if (status === "waiting_on_customer") {
    return { label: role === "vendor" ? "Waiting on vendor" : "Waiting on customer", tone: "info" };
  }

  return { label: "Waiting on admin", tone: "warning" };
}

function getConnectionMeta(state: "disconnected" | "connecting" | "connected") {
  if (state === "connected") {
    return { label: "Live", tone: "success" as const };
  }
  if (state === "connecting") {
    return { label: "Reconnecting", tone: "warning" as const };
  }
  return { label: "Offline", tone: "danger" as const };
}

export function FullSupportChatsPage() {
  const navigate = useNavigate();
  const { adminUser, token } = useAdminAuth();
  const { connectionState, subscribe } = useAdminRealtime();
  const { showToast } = useToast();
  const [threads, setThreads] = useState<SupportChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messagesByThread, setMessagesByThread] = useState<Record<string, SupportChatMessage[]>>(
    {},
  );
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    query: search,
    setQuery: setSearch,
    statusFilter,
    setStatusFilter,
  } = useQueueSearchParams({
    statusValues: ["waiting_on_admin", "waiting_on_customer", "resolved"],
  });
  const [composer, setComposer] = useState("");
  const messageScrollerRef = useRef<HTMLDivElement | null>(null);
  const selectedThreadIdRef = useRef<string | null>(null);
  const threadsRef = useRef<SupportChatThread[]>([]);

  useEffect(() => {
    selectedThreadIdRef.current = selectedThreadId;
  }, [selectedThreadId]);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const node = messageScrollerRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior,
    });
  }, []);

  const loadThreads = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoadingThreads(true);
    setError(null);
    try {
      const result = await getSupportChatThreads(token);
      const sorted = sortThreads(result);
      setThreads(sorted);
      setSelectedThreadId((current) => current ?? sorted[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load support chats.");
    } finally {
      setIsLoadingThreads(false);
    }
  }, [token]);

  const loadMessages = useCallback(
    async (threadId: string) => {
      if (!token) {
        return;
      }

      setIsLoadingMessages(true);
      try {
        const result = await getSupportChatMessages(token, threadId);
        setMessagesByThread((current) => ({ ...current, [threadId]: result }));
        setThreads((current) =>
          current.map((thread) =>
            thread.id === threadId ? { ...thread, unreadCount: 0 } : thread,
          ),
        );
      } catch (loadError) {
        showToast({
          title: "Unable to load messages",
          description:
            loadError instanceof Error ? loadError.message : "Please try again shortly.",
          tone: "error",
        });
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [showToast, token],
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedThreadId) {
      return;
    }

    if (messagesByThread[selectedThreadId]) {
      return;
    }

    void loadMessages(selectedThreadId);
  }, [loadMessages, messagesByThread, selectedThreadId]);

  useEffect(() => {
    const unsubscribeThread = subscribe(
      "chat.thread.updated",
      (event: AdminRealtimeEventEnvelope) => {
        const payload = event.payload as SupportThreadRealtimePayload | undefined;
        if (!payload?.id || payload.thread_type !== "support") {
          return;
        }

        const nextThread = mapSupportChatThread(payload);
        setThreads((current) => upsertThread(current, nextThread));
        setSelectedThreadId((current) => current ?? nextThread.id);
      },
    );

    const unsubscribeMessage = subscribe(
      "chat.message.created",
      (event: AdminRealtimeEventEnvelope) => {
        const payload = event.payload as SupportMessageRealtimePayload | undefined;
        if (!payload?.id || !payload.thread_id) {
          return;
        }

        const knownThreadIds = new Set(threadsRef.current.map((thread) => thread.id));
        if (!knownThreadIds.has(payload.thread_id) && selectedThreadIdRef.current !== payload.thread_id) {
          return;
        }

        const nextMessage = mapSupportChatMessage(payload);
        setMessagesByThread((current) => ({
          ...current,
          [nextMessage.threadId]: upsertMessage(current[nextMessage.threadId] ?? [], nextMessage),
        }));

        if (
          selectedThreadIdRef.current === nextMessage.threadId &&
          nextMessage.senderUserId !== adminUser?.id
        ) {
          void loadMessages(nextMessage.threadId);
        } else if (selectedThreadIdRef.current === nextMessage.threadId) {
          window.requestAnimationFrame(() => {
            scrollMessagesToBottom();
          });
        }
      },
    );

    const unsubscribeRead = subscribe(
      "chat.messages.read",
      (event: AdminRealtimeEventEnvelope) => {
        const payload = event.payload as SupportMessagesReadRealtimePayload | undefined;
        if (!payload?.thread_id || !payload.message_ids?.length) {
          return;
        }

        const readIds = new Set(payload.message_ids);
        setMessagesByThread((current) => {
          const existing = current[payload.thread_id];
          if (!existing?.length) {
            return current;
          }

          return {
            ...current,
            [payload.thread_id]: existing.map((message) =>
              readIds.has(message.id)
                ? {
                    ...message,
                    isRead: true,
                    readAt: payload.read_at,
                  }
                : message,
            ),
          };
        });
      },
    );

    return () => {
      unsubscribeThread();
      unsubscribeMessage();
      unsubscribeRead();
    };
  }, [adminUser?.id, loadMessages, scrollMessagesToBottom, subscribe]);

  useEffect(() => {
    if (!selectedThreadId) {
      return;
    }

    window.requestAnimationFrame(() => {
      scrollMessagesToBottom("auto");
    });
  }, [scrollMessagesToBottom, selectedThreadId]);

  const filteredThreads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return threads.filter((thread) => {
      if (statusFilter !== "all" && (thread.supportStatus ?? "waiting_on_admin") !== statusFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack = [
        thread.counterpart.name,
        thread.subject ?? "",
        thread.lastMessageText ?? "",
        roleCopy[thread.counterpart.role],
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [search, statusFilter, threads]);

  const threadCounts = useMemo(() => {
    return {
      all: threads.length,
      waiting_on_admin: threads.filter(
        (thread) => (thread.supportStatus ?? "waiting_on_admin") === "waiting_on_admin",
      ).length,
      waiting_on_customer: threads.filter(
        (thread) => (thread.supportStatus ?? "waiting_on_admin") === "waiting_on_customer",
      ).length,
      resolved: threads.filter(
        (thread) => (thread.supportStatus ?? "waiting_on_admin") === "resolved",
      ).length,
    } satisfies Record<SupportChatStatus | "all", number>;
  }, [threads]);

  const unreadTotal = useMemo(
    () => threads.reduce((sum, thread) => sum + thread.unreadCount, 0),
    [threads],
  );

  useEffect(() => {
    if (!filteredThreads.length) {
      setSelectedThreadId(null);
      return;
    }

    if (!selectedThreadId || !filteredThreads.some((thread) => thread.id === selectedThreadId)) {
      setSelectedThreadId(filteredThreads[0].id);
    }
  }, [filteredThreads, selectedThreadId]);

  const selectedThread =
    filteredThreads.find((thread) => thread.id === selectedThreadId) ??
    threads.find((thread) => thread.id === selectedThreadId) ??
    null;
  const selectedMessages = selectedThreadId ? messagesByThread[selectedThreadId] ?? [] : [];
  const connectionMeta = getConnectionMeta(connectionState);
  const selectedStatusMeta = selectedThread
    ? getSupportStatusMeta(selectedThread.supportStatus, selectedThread.counterpart.role)
    : null;

  async function handleSend() {
    if (!token || !selectedThreadId || !composer.trim()) {
      return;
    }

    setIsSending(true);
    try {
      const nextMessage = await sendSupportChatMessage(token, selectedThreadId, composer.trim());
      setComposer("");
      setMessagesByThread((current) => ({
        ...current,
        [selectedThreadId]: upsertMessage(current[selectedThreadId] ?? [], nextMessage),
      }));
      setThreads((current) =>
        current.map((thread) =>
          thread.id === selectedThreadId
            ? {
                ...thread,
                lastMessageText: nextMessage.text,
                lastMessageAt: nextMessage.time,
              }
            : thread,
        ),
      );

      window.requestAnimationFrame(() => {
        scrollMessagesToBottom();
      });
    } catch (sendError) {
      showToast({
        title: "Unable to send reply",
        description: sendError instanceof Error ? sendError.message : "Please try again shortly.",
        tone: "error",
      });
    } finally {
      setIsSending(false);
    }
  }

  async function handleStatusChange(status: SupportChatStatus) {
    if (!token || !selectedThreadId) {
      return;
    }

    try {
      const nextThread = await updateSupportChatThreadStatus(token, selectedThreadId, status);
      setThreads((current) => upsertThread(current, nextThread));
      showToast({
        title: status === "resolved" ? "Thread resolved" : "Thread reopened",
        description:
          status === "resolved"
            ? "The support thread is now marked as resolved."
            : "The support thread is active again.",
        tone: "success",
      });
    } catch (statusError) {
      showToast({
        title: "Unable to update thread",
        description:
          statusError instanceof Error ? statusError.message : "Please try again shortly.",
        tone: "error",
      });
    }
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSend();
  }

  if (isLoadingThreads) {
    return <LoadingState label="Loading support conversations..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadThreads()} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium text-textMuted">Support</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-textStrong">
            Support inbox
          </h1>
          <p className="mt-1 max-w-xl text-sm text-textMuted">
            Every shopper and vendor conversation ODOS support is handling, live.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-line bg-surface px-3.5 py-2 shadow-sm">
            <LiveIndicator
              label={connectionMeta.label}
              tone={connectionMeta.tone}
              pulse={connectionState !== "disconnected"}
            />
          </div>
          <Button variant="secondary" leftIcon={<ArrowLeft className="size-4" />} onClick={() => navigate("/support-chats")}>
            Brief overview
          </Button>
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className={`size-4 ${isLoadingThreads ? "animate-spin" : ""}`} />}
            onClick={() => void loadThreads()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Signature: the wire — a live ticker of queue counts */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-panel border border-line bg-surface px-6 py-4 shadow-card">
        {[
          { label: "Open threads", value: threadCounts.all, className: "text-textStrong" },
          { label: "Waiting on admin", value: threadCounts.waiting_on_admin, className: "text-warning" },
          { label: "Waiting on user", value: threadCounts.waiting_on_customer, className: "text-info" },
          { label: "Unread", value: unreadTotal, className: "text-accent" },
        ].map((stat, index) => (
          <div key={stat.label} className={`flex items-baseline gap-3 ${index > 0 ? "border-l border-line pl-8" : ""}`}>
            <span className={`font-display text-2xl font-semibold tabular-nums ${stat.className}`}>
              {stat.value}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-textSubtle">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Console: thread rail + conversation */}
      <div className="grid gap-5 xl:grid-cols-[340px,minmax(0,1fr)] xl:items-stretch">
        <section className="flex min-h-[640px] flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-3.5">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by person, topic, or message"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.06em] transition ${
                      isActive
                        ? "border-accent/40 bg-accent/15 text-accent"
                        : "border-line bg-surfaceMuted text-textMuted hover:bg-line/60"
                    }`}
                  >
                    {statusFilterLabels[filter]} · {threadCounts[filter]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredThreads.length === 0 ? (
              <EmptyState
                title="No support chats yet"
                description="When a shopper or vendor reaches ODOS support from the mobile app, the conversation will appear here."
              />
            ) : (
              <div className="space-y-1">
                {filteredThreads.map((thread) => {
                  const isSelected = thread.id === selectedThreadId;
                  const isVendor = thread.counterpart.role === "vendor";
                  const statusMeta = getSupportStatusMeta(
                    thread.supportStatus,
                    thread.counterpart.role,
                  );

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => {
                        setSelectedThreadId(thread.id);
                        void loadMessages(thread.id);
                      }}
                      className={`relative block w-full overflow-hidden rounded-2xl border pl-4 text-left transition ${
                        isSelected
                          ? "border-accent/40 bg-accent/[0.06] shadow-sm"
                          : "border-transparent hover:bg-surfaceMuted"
                      }`}
                    >
                      <span className={`absolute inset-y-2 left-1.5 w-[3px] rounded-full ${statusRailClass[statusMeta.tone]}`} />
                      <div className="flex items-start gap-3 py-2.5 pr-3">
                        <div
                          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${
                            isVendor ? "bg-accent/10 text-accent" : "bg-info/10 text-info"
                          }`}
                        >
                          {isVendor ? <Store className="size-[14px]" /> : <UserRound className="size-[14px]" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[13px] font-semibold text-textStrong">
                              {thread.counterpart.name}
                            </p>
                            <span className="shrink-0 font-mono text-[10px] text-textSubtle">
                              {formatThreadTime(thread.lastMessageAt ?? thread.updatedAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-textSubtle">
                            {roleCopy[thread.counterpart.role]} · {thread.store.title}
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="truncate text-[12px] text-textMuted">
                              {thread.lastMessageText || thread.subject || "No messages yet"}
                            </p>
                            {thread.unreadCount > 0 ? (
                              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[9px] font-semibold text-accentForeground">
                                {thread.unreadCount}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-[640px] flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-card">
          {!selectedThread ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                title="Choose a support thread"
                description="Pick a conversation from the left to read the history and continue the discussion in real time."
              />
            </div>
          ) : (
            <>
              <div className="border-b border-line px-5 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-textSubtle">
                      {roleCopy[selectedThread.counterpart.role]} · {selectedThread.store.title}
                    </p>
                    <h2 className="mt-1 truncate font-display text-xl font-semibold text-textStrong">
                      {selectedThread.counterpart.name}
                    </h2>
                    <p className="mt-1 truncate text-sm text-textMuted">
                      {selectedThread.subject || "General support conversation"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {selectedStatusMeta ? (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPillClass[selectedStatusMeta.tone]}`}
                      >
                        {selectedStatusMeta.label}
                      </span>
                    ) : null}
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/support-chats/full/${selectedThread.id}`)}
                    >
                      Open dossier
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11px] text-textMuted">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-[13px]" />
                    {formatDateTime(selectedThread.lastMessageAt ?? selectedThread.updatedAt)}
                  </span>
                  {selectedThread.assignedAdminName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="size-[13px]" />
                      {selectedThread.assignedAdminName}
                    </span>
                  ) : null}
                  {selectedThread.supportStatus === "resolved" ? (
                    <button
                      type="button"
                      onClick={() => void handleStatusChange("waiting_on_admin")}
                      className="inline-flex items-center gap-1.5 text-accent hover:underline"
                    >
                      <RotateCcw className="size-[13px]" />
                      Reopen thread
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleStatusChange("resolved")}
                      className="inline-flex items-center gap-1.5 text-accent hover:underline"
                    >
                      <Check className="size-[13px]" />
                      Mark resolved
                    </button>
                  )}
                </div>
              </div>

              <div
                ref={messageScrollerRef}
                className="flex-1 space-y-2.5 overflow-y-auto bg-canvas/50 px-4 py-4"
              >
                {isLoadingMessages && selectedMessages.length === 0 ? (
                  <LoadingState label="Loading messages..." />
                ) : selectedMessages.length === 0 ? (
                  <EmptyState
                    title="No messages yet"
                    description="This support thread is open and ready for the first reply."
                  />
                ) : (
                  selectedMessages.map((message, index) => {
                    const isAdmin = message.senderUserId === adminUser?.id;
                    const previous = selectedMessages[index - 1];
                    const showDay =
                      !previous || !isSameChatDay(previous.time, message.time);

                    return (
                      <div key={message.id}>
                        {showDay ? (
                          <div className="flex items-center gap-3 py-2">
                            <div className="h-px flex-1 bg-line" />
                            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-textSubtle">
                              {formatMessageDayLabel(message.time)}
                            </span>
                            <div className="h-px flex-1 bg-line" />
                          </div>
                        ) : null}
                        <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[72%] rounded-[20px] px-3.5 py-2.5 shadow-sm ${
                              isAdmin
                                ? "rounded-br-md bg-accent text-accentForeground"
                                : "rounded-bl-md border border-line bg-surfaceMuted text-textStrong"
                            }`}
                          >
                            <p className="text-[13px] leading-5">{message.text}</p>
                            <p
                              className={`mt-1.5 font-mono text-[10px] ${
                                isAdmin ? "text-accentForeground/70" : "text-textSubtle"
                              }`}
                            >
                              {formatDateTime(message.time)}
                              {isAdmin && message.isRead ? " · Seen" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-line bg-surface px-4 py-3.5">
                <div className="flex items-end gap-2 rounded-[24px] border border-line bg-surfaceMuted p-2 pl-4">
                  <textarea
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Write a reply..."
                    rows={1}
                    className="min-h-[40px] max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[13px] leading-5 text-textStrong outline-none placeholder:text-textMuted"
                  />
                  <Button
                    className="!size-10 shrink-0 !rounded-full !p-0"
                    onClick={() => void handleSend()}
                    isLoading={isSending}
                    disabled={!composer.trim()}
                    aria-label="Send reply"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
                <p className="mt-2 px-1 text-[11px] text-textMuted">
                  Enter to send · Shift+Enter for a new line
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
