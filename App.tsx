
import React, { useState, useMemo } from 'react';
import { useSiteData } from './hooks/useSiteData';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
import { useLanguage } from './contexts/LanguageContext';

import { Header } from './components/Header';
import Footer from './components/Footer';
import PageRouter from './components/PageRouter';
import LoginModal from './components/LoginModal';
import AddToCartModal from './components/AddToCartModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import StoryViewer from './components/StoryViewer';
import ChatWidget from './components/ChatWidget';
import PromotionModal from './components/PromotionModal';
import PaymentModal from './components/PaymentModal';
import MaintenancePage from './components/MaintenancePage';
import StructuredData from './components/StructuredData';

import type { Product, PaymentRequest, User, Announcement } from './types';
import { MegaphoneIcon, XIcon, ExclamationTriangleIcon } from './components/Icons';

const AnnouncementBanner: React.FC<{
    announcements: Announcement[];
    dismissed: string[];
    onDismiss: (id: string) => void;
}> = ({ announcements, dismissed, onDismiss }) => {
    const activeAnnouncement = useMemo(() => {
        const now = new Date();
        return announcements.find(a => 
            a.isActive && 
            !dismissed.includes(a.id) && 
            new Date(a.startDate) <= now && 
            new Date(a.endDate) >= now
        );
    }, [announcements, dismissed]);

    if (!activeAnnouncement) return null;

    return (
        <div className="bg-kmer-green text-white px-4 py-2 flex items-center justify-center text-center text-sm relative">
            <MegaphoneIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{activeAnnouncement.content}</span>
            <button onClick={() => onDismiss(activeAnnouncement.id)} className="absolute right-4 p-1">
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
};


export const App: React.FC = () => {
    const { user, login, logout, register, resetPassword } = useAuth();
    const { t } = useLanguage();
    const siteData = useSiteData();
    const navigation = useAppNavigation(siteData.allCategories, siteData.allStores, siteData.allOrders, siteData.siteContent);
    const { isModalOpen, modalProduct, closeModal } = useUI();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [promotionModalProduct, setPromotionModalProduct] = useState<Product | null>(null);
    const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

    const handleLoginSuccess = (loggedInUser: User) => {
        setIsLoginOpen(false);
        if (loggedInUser.role === 'seller' || loggedInUser.role === 'enterprise') {
            navigation.navigateToSellerDashboard();
        } else if (loggedInUser.role === 'superadmin') {
            navigation.navigateToSuperAdminDashboard();
        } else if (loggedInUser.role === 'delivery_agent') {
            navigation.navigateToDeliveryAgentDashboard();
        } else if (loggedInUser.role === 'depot_agent' || loggedInUser.role === 'depot_manager') {
            navigation.navigateToDepotAgentDashboard();
        }
    };
    
    const handleSelectSellerType = (type: 'physical' | 'service') => {
        setIsLoginOpen(false);
        if (type === 'service') {
            navigation.navigateToBecomeServiceProvider();
        } else {
            navigation.navigateToBecomeSeller();
        }
    };
    
    const handleLogout = () => {
        logout();
        navigation.navigateToHome();
    };

    if (siteData.isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
    }

    if (siteData.error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-red-50 dark:bg-gray-900">
                <div className="max-w-2xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center border-t-4 border-red-500">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Erreur de Connexion au Backend</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {siteData.error}
                    </p>
                    <div className="mt-6 text-left text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded-md space-y-2">
                        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Conseils de dépannage :</h2>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                            <li>Assurez-vous que le serveur de développement est bien démarré (généralement avec la commande <code>npm run start</code>).</li>
                            <li>Vérifiez la console du terminal où vous avez lancé le serveur pour y déceler des messages d'erreur, notamment des erreurs de connexion à la base de données.</li>
                            <li>Exécutez le script <code>npm run seed</code> et assurez-vous qu'il se termine sans erreur. Si des erreurs de type `ETIMEDOUT` apparaissent, vous devez probablement autoriser votre adresse IP dans les paramètres "Network Access" de votre cluster MongoDB Atlas.</li>
                        </ul>
                    </div>
                     <button
                        onClick={() => window.location.reload()}
                        className="mt-6 bg-red-500 text-white font-bold py-2 px-6 rounded-full hover:bg-red-600 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    if (siteData.siteSettings?.maintenanceMode.isEnabled) {
        return <MaintenancePage message={siteData.siteSettings.maintenanceMode.message} reopenDate={siteData.siteSettings.maintenanceMode.reopenDate} />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <StructuredData navigation={navigation} siteData={siteData} t={t} />
            <AnnouncementBanner announcements={siteData.allAnnouncements} dismissed={siteData.dismissedAnnouncements} onDismiss={siteData.handleDismissAnnouncement} />
            <Header
                categories={siteData.allCategories}
                onNavigateHome={navigation.navigateToHome}
                onNavigateCart={navigation.navigateToCart}
                onNavigateToStores={navigation.navigateToStores}
                onNavigateToPromotions={navigation.navigateToPromotions}
                onNavigateToCategory={navigation.navigateToCategory}
                onNavigateToBecomeSeller={navigation.navigateToBecomeSeller}
                onNavigateToSellerDashboard={navigation.navigateToSellerDashboard}
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
                onNavigateToServices={navigation.navigateToServices}
                onOpenLogin={() => setIsLoginOpen(true)}
                onLogout={handleLogout}
                onSearch={navigation.handleSearch}
                isChatEnabled={siteData.siteSettings?.isChatEnabled ?? false}
                isPremiumProgramEnabled={siteData.siteSettings?.customerLoyaltyProgram.isEnabled ?? false}
                logoUrl={siteData.siteSettings?.logoUrl || ''}
                notifications={siteData.allNotifications.filter((n: any) => n.userId === user?.id)}
                onMarkNotificationAsRead={siteData.handleMarkNotificationAsRead}
                onNavigateFromNotification={navigation.handleNavigateFromNotification}
            />

            <main className="flex-grow">
                <PageRouter
                    navigation={navigation}
                    siteData={siteData}
                    setPromotionModalProduct={setPromotionModalProduct}
                    setPaymentRequest={setPaymentRequest}
                />
            </main>

            <Footer 
                onNavigate={navigation.navigateToInfoPage} 
                logoUrl={siteData.siteSettings?.logoUrl || ''}
                paymentMethods={siteData.allPaymentMethods}
                socialLinks={siteData.siteSettings?.socialLinks}
                companyName={siteData.siteSettings?.companyName || ''}
            />
            
            {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} onLoginSuccess={handleLoginSuccess} onForgotPassword={() => { setIsLoginOpen(false); setIsForgotPasswordOpen(true); }} onSelectSellerType={handleSelectSellerType}/>}
            {isForgotPasswordOpen && <ForgotPasswordModal onClose={() => setIsForgotPasswordOpen(false)} onEmailSubmit={async (email) => { await resetPassword(email); alert(t('app.passwordResetEmailSent', email)); setIsForgotPasswordOpen(false); }} />}
            {isModalOpen && modalProduct && <AddToCartModal product={modalProduct} onClose={closeModal} onNavigateToCart={() => { closeModal(); navigation.navigateToCart(); }} />}
            {navigation.viewingStoriesFor && <StoryViewer store={navigation.viewingStoriesFor} onClose={navigation.handleCloseStories} allProducts={siteData.allProducts} onProductClick={navigation.navigateToProduct} />}
            {siteData.siteSettings?.isChatEnabled && <ChatWidget allUsers={siteData.allUsers} createNotification={siteData.createNotification} />}
            {promotionModalProduct && <PromotionModal product={promotionModalProduct} onClose={() => setPromotionModalProduct(null)} onSave={(...args) => { siteData.handleSetPromotion(...args); setPromotionModalProduct(null); }} />}
            {paymentRequest && <PaymentModal paymentRequest={paymentRequest} paymentMethods={siteData.allPaymentMethods} onClose={() => setPaymentRequest(null)} />}
        </div>
    );
};