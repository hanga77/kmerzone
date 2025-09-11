





import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProductDetail from './components/ProductDetail';
import CartView from './components/Cart';
import Checkout from './components/Checkout';
import OrderSuccess from './components/OrderSuccess';
import LoginModal from './components/LoginModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ResetPasswordPage from './components/ResetPasswordPage';
import StoresPage from './components/StoresPage';
import StoresMapPage from './components/StoresMapPage';
import BecomeSeller from './components/BecomeSeller';
import CategoryPage from './components/CategoryPage';
import { SellerDashboard } from './components/SellerDashboard';
import VendorPage from './components/VendorPage';
import ProductForm from './components/ProductForm';
import SellerProfile from './components/SellerProfile';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import OrderHistoryPage from './components/OrderHistoryPage';
import { OrderDetailPage } from './components/OrderDetailPage';
import PromotionsPage from './components/PromotionsPage';
import FlashSalesPage from './components/FlashSalesPage';
import SearchResultsPage from './components/SearchResultsPage';
import WishlistPage from './components/WishlistPage';
import { DeliveryAgentDashboard } from './components/DeliveryAgentDashboard';
import { DepotAgentDashboard } from './components/DepotAgentDashboard';
import ComparisonPage from './components/ComparisonPage';
import ComparisonBar from './components/ComparisonBar';
import BecomePremiumPage from './components/BecomePremiumPage';
import InfoPage from './components/InfoPage';
import MaintenancePage from './components/MaintenancePage';
import NotFoundPage from './components/NotFoundPage';
import ForbiddenPage from './components/ForbiddenPage';
import ServerErrorPage from './components/ServerErrorPage';
import AccountPage from './components/AccountPage';
import { useAuth } from './contexts/AuthContext';
import { useComparison } from './contexts/ComparisonContext';
import type { Product, Category, Store, Review, Order, Address, OrderStatus, User, SiteActivityLog, FlashSale, DocumentStatus, PickupPoint, NewOrderData, TrackingEvent, PromoCode, Warning, SiteSettings, CartItem, UserRole, Payout, Advertisement, Discrepancy, Story, UserAvailabilityStatus, DisputeMessage, StatusChangeLogEntry, FlashSaleProduct, RequestedDocument, SiteContent, Ticket, TicketMessage, TicketStatus, TicketPriority, Announcement, PaymentMethod, Page, Notification, ProductCollection } from './types';
import AddToCartModal from './components/AddToCartModal';
import { useUI } from './contexts/UIContext';
import StoryViewer from './components/StoryViewer';
import PromotionModal from './components/PromotionModal';
import { useCart } from './contexts/CartContext';
import { useWishlist } from './contexts/WishlistContext';
import ChatWidget from './components/ChatWidget';
import { ArrowLeftIcon, BarChartIcon, ShieldCheckIcon, CurrencyDollarIcon, ShoppingBagIcon, UsersIcon, StarIcon, XIcon, ArchiveBoxIcon } from './components/Icons';
import { usePersistentState } from './hooks/usePersistentState';
import VisualSearchPage from './components/VisualSearchPage';
import { apiFetch } from './utils/api';


const getActiveFlashSalePrice = (productId: string, flashSales: FlashSale[]): number | null => {
    const now = new Date();
    for (const sale of flashSales) {
        const startDate = new Date(sale.startDate);
        const endDate = new Date(sale.endDate);
        if (now >= startDate && now <= endDate) {
            const productInSale = sale.products.find(p => p.productId === productId && p.status === 'approved');
            if (productInSale) return productInSale.flashPrice;
        }
    }
    return null;
}

const isPromotionActive = (product: Product): boolean => {
  if (!product.promotionPrice || product.promotionPrice >= product.price) {
    return false;
  }
  const now = new Date();
  const startDate = product.promotionStartDate ? new Date(product.promotionStartDate + 'T00:00:00') : null;
  const endDate = product.promotionEndDate ? new Date(product.promotionEndDate + 'T23:59:59') : null;

  if (!startDate && !endDate) return false;
  if (startDate && endDate) return now >= startDate && now <= endDate;
  if (startDate) return now >= startDate;
  if (endDate) return now <= endDate;
  
  return false; 
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number, color: string, change?: number | null }> = ({ icon, label, value, color, change }) => (
    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                {change !== undefined && change !== null && (
                     <span className={`text-sm font-semibold flex items-center ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {change >= 0 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        )}
                        {Math.abs(change).toFixed(1)}%
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    </div>
);


const SellerAnalyticsDashboard: React.FC<{
    onBack: () => void;
    sellerOrders: Order[];
    sellerProducts: Product[];
    flashSales: FlashSale[];
}> = ({ onBack, sellerOrders, sellerProducts, flashSales }) => {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'all'>('all');
    
    const { analytics, comparisonAnalytics } = useMemo(() => {
        const getFinalPrice = (item: CartItem) => {
            const flashPrice = getActiveFlashSalePrice(item.id, flashSales);
            if (flashPrice !== null) return flashPrice;
            if (isPromotionActive(item)) return item.promotionPrice!;
            return item.price;
        };

        const now = new Date();
        const deliveredOrders = sellerOrders.filter(o => o.status === 'delivered');

        const filterOrdersByDate = (orders: Order[], range: 'current' | 'previous') => {
            return orders.filter(o => {
                const orderDate = new Date(o.orderDate);
                if (timeRange === 'all') return range === 'current'; 

                const cutoffDate = new Date();
                const prevCutoffDate = new Date();
                let periodDays = 0;

                if (timeRange === 'week') periodDays = 7;
                if (timeRange === 'month') periodDays = 30;
                if (timeRange === 'quarter') periodDays = 90;

                cutoffDate.setDate(now.getDate() - periodDays);
                prevCutoffDate.setDate(now.getDate() - (periodDays * 2));

                if (range === 'current') {
                    return orderDate >= cutoffDate;
                } else {
                    return orderDate >= prevCutoffDate && orderDate < cutoffDate;
                }
            });
        };
        
        const currentPeriodOrders = filterOrdersByDate(deliveredOrders, 'current');
        const previousPeriodOrders = filterOrdersByDate(deliveredOrders, 'previous');

        const calculateRevenue = (orders: Order[]) => orders.reduce((sum, order) => {
             const sellerItemsTotal = order.items.reduce((itemSum, item) => itemSum + getFinalPrice(item) * item.quantity, 0);
             return sum + sellerItemsTotal;
        }, 0);

        const totalRevenue = calculateRevenue(currentPeriodOrders);
        const previousTotalRevenue = calculateRevenue(previousPeriodOrders);

        let revenueChangePercentage: number | null = null;
        if (timeRange !== 'all') {
            if (previousTotalRevenue > 0) {
                revenueChangePercentage = ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100;
            } else if (totalRevenue > 0) {
                revenueChangePercentage = 100;
            } else {
                revenueChangePercentage = 0;
            }
        }
        
        const totalDeliveredOrders = currentPeriodOrders.length;
        const totalItemsSold = currentPeriodOrders.flatMap(o => o.items).reduce((sum, item) => sum + item.quantity, 0);
        const averageOrderValue = totalDeliveredOrders > 0 ? totalRevenue / totalDeliveredOrders : 0;

        const topProducts = currentPeriodOrders
            .flatMap(o => o.items)
            .reduce((acc, item) => {
                const existing = acc.find(p => p.id === item.id);
                const revenue = getFinalPrice(item) * item.quantity;
                if (existing) {
                    existing.revenue += revenue;
                    existing.quantitySold += item.quantity;
                } else {
                    acc.push({ id: item.id, name: item.name, revenue, quantitySold: item.quantity });
                }
                return acc;
            }, [] as { id: string; name: string; revenue: number; quantitySold: number }[]);
        
        const sortedTopProducts = topProducts.sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        let salesChartData: { label: string; revenue: number }[] = [];
        const getOrderTotal = (order: Order) => order.items.reduce((sum, item) => sum + getFinalPrice(item) * item.quantity, 0);

        if (timeRange === 'week') {
            const last7Days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d; });
            const dailySales = currentPeriodOrders.reduce((acc, order) => {
                const day = new Date(order.orderDate).toLocaleDateString('fr-CM', { day: '2-digit', month: '2-digit' });
                acc[day] = (acc[day] || 0) + getOrderTotal(order);
                return acc;
            }, {} as Record<string, number>);
            salesChartData = last7Days.map(d => {
                const label = d.toLocaleDateString('fr-CM', { day: '2-digit', month: '2-digit' });
                return { label: d.toLocaleDateString('fr-CM', { weekday: 'short' }), revenue: dailySales[label] || 0 };
            }).reverse();
        } else if (timeRange === 'month') {
            const last4WeeksLabels = ['-3 sem.', '-2 sem.', '-1 sem.', 'Cette sem.'];
            const weeklySales = currentPeriodOrders.reduce((acc, order) => {
                const weekIndex = Math.floor((now.getTime() - new Date(order.orderDate).getTime()) / (1000 * 60 * 60 * 24 * 7));
                if (weekIndex < 4) acc[3 - weekIndex] = (acc[3 - weekIndex] || 0) + getOrderTotal(order);
                return acc;
            }, [] as number[]);
            salesChartData = last4WeeksLabels.map((label, i) => ({ label, revenue: weeklySales[i] || 0 }));
        } else { // quarter or all
            const numMonths = (timeRange === 'quarter') ? 3 : (timeRange === 'all' ? 6 : 0);
            const monthLabels = Array.from({ length: numMonths }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return d; }).reverse();
            const monthlySales = currentPeriodOrders.reduce((acc, order) => {
                const month = new Date(order.orderDate).toLocaleString('fr-CM', { month: 'short', year: '2-digit' });
                acc[month] = (acc[month] || 0) + getOrderTotal(order);
                return acc;
            }, {} as Record<string, number>);
            salesChartData = monthLabels.map(d => {
                const label = d.toLocaleString('fr-CM', { month: 'short', year: '2-digit' });
                return { label, revenue: monthlySales[label] || 0 };
            });
        }
        
        return {
            analytics: {
                totalRevenue,
                totalOrders: totalDeliveredOrders,
                totalItemsSold,
                averageOrderValue,
                topProducts: sortedTopProducts,
                salesChartData
            },
            comparisonAnalytics: {
                revenueChangePercentage,
            }
        };
    }, [sellerOrders, flashSales, timeRange]);

    const lowStockProducts = useMemo(() => {
        return sellerProducts.filter(p => p.stock < 5).slice(0, 5);
    }, [sellerProducts]);

    const TimeRangeButton: React.FC<{ label: string; value: typeof timeRange; }> = ({ label, value }) => {
        const isActive = timeRange === value;
        return (
             <button
                onClick={() => setTimeRange(value)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    isActive ? 'bg-kmer-green text-white shadow' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="container mx-auto p-4 sm:p-8 animate-in bg-gray-50 dark:bg-gray-900">
            <button onClick={onBack} className="text-kmer-green font-semibold mb-6 inline-flex items-center gap-2">
                <ArrowLeftIcon className="w-5 h-5"/>
                Retour au tableau de bord
            </button>
            <div className="flex items-center gap-3 mb-4">
                <BarChartIcon className="w-8 h-8"/>
                <h1 className="text-3xl font-bold">Analyse des Ventes</h1>
            </div>
             <div className="flex items-center gap-2 mb-8 flex-wrap">
                <p className="font-semibold text-sm">Période :</p>
                <TimeRangeButton label="7 jours" value="week" />
                <TimeRangeButton label="30 jours" value="month" />
                <TimeRangeButton label="90 jours" value="quarter" />
                <TimeRangeButton label="Tout" value="all" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    icon={<CurrencyDollarIcon className="w-7 h-7"/>} 
                    label={`Revenu Total (Livré)${timeRange !== 'all' ? ' - vs période précédente' : ''}`}
                    value={`${analytics.totalRevenue.toLocaleString('fr-CM')} FCFA`} 
                    color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"
                    change={comparisonAnalytics.revenueChangePercentage}
                />
                <StatCard icon={<ShoppingBagIcon className="w-7 h-7"/>} label="Commandes Livrées" value={analytics.totalOrders} color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" />
                <StatCard icon={<ArchiveBoxIcon className="w-7 h-7"/>} label="Articles Vendus" value={analytics.totalItemsSold} color="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300" />
                <StatCard icon={<StarIcon className="w-7 h-7"/>} label="Panier Moyen" value={`${analytics.averageOrderValue.toLocaleString('fr-CM', { maximumFractionDigits: 0 })} FCFA`} color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm p-6 h-full">
                    <h2 className="text-xl font-bold mb-4">Évolution des Ventes</h2>
                    <div className="flex justify-around items-end h-64 border-l border-b border-gray-200 dark:border-gray-700 pl-4 pb-4">
                        {analytics.salesChartData.map(({ label, revenue }) => (
                             <div key={label} className="flex flex-col items-center h-full justify-end" title={`${revenue.toLocaleString('fr-CM')} FCFA`}>
                                <div className="w-8 bg-kmer-green rounded-t-md hover:bg-green-700" style={{ height: `${(revenue / Math.max(...analytics.salesChartData.map(d => d.revenue), 1)) * 100}%` }}></div>
                                <p className="text-xs mt-1">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold mb-4">Top 5 Produits (par revenu)</h2>
                        <ul className="space-y-3">
                            {analytics.topProducts.map((product) => (
                                <li key={product.id} className="flex justify-between items-center text-sm">
                                    <div>
                                        <span className="font-medium dark:text-gray-200">{product.name}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({product.quantitySold} vendus)</span>
                                    </div>
                                    <span className="font-bold text-kmer-green">{product.revenue.toLocaleString('fr-CM')} FCFA</span>
                                </li>
                            ))}
                             {analytics.topProducts.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aucune donnée de vente pour cette période.</p>}
                        </ul>
                    </div>
                     <div className="bg-orange-50 dark:bg-orange-900/50 rounded-lg shadow-sm p-6 border-l-4 border-orange-400">
                        <h2 className="text-xl font-bold mb-4 text-orange-800 dark:text-orange-200">Alertes Stock Faible (&lt; 5)</h2>
                        <ul className="space-y-2">
                            {lowStockProducts.map(p => (
                                <li key={p.id} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-orange-700 dark:text-orange-300">{p.name}</span>
                                    <span className="font-bold text-orange-600 dark:text-orange-400">{p.stock} restant(s)</span>
                                </li>
                            ))}
                            {lowStockProducts.length === 0 && <p className="text-sm text-orange-700 dark:text-orange-300">Aucun produit en stock faible.</p>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnnouncementBanner: React.FC<{ announcement: Announcement; onDismiss: (id: string) => void; }> = ({ announcement, onDismiss }) => (
    <div className="bg-kmer-yellow text-gray-900 p-3 text-center text-sm font-semibold relative animate-in fade-in-0 slide-in-from-top-5">
        <span>{announcement.title}: {announcement.content}</span>
        <button onClick={() => onDismiss(announcement.id)} className="absolute top-1/2 right-4 -translate-y-1/2 hover:bg-black/10 p-1 rounded-full">
            <XIcon className="w-5 h-5" />
        </button>
    </div>
);


export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingStoriesOfStore, setViewingStoriesOfStore] = useState<Store | null>(null);
  const [infoPageContent, setInfoPageContent] = useState({ title: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAccountTab, setActiveAccountTab] = useState('profile');
  const [recentlyViewedIds, setRecentlyViewedIds] = usePersistentState<string[]>('recentlyViewed', []);
  const [initialSellerTab, setInitialSellerTab] = useState('overview');

  // API-driven state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allPromoCodes, setAllPromoCodes] = useState<PromoCode[]>([]);
  const [siteActivityLogs, setSiteActivityLogs] = useState<SiteActivityLog[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [allPickupPoints, setAllPickupPoints] = useState<PickupPoint[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent[]>([]);
  const [siteSettings, setSiteSettings] = usePersistentState<SiteSettings | null>('siteSettings', null);

  const { user, updateUser: authUpdateUser, resetPassword } = useAuth();
  const { isModalOpen, modalProduct, closeModal: uiCloseModal } = useUI();
  const { clearCart, addToCart, onApplyPromoCode, appliedPromoCode } = useCart();
  const { comparisonList, setProducts: setComparisonProducts } = useComparison();
  const { wishlist } = useWishlist();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [promotionModalProduct, setPromotionModalProduct] = useState<Product | null>(null);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [emailForPasswordReset, setEmailForPasswordReset] = useState<string | null>(null);

  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [isComparisonEnabled, setIsComparisonEnabled] = useState(true);

  // Initial data fetching from backend
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [
            productsRes, categoriesRes, storesRes, flashSalesRes, 
            adsRes, pickupPointsRes, paymentsRes, contentRes
        ] = await Promise.all([
            fetch('/api/public/products'), fetch('/api/public/categories'),
            fetch('/api/public/stores'), fetch('/api/public/flash-sales'),
            fetch('/api/public/advertisements'), fetch('/api/public/pickup-points'),
            fetch('/api/public/payment-methods'),
            fetch('/api/public/site-content'),
        ]);

        if (!productsRes.ok) throw new Error(`Products fetch failed: ${productsRes.statusText}`);
        
        const productsData = await productsRes.json();
        const productsWithId = (productsData.products || []).map((p: any) => ({ ...p, id: p._id }));
        setAllProducts(productsWithId);
        setComparisonProducts(productsWithId);
        
        const categoriesData = (await categoriesRes.json()).map((c: any) => ({ ...c, id: c._id }));
        setAllCategories(categoriesData);

        const storesData = (await storesRes.json()).map((s: any) => ({ ...s, id: s._id }));
        setAllStores(storesData);
        
        const flashSalesData = (await flashSalesRes.json()).map((fs: any) => ({ ...fs, id: fs._id }));
        setFlashSales(flashSalesData);

        const adsData = (await adsRes.json()).map((ad: any) => ({ ...ad, id: ad._id }));
        setAdvertisements(adsData);

        const pickupPointsData = (await pickupPointsRes.json()).map((pp: any) => ({ ...pp, id: pp._id }));
        setAllPickupPoints(pickupPointsData);

        setPaymentMethods(await paymentsRes.json());
        setSiteContent(await contentRes.json());
        
      } catch (err: any) {
        console.error("Failed to fetch initial data", err);
        setError("Impossible de charger les données de la boutique. Veuillez réessayer plus tard.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const visibleProducts = useMemo(() => {
      const activeStoreNames = new Set(allStores.filter(s => s.status === 'active').map(s => s.name));
      return allProducts.filter(p => activeStoreNames.has(p.vendor) && p.status === 'published');
  }, [allProducts, allStores]);

  const logActivity = useCallback((action: string, details: string) => {
      // Future API call
  }, []);
  
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
      // Future API call
  }, []);

    const handleMarkNotificationAsRead = useCallback((notificationId: string) => {
        // Future API call
    }, []);

    const handleNavigate = useCallback((newPage: Page, stateReset: () => void = () => {}) => {
        setPage(newPage);
        stateReset();
        window.scrollTo(0, 0);
    }, []);

    const handleNavigateFromNotification = useCallback((link: Notification['link']) => {
        // ...
    }, [handleNavigate]);

    const addStatusLog = (order: Order, status: OrderStatus, changedBy: string): Order => {
        const newLogEntry: StatusChangeLogEntry = { status, date: new Date().toISOString(), changedBy, };
        const updatedOrder = { ...order, status, statusChangeLog: [...(order.statusChangeLog || []), newLogEntry], };
         if (!order.trackingHistory.some(h => h.status === status)) {
            updatedOrder.trackingHistory = [...order.trackingHistory, { status, date: new Date().toISOString(), location: 'System', details: `Status changed to ${status} by ${changedBy}` }];
        }
        return updatedOrder;
    };

    const handleUpdateUserAvailability = useCallback(async (userId: string, status: UserAvailabilityStatus) => {
        try {
            const updatedUser = await apiFetch(`/delivery/availability`, { method: 'PUT', body: JSON.stringify({ status }) });
            setAllUsers(users => users.map(u => u.id === userId ? { ...u, availabilityStatus: updatedUser.availabilityStatus } : u));
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise à jour de la disponibilité.");
        }
    }, []);
    
    const handleAdminAddCategory = useCallback(async (categoryName: string, parentId?: string) => {
        try {
            const newCategory = await apiFetch('/admin/categories', {
                method: 'POST', body: JSON.stringify({ name: categoryName, parentId, imageUrl: 'https://picsum.photos/seed/newcat/400' })
            });
            setAllCategories(prev => [...prev, { ...newCategory, id: newCategory._id }]);
        } catch (error) { console.error(error); alert("Erreur lors de l'ajout de la catégorie."); }
    }, []);

    const handleAdminDeleteCategory = useCallback(async (categoryId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
            try {
                await apiFetch(`/admin/categories/${categoryId}`, { method: 'DELETE' });
                setAllCategories(prev => prev.filter(c => c.id !== categoryId));
            } catch (error) { console.error(error); alert("Erreur lors de la suppression."); }
        }
    }, []);

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
    
    const { logout: authLogout } = useAuth();
    const handleLogout = useCallback(() => {
        authLogout();
        handleNavigate('home', resetSelections);
    }, [authLogout, handleNavigate]);
    
    const fetchSellerData = async () => {
        const [profile, products, orders, promoCodes, collections] = await Promise.all([
            apiFetch('/seller/profile'),
            apiFetch('/seller/products'),
            apiFetch('/seller/orders'),
            apiFetch('/seller/promocodes'),
            apiFetch('/seller/collections'),
        ]);

        const sellerStore = { ...profile, id: profile._id, collections: (collections || []).map((c: any) => ({ ...c, id: c._id })) };
        setAllStores(prev => {
            const exists = prev.some(s => s.id === sellerStore.id);
            return exists ? prev.map(s => s.id === sellerStore.id ? sellerStore : s) : [...prev, sellerStore];
        });

        const sellerProducts = (products || []).map((p: any) => ({ ...p, id: p._id }));
        setAllProducts(prev => {
            const otherProducts = prev.filter(p => p.vendor !== user?.shopName);
            return [...otherProducts, ...sellerProducts];
        });
        
        const sellerOrders = (orders || []).map((o: any) => ({ ...o, id: o._id }));
        setAllOrders(prev => {
             const otherOrders = prev.filter(o => o.userId !== user?.id);
             return [...otherOrders, ...sellerOrders];
        });
        
        const sellerPromoCodes = (promoCodes || []).map((pc: any) => ({ ...pc, id: pc._id }));
        setAllPromoCodes(prev => {
            const otherCodes = prev.filter(pc => pc.sellerId !== user?.id);
            return [...otherCodes, ...sellerPromoCodes];
        });
    };

    const fetchAdminData = async () => {
        const [users, stores, orders, products, categories, flash, pickups, payouts, ads, tickets, announcements, siteSettingsData, payments] = await Promise.all([
            apiFetch('/admin/users'), apiFetch('/admin/stores'), apiFetch('/admin/orders'), apiFetch('/public/products'),
            apiFetch('/admin/categories'), apiFetch('/admin/flash-sales'), apiFetch('/admin/pickup-points'),
            apiFetch('/admin/payouts'), apiFetch('/admin/advertisements'), apiFetch('/admin/tickets'),
            apiFetch('/admin/announcements'), apiFetch('/admin/settings'), apiFetch('/admin/payment-methods')
        ]);
        setAllUsers((users || []).map((u: any) => ({ ...u, id: u._id })));
        setAllStores((stores || []).map((s: any) => ({ ...s, id: s._id })));
        setAllOrders((orders || []).map((o: any) => ({ ...o, id: o._id })));
        setAllProducts((products?.products || []).map((p: any) => ({ ...p, id: p._id })));
        setAllCategories((categories || []).map((c: any) => ({ ...c, id: c._id })));
        setFlashSales((flash || []).map((fs: any) => ({ ...fs, id: fs._id })));
        setAllPickupPoints((pickups || []).map((pp: any) => ({ ...pp, id: pp._id })));
        setPayouts((payouts || []).map((p: any) => ({ ...p, id: p._id })));
        setAdvertisements((ads || []).map((ad: any) => ({ ...ad, id: ad._id })));
        setAllTickets((tickets || []).map((t: any) => ({ ...t, id: t._id })));
        setAllAnnouncements((announcements || []).map((a: any) => ({ ...a, id: a._id })));
        setSiteSettings(siteSettingsData);
        setPaymentMethods(payments);
    };

    const handleLoginSuccess = useCallback(async (loggedInUser: User) => {
        setIsLoginModalOpen(false);
        try {
            if (loggedInUser.role === 'customer') {
                const [ordersData, ticketsData] = await Promise.all([ apiFetch('/orders/myorders'), apiFetch('/tickets') ]);
                setAllOrders((ordersData || []).map((o: any) => ({ ...o, id: o._id })));
                setAllTickets((ticketsData || []).map((t: any) => ({ ...t, id: t._id })));
                handleNavigate('home');
            } else if (loggedInUser.role === 'seller') {
                await fetchSellerData();
                handleNavigate('seller-dashboard');
            } else if (loggedInUser.role === 'superadmin') {
                await fetchAdminData();
                handleNavigate('superadmin-dashboard');
            } else {
                 handleNavigate(`${loggedInUser.role}-dashboard` as Page);
            }
        } catch (e) { console.error("Failed to fetch user data after login", e); }
    }, [handleNavigate]);

    const handleOpenForgotPassword = useCallback(() => {
        setIsLoginModalOpen(false);
        setIsForgotPasswordModalOpen(true);
    }, []);

    const handleForgotPasswordSubmit = useCallback(async (email: string) => {
        // ...
    }, [handleNavigate]);
    
    const handlePasswordReset = useCallback((newPassword: string) => {
        // ...
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
        try {
            const newOrder = await apiFetch('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData),
            });
            const finalOrder = { ...newOrder, id: newOrder._id };
            setAllOrders(prevOrders => [...prevOrders, finalOrder]);
            setSelectedOrder(finalOrder);
            clearCart();
            onApplyPromoCode(null);
            handleNavigate('order-success');
        } catch (error: any) { alert(`Erreur lors de la commande: ${error.message}`); }
    }, [clearCart, onApplyPromoCode, handleNavigate]);
    
    const handleAddProduct = useCallback(async (product: Product) => {
        try {
            const isEditing = !!productToEdit;
            const endpoint = isEditing ? `/products/${product.id}` : '/products';
            const method = isEditing ? 'PUT' : 'POST';
            const savedProduct = await apiFetch(endpoint, { method, body: JSON.stringify(product) });
            const finalProduct = { ...savedProduct, id: savedProduct._id };
            setAllProducts(prev => isEditing ? prev.map(p => p.id === finalProduct.id ? finalProduct : p) : [...prev, finalProduct]);
            setProductToEdit(null);
            handleNavigate('seller-dashboard');
        } catch (error) { console.error(error); alert("Erreur lors de la sauvegarde du produit."); }
    }, [productToEdit, handleNavigate]);

    const handleDeleteProduct = useCallback(async (productId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
            try {
                await apiFetch(`/products/${productId}`, { method: 'DELETE' });
                setAllProducts(prev => prev.filter(p => p.id !== productId));
            } catch (error) { console.error(error); alert("Erreur lors de la suppression."); }
        }
    }, []);
    
    const handleUpdateProductStatus = useCallback(async (productId: string, status: Product['status']) => {
        try {
            const savedProduct = await apiFetch(`/products/${productId}`, { method: 'PUT', body: JSON.stringify({ status }) });
            setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, status: savedProduct.status } : p));
        } catch (error) { console.error(error); alert("Erreur lors de la mise à jour."); }
    }, []);

    const handleBulkUpdateProducts = useCallback(async (updatedProducts: Array<Pick<Product, 'id' | 'price' | 'stock'>>) => {
        try {
            await apiFetch('/seller/products/bulk-update', { method: 'PUT', body: JSON.stringify(updatedProducts) });
            await fetchSellerData(); // Refetch all seller data for consistency
        } catch (error) { console.error(error); alert("Erreur lors de la mise à jour en masse."); }
    }, []);

    const handleSetPromotion = useCallback(async (productId: string, promoPrice: number, startDate?: string, endDate?: string) => {
        try {
            await apiFetch(`/products/${productId}`, { method: 'PUT', body: JSON.stringify({ promotionPrice: promoPrice, promotionStartDate: startDate, promotionEndDate: endDate }) });
            await fetchSellerData();
            setPromotionModalProduct(null);
        } catch (error) { console.error(error); alert("Erreur lors de la mise en place de la promotion."); }
    }, []);

    const handleRemovePromotion = useCallback(async (productId: string) => {
         if (window.confirm("Êtes-vous sûr de vouloir retirer la promotion de ce produit ?")) {
            try {
                await apiFetch(`/products/${productId}`, { method: 'PUT', body: JSON.stringify({ promotionPrice: null, promotionStartDate: null, promotionEndDate: null }) });
                await fetchSellerData();
            } catch (error) { console.error(error); alert("Erreur lors du retrait de la promotion."); }
         }
    }, []);
    
    const handleProposeForFlashSale = useCallback(async (flashSaleId: string, productId: string, flashPrice: number, sellerShopName: string) => {
        try {
            await apiFetch('/seller/flash-sales/propose', { method: 'POST', body: JSON.stringify({ flashSaleId, productId, flashPrice }) });
            await fetchSellerData();
        } catch(error) { console.error(error); alert("Erreur lors de la proposition."); }
    }, []);
    
     const handleUpdateFlashSaleSubmissionStatus = useCallback(async (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => {
        try {
            await apiFetch(`/admin/flash-sales/${flashSaleId}/submissions`, { method: 'PUT', body: JSON.stringify({ productIds: [productId], status }) });
            await fetchAdminData();
        } catch (error) { console.error(error); alert("Erreur lors de la modération."); }
    }, []);
    
     const handleBatchUpdateFlashSaleStatus = useCallback(async (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => {
        try {
            await apiFetch(`/admin/flash-sales/${flashSaleId}/submissions`, { method: 'PUT', body: JSON.stringify({ productIds, status }) });
            await fetchAdminData();
        } catch (error) { console.error(error); alert("Erreur lors de la modération."); }
    }, []);

    const handleUploadDocument = useCallback(async (storeId: string, documentName: string, fileUrl: string) => {
        // This is now an admin action, but keeping the stub for potential future changes.
    }, []);
    
    const handleRequestDocument = useCallback(async (storeId: string, documentName: string) => {
        try {
            await apiFetch(`/admin/stores/${storeId}/documents`, { method: 'POST', body: JSON.stringify({ name: documentName }) });
            await fetchAdminData();
        } catch (error) { console.error(error); alert("Erreur lors de la demande de document."); }
    }, []);
    
    const handleVerifyDocumentStatus = useCallback(async (store: Store, documentName: string, status: 'verified' | 'rejected', reason: string = '') => {
        try {
            await apiFetch(`/admin/stores/${store.id}/documents/${documentName}/verify`, { method: 'PUT', body: JSON.stringify({ status, reason }) });
            await fetchAdminData();
        } catch (error) { console.error(error); alert("Erreur lors de la vérification du document."); }
    }, []);

    const handleCreatePromoCode = useCallback(async (codeData: Omit<PromoCode, 'uses'>) => {
        try {
            await apiFetch('/seller/promocodes', { method: 'POST', body: JSON.stringify(codeData) });
            await fetchSellerData();
        } catch (error) { console.error(error); alert("Erreur lors de la création du code promo."); }
    }, []);
    
    const handleDeletePromoCode = useCallback(async (code: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le code promo "${code}" ?`)) {
            try {
                await apiFetch(`/seller/promocodes/${code}`, { method: 'DELETE' });
                await fetchSellerData();
            } catch (error) { console.error(error); alert("Erreur lors de la suppression."); }
        }
    }, []);
    
    const handleAddReview = useCallback(async (productId: string, review: Review) => {
        try {
            await apiFetch(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(review) });
            // The review is pending, so no frontend state change needed until approved.
        } catch (error) { console.error(error); alert("Erreur lors de l'envoi de l'avis."); }
    }, []);

    const handleReviewModeration = useCallback(async (productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected') => {
        const product = allProducts.find(p => p.id === productId);
        const review = product?.reviews.find(r => r.author === reviewIdentifier.author && r.date === reviewIdentifier.date);
        if (review) {
            try {
                await apiFetch(`/admin/reviews/moderate`, { method: 'PUT', body: JSON.stringify({ productId, reviewId: (review as any)._id, status: newStatus }) });
                await fetchAdminData();
            } catch (error) { console.error(error); alert("Erreur de modération."); }
        }
    }, [allProducts]);
    
    const handleReplyToReview = useCallback(async (productId: string, reviewIdentifier: { author: string; date: string; }, replyText: string) => {
        try {
            await apiFetch(`/seller/products/${productId}/reviews/reply`, { method: 'POST', body: JSON.stringify({ reviewIdentifier, replyText }) });
            await fetchSellerData();
        } catch (error) { console.error(error); alert("Erreur lors de l'envoi de la réponse."); }
    }, []);

     const handleBecomeSeller = useCallback(async (shopName: string, location: string, neighborhood: string, sellerFirstName: string, sellerLastName: string, sellerPhone: string, physicalAddress: string, logoUrl: string, latitude?: number, longitude?: number) => {
        try {
            await apiFetch('/seller/apply', { method: 'POST', body: JSON.stringify({ shopName, location, neighborhood, sellerFirstName, sellerLastName, sellerPhone, physicalAddress, logoUrl, latitude, longitude }) });
            alert("Félicitations ! Votre demande a été envoyée.");
            await fetchSellerData();
            handleNavigate('seller-dashboard');
        } catch (error) { console.error(error); alert("Erreur lors de la candidature."); }
    }, [handleNavigate]);

    const handleUpdateOrderWithAdmin = useCallback(async (order: Order, newStatus: OrderStatus) => {
        try {
            await apiFetch(`/admin/orders/${order.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
            await fetchAdminData();
        } catch (error) { console.error(error); alert("Erreur lors de la mise à jour de la commande."); }
    }, []);
    
    const handleUpdateOrderWithSeller = useCallback(async (orderId: string, newStatus: OrderStatus) => {
        try {
            await apiFetch(`/seller/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
            await fetchSellerData();
        } catch (error) { console.error(error); alert("Erreur lors de la mise à jour."); }
    }, []);
    
    const handleAssignAgent = useCallback(async (orderId: string, agentId: string) => {
        try {
            await apiFetch(`/admin/orders/${orderId}/assign-agent`, { method: 'POST', body: JSON.stringify({ agentId }) });
            await fetchAdminData();
        } catch (error) { console.error(error); alert("Erreur lors de l'assignation."); }
    }, []);
    
    const handleAddStory = useCallback(async (storeId: string, imageUrl: string) => {
        try {
            await apiFetch('/seller/stories', { method: 'POST', body: JSON.stringify({ imageUrl }) });
            await fetchSellerData();
        } catch (error) { console.error(error); alert("Erreur lors de l'ajout de la story."); }
    }, []);

    const handleDeleteStory = useCallback(async (storeId: string, storyId: string) => {
        try {
            await apiFetch(`/seller/stories/${storyId}`, { method: 'DELETE' });
            await fetchSellerData();
        } catch (error) { console.error(error); alert("Erreur lors de la suppression."); }
    }, []);
    
    const handleBecomePremiumByCaution = useCallback(() => {
        // ...
    }, []);
    
    const handleUpgradeToPremiumPlus = useCallback(() => {
        // ...
    }, []);
    
    const handleCancelOrder = useCallback(async (orderId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
            try {
                const updatedOrder = await apiFetch(`/orders/${orderId}/cancel`, { method: 'PUT' });
                const finalOrder = { ...updatedOrder, id: updatedOrder._id };
                setAllOrders(prev => prev.map(o => o.id === orderId ? finalOrder : o));
            } catch (error: any) { alert(`Erreur lors de l'annulation: ${error.message}`); }
        }
    }, []);

    const handleRequestRefund = useCallback(async (orderId: string, reason: string, evidenceUrls: string[]) => {
        try {
            const updatedOrder = await apiFetch(`/orders/${orderId}/refund`, { method: 'POST', body: JSON.stringify({ reason, evidenceUrls }) });
            const finalOrder = { ...updatedOrder, id: updatedOrder._id };
            setAllOrders(prev => prev.map(o => o.id === orderId ? finalOrder : o));
        } catch (error: any) { alert(`Erreur lors de la demande de remboursement: ${error.message}`); }
    }, []);

    const handleResolveRefund = useCallback(async (orderId: string, resolution: 'approved' | 'rejected') => {
        try {
            await apiFetch(`/admin/orders/${orderId}/resolve-refund`, { method: 'POST', body: JSON.stringify({ resolution }) });
            await fetchAdminData();
        } catch (error) { console.error(error); alert("Erreur lors de la résolution du litige."); }
    }, []);
    
    const handleAdminDisputeMessage = useCallback(async (orderId: string, message: string, author: 'admin' | 'seller' | 'customer') => {
        try {
            const endpoint = author === 'admin' ? `/admin/orders/${orderId}/dispute` : `/orders/${orderId}/dispute`;
            await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ message }) });
            if (user?.role === 'superadmin') await fetchAdminData();
            else {
                const ordersData = await apiFetch('/orders/myorders');
                setAllOrders((ordersData || []).map((o: any) => ({ ...o, id: o._id })));
            }
        } catch (error) { console.error(error); alert("Erreur d'envoi du message."); }
    }, [user]);

    const handleSellerDisputeMessage = useCallback(async (orderId: string, message: string) => {
        try {
            await apiFetch(`/seller/orders/${orderId}/dispute`, { method: 'POST', body: JSON.stringify({ message }) });
            await fetchSellerData();
        } catch (error) { console.error(error); alert("Erreur d'envoi du message."); }
    }, []);

    const handleRepeatOrder = useCallback((order: Order) => {
        // ...
    }, [allProducts, addToCart, handleNavigate]);

    const handleUpdateOrderFromAgent = useCallback(async (orderId: string, updates: Partial<Order>) => {
        try {
            await apiFetch(`/delivery/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify(updates) });
            // Agent dashboard should probably refetch its own data, but for now we do nothing.
        } catch (error) { console.error(error); alert("Erreur de mise à jour."); }
    }, []);
    
    const handleCreateTicket = useCallback(async (subject: string, message: string, relatedOrderId?: string) => {
        try {
            const newTicket = await apiFetch('/tickets', { method: 'POST', body: JSON.stringify({ subject, message, relatedOrderId }) });
            setAllTickets(prev => [{ ...newTicket, id: newTicket._id }, ...prev]);
        } catch (error: any) { alert(`Erreur lors de la création du ticket: ${error.message}`); }
    }, []);

    const handleUserReplyToTicket = useCallback(async (ticketId: string, message: string) => {
        try {
            const updatedTicket = await apiFetch(`/tickets/${ticketId}/reply`, { method: 'POST', body: JSON.stringify({ message }) });
            setAllTickets(prev => prev.map(t => (t.id === ticketId ? { ...updatedTicket, id: updatedTicket._id } : t)));
        } catch (error: any) { alert(`Erreur lors de l'envoi de la réponse: ${error.message}`); }
    }, []);

    const handleAdminReplyToTicket = useCallback(async (ticketId: string, message: string) => {
        try {
            await apiFetch(`/admin/tickets/${ticketId}/reply`, { method: 'POST', body: JSON.stringify({ message }) });
            await fetchAdminData();
        } catch(e) { console.error(e); alert("Erreur de réponse."); }
    }, []);
    
    const handleAdminUpdateTicketStatus = useCallback(async (ticketId: string, status: TicketStatus, priority: TicketPriority) => {
        try {
            await apiFetch(`/admin/tickets/${ticketId}/status`, { method: 'PUT', body: JSON.stringify({ status, priority }) });
            await fetchAdminData();
        } catch (e) { console.error(e); alert("Erreur de mise à jour."); }
    }, []);

    const handleCreateOrUpdateAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id'> | Announcement) => {
        try {
            const endpoint = 'id' in announcement ? `/admin/announcements/${announcement.id}` : '/admin/announcements';
            const method = 'id' in announcement ? 'PUT' : 'POST';
            await apiFetch(endpoint, { method, body: JSON.stringify(announcement) });
            await fetchAdminData();
        } catch (e) { console.error(e); alert("Erreur de sauvegarde."); }
    }, []);

    const handleDeleteAnnouncement = useCallback(async (id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
            try {
                await apiFetch(`/admin/announcements/${id}`, { method: 'DELETE' });
                await fetchAdminData();
            } catch (e) { console.error(e); alert("Erreur de suppression."); }
        }
    }, []);

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

    const handleUpdateCategoryImage = useCallback(async (categoryId: string, imageUrl: string) => {
        try {
            await apiFetch(`/admin/categories/${categoryId}/image`, { method: 'PUT', body: JSON.stringify({ imageUrl }) });
            await fetchAdminData();
        } catch (e) { console.error(e); alert("Erreur de mise à jour."); }
    }, []);

    const handleWarnStore = useCallback(async (store: Store, reason: string) => {
        try {
            await apiFetch(`/admin/stores/${store.id}/warn`, { method: 'POST', body: JSON.stringify({ reason }) });
            await fetchAdminData();
        } catch (e) { console.error(e); alert("Erreur d'envoi de l'avertissement."); }
    }, []);

    const handleToggleStoreStatus = useCallback(async (store: Store) => {
        const newStatus = store.status === 'active' ? 'suspended' : 'active';
        try {
            await apiFetch(`/admin/stores/${store.id}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
            await fetchAdminData();
        } catch (e) { console.error(e); alert("Erreur de mise à jour du statut."); }
    }, []);

    const handleToggleStorePremiumStatus = useCallback(async (store: Store) => {
        const newStatus = store.premiumStatus === 'premium' ? 'standard' : 'premium';
        try {
            await apiFetch(`/admin/stores/${store.id}/premium-status`, { method: 'PUT', body: JSON.stringify({ premiumStatus: newStatus }) });
            await fetchAdminData();
        } catch (e) { console.error(e); alert("Erreur de mise à jour."); }
    }, []);

    const handleApproveStore = useCallback(async (store: Store) => {
        try {
            await apiFetch(`/admin/stores/${store.id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'active' }) });
            await fetchAdminData();
        } catch (e) { console.error(e); alert("Erreur d'approbation."); }
    }, []);

    const handleRejectStore = useCallback(async (store: Store) => {
        if(window.confirm(`Rejeter et supprimer la boutique ${store.name} ?`)) {
            try {
                await apiFetch(`/admin/stores/${store.id}`, { method: 'DELETE' });
                await fetchAdminData();
            } catch (e) { console.error(e); alert("Erreur de rejet."); }
        }
    }, []);
    
    const handleSaveFlashSale = useCallback(async (flashSaleData: Omit<FlashSale, 'id'|'products'>) => {
        try {
            await apiFetch('/admin/flash-sales', { method: 'POST', body: JSON.stringify(flashSaleData) });
            await fetchAdminData();
        } catch (e) { console.error(e); alert("Erreur de sauvegarde."); }
    }, []);

    const handleUpdateSellerProfile = useCallback(async (updatedData: Partial<Store>) => {
      try {
        await apiFetch('/seller/profile', { method: 'PUT', body: JSON.stringify(updatedData) });
        await fetchSellerData();
      } catch (e) { console.error(e); alert("Erreur de mise à jour."); }
    }, []);

    const handlePayRent = useCallback(async (storeId: string) => {
        alert(`Le paiement du loyer pour ${storeId} sera géré par un système externe.`);
    }, []);
    
    const handleUpdateSiteSettings = useCallback(async (newSettings: SiteSettings) => {
        try {
            await apiFetch('/admin/settings', { method: 'PUT', body: JSON.stringify(newSettings) });
            setSiteSettings(newSettings);
        } catch(e) { console.error(e); alert("Erreur de sauvegarde des paramètres."); }
    }, [setSiteSettings]);

    const handleUpdatePaymentMethods = useCallback(async (newMethods: PaymentMethod[]) => {
        try {
            await apiFetch('/admin/payment-methods', { method: 'PUT', body: JSON.stringify(newMethods) });
            setPaymentMethods(newMethods);
        } catch(e) { console.error(e); alert("Erreur de mise à jour."); }
    }, []);

    const handleUpdateUser = useCallback(async (userId: string, updates: Partial<User>) => {
      try {
        await apiFetch(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(updates) });
        await fetchAdminData();
      } catch (e) { console.error(e); alert("Erreur de mise à jour."); }
    }, []);

    const handleCreateUserByAdmin = useCallback(async (userData: Omit<User, 'id' | 'loyalty' | 'password' | 'addresses' | 'followedStores'>) => {
        try {
            await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify({ ...userData, password: 'password' }) });
            await fetchAdminData();
        } catch (e) { console.error(e); alert("Erreur de création."); }
    }, []);
    
    const handleSanctionAgent = useCallback(async (agentId: string, reason: string) => {
        try {
            await apiFetch(`/admin/users/${agentId}/sanction`, { method: 'POST', body: JSON.stringify({ reason }) });
            await fetchAdminData();
        } catch (e) { console.error(e); alert("Erreur de sanction."); }
    }, []);
    
    const handleUpdateSiteContent = useCallback(async (newContent: SiteContent[]) => {
        try {
            await apiFetch('/admin/site-content', { method: 'PUT', body: JSON.stringify(newContent) });
            setSiteContent(newContent);
        } catch (e) { console.error(e); alert("Erreur de sauvegarde."); }
    }, []);
    
    const handleToggleChatFeature = useCallback(() => setIsChatEnabled(prev => !prev), []);
    const handleToggleComparisonFeature = useCallback(() => setIsComparisonEnabled(prev => !prev), []);
    
    const handleAddPickupPoint = useCallback(async (pointData: Omit<PickupPoint, 'id'>) => {
        try {
            await apiFetch('/admin/pickup-points', { method: 'POST', body: JSON.stringify(pointData) });
            await fetchAdminData();
        } catch (e) { console.error(e); alert("Erreur d'ajout."); }
    }, []);

    const handleUpdatePickupPoint = useCallback(async (updatedPoint: PickupPoint) => {
        try {
            await apiFetch(`/admin/pickup-points/${updatedPoint.id}`, { method: 'PUT', body: JSON.stringify(updatedPoint) });
            await fetchAdminData();
        } catch(e) { console.error(e); alert("Erreur de mise à jour."); }
    }, []);

    const handleDeletePickupPoint = useCallback(async (pointId: string) => {
        if(window.confirm("Supprimer ce point de retrait ?")) {
            try {
                await apiFetch(`/admin/pickup-points/${pointId}`, { method: 'DELETE' });
                await fetchAdminData();
            } catch(e) { console.error(e); alert("Erreur de suppression."); }
        }
    }, []);
    
    const handlePayoutSeller = useCallback(async (store: Store, amount: number) => {
        if (amount <= 0) { alert("Le solde est nul ou négatif."); return; }
        if(window.confirm(`Confirmer le paiement de ${amount.toLocaleString('fr-CM')} FCFA à ${store.name} ?`)) {
            try {
                await apiFetch('/admin/payouts', { method: 'POST', body: JSON.stringify({ storeId: store.id, amount }) });
                await fetchAdminData();
            } catch (e) { console.error(e); alert("Erreur de paiement."); }
        }
    }, []);

    const handleActivateSubscription = useCallback(async (store: Store) => {
        try {
            await apiFetch(`/admin/stores/${store.id}/activate-subscription`, { method: 'POST' });
            await fetchAdminData();
        } catch(e) { console.error(e); alert("Erreur d'activation."); }
    }, []);
    
    const handleAddAdvertisement = useCallback(async (ad: Omit<Advertisement, 'id'>) => {
        try {
            await apiFetch('/admin/advertisements', { method: 'POST', body: JSON.stringify(ad) });
            await fetchAdminData();
        } catch(e) { console.error(e); alert("Erreur d'ajout."); }
    }, []);

    const handleUpdateAdvertisement = useCallback(async (ad: Advertisement) => {
        try {
            await apiFetch(`/admin/advertisements/${ad.id}`, { method: 'PUT', body: JSON.stringify(ad) });
            await fetchAdminData();
        } catch(e) { console.error(e); alert("Erreur de mise à jour."); }
    }, []);

    const handleDeleteAdvertisement = useCallback(async (adId: string) => {
        if(window.confirm("Supprimer cette publicité ?")) {
            try {
                await apiFetch(`/admin/advertisements/${adId}`, { method: 'DELETE' });
                await fetchAdminData();
            } catch(e) { console.error(e); alert("Erreur de suppression."); }
        }
    }, []);

    const handleCreateOrUpdateCollection = useCallback(async (storeId: string, collection: Omit<ProductCollection, 'id' | 'storeId'> | ProductCollection) => {
        try {
            const endpoint = 'id' in collection ? `/seller/collections/${collection.id}` : '/seller/collections';
            const method = 'id' in collection ? 'PUT' : 'POST';
            await apiFetch(endpoint, { method, body: JSON.stringify(collection) });
            await fetchSellerData();
        } catch (e) { console.error(e); alert("Erreur de sauvegarde de la collection."); }
    }, []);

    const handleDeleteCollection = useCallback(async (storeId: string, collectionId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette collection ?")) {
            try {
                await apiFetch(`/seller/collections/${collectionId}`, { method: 'DELETE' });
                await fetchSellerData();
            } catch (e) { console.error(e); alert("Erreur de suppression de la collection."); }
        }
    }, []);

    // ... (Memoized data for dashboards)
    const sellerStore = user?.shopName ? allStores.find(s => s.name === user.shopName) : undefined;
    const sellerProducts = user?.shopName ? allProducts.filter(p => p.vendor === user.shopName) : [];
    const sellerOrders = useMemo(() => user?.shopName ? allOrders.filter(o => o.items.some(i => i.vendor === user.shopName)) : [], [user, allOrders]);
    const sellerPromoCodes = user ? allPromoCodes.filter(pc => pc.sellerId === user.id) : [];
    const depotAgent = user?.role === 'depot_agent' ? user : undefined;

    const renderPage = () => {
        if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-kmer-green"></div></div>;
        if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
        if (siteSettings?.maintenanceMode.isEnabled && user?.role !== 'superadmin') return <MaintenancePage message={siteSettings.maintenanceMode.message} reopenDate={siteSettings.maintenanceMode.reopenDate} />;
    
        switch (page) {
            case 'home': return <HomePage categories={allCategories} products={visibleProducts} stores={allStores.filter(s => s.status === 'active')} flashSales={flashSales} advertisements={advertisements.filter(ad => ad.isActive)} onProductClick={handleProductClick} onCategoryClick={handleCategoryClick} onVendorClick={handleVendorClick} onVisitStore={handleVendorClick} onViewStories={setViewingStoriesOfStore} isComparisonEnabled={isComparisonEnabled} isStoriesEnabled={siteSettings?.isStoriesEnabled ?? true} recentlyViewedIds={recentlyViewedIds} userOrders={userOrders} wishlist={wishlist} />;
            case 'product': return selectedProduct ? <ProductDetail product={selectedProduct} allProducts={visibleProducts} allUsers={allUsers} stores={allStores} flashSales={flashSales} onBack={() => window.history.back()} onAddReview={handleAddReview} onVendorClick={handleVendorClick} onProductClick={handleProductClick} onOpenLogin={() => setIsLoginModalOpen(true)} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onProductView={handleProductView} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'cart': return <CartView onBack={() => handleNavigate('home')} onNavigateToCheckout={() => handleNavigate('checkout')} flashSales={flashSales} allPromoCodes={allPromoCodes} appliedPromoCode={appliedPromoCode} onApplyPromoCode={onApplyPromoCode} />;
            case 'checkout': return siteSettings ? <Checkout onBack={() => handleNavigate('cart')} onOrderConfirm={handlePlaceOrder} flashSales={flashSales} allPickupPoints={allPickupPoints} appliedPromoCode={appliedPromoCode} allStores={allStores} siteSettings={siteSettings} /> : null;
            case 'order-success': return selectedOrder ? <OrderSuccess order={selectedOrder} onNavigateHome={() => handleNavigate('home', resetSelections)} onNavigateToOrders={() => handleNavigateToAccount('orders')} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'stores': return <StoresPage stores={allStores.filter(s => s.status === 'active')} onBack={() => handleNavigate('home')} onVisitStore={handleVendorClick} onNavigateToStoresMap={() => handleNavigate('stores-map')} />;
            case 'stores-map': return <StoresMapPage stores={allStores.filter(s => s.status === 'active' && s.latitude && s.longitude)} onBack={() => handleNavigate('stores')} onVisitStore={handleVendorClick} />;
            case 'become-seller': return siteSettings ? <BecomeSeller onBack={() => handleNavigate('home')} onBecomeSeller={handleBecomeSeller} onRegistrationSuccess={() => handleNavigate('seller-dashboard')} siteSettings={siteSettings} /> : null;
            case 'category': return selectedCategoryId ? <CategoryPage categoryId={selectedCategoryId} allCategories={allCategories} allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home', resetSelections)} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'seller-dashboard': return sellerStore && siteSettings && user ? <SellerDashboard store={sellerStore} products={sellerProducts} categories={allCategories} flashSales={flashSales} sellerOrders={sellerOrders} promoCodes={sellerPromoCodes} onBack={() => handleNavigate('home')} onAddProduct={() => { setProductToEdit(null); handleNavigate('product-form'); }} onEditProduct={(p) => { setProductToEdit(p); handleNavigate('product-form'); }} onDeleteProduct={handleDeleteProduct} onUpdateProductStatus={handleUpdateProductStatus} onNavigateToProfile={() => handleNavigate('seller-profile')} onNavigateToAnalytics={() => handleNavigate('seller-analytics-dashboard')} onSetPromotion={setPromotionModalProduct} onRemovePromotion={handleRemovePromotion} onProposeForFlashSale={handleProposeForFlashSale} onUploadDocument={handleUploadDocument} onUpdateOrderStatus={handleUpdateOrderWithSeller} onCreatePromoCode={handleCreatePromoCode} onDeletePromoCode={handleDeletePromoCode} isChatEnabled={isChatEnabled} onPayRent={handlePayRent} siteSettings={siteSettings} onAddStory={handleAddStory} onDeleteStory={handleDeleteStory} payouts={payouts} onSellerDisputeMessage={handleSellerDisputeMessage} onBulkUpdateProducts={handleBulkUpdateProducts} onReplyToReview={handleReplyToReview} onCreateOrUpdateCollection={handleCreateOrUpdateCollection} onDeleteCollection={handleDeleteCollection} initialTab={initialSellerTab} sellerNotifications={sellerNotifications} onMarkNotificationAsRead={handleMarkNotificationAsRead} onNavigateFromNotification={handleNavigateFromNotification} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'seller-analytics-dashboard': return sellerStore ? <SellerAnalyticsDashboard onBack={() => handleNavigate('seller-dashboard')} sellerOrders={sellerOrders} sellerProducts={sellerProducts} flashSales={flashSales} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'vendor-page': return selectedVendor ? <VendorPage vendorName={selectedVendor} allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home', resetSelections)} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'product-form': return sellerStore && siteSettings ? <ProductForm onSave={handleAddProduct} onCancel={() => handleNavigate('seller-dashboard')} productToEdit={productToEdit} categories={allCategories} onAddCategory={() => ({} as Category)} siteSettings={siteSettings} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'seller-profile': return sellerStore ? <SellerProfile store={sellerStore} onBack={() => handleNavigate('seller-dashboard')} onUpdateProfile={handleUpdateSellerProfile} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'superadmin-dashboard': return user?.role === 'superadmin' && siteSettings ? <SuperAdminDashboard allUsers={allUsers} allOrders={allOrders} allCategories={allCategories} allStores={allStores} allProducts={allProducts} siteActivityLogs={siteActivityLogs} onUpdateOrderStatus={handleUpdateOrderWithAdmin} onUpdateCategoryImage={handleUpdateCategoryImage} onWarnStore={handleWarnStore} onToggleStoreStatus={handleToggleStoreStatus} onToggleStorePremiumStatus={handleToggleStorePremiumStatus} onApproveStore={handleApproveStore} onRejectStore={handleRejectStore} onSaveFlashSale={handleSaveFlashSale} flashSales={flashSales} onUpdateFlashSaleSubmissionStatus={handleUpdateFlashSaleSubmissionStatus} onBatchUpdateFlashSaleStatus={handleBatchUpdateFlashSaleStatus} onRequestDocument={handleRequestDocument} onVerifyDocumentStatus={handleVerifyDocumentStatus} allPickupPoints={allPickupPoints} onAddPickupPoint={handleAddPickupPoint} onUpdatePickupPoint={handleUpdatePickupPoint} onDeletePickupPoint={handleDeletePickupPoint} onAssignAgent={handleAssignAgent} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onToggleChatFeature={handleToggleChatFeature} onToggleComparisonFeature={handleToggleComparisonFeature} siteSettings={siteSettings} onUpdateSiteSettings={handleUpdateSiteSettings} onAdminAddCategory={handleAdminAddCategory} onAdminDeleteCategory={handleAdminDeleteCategory} onUpdateUser={handleUpdateUser} payouts={payouts} onPayoutSeller={handlePayoutSeller} onActivateSubscription={handleActivateSubscription} advertisements={advertisements} onAddAdvertisement={handleAddAdvertisement} onUpdateAdvertisement={handleUpdateAdvertisement} onDeleteAdvertisement={handleDeleteAdvertisement} onCreateUserByAdmin={handleCreateUserByAdmin} onSanctionAgent={handleSanctionAgent} onResolveRefund={handleResolveRefund} onAdminStoreMessage={(orderId, msg) => handleAdminDisputeMessage(orderId, msg, 'admin')} onAdminCustomerMessage={(orderId, msg) => handleAdminDisputeMessage(orderId, msg, 'admin')} siteContent={siteContent} onUpdateSiteContent={handleUpdateSiteContent} allTickets={allTickets} allAnnouncements={allAnnouncements} onAdminReplyToTicket={handleAdminReplyToTicket} onAdminUpdateTicketStatus={handleAdminUpdateTicketStatus} onCreateOrUpdateAnnouncement={handleCreateOrUpdateAnnouncement} onDeleteAnnouncement={handleDeleteAnnouncement} onReviewModeration={handleReviewModeration} paymentMethods={paymentMethods} onUpdatePaymentMethods={handleUpdatePaymentMethods} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'order-history': return user ? <OrderHistoryPage userOrders={userOrders} onBack={() => handleNavigate('home')} onSelectOrder={(o) => { setSelectedOrder(o); handleNavigate('order-detail'); }} onRepeatOrder={handleRepeatOrder} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'order-detail': return selectedOrder ? <OrderDetailPage order={selectedOrder} onBack={() => handleNavigate('order-history')} allPickupPoints={allPickupPoints} allUsers={allUsers} onCancelOrder={handleCancelOrder} onRequestRefund={handleRequestRefund} onCustomerDisputeMessage={(orderId, msg) => handleAdminDisputeMessage(orderId, msg, 'customer')} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'promotions': return <PromotionsPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'flash-sales': return <FlashSalesPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'search-results': return <SearchResultsPage searchQuery={searchQuery} allProducts={visibleProducts} allStores={allStores} allCategories={allCategories} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'wishlist': return <WishlistPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'delivery-agent-dashboard': return user?.role === 'delivery_agent' ? <DeliveryAgentDashboard allOrders={allOrders} allStores={allStores} allPickupPoints={allPickupPoints} onUpdateOrder={handleUpdateOrderFromAgent} onLogout={handleLogout} onUpdateUserAvailability={handleUpdateUserAvailability} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'depot-agent-dashboard': return depotAgent ? <DepotAgentDashboard user={depotAgent} allUsers={allUsers} allOrders={allOrders} onCheckIn={() => {}} onReportDiscrepancy={() => {}} onLogout={handleLogout} onProcessDeparture={() => {}}/> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'comparison': return <ComparisonPage onBack={() => window.history.back()} allCategories={allCategories} />;
            case 'become-premium': return siteSettings ? <BecomePremiumPage siteSettings={siteSettings} onBack={() => handleNavigate('home')} onBecomePremiumByCaution={handleBecomePremiumByCaution} onUpgradeToPremiumPlus={handleUpgradeToPremiumPlus} /> : null;
            case 'info': return <InfoPage title={infoPageContent.title} content={infoPageContent.content} onBack={() => handleNavigate('home')} />;
            case 'reset-password': return <ResetPasswordPage onPasswordReset={handlePasswordReset} onNavigateLogin={handleNavigateLoginFromReset} />;
            case 'account': return user ? <AccountPage onBack={() => handleNavigate('home')} initialTab={activeAccountTab} allStores={allStores} onVendorClick={handleVendorClick} allTickets={allTickets} userOrders={userOrders} onCreateTicket={handleCreateTicket} onUserReplyToTicket={handleUserReplyToTicket} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'visual-search': return <VisualSearchPage onSearch={handleSearch} />;
            case 'not-found': return <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'forbidden': return <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'server-error': return <ServerErrorPage onNavigateHome={() => handleNavigate('home')} />;
            default:
                return <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
        }
    };

    const headerProps = {
        categories: allCategories,
        onNavigateHome: () => handleNavigate('home', resetSelections),
        onNavigateCart: () => handleNavigate('cart'),
        onNavigateToStores: () => handleNavigate('stores'),
        onNavigateToPromotions: () => handleNavigate('promotions'),
        onNavigateToCategory: handleCategoryClick,
        onNavigateToBecomeSeller: () => handleNavigate('become-seller'),
        onNavigateToSellerDashboard: () => handleNavigate('seller-dashboard'),
        onNavigateToSellerProfile: () => handleNavigate('seller-profile'),
        onNavigateToOrderHistory: () => handleNavigateToAccount('orders'),
        onNavigateToSuperAdminDashboard: () => handleNavigate('superadmin-dashboard'),
        onNavigateToFlashSales: () => handleNavigate('flash-sales'),
        onNavigateToWishlist: () => handleNavigate('wishlist'),
        onNavigateToDeliveryAgentDashboard: () => handleNavigate('delivery-agent-dashboard'),
        onNavigateToDepotAgentDashboard: () => handleNavigate('depot-agent-dashboard'),
        onNavigateToBecomePremium: () => handleNavigate('become-premium'),
        onNavigateToAccount: handleNavigateToAccount,
        onNavigateToVisualSearch: () => handleNavigate('visual-search'),
        onOpenLogin: () => setIsLoginModalOpen(true),
        onLogout: handleLogout,
        onSearch: handleSearch,
        isChatEnabled: isChatEnabled,
        isPremiumProgramEnabled: siteSettings?.isPremiumProgramEnabled ?? true,
        logoUrl: siteSettings?.logoUrl ?? '',
        onLoginSuccess: handleLoginSuccess,
        notifications: userNotifications,
        onMarkNotificationAsRead: handleMarkNotificationAsRead,
        onNavigateFromNotification: handleNavigateFromNotification,
    };

    const footerProps = {
        onNavigate: (slug: string) => {
            const content = siteContent.find(c => c.slug === slug);
            if (content) {
                setInfoPageContent(content);
                handleNavigate('info');
            } else {
                handleNavigate('not-found');
            }
        },
        logoUrl: siteSettings?.logoUrl ?? '',
        paymentMethods: paymentMethods
    };

    return (
        <div className="flex flex-col min-h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {activeAnnouncements.map(ann => (
              <AnnouncementBanner key={ann.id} announcement={ann} onDismiss={(id) => setDismissedAnnouncements(prev => [...prev, id])} />
            ))}
            <Header {...headerProps} />
            <main className="flex-grow">
                {renderPage()}
            </main>
            <Footer {...footerProps} />
            
            {isModalOpen && modalProduct && (
                <AddToCartModal product={modalProduct} onClose={uiCloseModal} onNavigateToCart={() => { uiCloseModal(); handleNavigate('cart'); }} />
            )}
            {isLoginModalOpen && (
                <LoginModal onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} onForgotPassword={handleOpenForgotPassword} />
            )}
            {isForgotPasswordModalOpen && (
                <ForgotPasswordModal onClose={() => setIsForgotPasswordModalOpen(false)} onEmailSubmit={handleForgotPasswordSubmit} />
            )}
            {viewingStoriesOfStore && siteSettings?.isStoriesEnabled && (
                <StoryViewer store={viewingStoriesOfStore} onClose={() => setViewingStoriesOfStore(null)} />
            )}
            {promotionModalProduct && (
                <PromotionModal product={promotionModalProduct} onClose={() => setPromotionModalProduct(null)} onSave={handleSetPromotion} />
            )}
            {isComparisonEnabled && comparisonList.length > 0 && page !== 'comparison' && (
                <ComparisonBar onCompareClick={() => handleNavigate('comparison')} />
            )}
            {isChatEnabled && user && <ChatWidget allUsers={allUsers} allProducts={allProducts} allCategories={allCategories} />}
        </div>
    );
}