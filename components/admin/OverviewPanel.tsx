import React, { useMemo } from 'react';
import type { Order, Store, SiteActivityLog, User, OrderStatus } from '../../types';
import { ShoppingBagIcon, UsersIcon, BuildingStorefrontIcon, CurrencyDollarIcon, ClockIcon, UserGroupIcon, TagIcon, BoltIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface OverviewPanelProps {
    allOrders: Order[];
    allStores: Store[];
    allUsers: User[];
    siteActivityLogs: SiteActivityLog[];
}

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number, color: string }> = ({ icon, label, value, color }) => (
    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    </div>
);

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ allOrders, allStores, allUsers, siteActivityLogs }) => {
    const { t } = useLanguage();
    const { stats, salesData, orderStatusDistribution } = useMemo(() => {
        const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);

        const last7Days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d; });
        const dailySales = allOrders.reduce((acc, order) => {
            const day = new Date(order.orderDate).toLocaleDateString('fr-CM', { day: '2-digit', month: '2-digit' });
            acc[day] = (acc[day] || 0) + order.total;
            return acc;
        }, {} as Record<string, number>);
        const _salesData = last7Days.map(d => {
            const label = d.toLocaleDateString('fr-CM', { day: '2-digit', month: '2-digit' });
            return { label: d.toLocaleDateString('fr-CM', { weekday: 'short' }), revenue: dailySales[label] || 0 };
        }).reverse();

        const _orderStatusDistribution: Record<string, number> = allOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return {
            stats: {
                totalRevenue,
                totalOrders: allOrders.length,
                pendingStores: allStores.filter(s => s.status === 'pending').length,
                totalUsers: allUsers.length
            },
            salesData: _salesData,
            orderStatusDistribution: Object.entries(_orderStatusDistribution).sort((a,b) => b[1] - a[1])
        };
    }, [allOrders, allStores, allUsers]);
    
    const recentOrders = useMemo(() => [...allOrders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).slice(0, 5), [allOrders]);
    const recentUsers = useMemo(() => [...allUsers].sort((a,b) => parseInt(b.id) - parseInt(a.id)).slice(0,5), [allUsers]);

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<CurrencyDollarIcon className="w-7 h-7"/>} label={t('superadmin.overview.totalRevenue')} value={`${stats.totalRevenue.toLocaleString('fr-CM')} FCFA`} color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300" />
                <StatCard icon={<ShoppingBagIcon className="w-7 h-7"/>} label={t('superadmin.overview.totalOrders')} value={stats.totalOrders} color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" />
                <StatCard icon={<UsersIcon className="w-7 h-7"/>} label={t('superadmin.overview.totalUsers')} value={stats.totalUsers} color="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300" />
                <StatCard icon={<BuildingStorefrontIcon className="w-7 h-7"/>} label={t('superadmin.overview.pendingStores')} value={stats.pendingStores} color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-4">{t('superadmin.overview.revenueLast7Days')}</h2>
                    <div className="flex justify-around items-end h-64 border-l border-b border-gray-200 dark:border-gray-700 pl-4 pb-4">
                        {salesData.map(({ label, revenue }) => (
                             <div key={label} className="flex flex-col items-center h-full justify-end" title={`${revenue.toLocaleString('fr-CM')} FCFA`}>
                                <div className="w-8 bg-kmer-green rounded-t-md hover:bg-green-700" style={{ height: `${(revenue / Math.max(...salesData.map(d => d.revenue), 1)) * 100}%` }}></div>
                                <p className="text-xs mt-1">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-4">{t('superadmin.overview.orderStatuses')}</h2>
                    <ul className="space-y-2">
                        {orderStatusDistribution.map(([status, count]) => (
                            <li key={status} className="flex justify-between text-sm">
                                <span>{t(`orderStatus.${status as OrderStatus}`, status)}</span>
                                <span className="font-bold">{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-4">{t('superadmin.overview.recentOrders')}</h2>
                     <ul className="divide-y dark:divide-gray-700">
                        {recentOrders.map(o => (
                            <li key={o.id} className="py-2 flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold">{o.shippingAddress.fullName}</p>
                                    <p className="text-xs text-gray-500">{o.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{o.total.toLocaleString('fr-CM')} FCFA</p>
                                    <p className="text-xs">{t(`orderStatus.${o.status as OrderStatus}`, o.status)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-4">{t('superadmin.overview.newUsers')}</h2>
                    <ul className="divide-y dark:divide-gray-700">
                        {recentUsers.map(u => (
                            <li key={u.id} className="py-2 flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold">{u.name}</p>
                                    <p className="text-xs text-gray-500">{u.email}</p>
                                </div>
                                <span className="capitalize text-xs font-medium bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{u.role.replace('_', ' ')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
