import React, { useState, useMemo } from 'react';
import type { Product, Order, FlashSale, CartItem } from '../types';
import { ArrowLeftIcon, BarChartIcon, CurrencyDollarIcon, ShoppingBagIcon, ArchiveBoxIcon, StarIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

// Utility functions specific to this component
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

  // If no dates, it's a permanent promotion
  if (!startDate && !endDate) return true;

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


export const SellerAnalyticsDashboard: React.FC<{
    onBack: () => void;
    sellerOrders: Order[];
    sellerProducts: Product[];
    flashSales: FlashSale[];
}> = ({ onBack, sellerOrders, sellerProducts, flashSales }) => {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'all'>('all');
    const { t } = useLanguage();
    
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
            const numMonths = (timeRange === 'quarter') ? 3 : 6;
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
        <div className="container mx-auto p-4 sm:p-8 bg-gray-50 dark:bg-gray-900">
            {onBack.toString() !== '() => {}' && (
                <button onClick={onBack} className="text-kmer-green font-semibold mb-6 inline-flex items-center gap-2">
                    <ArrowLeftIcon className="w-5 h-5"/>
                    {t('sellerDashboard.analytics.backToDashboard')}
                </button>
            )}
            <div className="flex items-center gap-3 mb-4">
                <BarChartIcon className="w-8 h-8"/>
                <h1 className="text-3xl font-bold">{t('sellerDashboard.analytics.title')}</h1>
            </div>
             <div className="flex items-center gap-2 mb-8 flex-wrap">
                <p className="font-semibold text-sm">{t('sellerDashboard.analytics.period')}</p>
                <TimeRangeButton label={t('common.days7')} value="week" />
                <TimeRangeButton label={t('common.days30')} value="month" />
                <TimeRangeButton label={t('common.days90')} value="quarter" />
                <TimeRangeButton label={t('common.all')} value="all" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    icon={<CurrencyDollarIcon className="w-7 h-7"/>} 
                    label={`${t('sellerDashboard.analytics.totalRevenue')}${timeRange !== 'all' ? ` ${t('sellerDashboard.analytics.vsPrevious')}` : ''}`}
                    value={`${analytics.totalRevenue.toLocaleString('fr-CM')} FCFA`} 
                    color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"
                    change={comparisonAnalytics.revenueChangePercentage}
                />
                <StatCard icon={<ShoppingBagIcon className="w-7 h-7"/>} label={t('sellerDashboard.analytics.deliveredOrders')} value={analytics.totalOrders} color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" />
                <StatCard icon={<ArchiveBoxIcon className="w-7 h-7"/>} label={t('sellerDashboard.analytics.itemsSold')} value={analytics.totalItemsSold} color="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300" />
                <StatCard icon={<StarIcon className="w-7 h-7"/>} label={t('sellerDashboard.analytics.averageBasket')} value={`${analytics.averageOrderValue.toLocaleString('fr-CM', { maximumFractionDigits: 0 })} FCFA`} color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm p-6 h-full">
                    <h2 className="text-xl font-bold mb-4">{t('sellerDashboard.analytics.salesEvolution')}</h2>
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
                        <h2 className="text-xl font-bold mb-4">{t('sellerDashboard.analytics.top5Products')}</h2>
                        <ul className="space-y-3">
                            {analytics.topProducts.map((product) => (
                                <li key={product.id} className="flex justify-between items-center text-sm">
                                    <div>
                                        <span className="font-medium dark:text-gray-200">{product.name}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({product.quantitySold} {t('sellerDashboard.analytics.sold')})</span>
                                    </div>
                                    <span className="font-bold text-kmer-green">{product.revenue.toLocaleString('fr-CM')} FCFA</span>
                                </li>
                            ))}
                             {analytics.topProducts.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t('sellerDashboard.analytics.noSalesData')}</p>}
                        </ul>
                    </div>
                     <div className="bg-orange-50 dark:bg-orange-900/50 rounded-lg shadow-sm p-6 border-l-4 border-orange-400">
                        <h2 className="text-xl font-bold mb-4 text-orange-800 dark:text-orange-200">{t('sellerDashboard.analytics.lowStockAlerts')}</h2>
                        <ul className="space-y-2">
                            {lowStockProducts.map(p => (
                                <li key={p.id} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-orange-700 dark:text-orange-300">{p.name}</span>
                                    <span className="font-bold text-orange-600 dark:text-orange-400">{p.stock} {t('sellerDashboard.analytics.remaining')}</span>
                                </li>
                            ))}
                            {lowStockProducts.length === 0 && <p className="text-sm text-orange-700 dark:text-orange-300">{t('sellerDashboard.analytics.noLowStock')}</p>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};