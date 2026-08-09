/** Plain-English labels for the backend's dotted action/event-type
 * constants (see ODOS_MOBILE_BACKEND `app/core/event_types.py` and
 * `app/helpers/admin_audit.py`) — admins reading the timeline/audit log
 * shouldn't need to know the internal event-naming scheme to understand
 * what happened. */
const ACTION_LABELS: Record<string, string> = {
  "admin.login": "Admin signed in",
  "admin.permission_updated": "Changed an admin's permissions",
  "admin.product_mutation": "Edited a product",
  "admin.price_changed": "Changed a price",
  "admin.inventory_changed": "Adjusted inventory",
  "admin.user_mutation": "Edited a user account",
  "admin.role_changed": "Changed a permission role",
  "admin.order_mutation": "Updated an order",
  "admin.refund_mutation": "Processed a refund",
  "admin.vendor_mutation": "Edited a vendor",
  "admin.finance_mutation": "Made a finance change",
  "admin.settings_mutation": "Changed a setting",
  "commerce.checkout_started": "Started checkout",
  "commerce.order_created": "Placed an order",
  "commerce.payment_attempt": "Attempted payment",
  "commerce.product_view": "Viewed a product",
  "commerce.search_query": "Searched the catalog",
  "commerce.cart_updated": "Updated their cart",
  "commerce.order_status_changed": "Order status changed",
  "order.status_updated": "Updated an order's status",
  "product.created": "Added a product",
  "product.updated": "Edited a product",
  "promo.archived": "Archived a promotion",
  "promo.bulk_created": "Bulk-created promotions",
  "promo.created": "Created a promotion",
  "promo.duplicated": "Duplicated a promotion",
  "promo.paused": "Paused a promotion",
  "promo.resumed": "Resumed a promotion",
  "promo.updated": "Updated a promotion",
  "promo.applied": "Applied a promo code",
  "promo.rejected": "Promo code rejected",
  "user.account_status_updated": "Changed a user's account status",
  "user.login": "Signed in",
  "user.login_failed": "Failed sign-in attempt",
  "user.signup": "Created an account",
  "user.logout": "Signed out",
  "user.google_auth": "Signed in with Google",
  "user.profile_updated": "Updated their profile",
  "vendor.status_updated": "Changed a vendor's status",
  "system.api_request_failed": "A request failed",
  "system.auth_failure": "Failed login attempt",
  "system.rate_limit_triggered": "Blocked for too many requests",
  "system.suspicious_activity": "Flagged as suspicious activity",
};

const ACTOR_LABELS: Record<string, string> = {
  user: "A user",
  admin: "An admin",
  system: "The system",
  anonymous: "An anonymous visitor",
};

function titleCaseFallback(value: string): string {
  const tail = value.includes(".") ? value.split(".").slice(1).join(" ") : value;
  return tail
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim() || "Activity";
}

/** Human-readable description of what happened, e.g. "Placed an order". */
export function humanizeAuditAction(action?: string | null, eventType?: string | null): string {
  if (action && ACTION_LABELS[action]) return ACTION_LABELS[action];
  if (eventType && ACTION_LABELS[eventType]) return ACTION_LABELS[eventType];
  return titleCaseFallback(action || eventType || "");
}

/** "A user" / "An admin" / etc — reads naturally before an action phrase. */
export function humanizeActorPhrase(actorType?: string | null): string {
  if (!actorType) return "Someone";
  return ACTOR_LABELS[actorType] ?? titleCaseFallback(actorType);
}

/** Short badge label: "User" / "Admin" / "System" / "Anonymous". */
export function humanizeActorLabel(actorType?: string | null): string {
  if (!actorType) return "Unknown";
  return titleCaseFallback(actorType);
}

/** "ID a1b2c3d4" instead of a bare, meaningless hex fragment. */
export function humanizeActorId(actorId?: string | null): string | null {
  if (!actorId) return null;
  return `ID ${actorId.slice(0, 8)}`;
}

/** "Vendor status" instead of "vendor_status" for before/after state keys. */
export function humanizeFieldName(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
