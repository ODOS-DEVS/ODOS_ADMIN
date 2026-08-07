import type { VendorApplication, VendorStatus } from "@/types";

export type ApplicationQueueTab = "all" | "pending" | "under_review" | "approved" | "rejected";

const TAB_STATUS: Record<Exclude<ApplicationQueueTab, "all">, VendorStatus> = {
  pending: "pending",
  under_review: "under_review",
  approved: "approved",
  rejected: "rejected",
};

export function filterApplicationsByTab(
  applications: VendorApplication[],
  tab: ApplicationQueueTab,
) {
  if (tab === "all") {
    return applications;
  }
  return applications.filter((application) => application.status === TAB_STATUS[tab]);
}

export function buildApplicationQueueSnapshot(applications: VendorApplication[]) {
  const pending = applications.filter((application) => application.status === "pending").length;
  const underReview = applications.filter(
    (application) => application.status === "under_review",
  ).length;
  const approved = applications.filter((application) => application.status === "approved").length;
  const rejected = applications.filter((application) => application.status === "rejected").length;

  return {
    total: applications.length,
    pending,
    underReview,
    approved,
    rejected,
    needsReview: pending + underReview,
  };
}
