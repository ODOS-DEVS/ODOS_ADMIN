import {
  Clock3,
  Headset,
  MessageSquareMore,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  UserRound,
  Wifi,
  WifiOff,
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
import { LoadingState } from "@/components/ui/LoadingState";
import { AdminFullHeader } from "@/components/admin/AdminShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  useAdminRealtime,
  type AdminRealtimeEventEnvelope,
} from "@/hooks/useAdminRealtime";
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
) {
  if (status === "resolved") {
    return {
      label: "Resolved",
      tone: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
    };
  }

  if (status === "waiting_on_customer") {
    return {
      label: role === "vendor" ? "Waiting on vendor" : "Waiting on customer",
      tone: "border-sky-400/25 bg-sky-500/10 text-sky-100",
    };
  }

  return {
    label: "Waiting on admin",
    tone: "border-amber-400/25 bg-amber-500/10 text-amber-100",
  };
}

function getConnectionMeta(
  state: "disconnected" | "connecting" | "connected",
) {
  if (state === "connected") {
    return {
      label: "Live",
      tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
      Icon: Wifi,
    };
  }

  if (state === "connecting") {
    return {
      label: "Reconnecting",
      tone: "border-amber-400/30 bg-amber-500/10 text-amber-100",
      Icon: RefreshCw,
    };
  }

  return {
    label: "Offline",
    tone: "border-red-400/30 bg-red-500/10 text-red-100",
    Icon: WifiOff,
  };
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
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupportChatStatus | "all">("all");
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
    <div className="space-y-6">
      <AdminFullHeader
        eyebrow="Support chats"
        title="Complete support inbox"
        description="All customer support threads and conversations."
        backRoute="/support-chats"
        onRefresh={() => void loadThreads()}
        refreshing={isLoadingThreads}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${connectionMeta.tone}`}
            >
              <connectionMeta.Icon
                className={`size-4 ${connectionState === "connecting" ? "animate-spin" : ""}`}
              />
              <span>{connectionMeta.label}</span>
            </div>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-accentSoft">Open threads</p>
          <p className="mt-2 text-2xl font-semibold text-textStrong">{threadCounts.all}</p>
        </div>
        <div className="rounded-[22px] border border-amber-400/20 bg-amber-500/10 px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-100/80">Waiting on admin</p>
          <p className="mt-2 text-2xl font-semibold text-textStrong">{threadCounts.waiting_on_admin}</p>
        </div>
        <div className="rounded-[22px] border border-sky-400/20 bg-sky-500/10 px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-sky-100/80">Waiting on user</p>
          <p className="mt-2 text-2xl font-semibold text-textStrong">{threadCounts.waiting_on_customer}</p>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-accentSoft">Unread messages</p>
          <p className="mt-2 text-2xl font-semibold text-textStrong">{unreadTotal}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px,minmax(0,1fr)] xl:items-stretch">
        <section className="flex min-h-[640px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-panel/90 shadow-glow">
          <div className="border-b border-white/10 px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-textStrong">Open conversations</h2>
                <p className="mt-1 text-[13px] text-textMuted">
                  Compact queue for live support threads.
                </p>
              </div>
              <div className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-textMuted">
                {filteredThreads.length} threads
              </div>
            </div>
            <div className="mt-4">
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by person, topic, or message"
              />
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition ${
                      isActive
                        ? "border-accent/40 bg-accent/15 text-textStrong"
                        : "border-white/10 bg-white/[0.03] text-textMuted hover:bg-white/[0.06]"
                    }`}
                  >
                    {statusFilterLabels[filter]} · {threadCounts[filter]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2.5 py-2.5">
            {filteredThreads.length === 0 ? (
              <EmptyState
                title="No support chats yet"
                description="When a shopper or vendor reaches ODOS support from the mobile app, the conversation will appear here."
              />
            ) : (
              <div className="space-y-1.5">
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
                      className={`w-full rounded-[18px] border px-3 py-2.5 text-left transition ${
                        isSelected
                          ? "border-accent/50 bg-accent/10 shadow-glow"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[16px] ${
                            isVendor ? "bg-sky-500/12 text-sky-200" : "bg-emerald-500/12 text-emerald-200"
                          }`}
                        >
                          {isVendor ? <Store className="size-[15px]" /> : <UserRound className="size-[15px]" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-[13px] font-semibold text-textStrong">
                                  {thread.counterpart.name}
                                </p>
                                <span
                                  className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusMeta.tone}`}
                                >
                                  {statusMeta.label}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-accentSoft">
                                {roleCopy[thread.counterpart.role]} · {thread.store.title}
                              </p>
                              {thread.assignedAdminName ? (
                                <p className="mt-1 truncate text-[10px] text-textMuted">
                                  Owned by {thread.assignedAdminName}
                                </p>
                              ) : null}
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-[10px] text-textMuted">
                                {formatThreadTime(thread.lastMessageAt ?? thread.updatedAt)}
                              </p>
                              {thread.unreadCount > 0 ? (
                                <span className="mt-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-slate-950">
                                  {thread.unreadCount}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <p className="mt-1.5 truncate text-[11px] font-medium text-textStrong/90">
                            {thread.subject || "General support conversation"}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-textMuted">
                            {thread.lastMessageText || "No messages yet. Open the thread to reply."}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-[640px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-panel/90 shadow-glow">
          {!selectedThread ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                title="Choose a support thread"
                description="Pick a conversation from the left to read the history and continue the discussion in real time."
              />
            </div>
          ) : (
            <>
              <div className="border-b border-white/10 px-4 py-3.5">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-[18px] bg-accent/12 text-accentSoft">
                        <Headset className="size-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-[17px] font-semibold text-textStrong">
                          {selectedThread.counterpart.name}
                        </h2>
                        <p className="mt-0.5 truncate text-[13px] text-textMuted">
                          {selectedThread.subject || "General support conversation"}
                        </p>
                      </div>
                    </div>
                  </div>

                    <div className="flex flex-wrap items-center gap-2">
                    {selectedStatusMeta ? (
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${selectedStatusMeta.tone}`}
                      >
                        <span>{selectedStatusMeta.label}</span>
                      </div>
                    ) : null}
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-textMuted">
                      {selectedThread.counterpart.role === "vendor" ? (
                        <Store className="size-[14px]" />
                      ) : (
                        <UserRound className="size-[14px]" />
                      )}
                      <span>{roleCopy[selectedThread.counterpart.role]} account</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-textMuted">
                      <Clock3 className="size-[14px]" />
                      <span>{formatDateTime(selectedThread.lastMessageAt ?? selectedThread.updatedAt)}</span>
                    </div>
                    {selectedThread.assignedAdminName ? (
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-textMuted">
                        <ShieldCheck className="size-[14px]" />
                        <span>{selectedThread.assignedAdminName}</span>
                      </div>
                    ) : null}
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/support-chats/full/${selectedThread.id}`)}
                    >
                      Open dossier
                    </Button>
                  </div>
                </div>

                <div className="mt-3.5 grid gap-2.5 md:grid-cols-3">
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-accentSoft">
                      <ShieldCheck className="size-[14px]" />
                      Role
                    </div>
                    <p className="mt-1.5 text-[13px] font-semibold text-textStrong">
                      {roleCopy[selectedThread.counterpart.role]}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-accentSoft">
                      <Headset className="size-[14px]" />
                      Topic
                    </div>
                    <p className="mt-1.5 truncate text-[13px] font-semibold text-textStrong">
                      {selectedThread.subject || "General support"}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-accentSoft">
                      <MessageSquareMore className="size-[14px]" />
                      Messages
                    </div>
                    <p className="mt-1.5 text-[13px] font-semibold text-textStrong">
                      {selectedMessages.length} in this thread
                    </p>
                  </div>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-2.5">
                  {selectedThread.supportStatus === "resolved" ? (
                    <Button
                      variant="secondary"
                      onClick={() => void handleStatusChange("waiting_on_admin")}
                    >
                      Reopen thread
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => void handleStatusChange("resolved")}
                    >
                      Mark resolved
                    </Button>
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
                          <div className="flex justify-center py-2">
                            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-medium text-textMuted">
                              {formatMessageDayLabel(message.time)}
                            </span>
                          </div>
                        ) : null}
                        <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[72%] rounded-[20px] px-3.5 py-2.5 shadow-sm ${
                              isAdmin
                                ? "bg-accent text-slate-950"
                                : "border border-white/10 bg-white/[0.06] text-textStrong"
                            }`}
                          >
                            <p className="text-[13px] leading-5">{message.text}</p>
                            <p
                              className={`mt-1.5 text-[10px] ${
                                isAdmin ? "text-slate-950/70" : "text-textMuted"
                              }`}
                            >
                              {roleCopy[message.senderRole]} · {formatDateTime(message.time)}
                              {isAdmin && message.isRead ? " · Seen" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-white/10 bg-white/[0.03] px-4 py-3.5">
                <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3.5">
                  <textarea
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Write a clear, warm reply. Press Enter to send, Shift+Enter for a new line."
                    className="min-h-[78px] w-full resize-none bg-transparent text-[13px] leading-5 text-textStrong outline-none placeholder:text-textMuted"
                  />
                  <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-textMuted">
                      Keep replies practical and easy to continue if another admin picks this up later.
                    </p>
                    <Button
                      leftIcon={<Send className="size-4" />}
                      onClick={() => void handleSend()}
                      isLoading={isSending}
                      disabled={!composer.trim()}
                    >
                      Send reply
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
