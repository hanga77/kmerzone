import React, { useState, useMemo } from 'react';
import type { Order, Category, Store, SiteActivityLog, UserRole, FlashSale, Product, PickupPoint, User, SiteSettings, Payout, Advertisement, SiteContent, Ticket, Announcement, PaymentMethod, Zone, EmailTemplate, DocumentStatus } from '../types';
import { AcademicCapIcon, ClockIcon, BuildingStorefrontIcon, UsersIcon, ShoppingBagIcon, TagIcon, BoltIcon, TruckIcon, BanknotesIcon, ChatBubbleBottomCenterTextIcon, ScaleIcon, StarIcon, Cog8ToothIcon, ChartPieIcon, ShieldCheckIcon, SparklesIcon, ArchiveBoxXMarkIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import { OverviewPanel } from './admin/OverviewPanel';
import { UsersPanel } from './admin/UsersPanel';
import { CatalogPanel } from './admin/CatalogPanel';
import { MarketingPanel } from './admin/MarketingPanel';
import { StoresPanel } from './admin/StoresPanel';
import { OrdersPanel } from './admin/OrdersPanel';
import { LogisticsPanel } from './admin/LogisticsPanel';
import { PayoutsPanel } from './admin/PayoutsPanel';
import { SupportPanel } from './admin/SupportPanel';
import { LogsPanel } from './admin/LogsPanel';
import { SettingsPanel } from './admin/SettingsPanel';
import ReviewModerationPanel from './admin/ReviewModerationPanel';
import { useLanguage } from '../contexts/LanguageContext';
import { ServicesPanel } from './admin/ServicesPanel';
import { RefundsPanel } from './admin/RefundsPanel';

interface SuperAdminDashboardProps {
    siteData: any;
}

const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, count?: number }> = ({ icon, label, isActive, onClick, count }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center gap-3 w-full text-left px-3 py-3 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
            isActive
                ? 'bg-kmer-green/10 text-kmer-green'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
        }`}
    >
        {icon}
        <span>{label}</span>
        {count !== undefined && count > 0 && (
            <span className="ml-auto text-xs bg-kmer-red text-white rounded-full px-1.5 py-0.5">{count}</span>
        )}
    </button>
);


export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ siteData }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const { t } = useLanguage();
    
    const pendingStoresCount = useMemo(() => siteData.allStores.filter((s: Store) => s.status === 'pending').length, [siteData.allStores]);
    const refundRequestsCount = useMemo(() => siteData.allOrders.filter((o: Order) => o.status === 'refund-requested').length, [siteData.allOrders]);
    const pendingReviewsCount = useMemo(() => siteData.allProducts.flatMap((p: Product) => p.reviews).filter((r: any) => r.status === 'pending').length, [siteData.allProducts]);
    const openTicketsCount = useMemo(() => siteData.allTickets.filter((t: Ticket) => t.status === 'Ouvert').length, [siteData.allTickets]);

    const renderContent = () => {
        const panelProps = { ...siteData };

        switch (activeTab) {
            case 'overview': return <OverviewPanel {...panelProps} />;
            case 'users': return <UsersPanel {...panelProps} />;
            case 'catalog': return <CatalogPanel {...panelProps} />;
            case 'services': return <ServicesPanel {...panelProps} />;
            case 'marketing': return <MarketingPanel {...panelProps} />;
            case 'stores': return <StoresPanel {...panelProps} />;
            case 'orders': return <OrdersPanel {...panelProps} />;
            case 'logistics': return <LogisticsPanel {...panelProps} />;
            case 'payouts': return <PayoutsPanel {...panelProps} />;
            case 'refunds': return <RefundsPanel {...panelProps} />;
            case 'support': return <SupportPanel {...panelProps} />;
            case 'reviews': return <ReviewModerationPanel {...panelProps} />;
            case 'logs': return <LogsPanel {...panelProps} />;
            case 'settings': return <SettingsPanel {...panelProps} />;
            default: return <div className="text-center py-8 text-gray-500">{t('superadmin.panelUnderConstruction', activeTab)}</div>;
        }
    };

    const TABS = [
        { id: 'overview', label: t('superadmin.tabs.overview'), icon: <ChartPieIcon className="w-5 h-5"/> },
        { id: 'orders', label: t('superadmin.tabs.orders'), icon: <ShoppingBagIcon className="w-5 h-5"/> },
        { id: 'stores', label: t('superadmin.tabs.stores'), icon: <BuildingStorefrontIcon className="w-5 h-5"/>, count: pendingStoresCount },
        { id: 'users', label: t('superadmin.tabs.users'), icon: <UsersIcon className="w-5 h-5"/> },
        { id: 'catalog', label: t('superadmin.tabs.catalog'), icon: <TagIcon className="w-5 h-5"/> },
        { id: 'services', label: t('superadmin.tabs.services'), icon: <SparklesIcon className="w-5 h-5"/> },
        { id: 'marketing', label: t('superadmin.tabs.marketing'), icon: <BoltIcon className="w-5 h-5"/> },
        { id: 'logistics', label: t('superadmin.tabs.logistics'), icon: <TruckIcon className="w-5 h-5"/> },
        { id: 'payouts', label: t('superadmin.tabs.payouts'), icon: <BanknotesIcon className="w-5 h-5"/> },
        { id: 'refunds', label: t('superadmin.tabs.refunds'), icon: <ArchiveBoxXMarkIcon className="w-5 h-5"/>, count: refundRequestsCount },
        { id: 'support', label: t('superadmin.tabs.support'), icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>, count: openTicketsCount },
        { id: 'reviews', label: t('superadmin.tabs.reviews'), icon: <StarIcon className="w-5 h-5"/>, count: pendingReviewsCount },
        { id: 'logs', label: t('superadmin.tabs.logs'), icon: <ClockIcon className="w-5 h-5"/> },
        { id: 'settings', label: t('superadmin.tabs.settings'), icon: <Cog8ToothIcon className="w-5 h-5"/> },
    ];

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
             <div className="container mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-8">
                 <aside className="md:w-1/4 lg:w-1/5 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-2 sticky top-24">
                        {TABS.map(tab => (
                            <TabButton
                                key={tab.id}
                                icon={tab.icon}
                                label={tab.label}
                                isActive={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                count={tab.count}
                            />
                        ))}
                    </div>
                </aside>
                <main className="flex-grow">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-full">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};
