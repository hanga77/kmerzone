

export interface Zone {
  id: string;
  name: string;
  city: 'Douala' | 'Yaoundé' | 'Bafoussam' | 'Limbe' | 'Kribi';
}

export interface Review {
  author: string;
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  sellerReply?: {
    text: string;
    date: string; // ISO string
  };
}

export interface Variant {
    name: 'Taille' | 'Couleur' | string;
    options: string[];
}

export interface VariantDetail {
  options: Record<string, string>; // e.g. { "Taille": "S", "Couleur": "Bleu" }
  stock: number;
  price?: number; // Optional price override for this variant
  sku?: string; // Optional unique identifier
}

export interface Product {
  id: string;
  name:string;
  price: number;
  promotionPrice?: number;
  imageUrls: string[];
  vendor: string;
  description: string;
  reviews: Review[];
  stock: number; // For products without variants, or total stock for variants
  categoryId: string; // The ID of the category
  variants?: Variant[];
  variantDetails?: VariantDetail[];
  status: 'published' | 'draft' | 'archived';
  additionalShippingFee?: number;
  sku?: string;
  viewCount?: number;
  
  // New fields for product vs service
  type?: 'product' | 'service';

  // New fields for services
  duration?: string; // e.g., "1 hour", "per session"
  locationType?: 'remote' | 'on-site' | 'flexible'; // Where the service is provided
  serviceArea?: string; // e.g., "Douala only", "Nationwide"
  availability?: string; // e.g., "Mon-Fri, 9am-5pm"

  // Generic / Shared fields
  brand?: string;
  weight?: number; // in kg
  dimensions?: string; // e.g. "10x5x3 cm"
  material?: string;
  gender?: 'Homme' | 'Femme' | 'Enfant' | 'Unisexe';
  color?: string;
  
  // Promotion fields
  promotionStartDate?: string; // ISO Date string
  promotionEndDate?: string; // ISO Date string
  
  // Traceability
  serialNumber?: string;
  productionDate?: string; // ISO Date string
  expirationDate?: string; // ISO Date string
  
  // Category-specific fields
  // --> Electronique
  modelNumber?: string;
  warranty?: string; // e.g., "1 an"
  operatingSystem?: string;
  accessories?: string;

  // --> Alimentation
  ingredients?: string;
  allergens?: string;
  storageInstructions?: string;
  origin?: string;

  // --> Maison & Meubles
  assemblyInstructions?: string;

  // --> Beauté & Cosmétiques
  productType?: string;
  volume?: string; // e.g., "50ml", "100g"
  skinType?: string;

  // --> Books
  author?: string;
  publisher?: string;
  publicationYear?: number;
  isbn?: string;
}

export interface FlashSaleProduct {
  productId: string;
  sellerShopName: string;
  flashPrice: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FlashSale {
  id: string;
  name: string;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  products: FlashSaleProduct[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  parentId?: string; // For sub-categories
}

export type DocumentStatus = 'requested' | 'uploaded' | 'verified' | 'rejected';

export interface RequestedDocument {
  name: string;
  status: DocumentStatus;
  fileUrl?: string; // Simulated file URL
  rejectionReason?: string;
}

export interface Warning {
  id: string;
  date: string; // ISO string
  reason: string;
}

export interface Story {
  id: string;
  imageUrl: string;
  createdAt: string; // ISO String
  productId?: string; // Link to a product
}

export interface ProductCollection {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  productIds: string[];
}

export interface ShippingPartner {
  id: string;
  name: string;
  isPremium: boolean;
}

export interface CustomShippingRate {
  local: number | null; // same city
  national: number | null; // different city
}

export interface ShippingSettings {
  enabledPartners: string[]; // array of ShippingPartner ids
  customRates: CustomShippingRate;
  freeShippingThreshold: number | null; // amount from which shipping is free
}

export interface Store {
  id: string;
  sellerId: string;
  name: string;
  logoUrl: string;
  bannerUrl?: string;
  category: string;
  warnings: Warning[];
  status: 'active' | 'suspended' | 'pending' | 'rejected';
  location: string; // city
  neighborhood: string;
  sellerFirstName: string;
  sellerLastName: string;
  sellerPhone: string;
  physicalAddress: string;
  documents: RequestedDocument[];
  latitude?: number;
  longitude?: number;
  subscriptionStatus?: 'active' | 'overdue' | 'inactive';
  subscriptionDueDate?: string; // ISO String
  paymentHistory?: { date: string; amount: number }[];
  stories?: Story[];
  premiumStatus: 'standard' | 'premium' | 'super_premium';
  visits?: number;
  collections?: ProductCollection[];
  shippingSettings?: ShippingSettings;
  isCertified?: boolean;
}

export type UserRole = 'customer' | 'seller' | 'superadmin' | 'delivery_agent' | 'depot_agent' | 'depot_manager' | 'enterprise';

export interface UserLoyalty {
  status: 'standard' | 'premium' | 'premium_plus';
  orderCount: number;
  totalSpent: number;
  premiumStatusMethod: 'loyalty' | 'deposit' | 'subscription' | null;
}

export type UserAvailabilityStatus = 'available' | 'unavailable';

export interface User {
    id: string;
    name: string;
    email: string;
    // FIX: Add optional password property for simulation purposes.
    // Storing plaintext passwords on the client is insecure and should not be done in a real application.
    password?: string;
    role: UserRole;
    shopName?: string;
    location?: string;
    loyalty: UserLoyalty;
    availabilityStatus?: UserAvailabilityStatus;
    warnings?: Warning[];
    depotId?: string;
    addresses?: Address[];
    followedStores?: string[];
    // New fields
    profilePictureUrl?: string;
    phone?: string;
    birthDate?: string; // ISO string for date
    gender?: 'Homme' | 'Femme' | 'Autre' | 'Préfère ne pas répondre';
    notificationPreferences?: {
        promotions: boolean;
        orderUpdates: boolean;
        newsletters: boolean;
    };
    zoneId?: string; // Add zoneId for logistics roles
}

export interface Address {
    id?: string;
    isDefault?: boolean;
    label?: string; // "Maison", "Bureau", etc.
    fullName: string;
    phone: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
}

export type OrderStatus = 'confirmed' | 'ready-for-pickup' | 'picked-up' | 'at-depot' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'refund-requested' | 'return-approved' | 'return-received' | 'refunded' | 'return-rejected' | 'depot-issue' | 'delivery-failed';

export interface PromoCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  validUntil?: string; // ISO Date string
  sellerId: string; // To link the code to a specific seller
  uses: number; // To track how many times it has been used
}

export interface PaymentDetails {
  methodId: string;
  transactionId: string;
  phoneNumber: string;
}

export interface NewOrderData {
    userId: string;
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;

    total: number;
    shippingAddress: Address;
    deliveryMethod: 'pickup' | 'home-delivery';
    deliveryTimeSlot?: string;
    pickupPointId?: string;
    appliedPromoCode?: PromoCode;
}

export interface TrackingEvent {
    status: OrderStatus;
    date: string; // ISO string
    location: string;
    details: string;
}

export interface Discrepancy {
    reason: string;
    reportedAt: string; // ISO String
    reportedBy: string; // User ID
}

export interface DisputeMessage {
    author: 'admin' | 'seller' | 'customer';
    message: string;
    date: string; // ISO string
    // FIX: Added optional attachmentUrls to match usage in OrderDetailPage.
    attachmentUrls?: string[];
}

export interface StatusChangeLogEntry {
    status: OrderStatus;
    date: string; // ISO string
    changedBy: string; // e.g., 'System', 'Admin: Super Admin', 'Customer'
}

export interface Order extends NewOrderData {
    id: string;
    status: OrderStatus;
    orderDate: string;
    trackingNumber?: string;
    cancellationFee?: number;
    refundReason?: string;
    refundEvidenceUrls?: string[];
    returnId?: string;
    returnRejectionReason?: string;
    trackingHistory: TrackingEvent[];
    agentId?: string;
    storageLocationId?: string;
    checkedInAt?: string; // ISO string
    checkedInBy?: string; // user id of depot agent
    discrepancy?: Discrepancy;
    disputeLog?: DisputeMessage[];
    statusChangeLog?: StatusChangeLogEntry[];
    deliveryFailureReason?: {
        reason: 'client-absent' | 'adresse-erronee' | 'colis-refuse';
        details: string;
        date: string; // ISO String
    };
    // For depot departure traceability
    departureProcessedByAgentId?: string; // ID of the depot agent
    processedForDepartureAt?: string; // ISO string
    // For customer pickup verification
    pickupRecipientName?: string;
    pickupRecipientId?: string;
    proofOfDeliveryUrl?: string;
    signatureUrl?: string;
    paymentDetails?: PaymentDetails;
}

export interface Payout {
  storeId: string;
  amount: number;
  date: string; // ISO String
}

export interface PaymentMethod {
  id: string;
  name: string;
  imageUrl: string;
}

export type Shift = 'Matin' | 'Après-midi' | 'Nuit' | 'Repos';

export interface AgentSchedule {
  [agentId: string]: {
    // Using string for day to be flexible, e.g., 'Lundi', 'Mardi'
    [day: string]: Shift;
  };
}

export interface PickupPoint {
  id: string;
  name: string;
  streetNumber?: string;
  street: string;
  additionalInfo?: string;
  city: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  managerId?: string;
  zoneId?: string; // Add zoneId
  layout?: {
    aisles: number;
    shelves: number;
    locations: number;
  };
  schedule?: AgentSchedule;
}


export type Theme = 'light' | 'dark';

export interface SiteContent {
  slug: string;
  title: string;
  content: string;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string;
}

export interface SellerPlanSettings {
    price: number;
    durationDays: number;
    productLimit: number;
    commissionRate: number;
    photoServiceIncluded: boolean;
    featuredOnHomepage: boolean;
    prioritySupport: boolean;
}

export interface CustomerLoyaltySettings {
    isEnabled: boolean;
    premium: {
        thresholds: {
            orders: number;
            spending: number;
        };
        cautionAmount: number;
        benefits: string[];
    };
    premiumPlus: {
        isEnabled: boolean;
        annualFee: number;
        benefits: string[];
    };
}

export interface SocialLink {
    linkUrl: string;
    iconUrl: string;
}

export interface SiteSettings {
  logoUrl: string;
  bannerUrl?: string;
  companyName: string;
  isStoriesEnabled: boolean;
  requiredSellerDocuments: Record<string, boolean>;
  isRentEnabled: boolean;
  rentAmount: number;
  canSellersCreateCategories: boolean;
  commissionRate: number;
  standardPlan: SellerPlanSettings;
  premiumPlan: SellerPlanSettings;
  superPremiumPlan: SellerPlanSettings;
  customerLoyaltyProgram: CustomerLoyaltySettings;
  deliverySettings: {
    intraUrbanBaseFee: number;
    interUrbanBaseFee: number;
    costPerKg: number;
    premiumDeliveryDiscountPercentage?: number;
  };
  maintenanceMode: {
    isEnabled: boolean;
    message: string;
    reopenDate: string; // ISO String
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImageUrl: string;
  };
  socialLinks: {
    facebook: SocialLink;
    twitter: SocialLink;
    instagram: SocialLink;
  };
  emailTemplates?: EmailTemplate[];
  isChatEnabled: boolean;
  isComparisonEnabled: boolean;
}

export interface SiteActivityLog {
  id:string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    role: UserRole;
  };
  action: string;
  details: string;
}

export type ProductSortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating-desc' | 'newest-desc';

export interface ProductFiltersState {
  sort: ProductSortOption;
  priceMin?: number;
  priceMax?: number;
  vendors: string[];
  brands: string[];
  minRating: number;
  key?: number; // Used to force-reset the filters component
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string; // The original, uncensored text
  censoredText?: string; // The censored version, for the receiver
  timestamp: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  participantIds: [string, string]; // [customerId, sellerId]
  participantNames: { [key: string]: string }; // { 'user-id': 'UserName' }
  productContext?: {
    id: string;
    name: string;
    imageUrl: string;
  };
  sellerStoreInfo?: {
    physicalAddress: string;
    location: string; // city
    neighborhood: string;
  };
  lastMessageTimestamp: string;
  unreadCount: { [key: string]: number }; // Unread count for each user
}

export interface Advertisement {
  id: string;
  imageUrl: string;
  linkUrl: string;
  location: 'homepage-banner';
  isActive: boolean;
}

export interface TicketMessage {
  authorId: string;
  authorName: string;
  message: string;
  date: string; // ISO string
  attachmentUrls?: string[]; // URLs of attached files
}

export type TicketStatus = 'Ouvert' | 'En cours' | 'Résolu';
export type TicketPriority = 'Basse' | 'Moyenne' | 'Haute';

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  relatedOrderId?: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  messages: TicketMessage[];
  type?: 'support' | 'service_request';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target: 'all' | 'customers' | 'sellers';
  startDate: string; // ISO string date
  endDate: string; // ISO string date
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  link?: {
    page: Page;
    params?: Record<string, any>;
  };
  isRead: boolean;
  timestamp: string; // ISO string
}

export interface PaymentRequest {
  amount: number;
  reason: string;
  onSuccess: (details: PaymentDetails) => void;
}

export type Page = 'home' | 'product' | 'cart' | 'checkout' | 'order-success' | 'stores' | 'stores-map' | 'become-seller' | 'become-service-provider' | 'category' | 'seller-dashboard' | 'vendor-page' | 'product-form' | 'seller-profile' | 'superadmin-dashboard' | 'order-history' | 'order-detail' | 'promotions' | 'flash-sales' | 'search-results' | 'wishlist' | 'delivery-agent-dashboard' | 'depot-agent-dashboard' | 'comparison' | 'become-premium' | 'info' | 'not-found' | 'forbidden' | 'server-error' | 'reset-password' | 'account' | 'seller-analytics-dashboard' | 'visual-search' | 'seller-subscription' | 'services';