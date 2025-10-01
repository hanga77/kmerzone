import React, { useState, useEffect } from 'react';
import { XIcon } from './components/Icons';
import { useAuth } from './contexts/AuthContext';
import { useComparison } from './contexts/ComparisonContext';
import { useUI } from './contexts/UIContext';
import type { User, SiteSettings, Announcement, Page, Notification, PaymentRequest, Product, Category, UserRole, PickupPoint, Store, Warning, DocumentStatus, UserAvailabilityStatus, OrderStatus, Order, AgentSchedule } from './types';
import { Header } from './components/Header';
import Footer from './components/Footer';
import MaintenancePage from './components/MaintenancePage';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import LoginModal from './components/LoginModal';
import PromotionModal from './components/PromotionModal';
import ChatWidget from './components/ChatWidget';
import AddToCartModal from './components/AddToCartModal';
import PaymentModal from './components/PaymentModal';
import { ComparisonBar } from './components/ComponentStubs';
import StoryViewer from './components/StoryViewer';
import { useSiteData } from './hooks/useSiteData';
import { useAppNavigation } from './hooks/useAppNavigation';
import PageRouter from './components/PageRouter';
import { useLanguage } from './contexts/LanguageContext';


const updateMetaTag = (name: string, content: string, isProperty: boolean = false) => {
  const selector = isProperty ? `meta[property='${name}']` : `meta[name='${name}']`;
  let element = document.head.querySelector(selector) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    if (isProperty) element.setAttribute('property', name);
    else element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.content = content;
};

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
  const { user, logout: authLogout, allUsers, setAllUsers, resetPassword, updateUserInfo } = useAuth();
  const { isModalOpen, modalProduct, closeModal: uiCloseModal } = useUI();
  const { comparisonList, setProducts: setComparisonProducts } = useComparison();
  const { t } = useLanguage();
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [emailForPasswordReset, setEmailForPasswordReset] = useState<string | null>(null);
  
  const siteData = useSiteData();
  const navigation = useAppNavigation(siteData.allCategories, siteData.allStores, siteData.allOrders, siteData.siteContent);
  
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [promotionModalProduct, setPromotionModalProduct] = useState<Product | null>(null);
  
  const handleLoginSuccess = (loggedInUser: User) => {
    setIsLoginModalOpen(false);
    switch (loggedInUser.role) {
        case 'superadmin':
            navigation.navigateToSuperAdminDashboard();
            break;
        case 'seller':
            // If new seller without a shop, guide them to create one.
            if (!loggedInUser.shopName) {
                navigation.navigateToBecomeSeller();
            } else {
                navigation.navigateToSellerDashboard('overview');
            }
            break;
        case 'delivery_agent':
            navigation.navigateToDeliveryAgentDashboard();
            break;
        case 'depot_agent':
        case 'depot_manager':
            navigation.navigateToDepotAgentDashboard();
            break;
        case 'customer':
        default:
            navigation.navigateToAccount('dashboard');
            break;
    }
  };

    const handleAdminUpdateUser = (userId: string, updates: Partial<User>) => {
        const updatedUsers = siteData.handleAdminUpdateUser(userId, updates, allUsers);
        setAllUsers(updatedUsers);
    };
    
    const handleWarnUser = (userId: string, reason: string) => {
        if (!user) return;
        const newWarning: Warning = { id: `warn-${Date.now()}`, date: new Date().toISOString(), reason };
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, warnings: [...(u.warnings || []), newWarning] } : u));
        siteData.logActivity(user, 'USER_WARNED', `Avertissement envoyé à l'utilisateur ${userId}. Motif: ${reason}`);
    };
    
    const handleUpdateDocumentStatus = (storeId: string, documentName: string, status: DocumentStatus, rejectionReason: string | undefined) => {
        if (!user) return;
        siteData.handleUpdateDocumentStatus(storeId, documentName, status, rejectionReason, user);
    };

    const handleSendBulkEmail = (recipientIds: string[], subject: string, body: string) => {
        if (user) {
            siteData.handleSendBulkEmail(recipientIds, subject, body, user);
        }
    };

    const handleLogout = () => {
        authLogout();
        navigation.navigateToHome();
    };

    const handleUpdateUserAvailability = (userId: string, newStatus: UserAvailabilityStatus) => {
        updateUserInfo(userId, { availabilityStatus: newStatus });
    };
    
    const handleUpdateDeliveryStatus = (orderId: string, status: OrderStatus, details?: { signature?: string; failureReason?: Order['deliveryFailureReason'] }) => {
        if (user) {
            siteData.handleUpdateDeliveryStatus(orderId, status, user, details);
        }
    };


  // Connect allProducts to comparison context
  useEffect(() => { setComparisonProducts(siteData.allProducts); }, [siteData.allProducts, setComparisonProducts]);
  
    // Dynamically update favicon
    useEffect(() => {
        const favicon = document.getElementById('favicon') as HTMLLinkElement;
        if (favicon && siteData.siteSettings.logoUrl) {
            // Simple URL check. In real app, might need more robust handling for SVG data URLs etc.
            if (siteData.siteSettings.logoUrl.startsWith('http') || siteData.siteSettings.logoUrl.startsWith('data:image')) {
                favicon.href = siteData.siteSettings.logoUrl;
            }
        }
    }, [siteData.siteSettings.logoUrl]);

  // Update SEO meta tags based on current page/selection
  useEffect(() => {
    let { metaTitle: title, metaDescription: description, ogImageUrl } = siteData.siteSettings.seo;
    const { page, selectedProduct, selectedCategoryId, selectedStore } = navigation;

    switch(page) {
      case 'product': if (selectedProduct) { title = `${selectedProduct.name} | KMER ZONE`; description = selectedProduct.description.substring(0, 160); ogImageUrl = selectedProduct.imageUrls[0] || ogImageUrl; } break;
      case 'category': const category = siteData.allCategories.find((c: Category) => c.id === selectedCategoryId); if (category) { title = `${category.name} | KMER ZONE`; ogImageUrl = category.imageUrl || ogImageUrl; } break;
      case 'vendor-page': const store = selectedStore; if (store) { title = `${store.name} - Boutique sur KMER ZONE`; ogImageUrl = store.logoUrl || ogImageUrl; } break;
      default: break;
    }
    
    document.title = title;
    updateMetaTag('description', description);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', ogImageUrl, true);
    updateMetaTag('twitter:title', title, false);
    updateMetaTag('twitter:description', description, false);
    updateMetaTag('twitter:image', ogImageUrl, false);

  }, [navigation.page, navigation.selectedProduct, navigation.selectedCategoryId, navigation.selectedStore, siteData.siteSettings.seo, siteData.allCategories]);

  const activeAnnouncement = siteData.allAnnouncements
      .filter((a: Announcement) => a.isActive && !siteData.dismissedAnnouncements.includes(a.id) && new Date(a.startDate) <= new Date() && new Date(a.endDate) >= new Date())
      .find((a: Announcement) => {
          if (a.target === 'all') return true;
          if (!user && (a.target === 'customers' || a.target === 'sellers')) return false;
          if (user && user.role === 'customer' && a.target === 'customers') return true;
          if (user && user.role === 'seller' && a.target === 'sellers') return true;
          return false;
      });

  if (siteData.siteSettings.maintenanceMode.isEnabled && user?.role !== 'superadmin') {
    return <MaintenancePage {...siteData.siteSettings.maintenanceMode} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
        {activeAnnouncement && <AnnouncementBanner announcement={activeAnnouncement} onDismiss={siteData.handleDismissAnnouncement} />}
      
        <Header
          categories={siteData.allCategories}
          onNavigateHome={navigation.navigateToHome}
          onNavigateCart={navigation.navigateToCart}
          onNavigateToStores={navigation.navigateToStores}
          onNavigateToPromotions={navigation.navigateToPromotions}
          onNavigateToCategory={navigation.navigateToCategory}
          onNavigateToBecomeSeller={navigation.navigateToBecomeSeller}
          onNavigateToSellerDashboard={() => navigation.navigateToSellerDashboard('overview')}
          onNavigateToSellerProfile={navigation.navigateToSellerProfile}
          onNavigateToOrderHistory={navigation.navigateToOrderHistory}
          onNavigateToSuperAdminDashboard={navigation.navigateToSuperAdminDashboard}
          onNavigateToFlashSales={navigation.navigateToFlashSales}
          onNavigateToWishlist={navigation.navigateToWishlist}
          onNavigateToDeliveryAgentDashboard={navigation.navigateToDeliveryAgentDashboard}
          onNavigateToDepotAgentDashboard={navigation.navigateToDepotAgentDashboard}
          onNavigateToBecomePremium={navigation.navigateToBecomePremium}
          onNavigateToAccount={navigation.navigateToAccount}
          onNavigateToVisualSearch={navigation.navigateToVisualSearch}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onSearch={navigation.handleSearch}
          isChatEnabled={siteData.siteSettings.isChatEnabled}
          isPremiumProgramEnabled={siteData.siteSettings.customerLoyaltyProgram.isEnabled}
          logoUrl={siteData.siteSettings.logoUrl}
          notifications={siteData.allNotifications.filter((n: Notification) => n.userId === user?.id)}
          onMarkNotificationAsRead={siteData.handleMarkNotificationAsRead}
          onNavigateFromNotification={navigation.handleNavigateFromNotification}
        />

        <main className="flex-grow">
          <PageRouter 
            navigation={navigation} 
            siteData={siteData} 
            setPromotionModalProduct={setPromotionModalProduct}
            setPaymentRequest={setPaymentRequest}
            onAdminUpdateUser={handleAdminUpdateUser}
            onSendBulkEmail={handleSendBulkEmail}
            onApproveStore={(store: Store) => user && siteData.handleApproveStore(store, user)}
            onRejectStore={(store: Store) => user && siteData.handleRejectStore(store, user)}
            onToggleStoreStatus={(storeId: string, currentStatus: 'active' | 'suspended') => user && siteData.handleToggleStoreStatus(storeId, currentStatus, user)}
            onWarnStore={(storeId: string, reason: string) => user && siteData.handleWarnStore(storeId, reason, user)}
            onAdminAddCategory={(name, parentId) => user && siteData.handleAdminAddCategory(name, parentId, user)}
            onAdminDeleteCategory={(categoryId) => user && siteData.handleAdminDeleteCategory(categoryId, user)}
            onAdminUpdateCategory={(categoryId, updates) => user && siteData.handleAdminUpdateCategory(categoryId, updates, user)}
            onUpdateDocumentStatus={handleUpdateDocumentStatus}
            onWarnUser={handleWarnUser}
            onSaveFlashSale={(saleData) => user && siteData.handleSaveFlashSale(saleData, user)}
            onUpdateFlashSaleSubmissionStatus={(flashSaleId, productId, status) => user && siteData.handleUpdateFlashSaleSubmissionStatus(flashSaleId, productId, status, user)}
            onBatchUpdateFlashSaleStatus={(flashSaleId, productIds, status) => user && siteData.handleBatchUpdateFlashSaleStatus(flashSaleId, productIds, status, user)}
            onAddPickupPoint={(point) => user && siteData.handleAddPickupPoint(point, user)}
            onUpdatePickupPoint={(point) => user && siteData.handleUpdatePickupPoint(point, user)}
            onDeletePickupPoint={(pointId) => user && siteData.handleDeletePickupPoint(pointId, user)}
            onAdminReplyToTicket={(ticketId, message) => user && siteData.handleAdminReplyToTicket(ticketId, message, user)}
            onAdminUpdateTicketStatus={(ticketId, status) => user && siteData.handleAdminUpdateTicketStatus(ticketId, status, user)}
            onReviewModeration={(productId, reviewIdentifier, newStatus) => user && siteData.handleReviewModeration(productId, reviewIdentifier, newStatus, user)}
            onCreateUserByAdmin={(data) => user && siteData.handleCreateUserByAdmin(data, user)}
            onCreateOrUpdateAnnouncement={(data) => user && siteData.handleCreateOrUpdateAnnouncement(data, user)}
            onDeleteAnnouncement={(id) => user && siteData.handleDeleteAnnouncement(id, user)}
            onUpdateOrderStatus={(orderId, status) => user && siteData.handleUpdateOrderStatus(orderId, status, user)}
            onResolveDispute={(orderId, resolution) => user && siteData.handleResolveDispute(orderId, resolution, user)}
            onSellerUpdateOrderStatus={(orderId, status) => user && siteData.handleSellerUpdateOrderStatus(orderId, status, user)}
            onSellerCancelOrder={(orderId, user) => siteData.handleSellerCancelOrder(orderId, user)}
            onCreateOrUpdateCollection={(storeId, collection) => user && siteData.handleCreateOrUpdateCollection(storeId, collection, user)}
            onDeleteCollection={(storeId, collectionId) => user && siteData.handleDeleteCollection(storeId, collectionId, user)}
            onUpdateStoreProfile={(storeId, data) => user && siteData.handleUpdateStoreProfile(storeId, data, user)}
            onUpdateUserAvailability={handleUpdateUserAvailability}
            onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
            onUpdateSchedule={(depotId: string, schedule: AgentSchedule) => user && siteData.handleUpdateSchedule(depotId, schedule, user)}
            onAddProductToStory={(productId: string) => user && siteData.handleAddProductToStory(productId, user)}
            onAddStory={(imageUrl: string) => user && siteData.handleAddStory(imageUrl, user)}
          />
        </main>

        <Footer 
          onNavigate={navigation.navigateToInfoPage} 
          logoUrl={siteData.siteSettings.logoUrl} 
          paymentMethods={siteData.allPaymentMethods}
          socialLinks={siteData.siteSettings.socialLinks}
          companyName={siteData.siteSettings.companyName}
        />
        
        {comparisonList.length > 0 && siteData.siteSettings.isComparisonEnabled && <ComparisonBar />}
        
        {isLoginModalOpen && (
          <LoginModal
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={() => { setIsLoginModalOpen(false); setIsForgotPasswordModalOpen(true); }}
          />
        )}
        
        {isForgotPasswordModalOpen && (
          <ForgotPasswordModal
            onClose={() => setIsForgotPasswordModalOpen(false)}
            onEmailSubmit={(email) => { setEmailForPasswordReset(email); alert(t('app.passwordResetEmailSent', email)); }}
          />
        )}

        {isModalOpen && modalProduct && <AddToCartModal product={modalProduct} onClose={uiCloseModal} onNavigateToCart={navigation.navigateToCart} />}
        
        {promotionModalProduct && <PromotionModal product={promotionModalProduct} onClose={() => setPromotionModalProduct(null)} onSave={siteData.handleSetPromotion} />}
        
        {paymentRequest && <PaymentModal paymentRequest={paymentRequest} paymentMethods={siteData.allPaymentMethods} onClose={() => setPaymentRequest(null)} />}

        {user && siteData.siteSettings.isChatEnabled && <ChatWidget allUsers={allUsers} allProducts={siteData.allProducts} allCategories={siteData.allCategories} />}

        {navigation.viewingStoriesFor && <StoryViewer store={navigation.viewingStoriesFor} onClose={navigation.handleCloseStories} allProducts={siteData.allProducts} onProductClick={navigation.navigateToProduct} />}
    </div>
  );
}