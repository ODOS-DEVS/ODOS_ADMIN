import type {
  AdminSession,
  AdminOrderDetail,
  AdminReturnRequest,
  AdminStoreDetail,
  AdminReview,
  AdminUser,
  AdminUserDetail,
  Category,
  DashboardPayload,
  Market,
  NotificationItem,
  Order,
  Product,
  Store,
  SupportChatMessage,
  SupportChatThread,
  Vendor,
  VendorApplication,
  VoucherCampaign,
} from "@/types";

type BackendAdminUser = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url?: string | null;
  roles: string[];
  vendor_status: AdminUser["vendorStatus"];
  account_status: AdminUser["accountStatus"];
  joined_at: string;
};

type BackendAdminUserAddress = {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type BackendAdminUserPaymentMethod = {
  id: string;
  type: string;
  label: string;
  is_default: boolean;
  card_name?: string | null;
  card_last4?: string | null;
  expiry?: string | null;
  network?: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
};

type BackendAdminUserStoreSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
  logo_image?: string | null;
  banner_image?: string | null;
  market_id?: string | null;
  location?: string | null;
  region: string;
  city: string;
  created_at: string;
  updated_at: string;
};

type BackendAdminUserVendorApplication = {
  id: string;
  status: AdminUser["vendorStatus"];
  business_name: string;
  business_category: string;
  business_description: string;
  phone_number: string;
  whatsapp_number?: string | null;
  region: string;
  city: string;
  market_id?: string | null;
  store_location?: string | null;
  store_name: string;
  store_description?: string | null;
  ghana_card_number?: string | null;
  business_registration_number?: string | null;
  logo_image_url?: string | null;
  banner_image_url?: string | null;
  shop_image_url?: string | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

type BackendAdminUserDetail = BackendAdminUser & {
  date_of_birth?: string | null;
  gender?: string | null;
  city?: string | null;
  region?: string | null;
  allow_notifications: boolean;
  discount_notifications: boolean;
  store_notifications: boolean;
  system_notifications: boolean;
  location_notifications: boolean;
  location_updates: boolean;
  vendor_rejection_reason?: string | null;
  is_verified: boolean;
  last_login_at?: string | null;
  updated_at: string;
  auth_providers: string[];
  addresses: BackendAdminUserAddress[];
  payment_methods: BackendAdminUserPaymentMethod[];
  vendor_application?: BackendAdminUserVendorApplication | null;
  stores: BackendAdminUserStoreSummary[];
  stats: {
    total_orders: number;
    total_reviews: number;
    total_saved_addresses: number;
    total_saved_payment_methods: number;
    total_cart_items: number;
    total_wishlist_items: number;
    total_notifications: number;
    total_spent: number;
    last_order_at?: string | null;
    last_review_at?: string | null;
  };
};

type BackendVendorApplication = {
  id: string;
  user_id: string;
  business_name: string;
  business_category: string;
  business_description: string;
  phone_number: string;
  whatsapp_number?: string | null;
  region: string;
  city: string;
  market_id?: string | null;
  store_name: string;
  store_description?: string | null;
  status: VendorApplication["status"];
  rejection_reason?: string | null;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
};

type BackendVendor = {
  id: string;
  user_id: string;
  business_name: string;
  business_category: string;
  status: Vendor["status"];
  email: string;
  phone_number: string | null;
  total_stores: number;
  total_products: number;
  total_orders: number;
  total_sales: number;
  joined_at: string;
};

type BackendStore = {
  id: string;
  vendor_id: string | null;
  name: string;
  slug: string;
  description: string;
  category: string;
  audience_slugs?: string[] | null;
  market_id: string | null;
  location: string | null;
  region: string;
  city: string;
  banner_image?: string | null;
  logo_image?: string | null;
  status: Store["status"];
  created_at: string;
};

type BackendStoreDetail = BackendStore & {
  vendor_name?: string | null;
  vendor_email?: string | null;
  vendor_phone_number?: string | null;
  market_name?: string | null;
  updated_at: string;
  products: Array<{
    id: string;
    name: string;
    status: Product["status"];
    price: number;
    old_price?: number | null;
    discount?: string | null;
    stock: number;
    category: string;
    subcategory?: string | null;
    images: string[];
    created_at: string;
    updated_at: string;
  }>;
  stats: {
    total_products: number;
    active_products: number;
    pending_products: number;
    hidden_products: number;
    total_orders: number;
    total_sales: number;
  };
};

type BackendMarket = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  image_url?: string | null;
  status: Market["status"];
  created_at: string;
};

type BackendCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string | null;
  image_url?: string | null;
  subcategories?: string[] | null;
  status: Category["status"];
  created_at: string;
};

type BackendProduct = {
  id: string;
  store_id: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  store_category?: string | null;
  store_location?: string | null;
  store_region?: string | null;
  store_city?: string | null;
  vendor_id: string | null;
  vendor_name?: string | null;
  vendor_email?: string | null;
  name: string;
  description: string;
  images: string[];
  image_key?: string;
  category: string;
  subcategory?: string | null;
  category_slugs?: string[] | null;
  subcategory_slugs?: string[] | null;
  audience_slug?: string | null;
  section?: string | null;
  placement_tags?: string[] | null;
  price: number;
  old_price?: number | null;
  discount?: string | null;
  rating?: number | null;
  reviews?: string | null;
  color_options?: string[] | null;
  size_options?: string[] | null;
  specifications?: string[] | null;
  stock: number;
  status: Product["status"];
  created_at: string;
  updated_at: string;
};

type BackendOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  store_name: string;
  total_amount: number;
  status: Order["status"];
  payment_status: Order["paymentStatus"];
  created_at: string;
};

type BackendOrderDetail = BackendOrder & {
  customer_id: string;
  customer_email: string;
  customer_phone_number?: string | null;
  customer_avatar_url?: string | null;
  source: string;
  internal_status: Order["status"];
  vendor_status: Order["status"] | string;
  subtotal_amount: number;
  shipping_amount: number;
  discount_amount: number;
  progress?: number | null;
  tracking_eta?: string | null;
  cancellation_reason?: string | null;
  address_full_name: string;
  address_phone: string;
  address_street: string;
  address_city: string;
  address_region: string;
  payment_type: string;
  payment_label: string;
  payment_network?: string | null;
  payment_phone?: string | null;
  payment_last4?: string | null;
  voucher_id?: string | null;
  voucher_code?: string | null;
  voucher_title?: string | null;
  placed_at: string;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  updated_at: string;
  items: Array<{
    id: string;
    product_id: string;
    title: string;
    category?: string | null;
    image_url?: string | null;
    image_key?: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
    selected_color?: string | null;
    selected_size?: string | null;
  }>;
  return_requests: BackendAdminReturnRequest[];
};

type BackendAdminReturnRequest = {
  id: string;
  order_id: string;
  order_number: string;
  order_item_id: string;
  product_id: string;
  product_title: string;
  product_image_url?: string | null;
  product_image_key?: string | null;
  store_name: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  request_type: "refund" | "exchange" | "return" | string;
  status:
    | "requested"
    | "under_review"
    | "approved"
    | "rejected"
    | "refunded"
    | "exchanged"
    | string;
  quantity: number;
  reason: string;
  details?: string | null;
  evidence_image_urls?: string[] | null;
  admin_note?: string | null;
  refund_amount?: number | null;
  reviewed_by_user_id?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
};

type BackendVoucherCampaign = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  issuer_name?: string | null;
  scope: VoucherCampaign["scope"];
  availability: VoucherCampaign["availability"];
  store_id?: string | null;
  store_name?: string | null;
  reward_text: string;
  discount_type: VoucherCampaign["discountType"];
  discount_value: number;
  min_subtotal: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  per_user_limit?: number | null;
  is_active: boolean;
  status: VoucherCampaign["status"];
  redemption_count: number;
  unique_user_count: number;
  total_discount_amount: number;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
};

type BackendAdminReview = {
  id: string;
  order_id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  store_name?: string | null;
  user_id: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  is_hidden: boolean;
  moderation_reason?: string | null;
  moderated_at?: string | null;
  created_at: string;
  updated_at: string;
};

type BackendNotification = {
  id: string;
  type: NotificationItem["type"];
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

type BackendSupportChatThread = {
  id: string;
  customer_user_id: string;
  vendor_user_id: string;
  thread_type: "support";
  subject?: string | null;
  store: {
    id: string;
    title: string;
    image_key?: string | null;
    image_url?: string | null;
  };
  counterpart: {
    user_id: string;
    name: string;
    avatar_url?: string | null;
    role: "customer" | "vendor" | "admin";
  };
  support_status?: "waiting_on_admin" | "waiting_on_customer" | "resolved" | null;
  assigned_admin_user_id?: string | null;
  assigned_admin_name?: string | null;
  assigned_admin_at?: string | null;
  resolved_at?: string | null;
  last_message_text?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
};

type BackendSupportChatMessage = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  sender_role: "customer" | "vendor" | "admin";
  body: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
};

type BackendDashboardPayload = {
  stats: {
    total_users: number;
    total_vendors: number;
    pending_vendor_applications: number;
    total_stores: number;
    total_products: number;
    total_orders: number;
    pending_orders: number;
    total_revenue: number;
  };
  recent_orders: BackendOrder[];
  recent_vendor_applications: BackendVendorApplication[];
  recent_notifications: BackendNotification[];
};

export function mapAdminUser(user: BackendAdminUser): AdminUser {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone_number,
    avatarUrl: user.avatar_url ?? null,
    roles: user.roles as AdminUser["roles"],
    vendorStatus: user.vendor_status,
    accountStatus: user.account_status,
    joinedAt: user.joined_at,
  };
}

export function mapAdminUserDetail(user: BackendAdminUserDetail): AdminUserDetail {
  return {
    ...mapAdminUser(user),
    dateOfBirth: user.date_of_birth ?? null,
    gender: user.gender ?? null,
    city: user.city ?? null,
    region: user.region ?? null,
    allowNotifications: user.allow_notifications,
    discountNotifications: user.discount_notifications,
    storeNotifications: user.store_notifications,
    systemNotifications: user.system_notifications,
    locationNotifications: user.location_notifications,
    locationUpdates: user.location_updates,
    vendorRejectionReason: user.vendor_rejection_reason ?? null,
    isVerified: user.is_verified,
    lastLoginAt: user.last_login_at ?? null,
    updatedAt: user.updated_at,
    authProviders: user.auth_providers ?? [],
    addresses: user.addresses.map((address) => ({
      id: address.id,
      label: address.label,
      fullName: address.full_name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      region: address.region,
      isDefault: address.is_default,
      createdAt: address.created_at,
      updatedAt: address.updated_at,
    })),
    paymentMethods: user.payment_methods.map((method) => ({
      id: method.id,
      type: method.type,
      label: method.label,
      isDefault: method.is_default,
      cardName: method.card_name ?? null,
      cardLast4: method.card_last4 ?? null,
      expiry: method.expiry ?? null,
      network: method.network ?? null,
      phone: method.phone ?? null,
      createdAt: method.created_at,
      updatedAt: method.updated_at,
    })),
    vendorApplication: user.vendor_application
      ? {
          id: user.vendor_application.id,
          status: user.vendor_application.status,
          businessName: user.vendor_application.business_name,
          businessCategory: user.vendor_application.business_category,
          businessDescription: user.vendor_application.business_description,
          phoneNumber: user.vendor_application.phone_number,
          whatsappNumber: user.vendor_application.whatsapp_number ?? null,
          region: user.vendor_application.region,
          city: user.vendor_application.city,
          marketId: user.vendor_application.market_id ?? null,
          storeLocation: user.vendor_application.store_location ?? null,
          storeName: user.vendor_application.store_name,
          storeDescription: user.vendor_application.store_description ?? null,
          ghanaCardNumber: user.vendor_application.ghana_card_number ?? null,
          businessRegistrationNumber:
            user.vendor_application.business_registration_number ?? null,
          logoImageUrl: user.vendor_application.logo_image_url ?? null,
          bannerImageUrl: user.vendor_application.banner_image_url ?? null,
          shopImageUrl: user.vendor_application.shop_image_url ?? null,
          rejectionReason: user.vendor_application.rejection_reason ?? null,
          reviewedAt: user.vendor_application.reviewed_at ?? null,
          submittedAt: user.vendor_application.submitted_at,
          createdAt: user.vendor_application.created_at,
          updatedAt: user.vendor_application.updated_at,
        }
      : null,
    stores: user.stores.map((store) => ({
      id: store.id,
      name: store.name,
      slug: store.slug,
      status: store.status,
      logoImage: store.logo_image ?? null,
      bannerImage: store.banner_image ?? null,
      marketId: store.market_id ?? null,
      location: store.location ?? null,
      region: store.region,
      city: store.city,
      createdAt: store.created_at,
      updatedAt: store.updated_at,
    })),
    stats: {
      totalOrders: user.stats.total_orders,
      totalReviews: user.stats.total_reviews,
      totalSavedAddresses: user.stats.total_saved_addresses,
      totalSavedPaymentMethods: user.stats.total_saved_payment_methods,
      totalCartItems: user.stats.total_cart_items,
      totalWishlistItems: user.stats.total_wishlist_items,
      totalNotifications: user.stats.total_notifications,
      totalSpent: user.stats.total_spent,
      lastOrderAt: user.stats.last_order_at ?? null,
      lastReviewAt: user.stats.last_review_at ?? null,
    },
  };
}

export function mapAdminSession(payload: { access_token: string; user: BackendAdminUser }): AdminSession {
  return {
    token: payload.access_token,
    user: mapAdminUser(payload.user),
  };
}

export function mapVendorApplication(application: BackendVendorApplication): VendorApplication {
  return {
    id: application.id,
    userId: application.user_id,
    businessName: application.business_name,
    businessCategory: application.business_category,
    businessDescription: application.business_description,
    phoneNumber: application.phone_number,
    whatsappNumber: application.whatsapp_number ?? null,
    region: application.region,
    city: application.city,
    marketId: application.market_id ?? null,
    storeName: application.store_name,
    storeDescription: application.store_description ?? null,
    status: application.status,
    rejectionReason: application.rejection_reason ?? null,
    createdAt: application.submitted_at ?? application.created_at,
    updatedAt: application.updated_at,
  };
}

export function mapVendor(vendor: BackendVendor): Vendor {
  return {
    id: vendor.id,
    userId: vendor.user_id,
    businessName: vendor.business_name,
    businessCategory: vendor.business_category,
    status: vendor.status,
    email: vendor.email,
    phoneNumber: vendor.phone_number,
    totalStores: vendor.total_stores,
    totalProducts: vendor.total_products,
    totalOrders: vendor.total_orders,
    totalSales: vendor.total_sales,
    joinedAt: vendor.joined_at,
  };
}

export function mapStore(store: BackendStore): Store {
  return {
    id: store.id,
    vendorId: store.vendor_id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    category: store.category,
    audienceSlugs: store.audience_slugs ?? null,
    marketId: store.market_id,
    location: store.location,
    region: store.region,
    city: store.city,
    bannerImage: store.banner_image ?? null,
    logoImage: store.logo_image ?? null,
    status: store.status,
    createdAt: store.created_at,
  };
}

export function mapStoreDetail(store: BackendStoreDetail): AdminStoreDetail {
  return {
    ...mapStore(store),
    vendorName: store.vendor_name ?? null,
    vendorEmail: store.vendor_email ?? null,
    vendorPhoneNumber: store.vendor_phone_number ?? null,
    marketName: store.market_name ?? null,
    updatedAt: store.updated_at,
    products: store.products.map((product) => ({
      id: product.id,
      name: product.name,
      status: product.status,
      price: product.price,
      oldPrice: product.old_price ?? null,
      discount: product.discount ?? null,
      stock: product.stock,
      category: product.category,
      subcategory: product.subcategory ?? null,
      images: product.images,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    })),
    stats: {
      totalProducts: store.stats.total_products,
      activeProducts: store.stats.active_products,
      pendingProducts: store.stats.pending_products,
      hiddenProducts: store.stats.hidden_products,
      totalOrders: store.stats.total_orders,
      totalSales: store.stats.total_sales,
    },
  };
}

export function mapMarket(market: BackendMarket): Market {
  return {
    id: market.id,
    name: market.name,
    slug: market.slug,
    image: market.image ?? null,
    imageUrl: market.image_url ?? null,
    status: market.status,
    createdAt: market.created_at,
  };
}

export function mapCategory(category: BackendCategory): Category {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image ?? null,
    imageUrl: category.image_url ?? null,
    subcategories: category.subcategories ?? null,
    status: category.status,
    createdAt: category.created_at,
  };
}

export function mapProduct(product: BackendProduct): Product {
  return {
    id: product.id,
    storeId: product.store_id ?? null,
    storeName: product.store_name ?? null,
    storeSlug: product.store_slug ?? null,
    storeCategory: product.store_category ?? null,
    storeLocation: product.store_location ?? null,
    storeRegion: product.store_region ?? null,
    storeCity: product.store_city ?? null,
    vendorId: product.vendor_id ?? null,
    vendorName: product.vendor_name ?? null,
    vendorEmail: product.vendor_email ?? null,
    name: product.name,
    description: product.description,
    images: product.images,
    imageKey: product.image_key ?? "bag",
    category: product.category,
    subcategory: product.subcategory ?? null,
    categorySlugs: product.category_slugs ?? null,
    subcategorySlugs: product.subcategory_slugs ?? null,
    audienceSlug: product.audience_slug ?? null,
    section: product.section ?? null,
    placementTags: product.placement_tags ?? null,
    price: product.price,
    oldPrice: product.old_price ?? null,
    discount: product.discount ?? null,
    rating: product.rating ?? null,
    reviews: product.reviews ?? null,
    colorOptions: product.color_options ?? null,
    sizeOptions: product.size_options ?? null,
    specifications: product.specifications ?? null,
    stock: product.stock,
    status: product.status,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

export function mapOrder(order: BackendOrder): Order {
  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    storeName: order.store_name,
    totalAmount: order.total_amount,
    status: order.status,
    paymentStatus: order.payment_status,
    createdAt: order.created_at,
  };
}

export function mapAdminReturnRequest(request: BackendAdminReturnRequest): AdminReturnRequest {
  return {
    id: request.id,
    orderId: request.order_id,
    orderNumber: request.order_number,
    orderItemId: request.order_item_id,
    productId: request.product_id,
    productTitle: request.product_title,
    productImageUrl: request.product_image_url ?? null,
    productImageKey: request.product_image_key ?? null,
    storeName: request.store_name,
    userId: request.user_id,
    customerName: request.customer_name,
    customerEmail: request.customer_email,
    requestType: request.request_type,
    status: request.status,
    quantity: request.quantity,
    reason: request.reason,
    details: request.details ?? null,
    evidenceImageUrls: request.evidence_image_urls ?? null,
    adminNote: request.admin_note ?? null,
    refundAmount: request.refund_amount ?? null,
    reviewedByUserId: request.reviewed_by_user_id ?? null,
    reviewedByName: request.reviewed_by_name ?? null,
    reviewedAt: request.reviewed_at ?? null,
    resolvedAt: request.resolved_at ?? null,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
  };
}

export function mapOrderDetail(order: BackendOrderDetail): AdminOrderDetail {
  return {
    ...mapOrder(order),
    customerId: order.customer_id,
    customerEmail: order.customer_email,
    customerPhoneNumber: order.customer_phone_number ?? null,
    customerAvatarUrl: order.customer_avatar_url ?? null,
    source: order.source,
    internalStatus: order.internal_status,
    vendorStatus: order.vendor_status,
    subtotalAmount: order.subtotal_amount,
    shippingAmount: order.shipping_amount,
    discountAmount: order.discount_amount,
    progress: order.progress ?? null,
    trackingEta: order.tracking_eta ?? null,
    cancellationReason: order.cancellation_reason ?? null,
    addressFullName: order.address_full_name,
    addressPhone: order.address_phone,
    addressStreet: order.address_street,
    addressCity: order.address_city,
    addressRegion: order.address_region,
    paymentType: order.payment_type,
    paymentLabel: order.payment_label,
    paymentNetwork: order.payment_network ?? null,
    paymentPhone: order.payment_phone ?? null,
    paymentLast4: order.payment_last4 ?? null,
    voucherId: order.voucher_id ?? null,
    voucherCode: order.voucher_code ?? null,
    voucherTitle: order.voucher_title ?? null,
    placedAt: order.placed_at,
    deliveredAt: order.delivered_at ?? null,
    cancelledAt: order.cancelled_at ?? null,
    updatedAt: order.updated_at,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      title: item.title,
      category: item.category ?? null,
      imageUrl: item.image_url ?? null,
      imageKey: item.image_key ?? null,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total,
      selectedColor: item.selected_color ?? null,
      selectedSize: item.selected_size ?? null,
    })),
    returnRequests: (order.return_requests ?? []).map(mapAdminReturnRequest),
  };
}

export function mapVoucherCampaign(voucher: BackendVoucherCampaign): VoucherCampaign {
  return {
    id: voucher.id,
    code: voucher.code,
    title: voucher.title,
    description: voucher.description ?? null,
    issuerName: voucher.issuer_name ?? null,
    scope: voucher.scope,
    availability: voucher.availability,
    storeId: voucher.store_id ?? null,
    storeName: voucher.store_name ?? null,
    rewardText: voucher.reward_text,
    discountType: voucher.discount_type,
    discountValue: voucher.discount_value,
    minSubtotal: voucher.min_subtotal,
    maxDiscount: voucher.max_discount ?? null,
    usageLimit: voucher.usage_limit ?? null,
    perUserLimit: voucher.per_user_limit ?? null,
    isActive: voucher.is_active,
    status: voucher.status,
    redemptionCount: voucher.redemption_count,
    uniqueUserCount: voucher.unique_user_count,
    totalDiscountAmount: voucher.total_discount_amount,
    startsAt: voucher.starts_at ?? null,
    endsAt: voucher.ends_at ?? null,
    createdAt: voucher.created_at,
  };
}

export function mapAdminReview(review: BackendAdminReview): AdminReview {
  return {
    id: review.id,
    orderId: review.order_id,
    orderNumber: review.order_number,
    productId: review.product_id,
    productName: review.product_name,
    storeName: review.store_name ?? null,
    userId: review.user_id,
    userName: review.user_name,
    userEmail: review.user_email,
    rating: review.rating,
    comment: review.comment,
    isHidden: review.is_hidden,
    moderationReason: review.moderation_reason ?? null,
    moderatedAt: review.moderated_at ?? null,
    createdAt: review.created_at,
    updatedAt: review.updated_at,
  };
}

export function mapNotification(notification: BackendNotification): NotificationItem {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    createdAt: notification.created_at,
  };
}

export function mapSupportChatThread(thread: BackendSupportChatThread): SupportChatThread {
  return {
    id: thread.id,
    requesterUserId: thread.customer_user_id,
    adminUserId: thread.vendor_user_id,
    threadType: thread.thread_type,
    subject: thread.subject ?? null,
    store: {
      id: thread.store.id,
      title: thread.store.title,
      imageKey: thread.store.image_key ?? null,
      imageUrl: thread.store.image_url ?? null,
    },
    counterpart: {
      userId: thread.counterpart.user_id,
      name: thread.counterpart.name,
      avatarUrl: thread.counterpart.avatar_url ?? null,
      role: thread.counterpart.role,
    },
    supportStatus: thread.support_status ?? null,
    assignedAdminUserId: thread.assigned_admin_user_id ?? null,
    assignedAdminName: thread.assigned_admin_name ?? null,
    assignedAdminAt: thread.assigned_admin_at ?? null,
    resolvedAt: thread.resolved_at ?? null,
    lastMessageText: thread.last_message_text ?? null,
    lastMessageAt: thread.last_message_at ?? null,
    unreadCount: thread.unread_count,
    createdAt: thread.created_at,
    updatedAt: thread.updated_at,
  };
}

export function mapSupportChatMessage(message: BackendSupportChatMessage): SupportChatMessage {
  return {
    id: message.id,
    threadId: message.thread_id,
    senderUserId: message.sender_user_id,
    recipientUserId: message.recipient_user_id,
    senderRole: message.sender_role,
    text: message.body,
    isRead: message.is_read,
    readAt: message.read_at ?? null,
    time: message.created_at,
  };
}

export function mapDashboard(payload: BackendDashboardPayload): DashboardPayload {
  return {
    stats: {
      totalUsers: payload.stats.total_users,
      totalVendors: payload.stats.total_vendors,
      pendingVendorApplications: payload.stats.pending_vendor_applications,
      totalStores: payload.stats.total_stores,
      totalProducts: payload.stats.total_products,
      totalOrders: payload.stats.total_orders,
      pendingOrders: payload.stats.pending_orders,
      totalRevenue: payload.stats.total_revenue,
    },
    recentOrders: payload.recent_orders.map(mapOrder),
    recentVendorApplications: payload.recent_vendor_applications.map(mapVendorApplication),
    recentNotifications: payload.recent_notifications.map(mapNotification),
  };
}
