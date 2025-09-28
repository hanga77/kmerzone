import React from 'react';
import type { Page, Product, Category, Store, Order, Notification, PaymentRequest, User, UserRole, PromoCode, Ticket, FlashSale, PickupPoint, SiteActivityLog, Payout, Advertisement, SiteContent, PaymentMethod, Zone, EmailTemplate, Review, OrderStatus, Announcement, DocumentStatus, Warning } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

import HomePage from './HomePage';
import ProductDetail from './ProductDetail';
import CartView from './CartView';
import Checkout from './Checkout';
import OrderSuccess from './OrderSuccess';
import StoresPage from './StoresPage';
import BecomeSeller from './BecomeSeller';
import CategoryPage from './CategoryPage';
import { SellerDashboard } from './SellerDashboard';
import VendorPage from './VendorPage';
import ProductForm from './ProductForm';
import SellerProfile from './SellerProfile';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import OrderHistoryPage from './OrderHistoryPage';
import OrderDetailPage from './OrderDetailPage';
import PromotionsPage from './PromotionsPage';
import FlashSalesPage from './FlashSalesPage';
import SearchResultsPage from './SearchResultsPage';
import WishlistPage from './WishlistPage';
import { DeliveryAgentDashboard } from './DeliveryAgentDashboard';
import { DepotAgentDashboard } from './DepotAgentDashboard';
import BecomePremiumPage from './BecomePremiumPage';
import { InfoPage, StoresMapPage, ComparisonPage } from './ComponentStubs';
import NotFoundPage from './NotFoundPage';
import ForbiddenPage from './ForbiddenPage';
import ServerErrorPage from './ServerErrorPage';
import ResetPasswordPage from './ResetPasswordPage';
import AccountPage from './AccountPage';
import { SellerAnalyticsDashboard } from './SellerAnalyticsDashboard';
import VisualSearchPage from './VisualSearchPage';
import SellerSubscriptionPage from './SellerSubscriptionPage';

interface PageRouterProps {
    navigation: any;
    siteData: any;
    setPromotionModalProduct: (product: Product | null) => void;
    setPaymentRequest: (request: PaymentRequest | null) => void;
    onAdminUpdateUser: (userId: string, updates: Partial<User>) => void;
    onSendBulkEmail: (recipientIds: string[], subject: string, body: string) => void;
    onApproveStore: (store: Store) => void;
    onRejectStore: (store: Store) => void;
    onToggleStoreStatus: (storeId: string, currentStatus: 'active' | 'suspended') => void;
    onWarnStore: (storeId: string, reason: string) => void;
    onWarnUser: (userId: string, reason: string) => void;
    onAdminAddCategory: (name: string, parentId?: string) => void;
    onAdminDeleteCategory: (categoryId: string) => void;
    onAdminUpdateCategory: (categoryId: string, updates: Partial<Omit<Category, 'id'>>) => void;
    onUpdateDocumentStatus: (storeId: string, documentName: string, status: DocumentStatus, reason?: string) => void;
    onSaveFlashSale: (saleData: Omit<FlashSale, 'id'|'products'>) => void;
    onUpdateFlashSaleSubmissionStatus: (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => void;
    onBatchUpdateFlashSaleStatus: (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => void;
    onAddPickupPoint: (point: Omit<PickupPoint, 'id'>) => void;
    onUpdatePickupPoint: (point: PickupPoint) => void;
    onDeletePickupPoint: (pointId: string) => void;
    onAdminReplyToTicket: (ticketId: string, message: string) => void;
    onAdminUpdateTicketStatus: (ticketId: string, status: Ticket['status']) => void;
    onReviewModeration: (productId: string, reviewIdentifier: { author: string, date: string }, newStatus: 'approved' | 'rejected') => void;
    onCreateUserByAdmin: (data: { name: string, email: string, role: UserRole }) => void;
    onCreateOrUpdateAnnouncement: (data: Omit<Announcement, 'id'> | Announcement) => void;
    onDeleteAnnouncement: (id: string) => void;
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    onResolveDispute: (orderId: string, resolution: 'refunded' | 'rejected') => void;
}

const PageRouter: React.FC<PageRouterProps> = (props) => {
    const { 
        navigation, siteData, setPromotionModalProduct, setPaymentRequest, 
        onAdminUpdateUser, onSendBulkEmail,
        onApproveStore, onRejectStore, onToggleStoreStatus, onWarnStore, onWarnUser,
        onAdminAddCategory, onAdminDeleteCategory, onAdminUpdateCategory, onUpdateDocumentStatus,
        onSaveFlashSale, onUpdateFlashSaleSubmissionStatus,
        onBatchUpdateFlashSaleStatus, onAddPickupPoint, onUpdatePickupPoint, onDeletePickupPoint,
        onAdminReplyToTicket, onAdminUpdateTicketStatus, onReviewModeration, onCreateUserByAdmin,
        onCreateOrUpdateAnnouncement, onDeleteAnnouncement, onUpdateOrderStatus, onResolveDispute
    } = props;
    
    const { user, allUsers, setAllUsers, logout } = useAuth();
    const { cart, appliedPromoCode, onApplyPromoCode, clearCart } = useCart();
    const { wishlist } = useWishlist();

    const sellerStore = user?.role === 'seller' ? siteData.allStores.find((s: Store) => s.sellerId === user.id) : undefined;
    const sellerProducts = user?.role === 'seller' && sellerStore ? siteData.allProducts.filter((p: Product) => p.vendor === sellerStore.name) : [];
    const sellerOrders = user?.role === 'seller' && sellerStore ? siteData.allOrders.filter((o: Order) => o.items.some(i => i.vendor === sellerStore.name)) : [];
    const sellerNotifications = user?.role === 'seller' && sellerStore ? siteData.allNotifications.filter((n: Notification) => n.userId === user.id) : [];

    switch (navigation.page) {
        case 'home':
            return <HomePage 
                categories={siteData.allCategories} 
                products={siteData.allProducts}
                stores={siteData.allStores}
                flashSales={siteData.flashSales}
                advertisements={siteData.allAdvertisements}
                siteSettings={siteData.siteSettings}
                onProductClick={navigation.navigateToProduct}
                onCategoryClick={navigation.navigateToCategory}
                onVendorClick={navigation.navigateToVendorPage}
                onVisitStore={navigation.navigateToVendorPage}
                onViewStories={(store) => navigation.setViewingStoriesFor(store)}
                isComparisonEnabled={siteData.siteSettings.isComparisonEnabled}
                isStoriesEnabled={siteData.siteSettings.isStoriesEnabled}
                recentlyViewedIds={siteData.recentlyViewedIds}
                userOrders={user ? siteData.allOrders.filter((o: Order) => o.userId === user.id) : []}
                wishlist={wishlist}
             />;
        case 'product':
            return navigation.selectedProduct ? <ProductDetail 
                product={navigation.selectedProduct} 
                allProducts={siteData.allProducts}
                allUsers={allUsers}
                stores={siteData.allStores}
                flashSales={siteData.flashSales}
                onBack={navigation.navigateToHome} 
                onAddReview={() => {}}
                onVendorClick={navigation.navigateToVendorPage}
                onProductClick={navigation.navigateToProduct}
                onOpenLogin={() => {}}
                isChatEnabled={siteData.siteSettings.isChatEnabled}
                isComparisonEnabled={siteData.siteSettings.isComparisonEnabled}
                onProductView={(id) => siteData.setRecentlyViewedIds((prev: string[]) => [id, ...prev.filter((pId: string) => pId !== id)].slice(0, 10))}
            /> : <NotFoundPage onNavigateHome={navigation.navigateToHome} />;
        case 'cart':
            return <CartView onBack={navigation.navigateToHome} onNavigateToCheckout={navigation.navigateToCheckout} flashSales={siteData.flashSales} allPromoCodes={siteData.allPromoCodes} appliedPromoCode={appliedPromoCode} onApplyPromoCode={onApplyPromoCode} />;
        case 'checkout':
            return <Checkout onBack={navigation.navigateToCart} onOrderConfirm={(orderData) => { if(user) { siteData.handleConfirmOrder(orderData, user); clearCart(); navigation.setPage('order-success') } }} flashSales={siteData.flashSales} allPickupPoints={siteData.allPickupPoints} allStores={siteData.allStores} appliedPromoCode={appliedPromoCode} siteSettings={siteData.siteSettings} paymentMethods={siteData.allPaymentMethods} />;
        case 'order-success':
            return <OrderSuccess order={siteData.allOrders[siteData.allOrders.length - 1]} onNavigateHome={navigation.navigateToHome} onNavigateToOrders={navigation.navigateToOrderHistory} />;
        case 'category':
            return navigation.selectedCategoryId ? <CategoryPage categoryId={navigation.selectedCategoryId} allCategories={siteData.allCategories} allProducts={siteData.allProducts} allStores={siteData.allStores} flashSales={siteData.flashSales} onProductClick={navigation.navigateToProduct} onBack={navigation.navigateToHome} onVendorClick={navigation.navigateToVendorPage} isComparisonEnabled={siteData.siteSettings.isComparisonEnabled}/> : <NotFoundPage onNavigateHome={navigation.navigateToHome}/>;
        case 'seller-dashboard':
            return sellerStore ? <SellerDashboard 
                store={sellerStore}
                products={sellerProducts}
                categories={siteData.allCategories}
                flashSales={siteData.flashSales}
                sellerOrders={sellerOrders}
                promoCodes={siteData.allPromoCodes.filter((p: PromoCode) => p.sellerId === user?.id)}
                allTickets={siteData.allTickets.filter((t: Ticket) => t.userId === user?.id)}
                onBack={() => {}}
                onAddProduct={() => navigation.setPage('product-form')}
                onEditProduct={(p) => {}}
                onDeleteProduct={() => {}}
                onUpdateProductStatus={() => {}}
                onNavigateToProfile={navigation.navigateToSellerProfile}
                onNavigateToAnalytics={() => navigation.setPage('seller-analytics-dashboard')}
                onSetPromotion={setPromotionModalProduct}
                onRemovePromotion={() => {}}
                onProposeForFlashSale={() => {}}
                onUploadDocument={() => {}}
                onUpdateOrderStatus={() => {}}
                onCreatePromoCode={() => {}}
                onDeletePromoCode={() => {}}
                isChatEnabled={siteData.siteSettings.isChatEnabled}
                onPayRent={(storeId) => setPaymentRequest({ amount: siteData.siteSettings.rentAmount, reason: `Paiement du loyer pour ${sellerStore.name}`, onSuccess: () => {} })}
                siteSettings={siteData.siteSettings}
                onAddStory={() => {}}
                onDeleteStory={() => {}}
                payouts={siteData.payouts}
                onSellerDisputeMessage={() => {}}
                onBulkUpdateProducts={() => {}}
                onReplyToReview={() => {}}
                onCreateOrUpdateCollection={() => {}}
                onDeleteCollection={() => {}}
                initialTab={navigation.sellerDashboardTab}
                sellerNotifications={sellerNotifications}
                onMarkNotificationAsRead={siteData.handleMarkNotificationAsRead}
                onNavigateFromNotification={navigation.handleNavigateFromNotification}
                onCreateTicket={() => {}}
                allShippingPartners={siteData.allShippingPartners}
                onUpdateShippingSettings={() => {}}
                onRequestUpgrade={() => {}}
            /> : <ForbiddenPage onNavigateHome={navigation.navigateToHome} />;
        case 'superadmin-dashboard':
            if (user?.role !== 'superadmin') return <ForbiddenPage onNavigateHome={navigation.navigateToHome} />;
            return <SuperAdminDashboard 
                allUsers={allUsers}
                allOrders={siteData.allOrders}
                allCategories={siteData.allCategories}
                allStores={siteData.allStores}
                allProducts={siteData.allProducts}
                siteActivityLogs={siteData.siteActivityLogs}
                flashSales={siteData.flashSales}
                allPickupPoints={siteData.allPickupPoints}
                siteSettings={siteData.siteSettings}
                payouts={siteData.payouts}
                advertisements={siteData.allAdvertisements}
                siteContent={siteData.siteContent}
                allTickets={siteData.allTickets}
                allAnnouncements={siteData.allAnnouncements}
                paymentMethods={siteData.allPaymentMethods}
                onUpdateSiteSettings={siteData.setSiteSettings}
                onPayoutSeller={(storeId, amount) => user && siteData.handlePayoutSeller(storeId, amount, user)}
                onAddAdvertisement={(data) => user && siteData.handleAddAdvertisement(data, user)}
                onUpdateAdvertisement={(id, data) => user && siteData.handleUpdateAdvertisement(id, data, user)}
                onDeleteAdvertisement={(id) => user && siteData.handleDeleteAdvertisement(id, user)}
                onSendBulkEmail={onSendBulkEmail}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onWarnStore={onWarnStore}
                onToggleStoreStatus={onToggleStoreStatus}
                onApproveStore={onApproveStore}
                onRejectStore={onRejectStore}
                onSaveFlashSale={onSaveFlashSale}
                onUpdateFlashSaleSubmissionStatus={onUpdateFlashSaleSubmissionStatus}
                onBatchUpdateFlashSaleStatus={onBatchUpdateFlashSaleStatus}
                onAddPickupPoint={onAddPickupPoint}
                onUpdatePickupPoint={onUpdatePickupPoint}
                onDeletePickupPoint={onDeletePickupPoint}
                onAdminAddCategory={onAdminAddCategory}
                onAdminDeleteCategory={onAdminDeleteCategory}
                onUpdateUser={onAdminUpdateUser}
                onCreateUserByAdmin={onCreateUserByAdmin}
                onAdminReplyToTicket={onAdminReplyToTicket}
                onAdminUpdateTicketStatus={onAdminUpdateTicketStatus}
                onCreateOrUpdateAnnouncement={onCreateOrUpdateAnnouncement}
                onDeleteAnnouncement={onDeleteAnnouncement}
                onReviewModeration={onReviewModeration}
                onUpdatePaymentMethods={siteData.setAllPaymentMethods}
                allZones={siteData.allZones}
                isChatEnabled={siteData.siteSettings.isChatEnabled}
                isComparisonEnabled={siteData.siteSettings.isComparisonEnabled}
                onAdminUpdateCategory={onAdminUpdateCategory}
                onUpdateDocumentStatus={onUpdateDocumentStatus}
                onWarnUser={onWarnUser}
                onSanctionAgent={() => {}}
                onAdminStoreMessage={() => {}}
                onAdminCustomerMessage={() => {}}
                onUpdateSiteContent={siteData.setSiteContent}
                onRequestDocument={() => {}}
                onVerifyDocumentStatus={() => {}}
                onToggleChatFeature={() => {}}
                onToggleComparisonFeature={() => {}}
                onAssignAgent={() => {}}
                onUpdateCategoryImage={() => {}}
                // FIX: Corrected a prop type mismatch issue by changing `onResolveRefund` to `onResolveDispute`. The prop name was incorrect in the SuperAdminDashboard component's props interface.
                onResolveDispute={onResolveDispute}
            />;
        case 'vendor-page':
             return navigation.selectedStore ? <VendorPage vendorName={navigation.selectedStore.name} allProducts={siteData.allProducts} allStores={siteData.allStores} flashSales={siteData.flashSales} onProductClick={navigation.navigateToProduct} onBack={navigation.navigateToHome} onVendorClick={navigation.navigateToVendorPage} isComparisonEnabled={siteData.siteSettings.isComparisonEnabled}/> : <NotFoundPage onNavigateHome={navigation.navigateToHome}/>;
        case 'order-history':
            return <OrderHistoryPage userOrders={user ? siteData.allOrders.filter((o: Order) => o.userId === user.id) : []} onBack={navigation.navigateToHome} onSelectOrder={navigation.navigateToOrderDetail} onRepeatOrder={() => {}} />;
        case 'order-detail':
            return navigation.selectedOrder ? <OrderDetailPage order={navigation.selectedOrder} onBack={navigation.navigateToOrderHistory} allPickupPoints={siteData.allPickupPoints} allUsers={allUsers} onCancelOrder={() => {}} onRequestRefund={() => {}} onCustomerDisputeMessage={() => {}}/> : <NotFoundPage onNavigateHome={navigation.navigateToHome}/>;
        case 'search-results':
            return <SearchResultsPage searchQuery={navigation.searchQuery} products={siteData.allProducts} stores={siteData.allStores} flashSales={siteData.flashSales} onProductClick={navigation.navigateToProduct} onBack={navigation.navigateToHome} onVendorClick={navigation.navigateToVendorPage} isComparisonEnabled={siteData.siteSettings.isComparisonEnabled} />;
        case 'wishlist':
            return <WishlistPage allProducts={siteData.allProducts} allStores={siteData.allStores} flashSales={siteData.flashSales} onProductClick={navigation.navigateToProduct} onBack={navigation.navigateToHome} onVendorClick={navigation.navigateToVendorPage} isComparisonEnabled={siteData.siteSettings.isComparisonEnabled}/>;
        case 'delivery-agent-dashboard':
            return <DeliveryAgentDashboard allOrders={siteData.allOrders} allStores={siteData.allStores} allPickupPoints={siteData.allPickupPoints} onUpdateOrder={() => {}} onLogout={() => {}} onUpdateUserAvailability={() => {}}/>;
        case 'depot-agent-dashboard':
            return user ? <DepotAgentDashboard 
                user={user} 
                allUsers={allUsers} 
                allOrders={siteData.allOrders}
                allStores={siteData.allStores}
                allZones={siteData.allZones}
                onLogout={logout}
                onAssignAgentToOrder={(orderId, agentId) => user && siteData.handleAssignAgentToOrder(orderId, agentId, user, allUsers)}
            /> : <ForbiddenPage onNavigateHome={navigation.navigateToHome} />;
        case 'account':
            return <AccountPage 
                        onBack={navigation.navigateToHome}
                        initialTab={navigation.accountPageTab}
                        allStores={siteData.allStores}
                        userOrders={user ? siteData.allOrders.filter((o: Order) => o.userId === user.id) : []}
                        allTickets={siteData.allTickets}
                        onCreateTicket={() => {}}
                        onUserReplyToTicket={() => {}}
                        onSelectOrder={navigation.navigateToOrderDetail}
                        onRepeatOrder={() => {}}
                        onVendorClick={navigation.navigateToVendorPage}
                    />;
        case 'seller-analytics-dashboard':
            return <SellerAnalyticsDashboard onBack={() => navigation.navigateToSellerDashboard('overview')} sellerOrders={sellerOrders} sellerProducts={sellerProducts} flashSales={siteData.flashSales}/>
        case 'seller-subscription':
            return <SellerSubscriptionPage siteSettings={siteData.siteSettings} onSelectSubscription={() => {}}/>
        case 'visual-search':
            return <VisualSearchPage onSearch={navigation.handleSearch} />;
        case 'become-seller':
            return <BecomeSeller onBack={navigation.navigateToHome} onBecomeSeller={() => {}} onRegistrationSuccess={() => navigation.setPage('seller-subscription')} siteSettings={siteData.siteSettings} />;
        case 'become-premium':
            return <BecomePremiumPage siteSettings={siteData.siteSettings} onBack={navigation.navigateToHome} onBecomePremiumByCaution={() => {}} onUpgradeToPremiumPlus={() => {}}/>
        case 'info':
            return navigation.infoPageContent ? <InfoPage title={navigation.infoPageContent.title} content={navigation.infoPageContent.content} onBack={navigation.navigateToHome} /> : <NotFoundPage onNavigateHome={navigation.navigateToHome}/>;
        case 'not-found': return <NotFoundPage onNavigateHome={navigation.navigateToHome} />;
        case 'forbidden': return <ForbiddenPage onNavigateHome={navigation.navigateToHome} />;
        case 'server-error': return <ServerErrorPage onNavigateHome={navigation.navigateToHome} />;
        case 'reset-password': return <ResetPasswordPage onPasswordReset={() => {}} onNavigateLogin={() => {}}/>;
        case 'promotions': return <PromotionsPage allProducts={siteData.allProducts} allStores={siteData.allStores} flashSales={siteData.flashSales} onProductClick={navigation.navigateToProduct} onBack={navigation.navigateToHome} onVendorClick={navigation.navigateToVendorPage} isComparisonEnabled={siteData.siteSettings.isComparisonEnabled} />;
        case 'flash-sales': return <FlashSalesPage allProducts={siteData.allProducts} allStores={siteData.allStores} flashSales={siteData.flashSales} onProductClick={navigation.navigateToProduct} onBack={navigation.navigateToHome} onVendorClick={navigation.navigateToVendorPage} isComparisonEnabled={siteData.siteSettings.isComparisonEnabled} />;
        case 'stores': return <StoresPage stores={siteData.allStores} onBack={navigation.navigateToHome} onVisitStore={navigation.navigateToVendorPage} onNavigateToStoresMap={navigation.navigateToStoresMap} />;
        case 'stores-map': return <StoresMapPage stores={siteData.allStores} onBack={navigation.navigateToStores} />;
        case 'comparison': return <ComparisonPage />;
        default: return <NotFoundPage onNavigateHome={navigation.navigateToHome} />;
    }
}

export default PageRouter;