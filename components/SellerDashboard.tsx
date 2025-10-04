
import React, { useState, useEffect } from 'react';
import type { Product, Category, Store, FlashSale, Order, PromoCode, SiteSettings, Payout, Notification, Ticket, ShippingPartner, ProductCollection, User, ShippingSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
    ChartPieIcon, ShoppingBagIcon, TruckIcon, StarIcon, TagIcon, BoltIcon, 
    BarChartIcon, BanknotesIcon, BuildingStorefrontIcon, DocumentTextIcon, 
    ChatBubbleLeftRightIcon, ChatBubbleBottomCenterTextIcon, SparklesIcon, 
    BookmarkSquareIcon, StarPlatinumIcon, MegaphoneIcon
} from './Icons';
import OverviewPanel from './seller/OverviewPanel';
import ProductsPanel from './seller/ProductsPanel';
import OrdersPanel from './seller/OrdersPanel';
import ReviewsPanel from './seller/ReviewsPanel';
import PromotionsPanel from './seller/PromotionsPanel';
import FlashSalesPanel from './seller/FlashSalesPanel';
import PayoutsPanel from './seller/PayoutsPanel';
import DocumentsPanel from './seller/DocumentsPanel';
import SupportPanel from './seller/SupportPanel';
import CollectionsPanel from './seller/CollectionsPanel';
import ShippingPanel from './seller/ShippingPanel';
import SubscriptionPanel from './seller/SubscriptionPanel';
import UpgradePanel from './seller/UpgradePanel';
import AnalyticsPanel from './seller/AnalyticsPanel';
import ProfilePanel from './seller/ProfilePanel';
import ChatPanel from './seller/ChatPanel';
import StoriesPanel from './seller/StoriesPanel';

interface SellerDashboardProps {
  store: Store;
  products: Product[];
  categories: Category[];
  flashSales: FlashSale[];
  sellerOrders: Order[];
  promoCodes: PromoCode[];
  allTickets: Ticket[];
  onBack: () => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateProductStatus: (productId: string, status: Product['status']) => void;
  onNavigateToAnalytics: () => void;
  onSetPromotion: (product: Product) => void;
  onRemovePromotion: (productId: string) => void;
  onProposeForFlashSale: (flashSaleId: string, productId: string, flashPrice: number, sellerShopName: string) => void;
  onUploadDocument: (storeId: string, documentName: string, fileUrl: string) => void;
  onCreatePromoCode: (codeData: Omit<PromoCode, 'uses'>) => void;
  onDeletePromoCode: (code: string) => void;
  siteSettings: SiteSettings;
  payouts: Payout[];
  onReplyToReview: (productId: string, reviewIdentifier: { author: string; date: string }, replyText: string) => void;
  initialTab: string;
  sellerNotifications: Notification[];
  onCreateTicket: (subject: string, message: string, orderId?: string) => void;
  allShippingPartners: ShippingPartner[];
  onRequestUpgrade: (storeId: string, level: 'premium' | 'super_premium') => void;
  isChatEnabled: boolean;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onSellerCancelOrder: (orderId: string) => void;
  onCreateOrUpdateCollection: (storeId: string, collection: ProductCollection) => void;
  onDeleteCollection: (storeId: string, collectionId: string) => void;
  onUpdateStoreProfile: (storeId: string, data: Partial<Store>) => void;
  onAddProductToStory: (productId: string) => void;
  onAddStory: (imageUrl: string) => void;
}

const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, count?: number, isLocked?: boolean }> = ({ icon, label, isActive, onClick, count, isLocked }) => {
    const { t } = useLanguage();
    return (
        <button
            onClick={onClick}
            disabled={isLocked}
            className={`relative flex items-center gap-3 w-full text-left px-3 py-3 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                isActive
                    ? 'bg-kmer-green/10 text-kmer-green'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isLocked ? t('sellerDashboard.premiumFeatureTooltip') : ""}
        >
            {icon}
            <span>{label}</span>
            {count !== undefined && count > 0 && (
                <span className="ml-auto text-xs bg-kmer-red text-white rounded-full px-1.5 py-0.5">{count}</span>
            )}
        </button>
    );
};


export const SellerDashboard: React.FC<SellerDashboardProps> = (props) => {
    const { store, initialTab, sellerNotifications, siteSettings, onRequestUpgrade } = props;
    const [activeTab, setActiveTab] = useState(initialTab || 'overview');
    const { t } = useLanguage();
    
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);
    
    if (!store) {
        return <div className="p-8 text-center">Loading store information...</div>;
    }
    
    const isPremium = store.premiumStatus === 'premium' || store.premiumStatus === 'super_premium';
    const unreadNotifications = sellerNotifications.filter(n => !n.isRead).length;

    const TABS = [
      { id: 'overview', label: t('sellerDashboard.tabs.overview'), icon: <ChartPieIcon className="w-5 h-5"/>, count: unreadNotifications, isLocked: false },
      { id: 'products', label: t('sellerDashboard.tabs.products'), icon: <ShoppingBagIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'collections', label: t('sellerDashboard.tabs.collections'), icon: <BookmarkSquareIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'orders', label: t('sellerDashboard.tabs.orders'), icon: <TruckIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'reviews', label: t('sellerDashboard.tabs.reviews'), icon: <StarIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'promotions', label: t('sellerDashboard.tabs.promotions'), icon: <TagIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'flash-sales', label: t('sellerDashboard.tabs.flashSales'), icon: <BoltIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'analytics', label: t('sellerDashboard.tabs.analytics'), icon: <BarChartIcon className="w-5 h-5"/>, isLocked: !isPremium },
      { id: 'payouts', label: t('sellerDashboard.tabs.payouts'), icon: <BanknotesIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'livraison', label: t('sellerDashboard.tabs.delivery'), icon: <TruckIcon className="w-5 h-5"/>, isLocked: !isPremium },
      { id: 'profile', label: t('sellerDashboard.tabs.profile'), icon: <BuildingStorefrontIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'subscription', label: t('sellerDashboard.tabs.subscription'), icon: <StarPlatinumIcon className="w-5 h-5" />, isLocked: false },
      { id: 'documents', label: t('sellerDashboard.tabs.documents'), icon: <DocumentTextIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'stories', label: t('sellerDashboard.tabs.stories'), icon: <MegaphoneIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'chat', label: t('sellerDashboard.tabs.chat'), icon: <ChatBubbleLeftRightIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'support', label: t('sellerDashboard.tabs.support'), icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>, isLocked: false },
    ];
    
    const panelProps = { ...props };

    const renderContent = () => {
        const selectedTab = TABS.find(t => t.id === activeTab);
        if (selectedTab?.isLocked) {
             return <UpgradePanel store={store} siteSettings={siteSettings} onRequestUpgrade={onRequestUpgrade} featureName={selectedTab.label} />;
        }

        switch(activeTab) {
            case 'overview': return <OverviewPanel {...panelProps} setActiveTab={setActiveTab} />;
            case 'products': return <ProductsPanel {...panelProps} />;
            case 'collections': return <CollectionsPanel {...panelProps} />;
            case 'orders': return <OrdersPanel {...panelProps} />;
            case 'reviews': return <ReviewsPanel {...panelProps} />;
            case 'promotions': return <PromotionsPanel {...panelProps} />;
            case 'flash-sales': return <FlashSalesPanel {...panelProps} />;
            case 'analytics': return <AnalyticsPanel sellerOrders={props.sellerOrders} sellerProducts={props.products} flashSales={props.flashSales} />;
            case 'payouts': return <PayoutsPanel {...panelProps} />;
// FIX: Wrap the onUpdateStoreProfile prop to match the expected signature of ShippingPanel's onUpdate prop.
            case 'livraison': return <ShippingPanel onUpdate={(storeId, settings) => props.onUpdateStoreProfile(storeId, { shippingSettings: settings })} {...panelProps} />;
// FIX: Pass the onUpdateStoreProfile prop as onUpdateProfile to the ProfilePanel.
            case 'profile': return <ProfilePanel onUpdateProfile={props.onUpdateStoreProfile} {...panelProps} />;
// FIX: Pass a wrapped onRequestUpgrade prop to SubscriptionPanel as onUpgrade.
            case 'subscription': return <SubscriptionPanel onUpgrade={(level) => props.onRequestUpgrade(store.id, level)} {...panelProps} />;
            case 'documents': return <DocumentsPanel {...panelProps} />;
            case 'stories': return <StoriesPanel {...panelProps} />;
            case 'chat': return <ChatPanel />;
            case 'support': return <SupportPanel {...panelProps} />;
            default:
                return <OverviewPanel {...panelProps} setActiveTab={setActiveTab} />;
        }
    };
    
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
                                count={tab.id === 'overview' ? unreadNotifications : undefined}
                                isLocked={tab.isLocked}
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
