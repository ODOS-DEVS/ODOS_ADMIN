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
export type ProductStatus = "active" | "hidden" | "suspended";
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
  vendorId: string | null;
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
