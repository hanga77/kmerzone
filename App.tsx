import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SellerDashboard } from './components/SellerDashboard';
import { SellerAnalyticsDashboard } from './components/SellerAnalyticsDashboard';
import { DeliveryAgentDashboard } from './components/DeliveryAgentDashboard';
import { DepotAgentDashboard } from './components/DepotAgentDashboard';
import { XIcon } from './components/Icons';
import { usePersistentState } from './hooks/usePersistentState';
import { useAuth } from './contexts/AuthContext';
import { useComparison } from './contexts/ComparisonContext';
import { useUI } from './contexts/UIContext';
import { useCart } from './contexts/CartContext';
import { useWishlist } from './contexts/WishlistContext';
import { initialCategories, initialProducts, sampleDeliveredOrder, sampleDeliveredOrder2, sampleDeliveredOrder3, initialStores, initialFlashSales, initialPickupPoints, initialSiteSettings, initialSiteContent, initialAdvertisements, initialPaymentMethods, sampleNewMissionOrder, initialShippingPartners } from './constants';
import type { Product, Category, Store, Review, Order, OrderStatus, User, SiteActivityLog, FlashSale, PickupPoint, NewOrderData, PromoCode, Warning, SiteSettings, UserAvailabilityStatus, DisputeMessage, StatusChangeLogEntry, FlashSaleProduct, RequestedDocument, SiteContent, Ticket, TicketMessage, TicketStatus, TicketPriority, Announcement, PaymentMethod, Page, Notification, ProductCollection, Payout, Advertisement, Story, CartItem, ShippingPartner, ShippingSettings, UserRole, PaymentRequest, PaymentDetails } from './types';
import { Header } from './components/Header';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import Footer from './components/Footer';
import ForbiddenPage from './components/ForbiddenPage';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import LoginModal from './components/LoginModal';
import ResetPasswordPage from './components/ResetPasswordPage';
import AccountPage from './components/AccountPage';
import CategoryPage from './components/CategoryPage';
import FlashSalesPage from './components/FlashSalesPage';
import HomePage from './components/HomePage';
import MaintenancePage from './components/MaintenancePage';
import NotFoundPage from './components/NotFoundPage';
import OrderDetailPage from './components/OrderDetailPage';
import OrderHistoryPage from './components/OrderHistoryPage';
import OrderSuccess from './components/OrderSuccess';
import ProductDetail from './components/ProductDetail';
import ProductForm from './components/ProductForm';
import PromotionsPage from './components/PromotionsPage';
import PromotionModal from './components/PromotionModal';
import ServerErrorPage from './components/ServerErrorPage';
import VisualSearchPage from './components/VisualSearchPage';
import VendorPage from './components/VendorPage';
import WishlistPage from './components/WishlistPage';
import ChatWidget from './components/ChatWidget';
import CartView from './components/CartView';
import AddToCartModal from './components/AddToCartModal';
import SellerProfile from './components/SellerProfile';
import StoresPage from './components/StoresPage';
import BecomeSeller from './components/BecomeSeller';
import BecomePremiumPage from './components/BecomePremiumPage';
import Checkout from './components/Checkout';
import SearchResultsPage from './components/SearchResultsPage';
import SellerSubscriptionPage from './components/SellerSubscriptionPage';
import PaymentModal from './components/PaymentModal';
import {
    ComparisonPage, ComparisonBar, InfoPage,
    StoryViewer,
    StoresMapPage
} from './components/ComponentStubs';

const updateMetaTag = (name: string, content: string, isProperty: boolean = false) => {
  const selector = isProperty ? `meta[property='${name}']` : `meta[name='${name}']`;
  let element = document.head.querySelector(selector) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    if (isProperty) element.setAttribute('property', name);
    else element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.content = content;
};

const AnnouncementBanner: React.FC<{
  announcement: Announcement;
  onDismiss: (id: string) => void;
}> = ({ announcement, onDismiss }) => {
  return (
    <div className="bg-kmer-yellow text-gray-900 p-3 text-center relative font-semibold text-sm">
      <p>
        <strong className="font-bold uppercase">{announcement.title}:</strong> {announcement.content}
      </p>
      <button onClick={() => onDismiss(announcement.id)} className="absolute top-1/2 right-4 -translate-y-1/2">
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};


export default function App() {
  const [page, setPage] = usePersistentState<Page>('currentPage', 'home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingStoriesOfStore, setViewingStoriesOfStore] = useState<Store | null>(null);
  const [infoPageContent, setInfoPageContent] = useState({ title: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [siteSettings, setSiteSettings] = usePersistentState<SiteSettings>('siteSettings', initialSiteSettings);
  const [siteContent, setSiteContent] = usePersistentState<SiteContent[]>('siteContent', initialSiteContent);
  const [activeAccountTab, setActiveAccountTab] = useState('profile');
  const [recentlyViewedIds, setRecentlyViewedIds] = usePersistentState<string[]>('recentlyViewed', []);
  const [initialSellerTab, setInitialSellerTab] = useState('overview');

  const [allProducts, setAllProducts] = usePersistentState<Product[]>('allProducts', initialProducts);
  const [allCategories, setAllCategories] = usePersistentState<Category[]>('allCategories', initialCategories);
  const [allStores, setAllStores] = usePersistentState<Store[]>('allStores', initialStores);
  const [allOrders, setAllOrders] = usePersistentState<Order[]>('allOrders', [sampleDeliveredOrder, sampleDeliveredOrder2, sampleDeliveredOrder3, sampleNewMissionOrder]);
  const [allPromoCodes, setAllPromoCodes] = usePersistentState<PromoCode[]>('allPromoCodes', []);
  const [siteActivityLogs, setSiteActivityLogs] = usePersistentState<SiteActivityLog[]>('siteActivityLogs', []);
  const [flashSales, setFlashSales] = usePersistentState<FlashSale[]>('flashSales', initialFlashSales);
  const [allPickupPoints, setAllPickupPoints] = usePersistentState<PickupPoint[]>('allPickupPoints', initialPickupPoints);
  const [payouts, setPayouts] = usePersistentState<Payout[]>('payouts', []);
  const [advertisements, setAdvertisements] = usePersistentState<Advertisement[]>('advertisements', initialAdvertisements);
  const [allTickets, setAllTickets] = usePersistentState<Ticket[]>('allTickets', []);
  const [allAnnouncements, setAllAnnouncements] = usePersistentState<Announcement[]>('allAnnouncements', []);
  const [allNotifications, setAllNotifications] = usePersistentState<Notification[]>('allNotifications', []);
  const [dismissedAnnouncements, setDismissedAnnouncements] = usePersistentState<string[]>('dismissedAnnouncements', []);
  const [paymentMethods, setPaymentMethods] = usePersistentState<PaymentMethod[]>('paymentMethods', initialPaymentMethods);
  const [allShippingPartners, setAllShippingPartners] = usePersistentState<ShippingPartner[]>('allShippingPartners', initialShippingPartners);
  
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  const { user, logout: authLogout, allUsers, setAllUsers, updateUser, resetPassword, login, register } = useAuth();
  const { isModalOpen, modalProduct, closeModal: uiCloseModal } = useUI();
  const { cart, clearCart, addToCart, onApplyPromoCode, appliedPromoCode } = useCart();
  const { comparisonList, setProducts: setComparisonProducts } = useComparison();
  const { wishlist } = useWishlist();
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [promotionModalProduct, setPromotionModalProduct] = useState<Product | null>(null);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [emailForPasswordReset, setEmailForPasswordReset] = useState<string | null>(null);
  const [isLoginRedirecting, setIsLoginRedirecting] = useState(false);
  
  const [isChatEnabled, setIsChatEnabled] = usePersistentState('isChatEnabled', true);
  const [isComparisonEnabled, setIsComparisonEnabled] = usePersistentState('isComparisonEnabled', true);

  const visibleProducts = useMemo(() => {
    const activeStoreNames = new Set(allStores.filter(s => s.status === 'active').map(s => s.name));
    return allProducts.filter(p => activeStoreNames.has(p.vendor) && p.status === 'published');
  }, [allProducts, allStores]);

  useEffect(() => { setComparisonProducts(allProducts); }, [allProducts, setComparisonProducts]);
  
  useEffect(() => {
    let { metaTitle: title, metaDescription: description, ogImageUrl } = siteSettings.seo;
    switch(page) {
      case 'product': if (selectedProduct) { title = `${selectedProduct.name} | KMER ZONE`; description = selectedProduct.description.substring(0, 160); ogImageUrl = selectedProduct.imageUrls[0] || ogImageUrl; } break;
      case 'category': const category = allCategories.find(c => c.id === selectedCategoryId); if (category) { title = `${category.name} | KMER ZONE`; ogImageUrl = category.imageUrl || ogImageUrl; } break;
      case 'vendor-page': const store = allStores.find(s => s.name === selectedVendor); if (store) { title = `Boutique ${store.name} | KMER ZONE`; ogImageUrl = store.logoUrl || ogImageUrl; } break;
    }
    document.title = title;
    updateMetaTag('description', description);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', ogImageUrl, true);
  }, [page, selectedProduct, selectedCategoryId, selectedVendor, allCategories, allStores, siteSettings.seo]);

  useEffect(() => {
    if (user && isLoginRedirecting) {
        const roleToPage: { [key in UserRole]?: Page } = {
            seller: 'seller-dashboard',
            superadmin: 'superadmin-dashboard',
            delivery_agent: 'delivery-agent-dashboard',
            depot_agent: 'depot-agent-dashboard',
        };
        const targetPage = roleToPage[user.role];
        if (targetPage) {
            setPage(targetPage);
        }
        setIsLoginRedirecting(false); // Reset the flag
    }
  }, [user, isLoginRedirecting, setPage]);

  const logActivity = useCallback((action: string, details: string) => {
    if (!user) return;
    const newLog: SiteActivityLog = { id: Date.now().toString(), timestamp: new Date().toISOString(), user: { id: user.id, name: user.name, role: user.role }, action, details };
    setSiteActivityLogs(prev => [newLog, ...prev].slice(0, 100));
  }, [user, setSiteActivityLogs]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = { ...notification, id: `notif_${Date.now()}`, timestamp: new Date().toISOString() };
    setAllNotifications(prev => [newNotification, ...prev]);
  }, [setAllNotifications]);

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const orderToUpdate = allOrders.find(o => o.id === orderId);

    const statusChangeLogEntry: StatusChangeLogEntry = {
        status,
        date: new Date().toISOString(),
        changedBy: user ? `${user.role}:${user.name}` : 'System'
    };

    setAllOrders(os => os.map(o => {
        if (o.id === orderId) {
            return { 
                ...o, 
                status,
                statusChangeLog: [...(o.statusChangeLog || []), statusChangeLogEntry]
            };
        }
        return o;
    }));

    if (orderToUpdate && status === 'ready-for-pickup') {
        if (orderToUpdate.agentId) {
            addNotification({
                userId: orderToUpdate.agentId,
                message: `La commande #${orderToUpdate.id} est prête pour l'enlèvement chez ${orderToUpdate.items[0]?.vendor}.`,
                link: { page: 'delivery-agent-dashboard' },
                isRead: false
            });
        }
        const superadmins = allUsers.filter(u => u.role === 'superadmin');
        superadmins.forEach(admin => {
            addNotification({
                userId: admin.id,
                message: `La commande #${orderToUpdate.id} a été marquée comme "Prête pour enlèvement" par le vendeur.`,
                link: { page: 'superadmin-dashboard' },
                isRead: false
            });
        });
    }
};

  const handleNavigateHome = useCallback(() => setPage('home'), [setPage]);
  const handleProductClick = useCallback((product: Product) => { setSelectedProduct(product); setPage('product'); }, [setPage]);
  const handleCategoryClick = useCallback((categoryId: string) => { setSelectedCategoryId(categoryId); setPage('category'); }, [setPage]);
  const handleVendorClick = useCallback((vendorName: string) => { setSelectedVendor(vendorName); setPage('vendor-page'); }, [setPage]);
  const handleSearch = (query: string) => { setSearchQuery(query); setPage('search-results'); };

  const handleCreateOrder = (orderData: NewOrderData) => {
    const paymentRequest: PaymentRequest = {
      amount: orderData.total,
      reason: `Paiement pour votre commande de ${orderData.items.length} article(s).`,
      onSuccess: (paymentDetails) => {
        const newOrder: Order = {
          ...orderData,
          id: `ORDER-${Date.now()}`,
          status: 'confirmed',
          orderDate: new Date().toISOString(),
          trackingNumber: `KZ${Date.now()}`,
          trackingHistory: [{ status: 'confirmed', date: new Date().toISOString(), location: 'Système', details: 'Commande confirmée' }],
          paymentDetails,
        };
        setAllOrders(prev => [newOrder, ...prev]);
        setSelectedOrder(newOrder);
        clearCart();
        setPage('order-success');
        setPaymentRequest(null);
      }
    };
    setPaymentRequest(paymentRequest);
  };
  
  const handleSaveProduct = (productData: Product) => {
    setAllProducts(prev => {
        const index = prev.findIndex(p => p.id === productData.id);
        if (index > -1) {
            const updated = [...prev];
            updated[index] = productData;
            return updated;
        }
        return [...prev, productData];
    });
    logActivity('Product Saved', `Product "${productData.name}" was saved.`);
    setPage('seller-dashboard');
    setProductToEdit(null);
  };

  const handleUpdateShippingSettings = useCallback((storeId: string, settings: ShippingSettings) => {
    setAllStores(prev => prev.map(store => store.id === storeId ? { ...store, shippingSettings: settings } : store));
    logActivity('Store Settings Updated', `Shipping settings updated for store ID ${storeId}`);
  }, [setAllStores, logActivity]);

  const handleOpenAccountPage = (tab: string = 'dashboard') => {
      setActiveAccountTab(tab);
      setPage('account');
  };

  const handleBecomePremiumByCaution = () => {
    if (!user) return;
    const request: PaymentRequest = {
        amount: siteSettings.premiumCautionAmount,
        reason: "Paiement de la caution pour le statut Client Premium",
        onSuccess: (paymentDetails) => {
            setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, loyalty: { ...u.loyalty, status: 'premium', premiumStatusMethod: 'deposit' } } : u));
            logActivity('User Upgraded', `User ${user.name} became Premium via caution.`);
            handleOpenAccountPage('dashboard');
            setPaymentRequest(null);
        }
    };
    setPaymentRequest(request);
  };

  const handleUpgradeToPremiumPlus = () => {
    if (!user) return;
     const request: PaymentRequest = {
        amount: siteSettings.premiumPlusAnnualFee,
        reason: "Paiement de l'abonnement annuel Client Premium+",
        onSuccess: (paymentDetails) => {
            setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, loyalty: { ...u.loyalty, status: 'premium_plus', premiumStatusMethod: 'subscription' } } : u));
            logActivity('User Upgraded', `User ${user.name} upgraded to Premium Plus.`);
            handleOpenAccountPage('dashboard');
            setPaymentRequest(null);
        }
    };
    setPaymentRequest(request);
  };

  const handleCheckIn = (orderId: string, storageLocationId: string, notes?: string) => {
    setAllOrders(prev => prev.map(o => {
        if (o.id === orderId) {
            const updates: Partial<Order> = {
                status: notes ? 'depot-issue' : 'at-depot',
                storageLocationId,
                checkedInAt: new Date().toISOString(),
                checkedInBy: user?.id,
            };
            if (notes) {
                updates.discrepancy = {
                    reason: notes,
                    reportedAt: new Date().toISOString(),
                    reportedBy: user!.id,
                };
            }
            return { ...o, ...updates };
        }
        return o;
    }));
    logActivity('Package Check-in', `Order ${orderId} checked into depot location ${storageLocationId}.`);
  };

  const handleReportDiscrepancy = (orderId: string, reason: string) => {
      setAllOrders(prev => prev.map(o => {
          if (o.id === orderId) {
              return {
                  ...o,
                  status: 'depot-issue',
                  discrepancy: {
                      reason,
                      reportedAt: new Date().toISOString(),
                      reportedBy: user!.id,
                  }
              };
          }
          return o;
      }));
      logActivity('Package Discrepancy', `Discrepancy reported for order ${orderId}: ${reason}`);
  };

  const handleProcessDeparture = (orderId: string, recipientInfo?: { name: string; idNumber: string }) => {
      setAllOrders(prev => prev.map(o => {
          if (o.id === orderId) {
              const updates: Partial<Order> = {
                  status: o.deliveryMethod === 'pickup' ? 'delivered' : 'out-for-delivery',
                  departureProcessedByAgentId: user?.id,
                  processedForDepartureAt: new Date().toISOString(),
              };
              if (recipientInfo) {
                  updates.pickupRecipientName = recipientInfo.name;
                  updates.pickupRecipientId = recipientInfo.idNumber;
              }
              return { ...o, ...updates };
          }
          return o;
      }));
      logActivity('Package Departure', `Order ${orderId} processed for departure from depot.`);
  };
  
  const handleSelectSubscription = (status: 'standard' | 'premium' | 'super_premium') => {
    if (!user) return;
    const storeToUpdate = allStores.find(s => s.sellerId === user.id);
    if (!storeToUpdate) return;

    const completeSubscription = (paymentDetails?: PaymentDetails) => {
        const requiresValidation = status === 'premium' || status === 'super_premium';
        setAllStores(prevStores => 
            prevStores.map(store => 
                store.id === storeToUpdate.id ? { 
                    ...store, 
                    premiumStatus: status,
                    status: requiresValidation ? 'pending' : 'active',
                } : store
            )
        );
        logActivity('Seller Subscription Choice', `Seller ${user.name} chose ${status}. Payment: ${paymentDetails ? 'Success' : 'N/A'}`);
        
        if (requiresValidation) {
            const admin = allUsers.find(u => u.role === 'superadmin');
            if (admin) {
                addNotification({
                    userId: admin.id,
                    message: `La boutique "${storeToUpdate.name}" a payé un abonnement ${status} et attend votre validation.`,
                    link: { page: 'superadmin-dashboard' },
                    isRead: false
                });
            }
            alert("Votre paiement a été reçu. Un administrateur validera bientôt votre boutique. Merci !");
        } else {
            alert("Félicitations ! Votre boutique est maintenant active avec le plan Standard.");
        }
        setPage('seller-dashboard');
        setPaymentRequest(null);
    };

    if (status === 'standard') {
        completeSubscription();
    } else {
        const plan = status === 'premium' ? siteSettings.premiumPlan : siteSettings.superPremiumPlan;
        const request: PaymentRequest = {
            amount: plan.price,
            reason: `Abonnement Vendeur ${status.replace('_', ' ')}`,
            onSuccess: (paymentDetails) => completeSubscription(paymentDetails)
        };
        setPaymentRequest(request);
    }
  };

  const handleRequestPremiumUpgrade = (storeId: string, level: 'premium' | 'super_premium') => {
    const plan = level === 'premium' ? siteSettings.premiumPlan : siteSettings.superPremiumPlan;
    const request: PaymentRequest = {
      amount: plan.price,
      reason: `Mise à niveau vers le statut ${level.replace('_', ' ')}`,
      onSuccess: (paymentDetails) => {
        setAllStores(prev => prev.map(s => {
          if (s.id === storeId) {
            addNotification({
              userId: s.sellerId,
              message: `Félicitations ! Votre boutique "${s.name}" a été mise à niveau vers ${level.replace('_', ' ')}.`,
              link: { page: 'seller-dashboard', params: { tab: 'overview' } },
              isRead: false,
            });
            return { ...s, premiumStatus: level };
          }
          return s;
        }));
        setPaymentRequest(null);
      }
    };
    setPaymentRequest(request);
  };

  const handleApproveStore = (storeToApprove: Store) => {
    setAllStores(prevStores =>
        prevStores.map(s =>
            s.id === storeToApprove.id ? { ...s, status: 'active' } : s
        )
    );
    addNotification({
        userId: storeToApprove.sellerId,
        message: `Félicitations ! Votre boutique "${storeToApprove.name}" a été approuvée et est maintenant en ligne.`,
        link: { page: 'seller-dashboard' },
        isRead: false
    });
    logActivity('Store Approved', `Store "${storeToApprove.name}" has been approved.`);
  };

  const handleRejectStore = (storeToReject: Store) => {
      const reason = prompt(`Veuillez fournir un motif pour le rejet de la boutique "${storeToReject.name}":`);
      if (reason) {
          // In a real app, you might just mark it as rejected instead of removing it
          setAllStores(prevStores => prevStores.filter(s => s.id !== storeToReject.id));
          
          addNotification({
              userId: storeToReject.sellerId,
              message: `Votre demande d'inscription pour la boutique "${storeToReject.name}" a été rejetée. Motif : ${reason}`,
              isRead: false
          });
          logActivity('Store Rejected', `Store "${storeToReject.name}" was rejected. Reason: ${reason}`);
      }
  };

  const renderPage = () => {
    const store = user?.shopName ? allStores.find(s => s.name === user.shopName) : undefined;
    const sellerProducts = store ? allProducts.filter(p => p.vendor === store.name) : [];
    const sellerOrders = store ? allOrders.filter(o => o.items.some(i => i.vendor === store.name)) : [];
    const userOrders = user ? allOrders.filter(o => o.userId === user.id) : [];

    if (siteSettings.maintenanceMode.isEnabled && user?.role !== 'superadmin') {
      return <MaintenancePage message={siteSettings.maintenanceMode.message} reopenDate={siteSettings.maintenanceMode.reopenDate} />;
    }
    
    switch (page) {
      case 'home': return <HomePage products={visibleProducts} categories={allCategories} stores={allStores} flashSales={flashSales} advertisements={advertisements} onProductClick={handleProductClick} onCategoryClick={handleCategoryClick} onVendorClick={handleVendorClick} onVisitStore={handleVendorClick} onViewStories={(s) => setViewingStoriesOfStore(s)} isComparisonEnabled={isComparisonEnabled} isStoriesEnabled={siteSettings.isStoriesEnabled} recentlyViewedIds={recentlyViewedIds} userOrders={userOrders} wishlist={wishlist}/>;
      case 'product': return selectedProduct ? <ProductDetail product={selectedProduct} allProducts={allProducts} allUsers={allUsers} stores={allStores} flashSales={flashSales} onBack={() => setPage('home')} onAddReview={(pId, rev) => setAllProducts(ps => ps.map(p => p.id === pId ? {...p, reviews: [...p.reviews, rev]} : p))} onVendorClick={handleVendorClick} onProductClick={handleProductClick} onOpenLogin={() => setIsLoginModalOpen(true)} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onProductView={(pId) => setRecentlyViewedIds(ids => [pId, ...ids.filter(id => id !== pId)].slice(0, 10))} /> : <NotFoundPage onNavigateHome={handleNavigateHome} />;
      case 'category': return selectedCategoryId ? <CategoryPage categoryId={selectedCategoryId} allCategories={allCategories} allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={handleNavigateHome} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={handleNavigateHome} />;
      case 'vendor-page': return selectedVendor ? <VendorPage vendorName={selectedVendor} allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={handleNavigateHome} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={handleNavigateHome} />;
      case 'stores': return <StoresPage stores={allStores.filter(s => s.status === 'active')} onBack={handleNavigateHome} onVisitStore={handleVendorClick} onNavigateToStoresMap={() => setPage('stores-map')} />;
      case 'stores-map': return <StoresMapPage stores={allStores} onBack={() => setPage('stores')} onStoreClick={(storeName: string) => {setSelectedVendor(storeName); setPage('vendor-page')}} />;
      case 'promotions': return <PromotionsPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={handleNavigateHome} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
      case 'flash-sales': return <FlashSalesPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={handleNavigateHome} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
      case 'search-results': return <SearchResultsPage searchQuery={searchQuery} products={visibleProducts} stores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={handleNavigateHome} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
      case 'wishlist': return <WishlistPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={handleNavigateHome} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
      case 'cart': return <CartView onBack={handleNavigateHome} onNavigateToCheckout={() => setPage('checkout')} flashSales={flashSales} allPromoCodes={allPromoCodes} appliedPromoCode={appliedPromoCode} onApplyPromoCode={onApplyPromoCode} />;
      case 'checkout': return <Checkout onBack={() => setPage('cart')} onOrderConfirm={handleCreateOrder} flashSales={flashSales} allPickupPoints={allPickupPoints} allStores={allStores} appliedPromoCode={appliedPromoCode} siteSettings={siteSettings} paymentMethods={paymentMethods} />;
      case 'order-success': return selectedOrder ? <OrderSuccess order={selectedOrder} onNavigateHome={handleNavigateHome} onNavigateToOrders={() => setPage('order-history')} /> : <HomePage products={visibleProducts} categories={allCategories} stores={allStores} flashSales={flashSales} advertisements={advertisements} onProductClick={handleProductClick} onCategoryClick={handleCategoryClick} onVendorClick={handleVendorClick} onVisitStore={handleVendorClick} onViewStories={(s) => setViewingStoriesOfStore(s)} isComparisonEnabled={isComparisonEnabled} isStoriesEnabled={siteSettings.isStoriesEnabled} recentlyViewedIds={recentlyViewedIds} userOrders={userOrders} wishlist={wishlist}/>;
      case 'order-history': return <OrderHistoryPage userOrders={userOrders} onBack={handleNavigateHome} onSelectOrder={(order) => { setSelectedOrder(order); setPage('order-detail'); }} onRepeatOrder={(order) => order.items.forEach(item => addToCart(item, item.quantity, item.selectedVariant, {suppressModal: true}))} />;
      case 'order-detail': return selectedOrder ? <OrderDetailPage order={selectedOrder} onBack={() => setPage('order-history')} allPickupPoints={allPickupPoints} allUsers={allUsers} onCancelOrder={(orderId) => setAllOrders(os => os.map(o => o.id === orderId ? {...o, status: 'cancelled'} : o))} onRequestRefund={(orderId, reason, evidence) => setAllOrders(os => os.map(o => o.id === orderId ? {...o, status: 'refund-requested', refundReason: reason, refundEvidenceUrls: evidence} : o))} onCustomerDisputeMessage={(oId, msg) => {}} /> : <NotFoundPage onNavigateHome={handleNavigateHome} />;
      case 'become-seller': return <BecomeSeller onBack={handleNavigateHome} onBecomeSeller={(...args) => { const newStore: Store = { id: `store-${Date.now()}`, sellerId: user!.id, name: args[0], logoUrl: args[7], category: 'Non catégorisé', warnings: [], status: 'pending' as const, location: args[1], neighborhood: args[2], sellerFirstName: args[3], sellerLastName: args[4], sellerPhone: args[5], physicalAddress: args[6], documents: [], latitude: args[8], longitude: args[9], premiumStatus: 'standard' as const}; setAllStores(s => [...s, newStore]); updateUser({shopName: args[0]}); }} onRegistrationSuccess={() => { logActivity('New Seller Registration', 'A new seller has registered.'); setPage('seller-subscription'); }} siteSettings={siteSettings} />;
      case 'become-premium': return user ? <BecomePremiumPage siteSettings={siteSettings} onBack={handleNavigateHome} onBecomePremiumByCaution={handleBecomePremiumByCaution} onUpgradeToPremiumPlus={handleUpgradeToPremiumPlus} /> : <ForbiddenPage onNavigateHome={handleNavigateHome} />;
      case 'seller-subscription': return <SellerSubscriptionPage siteSettings={siteSettings} onSelectSubscription={handleSelectSubscription} />;
      case 'seller-dashboard': return user?.role === 'seller' ? <SellerDashboard store={store} products={sellerProducts} categories={allCategories} flashSales={flashSales} sellerOrders={sellerOrders} promoCodes={allPromoCodes.filter(pc => pc.sellerId === user?.id)} allTickets={allTickets} onBack={handleNavigateHome} onAddProduct={() => { setProductToEdit(null); setPage('product-form'); }} onEditProduct={(p) => { setProductToEdit(p); setPage('product-form'); }} onDeleteProduct={(pId) => setAllProducts(ps => ps.filter(p => p.id !== pId))} onUpdateProductStatus={(pId, status) => setAllProducts(ps => ps.map(p => p.id === pId ? {...p, status} : p))} onNavigateToProfile={() => setPage('seller-profile')} onNavigateToAnalytics={() => setPage('seller-analytics-dashboard')} onSetPromotion={(p) => setPromotionModalProduct(p)} onRemovePromotion={(pId) => setAllProducts(ps => ps.map(p => p.id === pId ? {...p, promotionPrice: undefined} : p))} onProposeForFlashSale={(fsId, pId, fPrice, sName) => setFlashSales(fss => fss.map(fs => fs.id === fsId ? {...fs, products: [...fs.products, {productId: pId, flashPrice: fPrice, sellerShopName: sName, status: 'pending'}]} : fs))} onUploadDocument={(sId, docName, fileUrl) => setAllStores(ss => ss.map(s => s.id === sId ? {...s, documents: s.documents.map(d => d.name === docName ? {...d, status: 'uploaded', fileUrl} : d)} : s))} onUpdateOrderStatus={handleUpdateOrderStatus} onCreatePromoCode={(code) => setAllPromoCodes(pcs => [...pcs, {...code, uses: 0}])} onDeletePromoCode={(code) => setAllPromoCodes(pcs => pcs.filter(pc => pc.code !== code))} isChatEnabled={isChatEnabled} onPayRent={()=>{}} siteSettings={siteSettings} onAddStory={(sId, img) => setAllStores(ss => ss.map(s => s.id === sId ? {...s, stories: [...(s.stories || []), {id: `story-${Date.now()}`, imageUrl: img, createdAt: new Date().toISOString()}]} : s))} onDeleteStory={(sId, storyId) => setAllStores(ss => ss.map(s => s.id === sId ? {...s, stories: s.stories?.filter(st => st.id !== storyId)} : s))} payouts={payouts.filter(p => p.storeId === store?.id)} onSellerDisputeMessage={() => {}} onBulkUpdateProducts={() => {}} onReplyToReview={()=>{}} onCreateOrUpdateCollection={()=>{}} onDeleteCollection={()=>{}} initialTab={initialSellerTab} sellerNotifications={allNotifications.filter(n => n.userId === user.id)} onMarkNotificationAsRead={(id) => setAllNotifications(ns => ns.map(n => n.id === id ? {...n, isRead: true} : n))} onNavigateFromNotification={(link) => {if(link?.page) { setPage(link.page); if (link.page === 'order-detail') setSelectedOrder(allOrders.find(o => o.id === link.params?.orderId) || null); if (link.page === 'seller-dashboard') setInitialSellerTab(link.params?.tab || 'overview');}}} onCreateTicket={() => {}} allShippingPartners={allShippingPartners} onUpdateShippingSettings={handleUpdateShippingSettings} onRequestUpgrade={handleRequestPremiumUpgrade} /> : <ForbiddenPage onNavigateHome={handleNavigateHome} />;
      case 'seller-profile': return store ? <SellerProfile store={store} onBack={() => setPage('seller-dashboard')} onUpdateProfile={(sId, data) => setAllStores(ss => ss.map(s => s.id === sId ? {...s, ...data} : s))} /> : <ForbiddenPage onNavigateHome={handleNavigateHome} />;
      case 'product-form': return <ProductForm onSave={handleSaveProduct} onCancel={() => setPage('seller-dashboard')} productToEdit={productToEdit} categories={allCategories} onAddCategory={(name) => { const newCat = {id: `cat-${Date.now()}`, name, imageUrl: ''}; setAllCategories(c => [...c, newCat]); return newCat; }} siteSettings={siteSettings}/>;
      case 'seller-analytics-dashboard': return user?.role === 'seller' ? <SellerAnalyticsDashboard onBack={() => setPage('seller-dashboard')} sellerOrders={sellerOrders} sellerProducts={sellerProducts} flashSales={flashSales} /> : <ForbiddenPage onNavigateHome={handleNavigateHome} />;
      case 'superadmin-dashboard': return user?.role === 'superadmin' ? <SuperAdminDashboard allUsers={allUsers} allOrders={allOrders} allCategories={allCategories} allStores={allStores} allProducts={allProducts} siteActivityLogs={siteActivityLogs} onUpdateOrderStatus={(order, status) => {}} onUpdateCategoryImage={() => {}} onWarnStore={() => {}} onToggleStoreStatus={() => {}} onApproveStore={handleApproveStore} onRejectStore={handleRejectStore} onSaveFlashSale={() => {}} flashSales={flashSales} onUpdateFlashSaleSubmissionStatus={() => {}} onBatchUpdateFlashSaleStatus={() => {}} onRequestDocument={() => {}} onVerifyDocumentStatus={() => {}} allPickupPoints={allPickupPoints} onAddPickupPoint={() => {}} onUpdatePickupPoint={() => {}} onDeletePickupPoint={() => {}} onAssignAgent={() => {}} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onToggleChatFeature={() => setIsChatEnabled(prev => !prev)} onToggleComparisonFeature={() => setIsComparisonEnabled(prev => !prev)} siteSettings={siteSettings} onUpdateSiteSettings={setSiteSettings} onAdminAddCategory={() => {}} onAdminDeleteCategory={() => {}} onUpdateUser={(userId, updates) => setAllUsers(users => users.map(u => u.id === userId ? {...u, ...updates} : u))} payouts={payouts} onPayoutSeller={() => {}} advertisements={advertisements} onAddAdvertisement={() => {}} onUpdateAdvertisement={() => {}} onDeleteAdvertisement={() => {}} onCreateUserByAdmin={() => {}} onSanctionAgent={() => {}} onResolveRefund={() => {}} onAdminStoreMessage={() => {}} onAdminCustomerMessage={() => {}} siteContent={siteContent} onUpdateSiteContent={setSiteContent} allTickets={allTickets} allAnnouncements={allAnnouncements} onAdminReplyToTicket={() => {}} onAdminUpdateTicketStatus={() => {}} onCreateOrUpdateAnnouncement={() => {}} onDeleteAnnouncement={() => {}} onReviewModeration={() => {}} paymentMethods={paymentMethods} onUpdatePaymentMethods={setPaymentMethods} /> : <ForbiddenPage onNavigateHome={handleNavigateHome} />;
      case 'delivery-agent-dashboard': return user?.role === 'delivery_agent' ? <DeliveryAgentDashboard allOrders={allOrders} allStores={allStores} allPickupPoints={allPickupPoints} onUpdateOrder={(oId, updates) => setAllOrders(os => os.map(o => o.id === oId ? {...o, ...updates} : o))} onLogout={authLogout} onUpdateUserAvailability={(uId, status) => setAllUsers(us => us.map(u => u.id === uId ? {...u, availabilityStatus: status} : u))} /> : <ForbiddenPage onNavigateHome={handleNavigateHome} />;
      case 'depot-agent-dashboard': return user?.role === 'depot_agent' ? <DepotAgentDashboard user={user} allUsers={allUsers} allOrders={allOrders} onCheckIn={handleCheckIn} onReportDiscrepancy={handleReportDiscrepancy} onLogout={authLogout} onProcessDeparture={handleProcessDeparture}/> : <ForbiddenPage onNavigateHome={handleNavigateHome} />;
      case 'account': return user ? <AccountPage onBack={handleNavigateHome} initialTab={activeAccountTab} allStores={allStores} userOrders={userOrders} allTickets={allTickets} onSelectOrder={(o) => {setSelectedOrder(o); setPage('order-detail');}} onRepeatOrder={(order) => order.items.forEach(item => addToCart(item, item.quantity, item.selectedVariant, {suppressModal: true}))} onVendorClick={handleVendorClick} onCreateTicket={()=>{}} onUserReplyToTicket={()=>{}} /> : <ForbiddenPage onNavigateHome={handleNavigateHome} />;
      case 'visual-search': return <VisualSearchPage onSearch={handleSearch} />;
      case 'reset-password': return emailForPasswordReset ? <ResetPasswordPage onPasswordReset={(newPass) => { resetPassword(emailForPasswordReset, newPass); setEmailForPasswordReset(null); setIsLoginModalOpen(true); }} onNavigateLogin={() => {setEmailForPasswordReset(null); setIsLoginModalOpen(true);}} /> : <HomePage products={visibleProducts} categories={allCategories} stores={allStores} flashSales={flashSales} advertisements={advertisements} onProductClick={handleProductClick} onCategoryClick={handleCategoryClick} onVendorClick={handleVendorClick} onVisitStore={handleVendorClick} onViewStories={(s) => setViewingStoriesOfStore(s)} isComparisonEnabled={isComparisonEnabled} isStoriesEnabled={siteSettings.isStoriesEnabled} recentlyViewedIds={recentlyViewedIds} userOrders={userOrders} wishlist={wishlist}/>;
      case 'info': return <InfoPage title={infoPageContent.title} content={infoPageContent.content} onBack={handleNavigateHome} />;
      case 'not-found': return <NotFoundPage onNavigateHome={handleNavigateHome} />;
      case 'forbidden': return <ForbiddenPage onNavigateHome={handleNavigateHome} />;
      case 'server-error': return <ServerErrorPage onNavigateHome={handleNavigateHome} />;
      case 'comparison': return <ComparisonPage onBack={handleNavigateHome} />;
      default: return <HomePage products={visibleProducts} categories={allCategories} stores={allStores} flashSales={flashSales} advertisements={advertisements} onProductClick={handleProductClick} onCategoryClick={handleCategoryClick} onVendorClick={handleVendorClick} onVisitStore={handleVendorClick} onViewStories={(s) => setViewingStoriesOfStore(s)} isComparisonEnabled={isComparisonEnabled} isStoriesEnabled={siteSettings.isStoriesEnabled} recentlyViewedIds={recentlyViewedIds} userOrders={userOrders} wishlist={wishlist}/>;
    }
  };
  
  const handleLogout = () => {
    authLogout();
    setPage('home');
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setIsLoginModalOpen(false);
    const isNewSeller = loggedInUser.role === 'seller' && !loggedInUser.shopName;

    if (isNewSeller) {
        const newStoreName = `${loggedInUser.name}'s Shop`;
        const requiredDocs = Object.entries(siteSettings.requiredSellerDocuments)
            .filter(([, isRequired]) => isRequired)
            .map(([name]) => ({ name, status: 'requested' as const }));

        const newStore: Store = {
            id: `store-${Date.now()}`,
            sellerId: loggedInUser.id,
            name: newStoreName,
            logoUrl: '',
            category: 'Non catégorisé',
            warnings: [],
            status: 'pending',
            location: 'Non défini',
            neighborhood: '',
            sellerFirstName: loggedInUser.name.split(' ')[0] || '',
            sellerLastName: loggedInUser.name.split(' ').slice(1).join(' ') || '',
            sellerPhone: loggedInUser.phone || '',
            physicalAddress: 'Non définie',
            documents: requiredDocs,
            premiumStatus: 'standard',
        };

        setAllStores(prev => [...prev, newStore]);
        updateUser({ shopName: newStoreName });
        setPage('seller-subscription');
    } else {
        setIsLoginRedirecting(true);
    }
  };
  
  const handlePromotionSave = (productId: string, promoPrice: number, startDate?: string, endDate?: string) => {
      setAllProducts(prev => prev.map(p => p.id === productId ? {...p, promotionPrice: promoPrice, promotionStartDate: startDate, promotionEndDate: endDate} : p));
      setPromotionModalProduct(null);
  };
  
  const activeAnnouncement = useMemo(() => {
    const now = new Date();
    return allAnnouncements.find(ann => 
        ann.isActive &&
        !dismissedAnnouncements.includes(ann.id) &&
        new Date(ann.startDate) <= now &&
        new Date(ann.endDate) >= now &&
        (ann.target === 'all' || (ann.target === 'customers' && user?.role === 'customer') || (ann.target === 'sellers' && user?.role === 'seller'))
    );
  }, [allAnnouncements, dismissedAnnouncements, user]);

  return (
    <div className={`flex flex-col min-h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200`}>
      {activeAnnouncement && <AnnouncementBanner announcement={activeAnnouncement} onDismiss={(id) => setDismissedAnnouncements(prev => [...prev, id])} />}
      <Header
        categories={allCategories}
        onNavigateHome={handleNavigateHome}
        onNavigateCart={() => setPage('cart')}
        onNavigateToStores={() => setPage('stores')}
        onNavigateToPromotions={() => setPage('promotions')}
        onNavigateToCategory={handleCategoryClick}
        onNavigateToBecomeSeller={() => setPage('become-seller')}
        onNavigateToSellerDashboard={() => setPage('seller-dashboard')}
        onNavigateToSellerProfile={() => setPage('seller-profile')}
        onNavigateToOrderHistory={() => setPage('order-history')}
        onNavigateToSuperAdminDashboard={() => setPage('superadmin-dashboard')}
        onNavigateToFlashSales={() => setPage('flash-sales')}
        onNavigateToWishlist={() => setPage('wishlist')}
        onNavigateToDeliveryAgentDashboard={() => setPage('delivery-agent-dashboard')}
        onNavigateToDepotAgentDashboard={() => setPage('depot-agent-dashboard')}
        onNavigateToBecomePremium={() => user ? setPage('become-premium') : setIsLoginModalOpen(true)}
        onNavigateToAccount={handleOpenAccountPage}
        onNavigateToVisualSearch={() => setPage('visual-search')}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onSearch={handleSearch}
        isChatEnabled={isChatEnabled}
        isPremiumProgramEnabled={siteSettings.isPremiumProgramEnabled}
        logoUrl={siteSettings.logoUrl}
        onLoginSuccess={handleLoginSuccess}
        notifications={user ? allNotifications.filter(n => n.userId === user.id) : []}
        onMarkNotificationAsRead={(id) => setAllNotifications(ns => ns.map(n => n.id === id ? {...n, isRead: true} : n))}
        onNavigateFromNotification={(link) => {if(link?.page) { setPage(link.page); if (link.page === 'order-detail') setSelectedOrder(allOrders.find(o => o.id === link.params?.orderId) || null); if (link.page === 'seller-dashboard') setInitialSellerTab(link.params?.tab || 'overview');}}}
      />

      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} onForgotPassword={() => { setIsLoginModalOpen(false); setIsForgotPasswordModalOpen(true); }} />}
      {isForgotPasswordModalOpen && <ForgotPasswordModal onClose={() => setIsForgotPasswordModalOpen(false)} onEmailSubmit={(email) => { setEmailForPasswordReset(email); setPage('reset-password'); setIsForgotPasswordModalOpen(false); }} />}

      {isModalOpen && modalProduct && <AddToCartModal product={modalProduct} onClose={uiCloseModal} onNavigateToCart={() => { uiCloseModal(); setPage('cart'); }} />}
      
      {paymentRequest && <PaymentModal paymentRequest={paymentRequest} paymentMethods={paymentMethods} onClose={() => setPaymentRequest(null)} />}

      {promotionModalProduct && <PromotionModal product={promotionModalProduct} onClose={() => setPromotionModalProduct(null)} onSave={handlePromotionSave} />}
      
      {viewingStoriesOfStore && <StoryViewer store={viewingStoriesOfStore} onClose={() => setViewingStoriesOfStore(null)} />}
      
      <main className="flex-grow">
        {renderPage()}
      </main>
      
      {isChatEnabled && <ChatWidget allUsers={allUsers} allProducts={allProducts} allCategories={allCategories} />}
      
      {isComparisonEnabled && comparisonList.length > 0 && <ComparisonBar onNavigateToComparison={() => setPage('comparison')} />}
      
      <Footer onNavigate={(slug) => {setInfoPageContent(siteContent.find(c => c.slug === slug) || {title: 'Not Found', content: ''}); setPage('info')}} logoUrl={siteSettings.logoUrl} paymentMethods={paymentMethods} />
    </div>
  );
}