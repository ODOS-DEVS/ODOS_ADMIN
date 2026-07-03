import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { getEventLogStats, listEventLogs, type EventLogStats, type SystemEventLog } from "@/api/auditApi";
import { LiveEventFeed } from "@/components/audit/LiveEventFeed";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { formatDateTime } from "@/utils/format";

export function AuditLogPage() {
  const { token } = useAdminAuth();
  const { canAccess } = useAdminPermissions();
  const [events, setEvents] = useState<SystemEventLog[]>([]);
  const [stats, setStats] = useState<EventLogStats | null>(null);
  const [search, setSearch] = useState("");
  const [actorType, setActorType] = useState("");
  const [eventType, setEventType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadData = useCallback(async () => {
    if (!token || !canAccess("audit_log")) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [logs, nextStats] = await Promise.all([
        listEventLogs(token, {
          search: search.trim() || undefined,
          actorType: actorType || undefined,
          eventType: eventType || undefined,
          limit: 50,
        }),
        getEventLogStats(token),
      ]);
      setEvents(logs.items);
      setHasMore(logs.hasMore);
      setStats(nextStats);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  }, [actorType, canAccess, eventType, search, token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!canAccess("audit_log")) {
    return (
      <ErrorState
        title="Access restricted"
        description="Your admin role does not include audit log access."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accentSoft">
          Security & compliance
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-textStrong">Audit log</h1>
        <p className="mt-1 text-sm text-textMuted">
          Searchable trace of user, admin, and system events across Odos.
        </p>
      </div>

      {stats ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Events (24h)" value={String(stats.last24h)} icon={ShieldCheck} />
          <StatCard label="Admin actions (24h)" value={String(stats.adminActions24h)} icon={ShieldCheck} />
          <StatCard label="Auth failures (24h)" value={String(stats.authFailures24h)} icon={ShieldAlert} tone="warning" />
          <StatCard label="Rate limits (24h)" value={String(stats.rateLimits24h)} icon={ShieldAlert} tone="warning" />
        </div>
      ) : null}

      <SectionCard title="Live activity" description="Real-time admin and security events">
        <LiveEventFeed />
      </SectionCard>

      <SectionCard
        title="Audit explorer"
        description="Filter by actor, event type, or free-text search"
        action={
          <Button variant="ghost" onClick={() => void loadData()}>
            Refresh
          </Button>
        }
      >
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search action, entity, event type"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-textStrong outline-none focus:border-accent/40"
          />
          <select
            value={actorType}
            onChange={(event) => setActorType(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-textStrong outline-none focus:border-accent/40"
          >
            <option value="">All actors</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="system">System</option>
            <option value="anonymous">Anonymous</option>
          </select>
          <select
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-textStrong outline-none focus:border-accent/40"
          >
            <option value="">All event types</option>
            <option value="user.login">User login</option>
            <option value="user.signup">User signup</option>
            <option value="admin.product_mutation">Admin product</option>
            <option value="admin.order_mutation">Admin order</option>
            <option value="system.auth_failure">Auth failure</option>
            <option value="system.rate_limit_triggered">Rate limit</option>
          </select>
        </div>

        {error ? (
          <ErrorState description={error} onRetry={() => void loadData()} />
        ) : isLoading ? (
          <p className="text-sm text-textMuted">Loading audit events…</p>
        ) : (
          <>
            <DataTable
              columns={[
                {
                  key: "when",
                  header: "When",
                  render: (row) => formatDateTime(row.createdAt),
                },
                {
                  key: "event",
                  header: "Event",
                  render: (row) => (
                    <div>
                      <p className="font-medium text-textStrong">{row.eventType}</p>
                      <p className="text-xs text-textMuted">{row.action}</p>
                    </div>
                  ),
                },
                {
                  key: "actor",
                  header: "Actor",
                  render: (row) => (
                    <div>
                      <p>{row.actorType}</p>
                      <p className="text-xs text-textMuted">{row.actorId ?? "—"}</p>
                    </div>
                  ),
                },
                {
                  key: "entity",
                  header: "Entity",
                  render: (row) =>
                    row.entityType ? `${row.entityType} · ${row.entityId ?? "—"}` : "—",
                },
              ]}
              data={events}
              keyExtractor={(row) => row.id}
            />
            {hasMore ? (
              <p className="mt-3 text-xs text-textMuted">Showing latest 50 events. Refine filters to narrow results.</p>
            ) : null}
          </>
        )}
      </SectionCard>
    </div>
  );
}
