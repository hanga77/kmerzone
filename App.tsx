

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

  const { user, updateUser: authUpdateUser, resetPassword, logout } = useAuth();
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
            productsPayload, rawCategories, rawStores, rawFlashSales, 
            rawAds, rawPickupPoints, rawPayments, rawContent
        ] = await Promise.all([
            apiFetch('/public/products'), apiFetch('/public/categories'),
            apiFetch('/public/stores'), apiFetch('/public/flash-sales'),
            apiFetch('/public/advertisements'), apiFetch('/public/pickup-points'),
            apiFetch('/public/payment-methods'),
            apiFetch('/public/site-content'),
        ]);

        const productsWithId = (productsPayload.products || []).map((p: any) => ({ ...p, id: p._id }));
        setAllProducts(productsWithId);
        setComparisonProducts(productsWithId);
        
        setAllCategories(rawCategories.map((c: any) => ({ ...c, id: c._id })));
        setAllStores(rawStores.map((s: any) => ({ ...s, id: s._id })));
        setFlashSales(rawFlashSales.map((fs: any) => ({ ...fs, id: fs._id })));
        setAdvertisements(rawAds.map((ad: any) => ({ ...ad, id: ad._id })));
        setAllPickupPoints(rawPickupPoints.map((pp: any) => ({ ...pp, id: pp._id })));
        setPaymentMethods(rawPayments);
        setSiteContent(rawContent);
        
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
    
// FIX: Completed the incomplete handleAdminAddCategory function.
    const handleAdminAddCategory = useCallback(async (categoryName: string, parentId?: string) => {
        try {
            const newCategory = await apiFetch('/admin/categories', {
                method: 'POST',
                body: JSON.stringify({ name: categoryName, parentId, imageUrl: `https://picsum.photos/seed/${encodeURIComponent(categoryName)}/400` })
            });
            setAllCategories(prev => [...prev.filter(c => c.id !== newCategory._id), { ...newCategory, id: newCategory._id }]);
        } catch (err) {
            console.error("Failed to add category", err);
            alert("Erreur lors de l'ajout de la catégorie.");
        }
    }, []);
// --- FIX START: Add missing handlers and rendering logic ---

  // Navigation handlers
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    handleNavigate('product');
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    handleNavigate('category');
  };

  const handleVendorClick = (vendorName: string) => {
    setSelectedVendor(vendorName);
    handleNavigate('vendor-page');
  };
  
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    handleNavigate('order-detail');
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    handleNavigate('search-results');
  };

  const handleOpenInfoPage = (slug: string) => {
    const content = siteContent.find(c => c.slug === slug);
    if (content) {
      setInfoPageContent(content);
      handleNavigate('info');
    } else {
      handleNavigate('not-found');
    }
  };

  const handleLogout = () => {
    logout();
    handleNavigate('home');
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setIsLoginModalOpen(false);
    // Potentially redirect based on role
    if (loggedInUser.role === 'seller') {
      handleNavigate('seller-dashboard');
    } else if (loggedInUser.role === 'superadmin') {
      handleNavigate('superadmin-dashboard');
    }
  };
  
  const handleForgotPassword = () => {
    setIsLoginModalOpen(false);
    setIsForgotPasswordModalOpen(true);
  };

  const handleProductView = (productId: string) => {
    setRecentlyViewedIds(ids => {
      const newIds = [productId, ...ids.filter(id => id !== productId)];
      return newIds.slice(0, 4); // Keep only the last 4
    });
  };

  const userOrders = useMemo(() => {
    if(!user) return [];
    return allOrders.filter(o => o.userId === user.id);
  }, [allOrders, user]);

  const sellerOrders = useMemo(() => {
    if (user?.role !== 'seller' || !user.shopName) return [];
    return allOrders.filter(o => o.items.some(i => i.vendor === user.shopName));
  }, [allOrders, user]);
  
  const sellerProducts = useMemo(() => {
      if (user?.role !== 'seller' || !user.shopName) return [];
      return allProducts.filter(p => p.vendor === user.shopName);
  }, [allProducts, user]);

  const currentStore = useMemo(() => {
      if (user?.role !== 'seller' || !user.shopName) return undefined;
      return allStores.find(s => s.name === user.shopName);
  }, [allStores, user]);
  
  const sellerNotifications = useMemo(() => {
    if (!user) return [];
    return allNotifications.filter(n => n.userId === user.id);
  }, [allNotifications, user]);

  const renderPage = () => {
    switch(page) {
      case 'home':
        return <HomePage 
          products={visibleProducts} 
          categories={allCategories} 
          stores={allStores.filter(s => s.status === 'active')}
          flashSales={flashSales}
          advertisements={advertisements}
          onProductClick={handleProductClick}
          onCategoryClick={handleCategoryClick}
          onVendorClick={handleVendorClick}
          onVisitStore={(storeName) => { setSelectedVendor(storeName); handleNavigate('vendor-page'); }}
          onViewStories={(store) => setViewingStoriesOfStore(store)}
          isComparisonEnabled={isComparisonEnabled}
          isStoriesEnabled={siteSettings?.isStoriesEnabled ?? true}
          recentlyViewedIds={recentlyViewedIds}
          userOrders={userOrders}
          wishlist={wishlist}
        />;
      case 'product':
        return selectedProduct ? <ProductDetail 
          product={selectedProduct}
          allProducts={allProducts}
          allUsers={allUsers}
          stores={allStores}
          flashSales={flashSales}
          onBack={() => window.history.back()}
          onAddReview={(productId, review) => { /* API call */ }}
          onVendorClick={handleVendorClick}
          onProductClick={handleProductClick}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          isChatEnabled={isChatEnabled}
          isComparisonEnabled={isComparisonEnabled}
          onProductView={handleProductView}
        /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
      case 'cart':
        return <CartView 
          onBack={() => handleNavigate('home')}
          onNavigateToCheckout={() => handleNavigate('checkout')}
          flashSales={flashSales}
          allPromoCodes={allPromoCodes}
          appliedPromoCode={appliedPromoCode}
          onApplyPromoCode={onApplyPromoCode}
        />;
      case 'checkout':
        return siteSettings && <Checkout 
            onBack={() => handleNavigate('cart')}
            onOrderConfirm={async (orderData) => { 
                const newOrder = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(orderData) });
                setSelectedOrder({ ...newOrder, id: newOrder._id });
                clearCart();
                handleNavigate('order-success');
            }}
            flashSales={flashSales}
            allPickupPoints={allPickupPoints}
            appliedPromoCode={appliedPromoCode}
            allStores={allStores}
            siteSettings={siteSettings}
        />;
      case 'order-success':
        return selectedOrder ? <OrderSuccess order={selectedOrder} onNavigateHome={() => handleNavigate('home')} onNavigateToOrders={() => handleNavigate('order-history')} /> : <HomePage {...({} as any)} />;
      case 'category':
        return selectedCategoryId ? <CategoryPage categoryId={selectedCategoryId} allCategories={allCategories} allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
      case 'vendor-page':
        return selectedVendor ? <VendorPage vendorName={selectedVendor} allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => window.history.back()} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
      case 'stores':
        return <StoresPage stores={allStores.filter(s => s.status === 'active')} onBack={() => handleNavigate('home')} onVisitStore={(storeName) => { setSelectedVendor(storeName); handleNavigate('vendor-page'); }} onNavigateToStoresMap={() => handleNavigate('stores-map')} />;
      case 'stores-map':
        return <StoresMapPage stores={allStores.filter(s => s.status === 'active' && s.latitude && s.longitude)} onBack={() => handleNavigate('stores')} onVisitStore={(storeName) => { setSelectedVendor(storeName); handleNavigate('vendor-page'); }}/>;
      case 'seller-dashboard':
        return user?.role === 'seller' && currentStore && siteSettings ? <SellerDashboard 
            store={currentStore}
            products={sellerProducts}
            categories={allCategories}
            flashSales={flashSales}
            sellerOrders={sellerOrders}
            promoCodes={allPromoCodes.filter(pc => pc.sellerId === user.id)}
            onBack={() => handleNavigate('home')}
            onAddProduct={() => { setProductToEdit(null); handleNavigate('product-form'); }}
            onEditProduct={(product) => { setProductToEdit(product); handleNavigate('product-form'); }}
            onDeleteProduct={async (productId) => { 
                await apiFetch(`/products/${productId}`, { method: 'DELETE' });
                setAllProducts(p => p.filter(prod => prod.id !== productId));
             }}
            onUpdateProductStatus={async (productId, status) => { 
                const updatedProduct = await apiFetch(`/products/${productId}`, { method: 'PUT', body: JSON.stringify({ status }) });
                setAllProducts(p => p.map(prod => prod.id === productId ? { ...prod, status: updatedProduct.status } : prod));
             }}
            onNavigateToProfile={() => handleNavigate('seller-profile')}
            onNavigateToAnalytics={() => handleNavigate('seller-analytics-dashboard')}
            onSetPromotion={(product) => setPromotionModalProduct(product)}
            onRemovePromotion={async (productId) => { 
              const updatedProduct = await apiFetch(`/products/${productId}`, { method: 'PUT', body: JSON.stringify({ promotionPrice: null, promotionStartDate: null, promotionEndDate: null }) });
              setAllProducts(p => p.map(prod => prod.id === productId ? { ...prod, promotionPrice: undefined, promotionStartDate: undefined, promotionEndDate: undefined } : prod));
            }}
            onProposeForFlashSale={async () => {}}
            onUploadDocument={() => {}}
            onUpdateOrderStatus={async (orderId, status) => {
                const updatedOrder = await apiFetch(`/seller/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
                setAllOrders(o => o.map(ord => ord.id === orderId ? { ...ord, status: updatedOrder.status } : ord));
            }}
            onCreatePromoCode={async () => {}}
            onDeletePromoCode={async () => {}}
            isChatEnabled={isChatEnabled}
            onPayRent={() => {}}
            siteSettings={siteSettings}
            onAddStory={() => {}}
            onDeleteStory={() => {}}
            payouts={payouts}
            onSellerDisputeMessage={() => {}}
            onBulkUpdateProducts={() => {}}
            onReplyToReview={() => {}}
            onCreateOrUpdateCollection={() => {}}
            onDeleteCollection={() => {}}
            initialTab={initialSellerTab}
            sellerNotifications={sellerNotifications}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onNavigateFromNotification={handleNavigateFromNotification}
         /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')}/>
      case 'superadmin-dashboard':
        return user?.role === 'superadmin' && siteSettings ? <SuperAdminDashboard allUsers={allUsers} allOrders={allOrders} allCategories={allCategories} allStores={allStores} allProducts={allProducts} siteActivityLogs={siteActivityLogs} onUpdateOrderStatus={async (order, status) => {}} onUpdateCategoryImage={() => {}} onWarnStore={() => {}} onToggleStoreStatus={() => {}} onToggleStorePremiumStatus={() => {}} onApproveStore={() => {}} onRejectStore={() => {}} onSaveFlashSale={() => {}} flashSales={flashSales} onUpdateFlashSaleSubmissionStatus={() => {}} onBatchUpdateFlashSaleStatus={() => {}} onRequestDocument={() => {}} onVerifyDocumentStatus={() => {}} allPickupPoints={allPickupPoints} onAddPickupPoint={() => {}} onUpdatePickupPoint={() => {}} onDeletePickupPoint={() => {}} onAssignAgent={() => {}} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onToggleChatFeature={() => setIsChatEnabled(p => !p)} onToggleComparisonFeature={() => setIsComparisonEnabled(p => !p)} siteSettings={siteSettings} onUpdateSiteSettings={setSiteSettings} onAdminAddCategory={handleAdminAddCategory} onAdminDeleteCategory={() => {}} onUpdateUser={() => {}} payouts={payouts} onPayoutSeller={() => {}} onActivateSubscription={() => {}} advertisements={advertisements} onAddAdvertisement={() => {}} onUpdateAdvertisement={() => {}} onDeleteAdvertisement={() => {}} onCreateUserByAdmin={() => {}} onSanctionAgent={() => {}} onResolveRefund={() => {}} onAdminStoreMessage={() => {}} onAdminCustomerMessage={() => {}} siteContent={siteContent} onUpdateSiteContent={setSiteContent} allTickets={allTickets} allAnnouncements={allAnnouncements} onAdminReplyToTicket={() => {}} onAdminUpdateTicketStatus={() => {}} onCreateOrUpdateAnnouncement={() => {}} onDeleteAnnouncement={() => {}} onReviewModeration={() => {}} paymentMethods={paymentMethods} onUpdatePaymentMethods={setPaymentMethods} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')}/>;
      case 'seller-analytics-dashboard':
        return user?.role === 'seller' ? <SellerAnalyticsDashboard onBack={() => handleNavigate('seller-dashboard')} sellerOrders={sellerOrders} sellerProducts={sellerProducts} flashSales={flashSales} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')}/>;
      case 'order-history':
        return <OrderHistoryPage userOrders={userOrders} onBack={() => handleNavigate('home')} onSelectOrder={handleOrderClick} onRepeatOrder={(order) => { order.items.forEach(item => addToCart(item, item.quantity)); handleNavigate('cart'); }} />;
      case 'order-detail':
        return selectedOrder ? <OrderDetailPage order={selectedOrder} onBack={() => handleNavigate('order-history')} allPickupPoints={allPickupPoints} allUsers={allUsers} onCancelOrder={() => {}} onRequestRefund={() => {}} onCustomerDisputeMessage={() => {}} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
      case 'search-results':
        return <SearchResultsPage searchQuery={searchQuery} allProducts={visibleProducts} allStores={allStores} allCategories={allCategories} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
      case 'promotions':
        return <PromotionsPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
      case 'flash-sales':
        return <FlashSalesPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
      case 'wishlist':
        return <WishlistPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
      case 'comparison':
        return <ComparisonPage onBack={() => window.history.back()} allCategories={allCategories} />;
      case 'become-seller':
        return siteSettings ? <BecomeSeller onBack={() => handleNavigate('home')} onBecomeSeller={() => {}} onRegistrationSuccess={() => handleNavigate('seller-dashboard')} siteSettings={siteSettings} /> : null;
      case 'become-premium':
        return siteSettings ? <BecomePremiumPage siteSettings={siteSettings} onBack={() => handleNavigate('home')} onBecomePremiumByCaution={() => {}} onUpgradeToPremiumPlus={() => {}}/> : null;
      case 'info':
        return <InfoPage title={infoPageContent.title} content={infoPageContent.content} onBack={() => handleNavigate('home')} />;
      case 'account':
        return <AccountPage onBack={() => handleNavigate('home')} initialTab={activeAccountTab} allStores={allStores} onVendorClick={handleVendorClick} allTickets={allTickets} userOrders={userOrders} onCreateTicket={() => {}} onUserReplyToTicket={() => {}} />;
      case 'visual-search':
        return <VisualSearchPage onSearch={handleSearch} />;
      default:
        return <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
    }
  };

  const activeAnnouncements = useMemo(() => {
    const now = new Date();
    return allAnnouncements.filter(a => 
        a.isActive && 
        new Date(a.startDate) <= now && 
        new Date(a.endDate) >= now && 
        !dismissedAnnouncements.includes(a.id) &&
        (a.target === 'all' || (user && a.target === `${user.role}s`))
    );
  }, [allAnnouncements, dismissedAnnouncements, user]);

  if (siteSettings?.maintenanceMode.isEnabled) {
    return <MaintenancePage message={siteSettings.maintenanceMode.message} reopenDate={siteSettings.maintenanceMode.reopenDate} />;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (error) {
// FIX: Pass the required 'onNavigateHome' prop to ServerErrorPage.
    return <ServerErrorPage onNavigateHome={() => handleNavigate('home')} />;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {activeAnnouncements.map(ann => (
            <AnnouncementBanner key={ann.id} announcement={ann} onDismiss={(id) => setDismissedAnnouncements(prev => [...prev, id])} />
        ))}
        <Header 
            categories={allCategories}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCart={() => handleNavigate('cart')}
            onNavigateToStores={() => handleNavigate('stores')}
            onNavigateToPromotions={() => handleNavigate('promotions')}
            onNavigateToCategory={handleCategoryClick}
            onNavigateToBecomeSeller={() => handleNavigate('become-seller')}
            onNavigateToSellerDashboard={() => handleNavigate('seller-dashboard')}
            onNavigateToSellerProfile={() => handleNavigate('seller-profile')}
            onNavigateToOrderHistory={() => handleNavigate('order-history')}
            onNavigateToSuperAdminDashboard={() => handleNavigate('superadmin-dashboard')}
            onNavigateToFlashSales={() => handleNavigate('flash-sales')}
            onNavigateToWishlist={() => handleNavigate('wishlist')}
            onNavigateToDeliveryAgentDashboard={() => handleNavigate('delivery-agent-dashboard')}
            onNavigateToDepotAgentDashboard={() => handleNavigate('depot-agent-dashboard')}
            onNavigateToBecomePremium={() => handleNavigate('become-premium')}
            onNavigateToAccount={(tab) => { setActiveAccountTab(tab || 'profile'); handleNavigate('account'); }}
            onNavigateToVisualSearch={() => handleNavigate('visual-search')}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onLogout={handleLogout}
            onSearch={handleSearch}
            isChatEnabled={isChatEnabled}
            isPremiumProgramEnabled={siteSettings?.isPremiumProgramEnabled ?? false}
            logoUrl={siteSettings?.logoUrl || ''}
            onLoginSuccess={handleLoginSuccess}
            notifications={sellerNotifications}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onNavigateFromNotification={handleNavigateFromNotification}
        />
        <main className="flex-grow">
            {renderPage()}
        </main>
        <Footer 
          onNavigate={handleOpenInfoPage}
          logoUrl={siteSettings?.logoUrl || ''}
          paymentMethods={paymentMethods}
        />

        {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} onForgotPassword={handleForgotPassword}/>}
        {isForgotPasswordModalOpen && <ForgotPasswordModal onClose={() => setIsForgotPasswordModalOpen(false)} onEmailSubmit={(email) => { setEmailForPasswordReset(email); setIsForgotPasswordModalOpen(false); handleNavigate('reset-password'); }}/>}
        
        {isModalOpen && modalProduct && <AddToCartModal product={modalProduct} onClose={uiCloseModal} onNavigateToCart={() => { uiCloseModal(); handleNavigate('cart'); }} />}
        
        {viewingStoriesOfStore && <StoryViewer store={viewingStoriesOfStore} onClose={() => setViewingStoriesOfStore(null)}/>}

        {promotionModalProduct && <PromotionModal product={promotionModalProduct} onClose={() => setPromotionModalProduct(null)} onSave={async (productId, promoPrice, startDate, endDate) => {
          const updated = await apiFetch(`/products/${productId}`, { method: 'PUT', body: JSON.stringify({ promotionPrice: promoPrice, promotionStartDate: startDate, promotionEndDate: endDate }) });
          setAllProducts(ps => ps.map(p => p.id === productId ? {...p, promotionPrice: promoPrice, promotionStartDate: startDate, promotionEndDate: endDate} : p));
          setPromotionModalProduct(null);
        }}/>}

        {isComparisonEnabled && comparisonList.length > 0 && <ComparisonBar onCompareClick={() => handleNavigate('comparison')}/>}

        {isChatEnabled && user && <ChatWidget allUsers={allUsers} allProducts={allProducts} allCategories={allCategories} />}
    </div>
  );
// --- FIX END ---
}