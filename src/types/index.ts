export type AccountRole = "customer" | "vendor" | "admin";
export type VendorStatus =
  | "none"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended";
export type AccountStatus = "active" | "blocked" | "inactive";
export type StoreStatus = "active" | "suspended" | "draft";
export type ProductStatus = "pending" | "active" | "hidden" | "suspended";
export type VoucherDiscountType = "percent" | "fixed" | "free_shipping";
export type VoucherScope = "odos" | "store";
export type VoucherAvailability = "auto" | "claim" | "assigned";
export type VoucherCampaignStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "disabled"
  | "limit_reached";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";
export type NotificationType =
  | "order"
  | "vendor"
  | "user"
  | "system"
  | "store";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl?: string | null;
  roles: AccountRole[];
  vendorStatus: VendorStatus;
  accountStatus: AccountStatus;
  joinedAt: string;
};

export type VendorApplication = {
  id: string;
  userId: string;
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  phoneNumber: string;
  whatsappNumber?: string | null;
  region: string;
  city: string;
  marketId?: string | null;
  storeName: string;
  storeDescription?: string | null;
  status: VendorStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Vendor = {
  id: string;
  userId: string;
  businessName: string;
  businessCategory: string;
  status: "active" | "suspended";
  email: string;
  phoneNumber: string | null;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  joinedAt: string;
};

export type Store = {
  id: string;
  vendorId: string | null;
  name: string;
  slug: string;
  description: string;
  category: string;
  audienceSlugs?: string[] | null;
  marketId: string | null;
  location: string | null;
  region: string;
  city: string;
  bannerImage?: string | null;
  logoImage?: string | null;
  status: StoreStatus;
  createdAt: string;
};

export type Market = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  imageUrl?: string | null;
  status: "active" | "disabled";
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string | null;
  imageUrl?: string | null;
  subcategories?: string[] | null;
  status: "active" | "disabled";
  createdAt: string;
};

export type Product = {
  id: string;
  storeId: string | null;
  storeName: string | null;
  storeSlug?: string | null;
  storeCategory?: string | null;
  storeLocation?: string | null;
  storeRegion?: string | null;
  storeCity?: string | null;
  vendorId: string | null;
  vendorName?: string | null;
  vendorEmail?: string | null;
  name: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  discount?: string | null;
  rating?: number | null;
  reviews?: string | null;
  images: string[];
  imageKey: string;
  category: string;
  subcategory?: string | null;
  categorySlugs?: string[] | null;
  subcategorySlugs?: string[] | null;
  audienceSlug?: string | null;
  section?: string | null;
  placementTags?: string[] | null;
  colorOptions?: string[] | null;
  sizeOptions?: string[] | null;
  specifications?: string[] | null;
  stock: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type VoucherCampaign = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  issuerName?: string | null;
  scope: VoucherScope;
  availability: VoucherAvailability;
  storeId?: string | null;
  storeName?: string | null;
  rewardText: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minSubtotal: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  isActive: boolean;
  status: VoucherCampaignStatus;
  redemptionCount: number;
  uniqueUserCount: number;
  totalDiscountAmount: number;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
};

export type AdminReview = {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  storeName?: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  isHidden: boolean;
  moderationReason?: string | null;
  moderatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  storeName: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type DashboardStats = {
  totalUsers: number;
  totalVendors: number;
  pendingVendorApplications: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
};

export type DashboardPayload = {
  stats: DashboardStats;
  recentOrders: Order[];
  recentVendorApplications: VendorApplication[];
  recentNotifications: NotificationItem[];
};

export type AdminSession = {
  token: string;
  user: AdminUser;
};
