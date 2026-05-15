# ODOS Admin Dashboard

ODOS Admin Dashboard is the React + Vite control panel for the ODOS ecosystem. It connects to the FastAPI backend and gives admins one place to manage users, vendors, stores, markets, categories, products, orders, and notifications.

Backend repo:

`/Users/paul/Desktop/DeV/odos-workspace/ODOS_MOBILE_BACKEND`

Mobile repo:

`/Users/paul/Desktop/DeV/odos-workspace/odos-mobile-expo`

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React

## Current Dashboard Coverage

- Admin bootstrap signup and admin login
- Dashboard metrics and recent activity
- User management
- Vendor management and vendor application review
- Market management
- Store management, including admin-created stores
- Category management with image upload and subcategory editing
- Product management with real image upload, store assignment, and multi-category/subcategory linking
- Order and notification views

## Recent UX Changes

- Admin identity, email, and logout moved from top bar to sidebar footer
- Create product button aligned with page-header action placement
- Store creation added directly in admin
- Category creation now supports uploaded artwork for shopper-facing cards
- Product creation now supports one or more categories and one or more subcategories
- Product review screens now expose full submission detail and pending approval flow

## Prerequisites

- Node.js 18+
- npm
- ODOS backend running locally

## Environment

Create `.env` from the example:

```bash
cp .env.example .env
```

Local value:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

If your backend runs elsewhere, update it to the correct API origin.

Current deployed backend value:

```env
VITE_API_BASE_URL=https://odos-backend.onrender.com/api
```

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview built app:

```bash
npm run preview
```

## Render Deployment

This repo now includes:

- [render.yaml](/Users/paul/Desktop/DeV/odos-workspace/ODOS_ADMIN/render.yaml:1) for a Render static-site Blueprint with SPA route fallback
- [.env.example](/Users/paul/Desktop/DeV/odos-workspace/ODOS_ADMIN/.env.example:1) for the deployed API URL

Recommended deploy flow:

1. Push this repo to the `odos-admin` repository in your GitHub organization.
2. In Render, create a `Static Site` or a `Blueprint` from the `odos-admin` repo.
3. If you create the site manually, use:

```text
Build Command: npm install && npm run build
Publish Directory: dist
```

4. Set the environment variable:

```env
VITE_API_BASE_URL=https://odos-backend.onrender.com/api
```

5. Deploy.
6. After Render gives you the admin site URL, add that URL to the backend `CORS_ORIGINS` value on Render and redeploy the backend.

Why the rewrite matters here:

- the admin uses React Router
- direct refreshes on routes like `/products` or `/reviews` need to fall back to `index.html`
- the rewrite in `render.yaml` handles that for deployed builds

## Typical Local Workflow

Start backend first:

```bash
cd /Users/paul/Desktop/DeV/odos-workspace/ODOS_MOBILE_BACKEND
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Start admin app:

```bash
cd /Users/paul/Desktop/DeV/odos-workspace/ODOS_ADMIN
npm run dev
```

## Main Areas

- `/dashboard`
- `/users`
- `/vendors`
- `/vendor-applications`
- `/stores`
- `/markets`
- `/categories`
- `/products`
- `/orders`
- `/notifications`

## Project Structure

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

## Notable Files

- [src/components/layout/Sidebar.tsx](/Users/paul/Desktop/DeV/odos-workspace/ODOS_ADMIN/src/components/layout/Sidebar.tsx:1)
- [src/components/layout/Topbar.tsx](/Users/paul/Desktop/DeV/odos-workspace/ODOS_ADMIN/src/components/layout/Topbar.tsx:1)
- [src/pages/StoresPage.tsx](/Users/paul/Desktop/DeV/odos-workspace/ODOS_ADMIN/src/pages/StoresPage.tsx:1)
- [src/pages/CategoriesPage.tsx](/Users/paul/Desktop/DeV/odos-workspace/ODOS_ADMIN/src/pages/CategoriesPage.tsx:1)
- [src/pages/ProductsPage.tsx](/Users/paul/Desktop/DeV/odos-workspace/ODOS_ADMIN/src/pages/ProductsPage.tsx:1)
- [src/api/client.ts](/Users/paul/Desktop/DeV/odos-workspace/ODOS_ADMIN/src/api/client.ts:1)

## Verification

Typecheck:

```bash
./node_modules/.bin/tsc --noEmit --pretty false
```

Project build:

```bash
npm run build
```

## Notes

- Category and product taxonomy decisions here flow straight into the mobile shopper experience.
- Apply backend migrations before testing new category/store/product admin flows.
- Make sure the backend `CORS_ORIGINS` includes your deployed admin URL.
