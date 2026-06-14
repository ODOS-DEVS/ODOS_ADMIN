# ODOS Admin

React admin dashboard for the ODOS marketplace. Manages catalog, users, vendors, orders, finance, and merchandising.

| Repository | GitHub |
|------------|--------|
| Backend API | [ODOS_MOBILE_BACKEND](https://github.com/ODOS-DEVS/ODOS_MOBILE_BACKEND) |
| Mobile app | [ODOS_MOBILE_CLIENT](https://github.com/ODOS-DEVS/ODOS_MOBILE_CLIENT) |

## Stack

- React 19 · TypeScript · Vite · Tailwind CSS · React Router

## Features

- Admin auth and bootstrap
- Users, vendors, vendor applications, stores, markets, categories, products
- Orders, returns, reviews, finance, payouts, support chat, notifications
- Promo banners and flash sale event scheduling for the mobile home feed

## Requirements

- Node.js 18+
- Running ODOS backend (local or Render)

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

Production API example:

```env
VITE_API_BASE_URL=https://odos-backend.onrender.com/api
```

## Scripts

```bash
npm run dev        # local development
npm run typecheck  # TypeScript
npm run build      # production build
npm run preview    # preview dist/
```

## Deployment (Render)

`render.yaml` configures a static site with SPA fallback for React Router.

**Build command**

```text
npm install && npm run build
```

**Publish directory**

```text
dist
```

**Environment**

```env
VITE_API_BASE_URL=https://odos-backend.onrender.com/api
```

After deploy, add the admin site URL to backend `CORS_ORIGINS` and redeploy the API if needed.

## Main routes

- `/dashboard` · `/users` · `/vendors` · `/vendor-applications`
- `/stores` · `/markets` · `/categories` · `/products`
- `/vouchers` · `/promo-banners` · `/flash-sale-events`
- `/orders` · `/returns` · `/reviews` · `/finance` · `/notifications`

## Project structure

```text
src/
  api/
  components/
  hooks/
  pages/
  routes/
  types/
  utils/
```

## Release checklist

1. Backend migrations applied (`alembic upgrade head`).
2. `npm run build` passes locally.
3. `VITE_API_BASE_URL` points at the target API.
4. Admin origin is listed in backend `CORS_ORIGINS`.

## License

Proprietary — ODOS-DEVS.
