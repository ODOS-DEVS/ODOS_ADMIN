import { requestJson } from "@/api/client";

export type SystemEventLog = {
  id: string;
  eventType: string;
  actorType: string;
  actorId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type EventLogStats = {
  totalEvents: number;
  last24h: number;
  authFailures24h: number;
  rateLimits24h: number;
  adminActions24h: number;
  securityEvents24h: number;
};

type BackendEventLog = {
  id: string;
  event_type: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export function mapEventLog(row: BackendEventLog): SystemEventLog {
  return {
    id: row.id,
    eventType: row.event_type,
    actorType: row.actor_type,
    actorId: row.actor_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata,
    beforeState: row.before_state,
    afterState: row.after_state,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}

export type EventLogQuery = {
  eventType?: string;
  actorType?: string;
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
};

export async function listEventLogs(token: string, query: EventLogQuery = {}) {
  const params = new URLSearchParams();
  if (query.eventType) params.set("event_type", query.eventType);
  if (query.actorType) params.set("actor_type", query.actorType);
  if (query.actorId) params.set("actor_id", query.actorId);
  if (query.action) params.set("action", query.action);
  if (query.entityType) params.set("entity_type", query.entityType);
  if (query.entityId) params.set("entity_id", query.entityId);
  if (query.search) params.set("search", query.search);
  if (query.since) params.set("since", query.since);
  if (query.until) params.set("until", query.until);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.offset) params.set("offset", String(query.offset));

  const suffix = params.toString();
  const response = await requestJson<{ items: BackendEventLog[]; has_more: boolean }>(
    `/admin/event-logs${suffix ? `?${suffix}` : ""}`,
    { token },
  );

  return {
    items: response.items.map(mapEventLog),
    hasMore: response.has_more,
  };
}

export async function getEventLogStats(token: string): Promise<EventLogStats> {
  const response = await requestJson<{
    total_events: number;
    last_24h: number;
    auth_failures_24h: number;
    rate_limits_24h: number;
    admin_actions_24h: number;
    security_events_24h: number;
  }>("/admin/event-logs/stats", { token });

  return {
    totalEvents: response.total_events,
    last24h: response.last_24h,
    authFailures24h: response.auth_failures_24h,
    rateLimits24h: response.rate_limits_24h,
    adminActions24h: response.admin_actions_24h,
    securityEvents24h: response.security_events_24h,
  };
}
