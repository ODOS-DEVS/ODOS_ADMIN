import type {
  AdminSession,
  AdminUser,
  Category,
  DashboardPayload,
  Market,
  NotificationItem,
  Order,
  Product,
  Store,
  Vendor,
  VendorApplication,
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
  vendor_id: string | null;
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

type BackendNotification = {
  id: string;
  type: NotificationItem["type"];
  title: string;
  message: string;
  read: boolean;
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
    vendorId: product.vendor_id ?? null,
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
