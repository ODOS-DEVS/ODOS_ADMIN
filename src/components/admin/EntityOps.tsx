import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listEventLogs, type SystemEventLog } from "@/api/auditApi";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatDateTime } from "@/utils/format";

type EntityTimelineProps = {
  entityType: string;
  entityId: string;
  /** When set, also include events where this user is the actor (useful for user dossiers). */
  actorId?: string | null;
  title?: string;
  description?: string;
};

function summarizeState(state: Record<string, unknown> | null) {
  if (!state || Object.keys(state).length === 0) return null;
  return Object.entries(state)
    .slice(0, 6)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

function TimelineEvent({ event }: { event: SystemEventLog }) {
  const before = summarizeState(event.beforeState);
  const after = summarizeState(event.afterState);
  const reason =
    typeof event.metadata?.reason === "string"
      ? event.metadata.reason
      : typeof event.metadata?.note === "string"
        ? event.metadata.note
        : null;

  return (
    <li className="relative pl-6">
      <span className="absolute left-[5px] top-2 size-2.5 rounded-full bg-accent shadow-[0_0_0_3px_rgba(249,115,22,0.18)]" />
      <div className="rounded-xl border border-line bg-surfaceMuted px-3.5 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-textStrong">{event.action}</p>
            <p className="mt-0.5 text-xs text-textMuted">
              {event.eventType}
              {event.actorType ? ` · ${event.actorType}` : ""}
              {event.actorId ? ` · ${event.actorId.slice(0, 8)}…` : ""}
            </p>
          </div>
          <p className="shrink-0 text-[11px] tabular-nums text-textMuted">
            {formatDateTime(event.createdAt)}
          </p>
        </div>
        {reason ? <p className="mt-2 text-xs text-textMuted">Reason: {reason}</p> : null}
        {before ? (
          <p className="mt-2 text-[11px] leading-5 text-textMuted">Before: {before}</p>
        ) : null}
        {after ? (
          <p className="mt-1 text-[11px] leading-5 text-textMuted">After: {after}</p>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Entity-scoped audit timeline for 360° dossiers.
 * Lazy-loads when mounted (put inside a tab panel).
 */
export function EntityTimeline({
  entityType,
  entityId,
  actorId,
  title = "Activity timeline",
  description = "Administrative and system events for this record",
}: EntityTimelineProps) {
  const { token } = useAdminAuth();
  const [events, setEvents] = useState<SystemEventLog[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !entityId) return;
    setIsLoading(true);
    setError(null);
    try {
      const primary = await listEventLogs(token, {
        entityType,
        entityId,
        limit: 80,
      });
      let items = primary.items;
      if (actorId) {
        const asActor = await listEventLogs(token, {
          actorId,
          limit: 40,
        });
        const seen = new Set(items.map((item) => item.id));
        for (const event of asActor.items) {
          if (!seen.has(event.id)) {
            items.push(event);
            seen.add(event.id);
          }
        }
        items = items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
      setEvents(items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load timeline.");
    } finally {
      setIsLoading(false);
    }
  }, [actorId, entityId, entityType, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = events.filter((event) => {
    const haystack = [event.action, event.eventType, event.actorType, event.actorId ?? ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <SectionCard
      compact
      title={title}
      description={description}
      action={
        <Button variant="ghost" onClick={() => void load()} disabled={isLoading}>
          Refresh
        </Button>
      }
    >
      <div className="mb-3 max-w-sm">
        <SearchInput
          placeholder="Filter timeline…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {isLoading ? (
        <LoadingState size="sm" label="Loading timeline…" />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No timeline events yet"
          description="Status changes and admin actions will appear here as they happen."
        />
      ) : (
        <ol className="relative space-y-3 border-l border-line pl-1">
          {filtered.map((event) => (
            <TimelineEvent key={event.id} event={event} />
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

export type RelatedRecord = {
  id: string;
  label: string;
  meta?: string;
  href: string;
  status?: string;
};

export function RelatedRecordsCard({
  title,
  description,
  records,
  emptyLabel = "No related records.",
}: {
  title: string;
  description?: string;
  records: RelatedRecord[];
  emptyLabel?: string;
}) {
  const navigate = useNavigate();

  return (
    <SectionCard compact title={title} description={description}>
      {records.length === 0 ? (
        <p className="text-sm text-textMuted">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <button
              key={record.id}
              type="button"
              onClick={() => navigate(record.href)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surfaceMuted px-4 py-3.5 text-left transition hover:border-accent/30 hover:bg-surface"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-textStrong">
                  {record.label}
                </span>
                {record.meta ? (
                  <span className="mt-0.5 block truncate text-xs text-textMuted">{record.meta}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs font-semibold text-accent">Open</span>
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
