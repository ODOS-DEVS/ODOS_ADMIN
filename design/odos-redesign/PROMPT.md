# Prompts for Claude Code

Paste these one at a time. Wait for each phase to finish and check it in the browser before sending the next one.

---

## Phase 0: Read and plan (no code changes)

```
I'm redesigning the ODOS admin dashboard. The design reference is in design/odos-redesign/:
- BRIEF.md: tokens, type scale, component specs, page-by-page changes, and data bugs
- screens/*.html: static reference screens (open them in a browser; read the markup for exact spacing, colours and structure)
- screens/interface-notes.html: the design rules

First, don't change any code. Read BRIEF.md and every file in screens/. Then explore this codebase and tell me:
1. The framework, styling approach (Tailwind / CSS modules / component library), and where the theme or tokens live
2. Where the layout shell (sidebar, top bar) is defined
3. Which existing components map to: Button, Tabs, Table, StatusDot, KpiStrip, FilterChip, EmptyState, PageHeader
4. Every page under the admin and which ones the brief covers vs doesn't
5. Where each of the 7 data issues in BRIEF.md section 6 comes from (file + function)

Then propose a phased plan. Keep the existing routing, data fetching and business logic. This is a visual and UX redesign, plus the listed data fixes.
```

## Phase 1: Foundation

```
Implement phase 1 only: the design tokens from BRIEF.md section 2 (as CSS variables, plus a Tailwind theme extension if this project uses Tailwind), the IBM Plex Sans / Plex Mono fonts, and the type scale. Remove the purple accent and every box-shadow from the theme. Don't touch the pages yet. Show me the diff summary when you're done.
```

## Phase 2: Shell and shared components

```
Phase 2: rebuild the layout shell (sidebar, top bar with breadcrumbs, ⌘K search, and the notification dot) to match screens/dashboard.html. Then build or refactor these shared components to match the brief: PageHeader, Tabs (with server-side counts), FilterRow with dashed "+ Filter" chips, DataTable (clickable rows, checkbox column, "⋯" row menu, pagination footer), StatusDot, KpiStrip and EmptyState. Every page should use the new shell, even before its content is redesigned.
```

## Phase 3: The five designed pages

```
Phase 3: redesign Dashboard, Analytics, Orders, Products and Users to match the matching screens/*.html, using only the shared components from phase 2. Follow the page notes in BRIEF.md section 5. Use real data everywhere the reference shows sample numbers. Run the app and check each page at 1440px and 390px wide.
```

## Phase 4: Data fixes

```
Phase 4: fix the data issues in BRIEF.md section 6. For each one, explain what was wrong, fix it in the backend or query layer, and add a test where the project has tests. Counts in tabs and in the sidebar must be totals from the server, not counts of the current page.
```

## Phase 5: Everything else ("and more")

```
Phase 5: apply the same system to every remaining admin page. That includes Vendors, Vendor applications, Stores, Markets, Categories, Payouts, Deliveries / Delivery ops, Audit log, the detail pages (order, product, user, vendor, store), and every create/edit form and modal. No new page designs exist for these, so derive them from the rules in screens/interface-notes.html:
- List pages: page header → tabs → filter row → table
- Detail pages: header with the ID in mono, a status dot and actions on the right; a two-column body (main content plus a 320px side panel with metadata); an activity timeline at the bottom
- Forms: one column, max-width 640px, labels above inputs, helper text in muted 12.5px, and a sticky footer with Cancel and one primary button
- Queues (Payouts, Applications): each row shows what's being asked and by whom, with Approve / Reject inline, and a confirmation step for anything involving money
Also add loading skeletons that match each table's real row height, an error state with a Retry button, and visible keyboard focus rings (2px, ink colour, 2px offset).
```

## Phase 6: Polish and verification

```
Phase 6: go through every admin page and check:
- No uppercase tracked labels, tinted icon tiles, pills or shadows remain
- Text contrast is at least 4.5:1
- Every icon-only button has an aria-label
- Tables scroll inside their box on a phone
- Numbers use tabular figures
Take screenshots of each page at 1440px and 390px and list anything that still doesn't match the reference.
```
