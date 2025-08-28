export interface Review {
  author: string;
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
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
  status: 'published' | 'draft';
  shippingCost?: number;
  
  // Generic / Shared fields
  brand?: string;
  weight?: string; // e.g. "500g", "1kg"
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
}

export interface Store {
  id: string;
  name: string;
  logoUrl: string;
  category: string;
  warnings: Warning[];
  status: 'active' | 'suspended' | 'pending';
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
  premiumStatus: 'standard' | 'premium';
}

export type UserRole = 'customer' | 'seller' | 'superadmin' | 'delivery_agent' | 'depot_agent';

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
}

export interface Address {
    id?: string;
    isDefault?: boolean;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
}

export type OrderStatus = 'confirmed' | 'ready-for-pickup' | 'picked-up' | 'at-depot' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'refund-requested' | 'refunded' | 'returned' | 'depot-issue' | 'delivery-failed';

export interface PromoCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  validUntil?: string; // ISO Date string
  maxUses?: number;
  sellerId: string; // To link the code to a specific seller
  uses: number; // To track how many times it has been used
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
}

export interface Payout {
  storeId: string;
  amount: number;
  date: string; // ISO String
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
}


export type Theme = 'light' | 'dark';

export interface SiteContent {
  slug: string;
  title: string;
  content: string;
}

export interface SiteSettings {
  logoUrl: string;
  isStoriesEnabled: boolean;
  isPremiumProgramEnabled: boolean;
  premiumThresholds: {
    orders: number;
    spending: number;
  };
  premiumCautionAmount: number;
  isPremiumPlusEnabled: boolean;
  premiumPlusAnnualFee: number;
  requiredSellerDocuments: Record<string, boolean>;
  isRentEnabled: boolean;
  rentAmount: number;
  canSellersCreateCategories: boolean;
  maintenanceMode: {
    isEnabled: boolean;
    message: string;
    reopenDate: string; // ISO String
  };
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