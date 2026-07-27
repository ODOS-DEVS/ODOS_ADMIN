# UI/UX Audit & Polish Report — Mobile + Admin

**Date:** 23 July 2026  
**Scope:** `odos-mobile-expo` (customer + Seller Center) and `ODOS_ADMIN`  
**Approach:** Respect existing brand and architecture; close consistency gaps in shared primitives rather than redesigning screens.

---

## 1. Issues discovered

### Mobile

| Issue | Impact |
| --- | --- |
| Broken accent color `##F9F9F9` in `Colors.ts` + Tailwind | Invalid CSS; unpredictable surfaces |
| Missing `FeedbackBanner` (imported by auth) | Auth error UI broken / incomplete |
| `LoadingSpinner` used `AppColors` only | Dark mode contrast issues |
| `SearchFilterSheet` hardcoded light hex | Sheet ignores dark theme |
| Vendor `StatCard` / `StatusBadge` light-only palettes | Seller Center inconsistent in dark mode |
| `ViewAllButton` hardcoded dark `#2A2A2A` | Bypassed theme surface tokens |
| Vendor scroll padding fixed `rS(16)` vs browse `horizontalPadding` | Uneven edge rhythm between modes |
| Duplicate button / empty-state families | Visual drift across auth vs account vs commerce |

### Admin

| Issue | Impact |
| --- | --- |
| Infinite-list “load more” used full `LoadingState` (240px) | List height thrash on every page |
| `FullUsersPage` hand-rolled header | Broke AdminShell header rhythm |
| `StatusBadge` used raw emerald/amber/sky | Drift from design tokens |
| `PageHeader` eyebrow metrics differed from AdminShell | Settings/Delivery felt foreign |
| Sidebar hardcoded `#08101d` | Off-token canvas |
| Topbar raw `<button>`s | Missing focus/disabled parity with `Button` |
| No shared `.app-card` utilities | Pages invented radius/background variants |

---

## 2. Improvements implemented

### Mobile

- Fixed accent `#F9F9F9`
- Restored themed `FeedbackBanner` (danger/warning/success/info)
- Theme-wired `LoadingSpinner`, `SearchFilterSheet`, vendor `StatCard`, vendor `StatusBadge`
- `ViewAllButton` uses `colors.surfaceMuted` + `colors.border`
- `VendorScrollBody` uses `useResponsive().horizontalPadding`
- Larger close hit targets + a11y labels on filter sheet

### Admin

- Slim infinite-scroll sentinel (inline spinner)
- `LoadingState` supports `size="sm"` (order detail drawer uses it)
- `FullUsersPage` → `AdminFullHeader`
- `StatusBadge` / `Button` danger → semantic tokens
- `PageHeader` aligned to AdminShell typography rhythm
- `.app-card` / `.app-card-muted` / `.app-card-soft` utilities + `rounded-card` / `rounded-panel` tokens
- Sidebar → `bg-canvas`; Topbar menu/bell → `Button`

---

## 3. Screens significantly redesigned

None rewritten from scratch. Highest visual delta:

- **Mobile:** Search filter sheet, vendor KPI/status chips, auth feedback banner  
- **Admin:** Dashboard chrome (prior pass) + Users full header + infinite list footers  

---

## 4. Components standardized

| Surface | Components |
| --- | --- |
| Mobile | `FeedbackBanner`, `LoadingSpinner`, `SearchFilterSheet`, `StatCard`, `StatusBadge`, `ViewAllButton`, `VendorScrollBody` |
| Admin | `StatusBadge`, `LoadingState`, `PageHeader`, `Button`, `InfiniteScrollSentinel`, `Topbar` |

---

## 5. New reusable components

- **Mobile:** `components/ui/FeedbackBanner.tsx` (restored missing primitive)  
- **Admin:** `.app-card*` CSS utilities (not React components)

---

## 6. Navigation improvements

- Admin topbar search + alert bell use consistent `Button` affordances and clearer aria labels  
- Mobile filter sheet close/reset targets meet ~44pt guidance  
- (Prior ops pass) Admin sidebar deep-links remain queue-first  

---

## 7. Accessibility improvements

- Feedback banner: `accessibilityRole="alert"` + live region  
- Filter sheet: labeled dismiss/reset/apply controls  
- Admin topbar: menu/alerts aria labels include alert counts  
- Larger touch targets on sheet close  
- Focus-visible retained on admin `Button`

---

## 8. Performance improvements

- Infinite scroll no longer mounts a 240px loading panel per page → less layout thrash / jank  
- Compact nested loaders reduce drawer remount cost  
- Theme styles memoized in sheets/spinners (no unnecessary StyleSheet churn beyond color changes)

---

## 9. Design consistency improvements

- **Mobile:** Seller Center badges/KPIs and search sheet now speak the same semantic soft/text language as Account UI / ThemeContext  
- **Admin:** Status colors, headers, cards, and chrome share one token set (`success` / `warning` / `info` / `danger` / `canvas` / `panel`)  
- Cross-surface: both products now lean on semantic status tones rather than ad-hoc hex tables

---

## 10. Recommendations for future enhancements

1. Extract a shared `BottomSheetShell` from `WorkspaceSwitcherSheet` and migrate remaining store/product sheets  
2. Migrate auth `PrimaryButton` onto `AccountActionButton` (or a thin auth alias)  
3. Consolidate empty states onto `CommerceEmptyState` (shop) + `AccountEmptyState` (seller)  
4. Server-side list filters (admin) for true high-volume desks  
5. Gradually replace one-off `rounded-3xl` KPI blocks with `StatCard` / `.app-card`  
6. Document a short design token cheatsheet (radius, spacing, type scale) in each repo  
7. Add contrast checks for dark-mode primary gray on soft surfaces  
8. Optional: light admin theme for finance stakeholders (keep dark as default ops console)

---

## Verdict

The apps already had strong foundations (`ThemeContext` + Account/Vendor UI on mobile; AdminShell + SectionCard on admin). This pass closes the highest-friction consistency and accessibility gaps so light/dark, customer/vendor, and admin chrome feel intentional and production-ready—without discarding working product flows.
