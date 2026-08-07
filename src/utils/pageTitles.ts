/** Presentation-only route titles for the global top header. */
export function resolvePageTitle(pathname: string): string {
  if (pathname.startsWith("/users/full/")) return "User profile";
  if (pathname.startsWith("/users/full")) return "User management";
  if (pathname.startsWith("/orders/full/")) return "Order detail";
  if (pathname.startsWith("/orders/full")) return "Order queue";
  if (pathname.startsWith("/vendors/full/")) return "Vendor profile";
  if (pathname.startsWith("/vendors/full")) return "Vendors";
  if (pathname.startsWith("/vendor-applications/full/")) return "Application detail";
  if (pathname.startsWith("/vendor-applications/full")) return "Vendor applications";
  if (pathname.startsWith("/products/full")) return "Products";
  if (pathname.startsWith("/stores/full")) return "Stores";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/analytics")) return "Analytics";
  if (pathname.startsWith("/audit")) return "Audit log";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/finance/full")) return "Finance";
  if (pathname.startsWith("/payouts")) return "Payouts";
  if (pathname.startsWith("/support-chats/full")) return "Support chats";
  if (pathname.startsWith("/returns/full")) return "Returns";
  if (pathname.startsWith("/reviews/full")) return "Reviews";
  if (pathname.startsWith("/notifications/full")) return "Notifications";
  if (pathname.startsWith("/delivery-settings")) return "Delivery settings";
  if (pathname.startsWith("/users")) return "Users";
  if (pathname.startsWith("/orders")) return "Orders";

  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return "Dashboard";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
