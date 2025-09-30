import React, { useState, useMemo } from 'react';
import type { Order, Category, OrderStatus, Store, SiteActivityLog, UserRole, FlashSale, Product, PickupPoint, User, SiteSettings, Payout, Advertisement, SiteContent, Ticket, Announcement, PaymentMethod, Zone, EmailTemplate, DocumentStatus } from '../types';

import { AcademicCapIcon, ClockIcon, BuildingStorefrontIcon, UsersIcon, ShoppingBagIcon, TagIcon, BoltIcon, TruckIcon, BanknotesIcon, ChatBubbleBottomCenterTextIcon, ScaleIcon, StarIcon, Cog8ToothIcon, ChartPieIcon } from './Icons';

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


interface SuperAdminDashboardProps {
    allUsers: User[];
    allOrders: Order[];
    allCategories: Category[];
    allStores: Store[];
    allProducts: Product[];
    siteActivityLogs: SiteActivityLog[];
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    onUpdateCategoryImage: () => void;
    onWarnStore: (storeId: string, reason: string) => void;
    onToggleStoreStatus: (storeId: string, currentStatus: 'active' | 'suspended') => void;
    onApproveStore: (storeToApprove: Store) => void;
    onRejectStore: (storeToReject: Store) => void;
    onSaveFlashSale: (flashSale: Omit<FlashSale, 'id' | 'products'>) => void;
    flashSales: FlashSale[];
    onUpdateFlashSaleSubmissionStatus: (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => void;
    onBatchUpdateFlashSaleStatus: (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => void;
    onRequestDocument: () => void;
    onVerifyDocumentStatus: () => void;
    allPickupPoints: PickupPoint[];
    onAddPickupPoint: (point: Omit<PickupPoint, 'id'>) => void;
    onUpdatePickupPoint: (point: PickupPoint) => void;
    onDeletePickupPoint: (pointId: string) => void;
    onAssignAgent: () => void;
    isChatEnabled: boolean;
    isComparisonEnabled: boolean;
    onToggleChatFeature: () => void;
    onToggleComparisonFeature: () => void;
    siteSettings: SiteSettings;
    onUpdateSiteSettings: (settings: SiteSettings) => void;
    onAdminAddCategory: (name: string, parentId?: string) => void;
    onAdminDeleteCategory: (categoryId: string) => void;
    onUpdateUser: (userId: string, updates: Partial<User>) => void;
    payouts: Payout[];
    onPayoutSeller: (storeId: string, amount: number) => void;
    advertisements: Advertisement[];
    onAddAdvertisement: (data: Omit<Advertisement, 'id'>) => void;
    onUpdateAdvertisement: (id: string, data: Partial<Omit<Advertisement, 'id'>>) => void;
    onDeleteAdvertisement: (id: string) => void;
    onCreateUserByAdmin: (data: { name: string, email: string, role: UserRole }) => void;
    onSanctionAgent: () => void;
    // FIX: Renamed 'onResolveRefund' to 'onResolveDispute' and corrected its signature to match what PageRouter passes and OrdersPanel expects.
    onResolveDispute: (orderId: string, resolution: 'refunded' | 'rejected') => void;
    onAdminStoreMessage: () => void;
    onAdminCustomerMessage: () => void;
    siteContent: SiteContent[];
    onUpdateSiteContent: (content: SiteContent[]) => void;
    allTickets: Ticket[];
    allAnnouncements: Announcement[];
    onAdminReplyToTicket: (ticketId: string, message: string) => void;
    onAdminUpdateTicketStatus: (ticketId: string, status: 'Ouvert' | 'En cours' | 'Résolu') => void;
    onCreateOrUpdateAnnouncement: (data: Omit<Announcement, 'id'> | Announcement) => void;
    onDeleteAnnouncement: (id: string) => void;
    onReviewModeration: (productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected') => void;
    paymentMethods: PaymentMethod[];
    onUpdatePaymentMethods: (methods: PaymentMethod[]) => void;
    allZones: Zone[];
    onSendBulkEmail: (recipientIds: string[], subject: string, body: string) => void;
    // FIX: Added missing props required by child components.
    onWarnUser: (userId: string, reason: string) => void;
    onAdminUpdateCategory: (categoryId: string, updates: Partial<Omit<Category, 'id'>>) => void;
    onUpdateDocumentStatus: (storeId: string, documentName: string, status: DocumentStatus, reason?: string) => void;
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


export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = (props) => {
    const { allStores, allOrders, allProducts, allTickets } = props;
    const [activeTab, setActiveTab] = useState('overview');
    const { t } = useLanguage();
    
    const pendingStoresCount = useMemo(() => allStores.filter(s => s.status === 'pending').length, [allStores]);
    const refundRequestsCount = useMemo(() => allOrders.filter(o => o.status === 'refund-requested').length, [allOrders]);
    const pendingReviewsCount = useMemo(() => allProducts.flatMap(p => p.reviews).filter(r => r.status === 'pending').length, [allProducts]);
    const openTicketsCount = useMemo(() => allTickets.filter(t => t.status === 'Ouvert').length, [allTickets]);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewPanel {...props} />;
            // FIX: Pass required `onWarnUser` prop to UsersPanel.
            case 'users': return <UsersPanel allUsers={props.allUsers} onUpdateUser={props.onUpdateUser} onCreateUserByAdmin={props.onCreateUserByAdmin} onWarnUser={props.onWarnUser} allPickupPoints={props.allPickupPoints} allZones={props.allZones} onSendBulkEmail={props.onSendBulkEmail} siteSettings={props.siteSettings} />;
            // FIX: Explicitly pass props to CatalogPanel to fix missing prop error.
            case 'catalog': return <CatalogPanel allCategories={props.allCategories} onAdminAddCategory={props.onAdminAddCategory} onAdminDeleteCategory={props.onAdminDeleteCategory} onAdminUpdateCategory={props.onAdminUpdateCategory} />;
            case 'marketing': return <MarketingPanel {...props} />;
            // FIX: Explicitly pass props to StoresPanel to fix missing prop error.
            case 'stores': return <StoresPanel allStores={props.allStores} onApproveStore={props.onApproveStore} onRejectStore={props.onRejectStore} onToggleStoreStatus={props.onToggleStoreStatus} onWarnStore={props.onWarnStore} onUpdateDocumentStatus={props.onUpdateDocumentStatus} />;
            // FIX: Explicitly pass props to OrdersPanel to fix missing prop error.
            case 'orders': return <OrdersPanel allOrders={props.allOrders} onUpdateOrderStatus={props.onUpdateOrderStatus} onResolveDispute={props.onResolveDispute} />;
            case 'logistics': return <LogisticsPanel {...props} />;
            case 'payouts': return <PayoutsPanel {...props} />;
            case 'support': return <SupportPanel {...props} />;
            case 'reviews': return <ReviewModerationPanel allProducts={allProducts} onReviewModeration={props.onReviewModeration} />;
            case 'logs': return <LogsPanel {...props} />;
            case 'settings': return <SettingsPanel {...props} />;
            default: return <div className="p-6">{t('superadmin.panelUnderConstruction', activeTab)}</div>;
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4 lg:w-1/5 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-2 sticky top-24">
                        <TabButton icon={<ChartPieIcon className="w-5 h-5"/>} label={t('superadmin.tabs.overview')} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <TabButton icon={<ShoppingBagIcon className="w-5 h-5"/>} label={t('superadmin.tabs.orders')} isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} count={refundRequestsCount} />
                        <TabButton icon={<BuildingStorefrontIcon className="w-5 h-5"/>} label={t('superadmin.tabs.stores')} isActive={activeTab === 'stores'} onClick={() => setActiveTab('stores')} count={pendingStoresCount} />
                        <TabButton icon={<UsersIcon className="w-5 h-5"/>} label={t('superadmin.tabs.users')} isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                        <TabButton icon={<TagIcon className="w-5 h-5"/>} label={t('superadmin.tabs.catalog')} isActive={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} />
                        <TabButton icon={<BoltIcon className="w-5 h-5"/>} label={t('superadmin.tabs.marketing')} isActive={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} />
                        <TabButton icon={<TruckIcon className="w-5 h-5"/>} label={t('superadmin.tabs.logistics')} isActive={activeTab === 'logistics'} onClick={() => setActiveTab('logistics')} />
                        <TabButton icon={<BanknotesIcon className="w-5 h-5"/>} label={t('superadmin.tabs.payouts')} isActive={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')} />
                        <TabButton icon={<ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>} label={t('superadmin.tabs.support')} isActive={activeTab === 'support'} onClick={() => setActiveTab('support')} count={openTicketsCount} />
                        <TabButton icon={<StarIcon className="w-5 h-5"/>} label={t('superadmin.tabs.reviews')} isActive={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} count={pendingReviewsCount} />
                        <TabButton icon={<ScaleIcon className="w-5 h-5"/>} label={t('superadmin.tabs.logs')} isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                        <TabButton icon={<Cog8ToothIcon className="w-5 h-5"/>} label={t('superadmin.tabs.settings')} isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
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
