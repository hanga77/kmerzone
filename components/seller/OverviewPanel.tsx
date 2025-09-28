
import React from 'react';
import type { Store, Order, Notification } from '../../types';
import { ChartPieIcon, ShoppingBagIcon, StarIcon, ExclamationTriangleIcon, BellIcon } from '../Icons';

// FIX: Changed value prop type from `string | number` to `React.ReactNode` to allow passing JSX elements.
const StatCard: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
            {icon}
            <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            </div>
        </div>
    </div>
);

interface OverviewPanelProps {
    store: Store;
    sellerOrders: Order[];
    sellerNotifications: Notification[];
    onNavigateToAnalytics: () => void;
    setActiveTab: (tab: string) => void;
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({ store, sellerOrders, sellerNotifications, onNavigateToAnalytics, setActiveTab }) => {
    
    const totalRevenue = sellerOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = sellerOrders.filter(o => ['confirmed', 'ready-for-pickup'].includes(o.status)).length;
    
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">Aperçu de la boutique : {store.name}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label="Revenu total (livré)" value={`${totalRevenue.toLocaleString('fr-CM')} FCFA`} icon={<ChartPieIcon className="w-6 h-6 text-green-500"/>} />
                <StatCard label="Commandes en attente" value={pendingOrders} icon={<ShoppingBagIcon className="w-6 h-6 text-yellow-500"/>} />
                <StatCard label="Statut" value={<span className="capitalize">{store.premiumStatus.replace('_', ' ')}</span>} icon={<StarIcon className="w-6 h-6 text-blue-500"/>} />
            </div>

            {store.warnings && store.warnings.length > 0 && (
                 <div className="p-4 bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 rounded-r-lg">
                    <h3 className="font-bold text-lg text-red-800 dark:text-red-200 flex items-center gap-2"><ExclamationTriangleIcon className="w-6 h-6"/> Avertissements Récents</h3>
                    <ul className="list-disc list-inside mt-2 text-sm text-red-700 dark:text-red-300">
                        {store.warnings.map(w => <li key={w.id}>Le {new Date(w.date).toLocaleDateString()}: {w.reason}</li>)}
                    </ul>
                </div>
            )}
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 flex items-center gap-2"><BellIcon className="w-6 h-6"/> Notifications</h3>
                <ul className="mt-2 space-y-1 text-sm">
                    {sellerNotifications.slice(0, 3).map(n => (
                        <li key={n.id} className="text-blue-700 dark:text-blue-300">{n.message}</li>
                    ))}
                    {sellerNotifications.length === 0 && <p className="text-gray-500">Aucune nouvelle notification.</p>}
                </ul>
            </div>
        </div>
    );
};

export default OverviewPanel;
