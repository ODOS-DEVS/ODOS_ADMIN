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
export type VoucherDiscountType = "percent" | "fixed" | "free_shipping" | "bogo";
export type PromotionType = "coupon" | "automatic" | "product" | "cart" | "bogo" | "free_shipping";
export type VoucherScope = "odos" | "store" | "category" | "product";
export type VoucherAvailability = "auto" | "claim" | "assigned";
export type VoucherCampaignStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "disabled"
  | "limit_reached";
export type OrderStatus =
  | "pending_payment"
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";
export type VendorWithdrawalStatus =
  | "pending"
  | "approved"
  | "processing"
  | "rejected"
  | "failed"
  | "paid";
export type NotificationType =
  | "order"
  | "vendor"
  | "user"
  | "system"
  | "store";
export type SupportChatRole = "customer" | "vendor" | "admin";
export type SupportChatStatus =
  | "waiting_on_admin"
  | "waiting_on_customer"
  | "resolved";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl?: string | null;
  roles: AccountRole[];
  adminPermission?: AdminPermissionLevel | null;
  vendorStatus: VendorStatus;
  accountStatus: AccountStatus;
  joinedAt: string;
};

export type AdminPermissionLevel =
  | "super_admin"
  | "admin"
  | "support"
  | "finance"
  | "inventory"
  | "analyst";

export type AdminUserAddress = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserPaymentMethod = {
  id: string;
  type: string;
  label: string;
  isDefault: boolean;
  cardName?: string | null;
  cardLast4?: string | null;
  expiry?: string | null;
  network?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserStoreSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
  logoImage?: string | null;
  bannerImage?: string | null;
  marketId?: string | null;
  location?: string | null;
  region: string;
  city: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserVendorApplication = {
  id: string;
  status: VendorStatus;
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  phoneNumber: string;
  whatsappNumber?: string | null;
  region: string;
  city: string;
  marketId?: string | null;
  storeLocation?: string | null;
  storeName: string;
  storeDescription?: string | null;
  ghanaCardNumber?: string | null;
  businessRegistrationNumber?: string | null;
  logoImageUrl?: string | null;
  bannerImageUrl?: string | null;
  shopImageUrl?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserStats = {
  totalOrders: number;
  totalReviews: number;
  totalSavedAddresses: number;
  totalSavedPaymentMethods: number;
  totalCartItems: number;
  totalWishlistItems: number;
  totalNotifications: number;
  totalSpent: number;
  lastOrderAt?: string | null;
  lastReviewAt?: string | null;
};

export type AdminUserCartItem = {
  id: string;
  productId: string;
  title: string;
  imageUrl?: string | null;
  category?: string | null;
  price: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserWishlistItem = {
  id: string;
  productId: string;
  title: string;
  imageUrl?: string | null;
  category?: string | null;
  price?: string | null;
  createdAt: string;
};

export type AdminUserNotification = {
  id: string;
  kind: string;
  title: string;
  message: string;
  createdAt: string;
};

export type AdminUserWalletSummary = {
  balance: number;
  currency: string;
  lifetimeTopups: number;
  lifetimeSpend: number;
  lifetimeRefunds: number;
  transactionCount: number;
};

export type AdminUserDetail = AdminUser & {
  dateOfBirth?: string | null;
  gender?: string | null;
  city?: string | null;
  region?: string | null;
  allowNotifications: boolean;
  discountNotifications: boolean;
  storeNotifications: boolean;
  systemNotifications: boolean;
  locationNotifications: boolean;
  locationUpdates: boolean;
  personalizationEnabled: boolean;
  analyticsEnabled: boolean;
  phoneVerified: boolean;
  vendorRejectionReason?: string | null;
  isVerified: boolean;
  lastLoginAt?: string | null;
  updatedAt: string;
  authProviders: string[];
  addresses: AdminUserAddress[];
  paymentMethods: AdminUserPaymentMethod[];
  vendorApplication?: AdminUserVendorApplication | null;
  stores: AdminUserStoreSummary[];
  stats: AdminUserStats;
  orders: Order[];
  reviews: AdminReview[];
  returnRequests: AdminReturnRequest[];
  paymentTransactions: AdminPaymentTransaction[];
  cartItems: AdminUserCartItem[];
  wishlistItems: AdminUserWishlistItem[];
  notifications: AdminUserNotification[];
  customerWallet: AdminUserWalletSummary | null;
  behaviorEventCount: number;
};

export type VendorApplication = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  phoneNumber: string;
  whatsappNumber?: string | null;
  region: string;
  city: string;
  marketId?: string | null;
  storeLocation?: string | null;
  storeLatitude?: number | null;
  storeLongitude?: number | null;
  storeInstagramUrl?: string | null;
  storeFacebookUrl?: string | null;
  storeTiktokUrl?: string | null;
  storeTwitterUrl?: string | null;
  storeWhatsappUrl?: string | null;
  storeWebsiteUrl?: string | null;
  storeName: string;
  storeDescription?: string | null;
  ghanaCardNumber?: string | null;
  businessRegistrationNumber?: string | null;
  logoImageUrl?: string | null;
  bannerImageUrl?: string | null;
  shopImageUrl?: string | null;
  status: VendorStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  submittedAt: string;
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

export type AdminStoreProduct = {
  id: string;
  name: string;
  status: ProductStatus;
  price: number;
  oldPrice?: number | null;
  discount?: string | null;
  stock: number;
  category: string;
  subcategory?: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdminStoreStats = {
  totalProducts: number;
  activeProducts: number;
  pendingProducts: number;
  hiddenProducts: number;
  totalOrders: number;
  totalSales: number;
};

export type AdminStoreDetail = Store & {
  vendorName?: string | null;
  vendorEmail?: string | null;
  vendorPhoneNumber?: string | null;
  marketName?: string | null;
  updatedAt: string;
  products: AdminStoreProduct[];
  stats: AdminStoreStats;
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

export type PromoBannerAccent = "gold" | "default" | "teal";

export type PromoBannerPlacement = "home" | "deals";

export type PromoBannerLinkType =
  | "deals"
  | "discounted_products"
  | "flash_sales"
  | "popular"
  | "search"
  | "category"
  | "product"
  | "store"
  | "vouchers"
  | "campaign"
  | "external"
  | "screen";

export type PromoBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  ctaLabel: string;
  ctaLink?: string | null;
  imageUrl?: string | null;
  accent?: PromoBannerAccent | null;
  sortOrder: number;
  status: "active" | "disabled";
  linkType: PromoBannerLinkType;
  campaignTag?: string | null;
  placement: PromoBannerPlacement;
  destinationLabel?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FlashSaleEvent = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  startsAt?: string | null;
  endsAt: string;
  sortOrder: number;
  status: "active" | "disabled";
  productIds: string[];
  createdAt: string;
  updatedAt: string;
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

export type VoucherOwnerType = "platform" | "vendor";

export type VoucherCampaign = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  issuerName?: string | null;
  scope: VoucherScope;
  ownerType?: VoucherOwnerType;
  availability: VoucherAvailability;
  storeId?: string | null;
  storeName?: string | null;
  eligibleStoreIds?: string[] | null;
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
  approvalStatus?: string;
  campaignTag?: string | null;
  reviewNotes?: string | null;
  promotionType?: PromotionType;
  priority?: number;
  stackable?: boolean;
  exclusiveGroup?: string | null;
  autoApply?: boolean;
  bogoBuyQuantity?: number | null;
  bogoGetQuantity?: number | null;
  bogoGetDiscountPercent?: number | null;
  firstOrderOnly?: boolean;
  newUserOnly?: boolean;
  categorySlugs?: string[] | null;
  excludedCategorySlugs?: string[] | null;
  productIds?: string[] | null;
  excludedProductIds?: string[] | null;
};

export type PromotionAnalytics = {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
  topCampaigns: VoucherCampaign[];
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

export type AdminOrderItem = {
  id: string;
  productId: string;
  title: string;
  category?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
};

export type AdminReturnRequest = {
  id: string;
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  productId: string;
  productTitle: string;
  productImageUrl?: string | null;
  productImageKey?: string | null;
  storeName: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  requestType: "refund" | "exchange" | "return" | string;
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
  evidenceImageUrls?: string[] | null;
  adminNote?: string | null;
  refundAmount?: number | null;
  reviewedByUserId?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminVendorWithdrawalRequest = {
  id: string;
  walletId: string;
  vendorUserId: string;
  vendorName: string;
  vendorEmail: string;
  storeName?: string | null;
  currency: string;
  status: VendorWithdrawalStatus;
  amount: number;
  note?: string | null;
  adminNote?: string | null;
  payoutMethodType: string;
  payoutAccountName: string;
  payoutAccountNumberMasked: string;
  payoutProvider?: string | null;
  paystackTransferReference?: string | null;
  paystackTransferCode?: string | null;
  transferFailureReason?: string | null;
  transferInitiatedAt?: string | null;
  walletAvailableBalance: number;
  walletPendingWithdrawalBalance: number;
  reviewedByUserId?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderDetail = Order & {
  customerId: string;
  customerEmail: string;
  customerPhoneNumber?: string | null;
  customerAvatarUrl?: string | null;
  source: string;
  internalStatus: OrderStatus;
  vendorStatus: OrderStatus | string;
  subtotalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  deliveryMethod: string;
  deliveryMethodLabel: string;
  progress?: number | null;
  trackingEta?: string | null;
  cancellationReason?: string | null;
  addressFullName: string;
  addressPhone: string;
  addressStreet: string;
  addressCity: string;
  addressRegion: string;
  paymentType: string;
  paymentLabel: string;
  paymentProvider: string;
  paymentReference?: string | null;
  paymentNetwork?: string | null;
  paymentPhone?: string | null;
  paymentLast4?: string | null;
  voucherId?: string | null;
  voucherCode?: string | null;
  voucherTitle?: string | null;
  placedAt: string;
  paidAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  refundedAt?: string | null;
  updatedAt: string;
  items: AdminOrderItem[];
  returnRequests: AdminReturnRequest[];
};

export type AdminFinanceOverview = {
  currency: string;
  currentBalance: number;
  vendorLiabilityBalance: number;
  commissionBalance: number;
  grossCollectedTotal: number;
  processorFeeTotal: number;
  refundedTotal: number;
  totalPayoutsSent: number;
  pendingWithdrawalTotal: number;
  approvedWithdrawalTotal: number;
  paidOrderCount: number;
  paidOrderVolume: number;
};

export type AdminPaymentTransaction = {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  customerEmail: string;
  provider: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  preferredChannel?: string | null;
  processorFeeAmount: number;
  gatewayResponse?: string | null;
  providerTransactionId?: string | null;
  paidAt?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPlatformLedgerEntry = {
  id: string;
  kind: string;
  direction: string;
  title: string;
  description?: string | null;
  amount: number;
  currentBalanceAfter: number;
  vendorLiabilityBalanceAfter: number;
  commissionBalanceAfter: number;
  orderId?: string | null;
  orderNumber?: string | null;
  paymentTransactionId?: string | null;
  paymentReference?: string | null;
  returnRequestId?: string | null;
  vendorWithdrawalRequestId?: string | null;
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

export type SupportChatStoreSummary = {
  id: string;
  title: string;
  imageKey?: string | null;
  imageUrl?: string | null;
};

export type SupportChatCounterpart = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  role: SupportChatRole;
};

export type SupportChatThread = {
  id: string;
  requesterUserId: string;
  adminUserId: string;
  threadType: "support";
  subject?: string | null;
  store: SupportChatStoreSummary;
  counterpart: SupportChatCounterpart;
  supportStatus?: SupportChatStatus | null;
  assignedAdminUserId?: string | null;
  assignedAdminName?: string | null;
  assignedAdminAt?: string | null;
  resolvedAt?: string | null;
  lastMessageText?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SupportChatMessage = {
  id: string;
  threadId: string;
  senderUserId: string;
  recipientUserId: string;
  senderRole: SupportChatRole;
  text: string;
  isRead: boolean;
  readAt?: string | null;
  time: string;
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
