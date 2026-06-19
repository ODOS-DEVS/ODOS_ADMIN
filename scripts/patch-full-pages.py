#!/usr/bin/env python3
"""Patch full/ admin pages: swap PageHeader for AdminFullHeader."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src" / "pages" / "full"

CONFIG = {
    "FullOrdersPage.tsx": ("/orders", "Orders", "Complete order directory", "Search, filter, update status, and open any order for the full dossier."),
    "FullVendorsPage.tsx": ("/vendors", "Vendors", "Complete vendor directory", "Every vendor account with performance metrics and moderation controls."),
    "FullVendorApplicationsPage.tsx": ("/vendor-applications", "Vendor applications", "Complete application queue", "Review, approve, or reject every vendor onboarding submission."),
    "FullStoresPage.tsx": ("/stores", "Stores", "Complete store directory", "Manage stores, branding, status, and open full store profiles."),
    "FullProductsPage.tsx": ("/products", "Products", "Complete product catalog", "Browse, create, edit, and inspect every product listing."),
    "FullFinancePage.tsx": ("/finance", "Finance", "Treasury command center", "Balances, payments, ledger entries, and platform money flow."),
    "FullPayoutsPage.tsx": ("/payouts", "Payouts", "Complete payout queue", "Vendor withdrawal requests, transfer status, and payout audit."),
    "FullReturnsPage.tsx": ("/returns", "Returns", "Complete returns desk", "Every return, refund, and exchange case across the platform."),
    "FullReviewsPage.tsx": ("/reviews", "Reviews", "Complete review moderation", "All product reviews with visibility and moderation controls."),
    "FullVouchersPage.tsx": ("/vouchers", "Vouchers", "Complete voucher campaigns", "Create, edit, and audit every promo code and campaign."),
    "FullMarketsPage.tsx": ("/markets", "Markets", "Complete markets registry", "Manage marketplace locations and assignments."),
    "FullCategoriesPage.tsx": ("/categories", "Categories", "Complete category taxonomy", "Manage catalog categories and subcategories."),
    "FullPromoBannersPage.tsx": ("/promo-banners", "Promo banners", "Complete promo banner studio", "Every home-screen banner, schedule, and creative asset."),
    "FullFlashSaleEventsPage.tsx": ("/flash-sale-events", "Flash sale events", "Complete flash sale calendar", "Every flash event, product roster, and schedule."),
    "FullSupportChatsPage.tsx": ("/support-chats", "Support chats", "Complete support inbox", "All customer support threads and conversations."),
    "FullNotificationsPage.tsx": ("/notifications", "Notifications", "Complete notification feed", "Every admin signal and notification across the platform."),
}

HEADER_IMPORT = 'import { AdminFullHeader } from "@/components/admin/AdminShell";\n'


def patch_file(path: Path, back_route: str, eyebrow: str, title: str, description: str) -> None:
    text = path.read_text()
    text = re.sub(
        r'import \{ PageHeader \} from "@/components/ui/PageHeader";\n',
        HEADER_IMPORT,
        text,
        count=1,
    )
    # Remove PageHeader block (multiline)
    text = re.sub(
        r"\s*<PageHeader\s+eyebrow=\"[^\"]*\"\s+title=\"[^\"]*\"\s+description=\"[^\"]*\"\s*/>\n",
        "",
        text,
        count=1,
    )
    # Insert AdminFullHeader after opening div of main return
    header_jsx = f"""      <AdminFullHeader
        eyebrow="{eyebrow}"
        title="{title}"
        description="{description}"
        backRoute="{back_route}"
        onRefresh={{() => void load"""
    # Find load function name per file - varies: loadOrders, loadVendors, loadFinance, etc.
    load_match = re.search(r"const (load\w+) = useCallback", text)
    load_fn = load_match.group(1) if load_match else "load"
    header_block = f"""      <AdminFullHeader
        eyebrow="{eyebrow}"
        title="{title}"
        description="{description}"
        backRoute="{back_route}"
        onRefresh={{() => void {load_fn}(true)}}
        refreshing={{isRefreshing}}
      />

"""
    # Use isRefreshing if present else isLoading for refresh state
    if "isRefreshing" not in text:
        header_block = header_block.replace("refreshing={isRefreshing}", "refreshing={isLoading}")
        # add isRefreshing state? skip - use isLoading

    text = re.sub(
        r"(return \(\n    <div className=\"space-y-[46]\">\n)",
        r"\1" + header_block,
        text,
        count=1,
    )
    # Fix finance page which uses loadFinance not isRefreshing
    if "FullFinancePage" in path.name:
        text = text.replace("refreshing={isRefreshing}", "refreshing={isLoading}")
        text = text.replace("onRefresh={() => void loadFinance(true)}", "onRefresh={() => void loadFinance()}")

    path.write_text(text)
    print(f"Patched {path.name}")


def main() -> None:
    for fname, (back, eyebrow, title, desc) in CONFIG.items():
        p = ROOT / fname
        if p.exists():
            patch_file(p, back, eyebrow, title, desc)


if __name__ == "__main__":
    main()
