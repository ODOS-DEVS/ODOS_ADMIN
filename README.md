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

## Prerequisites

- Node.js 18+
- npm
- ODOS backend running locally

## Environment

Create `.env` from the example:

```bash
cp .env.example .env
```

Default local value:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

If your backend runs elsewhere, update it to the correct API origin.

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

- The admin app falls back to mock data for a few unsupported or unavailable API cases, but the current store/category/product management work is designed for the live backend.
- Category and product taxonomy decisions here flow straight into the mobile shopper experience.
- Apply backend migrations before testing new category/store/product admin flows.
