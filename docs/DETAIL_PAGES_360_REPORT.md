# 360° Admin Detail Pages — Implementation Report

**Date:** 24 July 2026  
**Scope:** `ODOS_ADMIN` detail dossiers (+ thin API client additions)  
**Approach:** Upgrade existing AdminShell / `useRecordDetail` pattern; surface unused backend fields; embed entity audit timelines; add inline actions and relationship navigation.

---

## 1. Redesigned detail pages

| Page | Route | Upgrade highlights |
| --- | --- | --- |
| User | `/users/full/:userId` | Timeline tab; order rows deep-link to order dossiers |
| Order | `/orders/full/:orderId` | Full payment/status fields; actions; relationships; timeline; product/return links |
| Vendor | `/vendors/full/:vendorId` | Dedicated GET; suspend/reactivate; relationships; timeline |
| Vendor application | `/vendor-applications/full/:id` | Full KYC via `VendorApplicationDetails`; approve/reject; timeline |
| Store | `/stores/full/:storeId` | Vendor contact; clickable products; stats; relationships; timeline |
| Product | `/products/full/:productId` | Media/variants; moderation actions; studio link; relationships; timeline |
| Payout | `/payouts/:id` & `/payouts/full/:id` | Ops panel tab; Paystack refs; failure reason; relationships; timeline |
| Return | `/returns/full/:returnId` | Dedicated GET; evidence; inline resolution; relationships; timeline |
| Review | `/reviews/full/:reviewId` | Hide/restore moderation; relationships; timeline |
| Voucher | `/vouchers/full/:voucherId` | Rules + usage; pause/resume; relationships; timeline |
| Support thread | `/support-chats/full/:threadId` | Metadata; counterpart/store links; timeline |

---

## 2. New information added

- Order: source, internal/vendor status, progress, delivery/refund timestamps, payment network/phone/last4, voucher title, cancellation reason, variant selections  
- Product: images, colors/sizes/specs, placement tags, compare-at price, discount, vendor email, created/updated  
- Payout: pending hold, Paystack refs, transfer failure, reviewer, paid-at, vendor note  
- Return: evidence gallery, reviewer/resolved timestamps, editable admin note & refund amount  
- Voucher: description, schedule, eligibility limits, remaining redemptions, review notes  
- Application: full KYC/socials/assets packet (previously list-modal only)  
- Store: vendor email/phone, pending/hidden product counts  

---

## 3. New relationships displayed

Shared `RelatedRecordsCard` with one-click navigation:

- User ↔ Orders  
- Order ↔ User / Products / Returns / Voucher  
- Vendor ↔ User / Stores / Products / Payouts  
- Store ↔ Vendor / Products  
- Product ↔ Store / Vendor / Reviews  
- Return ↔ Order / User / Product  
- Review ↔ Order / User / Product  
- Payout ↔ Vendor / User  
- Support ↔ User / Store  
- Voucher ↔ Store / Orders  

---

## 4. New audit capabilities

- Shared `EntityTimeline` loads `GET /admin/event-logs?entity_type=&entity_id=` (and optional `actor_id` for user dossiers)  
- Shows action, event type, actor, timestamp, before/after snapshots, reason/note metadata  
- Client-side timeline search filter  
- Embedded on every major dossier as a **Timeline** tab  

---

## 5. Performance optimizations

- Vendor + return dossiers switch from **full-list scan** to dedicated GETs (`getVendor`, `getReturnRequest`)  
- Timeline lazy-loads only when its tab panel mounts  
- Timeline capped (`limit: 80`) with optional actor merge capped at 40  
- Existing `useRecordDetail` cache/reload pattern retained  

---

## 6. Backend changes

- No schema/migration changes required for this pass  
- Consumed existing endpoints more completely  

---

## 7. API updates (admin client)

| Addition | File |
| --- | --- |
| `getVendor(token, id)` | `src/api/vendorsApi.ts` |
| `getReturnRequest(token, id)` | `src/api/ordersApi.ts` |
| `EntityTimeline` / `RelatedRecordsCard` | `src/components/admin/EntityOps.tsx` |

---

## 8. Database improvements

- None in this pass (event logs already persisted)  

---

## 9. Security enhancements

- Sensitive status/moderation/approve/reject actions remain on authenticated admin APIs  
- Detail-page actions reuse existing audited backend endpoints (order status, product status, vendor status, return patch, review moderation, voucher pause/resume, application approve/reject)  
- Timeline is read-only and permission-gated by existing audit feature access on the API  

---

## 10. Recommendations for future operational tooling

1. Dedicated GET-by-id for vouchers, reviews, payouts, support threads (eliminate remaining list hydrations)  
2. Enrich vendor GET with nested stores/orders/payouts summary payload  
3. Payment transaction dossier (`/finance/payments/:id`) with gateway response + refund trail  
4. Promo banner / merchandising campaign detail dossiers with performance metrics  
5. Server-side notes model for free-form admin notes on any entity  
6. Cursor-paginated timeline endpoint for high-churn entities  
7. Sticky summary rail on desktop for status + next recommended action  
8. Wire Settings “confirm destructive actions” preference into all detail ConfirmDialogs  

---

## Shared structure now used

Every upgraded dossier follows:

1. **Header** — identity, status context, refresh, primary actions  
2. **Overview** — KPIs + key tiles  
3. **Entity-specific tabs** — media, rules, evidence, conversation, etc.  
4. **Actions** — context-sensitive admin operations  
5. **Relationships** — navigable linked records  
6. **Timeline** — audit/event history  

This turns thin CRUD shells into daily operational workspaces while keeping business rules on the backend.
