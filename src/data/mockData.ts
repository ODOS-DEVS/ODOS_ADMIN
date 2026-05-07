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

const now = new Date();

export const mockAdminUser: AdminUser = {
  id: "admin-1",
  fullName: "Paul Osei",
  email: "admin@odos.app",
  phone: "+233 24 000 1234",
  roles: ["admin"],
  vendorStatus: "none",
  accountStatus: "active",
  joinedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 240).toISOString(),
};

export const mockAdminSession: AdminSession = {
  token: "odos-admin-demo-token",
  user: mockAdminUser,
};

export const mockUsers: AdminUser[] = [
  mockAdminUser,
  {
    id: "user-1",
    fullName: "Ama Mensah",
    email: "ama@odos.app",
    phone: "+233 54 222 1122",
    roles: ["customer", "vendor"],
    vendorStatus: "approved",
    accountStatus: "active",
    joinedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 42).toISOString(),
  },
  {
    id: "user-2",
    fullName: "Kojo Boateng",
    email: "kojo@odos.app",
    phone: "+233 20 300 7788",
    roles: ["customer"],
    vendorStatus: "pending",
    accountStatus: "active",
    joinedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
  {
    id: "user-3",
    fullName: "Efua Addo",
    email: "efua@odos.app",
    phone: "+233 26 200 9921",
    roles: ["customer"],
    vendorStatus: "rejected",
    accountStatus: "blocked",
    joinedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];

export const mockVendorApplications: VendorApplication[] = [
  {
    id: "application-1",
    userId: "user-2",
    businessName: "Kojo Fashion Hub",
    businessCategory: "Fashion",
    businessDescription: "Curated menswear, shoes, and accessories for everyday retail.",
    phoneNumber: "+233 20 300 7788",
    whatsappNumber: "+233 20 300 7788",
    region: "Greater Accra",
    city: "Accra",
    marketId: "market-1",
    storeName: "Kojo Fashion Hub",
    storeDescription: "Affordable fashion and premium essentials.",
    status: "pending",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "application-2",
    userId: "user-3",
    businessName: "Efua Beauty Point",
    businessCategory: "Beauty",
    businessDescription: "Beauty products and skin care stock for young professionals.",
    phoneNumber: "+233 26 200 9921",
    whatsappNumber: "+233 26 200 9921",
    region: "Ashanti",
    city: "Kumasi",
    marketId: "market-2",
    storeName: "Efua Beauty Point",
    storeDescription: "Beauty supplies in the heart of Kumasi.",
    status: "rejected",
    rejectionReason: "Please provide a clearer store description and operating location.",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export const mockVendors: Vendor[] = [
  {
    id: "vendor-1",
    userId: "user-1",
    businessName: "Ama Style House",
    businessCategory: "Fashion",
    status: "active",
    email: "ama@odos.app",
    phoneNumber: "+233 54 222 1122",
    totalStores: 1,
    totalProducts: 42,
    totalOrders: 128,
    totalSales: 68450,
    joinedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 36).toISOString(),
  },
];

export const mockMarkets: Market[] = [
  {
    id: "market-1",
    name: "Makola Market",
    slug: "makola-market",
    status: "active",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 210).toISOString(),
  },
  {
    id: "market-2",
    name: "Kejetia Market",
    slug: "kejetia-market",
    status: "active",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 250).toISOString(),
  },
];

export const mockStores: Store[] = [
  {
    id: "store-1",
    vendorId: "vendor-1",
    name: "Ama Style House",
    slug: "ama-style-house",
    description: "Modern fashion storefront for women’s clothing and accessories.",
    category: "Fashion",
    marketId: "market-1",
    location: "Block C, Shop 18",
    region: "Greater Accra",
    city: "Accra",
    status: "active",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 31).toISOString(),
  },
];

export const mockCategories: Category[] = [
  {
    id: "category-1",
    name: "Fashion",
    slug: "fashion",
    description: "Clothing, accessories, and style essentials.",
    status: "active",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 310).toISOString(),
  },
  {
    id: "category-2",
    name: "Beauty",
    slug: "beauty",
    description: "Skincare, makeup, and wellness products.",
    status: "active",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 280).toISOString(),
  },
];

export const mockProducts: Product[] = [
  {
    id: "product-1",
    storeId: "store-1",
    storeName: "Ama Style House",
    vendorId: "vendor-1",
    name: "Classic Shoulder Bag",
    description: "Structured shoulder bag with everyday carry comfort.",
    price: 320,
    oldPrice: 390,
    discount: "18% off",
    rating: 4.7,
    reviews: "148 reviews",
    images: [],
    imageKey: "handbag",
    category: "Fashion",
    audienceSlug: "ladies",
    section: "featured",
    stock: 18,
    status: "active",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 11).toISOString(),
  },
  {
    id: "product-2",
    storeId: "store-1",
    storeName: "Ama Style House",
    vendorId: "vendor-1",
    name: "Weekend Dress",
    description: "Breathable fit for casual and occasion wear.",
    price: 420,
    oldPrice: 510,
    discount: "18% off",
    rating: 4.5,
    reviews: "63 reviews",
    images: [],
    imageKey: "dress",
    category: "Fashion",
    audienceSlug: "ladies",
    section: "popular-new",
    stock: 8,
    status: "hidden",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
];

export const mockOrders: Order[] = [
  {
    id: "order-1",
    orderNumber: "OD-30218",
    customerName: "Naa Dedei",
    storeName: "Ama Style House",
    totalAmount: 540,
    status: "processing",
    paymentStatus: "paid",
    createdAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "order-2",
    orderNumber: "OD-30198",
    customerName: "Yaw Koomson",
    storeName: "Ama Style House",
    totalAmount: 860,
    status: "pending",
    paymentStatus: "paid",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "order-3",
    orderNumber: "OD-30172",
    customerName: "Abena Sarpong",
    storeName: "Ama Style House",
    totalAmount: 240,
    status: "delivered",
    paymentStatus: "paid",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 28).toISOString(),
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: "notification-1",
    type: "vendor",
    title: "New vendor application",
    message: "Kojo Fashion Hub submitted a new application for review.",
    read: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "notification-2",
    type: "order",
    title: "High value order received",
    message: "Order OD-30198 crossed the GHS 800 threshold.",
    read: true,
    createdAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "notification-3",
    type: "system",
    title: "Catalog sync completed",
    message: "The overnight catalog indexing job completed successfully.",
    read: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
  },
];

export const mockDashboard: DashboardPayload = {
  stats: {
    totalUsers: 1284,
    totalVendors: 54,
    pendingVendorApplications: 6,
    totalStores: 49,
    totalProducts: 1528,
    totalOrders: 6124,
    pendingOrders: 48,
    totalRevenue: 1842500,
  },
  recentOrders: mockOrders,
  recentVendorApplications: mockVendorApplications,
  recentNotifications: mockNotifications,
};
