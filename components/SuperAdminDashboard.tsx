import React, { useState, useMemo } from 'react';
import type { Order, Category, OrderStatus, Store, SiteActivityLog, UserRole, FlashSale, Product, PickupPoint, User, SiteSettings, Payout, Advertisement, SiteContent, Ticket, Announcement, PaymentMethod, Zone, EmailTemplate, DocumentStatus } from '../types';

import { AcademicCapIcon, ClockIcon, BuildingStorefrontIcon, UsersIcon, ShoppingBagIcon, TagIcon, BoltIcon, TruckIcon, BanknotesIcon, ChatBubbleBottomCenterTextIcon, ScaleIcon, StarIcon, Cog8ToothIcon, ChartPieIcon, ShieldCheckIcon } from './Icons';
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
    const { user, allUsers, setAllUsers } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const { t } = useLanguage();
    
    const pendingStoresCount = useMemo(() => siteData.allStores.filter((s: Store) => s.status === 'pending').length, [siteData.allStores]);
    const refundRequestsCount = useMemo(() => siteData.allOrders.filter((o: Order) => o.status === 'refund-requested').length, [siteData.allOrders]);
    const pendingReviewsCount = useMemo(() => siteData.allProducts.flatMap((p: Product) => p.reviews).filter((r: any) => r.status === 'pending').length, [siteData.allProducts]);
    const openTicketsCount = useMemo(() => siteData.allTickets.filter((t: Ticket) => t.status === 'Ouvert').length, [siteData.allTickets]);

    const renderContent = () => {
        // Prepare props for sub-panels
        const panelProps = {
            allUsers: allUsers,
            allOrders: siteData.allOrders,
            allCategories: siteData.allCategories,
            allStores: siteData.allStores,
            allProducts: siteData.allProducts,
            siteActivityLogs: siteData.siteActivityLogs,
            flashSales: siteData.flashSales,
            allPickupPoints: siteData.allPickupPoints,
            siteSettings: siteData.siteSettings,
            payouts: siteData.payouts,
            advertisements: siteData.allAdvertisements,
            siteContent: siteData.siteContent,
            allTickets: siteData.allTickets,
            allAnnouncements: siteData.allAnnouncements,
            paymentMethods: siteData.allPaymentMethods,
            allZones: siteData.allZones,
            isChatEnabled: siteData.siteSettings.isChatEnabled,
            isComparisonEnabled: siteData.siteSettings.isComparisonEnabled,
            
            // Functions with user context
            onUpdateUser: (userId: string, updates: Partial<User>) => user && siteData.handleAdminUpdateUser(userId, updates, allUsers, user),
            onCreateUserByAdmin: (data: { name: string, email: string, role: UserRole }) => {
                if (user) {
                    const newUsers = siteData.handleCreateUserByAdmin(data, user, allUsers);
                    setAllUsers(newUsers);
                }
            },
            onWarnUser: (userId: string, reason: string) => user && siteData.logActivity(user, 'USER_WARNED', `Avertissement envoyé à l'utilisateur ${userId}. Motif: ${reason}`),
            onApproveStore: (store: Store) => user && siteData.handleApproveStore(store, user),
            onRejectStore: (store: Store) => user && siteData.handleRejectStore(store, user),
            onToggleStoreStatus: (storeId: string, currentStatus: 'active' | 'suspended') => user && siteData.handleToggleStoreStatus(storeId, currentStatus, user),
            onWarnStore: (storeId: string, reason: string) => user && siteData.handleWarnStore(storeId, reason, user),
            onUpdateDocumentStatus: (storeId: string, documentName: string, status: DocumentStatus, reason?: string) => user && siteData.handleUpdateDocumentStatus(storeId, documentName, status, reason, user),
            onAdminAddCategory: (name: string, parentId?: string) => user && siteData.handleAdminAddCategory(name, parentId, user),
            onAdminDeleteCategory: (categoryId: string) => user && siteData.handleAdminDeleteCategory(categoryId, user),
            onAdminUpdateCategory: (categoryId: string, updates: Partial<Omit<Category, 'id'>>) => user && siteData.handleAdminUpdateCategory(categoryId, updates, user),
            onSaveFlashSale: (flashSale: Omit<FlashSale, 'id' | 'products'>) => user && siteData.handleSaveFlashSale(flashSale, user),
            onUpdateFlashSaleSubmissionStatus: (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => user && siteData.handleUpdateFlashSaleSubmissionStatus(flashSaleId, productId, status, user),
            onBatchUpdateFlashSaleStatus: (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => user && siteData.handleBatchUpdateFlashSaleStatus(flashSaleId, productIds, status, user),
            onAddPickupPoint: (point: Omit<PickupPoint, 'id'>) => user && siteData.handleAddPickupPoint(point, user),
            onUpdatePickupPoint: (point: PickupPoint) => user && siteData.handleUpdatePickupPoint(point, user),
            onDeletePickupPoint: (pointId: string) => user && siteData.handleDeletePickupPoint(pointId, user),
            onPayoutSeller: (storeId: string, amount: number) => user && siteData.handlePayoutSeller(storeId, amount, user),
            onAddAdvertisement: (data: Omit<Advertisement, 'id'>) => user && siteData.handleAddAdvertisement(data, user),
            onUpdateAdvertisement: (id: string, data: Partial<Omit<Advertisement, 'id'>>) => user && siteData.handleUpdateAdvertisement(id, data, user),
            onDeleteAdvertisement: (id: string) => user && siteData.handleDeleteAdvertisement(id, user),
            onCreateOrUpdateAnnouncement: (data: Omit<Announcement, 'id'> | Announcement) => user && siteData.handleCreateOrUpdateAnnouncement(data, user),
            onDeleteAnnouncement: (id: string) => user && siteData.handleDeleteAnnouncement(id, user),
            onAdminReplyToTicket: (ticketId: string, message: string) => user && siteData.handleAdminReplyToTicket(ticketId, message, user),
            onAdminUpdateTicketStatus: (ticketId: string, status: Ticket['status']) => user && siteData.handleAdminUpdateTicketStatus(ticketId, status, user),
            onReviewModeration: (productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected') => user && siteData.handleReviewModeration(productId, reviewIdentifier, newStatus, user),
            onSendBulkEmail: (recipientIds: string[], subject: string, body: string) => user && siteData.handleSendBulkEmail(recipientIds, subject, body, user),
            onUpdateOrderStatus: (orderId: string, status: OrderStatus) => user && siteData.handleUpdateOrderStatus(orderId, status, user),
            onResolveReturnRequest: (orderId: string, resolution: 'approve' | 'reject', reason: string) => user && siteData.handleResolveReturnRequest(orderId, resolution, reason, user),
            onProcessReturn: (orderId: string, action: 'received' | 'refund' | 'reject-refund', reason: string) => user && siteData.handleProcessReturn(orderId, action, reason, user),
            onUpdateSiteSettings: siteData.setSiteSettings,
            onUpdateSiteContent: siteData.setSiteContent,
            onUpdatePaymentMethods: siteData.setAllPaymentMethods,
            onToggleStoreCertification: (storeId: string) => user && siteData.handleToggleStoreCertification(storeId, user),
            // FIX: Pass onResolveDispute to OrdersPanel to fix missing prop error.
            onResolveDispute: (orderId: string, resolution: 'refunded' | 'rejected') => user && siteData.handleResolveDispute(orderId, resolution, user),
        };

        switch (activeTab) {
            case 'overview': return <OverviewPanel {...panelProps} />;
            case 'users': return <UsersPanel {...panelProps} />;
            case 'catalog': return <CatalogPanel {...panelProps} />;
            case 'marketing': return <MarketingPanel {...panelProps} />;
            case 'stores': return <StoresPanel {...panelProps} />;
            case 'orders': return <OrdersPanel {...panelProps} />;
            case 'logistics': return <LogisticsPanel {...panelProps} />;
            case 'payouts': return <PayoutsPanel {...panelProps} />;
            case 'support': return <SupportPanel {...panelProps} />;
            case 'reviews': return <ReviewModerationPanel {...panelProps} />;
            case 'logs': return <LogsPanel {...panelProps} />;
            case 'settings': return <SettingsPanel {...panelProps} />;
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