# Codebase Cleanup Summary — ODOS_ADMIN

**Date:** July 27, 2026  
**Scope:** Dead code removal, gitignore hygiene

## Files Removed (3)

| File | Reason |
|------|--------|
| `src/pages/PayoutsPage.tsx` | Never imported; routes use `FullPayoutsPage` |
| `scripts/patch-full-pages.py` | Obsolete one-off codemod |
| `scripts/patch-dossier-nav.py` | Obsolete one-off codemod |

## Dead Code Removed

- `buildPayoutSnapshot()` from `src/utils/sectionMetrics.ts` (only used by deleted brief page)
- Unused `AdminVendorWithdrawalRequest` type import

## `.gitignore` Improvements

- Removed stale `vite.config.js` / `vite.config.d.ts` entries (project uses `.ts`)
- Removed blanket `.vscode/` ignore (allows sharing workspace settings)
- Added `coverage/` and `*.log` patterns

## Verification

- `npm run typecheck` — passed
- `npm run build` — passed

## Remaining Technical Debt

- 17 brief overview pages routed but bypassed by sidebar (links go to `/…/full`)
- Duplicate payout routes (`/payouts` and `/payouts/full` render same component)
- `entityDetailPages.tsx` (~1,522 lines) — candidate for per-entity split
- `financeApi.ts` and `notificationsApi.ts` hand-roll pagination vs `createPaginatedAdminApi`
- Repeated `DetailRow`/`DetailSection` helpers across full pages
- No ESLint or Vitest configured
- `FullUsersPage.tsx` / `FullAnalyticsPage.tsx` outside `pages/full/` folder

## Recommendations

1. Align `backRoute` values with sidebar (full paths) or remove brief routes entirely
2. Deduplicate payout routes to `/payouts` only
3. Extract shared `AdminQueuePage` shell for full list pages
4. Add ESLint + Vitest to `package.json` scripts
5. Move remaining full pages into `src/pages/full/`
