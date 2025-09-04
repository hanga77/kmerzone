


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
import type { Product, Category, Store, Review, Order, Address, OrderStatus, User, SiteActivityLog, FlashSale, DocumentStatus, PickupPoint, NewOrderData, TrackingEvent, PromoCode, Warning, SiteSettings, CartItem, UserRole, Payout, Advertisement, Discrepancy, Story, UserAvailabilityStatus, DisputeMessage, StatusChangeLogEntry, FlashSaleProduct, RequestedDocument, SiteContent, Ticket, TicketMessage, TicketStatus, TicketPriority, Announcement, PaymentMethod, Page, Notification } from './types';
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

const initialCategories: Category[] = [
    // Main Categories
    { id: 'cat-vetements', name: 'Vêtements et chaussures', imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop' },
    { id: 'cat-accessoires', name: 'Accessoires & bijoux', imageUrl: 'https://images.unsplash.com/photo-1611652022417-a551155e9984?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-beaute', name: 'Beauté', imageUrl: 'https://images.unsplash.com/photo-1596422846543-75c6fc101b89?q=80&w=2070&auto=format&fit=crop' },
    { id: 'cat-mobilier', name: 'Mobilier (Meubles)', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop' },
    { id: 'cat-electronique', name: 'Électronique', imageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=1925&auto=format&fit=crop' },
    { id: 'cat-textile', name: 'Textile maison', imageUrl: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-bureau', name: 'Fournitures de bureau', imageUrl: 'https://images.unsplash.com/photo-1456735185569-8a8b122b1236?q=80&w=2068&auto=format&fit=crop' },
    { id: 'cat-animaux', name: 'Produits pour animaux', imageUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-loisirs', name: 'Loisirs & Créativité', imageUrl: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-jardin', name: 'Maison & Jardin', imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1925&auto=format&fit=crop' },
    { id: 'cat-electronique-grand-public', name: 'Électronique grand public', imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f82acb?q=80&w=2070&auto=format&fit=crop' },
    { id: 'cat-enfants', name: 'Produits pour enfants et scolaires', imageUrl: 'https://images.unsplash.com/photo-1518498391512-42f5b89a81c1?q=80&w=2070&auto=format&fit=crop' },

    // Sub-categories
    { id: 'sub-vetements', parentId: 'cat-vetements', name: 'Vêtements', imageUrl: 'https://images.unsplash.com/photo-1612053648936-285a2b342c8d?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-chaussures', parentId: 'cat-vetements', name: 'Chaussures', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-sacs', parentId: 'cat-accessoires', name: 'Sacs', imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1935&auto=format&fit=crop' },
    { id: 'sub-montres', parentId: 'cat-accessoires', name: 'Montres', imageUrl: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-lunettes', parentId: 'cat-accessoires', name: 'Lunettes', imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1780&auto=format&fit=crop' },
    { id: 'sub-bijoux', parentId: 'cat-accessoires', name: 'Bijoux', imageUrl: 'https://images.unsplash.com/photo-1611591437281-462bf4d3ab45?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-accessoires-cheveux', parentId: 'cat-accessoires', name: 'Accessoires cheveux', imageUrl: 'https://images.unsplash.com/photo-1599386348459-717a6a70a040?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-cosmetiques', parentId: 'cat-beaute', name: 'Cosmétiques', imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90137ba0a43?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-parfums', parentId: 'cat-beaute', name: 'Parfums', imageUrl: 'https://images.unsplash.com/photo-1585399009939-f4639a4f78d1?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-chaises', parentId: 'cat-mobilier', name: 'Chaises', imageUrl: 'https://images.unsplash.com/photo-1561582299-a403c00a0063?q=80&w=1964&auto=format&fit=crop' },
    { id: 'sub-autres-meubles', parentId: 'cat-mobilier', name: 'Autres meubles', imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=2160&auto=format&fit=crop' },
    { id: 'sub-chargeurs-cables-batteries', parentId: 'cat-electronique', name: 'Chargeurs, câbles, batteries', imageUrl: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-rideaux', parentId: 'cat-textile', name: 'Rideaux', imageUrl: 'https://images.unsplash.com/photo-1605334182479-54a4347781c7?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-autres-textiles', parentId: 'cat-textile', name: 'Autres textiles domestiques', imageUrl: 'https://images.unsplash.com/photo-1617325247854-dce5e6a83607?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-papeterie', parentId: 'cat-bureau', name: 'Papeterie', imageUrl: 'https://images.unsplash.com/photo-1600869158702-818a7c168305?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-office-goods', parentId: 'cat-bureau', name: 'Office goods', imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-accessoires-animaux', parentId: 'cat-animaux', name: 'Accessoires pour animaux', imageUrl: 'https://images.unsplash.com/photo-1598808520297-8c24c7f76d23?q=80&w=2071&auto=format&fit=crop' },
    { id: 'sub-artisanat-jeux', parentId: 'cat-loisirs', name: 'Hobbies, artisanat, jeux', imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-decoration', parentId: 'cat-jardin', name: 'Décoration intérieure, luminaire, objets festifs', imageUrl: 'https://images.unsplash.com/photo-1534349762230-e08968f43152?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-telephones-casques', parentId: 'cat-electronique-grand-public', name: 'Téléphones, casques, électroménagers', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1780&auto=format&fit=crop' },
    { id: 'sub-jouets-fournitures', parentId: 'cat-enfants', name: 'Jouets, fournitures scolaires', imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=2070&auto=format&fit=crop' },
];

const initialProducts: Product[] = [
    { id: '1', name: 'Ndolé Royal', price: 3500, promotionPrice: 3000, imageUrls: ['https://images.unsplash.com/photo-1604329352680-e4a2896d8c22?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Le plat national du Cameroun, un délicieux mélange de légumes, d'arachides et de viande ou de poisson.", reviews: [{author: "Jean P.", rating: 5, comment: "Incroyable !", date: "2023-10-10", status: 'approved'}], stock: 15, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '2', name: 'Robe en Tissu Pagne', price: 15000, imageUrls: ['https://images.unsplash.com/photo-1617051395299-52d33b7336b1?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Une robe élégante confectionnée à la main avec du tissu pagne de haute qualité.", reviews: [{author: "Aïcha B.", rating: 4, comment: "Très belles couleurs.", date: "2023-10-11", status: 'approved'}], stock: 8, categoryId: 'sub-vetements', status: 'published', brand: 'Kmer Fashion' },
    { id: '3', name: 'Savon Artisanal à l\'huile d\'olive', price: 1500, imageUrls: ['https://images.unsplash.com/photo-1600966492337-1d83c4bee955?q=80&w=2070&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Un savon artisanal fabriqué localement. Doux pour la peau et respectueux de l'environnement.", reviews: [], stock: 50, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '4', name: 'Smartphone Pro Max', price: 75000, promotionPrice: 69900, imageUrls: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1965&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un smartphone performant avec un excellent rapport qualité-prix. Grand écran et bonne autonomie.", reviews: [{author: "Eric K.", rating: 5, comment: "Super téléphone pour le prix.", date: "2023-10-12", status: 'approved'}], stock: 4, categoryId: 'sub-telephones-casques', status: 'published', promotionStartDate: '2024-07-01', promotionEndDate: '2024-07-31', brand: 'TechPro' },
    { id: '5', name: 'Miel d\'Oku', price: 5000, imageUrls: ['https://images.unsplash.com/photo-1558642754-b27b3b95a8a9?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Un miel blanc rare et primé, récolté sur les flancs du mont Oku.", reviews: [{author: "Fatima G.", rating: 5, comment: "Le meilleur miel que j'ai jamais goûté.", date: "2023-10-13", status: 'approved'}], stock: 25, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '6', name: 'Sandales en cuir', price: 8000, imageUrls: ['https://images.unsplash.com/photo-1620652755231-c2f8b16a2b8e?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Sandales en cuir véritable, faites à la main. Confortables et durables.", reviews: [], stock: 10, categoryId: 'sub-chaussures', status: 'draft', brand: 'Kmer Fashion' },
    { id: '7', name: 'Poulet DG', price: 6500, imageUrls: ['https://images.unsplash.com/photo-1543339308-43e59d6b70a6?q=80&w=2070&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Un plat de fête succulent avec du poulet frit, des plantains et une sauce riche en légumes.", reviews: [], stock: 12, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '8', name: 'Jus de Bissap Naturel', price: 1000, imageUrls: ['https://images.unsplash.com/photo-1623341214825-9f4f96d62c54?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Boisson rafraîchissante et naturelle à base de fleurs d'hibiscus.", reviews: [], stock: 30, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '9', name: 'Beignets Haricots Bouillie', price: 1500, imageUrls: ['https://img.cuisineaz.com/660x660/2022/01/24/i181710-beignets-souffles-camerounais.jpeg'], vendor: 'Mama Africa', description: "Le petit-déjeuner camerounais par excellence. Des beignets soufflés accompagnés d'une purée de haricots.", reviews: [], stock: 20, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '10', name: 'Chemise en Toghu', price: 25000, imageUrls: ['https://i.pinimg.com/564x/a0/0c/37/a00c3755255673a5a415958253a5f82c.jpg'], vendor: 'Kmer Fashion', description: "Chemise de cérémonie pour homme, en velours noir brodé avec les motifs colorés traditionnels du Toghu.", reviews: [], stock: 5, categoryId: 'sub-vetements', status: 'published', brand: 'Kmer Fashion' },
    { id: '11', name: 'Poivre de Penja', price: 4500, imageUrls: ['https://images.unsplash.com/photo-1508616258423-f3e4e73b29b4?q=80&w=1935&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Considéré comme l'un des meilleurs poivres au monde, cultivé sur les terres volcaniques de Penja.", reviews: [], stock: 40, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '12', name: 'Sac à main en pagne', price: 12000, imageUrls: ['https://images.unsplash.com/photo-1566150905458-1bf1f2961239?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Accessoirisez votre tenue avec ce magnifique sac à main fait main, alliant cuir et tissu pagne.", reviews: [], stock: 15, categoryId: 'sub-sacs', status: 'published', brand: 'Kmer Fashion' },
    { id: '13', name: 'Téléviseur LED 32"', price: 85000, imageUrls: ['https://images.unsplash.com/photo-1593359677879-a4bb92f82acb?q=80&w=2070&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un téléviseur LED de 32 pouces avec une image de haute qualité.", reviews: [], stock: 9, categoryId: 'sub-telephones-casques', status: 'published', brand: 'ViewSonic' },
    { id: '14', name: 'Fer à repasser', price: 7500, imageUrls: ['https://images.unsplash.com/photo-1622629734636-95a239552382?q=80&w=1932&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Simple, efficace et durable. Ce fer à repasser est parfait pour un usage quotidien.", reviews: [], stock: 25, categoryId: 'sub-telephones-casques', status: 'published', brand: 'Generic' },
    { id: '15', name: 'Blender / Mixeur', price: 18000, imageUrls: ['https://images.unsplash.com/photo-1582142391035-61f20a003881?q=80&w=1974&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un mixeur puissant pour préparer vos jus, soupes et sauces. Bol en verre robuste de 1.5L.", reviews: [], stock: 18, categoryId: 'sub-telephones-casques', status: 'published', brand: 'MixWell' },
    { id: '16', name: 'Savon noir gommant', price: 2500, imageUrls: ['https://images.unsplash.com/photo-1623461624469-8a964343169f?q=80&w=1974&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Savon noir africain pour un gommage naturel et une peau douce et purifiée.", reviews: [], stock: 40, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '17', name: 'Huile de coco vierge', price: 4000, imageUrls: ['https://images.unsplash.com/photo-1590945259635-e1a532ac9695?q=80&w=1974&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Huile de coco 100% pure et pressée à froid. Idéale pour la peau, les cheveux et la cuisson.", reviews: [], stock: 30, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '18', name: 'Beurre de karité', price: 3000, imageUrls: ['https://images.unsplash.com/photo-1554153041-33924bb6aa67?q=80&w=2070&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Beurre de karité brut et non raffiné, parfait pour hydrater en profondeur la peau et les cheveux secs.", reviews: [], stock: 60, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '19', name: 'Baskets de Ville', price: 22000, imageUrls: ['https://images.unsplash.com/photo-1515955656352-a1fa3ffcdda9?q=80&w=2070&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Baskets confortables et stylées pour un usage quotidien.", reviews: [], stock: 20, categoryId: 'sub-chaussures', status: 'published', brand: 'CityWalkers' },
    { id: '20', name: 'Eau de Parfum "Sawa"', price: 28000, imageUrls: ['https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1904&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Un parfum boisé et épicé pour homme, inspiré par la côte camerounaise.", reviews: [], stock: 15, categoryId: 'sub-parfums', status: 'published', brand: 'Douala Soaps' },
    { id: '21', name: 'Fauteuil en Rotin', price: 45000, imageUrls: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1965&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Fauteuil artisanal en rotin, parfait pour votre salon ou votre terrasse.", reviews: [], stock: 5, categoryId: 'sub-chaises', status: 'published', brand: 'HomeDecor' },
    { id: '22', name: 'Masque décoratif Fang', price: 18000, imageUrls: ['https://images.unsplash.com/photo-1513480749022-2f7a0b1e4a1a?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Authentique masque décoratif de l'ethnie Fang, sculpté à la main.", reviews: [], stock: 10, categoryId: 'sub-decoration', status: 'published', brand: 'Artisanat Local' },
    { id: '23', name: 'Lampe de chevet "Wouri"', price: 13500, imageUrls: ['https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=1974&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Lampe de chevet au design moderne avec une base en bois local.", reviews: [], stock: 22, categoryId: 'sub-decoration', status: 'published', brand: 'HomeDecor' },
    { id: '24', name: 'Collier de perles', price: 9500, imageUrls: ['https://images.unsplash.com/photo-1599643477877-539eb8a52f18?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Collier artisanal fait de perles traditionnelles colorées.", reviews: [], stock: 30, categoryId: 'sub-bijoux', status: 'published', brand: 'Artisanat Local' },
    { id: '25', name: 'Montre Classique Homme', price: 32000, imageUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Montre élégante avec bracelet en cuir, idéale pour le bureau ou les sorties.", reviews: [], stock: 12, categoryId: 'sub-montres', status: 'published', brand: 'TimeMaster' },
    { id: '26', name: 'Poupée "Penda"', price: 7000, imageUrls: ['https://images.unsplash.com/photo-1620243423599-da1c88a51e6c?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Poupée en tissu pagne, faite à la main, pour le bonheur des plus petits.", reviews: [], stock: 25, categoryId: 'sub-jouets-fournitures', status: 'published', brand: 'Artisanat Local' },
    { id: '27', name: 'Lot de 10 Cahiers', price: 2500, imageUrls: ['https://images.unsplash.com/photo-1529142893173-665a0a1027c4?q=80&w=2070&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un lot de 10 cahiers de 100 pages pour la rentrée scolaire.", reviews: [], stock: 100, categoryId: 'sub-papeterie', status: 'published', brand: 'School Essentials' },
    { id: '28', name: 'Bière "33" Export (Pack de 6)', price: 4000, imageUrls: ['https://www.bebe-cash.com/wp-content/uploads/2021/07/33-export.jpg'], vendor: 'Mama Africa', description: "La bière blonde de référence au Cameroun. Pack de 6 bouteilles de 65cl.", reviews: [], stock: 50, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '29', name: 'Café Arabica en Grains', price: 6000, imageUrls: ['https://images.unsplash.com/photo-1559449272-4d24b2f27b72?q=80&w=1974&auto=format&fit=crop'], vendor: 'Bafoussam Brews', description: "Café Arabica de l'Ouest Cameroun, torréfaction artisanale. Sachet de 500g.", reviews: [], stock: 30, categoryId: 'sub-autres-textiles', status: 'published', brand: 'Bafoussam Brews' },
    { id: '30', name: 'Statuette en bois d\'ébène', price: 22000, imageUrls: ['https://i.pinimg.com/564x/7d/50/e0/7d50e0529d1ccf1b36952d76d4a52efc.jpg'], vendor: 'Limbe Arts & Crafts', description: "Statuette finement sculptée à la main par des artisans de la région du Sud-Ouest.", reviews: [], stock: 8, categoryId: 'sub-decoration', status: 'published', brand: 'Limbe Arts & Crafts' },
    { id: '31', name: 'Tableau d\'art contemporain', price: 48000, imageUrls: ['https://i.pinimg.com/564x/e7/7d/1f/e77d1f6d396a84c25f573453347f31b2.jpg'], vendor: 'Limbe Arts & Crafts', description: "Peinture sur toile vibrante, représentant une scène de marché local.", reviews: [], stock: 3, categoryId: 'sub-decoration', status: 'published', brand: 'Limbe Arts & Crafts' },
    { id: '32', name: 'Écouteurs sans fil', price: 12500, imageUrls: ['https://images.unsplash.com/photo-1606220588913-b35474623dc5?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kribi Digital', description: "Écouteurs Bluetooth avec une bonne autonomie et un son clair. Idéal pour la musique et les appels.", reviews: [], stock: 25, categoryId: 'sub-chargeurs-cables-batteries', status: 'draft' }, // In draft, store is pending
    { id: '33', name: 'Café Robusta Moulu', price: 4500, imageUrls: ['https://images.unsplash.com/photo-1611162458022-20c24b071a2a?q=80&w=2070&auto=format&fit=crop'], vendor: 'Bafoussam Brews', description: "Café Robusta puissant et aromatique, parfait pour un expresso corsé. Sachet de 500g.", reviews: [], stock: 40, categoryId: 'sub-autres-textiles', status: 'published', brand: 'Bafoussam Brews' },
];

const sampleDeliveredOrder: Order = {
    id: 'ORDER-SAMPLE-1',
    userId: 'customer-1', // A generic customer ID
    items: [
        // Using a non-null assertion because we know these products exist in initialProducts
        { ...initialProducts.find(p => p.id === '1')!, quantity: 1 }, // Ndolé Royal
        { ...initialProducts.find(p => p.id === '5')!, quantity: 2 }  // Miel d'Oku
    ],
    subtotal: 13000, // 3000 (promo) + 2 * 5000 = 13000
    deliveryFee: 1000,
    total: 14000,
    shippingAddress: { fullName: 'Client de Test', phone: '655555555', address: '123 Rue du Test', city: 'Yaoundé' },
    deliveryMethod: 'home-delivery',
    orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
    trackingNumber: 'KZSAMPLE1',
    agentId: 'agent-1',
    trackingHistory: [
        { status: 'confirmed', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), location: 'Mama Africa', details: 'Commande confirmée' },
        { status: 'picked-up', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), location: 'Livreur', details: 'Colis pris en charge' },
        { status: 'delivered', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), location: 'Yaoundé', details: 'Livré avec succès' }
    ]
};

const sampleDeliveredOrder2: Order = {
    id: 'ORDER-SAMPLE-2',
    userId: 'customer-1',
    items: [
        { ...initialProducts.find(p => p.id === '2')!, quantity: 1 }, // Robe en Tissu Pagne
        { ...initialProducts.find(p => p.id === '12')!, quantity: 1 } // Sac à main
    ],
    subtotal: 27000,
    deliveryFee: 1000,
    total: 28000,
    shippingAddress: { fullName: 'Client de Test 2', phone: '655555556', address: '456 Rue du Test', city: 'Douala' },
    deliveryMethod: 'home-delivery',
    orderDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
    status: 'delivered',
    trackingNumber: 'KZSAMPLE2',
    trackingHistory: [],
};

const sampleDeliveredOrder3: Order = {
    id: 'ORDER-SAMPLE-3',
    userId: 'customer-1',
    items: [
        { ...initialProducts.find(p => p.id === '13')!, quantity: 1 } // TV
    ],
    subtotal: 85000,
    deliveryFee: 2500,
    total: 87500,
    shippingAddress: { fullName: 'Client de Test 3', phone: '655555557', address: '789 Rue du Test', city: 'Yaoundé' },
    deliveryMethod: 'home-delivery',
    orderDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months ago
    status: 'delivered',
    trackingNumber: 'KZSAMPLE3',
    trackingHistory: [],
};

const initialStores: Store[] = [
    { 
        id: 'store-1', name: 'Kmer Fashion', logoUrl: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/fashion-brand-logo-design-template-5355651c6b65163155af4e2c246f5647_screen.jpg?ts=1675753069', 
        bannerUrl: 'https://images.unsplash.com/photo-1555529669-e69e70197a29?q=80&w=2070&auto=format&fit=crop',
        category: 'Mode et Vêtements', warnings: [], status: 'active', premiumStatus: 'premium',
        location: 'Douala', neighborhood: 'Akwa', sellerFirstName: 'Aïcha', sellerLastName: 'Bakari', sellerPhone: '699887766',
        physicalAddress: '45 Avenue de la Mode, Akwa', latitude: 4.0483, longitude: 9.7020, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-15T00:00:00.000Z',
        documents: [
            { name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' },
            { name: "Registre de Commerce", status: 'uploaded', fileUrl: '...' },
        ],
        stories: [{id: 's1', imageUrl: 'https://i.pinimg.com/564x/08/94/a3/0894a30e8a719c676767576f3f054812.jpg', createdAt: new Date().toISOString() }]
    },
    { 
        id: 'store-2', name: 'Mama Africa', logoUrl: 'https://img.freepik.com/vecteurs-premium/modele-logo-cuisine-africaine_210834-31.jpg', 
        bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop',
        category: 'Alimentation', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Bastos', sellerFirstName: 'Jeanne', sellerLastName: 'Abena', sellerPhone: '677665544',
        physicalAddress: '12 Rue des Saveurs, Bastos', latitude: 3.8968, longitude: 11.5213, subscriptionStatus: 'overdue', subscriptionDueDate: '2024-07-10T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'requested' }]
    },
    { 
        id: 'store-3', name: 'Electro Plus', logoUrl: 'https://cdn.dribbble.com/users/188652/screenshots/1029415/electro-logo-2.jpg', 
        bannerUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=2069&auto=format&fit=crop',
        category: 'Électronique', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Mokolo', sellerFirstName: 'Paul', sellerLastName: 'Kouam', sellerPhone: '655443322',
        physicalAddress: 'Grand Marché Mokolo, Stand 52', latitude: 3.8731, longitude: 11.5152, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-20T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }]
    },
    { 
        id: 'store-4', name: 'Douala Soaps', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-M3k_vJXuV2zD6D3XoJzQZzO8Z6O8Z6O8Q&s', 
        bannerUrl: 'https://images.unsplash.com/photo-1583947581920-8025819a58a7?q=80&w=2071&auto=format&fit=crop',
        category: 'Beauté et Hygiène', warnings: [], status: 'suspended', premiumStatus: 'standard',
        location: 'Douala', neighborhood: 'Bonapriso', sellerFirstName: 'Céline', sellerLastName: 'Ngassa', sellerPhone: '691234567',
        physicalAddress: 'Rue Njo-Njo, Bonapriso', latitude: 4.0321, longitude: 9.715, subscriptionStatus: 'inactive',
        documents: [{ name: "Registre de Commerce", status: 'rejected', rejectionReason: 'Document illisible.' }]
    },
     { 
        id: 'store-5', name: 'Yaoundé Style', logoUrl: 'https://img.freepik.com/premium-vector/traditional-african-woman-head-wrap-turban-logo_103045-81.jpg', category: 'Mode et Vêtements', warnings: [], status: 'pending', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Mvog-Ada', sellerFirstName: 'Franck', sellerLastName: 'Essomba', sellerPhone: '698765432',
        physicalAddress: 'Avenue Kennedy', latitude: 3.8647, longitude: 11.521,
        documents: []
    },
    { 
        id: 'store-6', name: 'Bafoussam Brews', logoUrl: 'https://cdn.dribbble.com/users/1586931/screenshots/3443128/coffee-logo-design.png', category: 'Alimentation & Boissons', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Bafoussam', neighborhood: 'Centre Ville', sellerFirstName: 'Pierre', sellerLastName: 'Kamdem', sellerPhone: '696543210',
        physicalAddress: 'Marché Central, Bafoussam', latitude: 5.4744, longitude: 10.4193, subscriptionStatus: 'active', subscriptionDueDate: '2024-09-01T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }]
    },
    { 
        id: 'store-7', name: 'Limbe Arts & Crafts', logoUrl: 'https://i.pinimg.com/736x/8a/9e-12/8a9e-1261a8779728283575647585355e.jpg', category: 'Artisanat & Décoration', warnings: [], status: 'active', premiumStatus: 'premium',
        location: 'Limbe', neighborhood: 'Down Beach', sellerFirstName: 'Sarah', sellerLastName: 'Eko', sellerPhone: '678901234',
        physicalAddress: 'Bord de mer, Limbe', latitude: 4.0165, longitude: 9.2131, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-25T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }, { name: "Registre de Commerce", status: 'verified', fileUrl: '...' }],
        stories: [{id: 's2', imageUrl: 'https://i.pinimg.com/564x/c7/2b/42/c72b429158221c97a552e67a145cb1d6.jpg', createdAt: new Date().toISOString() }]
    },
    { 
        id: 'store-8', name: 'Kribi Digital', logoUrl: 'https://static.vecteezy.com/system/resources/previews/007/618/856/non_2x/kd-logo-k-d-design-white-kd-letter-kd-letter-logo-design-initial-letter-kd-linked-circle-uppercase-monogram-logo-vector.jpg', category: 'Électronique', warnings: [], status: 'pending', premiumStatus: 'standard',
        location: 'Kribi', neighborhood: 'Centre', sellerFirstName: 'David', sellerLastName: 'Lobe', sellerPhone: '654321098',
        physicalAddress: 'Avenue des Banques, Kribi', latitude: 2.9431, longitude: 9.9077,
        documents: []
    },
];

const initialFlashSales: FlashSale[] = [
    {
      id: 'fs1',
      name: 'Vente Flash de la Rentrée',
      startDate: '2024-07-20T00:00:00.000Z',
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Ends in 3 days
      products: [
        { productId: '4', sellerShopName: 'Electro Plus', flashPrice: 68000, status: 'approved' },
        { productId: '2', sellerShopName: 'Kmer Fashion', flashPrice: 12000, status: 'approved' },
        { productId: '16', sellerShopName: 'Douala Soaps', flashPrice: 2000, status: 'pending' },
        { productId: '5', sellerShopName: 'Mama Africa', flashPrice: 4500, status: 'rejected' },
      ],
    },
];

const initialPickupPoints: PickupPoint[] = [
    { id: 'pp1', name: 'Relais KMER ZONE - Akwa', city: 'Douala', neighborhood: 'Akwa', street: 'Rue de la Joie', latitude: 4.047, longitude: 9.704 },
    { id: 'pp2', name: 'Relais KMER ZONE - Bonamoussadi', city: 'Douala', neighborhood: 'Bonamoussadi', street: 'Carrefour Kotto', latitude: 4.09, longitude: 9.74 },
    { id: 'pp3', name: 'Relais KMER ZONE - Bastos', city: 'Yaoundé', neighborhood: 'Bastos', street: 'Avenue des Banques', latitude: 3.89, longitude: 11.52 },
];

const initialSiteSettings: SiteSettings = {
  logoUrl: '',
  isStoriesEnabled: true,
  isPremiumProgramEnabled: true,
  premiumThresholds: { orders: 10, spending: 50000 },
  premiumCautionAmount: 10000,
  isPremiumPlusEnabled: true,
  premiumPlusAnnualFee: 25000,
  requiredSellerDocuments: {
      "CNI (Carte Nationale d'Identité)": true,
      "Registre de Commerce": true,
      "Photo du gérant": false,
      "Plan de localisation": false,
  },
  isRentEnabled: true,
  rentAmount: 5000,
  canSellersCreateCategories: true,
  commissionRate: 10,
  deliverySettings: {
    intraUrbanBaseFee: 1000, // Example value for same-city delivery
    interUrbanBaseFee: 2500, // Example value for different-city delivery
    costPerKg: 500,        // Example value for cost per kg surcharge
  },
  maintenanceMode: {
      isEnabled: false,
      message: "Nous effectuons une mise à jour. Nous serons de retour très bientôt !",
      reopenDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  }
};

const initialSiteContent: SiteContent[] = [
  {
    slug: 'about',
    title: "À propos de KMER ZONE",
    content: "KMER ZONE est la première plateforme e-commerce camerounaise dédiée à la mise en relation directe des commerçants locaux et des consommateurs. Notre mission est de démocratiser l'accès au commerce en ligne, de valoriser les produits locaux et de simplifier l'expérience d'achat pour tous les Camerounais."
  },
  {
    slug: 'contact',
    title: "Contactez-nous",
    content: "Pour toute question, partenariat ou assistance, veuillez nous contacter à l'adresse suivante : support@kmerzone.com. Notre équipe est disponible 24/7 pour vous aider."
  },
  {
    slug: 'faq',
    title: "Foire Aux Questions (FAQ)",
    content: "Q: Quels sont les délais de livraison ?\nR: Les délais varient entre 24h et 72h en fonction de votre localisation et de celle du vendeur.\n\nQ: Les paiements sont-ils sécurisés ?\nR: Oui, nous utilisons les plateformes de paiement mobile les plus fiables du pays pour garantir la sécurité de vos transactions."
  },
  {
    slug: 'careers',
    title: "Carrières",
    content: "Rejoignez une équipe dynamique et passionnée qui révolutionne le e-commerce au Cameroun ! Consultez nos offres d'emploi sur notre page LinkedIn ou envoyez votre candidature spontanée à careers@kmerzone.com."
  },
  {
    slug: 'sell',
    title: "Vendre sur KMER ZONE",
    content: "Augmentez votre visibilité et vos ventes en rejoignant notre marketplace. L'inscription est simple et rapide. Cliquez sur 'Devenir vendeur' en haut de la page pour commencer votre aventure avec nous !"
  },
  {
    slug: 'training-center',
    title: "Centre de formation",
    content: "Bientôt disponible : des tutoriels et des guides pour vous aider à maximiser vos ventes."
  },
  {
    slug: 'logistics',
    title: "Logistique & Livraison",
    content: "Notre réseau de livreurs est à votre disposition pour garantir des livraisons rapides et fiables à vos clients."
  }
];

const initialAdvertisements: Advertisement[] = [
    { id: 'ad1', imageUrl: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1920&auto=format&fit=crop', linkUrl: '#', location: 'homepage-banner', isActive: true },
    { id: 'ad2', imageUrl: 'https://images.unsplash.com/photo-1598327105151-586673437584?q=80&w=1920&auto=format&fit=crop', linkUrl: '#', location: 'homepage-banner', isActive: true },
];

const initialPaymentMethods: PaymentMethod[] = [
    { id: 'pm1', name: 'Orange Money', imageUrl: 'data:image/svg+xml;utf8,<svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-label="Orange Money Logo"><rect width="64" height="40" rx="4" fill="%23FF7900"/><text x="32" y="22" font-family="Helvetica, Arial, sans-serif" font-size="9" font-weight="bold" fill="white" text-anchor="middle">ORANGE</text><text x="32" y="31" font-family="Helvetica, Arial, sans-serif" font-size="9" font-weight="bold" fill="white" text-anchor="middle">MONEY</text><rect x="8" y="8" width="10" height="7" rx="2" fill="white" fill-opacity="0.8"/></svg>' },
    { id: 'pm2', name: 'MTN MoMo', imageUrl: 'data:image/svg+xml;utf8,<svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-label="MTN Mobile Money Logo"><rect width="64" height="40" rx="4" fill="%23FFCC00"/><text x="32" y="26" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="bold" fill="%23004F9F" text-anchor="middle">MoMo</text><rect x="8" y="8" width="10" height="7" rx="2" fill="%23004F9F" fill-opacity="0.8"/></svg>' },
    { id: 'pm3', name: 'Visa', imageUrl: 'data:image/svg+xml;utf8,<svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-label="Visa Logo"><rect width="64" height="40" rx="4" fill="white" stroke="%23E0E0E0"/><path d="M24.7,25.8h-3.4L17.6,14h3.8l2,7.1c0.4,1.6,0.6,2.7,0.8,3.6h0.1c0.2-0.9,0.5-2.1,0.8-3.6l2-7.1h3.7L24.7,25.8z M45.1,14.2c-0.8-0.2-1.9-0.5-3.1-0.5c-3.1,0-5.4,1.7-5.4,4.2c0,2.1,1.7,3.4,3.1,4.1c1.4,0.6,1.9,1,1.9,1.6c0,0.8-0.9,1.2-2.1,1.2c-1.6,0-2.4-0.3-3.3-0.6l-0.5-0.2l-0.6,3.2c0.8,0.3,2.3,0.5,4,0.5c3.3,0,5.6-1.7,5.6-4.4c0-2.6-1.9-3.7-3.4-4.4c-1.3-0.6-1.7-1-1.7-1.5c0-0.5,0.6-1.1,2-1.1c1.3,0,2.1,0.3,2.8,0.6l0.4,0.2L45.1,14.2z M47,14h-3.1l-2.1,11.8h3.8L47,14z M14.8,14.2l-3,11.6h3.7l3-11.6H14.8z" fill="%23142688" /></svg>' },
    { id: 'pm4', name: 'Mastercard', imageUrl: 'data:image/svg+xml;utf8,<svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard Logo"><rect width="64" height="40" rx="4" fill="white" stroke="%23E0E0E0"/><circle cx="26" cy="20" r="8" fill="%23EA001B"/><circle cx="38" cy="20" r="8" fill="%23F79E1B"/><path d="M32,20 a8,8 0 0,1 -6,-1.41a8,8 0 0,0 0,2.82a8,8 0 0,1 6,1.41a8,8 0 0,0 6,-1.41a8,8 0 0,1 0,-2.82A8,8 0 0,0 32,20Z" fill="%23FF5F00" /></svg>' },
    { id: 'pm5', name: 'PayPal', imageUrl: 'data:image/svg+xml;utf8,<svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal Logo"><rect width="64" height="40" rx="4" fill="%23003087"/><path fill="white" d="M32.12,12.62c-2.28-.1-4.2,1.3-4.72,3.42-.64,2.58.74,4.52,2.7,5.2,2.16.76,4.48.3,5.92-1.32,1.26-1.42,1.68-3.32,1-5.12-1.02-3.1-3.6-4.5-5-4.2h.1Z"/><path fill="%23009cde" d="M29.1,19.2c-.52,2.12,1.02,4,2.94,4.54,2.14.6,4.5.1,5.9-1.52.92-1.04,1.2-2.38.74-3.6-.82-2.18-3-3.44-4.9-2.92h.22Z"/></svg>' },
];

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

  const [allProducts, setAllProducts] = usePersistentState<Product[]>('allProducts', initialProducts);
  const [allCategories, setAllCategories] = usePersistentState<Category[]>('allCategories', initialCategories);
  const [allStores, setAllStores] = usePersistentState<Store[]>('allStores', initialStores);
  const [allOrders, setAllOrders] = usePersistentState<Order[]>('allOrders', [sampleDeliveredOrder, sampleDeliveredOrder2, sampleDeliveredOrder3]);
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

    const { user, logout: authLogout, allUsers, setAllUsers, updateUser: authUpdateUser, resetPassword, login, register } = useAuth();
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
        // Log application start if no logs exist yet.
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
    }, [setSiteActivityLogs, siteActivityLogs.length]); // FIX: Added missing dependencies

    const userId = user?.id;

    useEffect(() => {
        if (userId) {
            const currentUserInList = allUsers.find(u => u.id === userId);
            if (!currentUserInList || currentUserInList.role !== 'customer' || !siteSettings.isPremiumProgramEnabled) return;
            if (currentUserInList.loyalty.status !== 'standard' || currentUserInList.loyalty.premiumStatusMethod === 'deposit') return;
            const userOrders = allOrders.filter(o => o.userId === userId && o.status === 'delivered');
            const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
            const orderCount = userOrders.length;
            const shouldBePremium = orderCount >= siteSettings.premiumThresholds.orders || totalSpent >= siteSettings.premiumThresholds.spending;
            if (shouldBePremium) {
                setAllUsers(users => users.map(u => u.id === userId ? { ...u, loyalty: { ...u.loyalty, status: 'premium' as const, premiumStatusMethod: 'loyalty' as const } } : u));
            }
        }
    }, [allOrders, allUsers, userId, siteSettings, setAllUsers]);

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
        setAllProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            newOrder.items.forEach(item => {
                const productIndex = updatedProducts.findIndex(p => p.id === item.id);
                if (productIndex !== -1) {
                    const newStock = updatedProducts[productIndex].stock - item.quantity;
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
    }, [logActivity, setAllProducts, setAllOrders, clearCart, handleNavigate, onApplyPromoCode, setAllPromoCodes]);
    
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
                const productName = allProducts.find(p => p.id === productId)?.name || `ID ${productId}`;
                logActivity('Flash Sale Submission Reviewed', `Submission for "${productName}" in sale "${fs.name}" was ${status}.`);
                return { ...fs, products: fs.products.map(p => p.productId === productId ? { ...p, status } : p) };
            }
            return fs;
        }));
    }, [allProducts, setFlashSales, logActivity]);
    
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
                return { ...s, documents: s.documents.map(d => d.name === documentName ? { ...d, status, rejectionReason: reason || undefined } : d) };
            }
            return s;
        }));
    }, [setAllStores, logActivity]);

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
        setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, reviews: [...p.reviews, review] } : p));
         logActivity('Review Added', `New review for product ID ${productId} was submitted by ${review.author}.`);
    }, [setAllProducts, logActivity]);

    const handleReviewModeration = useCallback((productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected') => {
        setAllProducts(prev => prev.map(p => {
            if (p.id === productId) {
                logActivity('Review Moderated', `Review from ${reviewIdentifier.author} on product ${p.name} was ${newStatus}.`);
                return { ...p, reviews: p.reviews.map(r => r.author === reviewIdentifier.author && r.date === reviewIdentifier.date ? { ...r, status: newStatus } : r) };
            }
            return p;
        }));
    }, [setAllProducts, logActivity]);
    
     const handleBecomeSeller = useCallback((shopName: string, location: string, neighborhood: string, sellerFirstName: string, sellerLastName: string, sellerPhone: string, physicalAddress: string, logoUrl: string, latitude?: number, longitude?: number) => {
        if (!user) return;
        const newStore: Store = { id: `store-${Date.now()}`, name: shopName, logoUrl, category: 'Divers', warnings: [], status: 'pending', premiumStatus: 'standard', location, neighborhood, sellerFirstName, sellerLastName, sellerPhone, physicalAddress, latitude, longitude, documents: Object.entries(siteSettings.requiredSellerDocuments).filter(([, isRequired]) => isRequired).map(([name]): RequestedDocument => ({ name, status: 'requested' })) };
        setAllStores(prev => [...prev, newStore]);
        authUpdateUser({ shopName });
        logActivity('Seller Application', `User "${user.name}" applied to become a seller with shop "${shopName}".`);
    }, [user, siteSettings.requiredSellerDocuments, setAllStores, authUpdateUser, logActivity]);

    const handleUpdateOrderWithAdmin = useCallback((order: Order, newStatus: OrderStatus) => {
        const actor = user ? `${user.name} (superadmin)` : 'System';
        const updatedOrder = addStatusLog(order, newStatus, actor);
        setAllOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
        logActivity('Order Status Updated (Admin)', `Admin updated order ${order.id} to ${newStatus}.`);
    }, [user, setAllOrders, logActivity]);
    
    const handleUpdateOrderWithSeller = useCallback((orderId: string, newStatus: OrderStatus) => {
        const order = allOrders.find(o => o.id === orderId);
        if (!order || !user) return;
        const actor = `${user.name} (seller)`;
        const updatedOrder = addStatusLog(order, newStatus, actor);
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        logActivity('Order Status Updated (Seller)', `Seller updated order ${orderId} to ${newStatus}.`);
    }, [allOrders, user, setAllOrders, logActivity]);
    
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
                return { ...o, disputeLog: [...(o.disputeLog || []), newMsg] };
            }
            return o;
        }));
    }, [setAllOrders]);

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
    
    const handleCreateTicket = useCallback((subject: string, message: string, relatedOrderId?: string) => {
        if (!user) return;
        const now = new Date().toISOString();
        const newTicket: Ticket = { id: `TICKET-${Date.now()}`, userId: user.id, userName: user.name, subject, relatedOrderId, status: 'Ouvert', priority: 'Moyenne', createdAt: now, updatedAt: now, messages: [{ authorId: user.id, authorName: user.name, message, date: now }] };
        setAllTickets(prev => [newTicket, ...prev]);
        logActivity('Ticket Created', `User ${user.name} created ticket #${newTicket.id} with subject "${subject}".`);
    }, [user, setAllTickets, logActivity]);

    const handleUserReplyToTicket = useCallback((ticketId: string, message: string) => {
        if (!user) return;
        const now = new Date().toISOString();
        setAllTickets(prev => prev.map(t => {
            if (t.id === ticketId && (t.userId === user.id || user.role === 'superadmin')) {
                const newMessage: TicketMessage = { authorId: user.id, authorName: user.name, message, date: now, };
                const newStatus = user.role === 'superadmin' ? 'En cours' : 'Ouvert';
                return { ...t, status: newStatus, updatedAt: now, messages: [...t.messages, newMessage] };
            }
            return t;
        }));
        logActivity('Ticket Reply', `User ${user.name} replied to ticket #${ticketId}.`);
    }, [user, setAllTickets, logActivity]);

    const handleAdminReplyToTicket = useCallback((ticketId: string, message: string) => {
        if (!user || user.role !== 'superadmin') return;
        handleUserReplyToTicket(ticketId, message);
    }, [user, handleUserReplyToTicket]);
    
    const handleAdminUpdateTicketStatus = useCallback((ticketId: string, status: TicketStatus, priority: TicketPriority) => {
         setAllTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status, priority, updatedAt: new Date().toISOString() } : t));
         logActivity('Ticket Update', `Admin updated ticket #${ticketId} status to ${status} and priority to ${priority}.`);
    }, [setAllTickets, logActivity]);

    const handleCreateOrUpdateAnnouncement = useCallback((announcement: Omit<Announcement, 'id'> | Announcement) => {
        setAllAnnouncements(prev => {
            if ('id' in announcement) {
                logActivity('Announcement Updated', `Announcement "${announcement.title}" was updated.`);
                return prev.map(a => a.id === announcement.id ? announcement : a);
            } else {
                const newAnnouncement = { ...announcement, id: `ANNC-${Date.now()}` };
                logActivity('Announcement Created', `Announcement "${newAnnouncement.title}" was created.`);
                return [newAnnouncement, ...prev];
            }
        });
    }, [setAllAnnouncements, logActivity]);

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
        logActivity('Seller Payout', `Paid ${amount} to store "${store.name}".`);
    }, [setPayouts, logActivity]);

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
                return <HomePage categories={allCategories} products={visibleProducts} stores={allStores.filter(s => s.status === 'active')} flashSales={flashSales} advertisements={advertisements.filter(ad => ad.isActive)} onProductClick={handleProductClick} onCategoryClick={handleCategoryClick} onVendorClick={handleVendorClick} onVisitStore={handleVendorClick} onViewStories={setViewingStoriesOfStore} isComparisonEnabled={isComparisonEnabled} isStoriesEnabled={siteSettings.isStoriesEnabled} recentlyViewedIds={recentlyViewedIds} userOrders={userOrders} wishlist={wishlist} />;
            case 'product':
                return selectedProduct ? <ProductDetail product={selectedProduct} allProducts={visibleProducts} allUsers={allUsers} stores={allStores} flashSales={flashSales} onBack={() => window.history.back()} onAddReview={handleAddReview} onVendorClick={handleVendorClick} onProductClick={handleProductClick} onOpenLogin={() => setIsLoginModalOpen(true)} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onProductView={handleProductView} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'cart':
                return <CartView onBack={() => handleNavigate('home')} onNavigateToCheckout={() => handleNavigate('checkout')} flashSales={flashSales} allPromoCodes={allPromoCodes} appliedPromoCode={appliedPromoCode} onApplyPromoCode={onApplyPromoCode} />;
            case 'checkout':
                return <Checkout onBack={() => handleNavigate('cart')} onOrderConfirm={handlePlaceOrder} flashSales={flashSales} allPickupPoints={allPickupPoints} appliedPromoCode={appliedPromoCode} allStores={allStores} siteSettings={siteSettings} />;
            case 'order-success':
                return selectedOrder ? <OrderSuccess order={selectedOrder} onNavigateHome={() => handleNavigate('home', resetSelections)} onNavigateToOrders={() => handleNavigateToAccount('orders')} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'stores':
                return <StoresPage stores={allStores.filter(s => s.status === 'active')} onBack={() => handleNavigate('home')} onVisitStore={handleVendorClick} onNavigateToStoresMap={() => handleNavigate('stores-map')} />;
            case 'stores-map':
                return <StoresMapPage stores={allStores.filter(s => s.status === 'active' && s.latitude && s.longitude)} onBack={() => handleNavigate('stores')} onVisitStore={handleVendorClick} />;
            case 'become-seller':
                return <BecomeSeller onBack={() => handleNavigate('home')} onBecomeSeller={handleBecomeSeller} onRegistrationSuccess={() => handleNavigate('seller-dashboard')} siteSettings={siteSettings} />;
            case 'category':
                return selectedCategoryId ? <CategoryPage categoryId={selectedCategoryId} allCategories={allCategories} allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home', resetSelections)} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'seller-dashboard':
                return sellerStore ? <SellerDashboard store={sellerStore} products={sellerProducts} categories={allCategories} flashSales={flashSales} sellerOrders={sellerOrders} promoCodes={sellerPromoCodes} onBack={() => handleNavigate('home')} onAddProduct={() => { setProductToEdit(null); handleNavigate('product-form'); }} onEditProduct={(p) => { setProductToEdit(p); handleNavigate('product-form'); }} onDeleteProduct={handleDeleteProduct} onUpdateProductStatus={handleUpdateProductStatus} onNavigateToProfile={() => handleNavigate('seller-profile')} onNavigateToAnalytics={() => handleNavigate('seller-analytics-dashboard')} onSetPromotion={setPromotionModalProduct} onRemovePromotion={handleRemovePromotion} onProposeForFlashSale={handleProposeForFlashSale} onUploadDocument={handleUploadDocument} onUpdateOrderStatus={handleUpdateOrderWithSeller} onCreatePromoCode={handleCreatePromoCode} onDeletePromoCode={handleDeletePromoCode} isChatEnabled={isChatEnabled} onPayRent={handlePayRent} siteSettings={siteSettings} onAddStory={handleAddStory} onDeleteStory={handleDeleteStory} payouts={payouts} onSellerDisputeMessage={handleSellerDisputeMessage} onBulkUpdateProducts={handleBulkUpdateProducts} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
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
            case 'order-history':
                return user ? <OrderHistoryPage userOrders={userOrders} onBack={() => handleNavigate('home')} onSelectOrder={(o) => { setSelectedOrder(o); handleNavigate('order-detail'); }} onRepeatOrder={handleRepeatOrder} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'order-detail':
                return selectedOrder ? <OrderDetailPage order={selectedOrder} onBack={() => handleNavigate('order-history')} allPickupPoints={allPickupPoints} allUsers={allUsers} onCancelOrder={handleCancelOrder} onRequestRefund={handleRequestRefund} onCustomerDisputeMessage={(orderId, msg) => handleAdminDisputeMessage(orderId, msg, 'customer')} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
            case 'promotions':
                return <PromotionsPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'flash-sales':
                return <FlashSalesPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'search-results':
                return <SearchResultsPage searchQuery={searchQuery} allProducts={visibleProducts} allStores={allStores} allCategories={allCategories} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'wishlist':
                return <WishlistPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'delivery-agent-dashboard':
                return user?.role === 'delivery_agent' ? <DeliveryAgentDashboard allOrders={allOrders} allStores={allStores} allPickupPoints={allPickupPoints} onUpdateOrder={handleUpdateOrderFromAgent} onLogout={handleLogout} onUpdateUserAvailability={handleUpdateUserAvailability} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'depot-agent-dashboard':
                return depotAgent ? <DepotAgentDashboard user={depotAgent} allUsers={allUsers} allOrders={allOrders} onCheckIn={() => {}} onReportDiscrepancy={() => {}} onLogout={handleLogout} onProcessDeparture={() => {}}/> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'comparison':
                return <ComparisonPage onBack={() => window.history.back()} allCategories={allCategories} />;
            case 'become-premium':
                return <BecomePremiumPage siteSettings={siteSettings} onBack={() => handleNavigate('home')} onBecomePremiumByCaution={handleBecomePremiumByCaution} onUpgradeToPremiumPlus={handleUpgradeToPremiumPlus} />;
            case 'info':
                return <InfoPage title={infoPageContent.title} content={infoPageContent.content} onBack={() => handleNavigate('home')} />;
            case 'reset-password':
                return <ResetPasswordPage onPasswordReset={handlePasswordReset} onNavigateLogin={handleNavigateLoginFromReset} />;
            case 'account':
                return user ? <AccountPage onBack={() => handleNavigate('home')} initialTab={activeAccountTab} allStores={allStores} onVendorClick={handleVendorClick} allTickets={allTickets} userOrders={userOrders} onCreateTicket={handleCreateTicket} onUserReplyToTicket={handleUserReplyToTicket} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
            case 'visual-search':
                return <VisualSearchPage onSearch={handleSearch} />;
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
        isPremiumProgramEnabled: siteSettings.isPremiumProgramEnabled,
        logoUrl: siteSettings.logoUrl,
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
        logoUrl: siteSettings.logoUrl,
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
            {viewingStoriesOfStore && siteSettings.isStoriesEnabled && (
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