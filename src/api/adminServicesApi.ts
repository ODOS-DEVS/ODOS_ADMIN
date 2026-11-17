import { createPaginatedAdminApi } from "@/api/createPaginatedAdminApi";
import { requestJson } from "@/api/client";

/* ---------- Domain ---------- */

export type ServiceCategory = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
};

/** The five states an admin may set. `rejected` requires a reason the provider can act on. */
export const SERVICE_LISTING_STATUSES = ["pending_review", "active", "paused", "rejected", "archived"] as const;
export type ServiceListingStatus = (typeof SERVICE_LISTING_STATUSES)[number];

export const PROVIDER_VERIFICATIONS = ["unverified", "pending", "verified"] as const;
export type ProviderVerification = (typeof PROVIDER_VERIFICATIONS)[number];

export type ServiceListing = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  storeId: string;
  categoryId?: string | null;
  status: string;
  pricingModel: string;
  bookingType: string;
  basePrice: number;
  currency: string;
  durationMinutes?: number | null;
  rating?: number | null;
  reviewCount: number;
  bookingCount: number;
  imageUrl?: string | null;
  serviceAreas?: string[] | null;
};

export type ServiceBooking = {
  id: string;
  bookingNumber: string;
  serviceId: string;
  storeId: string;
  status: string;
  scheduledStartAt?: string | null;
  currency: string;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
};

/** Counts an operator acts on, straight from `services_marketplace_overview`. */
export type ServicesOverview = {
  windowDays: number;
  providers: number;
  providersAwaitingVerification: number;
  listingsPendingReview: number;
  listingsLive: number;
  openDisputes: number;
  bookingsAwaitingRelease: number;
  amountHeldInEscrow: number;
  bookingsInWindow: number;
  grossCollectedInWindow: number;
  commissionInWindow: number;
  openQuotations: number;
  averageServiceRating?: number | null;
};

/* ---------- Wire ---------- */

type BackendCategory = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  icon?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  sort_order?: number;
  /** Added to ServiceCategoryRead for this screen; older deployments omit it, hence optional. */
  is_active?: boolean;
};

type BackendListing = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  store_id: string;
  category_id?: string | null;
  status: string;
  pricing_model: string;
  booking_type: string;
  base_price: number;
  currency: string;
  duration_minutes?: number | null;
  rating?: number | null;
  review_count?: number;
  booking_count?: number;
  image_url?: string | null;
  service_areas?: string[] | null;
};

type BackendBooking = {
  id: string;
  booking_number: string;
  service_id: string;
  store_id: string;
  status: string;
  scheduled_start_at?: string | null;
  currency: string;
  total_amount: number;
  amount_paid: number;
  payment_status: string;
};

type BackendOverview = {
  window_days: number;
  providers: number;
  providers_awaiting_verification: number;
  listings_pending_review: number;
  listings_live: number;
  open_disputes: number;
  bookings_awaiting_release: number;
  amount_held_in_escrow: number;
  bookings_in_window: number;
  gross_collected_in_window: number;
  commission_in_window: number;
  open_quotations: number;
  average_service_rating?: number | null;
};

function mapCategory(row: BackendCategory): ServiceCategory {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    icon: row.icon,
    imageUrl: row.image_url,
    parentId: row.parent_id,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active ?? true,
  };
}

function mapListing(row: BackendListing): ServiceListing {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    storeId: row.store_id,
    categoryId: row.category_id,
    status: row.status,
    pricingModel: row.pricing_model,
    bookingType: row.booking_type,
    basePrice: row.base_price,
    currency: row.currency,
    durationMinutes: row.duration_minutes,
    rating: row.rating,
    reviewCount: row.review_count ?? 0,
    bookingCount: row.booking_count ?? 0,
    imageUrl: row.image_url,
    serviceAreas: row.service_areas,
  };
}

function mapBooking(row: BackendBooking): ServiceBooking {
  return {
    id: row.id,
    bookingNumber: row.booking_number,
    serviceId: row.service_id,
    storeId: row.store_id,
    status: row.status,
    scheduledStartAt: row.scheduled_start_at,
    currency: row.currency,
    totalAmount: row.total_amount,
    amountPaid: row.amount_paid,
    paymentStatus: row.payment_status,
  };
}

/* ---------- Calls ---------- */

const listingsApi = createPaginatedAdminApi<BackendListing, ServiceListing>({
  path: "/admin/services/listings",
  mapItem: mapListing,
});
export const getServiceListingsPage = listingsApi.getPage;

const bookingsApi = createPaginatedAdminApi<BackendBooking, ServiceBooking>({
  path: "/admin/services/bookings",
  mapItem: mapBooking,
});
export const getServiceBookingsPage = bookingsApi.getPage;

export async function getServicesOverview(token: string, windowDays = 30): Promise<ServicesOverview> {
  const row = await requestJson<BackendOverview>(`/admin/services/overview?window_days=${windowDays}`, { token });
  return {
    windowDays: row.window_days,
    providers: row.providers,
    providersAwaitingVerification: row.providers_awaiting_verification,
    listingsPendingReview: row.listings_pending_review,
    listingsLive: row.listings_live,
    openDisputes: row.open_disputes,
    bookingsAwaitingRelease: row.bookings_awaiting_release,
    amountHeldInEscrow: row.amount_held_in_escrow,
    bookingsInWindow: row.bookings_in_window,
    grossCollectedInWindow: row.gross_collected_in_window,
    commissionInWindow: row.commission_in_window,
    openQuotations: row.open_quotations,
    averageServiceRating: row.average_service_rating,
  };
}

export async function getServiceCategories(token: string): Promise<ServiceCategory[]> {
  const rows = await requestJson<BackendCategory[]>("/admin/services/categories", { token });
  return rows.map(mapCategory);
}

export type ServiceCategoryInput = {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  icon?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

const categoryBody = (input: ServiceCategoryInput) =>
  JSON.stringify({
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle ?? null,
    description: input.description ?? null,
    icon: input.icon ?? null,
    parent_id: input.parentId ?? null,
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  });

export async function createServiceCategory(token: string, input: ServiceCategoryInput) {
  return mapCategory(
    await requestJson<BackendCategory>("/admin/services/categories", {
      method: "POST",
      token,
      body: categoryBody(input),
    }),
  );
}

export async function updateServiceCategory(token: string, categoryId: string, input: ServiceCategoryInput) {
  return mapCategory(
    await requestJson<BackendCategory>(`/admin/services/categories/${categoryId}`, {
      method: "PATCH",
      token,
      body: categoryBody(input),
    }),
  );
}

/** Deactivates rather than deletes, so existing listings keep their home. */
export async function deactivateServiceCategory(token: string, categoryId: string) {
  return mapCategory(
    await requestJson<BackendCategory>(`/admin/services/categories/${categoryId}`, {
      method: "DELETE",
      token,
    }),
  );
}

/**
 * Moderates one listing. `status` and `reason` are query parameters, not a body — and the API
 * refuses a `rejected` without a reason, so the caller must collect one.
 */
export async function setServiceListingStatus(
  token: string,
  serviceId: string,
  status: ServiceListingStatus,
  reason?: string | null,
) {
  const query = new URLSearchParams({ status });
  if (reason?.trim()) query.set("reason", reason.trim());
  return mapListing(
    await requestJson<BackendListing>(`/admin/services/listings/${serviceId}/status?${query}`, {
      method: "POST",
      token,
    }),
  );
}

export async function setProviderVerification(
  token: string,
  storeId: string,
  verification: ProviderVerification,
) {
  return requestJson<unknown>(
    `/admin/services/providers/${storeId}/verification?verification=${verification}`,
    { method: "POST", token },
  );
}

/** Switch products and/or services on for a store. At least one is required. */
export async function setStoreOfferings(token: string, storeId: string, offerings: ("products" | "services")[]) {
  return requestJson<unknown>(`/admin/services/providers/${storeId}/offerings`, {
    method: "POST",
    token,
    body: JSON.stringify({ offerings }),
  });
}

export async function resolveBookingDispute(
  token: string,
  bookingId: string,
  payload: { resolution: string; note?: string | null },
) {
  return mapBooking(
    await requestJson<BackendBooking>(`/admin/services/bookings/${bookingId}/resolve-dispute`, {
      method: "POST",
      token,
      body: JSON.stringify({ resolution: payload.resolution, note: payload.note ?? null }),
    }),
  );
}
