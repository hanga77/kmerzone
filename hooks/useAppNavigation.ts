import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Page, Product, Category, Store, Order, Notification, SiteContent } from '../types';

export const useAppNavigation = (allCategories: Category[], allStores: Store[], allOrders: Order[], allSiteContent: SiteContent[]) => {
    const [page, setPage] = useState<Page>('home');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [infoPageContent, setInfoPageContent] = useState<{ title: string; content: string; slug?: string; } | null>(null);
    const [viewingStoriesFor, setViewingStoriesFor] = useState<Store | null>(null);
    const [accountPageTab, setAccountPageTab] = useState<string>('dashboard');
    const [sellerDashboardTab, setSellerDashboardTab] = useState<string>('overview');
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);

    const navigateToHome = useCallback(() => setPage('home'), []);
    const navigateToCart = useCallback(() => setPage('cart'), []);
    const navigateToCheckout = useCallback(() => setPage('checkout'), []);
    const navigateToStores = useCallback(() => setPage('stores'), []);
    const navigateToStoresMap = useCallback(() => setPage('stores-map'), []);
    const navigateToBecomeSeller = useCallback(() => setPage('become-seller'), []);
    const navigateToSellerDashboard = useCallback((tab: string = 'overview') => {
        setSellerDashboardTab(tab);
        setPage('seller-dashboard');
    }, []);
    const navigateToSellerProfile = useCallback(() => setPage('seller-profile'), []);
    const navigateToSuperAdminDashboard = useCallback(() => setPage('superadmin-dashboard'), []);
    const navigateToOrderHistory = useCallback(() => setPage('order-history'), []);
    const navigateToPromotions = useCallback(() => setPage('promotions'), []);
    const navigateToFlashSales = useCallback(() => setPage('flash-sales'), []);
    const navigateToWishlist = useCallback(() => setPage('wishlist'), []);
    const navigateToDeliveryAgentDashboard = useCallback(() => setPage('delivery-agent-dashboard'), []);
    const navigateToDepotAgentDashboard = useCallback(() => setPage('depot-agent-dashboard'), []);
    const navigateToComparison = useCallback(() => setPage('comparison'), []);
    const navigateToBecomePremium = useCallback(() => setPage('become-premium'), []);
    const navigateToVisualSearch = useCallback(() => setPage('visual-search'), []);
    const navigateToServices = useCallback(() => setPage('services'), []);

    const navigateToProductForm = useCallback((product: Product | null) => {
        setProductToEdit(product);
        setPage('product-form');
    }, []);

    const navigateToProduct = useCallback((product: Product) => {
        setSelectedProduct(product);
        setPage('product');
    }, []);

    const navigateToCategory = useCallback((categoryId: string) => {
        const category = allCategories.find(c => c.id === categoryId);
        if (category) {
            setSelectedCategoryId(categoryId);
            setPage('category');
        }
    }, [allCategories]);

    const navigateToVendorPage = useCallback((vendorName: string) => {
        const store = allStores.find(s => s.name === vendorName);
        if (store) {
            setSelectedStore(store);
            setPage('vendor-page');
        }
    }, [allStores]);

    const navigateToOrderDetail = useCallback((order: Order) => {
        setSelectedOrder(order);
        setPage('order-detail');
    }, []);
    
    const navigateToAccount = useCallback((tab: string = 'dashboard') => {
        setAccountPageTab(tab);
        setPage('account');
    }, []);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPage('search-results');
    }, []);

    const navigateToInfoPage = useCallback((slug: string) => {
        if (slug === 'sell') {
            navigateToBecomeSeller();
            return;
        }

        const content = allSiteContent.find(c => c.slug === slug);
        if (content) {
            setInfoPageContent(content);
        } else {
            console.warn(`Info page content for slug '${slug}' not found.`);
            setInfoPageContent({ 
                title: 'Page en construction', 
                content: '<h2>Contenu bientôt disponible</h2><p>Cette page est actuellement en cours de construction. Revenez bientôt !</p>' 
            });
        }
        setPage('info');
    }, [allSiteContent, navigateToBecomeSeller]);
    
    const handleNavigateFromNotification = useCallback((link: Notification['link']) => {
        if (!link) return;
        const { page: targetPage, params } = link;

        switch (targetPage) {
            case 'order-detail':
                const order = allOrders.find(o => o.id === params?.orderId);
                if (order) navigateToOrderDetail(order);
                break;
            case 'seller-dashboard':
                navigateToSellerDashboard(params?.tab || 'overview');
                break;
            // Add other cases as needed
            default:
                setPage(targetPage);
        }
    }, [allOrders, navigateToOrderDetail, navigateToSellerDashboard]);
    
    const handleCloseStories = useCallback(() => setViewingStoriesFor(null), []);

    return useMemo(() => ({
        page,
        setPage,
        selectedProduct,
        selectedCategoryId,
        selectedStore,
        selectedOrder,
        setSelectedOrder,
        searchQuery,
        infoPageContent,
        viewingStoriesFor,
        setViewingStoriesFor,
        accountPageTab,
        sellerDashboardTab,
        productToEdit,
        navigateToHome,
        navigateToCart,
        navigateToCheckout,
        navigateToStores,
        navigateToStoresMap,
        navigateToBecomeSeller,
        navigateToSellerDashboard,
        navigateToSellerProfile,
        navigateToSuperAdminDashboard,
        navigateToOrderHistory,
        navigateToPromotions,
        navigateToFlashSales,
        navigateToWishlist,
        navigateToDeliveryAgentDashboard,
        navigateToDepotAgentDashboard,
        navigateToComparison,
        navigateToBecomePremium,
        navigateToProduct,
        navigateToCategory,
        navigateToVendorPage,
        navigateToOrderDetail,
        navigateToAccount,
        handleSearch,
        navigateToInfoPage,
        handleNavigateFromNotification,
        handleCloseStories,
        navigateToVisualSearch,
        navigateToProductForm,
        navigateToServices
    }), [
        page, selectedProduct, selectedCategoryId, selectedStore, selectedOrder, searchQuery,
        infoPageContent, viewingStoriesFor, accountPageTab, sellerDashboardTab, productToEdit,
        navigateToHome, navigateToCart, navigateToCheckout, navigateToStores, navigateToStoresMap,
        navigateToBecomeSeller, navigateToSellerDashboard, navigateToSellerProfile,
        navigateToSuperAdminDashboard, navigateToOrderHistory, navigateToPromotions,
        navigateToFlashSales, navigateToWishlist, navigateToDeliveryAgentDashboard,
        navigateToDepotAgentDashboard, navigateToComparison, navigateToBecomePremium,
        navigateToProduct, navigateToCategory, navigateToVendorPage, navigateToOrderDetail,
        navigateToAccount, handleSearch, navigateToInfoPage, handleNavigateFromNotification,
        handleCloseStories, navigateToVisualSearch, setSelectedOrder, setViewingStoriesFor,
        navigateToProductForm, navigateToServices
    ]);
};