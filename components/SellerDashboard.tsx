import React, { useState, useMemo, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import type { Product, Category, Store, FlashSale, Order, OrderStatus, PromoCode, DocumentStatus, SiteSettings, Story, FlashSaleProduct, Payout, CartItem, ProductCollection, Review, Notification, Ticket, ShippingPartner, ShippingSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { PencilSquareIcon, TrashIcon, Cog8ToothIcon, TagIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, BoltIcon, DocumentTextIcon, ShoppingBagIcon, TruckIcon, BuildingStorefrontIcon, CurrencyDollarIcon, ChartPieIcon, StarIcon, ChatBubbleBottomCenterTextIcon, PlusIcon, XCircleIcon, PrinterIcon, SparklesIcon, BarChartIcon, PaperAirplaneIcon, BanknotesIcon, ChatBubbleLeftRightIcon, BookmarkSquareIcon, BellIcon, PaperclipIcon, UsersIcon, StarPlatinumIcon } from './Icons';
import ShippingSettingsPanel from './ShippingSettingsPanel';
import SellerSubscriptionPanel from './SellerSubscriptionPanel';

declare const Html5Qrcode: any;

interface SellerDashboardProps {
  store?: Store;
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
  onNavigateToProfile: () => void;
  onNavigateToAnalytics: () => void;
  onSetPromotion: (product: Product) => void;
  onRemovePromotion: (productId: string) => void;
  onProposeForFlashSale: (flashSaleId: string, productId: string, flashPrice: number, sellerShopName: string) => void;
  onUploadDocument: (storeId: string, documentName: string, fileUrl: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onCreatePromoCode: (codeData: Omit<PromoCode, 'uses'>) => void;
  onDeletePromoCode: (code: string) => void;
  isChatEnabled: boolean;
  onPayRent: (storeId: string) => void;
  siteSettings: SiteSettings;
  onAddStory: (storeId: string, imageUrl: string) => void;
  onDeleteStory: (storeId: string, storyId: string) => void;
  payouts: Payout[];
  onSellerDisputeMessage: (orderId: string, message: string) => void;
  onBulkUpdateProducts: (updates: Array<Pick<Product, 'id' | 'price' | 'stock'>>) => void;
  onReplyToReview: (productId: string, reviewIdentifier: { author: string; date: string }, replyText: string) => void;
  onCreateOrUpdateCollection: (storeId: string, collection: Omit<ProductCollection, 'id' | 'storeId'> | ProductCollection) => void;
  onDeleteCollection: (storeId: string, collectionId: string) => void;
  initialTab: string;
  sellerNotifications: Notification[];
  onMarkNotificationAsRead: (notificationId: string) => void;
  onNavigateFromNotification: (link: Notification['link']) => void;
  onCreateTicket: (subject: string, message: string, relatedOrderId?: string, type?: 'support' | 'service_request', attachmentUrls?: string[]) => void;
  allShippingPartners: ShippingPartner[];
  onUpdateShippingSettings: (storeId: string, settings: ShippingSettings) => void;
  onRequestUpgrade: (storeId: string, level: 'premium' | 'super_premium') => void;
}

const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, count?: number, isLocked?: boolean }> = ({ icon, label, isActive, onClick, count, isLocked }) => (
    <button
        onClick={onClick}
        disabled={isLocked}
        className={`relative flex items-center gap-3 w-full text-left px-3 py-3 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
            isActive
                ? 'bg-kmer-green/10 text-kmer-green'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
        } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isLocked ? "Passez au statut Premium pour débloquer cette fonctionnalité" : ""}
    >
        {icon}
        <span>{label}</span>
        {count !== undefined && count > 0 && (
            <span className="ml-auto text-xs bg-kmer-red text-white rounded-full px-1.5 py-0.5">{count}</span>
        )}
    </button>
);


const UpgradeToPremiumPanel: React.FC<{ 
    store: Store;
    siteSettings: SiteSettings; 
    onRequestUpgrade: (storeId: string, level: 'premium' | 'super_premium') => void;
    featureName: string; 
}> = ({ store, siteSettings, onRequestUpgrade, featureName }) => (
    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <StarIcon className="w-12 h-12 text-kmer-yellow mx-auto mb-4"/>
        <h2 className="text-2xl font-bold mb-2">Débloquez la fonctionnalité "{featureName}"</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Passez au statut Premium pour accéder à des outils avancés et booster votre visibilité.</p>
        <button onClick={() => onRequestUpgrade(store.id, 'premium')} className="bg-kmer-yellow text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition-colors">
            Je veux devenir Premium
        </button>
    </div>
);


export const SellerDashboard: React.FC<SellerDashboardProps> = (props) => {
    const { store, products, categories, flashSales, sellerOrders, promoCodes, allTickets, onBack, onAddProduct, onEditProduct, onDeleteProduct, onUpdateProductStatus, onNavigateToProfile, onNavigateToAnalytics, onSetPromotion, onRemovePromotion, onProposeForFlashSale, onUploadDocument, onUpdateOrderStatus, onCreatePromoCode, onDeletePromoCode, isChatEnabled, onPayRent, siteSettings, onAddStory, onDeleteStory, payouts, onSellerDisputeMessage, onBulkUpdateProducts, onReplyToReview, onCreateOrUpdateCollection, onDeleteCollection, initialTab, sellerNotifications, onMarkNotificationAsRead, onNavigateFromNotification, onCreateTicket, allShippingPartners, onUpdateShippingSettings, onRequestUpgrade } = props;
    const [activeTab, setActiveTab] = useState(initialTab || 'overview');
    const { user } = useAuth();
    
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);
    
    const unreadNotifications = sellerNotifications.filter(n => !n.isRead).length;

    if (!store) {
        return <div className="p-8 text-center">Chargement des informations de la boutique...</div>;
    }
    
    const isPremium = store.premiumStatus === 'premium' || store.premiumStatus === 'super_premium';

    const TABS = [
      { id: 'overview', label: 'Aperçu', icon: <ChartPieIcon className="w-5 h-5"/>, count: unreadNotifications, isLocked: false },
      { id: 'products', label: 'Produits', icon: <ShoppingBagIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'collections', label: 'Collections', icon: <BookmarkSquareIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'orders', label: 'Commandes', icon: <TruckIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'reviews', label: 'Avis Clients', icon: <StarIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'promotions', label: 'Promotions', icon: <TagIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'flash-sales', label: 'Ventes Flash', icon: <BoltIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'analytics', label: 'Statistiques', icon: <BarChartIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'payouts', label: 'Paiements', icon: <BanknotesIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'livraison', label: 'Livraison', icon: <TruckIcon className="w-5 h-5"/>, isLocked: !isPremium },
      { id: 'services', label: 'Services', icon: <SparklesIcon className="w-5 h-5"/>, isLocked: !isPremium },
      { id: 'profile', label: 'Profil Boutique', icon: <BuildingStorefrontIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'subscription', label: 'Abonnement', icon: <StarPlatinumIcon className="w-5 h-5" />, isLocked: false },
      { id: 'documents', label: 'Documents', icon: <DocumentTextIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'chat', label: 'Messages', icon: <ChatBubbleLeftRightIcon className="w-5 h-5"/>, isLocked: false },
      { id: 'support', label: 'Support', icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>, isLocked: false },
    ];
    
    const renderContent = () => {
        const selectedTab = TABS.find(t => t.id === activeTab);
        if (selectedTab?.isLocked) {
             return <UpgradeToPremiumPanel store={store} siteSettings={siteSettings} onRequestUpgrade={onRequestUpgrade} featureName={selectedTab.label} />;
        }

        switch(activeTab) {
            case 'livraison':
                return <ShippingSettingsPanel store={store} allShippingPartners={allShippingPartners} onUpdate={onUpdateShippingSettings} />;
            case 'subscription':
                return <SellerSubscriptionPanel store={store} siteSettings={siteSettings} onUpgrade={(level) => onRequestUpgrade(store.id, level)} />;
            // Add other tab component renders here...
            default:
                return (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Aperçu</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Visites (jour)</h3>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{store.visits || 0}</p>
                            </div>
                         </div>

                         {store.premiumStatus === 'standard' && (
                            <div className="p-6 bg-green-50 dark:bg-green-900/50 border-l-4 border-green-500 rounded-r-lg">
                                <h3 className="font-bold text-lg">Passez au niveau supérieur !</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Débloquez plus d'outils, augmentez votre visibilité et profitez d'un support prioritaire en passant au statut Premium.</p>
                                <button onClick={() => setActiveTab('subscription')} className="mt-4 bg-kmer-green text-white font-semibold py-2 px-4 rounded-md">Voir les plans d'abonnement</button>
                            </div>
                         )}
                    </div>
                );
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
