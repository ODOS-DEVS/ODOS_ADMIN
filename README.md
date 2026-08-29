# ODOS Admin

React admin dashboard for operating the ODOS marketplace — catalog, users, vendors, orders, finance, and the content that powers the mobile home feed.

| Repository | GitHub |
|------------|--------|
| Backend API | [ODOS_MOBILE_BACKEND](https://github.com/ODOS-DEVS/ODOS_MOBILE_BACKEND) |
| Mobile app | [ODOS_MOBILE_CLIENT](https://github.com/ODOS-DEVS/ODOS_MOBILE_CLIENT) |

## Stack

- React 19 · TypeScript · Vite · Tailwind CSS · React Router
- WebSocket realtime for live admin updates

## What you can manage

**Core operations**

- Dashboard overview, users (with detail profiles), vendors, vendor applications
- Stores, markets, categories, products (including studio-style editors)
- Orders, returns, reviews, finance, payouts, support chats, notifications
- **Payout approval queue** with manual payout confirmation for Paystack Starter business accounts
- Delivery settings (standard / express / same-day fees and ETAs)

**Merchandising**

- Promo banners with placement, destination, and live mobile preview (home carousel, deals, etc.)
- Flash sale events and voucher / promotion management, plus a **vendor nomination review queue** (approve into an event with a flash price and optional stock cap, or reject with a note)
- **Merchandising campaigns** (opt-in targeting for seller participation) with a **vendor opt-in review queue** showing units sold since approval
- Full analytics reports and section-level metrics
- Review moderation with **seller reply** visibility on admin review detail
- **Delivery ops** dashboard — live view of every active delivery, with SLA breach flags and **customer-reported problems surfaced first** as exceptions
- **Order dossier "Delivery" tab** — delivery status, settlement status, completion method (customer / auto-release / admin override), and the full delivery event timeline (dispatched, rescheduled, problem reported, auto-released, etc.)
- **Delivery override**: force-completing a delivery from the order screen always requires a typed reason, which is permanently recorded against the order

**Operational alerts**

- Feature-scoped email alerts fire automatically for vendor applications, withdrawal requests, voucher submissions, and **customer-reported delivery problems** — only admins whose permission band covers that area are notified

**UX patterns**

- Brief list pages (summary + quick actions) and **full directory** pages with infinite scroll
- Stable loading — no refetch loops on paginated lists
- Compatible with both legacy array responses and `{ items, has_more }` pagination from the API

## Requirements

- Node.js 18+
- A reachable ODOS backend (the hosted API, or one running locally on :8000)
- An admin user seeded or bootstrapped on the API

## Local setup

```bash
npm install
```

`.env` holds the API the built app talks to:

```env
VITE_API_BASE_URL=https://appbe.odos.market/api
```

Start the dev server:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Why dev goes through a proxy

`.env.development` points the dev server at itself:

```env
VITE_API_BASE_URL=http://localhost:5173/api
```

The hosted backend does not list `http://localhost:5173` as a CORS origin, so the browser
blocks direct calls from the dev server. Vite proxies `/api` to the backend from Node instead,
which is not subject to CORS at all — the browser only ever makes a same-origin request.

Pointing at the dev server also keeps `client.ts` from treating the API as remote and running
its cold-start warm-up sequence.

To work against a local backend instead:

```bash
DEV_API_PROXY_TARGET=http://localhost:8000 npm run dev
```

Or add `http://localhost:5173` to `CORS_ORIGINS` on the server and call it directly.

## Scripts

```bash
npm run dev        # Local development with HMR
npm run typecheck  # TypeScript without emit
npm run build      # Production build to dist/
npm run preview    # Serve dist/ locally
```

## Deployment

Deployed with **Coolify** on the same self-hosted VPS as the API: built from Git and served
as static files behind automatic TLS. Any static host with SPA fallback for React Router works
too — `vercel.json` carries that fallback plus security headers.

| Setting | Value |
|---------|--------|
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| Env | `VITE_API_BASE_URL=https://appbe.odos.market/api` |

The deployed origin has to be in the backend's `CORS_ORIGINS`, or every request fails in the
browser even though the API is healthy.

Every page behind sign-in is code-split, so the login screen does not download the console it
has not authenticated into yet — the initial bundle is ~118 KB gzipped, with charts and the
heavier pages pulled in on demand.

## Routes

**Brief sections** (summary pages)

- `/dashboard` · `/users` · `/vendors` · `/vendor-applications`
- `/stores` · `/markets` · `/categories` · `/products`
- `/vouchers` · `/promo-banners` · `/flash-sale-events` · `/merchandising-campaigns`
- `/orders` · `/returns` · `/reviews` · `/finance` · `/notifications` · `/delivery-settings`

**Full directories** (infinite scroll, detail drill-down)

- `/full/*` — expanded list views for each section above
- `/full/promo-banners/studio/:id` — promo banner studio
- `/full/categories/studio/:id` — category studio
- `/full/users/:id` · `/full/orders/:id` · `/full/vendors/:id` — record detail pages
- `/full/analytics` — full analytics report
- `/full/promo-analytics` — campaign, voucher and banner performance
- `/full/delivery-ops` — live delivery operations dashboard
- `/full/flash-sale-events` and `/full/merchandising-campaigns` — each include a review-queue tab for vendor nominations / opt-ins

## Design system

Every list screen — orders, products, users, vendors, stores, payouts, vouchers and the rest —
is built from one shell rather than hand-assembled, so they cannot drift apart:

| Piece | Role |
|-------|------|
| `DirectoryPage` | Header → KPI strip → filter bar → table card → pagination |
| `DirectorySection` | Just the table card, for screens with two legitimate lists |
| `DirectoryTable` | Selection, sortable headers, empty state |
| `MetricStat` | A KPI figure, with a delta only when there is a real comparison |
| `StatePill` | Status chip with a leading dot |
| `SelectionBar` | Bulk actions, only present while rows are selected |

Charts live in `src/components/charts`. The categorical palette in `chartPalette.ts` is
validated, not chosen by eye — it passes lightness, chroma, colour-vision separation and
contrast checks against the card surface. Assign hues in the order given: adjacent pairs were
checked as neighbours, so reordering can break separation that currently holds. A seventh
series folds into "Other" rather than inventing a colour, and the reserved status colours
never stand in for a category.

## Project structure

```text
src/
  api/              # REST clients, pagination helpers, mappers
  components/
    admin/          # Shell, brief sections, infinite list
    analytics/      # Report views
    promo-banners/  # Studio + preview
    ...
  hooks/            # useInfiniteAdminList, useRecordDetail, realtime
  pages/            # Brief + full page components
  routes/           # AppRoutes, adminFullRoutes
  types/
  utils/            # Section metrics, promo studio helpers
```

## API pagination

List endpoints return `{ items, has_more }`. The admin client uses `useInfiniteAdminList` and `createPaginatedAdminApi` for consistent infinite scroll. `normalizeAdminPageResponse()` still accepts bare arrays for backward compatibility with older deployed backends.

## Release checklist

1. Backend migrations applied: `alembic upgrade head`
2. `npm run typecheck` and `npm run build` pass locally
3. `VITE_API_BASE_URL` points at the target API
4. Admin origin is in backend `CORS_ORIGINS`
5. Smoke-test promo banner studio, one full directory page, and dashboard realtime

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Lists keep reloading | Ensure backend returns stable pagination; client uses ref-stable `getId` |
| Vendors page crash | Deploy backend with `{ items, has_more }` or use latest admin (array fallback) |
| Studio 404 on banner | Backend needs `GET /admin/promo-banners/{id}` |
| WebSocket console noise | Fixed in latest admin — invalid token closes socket cleanly |
| CORS errors | Add admin URL to `CORS_ORIGINS` on the API |

## License

Proprietary — ODOS-DEVS.
