# ODOS Admin — redesign brief for implementation

Goal: make the admin dashboard look and behave like a hand-built operations tool, not a template. Apply the changes as shared tokens and components first, then page by page. Match the reference canvas (Dashboard, Analytics, Orders, Products, Users, Interface notes).

## 1. What to remove

- Tinted icon squares on every stat card and every nav item.
- UPPERCASE letter-spaced labels (stat labels, table headers, nav group labels). Use sentence case.
- Duplicate titles: the top bar currently shows "Dashboard" and the content shows "Dashboard" again. The top bar becomes breadcrumbs only.
- The bordered box around the Refresh / Analytics buttons in page headers.
- Stat cards that repeat tab counts (Products: "Active 9" card + "Active 9" tab). Keep the tab, drop the card.
- The secondary row of mini-cards (Users 29 / Vendors 5 / Stores 6 / Products 12). Replace with one line of links at the bottom of the dashboard.
- Pill badges with tinted fills for every status. Replace with a dot + word.
- The 3-button action cluster on each table row (view / go / edit). The whole row is the link; keep one "⋯" menu.
- Stock progress bars. Show the number; add "Low" in amber only when low.
- Search box at the top of the sidebar (global search with ⌘K covers it).
- "80" notification badge. Use a dot; the count lives in the notifications panel.
- Purple brand accent on buttons and active nav.

## 2. Tokens

```css
:root {
  --canvas: #F4F4F1;
  --surface: #FFFFFF;
  --ink: #15171A;          /* text, primary button */
  --ink-2: #3B4047;        /* nav text, body secondary */
  --muted: #61666F;        /* captions, headers — passes 4.5:1 on canvas and surface */
  --line: #E3E2DD;         /* container borders, header rule */
  --line-soft: #EEEDE8;    /* row dividers */
  --nav-selected: #E4E3DD;
  --nav-hover: #EAE9E4;
  --accent: #1E5B47;       /* links, chart line */
  --success: #2F8F5B;  --success-text: #1E6B3F;
  --warning: #C27C0E;  --warning-text: #8A4B08;
  --danger:  #D1453B;  --danger-text:  #A12A21;
  --neutral: #A3A6AC;

  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  --radius-control: 6px;
  --radius-container: 8px;
  --control-h: 36px;
  --row-h: 52px;            /* 60px when the row has an avatar or thumbnail */
  --topbar-h: 56px;
  --sidebar-w: 220px;
}
```

- No box-shadows anywhere. 1px borders only.
- All numbers use `font-variant-numeric: tabular-nums`. IDs and order numbers use the mono font.
- Currency: `GH₵` rendered smaller and muted before the figure in KPI values; `GH₵ 1.00` with two decimals in tables, right-aligned.

## 3. Type scale

| Use | Size / weight |
|---|---|
| Page title (H1) | 24 / 600, letter-spacing -0.015em |
| KPI value | 28 / 500, tabular |
| Section heading | 15 / 600 |
| Body, controls | 14 / 400 |
| Table cells, nav | 13.5 / 400 |
| Secondary line | 12.5 / 400, muted |
| Column header | 12 / 500, muted, sentence case |

## 4. Shared components

**Sidebar** — 220px, same background as canvas, right hairline. Wordmark "odos admin" at top. Groups in this order (Commerce moves up — it was below the fold):
Overview (Dashboard, Analytics, Audit log) · Commerce (Orders, Payouts, Deliveries) · Catalog (Products, Stores, Markets, Categories) · People (Users, Vendors, Applications). Counts right-aligned; counts that represent work waiting (pending orders, payouts) are amber. Selected item: `--nav-selected` background, weight 500. User block pinned to the bottom with initials avatar and a sign-out icon button.

**Top bar** — breadcrumb (Section / Page), global search with ⌘K hint on the right, notifications icon with a dot.

**Page header** — H1 + one muted summary line under it (e.g. "47 placed this month · GH₵ 900 collected"). Actions on the right, plain buttons, at most one primary.

**Tabs** — underline style, count after the label, counts are server totals.

**Filter row** — search input + dashed "+ Filter" chips + sort control on the right.

**Table** — inside one container; header row 38px; rows 52px; whole row clickable; checkbox column; trailing "⋯" menu; footer with "Showing 1–15 of N" and Previous / Next.

**Status** — 7px dot + word. Text stays ink except Failed/Blocked (danger text) and Deleted (muted).

**KPI strip** — one container, cells separated by 1px lines (grid with `gap:1px` on a `--line` background). Label, value, one-line footnote.

**Empty states** — headline that says what's missing, one sentence on why, one link to the next action.

## 5. Page notes

**Dashboard** → rename H1 "Operations" with the date + last sync above it. Order: Needs action (list of queues: Pending orders 78, Payout requests 2, Vendor applications 0 = "Clear") → At a glance KPI strip → Delivered revenue chart + Top stores → Latest orders table (5 rows) → one-line marketplace counts.

**Analytics** → period selector in the page header controls the whole page. KPI strip adds the effective take rate under commission. Replace the single-slice donut with a stage list (Pending → Delivered) with horizontal bars. Top stores becomes a table with an empty row state.

**Orders** → tabs per fulfilment status, filter chips (Payment, Store, Date placed). Fulfilment column shows a 6-segment step indicator + status word. Payment column uses status dots.

**Products** → tabs: All, Live, Needs review, Out of stock, Hidden, Suspended. Columns: Product (thumbnail + name + category), Store, ID (mono, truncated middle `1edcab77…2096`), Price, In stock, Status, Added.

**Users** → tabs: All, Shoppers, Vendors, Admins, Blocked. Avatars are neutral initials (no random colours; fixes the broken image fallback). Roles as small outlined tags. Deleted accounts get their own muted "Deleted" state.

## 6. Data issues to fix while you're in there

1. Revenue charts say "no paid orders" while 106 paid orders exist — the query needs paid AND delivered. Either label it "Delivered revenue" (as designed) or plot paid revenue.
2. Orders page deltas (↑193.8%, ↑198.0%) are identical to the Analytics deltas but sit on different base numbers (47 vs 106 orders, GH₵ 900 vs 41,534). Check they aren't reused.
3. Average order GH₵ 438 doesn't equal 41,534 ÷ 106 (≈ 392). Confirm the denominator.
4. Status counts are page-scoped ("Pending 15 on this page") while the dashboard says 78 pending. Use totals everywhere.
5. All 29 users count as Customers, so the role filter can't isolate shoppers. Filter by primary role.
6. Deleted accounts appear as "Blocked". Add a Deleted state and hide them from the default list.
7. Order pipeline only covers the 5 most recent orders. Consider all open orders.

## 7. Responsiveness

The shell is a wrapping flex row: sidebar `flex: 1 1 220px`, content `flex: 999 1 560px; min-width: 0`, so the sidebar stacks above content on phones. Toolbars wrap. Tables sit in an `overflow-x: auto` box.
