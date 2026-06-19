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

**Merchandising**

- Promo banners with placement, destination, and live mobile preview (home carousel, deals, etc.)
- Flash sale events and voucher / promotion management
- Full analytics reports and section-level metrics

**UX patterns**

- Brief list pages (summary + quick actions) and **full directory** pages with infinite scroll
- Stable loading — no refetch loops on paginated lists
- Compatible with both legacy array responses and `{ items, has_more }` pagination from the API

## Requirements

- Node.js 18+
- Running ODOS backend (local or Render)
- Admin user seeded or bootstrapped on the API

## Local setup

```bash
npm install
```

Create `.env` in the project root:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start the dev server:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Production / staging API:

```env
VITE_API_BASE_URL=https://odos-backend.onrender.com/api
```

## Scripts

```bash
npm run dev        # Local development with HMR
npm run typecheck  # TypeScript without emit
npm run build      # Production build to dist/
npm run preview    # Serve dist/ locally
```

## Deployment (Render)

`render.yaml` configures a static site with SPA fallback for React Router.

| Setting | Value |
|---------|--------|
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| Env | `VITE_API_BASE_URL=https://odos-backend.onrender.com/api` |

After deploy, add the admin site origin to backend `CORS_ORIGINS` and redeploy the API if needed.

## Routes

**Brief sections** (summary pages)

- `/dashboard` · `/users` · `/vendors` · `/vendor-applications`
- `/stores` · `/markets` · `/categories` · `/products`
- `/vouchers` · `/promo-banners` · `/flash-sale-events`
- `/orders` · `/returns` · `/reviews` · `/finance` · `/notifications`

**Full directories** (infinite scroll, detail drill-down)

- `/full/*` — expanded list views for each section above
- `/full/promo-banners/studio/:id` — promo banner studio
- `/full/categories/studio/:id` — category studio
- `/full/users/:id` · `/full/orders/:id` — record detail pages
- `/full/analytics` — full analytics report

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
