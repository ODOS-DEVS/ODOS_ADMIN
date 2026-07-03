import { useCallback, useEffect, useState } from "react";

import { listEventLogs, mapEventLog, type SystemEventLog } from "@/api/auditApi";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";
import { formatDateTime } from "@/utils/format";

const MAX_LIVE_EVENTS = 25;

function summarizeEvent(event: SystemEventLog) {
  const actor = event.actorId ? `${event.actorType}:${event.actorId.slice(0, 8)}` : event.actorType;
  const target = event.entityType && event.entityId ? `${event.entityType} ${event.entityId}` : "";
  return `${event.action} · ${actor}${target ? ` · ${target}` : ""}`;
}

type LiveEventFeedProps = {
  compact?: boolean;
};

export function LiveEventFeed({ compact = false }: LiveEventFeedProps) {
  const { token } = useAdminAuth();
  const { canAccess } = useAdminPermissions();
  const { subscribe, connectionState } = useAdminRealtime();
  const [events, setEvents] = useState<SystemEventLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInitial = useCallback(async () => {
    if (!token || !canAccess("audit_log")) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await listEventLogs(token, { limit: MAX_LIVE_EVENTS });
      setEvents(response.items);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, token]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!canAccess("audit_log")) return;

    return subscribe("admin.event_log.created", (envelope) => {
      const payload = envelope.payload as Record<string, unknown> | undefined;
      if (!payload || typeof payload.id !== "string") return;

      const mapped = mapEventLog(payload as Parameters<typeof mapEventLog>[0]);
      setEvents((current) => {
        const next = [mapped, ...current.filter((item) => item.id !== mapped.id)];
        return next.slice(0, MAX_LIVE_EVENTS);
      });
    });
  }, [canAccess, subscribe]);

  if (!canAccess("audit_log")) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-textMuted">
        Audit log access is not enabled for your admin role.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-xs text-textMuted">Loading live activity…</p>;
  }

  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-textMuted">
        No audit events yet. Actions across the platform will stream here in real time.
      </p>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-textMuted">
        Live stream · {connectionState === "connected" ? "connected" : "offline"}
      </p>
      <div className={compact ? "max-h-[240px] space-y-2 overflow-y-auto pr-1" : "space-y-2"}>
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-textStrong">{event.eventType}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-textMuted">
                  {summarizeEvent(event)}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-textMuted">
                {event.actorType}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-textMuted">{formatDateTime(event.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
