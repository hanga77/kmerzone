

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SellerDashboard } from './components/SellerDashboard';
import { SellerAnalyticsDashboard } from './components/SellerAnalyticsDashboard';
// FIX: Correctly import named export 'DeliveryAgentDashboard'
import { DeliveryAgentDashboard } from './components/DeliveryAgentDashboard';
import { DepotAgentDashboard } from './components/DepotAgentDashboard';
import { XIcon } from './components/Icons';
import { usePersistentState } from './hooks/usePersistentState';
import { useAuth } from './contexts/AuthContext';
import { useComparison } from './contexts/ComparisonContext';
import { useUI } from './contexts/UIContext';
import { useCart } from './contexts/CartContext';
import { useWishlist } from './contexts/WishlistContext';
import { initialCategories, initialProducts, sampleDeliveredOrder, sampleDeliveredOrder2, sampleDeliveredOrder3, initialStores, initialFlashSales, initialPickupPoints, initialSiteSettings, initialSiteContent, initialAdvertisements, initialPaymentMethods, sampleNewMissionOrder } from './constants';
import type { Product, Category, Store, Review, Order, OrderStatus, User, SiteActivityLog, FlashSale, PickupPoint, NewOrderData, PromoCode, Warning, SiteSettings, UserAvailabilityStatus, DisputeMessage, StatusChangeLogEntry, FlashSaleProduct, RequestedDocument, SiteContent, Ticket, TicketMessage, TicketStatus, TicketPriority, Announcement, PaymentMethod, Page, Notification, ProductCollection, Payout, Advertisement, Story, CartItem } from './types';
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

// Import stub components that are not yet implemented
import { 
    ComparisonPage, ComparisonBar, InfoPage, 
    StoryViewer,
    StoresMapPage
} from './components/ComponentStubs';


const statusTranslations: { [key in OrderStatus]: string } = {
  confirmed: 'Confirmée',
  'ready-for-pickup': 'Prêt pour enlèvement',
  'picked-up': 'Pris en charge',
  'at-depot': 'Au dépôt',
  'out-for-delivery': 'En livraison',
  delivered: 'Livré',
  cancelled: 'Annulé',
  'refund-requested': 'Remboursement demandé',
  refunded: 'Remboursé',
  returned: 'Retourné',
  'depot-issue': 'Problème au dépôt',
  'delivery-failed': 'Échec de livraison',
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

// Helper function to update meta tags
const updateMetaTag = (name: string, content: string, isProperty: boolean = false) => {
  const selector = isProperty ? `meta[property='${name}']` : `meta[name='${name}']`;
  let element = document.head.querySelector(selector) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    if (isProperty) {
      element.setAttribute('property', name);
    } else {
      element.setAttribute('name', name);
    }
    document.head.appendChild(element);
  }
  element.content = content;
};


export default function App() {
  const [page, setPage] = useState<Page>('home');
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
    const [allNotifications, setAllNotifications] = usePersistentState<Notification[]>('allNotifications', [
        { id: 'notif1', userId: 'customer-1', message: 'Votre commande ORDER-SAMPLE-1 a été livrée !', link: { page: 'order-detail', params: { orderId: 'ORDER-SAMPLE-1' } }, isRead: false, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'notif2', userId: 'customer-1', message: 'Une nouvelle vente flash a commencé : Vente Flash de la Rentrée', link: { page: 'flash-sales' }, isRead: true, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ]);
    const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
    const [paymentMethods, setPaymentMethods] = usePersistentState<PaymentMethod[]>('paymentMethods', initialPaymentMethods);

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

    const [isChatEnabled, setIsChatEnabled] = useState(true);
    const [isComparisonEnabled, setIsComparisonEnabled] = useState(true);

    const visibleProducts = useMemo(() => {
        const activeStoreNames = new Set(allStores.filter(s => s.status === 'active').map(s => s.name));
        return allProducts.filter(p => activeStoreNames.has(p.vendor) && p.status === 'published');
    }, [allProducts, allStores]);

    useEffect(() => {
      setComparisonProducts(allProducts);
    }, [allProducts, setComparisonProducts]);

     useEffect(() => {
        if (siteActivityLogs.length === 0) {
            const newLog: SiteActivityLog = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                user: { id: 'system', name: 'Système', role: 'superadmin' },
                action: 'Application Started',
                details: 'The KMER ZONE application has been successfully initialized.'
            };
            setSiteActivityLogs([newLog]);
        }
    }, [siteActivityLogs.length, setSiteActivityLogs]); 

    // Dynamic SEO Management
    useEffect(() => {
        // Use settings from state for dynamic updates
        let { metaTitle: title, metaDescription: description, ogImageUrl } = siteSettings.seo;

        switch(page) {
        case 'product':
            if (selectedProduct) {
            title = `${selectedProduct.name} | KMER ZONE`;
            description = selectedProduct.description ? selectedProduct.description.substring(0, 160) : `Achetez ${selectedProduct.name} au meilleur prix sur KMER ZONE.`;
            ogImageUrl = selectedProduct.imageUrls[0] || ogImageUrl;
            }
            break;
        case 'category':
            const category = allCategories.find(c => c.id === selectedCategoryId);
            if (category) {
            title = `${category.name} | KMER ZONE`;
            description = `Découvrez les meilleurs produits dans la catégorie ${category.name} sur KMER ZONE. Vaste choix et livraison rapide.`;
            ogImageUrl = category.imageUrl || ogImageUrl;
            }
            break;
        case 'vendor-page':
            const store = allStores.find(s => s.name === selectedVendor);
            if (store) {
            title = `Boutique ${store.name} | KMER ZONE`;
            description = `Explorez la boutique de ${store.name} sur KMER ZONE et découvrez tous ses produits uniques.`;
            ogImageUrl = store.logoUrl || ogImageUrl;
            }
            break;
        }
        
        // Update the document head
        document.title = title;
        updateMetaTag('description', description);

        // Open Graph & Twitter
        updateMetaTag('og:title', title, true);
        updateMetaTag('og:description', description, true);
        updateMetaTag('og:image', ogImageUrl, true);
        updateMetaTag('twitter:title', title);
        updateMetaTag('twitter:description', description);
        updateMetaTag('twitter:image', ogImageUrl);

    }, [page, selectedProduct, selectedCategoryId, selectedVendor, allCategories, allStores, siteSettings.seo]);

    const userId = user?.id;
    const userRole = user?.role;
    const userLoyaltyStatus = user?.loyalty?.status;
    const userLoyaltyMethod = user?.loyalty?.premiumStatusMethod;

    useEffect(() => {
        if (!userId || userRole !== 'customer' || !siteSettings.isPremiumProgramEnabled) {
            return;
        }

        if (userLoyaltyStatus === 'standard' && userLoyaltyMethod !== 'deposit') {
            const userOrders = allOrders.filter(o => o.userId === userId && o.status === 'delivered');
            const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
            const orderCount = userOrders.length;

            const shouldBePremium = orderCount >= siteSettings.premiumThresholds.orders || totalSpent >= siteSettings.premiumThresholds.spending;

            if (shouldBePremium) {
                setAllUsers(currentUsers => {
                    const currentUserInList = currentUsers.find(u => u.id === userId);
                    if (currentUserInList && currentUserInList.loyalty.status === 'standard') {
                        return currentUsers.map(u => 
                            u.id === userId
                            ? { ...u, loyalty: { ...u.loyalty, status: 'premium' as const, premiumStatusMethod: 'loyalty' as const } } 
                            : u
                        );
                    }
                    return currentUsers;
                });
            }
        }
    }, [userId, userRole, userLoyaltyStatus, userLoyaltyMethod, allOrders, siteSettings.isPremiumProgramEnabled, siteSettings.premiumThresholds, setAllUsers]);


    const logActivity = useCallback((action: string, details: string) => {
        if (!user) return;
        const newLog: SiteActivityLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            user: { id: user.id, name: user.name, role: user.role },
            action,
            details
        };
        setSiteActivityLogs(prev => [newLog, ...prev].slice(0, 100));
    }, [user, setSiteActivityLogs]);
    
    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
        setAllNotifications(prev => [
            { ...notification, id: `notif-${Date.now()}-${Math.random()}`, timestamp: new Date().toISOString() },
            ...prev
        ].slice(0, 200)); 
    }, [setAllNotifications]);

    const handleMarkNotificationAsRead = useCallback((notificationId: string) => {
        setAllNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
        logActivity('Notification Read', `Notification ID ${notificationId} marked as read.`);
    }, [setAllNotifications, logActivity]);

    const handleNavigate = useCallback((newPage: Page, stateReset: () => void = () => {}) => {
        if (user?.role === 'seller' && newPage === 'cart') {
            alert("Les vendeurs ne peuvent pas accéder au panier. Veuillez utiliser un compte client.");
            setPage('seller-dashboard');
            return;
        }
        setPage(newPage);
        stateReset();
        window.scrollTo(0, 0);
    }, [user]);

    const handleNavigateFromNotification = useCallback((link: Notification['link']) => {
        if (!link) return;
        if (link.page === 'order-detail' && link.params?.orderId) {
            const orderToView = allOrders.find(o => o.id === link.params.orderId);
            if (orderToView) {
                setSelectedOrder(orderToView);
            }
        }
        if (link.page === 'seller-dashboard' && link.params?.tab) {
             setInitialSellerTab(link.params.tab);
        } else {
             setInitialSellerTab('overview');
        }
        handleNavigate(link.page);
    }, [allOrders, handleNavigate]);

    const addStatusLog = (order: Order, status: OrderStatus, changedBy: string): Order => {
        const newLogEntry: StatusChangeLogEntry = { status, date: new Date().toISOString(), changedBy, };
        const updatedOrder = { ...order, status, statusChangeLog: [...(order.statusChangeLog || []), newLogEntry], };
         if (!order.trackingHistory.some(h => h.status === status)) {
            updatedOrder.trackingHistory = [...order.trackingHistory, { status, date: new Date().toISOString(), location: 'System', details: `Status changed to ${status} by ${changedBy}` }];
        }
        return updatedOrder;
    };

    const handleUpdateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
        const orderToUpdate = allOrders.find(o => o.id === orderId);
        if (!orderToUpdate) return;
        
        const changedBy = user ? `${user.name} (${user.role})` : 'System';
        const updatedOrder = addStatusLog(orderToUpdate, newStatus, changedBy);
        
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        logActivity('Order Status Update', `Order ${orderId} status changed to ${newStatus}.`);

        addNotification({
            userId: updatedOrder.userId,
            message: `Le statut de votre commande #${updatedOrder.id} est maintenant : ${statusTranslations[newStatus]}.`,
            link: { page: 'order-detail', params: { orderId: updatedOrder.id } },
            isRead: false
        });
    }, [allOrders, setAllOrders, logActivity, user, addNotification]);

    const handleUpdateUserAvailability = useCallback((userId: string, status: UserAvailabilityStatus) => {
        setAllUsers(users => users.map(u => u.id === userId ? { ...u, availabilityStatus: status } : u));
        const actor = user ? `${user.name} (${user.role})` : 'System';
        logActivity('User Availability Update', `Status for user ${userId} set to ${status} by ${actor}.`);
    }, [setAllUsers, logActivity, user]);
    
    const handleAdminAddCategory = useCallback((categoryName: string, parentId?: string) => {
        if (!categoryName.trim()) { alert("Le nom de la catégorie ne peut pas être vide."); return; }
        if (allCategories.some(c => c.name.toLowerCase() === categoryName.trim().toLowerCase() && c.parentId === parentId)) { alert("Une catégorie avec ce nom existe déjà à ce niveau."); return; }
        const newCategory: Category = { id: `cat-${Date.now()}`, name: categoryName.trim(), imageUrl: 'https://images.unsplash.com/photo-1588422221063-654854db2583?q=80&w=1974&auto=format&fit=crop', parentId: parentId || undefined };
        setAllCategories(prev => [...prev, newCategory]);
        logActivity('Category Added', `New category "${newCategory.name}" created.`);
    }, [allCategories, setAllCategories, logActivity]);

    const handleAdminDeleteCategory = useCallback((categoryId: string) => {
        if (allCategories.some(c => c.parentId === categoryId)) { alert("Impossible de supprimer cette catégorie car elle contient des sous-catégories. Veuillez d'abord supprimer les sous-catégories."); return; }
        if (allProducts.some(p => p.categoryId === categoryId)) { alert("Impossible de supprimer cette catégorie car elle est utilisée par des produits. Veuillez d'abord changer la catégorie de ces produits."); return; }
        const categoryToDelete = allCategories.find(c => c.id === categoryId);
        if (categoryToDelete && window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryToDelete.name}" ?`)) {
            setAllCategories(prev => prev.filter(c => c.id !== categoryId));
            logActivity('Category Deleted', `Category "${categoryToDelete.name}" (ID: ${categoryId}) deleted.`);
        }
    }, [allCategories, allProducts, setAllCategories, logActivity]);

    const resetSelections = () => {
        setSelectedProduct(null);
        setSelectedCategoryId(null);
        setSelectedVendor(null);
        setSelectedOrder(null);
        setProductToEdit(null);
    };

    const handleProductView = useCallback((productId: string) => {
        setRecentlyViewedIds(prevIds => {
            const newIds = [productId, ...prevIds.filter(id => id !== productId)];
            return newIds.slice(0, 8);
        });
    }, [setRecentlyViewedIds]);

    const handleProductClick = useCallback((product: Product) => {
        setSelectedProduct(product);
        handleNavigate('product');
    }, [handleNavigate]);

    const handleCategoryClick = useCallback((categoryId: string) => {
        setSelectedCategoryId(categoryId);
        handleNavigate('category');
    }, [handleNavigate]);

    const handleVendorClick = useCallback((vendorName: string) => {
        setSelectedVendor(vendorName);
        handleNavigate('vendor-page');
    }, [handleNavigate]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        handleNavigate('search-results');
    }, [handleNavigate]);
    
    const handleLogout = useCallback(() => {
        authLogout();
        handleNavigate('home', resetSelections);
    }, [authLogout, handleNavigate]);

    const handleLoginSuccess = useCallback((loggedInUser: User) => {
        setIsLoginModalOpen(false);
        switch (loggedInUser.role) {
            case 'superadmin': handleNavigate('superadmin-dashboard'); break;
            case 'seller': handleNavigate('seller-dashboard'); break;
            case 'delivery_agent': handleNavigate('delivery-agent-dashboard'); break;
            case 'depot_agent': handleNavigate('depot-agent-dashboard'); break;
            default: handleNavigate('home');
        }
    }, [handleNavigate]);

    const handleOpenForgotPassword = useCallback(() => {
        setIsLoginModalOpen(false);
        setIsForgotPasswordModalOpen(true);
    }, []);

    const handleForgotPasswordSubmit = useCallback((email: string) => {
        const userExists = allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (userExists) { setEmailForPasswordReset(email); }
        setIsForgotPasswordModalOpen(false);
        if (userExists) {
            alert("Un e-mail de réinitialisation a été envoyé (simulation). Vous allez être redirigé vers la page de réinitialisation.");
            handleNavigate('reset-password');
        } else {
             alert("Si un compte correspondant à cet email existe, un lien de réinitialisation a été envoyé.");
        }
    }, [allUsers, handleNavigate]);
    
    const handlePasswordReset = useCallback((newPassword: string) => {
        if (emailForPasswordReset) {
            resetPassword(emailForPasswordReset, newPassword);
            setEmailForPasswordReset(null);
        } else {
            alert("Erreur: Aucune adresse e-mail n'a été spécifiée pour la réinitialisation.");
            handleNavigate('home');
        }
    }, [emailForPasswordReset, resetPassword, handleNavigate]);
    
    const handleNavigateLoginFromReset = useCallback(() => {
        handleNavigate('home');
        setIsLoginModalOpen(true);
    }, [handleNavigate]);

    const handleNavigateToAccount = useCallback((tab: string = 'profile') => {
        setActiveAccountTab(tab);
        handleNavigate('account');
    }, [handleNavigate]);

    const handlePlaceOrder = useCallback(async (orderData: NewOrderData): Promise<void> => {
        logActivity('Order Placed', `New order created with total ${orderData.total.toLocaleString('fr-CM')} FCFA.`);
        const newOrder: Order = { ...orderData, id: `ORDER-${Date.now()}`, orderDate: new Date().toISOString(), status: 'confirmed', trackingNumber: `KZ${Date.now()}`, trackingHistory: [{ status: 'confirmed', date: new Date().toISOString(), location: 'System', details: 'Commande confirmée et en attente de préparation par le vendeur.' }], statusChangeLog: [{ status: 'confirmed', date: new Date().toISOString(), changedBy: 'Customer' }], };
        
        const sellersInOrder = [...new Set(newOrder.items.map(item => item.vendor))];
        sellersInOrder.forEach(vendorName => {
            const sellerUser = allUsers.find(u => u.role === 'seller' && u.shopName === vendorName);
            if (sellerUser) {
                addNotification({
                    userId: sellerUser.id,
                    message: `Nouvelle commande #${newOrder.id} reçue.`,
                    link: { page: 'seller-dashboard', params: { tab: 'orders-in-progress' } },
                    isRead: false
                });
            }
        });

        setAllProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            newOrder.items.forEach(item => {
                const productIndex = updatedProducts.findIndex(p => p.id === item.id);
                if (productIndex !== -1) {
                    const oldStock = updatedProducts[productIndex].stock;
                    const newStock = oldStock - item.quantity;
                    if (newStock < 5 && oldStock >= 5) {
                        const sellerUser = allUsers.find(u => u.role === 'seller' && u.shopName === item.vendor);
                        if (sellerUser) {
                            addNotification({
                                userId: sellerUser.id,
                                message: `Stock faible pour ${item.name} (${newStock} restants).`,
                                link: { page: 'seller-dashboard', params: { tab: 'products' } },
                                isRead: false
                            });
                        }
                    }
                    updatedProducts[productIndex] = { ...updatedProducts[productIndex], stock: Math.max(0, newStock) };
                }
            });
            return updatedProducts;
        });

        if (orderData.appliedPromoCode) {
            setAllPromoCodes(prevCodes =>
                prevCodes.map(pc =>
                    pc.code === orderData.appliedPromoCode!.code
                        ? { ...pc, uses: pc.uses + 1 }
                        : pc
                )
            );
        }
        
        setAllOrders(prevOrders => [...prevOrders, newOrder]);
        setSelectedOrder(newOrder);
        clearCart();
        onApplyPromoCode(null);
        handleNavigate('order-success');
    }, [logActivity, allUsers, addNotification, setAllProducts, setAllOrders, clearCart, handleNavigate, onApplyPromoCode, setAllPromoCodes]);
    
    const handleAddProduct = useCallback((product: Product) => {
        setAllProducts(prev => {
            const existingIndex = prev.findIndex(p => p.id === product.id);
            if (existingIndex > -1) {
                 logActivity('Product Updated', `Product "${product.name}" updated by its seller.`);
                return prev.map((p, i) => i === existingIndex ? product : p);
            }
            logActivity('Product Added', `New product "${product.name}" added by a seller.`);
            return [...prev, product];
        });
        setProductToEdit(null);
        handleNavigate('seller-dashboard');
    }, [setAllProducts, logActivity, handleNavigate]);

    const handleDeleteProduct = useCallback((productId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
            const productName = allProducts.find(p => p.id === productId)?.name || 'Unknown Product';
            setAllProducts(prev => prev.filter(p => p.id !== productId));
            logActivity('Product Deleted', `Product "${productName}" (ID: ${productId}) deleted by its seller.`);
        }
    }, [allProducts, setAllProducts, logActivity]);
    
    const handleUpdateProductStatus = useCallback((productId: string, status: Product['status']) => {
        setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, status } : p));
        logActivity('Product Status Update', `Product ID ${productId} status updated to ${status}.`);
    }, [setAllProducts, logActivity]);

    const handleCheckIn = useCallback((orderId: string, storageLocationId: string, notes?: string) => {
        setAllOrders(prevOrders => {
            return prevOrders.map(o => {
                if (o.id === orderId) {
                    const updatedOrder = {
                        ...o,
                        status: 'at-depot' as OrderStatus,
                        storageLocationId,
                        checkedInAt: new Date().toISOString(),
                        checkedInBy: user?.id,
                    };
                    if (notes) {
                        updatedOrder.discrepancy = {
                            reason: notes,
                            reportedAt: new Date().toISOString(),
                            reportedBy: user?.id || 'unknown'
                        };
                    }
                    logActivity('Order Checked In', `Order ${orderId} checked into depot at ${storageLocationId}.`);
                    return addStatusLog(updatedOrder, 'at-depot', user ? `${user.name} (Depot Agent)` : 'Depot Agent');
                }
                return o;
            });
        });
    }, [setAllOrders, user, logActivity]);

    const handleReportDiscrepancy = useCallback((orderId: string, reason: string) => {
        setAllOrders(prevOrders => {
             return prevOrders.map(o => {
                if (o.id === orderId) {
                    const updatedOrder = {
                        ...o,
                        status: 'depot-issue' as OrderStatus,
                        discrepancy: {
                            reason,
                            reportedAt: new Date().toISOString(),
                            reportedBy: user?.id || 'unknown'
                        },
                    };
                    logActivity('Depot Discrepancy Reported', `Discrepancy for order ${orderId}: ${reason}.`);
                    return addStatusLog(updatedOrder, 'depot-issue', user ? `${user.name} (Depot Agent)` : 'Depot Agent');
                }
                return o;
            });
        });
    }, [setAllOrders, user, logActivity]);

    const handleProcessDeparture = useCallback((orderId: string, recipientInfo?: { name: string; idNumber: string }) => {
        setAllOrders(prevOrders => {
            const orderToUpdate = prevOrders.find(o => o.id === orderId);
            if (!orderToUpdate) return prevOrders;

            let newStatus: OrderStatus;
            let updatedFields: Partial<Order> = {
                departureProcessedByAgentId: user?.id,
                processedForDepartureAt: new Date().toISOString()
            };

            if (orderToUpdate.deliveryMethod === 'pickup') {
                newStatus = 'delivered';
                updatedFields = {
                    ...updatedFields,
                    pickupRecipientName: recipientInfo?.name,
                    pickupRecipientId: recipientInfo?.idNumber
                };
            } else {
                newStatus = 'out-for-delivery';
            }
            
            const updatedOrder = addStatusLog(orderToUpdate, newStatus, user ? `${user.name} (Depot Agent)` : 'Depot Agent');
            Object.assign(updatedOrder, updatedFields);
            
            logActivity('Order Processed for Departure', `Order ${orderId} departed from depot.`);
            
            addNotification({
                userId: updatedOrder.userId,
                message: newStatus === 'delivered' ? `Votre commande #${updatedOrder.id} a été retirée au point relais.` : `Votre commande #${updatedOrder.id} a quitté le dépôt et est en route pour la livraison.`,
                link: { page: 'order-detail', params: { orderId: updatedOrder.id } },
                isRead: false
            });

            return prevOrders.map(o => o.id === orderId ? updatedOrder : o);
        });
    }, [setAllOrders, user, logActivity, addNotification]);
    
    const handleBulkUpdateProducts = useCallback((updatedProducts: Array<Pick<Product, 'id' | 'price' | 'stock'>>) => {
        setAllProducts(prev => {
            const updatedMap = new Map(updatedProducts.map(p => [p.id, p]));
            return prev.map(p => {
                if (updatedMap.has(p.id)) {
                    const updates = updatedMap.get(p.id)!;
                    return { ...p, price: updates.price, stock: updates.stock };
                }
                return p;
            });
        });
        logActivity('Bulk Product Update', `${updatedProducts.length} products updated via bulk edit.`);
    }, [setAllProducts, logActivity]);

    const handleSetPromotion = useCallback((productId: string, promoPrice: number, startDate?: string, endDate?: string) => {
        setAllProducts(prev => prev.map(p => {
            if (p.id === productId) {
                const productName = p.name;
                logActivity('Promotion Set', `Promotion set for product "${productName}" at ${promoPrice.toLocaleString('fr-CM')} FCFA.`);
                return {...p, promotionPrice: promoPrice, promotionStartDate: startDate, promotionEndDate: endDate };
            }
            return p;
        }));
        setPromotionModalProduct(null);
    }, [setAllProducts, logActivity]);

    const handleRemovePromotion = useCallback((productId: string) => {
         if (window.confirm("Êtes-vous sûr de vouloir retirer la promotion de ce produit ?")) {
            setAllProducts(prev => prev.map(p => {
                 if (p.id === productId) {
                     const { promotionPrice, promotionStartDate, promotionEndDate, ...rest } = p;
                     logActivity('Promotion Removed', `Promotion removed for product "${p.name}".`);
                     return rest;
                 }
                 return p;
             }));
         }
    }, [setAllProducts, logActivity]);
    
    const handleProposeForFlashSale = useCallback((flashSaleId: string, productId: string, flashPrice: number, sellerShopName: string) => {
        setFlashSales(prev => prev.map(fs => {
            if (fs.id === flashSaleId) {
                if (fs.products.some(p => p.productId === productId)) return fs;
                const newProposal: FlashSaleProduct = { productId, sellerShopName, flashPrice, status: 'pending' };
                logActivity('Flash Sale Proposal', `Seller "${sellerShopName}" proposed product ID ${productId} for flash sale "${fs.name}".`);
                return { ...fs, products: [...fs.products, newProposal] };
            }
            return fs;
        }));
    }, [setFlashSales, logActivity]);
    
     const handleUpdateFlashSaleSubmissionStatus = useCallback((flashSaleId: string, productId: string, status: 'approved' | 'rejected') => {
        setFlashSales(prev => prev.map(fs => {
            if (fs.id === flashSaleId) {
                const product = allProducts.find(p => p.id === productId);
                 if (product) {
                    const sellerUser = allUsers.find(u => u.role === 'seller' && u.shopName === product.vendor);
                    if (sellerUser) {
                         addNotification({
                            userId: sellerUser.id,
                            message: `Votre produit "${product.name}" pour la vente flash "${fs.name}" a été ${status === 'approved' ? 'approuvé' : 'rejeté'}.`,
                            link: { page: 'seller-dashboard', params: { tab: 'promotions' } },
                            isRead: false
                        });
                    }
                }
                logActivity('Flash Sale Submission Reviewed', `Submission for "${product?.name || `ID ${productId}`}" in sale "${fs.name}" was ${status}.`);
                return { ...fs, products: fs.products.map(p => p.productId === productId ? { ...p, status } : p) };
            }
            return fs;
        }));
    }, [allProducts, allUsers, setFlashSales, logActivity, addNotification]);
    
     const handleBatchUpdateFlashSaleStatus = useCallback((flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => {
        setFlashSales(prev => prev.map(fs => {
            if (fs.id === flashSaleId) {
                 logActivity('Flash Sale Batch Update', `Batch ${status} for ${productIds.length} products in sale "${fs.name}".`);
                return { ...fs, products: fs.products.map(p => productIds.includes(p.productId) ? { ...p, status } : p) };
            }
            return fs;
        }));
    }, [setFlashSales, logActivity]);

    const handleUploadDocument = useCallback((storeId: string, documentName: string, fileUrl: string) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                logActivity('Document Uploaded', `Document "${documentName}" was uploaded for store "${s.name}".`);
                return { ...s, documents: s.documents.map(d => d.name === documentName ? { ...d, status: 'uploaded', fileUrl } : d) };
            }
            return s;
        }));
    }, [setAllStores, logActivity]);
    
    const handleRequestDocument = useCallback((storeId: string, documentName: string) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId && !s.documents.some(d => d.name === documentName)) {
                 logActivity('Document Requested', `Document "${documentName}" was requested for store "${s.name}".`);
                const newDoc: RequestedDocument = { name: documentName, status: 'requested' };
                return { ...s, documents: [...s.documents, newDoc] };
            }
            return s;
        }));
    }, [setAllStores, logActivity]);
    
    const handleVerifyDocumentStatus = useCallback((store: Store, documentName: string, status: 'verified' | 'rejected', reason: string = '') => {
        setAllStores(prev => prev.map(s => {
            if (s.id === store.id) {
                 logActivity('Document Reviewed', `Document "${documentName}" for store "${s.name}" was ${status}.`);
                const sellerUser = allUsers.find(u => u.role === 'seller' && u.shopName === store.name);
                if (sellerUser) {
                    addNotification({
                        userId: sellerUser.id,
                        message: `Votre document "${documentName}" a été ${status === 'verified' ? 'approuvé' : 'rejeté'}.`,
                        link: { page: 'seller-dashboard', params: { tab: 'documents' } },
                        isRead: false
                    });
                }
                return { ...s, documents: s.documents.map(d => d.name === documentName ? { ...d, status, rejectionReason: reason || undefined } : d) };
            }
            return s;
        }));
    }, [setAllStores, logActivity, allUsers, addNotification]);

    const handleCreatePromoCode = useCallback((codeData: Omit<PromoCode, 'uses'>) => {
        if (allPromoCodes.some(pc => pc.code.toLowerCase() === codeData.code.toLowerCase())) { alert(`Le code promo "${codeData.code}" existe déjà.`); return; }
        const newCode: PromoCode = { ...codeData, uses: 0 };
        setAllPromoCodes(prev => [...prev, newCode]);
        logActivity('Promo Code Created', `Promo code "${newCode.code}" was created.`);
    }, [allPromoCodes, setAllPromoCodes, logActivity]);
    
    const handleDeletePromoCode = useCallback((code: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le code promo "${code}" ?`)) {
            setAllPromoCodes(prev => prev.filter(pc => pc.code !== code));
            logActivity('Promo Code Deleted', `Promo code "${code}" was deleted.`);
        }
    }, [setAllPromoCodes, logActivity]);
    
    const handleAddReview = useCallback((productId: string, review: Review) => {
        setAllProducts(prev => prev.map(p => {
            if (p.id === productId) {
                const sellerUser = allUsers.find(u => u.role === 'seller' && u.shopName === p.vendor);
                if (sellerUser) {
                    addNotification({
                        userId: sellerUser.id,
                        message: `Nouvel avis (${review.rating}★) sur "${p.name}".`,
                        link: { page: 'seller-dashboard', params: { tab: 'reviews' } },
                        isRead: false
                    });
                }
                return { ...p, reviews: [...p.reviews, review] };
            }
            return p;
        }));
         logActivity('Review Added', `New review for product ID ${productId} was submitted by ${review.author}.`);
    }, [setAllProducts, logActivity, allUsers, addNotification]);

    const handleReviewModeration = useCallback((productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected') => {
        setAllProducts(prev => prev.map(p => {
            if (p.id === productId) {
                logActivity('Review Moderated', `Review from ${reviewIdentifier.author} on product ${p.name} was ${newStatus}.`);
                return { ...p, reviews: p.reviews.map(r => r.author === reviewIdentifier.author && r.date === reviewIdentifier.date ? { ...r, status: newStatus } : r) };
            }
            return p;
        }));
    }, [setAllProducts, logActivity]);
    
    const handleReplyToReview = useCallback((productId: string, reviewIdentifier: { author: string; date: string; }, replyText: string) => {
        setAllProducts(prev => prev.map(p => {
            if (p.id === productId) {
                logActivity('Review Replied', `Seller replied to review from ${reviewIdentifier.author} on product ${p.name}.`);
                return {
                    ...p,
                    reviews: p.reviews.map(r => 
                        (r.author === reviewIdentifier.author && r.date === reviewIdentifier.date)
                            ? { ...r, sellerReply: { text: replyText, date: new Date().toISOString() } }
                            : r
                    )
                };
            }
            return p;
        }));
    }, [setAllProducts, logActivity]);

     const handleBecomeSeller = useCallback((shopName: string, location: string, neighborhood: string, sellerFirstName: string, sellerLastName: string, sellerPhone: string, physicalAddress: string, logoUrl: string, latitude?: number, longitude?: number) => {
        if (!user) return;
        const newStore: Store = { id: `store-${Date.now()}`, name: shopName, logoUrl, category: 'Divers', warnings: [], status: 'pending', premiumStatus: 'standard', location, neighborhood, sellerFirstName, sellerLastName, sellerPhone, physicalAddress, latitude, longitude, documents: Object.entries(siteSettings.requiredSellerDocuments).filter(([, isRequired]) => isRequired).map(([name]): RequestedDocument => ({ name, status: 'requested' })), collections: [] };
        setAllStores(prev => [...prev, newStore]);
        updateUser({ shopName });
        logActivity('Seller Application', `User "${user.name}" applied to become a seller with shop "${shopName}".`);
    }, [user, siteSettings.requiredSellerDocuments, setAllStores, updateUser, logActivity]);

    const handleUpdateOrderWithAdmin = useCallback((order: Order, newStatus: OrderStatus) => {
        handleUpdateOrderStatus(order.id, newStatus);
    }, [handleUpdateOrderStatus]);
    
    const handleUpdateOrderWithSeller = useCallback((orderId: string, newStatus: OrderStatus) => {
        handleUpdateOrderStatus(orderId, newStatus);
    }, [handleUpdateOrderStatus]);
    
    const handleAssignAgent = useCallback((orderId: string, agentId: string) => {
        const order = allOrders.find(o => o.id === orderId);
        const agent = allUsers.find(u => u.id === agentId);
        if (order && agent) {
            const updatedOrder = addStatusLog(order, 'picked-up', `Admin (Assigned to ${agent.name})`);
            updatedOrder.agentId = agentId;
            setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
            logActivity('Agent Assigned', `Agent ${agent.name} assigned to order ${orderId}.`);
        }
    }, [allOrders, allUsers, setAllOrders, logActivity]);
    
    const handleAddStory = useCallback((storeId: string, imageUrl: string) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                const newStory: Story = { id: `story-${Date.now()}`, imageUrl, createdAt: new Date().toISOString() };
                return { ...s, stories: [...(s.stories || []), newStory] };
            }
            return s;
        }));
    }, [setAllStores]);

    const handleDeleteStory = useCallback((storeId: string, storyId: string) => {
        setAllStores(prev => prev.map(s => s.id === storeId ? { ...s, stories: s.stories?.filter(story => story.id !== storyId) } : s));
    }, [setAllStores]);
    
    const handleBecomePremiumByCaution = useCallback(() => {
        if (!user) return;
        if (window.confirm(`Confirmez-vous le paiement de la caution de ${siteSettings.premiumCautionAmount.toLocaleString('fr-CM')} FCFA pour devenir Premium ?`)) {
            setAllUsers(users => users.map(u => u.id === user.id ? { ...u, loyalty: { ...u.loyalty, status: 'premium', premiumStatusMethod: 'deposit' } } : u));
            logActivity('Premium by Deposit', `User ${user.name} became Premium by paying a deposit.`);
            alert("Félicitations ! Vous êtes maintenant un membre Premium.");
        }
    }, [user, siteSettings.premiumCautionAmount, setAllUsers, logActivity]);
    
    const handleUpgradeToPremiumPlus = useCallback(() => {
        if (!user) return;
         if (window.confirm(`Confirmez-vous le paiement de ${siteSettings.premiumPlusAnnualFee.toLocaleString('fr-CM')} FCFA pour l'abonnement annuel Premium+ ?`)) {
            setAllUsers(users => users.map(u => u.id === user.id ? { ...u, loyalty: { ...u.loyalty, status: 'premium_plus', premiumStatusMethod: 'subscription' } } : u));
            logActivity('Premium+ Subscription', `User ${user.name} upgraded to Premium+.`);
            alert("Félicitations ! Vous êtes maintenant un membre Premium+.");
        }
    }, [user, siteSettings.premiumPlusAnnualFee, setAllUsers, logActivity]);
    
    const handleCancelOrder = useCallback((orderId: string) => {
      const order = allOrders.find(o => o.id === orderId);
      if(order && window.confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
          const updatedOrder = addStatusLog(order, 'cancelled', user?.name || 'Customer');
          setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
          logActivity('Order Cancelled', `Order ${orderId} was cancelled by the customer.`);
      }
    }, [allOrders, user, setAllOrders, logActivity]);

    const handleRequestRefund = useCallback((orderId: string, reason: string, evidenceUrls: string[]) => {
      const order = allOrders.find(o => o.id === orderId);
      if(order) {
        const updatedOrder: Order = { ...addStatusLog(order, 'refund-requested', user?.name || 'Customer'), refundReason: reason, refundEvidenceUrls: evidenceUrls, disputeLog: [{ author: 'customer', message: `Demande de remboursement: ${reason}`, date: new Date().toISOString() }] };
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        logActivity('Refund Requested', `Refund requested for order ${orderId}. Reason: ${reason}`);
      }
    }, [allOrders, user, setAllOrders, logActivity]);

    const handleResolveRefund = useCallback((orderId: string, resolution: 'approved' | 'rejected') => {
        const order = allOrders.find(o => o.id === orderId);
        if (order) {
            const newStatus = resolution === 'approved' ? 'refunded' : order.status;
            const message = resolution === 'approved' ? 'Demande de remboursement approuvée. Le remboursement sera traité.' : 'Demande de remboursement rejetée.';
            const updatedOrder = addStatusLog(order, newStatus, user?.name || 'Admin');
            updatedOrder.disputeLog = [...(updatedOrder.disputeLog || []), { author: 'admin', message, date: new Date().toISOString()}];
            setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
            logActivity('Refund Resolved', `Refund request for order ${orderId} was ${resolution}.`);
        }
    }, [allOrders, user, setAllOrders, logActivity]);
    
    const handleAdminDisputeMessage = useCallback((orderId: string, message: string, author: 'admin' | 'seller' | 'customer') => {
        setAllOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const newMsg: DisputeMessage = { author, message, date: new Date().toISOString() };
                if (author === 'admin') {
                    const sellerUser = allUsers.find(u => u.role === 'seller' && o.items.some(i => i.vendor === u.shopName));
                    if(sellerUser) {
                         addNotification({
                            userId: sellerUser.id,
                            message: `Admin a envoyé un message concernant la commande #${orderId}.`,
                            link: { page: 'seller-dashboard', params: { tab: 'disputes' } },
                            isRead: false
                        });
                    }
                }
                return { ...o, disputeLog: [...(o.disputeLog || []), newMsg] };
            }
            return o;
        }));
    }, [setAllOrders, allUsers, addNotification]);

    const handleSellerDisputeMessage = useCallback((orderId: string, message: string) => {
        setAllOrders(prev => prev.map(o => {
            if (o.id === orderId && user && user.role === 'seller') {
                const newMsg: DisputeMessage = { author: 'seller', message, date: new Date().toISOString() };
                return { ...o, disputeLog: [...(o.disputeLog || []), newMsg] };
            }
            return o;
        }));
    }, [user, setAllOrders]);

    const handleRepeatOrder = useCallback((order: Order) => {
        const areVariantsEqual = (v1?: Record<string, string>, v2?: Record<string, string>): boolean => {
            if (!v1 && !v2) return true;
            if (!v1 || !v2) return false;
            const keys1 = Object.keys(v1);
            const keys2 = Object.keys(v2);
            if (keys1.length !== keys2.length) return false;
            return keys1.every(key => v1[key] === v2[key]);
        };
        const addedItems: string[] = [];
        const outOfStockItems: string[] = [];
        order.items.forEach(item => {
            const currentProduct = allProducts.find(p => p.id === item.id);
            if (currentProduct) {
                let stock = currentProduct.stock;
                if(currentProduct.variantDetails && item.selectedVariant) {
                    const variantDetail = currentProduct.variantDetails.find(vd => areVariantsEqual(vd.options, item.selectedVariant!));
                    stock = variantDetail?.stock ?? 0;
                }
                if (stock >= item.quantity) {
                    addToCart(currentProduct, item.quantity, item.selectedVariant, { suppressModal: true });
                    addedItems.push(`${item.name} (x${item.quantity})`);
                } else { outOfStockItems.push(`${item.name} (x${item.quantity})`); }
            } else { outOfStockItems.push(`${item.name} (x${item.quantity})`); }
        });
        let alertMessage = '';
        if (addedItems.length > 0) { alertMessage += `Les produits suivants ont été ajoutés à votre panier :\n- ${addedItems.join('\n- ')}\n\n`; }
        if (outOfStockItems.length > 0) { alertMessage += `Les produits suivants sont en rupture de stock ou indisponibles et n'ont pas pu être ajoutés :\n- ${outOfStockItems.join('\n- ')}`; }
        if (alertMessage.trim()) { alert(alertMessage.trim()); } else { alert("Aucun produit de cette commande n'est actuellement disponible."); }
        if (addedItems.length > 0) { handleNavigate('cart'); }
    }, [allProducts, addToCart, handleNavigate]);

    const handleUpdateOrderFromAgent = useCallback((orderId: string, updates: Partial<Order>) => {
        const order = allOrders.find(o => o.id === orderId);
        if (!order || !user) return;
        const actorName = user.name;
        let updatedOrder: Order = { ...order, ...updates };
        if (updates.status && updates.status !== order.status) {
            updatedOrder = addStatusLog(updatedOrder, updates.status, actorName);
        }
        setAllOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
        logActivity('Order Updated by Agent', `Agent ${actorName} updated order ${orderId}. Details: ${JSON.stringify(updates)}`);
    }, [allOrders, user, setAllOrders, logActivity]);
    
    const handleCreateTicket = useCallback((subject: string, message: string, relatedOrderId?: string, type: 'support' | 'service_request' = 'support', attachmentUrls: string[] = []) => {
        if (!user) return;
        const now = new Date().toISOString();
        const newTicket: Ticket = {
            id: `TICKET-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            subject,
            relatedOrderId,
            status: 'Ouvert',
            priority: type === 'service_request' ? 'Haute' : 'Moyenne',
            createdAt: now,
            updatedAt: now,
            messages: [{ authorId: user.id, authorName: user.name, message, date: now, attachmentUrls }],
            type,
        };
        setAllTickets(prev => [newTicket, ...prev]);
        logActivity('Ticket Created', `User ${user.name} created ticket #${newTicket.id} with subject "${subject}". Type: ${type}`);
    }, [user, setAllTickets, logActivity]);

    const handleUserReplyToTicket = useCallback((ticketId: string, message: string, attachmentUrls: string[] = []) => {
        if (!user) return;
        const now = new Date().toISOString();
        setAllTickets(prev => prev.map(t => {
            if (t.id === ticketId && (t.userId === user.id || user.role === 'superadmin')) {
                const newMessage: TicketMessage = { authorId: user.id, authorName: user.name, message, date: now, attachmentUrls };
                const newStatus = user.role === 'superadmin' ? 'En cours' : 'Ouvert';
                return { ...t, status: newStatus, updatedAt: now, messages: [...t.messages, newMessage] };
            }
            return t;
        }));
        logActivity('Ticket Reply', `User ${user.name} replied to ticket #${ticketId}.`);
    }, [user, setAllTickets, logActivity]);

    const handleAdminReplyToTicket = useCallback((ticketId: string, message: string, attachmentUrls: string[] = []) => {
        if (!user || user.role !== 'superadmin') return;
        handleUserReplyToTicket(ticketId, message, attachmentUrls);
    }, [user, handleUserReplyToTicket]);
    
    const handleAdminUpdateTicketStatus = useCallback((ticketId: string, status: TicketStatus, priority: TicketPriority) => {
         setAllTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status, priority, updatedAt: new Date().toISOString() } : t));
         logActivity('Ticket Update', `Admin updated ticket #${ticketId} status to ${status} and priority to ${priority}.`);
    }, [setAllTickets, logActivity]);

    const handleCreateOrUpdateAnnouncement = useCallback((announcement: Omit<Announcement, 'id'> | Announcement) => {
        let newAnnouncement: Announcement | null = null;
        setAllAnnouncements(prev => {
            if ('id' in announcement) {
                logActivity('Announcement Updated', `Announcement "${announcement.title}" was updated.`);
                return prev.map(a => a.id === announcement.id ? announcement : a);
            } else {
                newAnnouncement = { ...announcement, id: `ANNC-${Date.now()}` };
                logActivity('Announcement Created', `Announcement "${newAnnouncement.title}" was created.`);
                return [newAnnouncement, ...prev];
            }
        });

        if (newAnnouncement && newAnnouncement.isActive) {
             if (newAnnouncement.target === 'all' || newAnnouncement.target === 'sellers') {
                 const sellerUsers = allUsers.filter(u => u.role === 'seller');
                 sellerUsers.forEach(seller => {
                     addNotification({
                         userId: seller.id,
                         message: `Nouvelle annonce: ${newAnnouncement!.title}`,
                         link: { page: 'seller-dashboard' },
                         isRead: false
                     });
                 });
             }
        }
    }, [setAllAnnouncements, logActivity, allUsers, addNotification]);

    const handleDeleteAnnouncement = useCallback((id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
             setAllAnnouncements(prev => prev.filter(a => a.id !== id));
             logActivity('Announcement Deleted', `Announcement ID ${id} was deleted.`);
        }
    }, [setAllAnnouncements, logActivity]);

    const activeAnnouncements = useMemo(() => {
        if (!user) return [];
        const now = new Date();
        return allAnnouncements.filter(ann => {
            const targetsUser = ann.target === 'all' || (ann.target === 'customers' && user?.role === 'customer') || (ann.target === 'sellers' && user?.role === 'seller');
            return (ann.isActive && targetsUser && new Date(ann.startDate) <= now && new Date(ann.endDate) >= now && !dismissedAnnouncements.includes(ann.id));
        });
    }, [allAnnouncements, user, dismissedAnnouncements]);

    const userNotifications = useMemo(() => {
        if (!user) return [];
        if (user.role === 'superadmin') return allNotifications.slice(0, 10);
        return allNotifications.filter(n => n.userId === user.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [user, allNotifications]);

    const sellerNotifications = useMemo(() => {
        if (!user || user.role !== 'seller') return [];
        return allNotifications.filter(n => n.userId === user.id);
    }, [user, allNotifications]);

    const userOrders = useMemo(() => {
        if (!user) return [];
        return allOrders.filter(o => o.userId === user.id);
    }, [user, allOrders]);

    const handleUpdateCategoryImage = useCallback((categoryId: string, imageUrl: string) => {
        setAllCategories(prev => prev.map(c => (c.id === categoryId ? { ...c, imageUrl } : c)));
        logActivity('Category Image Updated', `Image for category ID ${categoryId} was updated.`);
    }, [setAllCategories, logActivity]);

    const handleWarnStore = useCallback((store: Store, reason: string) => {
        setAllStores(prev => prev.map(s => (s.id === store.id ? { ...s, warnings: [...s.warnings, { id: `warn-${Date.now()}`, date: new Date().toISOString(), reason }] } : s)));
        logActivity('Store Warned', `Store "${store.name}" was warned. Reason: ${reason}`);
    }, [setAllStores, logActivity]);

    const handleToggleStoreStatus = useCallback((store: Store) => {
        const newStatus = store.status === 'active' ? 'suspended' : 'active';
        setAllStores(prev => prev.map(s => (s.id === store.id ? { ...s, status: newStatus } : s)));
        logActivity('Store Status Toggled', `Store "${store.name}" was ${newStatus}.`);
    }, [setAllStores, logActivity]);

    const handleToggleStorePremiumStatus = useCallback((store: Store) => {
        const newStatus = store.premiumStatus === 'premium' ? 'standard' : 'premium';
        setAllStores(prev => prev.map(s => (s.id === store.id ? { ...s, premiumStatus: newStatus } : s)));
        logActivity('Store Premium Status Toggled', `Store "${store.name}" premium status set to ${newStatus}.`);
    }, [setAllStores, logActivity]);

    const handleApproveStore = useCallback((store: Store) => {
        setAllStores(prev => prev.map(s => s.id === store.id ? { ...s, status: 'active' } : s));
        logActivity('Store Approved', `Store "${store.name}" has been approved.`);
    }, [setAllStores, logActivity]);

    const handleRejectStore = useCallback((store: Store) => {
        setAllStores(prev => prev.filter(s => s.id !== store.id));
        logActivity('Store Rejected', `Store application for "${store.name}" was rejected and removed.`);
    }, [setAllStores, logActivity]);
    
    const handleSaveFlashSale = useCallback((flashSaleData: Omit<FlashSale, 'id'|'products'>) => {
        const newFlashSale: FlashSale = { id: `fs-${Date.now()}`, ...flashSaleData, products: [], };
        setFlashSales(prev => [newFlashSale, ...prev]);
        logActivity('Flash Sale Created', `New flash sale event "${newFlashSale.name}" created.`);
    }, [setFlashSales, logActivity]);

    const handleUpdateSellerProfile = useCallback((storeId: string, updatedData: Partial<Store>) => {
      setAllStores(prev => prev.map(s => s.id === storeId ? {...s, ...updatedData} : s));
      logActivity('Seller Profile Updated', `Profile for store ID ${storeId} updated.`);
    }, [setAllStores, logActivity]);

    const handlePayRent = useCallback((storeId: string) => {
        alert(`Simulation du paiement du loyer pour la boutique ${storeId}.`);
        setAllStores(stores => stores.map(s => s.id === storeId ? {...s, subscriptionStatus: 'active', subscriptionDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()} : s));
        logActivity('Rent Paid', `Rent paid for store ID ${storeId}.`);
    }, [setAllStores, logActivity]);
    
    const handleUpdateSiteSettings = useCallback((newSettings: SiteSettings) => {
        setSiteSettings(newSettings);
        logActivity('Site Settings Updated', 'Global site settings have been modified.');
    }, [setSiteSettings, logActivity]);

    const handleUpdatePaymentMethods = useCallback((newMethods: PaymentMethod[]) => {
      setPaymentMethods(newMethods);
      logActivity('Payment Methods Updated', 'Available payment methods have been updated.');
    }, [setPaymentMethods, logActivity]);

    const handleUpdateUser = useCallback((userId: string, updates: Partial<User>) => {
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      logActivity('User Updated by Admin', `User account ${userId} was updated.`);
    }, [setAllUsers, logActivity]);

    const handleCreateUserByAdmin = useCallback((userData: Omit<User, 'id' | 'loyalty' | 'password' | 'addresses' | 'followedStores'>) => {
        const newUser: User = { id: `user-${Date.now()}`, ...userData, password: 'password', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], };
        setAllUsers(prev => [...prev, newUser]);
        logActivity('User Created by Admin', `New user ${newUser.name} (${newUser.role}) created.`);
    }, [setAllUsers, logActivity]);
    
    const handleSanctionAgent = useCallback((agentId: string, reason: string) => {
        setAllUsers(prev => prev.map(u => u.id === agentId ? { ...u, warnings: [...(u.warnings || []), { id: `warn-${Date.now()}`, date: new Date().toISOString(), reason }] } : u));
        logActivity('Agent Sanctioned', `Agent ID ${agentId} was sanctioned. Reason: ${reason}.`);
    }, [setAllUsers, logActivity]);
    
    const handleUpdateSiteContent = useCallback((newContent: SiteContent[]) => {
        setSiteContent(newContent);
        logActivity('Site Content Updated', 'Static site content has been modified.');
    }, [setSiteContent, logActivity]);
    
    const handleToggleChatFeature = useCallback(() => setIsChatEnabled(prev => !prev), []);
    const handleToggleComparisonFeature = useCallback(() => setIsComparisonEnabled(prev => !prev), []);
    
    const handleAddPickupPoint = useCallback((pointData: Omit<PickupPoint, 'id'>) => {
        const newPoint = { ...pointData, id: `pp-${Date.now()}` };
        setAllPickupPoints(prev => [...prev, newPoint]);
        logActivity('Pickup Point Added', `New point "${newPoint.name}" created.`);
    }, [setAllPickupPoints, logActivity]);

    const handleUpdatePickupPoint = useCallback((updatedPoint: PickupPoint) => {
        setAllPickupPoints(prev => prev.map(p => p.id === updatedPoint.id ? updatedPoint : p));
        logActivity('Pickup Point Updated', `Point "${updatedPoint.name}" updated.`);
    }, [setAllPickupPoints, logActivity]);

    const handleDeletePickupPoint = useCallback((pointId: string) => {
        setAllPickupPoints(prev => prev.filter(p => p.id !== pointId));
        logActivity('Pickup Point Deleted', `Point ID ${pointId} deleted.`);
    }, [setAllPickupPoints, logActivity]);
    
    const handlePayoutSeller = useCallback((store: Store, amount: number) => {
        if (amount <= 0) { alert("Le solde est nul ou négatif. Aucun paiement à effectuer."); return; }
        const newPayout: Payout = { storeId: store.id, amount, date: new Date().toISOString() };
        setPayouts(prev => [...prev, newPayout]);
        const sellerUser = allUsers.find(u => u.role === 'seller' && u.shopName === store.name);
        if (sellerUser) {
            addNotification({
                userId: sellerUser.id,
                message: `Un paiement de ${amount.toLocaleString('fr-CM')} FCFA a été traité pour votre boutique.`,
                link: { page: 'seller-dashboard', params: { tab: 'finances' } },
                isRead: false
            });
        }
        logActivity('Seller Payout', `Paid ${amount} to store "${store.name}".`);
    }, [setPayouts, logActivity, allUsers, addNotification]);

    const handleActivateSubscription = useCallback((store: Store) => {
        setAllStores(prev => prev.map(s => s.id === store.id ? {...s, subscriptionStatus: 'active', subscriptionDueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString() } : s));
        logActivity('Subscription Activated', `Subscription for store "${store.name}" was activated.`);
    }, [setAllStores, logActivity]);
    
    const handleAddAdvertisement = useCallback((ad: Omit<Advertisement, 'id'>) => {
        setAdvertisements(prev => [...prev, { ...ad, id: `ad-${Date.now()}` }]);
        logActivity('Advertisement Added', 'A new advertisement was created.');
    }, [setAdvertisements, logActivity]);

    const handleUpdateAdvertisement = useCallback((ad: Advertisement) => {
        setAdvertisements(prev => prev.map(a => a.id === ad.id ? ad : a));
        logActivity('Advertisement Updated', `Advertisement ID ${ad.id} was updated.`);
    }, [setAdvertisements, logActivity]);

    const handleDeleteAdvertisement = useCallback((adId: string) => {
        setAdvertisements(prev => prev.filter(a => a.id !== adId));
        logActivity('Advertisement Deleted', `Advertisement ID ${adId} was deleted.`);
    }, [setAdvertisements, logActivity]);

    const handleCreateOrUpdateCollection = useCallback((storeId: string, collection: Omit<ProductCollection, 'id' | 'storeId'> | ProductCollection) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                const collections = s.collections || [];
                if ('id' in collection) { // Update
                    logActivity('Collection Updated', `Collection "${collection.name}" was updated for store "${s.name}".`);
                    return { ...s, collections: collections.map(c => c.id === collection.id ? collection : c) };
                } else { // Create
                    const newCollection: ProductCollection = { ...collection, id: `coll-${Date.now()}`, storeId };
                    logActivity('Collection Created', `Collection "${newCollection.name}" was created for store "${s.name}".`);
                    return { ...s, collections: [...collections, newCollection] };
                }
            }
            return s;
        }));
    }, [setAllStores, logActivity]);

    const handleDeleteCollection = useCallback((storeId: string, collectionId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette collection ?")) {
            setAllStores(prev => prev.map(s => {
                if (s.id === storeId) {
                    const collectionName = s.collections?.find(c => c.id === collectionId)?.name || 'Unknown Collection';
                    logActivity('Collection Deleted', `Collection "${collectionName}" was deleted from store "${s.name}".`);
                    return { ...s, collections: (s.collections || []).filter(c => c.id !== collectionId) };
                }
                return s;
            }));
        }
    }, [setAllStores, logActivity]);

    const handleSelectOrder = (order: Order) => {
        setSelectedOrder(order);
        handleNavigate('order-detail');
    };

    const handleInfoPageNavigation = useCallback((slug: string) => {
        const content = siteContent.find(c => c.slug === slug);
        if (content) {
            setInfoPageContent(content);
            handleNavigate('info');
        } else {
            if (slug === 'sell') {
                handleNavigate('become-seller');
            }
        }
    }, [siteContent, handleNavigate]);

    // Filtered data for dashboards
    const sellerStore = user?.shopName ? allStores.find(s => s.name === user.shopName) : undefined;
    const sellerProducts = user?.shopName ? allProducts.filter(p => p.vendor === user.shopName) : [];
    const sellerOrders = useMemo(() => user?.shopName ? allOrders.filter(o => o.items.some(i => i.vendor === user.shopName)) : [], [user, allOrders]);
    const sellerPromoCodes = user ? allPromoCodes.filter(pc => pc.sellerId === user.id) : [];
    const depotAgent = user?.role === 'depot_agent' ? user : undefined;

    const renderPage = () => {
        if (siteSettings.maintenanceMode.isEnabled && user?.role !== 'superadmin') {
            return <MaintenancePage message={siteSettings.maintenanceMode.message} reopenDate={siteSettings.maintenanceMode.reopenDate} />;
        }
    
        switch (page) {
            case 'home':
                return <HomePage categories={allCategories} products={visibleProducts} stores={allStores} flashSales={flashSales} advertisements={advertisements.filter(ad => ad.isActive)} onProductClick={handleProductClick} onCategoryClick={handleCategoryClick} onVendorClick={handleVendorClick} onVisitStore={handleVendorClick} onViewStories={setViewingStoriesOfStore} isComparisonEnabled={isComparisonEnabled} isStoriesEnabled={siteSettings.isStoriesEnabled} recentlyViewedIds={recentlyViewedIds} userOrders={userOrders} wishlist={wishlist} />;
            case 'product':
                return selectedProduct ? <ProductDetail product={selectedProduct} allProducts={visibleProducts} allUsers={allUsers} stores={allStores} flashSales={flashSales} onBack={() => window.history.back()} onAddReview={handleAddReview} onVendorClick={handleVendorClick} onProductClick={handleProductClick} onOpenLogin={() => setIsLoginModalOpen(true)} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onProductView={handleProductView} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'cart':
                return <CartView onBack={() => handleNavigate('home')} onNavigateToCheckout={() => handleNavigate('checkout')} flashSales={flashSales} allPromoCodes={allPromoCodes} appliedPromoCode={appliedPromoCode} onApplyPromoCode={onApplyPromoCode} />;
            case 'checkout':
                return <Checkout onBack={() => handleNavigate('cart')} onOrderConfirm={handlePlaceOrder} flashSales={flashSales} allPickupPoints={allPickupPoints} appliedPromoCode={appliedPromoCode} allStores={allStores} siteSettings={siteSettings} paymentMethods={paymentMethods} />;
            case 'order-success':
                return selectedOrder ? <OrderSuccess order={selectedOrder} onNavigateHome={() => handleNavigate('home', resetSelections)} onNavigateToOrders={() => handleNavigateToAccount('orders')} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'stores':
                return <StoresPage stores={allStores.filter(s => s.status === 'active')} onBack={() => handleNavigate('home')} onVisitStore={handleVendorClick} onNavigateToStoresMap={() => handleNavigate('stores-map')} />;
            case 'stores-map':
                return <StoresMapPage stores={allStores.filter(s => s.status === 'active' && s.latitude && s.longitude)} onBack={() => handleNavigate('stores')} onVisitStore={handleVendorClick} />;
            case 'become-seller':
                if (!user) {
                    return (
                        <div className="container mx-auto px-6 py-24 text-center">
                            <h2 className="text-3xl font-bold dark:text-white">Devenez vendeur</h2>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Vous devez être connecté pour créer une boutique.</p>
                            <button 
                                onClick={() => setIsLoginModalOpen(true)} 
                                className="mt-6 bg-kmer-green text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Se connecter / S'inscrire
                            </button>
                        </div>
                    );
                }
                if (user.role === 'seller') {
                    return (
                        <div className="container mx-auto px-6 py-24 text-center">
                             <h2 className="text-3xl font-bold dark:text-white">Vous êtes déjà vendeur !</h2>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Vous pouvez gérer votre boutique depuis votre tableau de bord.</p>
                            <button 
                                onClick={() => handleNavigate('seller-dashboard')}
                                className="mt-6 bg-kmer-green text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Aller à mon tableau de bord
                            </button>
                        </div>
                    );
                }
                return <BecomeSeller onBack={() => handleNavigate('home')} onBecomeSeller={handleBecomeSeller} onRegistrationSuccess={() => handleNavigate('seller-dashboard')} siteSettings={siteSettings} />;
            case 'category':
                return selectedCategoryId ? <CategoryPage categoryId={selectedCategoryId} allCategories={allCategories} allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home', resetSelections)} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'seller-dashboard':
                return sellerStore ? <SellerDashboard store={sellerStore} products={sellerProducts} categories={allCategories} flashSales={flashSales} sellerOrders={sellerOrders} promoCodes={sellerPromoCodes} onBack={() => handleNavigate('home')} onAddProduct={() => { setProductToEdit(null); handleNavigate('product-form'); }} onEditProduct={(p) => { setProductToEdit(p); handleNavigate('product-form'); }} onDeleteProduct={handleDeleteProduct} onUpdateProductStatus={handleUpdateProductStatus} onNavigateToProfile={() => handleNavigate('seller-profile')} onNavigateToAnalytics={() => handleNavigate('seller-analytics-dashboard')} onSetPromotion={setPromotionModalProduct} onRemovePromotion={handleRemovePromotion} onProposeForFlashSale={handleProposeForFlashSale} onUploadDocument={handleUploadDocument} onUpdateOrderStatus={handleUpdateOrderWithSeller} onCreatePromoCode={handleCreatePromoCode} onDeletePromoCode={handleDeletePromoCode} isChatEnabled={isChatEnabled} onPayRent={handlePayRent} siteSettings={siteSettings} onAddStory={handleAddStory} onDeleteStory={handleDeleteStory} payouts={payouts} onSellerDisputeMessage={handleSellerDisputeMessage} onBulkUpdateProducts={handleBulkUpdateProducts} onReplyToReview={handleReplyToReview} onCreateOrUpdateCollection={handleCreateOrUpdateCollection} onDeleteCollection={handleDeleteCollection} initialTab={initialSellerTab} sellerNotifications={sellerNotifications} onMarkNotificationAsRead={handleMarkNotificationAsRead} onNavigateFromNotification={handleNavigateFromNotification} onCreateTicket={handleCreateTicket} allTickets={allTickets} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'seller-analytics-dashboard':
                return sellerStore ? <SellerAnalyticsDashboard onBack={() => handleNavigate('seller-dashboard')} sellerOrders={sellerOrders} sellerProducts={sellerProducts} flashSales={flashSales} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'vendor-page':
                return selectedVendor ? <VendorPage vendorName={selectedVendor} allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home', resetSelections)} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'product-form':
                return sellerStore ? <ProductForm onSave={handleAddProduct} onCancel={() => handleNavigate('seller-dashboard')} productToEdit={productToEdit} categories={allCategories} onAddCategory={() => ({} as Category)} siteSettings={siteSettings} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'seller-profile':
                return sellerStore ? <SellerProfile store={sellerStore} onBack={() => handleNavigate('seller-dashboard')} onUpdateProfile={handleUpdateSellerProfile} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'superadmin-dashboard':
                return user?.role === 'superadmin' ? <SuperAdminDashboard allUsers={allUsers} allOrders={allOrders} allCategories={allCategories} allStores={allStores} allProducts={allProducts} siteActivityLogs={siteActivityLogs} onUpdateOrderStatus={handleUpdateOrderWithAdmin} onUpdateCategoryImage={handleUpdateCategoryImage} onWarnStore={handleWarnStore} onToggleStoreStatus={handleToggleStoreStatus} onToggleStorePremiumStatus={handleToggleStorePremiumStatus} onApproveStore={handleApproveStore} onRejectStore={handleRejectStore} onSaveFlashSale={handleSaveFlashSale} flashSales={flashSales} onUpdateFlashSaleSubmissionStatus={handleUpdateFlashSaleSubmissionStatus} onBatchUpdateFlashSaleStatus={handleBatchUpdateFlashSaleStatus} onRequestDocument={handleRequestDocument} onVerifyDocumentStatus={handleVerifyDocumentStatus} allPickupPoints={allPickupPoints} onAddPickupPoint={handleAddPickupPoint} onUpdatePickupPoint={handleUpdatePickupPoint} onDeletePickupPoint={handleDeletePickupPoint} onAssignAgent={handleAssignAgent} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onToggleChatFeature={handleToggleChatFeature} onToggleComparisonFeature={handleToggleComparisonFeature} siteSettings={siteSettings} onUpdateSiteSettings={handleUpdateSiteSettings} onAdminAddCategory={handleAdminAddCategory} onAdminDeleteCategory={handleAdminDeleteCategory} onUpdateUser={handleUpdateUser} payouts={payouts} onPayoutSeller={handlePayoutSeller} onActivateSubscription={handleActivateSubscription} advertisements={advertisements} onAddAdvertisement={handleAddAdvertisement} onUpdateAdvertisement={handleUpdateAdvertisement} onDeleteAdvertisement={handleDeleteAdvertisement} onCreateUserByAdmin={handleCreateUserByAdmin} onSanctionAgent={handleSanctionAgent} onResolveRefund={handleResolveRefund} onAdminStoreMessage={(orderId, msg) => handleAdminDisputeMessage(orderId, msg, 'admin')} onAdminCustomerMessage={(orderId, msg) => handleAdminDisputeMessage(orderId, msg, 'admin')} siteContent={siteContent} onUpdateSiteContent={handleUpdateSiteContent} allTickets={allTickets} allAnnouncements={allAnnouncements} onAdminReplyToTicket={handleAdminReplyToTicket} onAdminUpdateTicketStatus={handleAdminUpdateTicketStatus} onCreateOrUpdateAnnouncement={handleCreateOrUpdateAnnouncement} onDeleteAnnouncement={handleDeleteAnnouncement} onReviewModeration={handleReviewModeration} paymentMethods={paymentMethods} onUpdatePaymentMethods={handleUpdatePaymentMethods} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
// FIX: Correctly import named export 'DeliveryAgentDashboard'
            case 'delivery-agent-dashboard':
                return user?.role === 'delivery_agent' ? <DeliveryAgentDashboard allOrders={allOrders} allStores={allStores} allPickupPoints={allPickupPoints} onUpdateOrder={handleUpdateOrderFromAgent} onLogout={handleLogout} onUpdateUserAvailability={handleUpdateUserAvailability}/> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'depot-agent-dashboard':
                return depotAgent ? <DepotAgentDashboard user={depotAgent} allUsers={allUsers} allOrders={allOrders} onCheckIn={handleCheckIn} onReportDiscrepancy={handleReportDiscrepancy} onLogout={handleLogout} onProcessDeparture={handleProcessDeparture} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'comparison':
                return <ComparisonPage onProductClick={handleProductClick} onBack={() => handleNavigate('home')} />;
            case 'become-premium':
                return user?.role === 'customer' ? <BecomePremiumPage siteSettings={siteSettings} onBack={() => handleNavigate('home')} onBecomePremiumByCaution={handleBecomePremiumByCaution} onUpgradeToPremiumPlus={handleUpgradeToPremiumPlus} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'info':
                return <InfoPage title={infoPageContent.title} content={infoPageContent.content} onBack={() => handleNavigate('home')} />;
            case 'not-found':
                return <NotFoundPage onNavigateHome={() => handleNavigate('home', resetSelections)} />;
            case 'forbidden':
                return <ForbiddenPage onNavigateHome={() => handleNavigate('home', resetSelections)} />;
            case 'server-error':
                return <ServerErrorPage onNavigateHome={() => handleNavigate('home', resetSelections)} />;
            case 'reset-password':
                return emailForPasswordReset ? <ResetPasswordPage onPasswordReset={handlePasswordReset} onNavigateLogin={handleNavigateLoginFromReset} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'account':
                return user ? <AccountPage onBack={() => handleNavigate('home')} initialTab={activeAccountTab} allStores={allStores} userOrders={userOrders} allTickets={allTickets} onVendorClick={handleVendorClick} onCreateTicket={handleCreateTicket} onUserReplyToTicket={handleUserReplyToTicket} onSelectOrder={handleSelectOrder} onRepeatOrder={handleRepeatOrder} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'seller-analytics-dashboard':
                return sellerStore ? <SellerAnalyticsDashboard onBack={() => handleNavigate('seller-dashboard')} sellerOrders={sellerOrders} sellerProducts={sellerProducts} flashSales={flashSales} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'visual-search':
                return <VisualSearchPage onSearch={handleSearch} />;
            case 'search-results':
                return <SearchResultsPage 
                    searchQuery={searchQuery} 
                    products={visibleProducts} 
                    onProductClick={handleProductClick} 
                    onVendorClick={handleVendorClick}
                    onBack={() => handleNavigate('home', resetSelections)} 
                    stores={allStores} 
                    flashSales={flashSales} 
                    isComparisonEnabled={isComparisonEnabled} 
                />;
            default:
                return <HomePage categories={allCategories} products={visibleProducts} stores={allStores} flashSales={flashSales} advertisements={advertisements.filter(ad => ad.isActive)} onProductClick={handleProductClick} onCategoryClick={handleCategoryClick} onVendorClick={handleVendorClick} onVisitStore={handleVendorClick} onViewStories={setViewingStoriesOfStore} isComparisonEnabled={isComparisonEnabled} isStoriesEnabled={siteSettings.isStoriesEnabled} recentlyViewedIds={recentlyViewedIds} userOrders={userOrders} wishlist={wishlist} />;
        }
    };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {activeAnnouncements.map(ann => (
        <AnnouncementBanner key={ann.id} announcement={ann} onDismiss={(id) => setDismissedAnnouncements(prev => [...prev, id])} />
      ))}
      <Header
        categories={allCategories}
        onNavigateHome={() => handleNavigate('home', resetSelections)}
        onNavigateCart={() => handleNavigate('cart')}
        onNavigateToStores={() => handleNavigate('stores')}
        onNavigateToPromotions={() => handleNavigate('promotions')}
        onNavigateToCategory={handleCategoryClick}
        onNavigateToBecomeSeller={() => handleNavigate('become-seller')}
        onNavigateToSellerDashboard={() => handleNavigate('seller-dashboard')}
        onNavigateToSellerProfile={() => handleNavigate('seller-profile')}
        onNavigateToOrderHistory={() => handleNavigateToAccount('orders')}
        onNavigateToSuperAdminDashboard={() => handleNavigate('superadmin-dashboard')}
        onNavigateToFlashSales={() => handleNavigate('flash-sales')}
        onNavigateToWishlist={() => handleNavigate('wishlist')}
        onNavigateToDeliveryAgentDashboard={() => handleNavigate('delivery-agent-dashboard')}
        onNavigateToDepotAgentDashboard={() => handleNavigate('depot-agent-dashboard')}
        onNavigateToBecomePremium={() => handleNavigate('become-premium')}
        onNavigateToAccount={handleNavigateToAccount}
        onNavigateToVisualSearch={() => handleNavigate('visual-search')}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onSearch={handleSearch}
        isChatEnabled={isChatEnabled}
        isPremiumProgramEnabled={siteSettings.isPremiumProgramEnabled}
        logoUrl={siteSettings.logoUrl}
        onLoginSuccess={handleLoginSuccess}
        notifications={userNotifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onNavigateFromNotification={handleNavigateFromNotification}
      />
      <main className="flex-grow">
        {renderPage()}
      </main>
      <Footer onNavigate={handleInfoPageNavigation} logoUrl={siteSettings.logoUrl} paymentMethods={paymentMethods} />
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} onForgotPassword={handleOpenForgotPassword} />}
      {isForgotPasswordModalOpen && <ForgotPasswordModal onClose={() => setIsForgotPasswordModalOpen(false)} onEmailSubmit={handleForgotPasswordSubmit} />}
      {isModalOpen && modalProduct && <AddToCartModal product={modalProduct} onClose={uiCloseModal} onNavigateToCart={() => { uiCloseModal(); handleNavigate('cart'); }} />}
      {isChatEnabled && user && <ChatWidget allUsers={allUsers} allProducts={allProducts} allCategories={allCategories} />}
      {isComparisonEnabled && comparisonList.length > 0 && <ComparisonBar />}
      {/* FIX: Use 'StoryViewer' component instead of 'Story' type */}
      {viewingStoriesOfStore && <StoryViewer store={viewingStoriesOfStore} onClose={() => setViewingStoriesOfStore(null)} />}
    </div>
  );
}