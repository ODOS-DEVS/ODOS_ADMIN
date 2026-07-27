# ODOS Marketplace Administration Platform — Audit & Upgrade Report

**Date:** 22 July 2026  
**Scope:** `ODOS_ADMIN` + related `ODOS_MOBILE_BACKEND` admin APIs  
**Approach:** Extend the existing brief/full/studio architecture; avoid rewrites of working modules (vouchers, campaigns, finance studios, support realtime).

---

## 1. Existing architecture discovered

### Frontend (`ODOS_ADMIN`)

| Layer | Pattern |
| --- | --- |
| Auth | JWT session via `useAdminAuth`, hydrate on load, 401 logout |
| Layout | `DashboardLayout` + `Sidebar` + `Topbar` |
| Routing | Brief pages (`/orders`) + Full desks (`/orders/full`) + entity studios |
| Data | Typed API clients + mappers (`src/api/*`, `mappers.ts`) |
| Lists | Infinite scroll via `useInfiniteAdminList` / `AdminInfiniteList` |
| RBAC | Feature bands mapped to routes (`useAdminPermissions`) |
| Realtime | Admin audit feed + support chat sockets |
| Preferences | LocalStorage workspace prefs (`adminPreferences`) |

### Backend (`ODOS_MOBILE_BACKEND`)

| Area | Capability |
| --- | --- |
| Dashboard | Aggregated KPI endpoint (`get_admin_dashboard`) |
| Catalog | Products, stores, markets, categories CRUD + moderation statuses |
| Commerce | Orders, returns, delivery settings |
| People | Users, vendors, vendor applications |
| Marketing | Vouchers, promo banners, flash sales, merchandising campaigns |
| Finance | Ledger, payments, vendor withdrawals / Paystack payouts |
| Community | Reviews, support chats, notifications |
| Security | `AdminPermissionLevel` + `require_admin_feature`, audit log |

### Already strong before this pass

- Full operational desks for almost every marketplace entity  
- Vendor application approve/reject with documentation review  
- Product moderation statuses (`pending` → `active` / `hidden` / `suspended`)  
- Payout approval workflow with deep-linkable status filters  
- Full analytics aggregation page  
- Merchandising campaigns + voucher engine (recent work)  
- Route-level permission guards (fail-closed)

### Gaps identified in Phase 1 audit

1. Dashboard home was a KPI summary, not an **attention-first command center**  
2. Sidebar/topbar did not surface live queue badges  
3. Topbar search was non-functional  
4. Dashboard “go to queue” links did not hydrate list filters (`?status=`, `?q=`)  
5. Dashboard stats lacked today/revenue and ops queue counts (returns, support, low stock, withdrawals)  
6. RBAC bands incomplete vs operational roles (marketing / moderator)  
7. Settings prefs mostly unused beyond default landing page  

---

## 2. Improvements implemented

### Command center (Dashboard home)

- Redesigned `/dashboard` as an ops command center:
  - **Needs attention** strip (applications, pending products, returns, support, low stock, payouts)
  - Hero KPIs: revenue today, orders today, pending orders, lifetime revenue
  - Secondary catalog/people counts
  - Recent orders table, payout queue card, applications/activity/audit feed
  - Role-aware widgets (finance/payouts gated by permission)
- Attention tiles deep-link into filtered full desks

### Ops queue UX

- `useOpsQueueBadges` — polls dashboard stats every 60s for sidebar badges + topbar alert count  
- Sidebar high-churn items link directly to `/…/full` desks with badges  
- Topbar search routes to users / orders / vendors with `?q=`  
- `useQueueSearchParams` hydrates `q`, `status`, `stock`, `queue` on:
  - Orders, Products, Users, Vendors, Vendor applications, Returns, Support chats  
  - (Payouts already supported `?status=`)

### RBAC

- Added permission bands (frontend + backend):
  - `marketing` — promotions, analytics, product visibility for campaigns  
  - `moderator` — products, reviews, vendors, support  
- Access-denied UI in `ProtectedRoute` (no silent redirect loops)  
- Settings alert prefs now influence which queue badges surface in the chrome

### Backend dashboard stats

Extended `AdminDashboardStatsRead` / `get_admin_dashboard` with:

| Field | Purpose |
| --- | --- |
| `revenue_today` | Same-day GMV |
| `orders_today` | Same-day order count |
| `pending_products` | Moderation queue |
| `low_stock_products` | Active listings ≤ `LOW_STOCK_THRESHOLD` |
| `open_return_requests` | `requested` / `under_review` / `approved` |
| `support_waiting_on_admin` | Support threads waiting on admin |
| `pending_withdrawals` | Withdrawals in `pending` / `approved` |

---

## 3. Backend changes

- `app/schemas/admin.py` — extended dashboard stats schema  
- `app/controllers/admin_controller.py` — richer `get_admin_dashboard` aggregations; low-stock filter corrected to `status == "active"`  
- `app/core/admin_permissions.py` — `marketing` + `moderator` bands aligned with admin UI  

No new Alembic migration required for this pass (stats are computed; permission values are strings).

---

## 4. Admin frontend changes

| File / area | Change |
| --- | --- |
| `DashboardPage.tsx` | Command-center rewrite |
| `Sidebar.tsx` / `Topbar.tsx` | Queue badges, deep links, search |
| `useOpsQueueBadges.ts` | Live badge hook + prefs awareness |
| `useQueueSearchParams.ts` | URL filter hydration |
| Full desks (orders/products/users/vendors/applications/returns/support) | Deep-link filters |
| `useAdminPermissions.ts` + `types` | New bands |
| `mappers.ts` / `types` / `fullAnalyticsApi.ts` | New dashboard fields |

---

## 5. API changes

- `GET` admin dashboard response includes new stats fields (backward compatible defaults on older clients via `?? 0` mapping).  
- No breaking request contract changes.

---

## 6. Database updates

- None in this pass.  
- Prior related migrations (auth token version, campaigns, vouchers, push defaults) remain separate workstreams.

---

## 7. Performance improvements

- Dashboard attention counts use SQL aggregations instead of loading full collections into the admin UI.  
- Sidebar badges reuse the single dashboard endpoint (60s poll) rather than N list fetches.  
- Infinite-list desks unchanged (still client-side filter after page load — see recommendations).

---

## 8. Security enhancements

- Permission bands expanded without widening `admin` / `super_admin`.  
- Fail-closed route access retained; unknown bands map to least privilege (`analyst`) when a value is present but unrecognized.  
- Access-denied screen prevents accidental privilege confusion.

---

## 9. New modules / hooks added

- `useOpsQueueBadges`  
- `useQueueSearchParams`  
- Command-center dashboard composition  

No brand-new CRUD modules were invented; existing desks were made operable as queues.

---

## 10. Remaining recommendations (prioritized)

### P0 — Operational depth

1. **Server-side list filters** for orders/products/users (`status`, `q`, `stock`) so deep-links work at scale without loading the whole catalog client-side.  
2. **Bulk actions** on products (approve/hide) and orders (status) for daily ops volume.  
3. Wire **Settings** prefs (`compactTables`, `confirmDestructiveActions`, marketing feature order) into list/studio components end-to-end.

### P1 — Finance & analytics

4. Dedicated **commission / fee report** export (CSV) from finance studio.  
5. Dashboard charts for 7/30-day revenue & order trends (reuse full analytics metrics, lighter payload).  
6. Top vendors / top products widgets backed by SQL aggregations (avoid scanning full lists).

### P2 — Moderation & content

7. Central **moderation inbox** unifying flagged reviews, reported products, and abuse reports.  
8. Image/content policy checklist on product approve modal.  
9. Admin notes timeline on users/vendors/stores.

### P3 — Platform configuration

10. Server-backed **marketplace settings** (commission defaults, maintenance mode, feature flags) instead of client-only prefs.  
11. Capability-based permissions (matrix of actions) beyond coarse bands.  
12. Email/push template management UI.

### P4 — Scale & observability

13. Cache dashboard stats (short TTL Redis) under load.  
14. Background job health panel (failed payouts, push delivery, migration status).  
15. Fraud signals (velocity, duplicate accounts) on the command center.

---

## 11. Sync with mobile / marketplace

- Product moderation statuses and inventory thresholds remain authoritative on the backend; mobile Seller Center and shop catalog already consume the same product/order models.  
- Low-stock threshold (`LOW_STOCK_THRESHOLD = 2`) is shared with vendor inventory alerts.  
- No mobile client changes required for this admin pass.

---

## 12. How to verify

1. Sign in as `super_admin` → Dashboard shows Needs attention when queues are non-zero.  
2. Click an attention tile → lands on filtered full desk (`?status=pending`, `?queue=open`, etc.).  
3. Sidebar badges refresh within ~60s after approving a vendor application / product.  
4. Topbar search for an order number → `/orders/full?q=…`.  
5. Assign `marketing` / `moderator` to a staff admin → sidebar only shows allowed sections; denied routes show access UI.  
6. Toggle vendor/order alert prefs in Settings → badge chrome respects preferences after refresh.

---

## Verdict

The admin app is no longer a loose collection of CRUD pages: it now has a **queue-first command center**, **live attention chrome**, **deep-linked ops desks**, and **expanded staff bands**, while preserving the existing brief/full/studio architecture and marketplace business logic on the backend.

The highest-leverage next investment is **server-side filtering + bulk moderation**, which unlocks true high-volume marketplace operations without rewriting studios.
