



import React, { useState, useEffect } from 'react';
import { XIcon } from './components/Icons';
import { useAuth } from './contexts/AuthContext';
import { useComparison } from './contexts/ComparisonContext';
import { useUI } from './contexts/UIContext';
// FIX: Import 'Category' type
import type { User, SiteSettings, Announcement, Page, Notification, PaymentRequest, Product, Category, UserRole, PickupPoint } from './types';
import { Header } from './components/Header';
import Footer from './components/Footer';
import MaintenancePage from './components/MaintenancePage';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import LoginModal from './components/LoginModal';
import PromotionModal from './components/PromotionModal';
import ChatWidget from './components/ChatWidget';
import AddToCartModal from './components/AddToCartModal';
import PaymentModal from './components/PaymentModal';
import { ComparisonBar, StoryViewer } from './components/ComponentStubs';
import { useSiteData } from './hooks/useSiteData';
import { useAppNavigation } from './hooks/useAppNavigation';
import PageRouter from './components/PageRouter';


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
  const { user, logout: authLogout, allUsers, setAllUsers, resetPassword } = useAuth();
  const { isModalOpen, modalProduct, closeModal: uiCloseModal } = useUI();
  const { comparisonList, setProducts: setComparisonProducts } = useComparison();
  
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
            navigation.navigateToSellerDashboard('overview');
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
        let oldUser: User | undefined;
        const userToUpdate = allUsers.find(u => u.id === userId);
        if(userToUpdate) {
            oldUser = {...userToUpdate};
        }

        setAllUsers((prevUsers: User[]) => 
            prevUsers.map(u => (u.id === userId ? { ...u, ...updates } : u))
        );

        const newRole = updates.role;
        const newDepotId = updates.depotId;

        if (oldUser) {
             // Case 1: User is assigned as a new manager
            if (newRole === 'depot_manager' && newDepotId) {
                siteData.setAllPickupPoints((prevPoints: PickupPoint[]) => prevPoints.map(p => {
                    // Remove user as manager from any other depot they might have been manager of.
                    if (p.managerId === userId && p.id !== newDepotId) {
                        return { ...p, managerId: undefined };
                    }
                    // Assign as new manager
                    if (p.id === newDepotId) {
                        return { ...p, managerId: userId };
                    }
                    return p;
                }));
            }
            // Case 2: User was a manager but role changed or was unassigned from depot
            else if (oldUser.role === 'depot_manager' && (newRole !== 'depot_manager' || !newDepotId)) {
                siteData.setAllPickupPoints((prevPoints: PickupPoint[]) => prevPoints.map(p => 
                    p.id === oldUser.depotId ? { ...p, managerId: undefined } : p
                ));
            }
        }
    };


  // Connect allProducts to comparison context
  useEffect(() => { setComparisonProducts(siteData.allProducts); }, [siteData.allProducts, setComparisonProducts]);
  
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
          onLogout={authLogout}
          onSearch={navigation.handleSearch}
          isChatEnabled={true}
          isPremiumProgramEnabled={siteData.siteSettings.isPremiumProgramEnabled}
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
          />
        </main>

        <Footer 
          onNavigate={navigation.navigateToInfoPage} 
          logoUrl={siteData.siteSettings.logoUrl} 
          paymentMethods={siteData.allPaymentMethods}
          socialLinks={siteData.siteSettings.socialLinks}
          companyName={siteData.siteSettings.companyName}
        />
        
        {comparisonList.length > 0 && <ComparisonBar />}
        
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
            onEmailSubmit={(email) => { setEmailForPasswordReset(email); alert(`Un email de réinitialisation a été envoyé à ${email}. (Simulation)`); }}
          />
        )}

        {isModalOpen && modalProduct && <AddToCartModal product={modalProduct} onClose={uiCloseModal} onNavigateToCart={navigation.navigateToCart} />}
        
        {promotionModalProduct && <PromotionModal product={promotionModalProduct} onClose={() => setPromotionModalProduct(null)} onSave={siteData.handleSetPromotion} />}
        
        {paymentRequest && <PaymentModal paymentRequest={paymentRequest} paymentMethods={siteData.allPaymentMethods} onClose={() => setPaymentRequest(null)} />}

        {user && <ChatWidget allUsers={allUsers} allProducts={siteData.allProducts} allCategories={siteData.allCategories} />}

        {navigation.viewingStoriesFor && <StoryViewer store={navigation.viewingStoriesFor} onClose={navigation.handleCloseStories} />}
    </div>
  );
}