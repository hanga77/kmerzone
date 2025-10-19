import { useState, useEffect, useCallback } from 'react';
import type { SiteData, Product, Order, Store, FlashSale, PromoCode, SiteSettings, Payout, Advertisement, SiteContent, Ticket, Announcement, PaymentMethod, User, Notification, Review, OrderStatus, DocumentStatus, ProductCollection, ShippingSettings, NewOrderData, DisputeMessage, AgentSchedule, PickupPoint } from '../types';
import { usePersistentState } from './usePersistentState';

// A function to fetch data from the backend.
async function fetchDataFromApi(endpoint: string, options?: RequestInit) {
    const defaultOptions: RequestInit = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    };
    const finalOptions = { ...defaultOptions, ...options, headers: {...defaultOptions.headers, ...options?.headers} };

    const response = await fetch(`/api${endpoint}`, finalOptions);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status} on ${finalOptions.method} ${endpoint}`);
    }
    return response.json();
}

export const useSiteData = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Using persistent state for parts of the site data
    const [allProducts, setAllProducts] = usePersistentState<Product[]>('allProducts', []);
    const [allCategories, setAllCategories] = usePersistentState<any[]>('allCategories', []);
    const [allStores, setAllStores] = usePersistentState<Store[]>('allStores', []);
    const [flashSales, setFlashSales] = usePersistentState<FlashSale[]>('flashSales', []);
    const [allOrders, setAllOrders] = usePersistentState<Order[]>('allOrders', []);
    const [allPromoCodes, setAllPromoCodes] = usePersistentState<PromoCode[]>('allPromoCodes', []);
    const [allPickupPoints, setAllPickupPoints] = usePersistentState<any[]>('allPickupPoints', []);
    const [allShippingPartners, setAllShippingPartners] = usePersistentState<any[]>('allShippingPartners', []);
    const [payouts, setPayouts] = usePersistentState<Payout[]>('payouts', []);
    const [siteSettings, setSiteSettings] = usePersistentState<SiteSettings | null>('siteSettings', null);
    const [siteContent, setSiteContent] = usePersistentState<SiteContent[]>('siteContent', []);
    const [allAdvertisements, setAllAdvertisements] = usePersistentState<Advertisement[]>('allAdvertisements', []);
    const [allPaymentMethods, setAllPaymentMethods] = usePersistentState<PaymentMethod[]>('allPaymentMethods', []);
    const [siteActivityLogs, setSiteActivityLogs] = usePersistentState<any[]>('siteActivityLogs', []);
    const [allNotifications, setAllNotifications] = usePersistentState<Notification[]>('allNotifications', []);
    const [allTickets, setAllTickets] = usePersistentState<Ticket[]>('allTickets', []);
    const [allAnnouncements, setAllAnnouncements] = usePersistentState<Announcement[]>('allAnnouncements', []);
    const [allZones, setAllZones] = usePersistentState<any[]>('allZones', []);
    const [allUsers, setAllUsers] = usePersistentState<User[]>('allUsers', []);
    
    const [recentlyViewedIds, setRecentlyViewedIds] = usePersistentState<string[]>('recentlyViewedIds', []);
    const [dismissedAnnouncements, setDismissedAnnouncements] = usePersistentState<string[]>('dismissedAnnouncements', []);

    const fetchData = useCallback(async () => {
        try {
            const data: SiteData = await fetchDataFromApi('/sitedata');
            setAllProducts(data.allProducts);
            setAllCategories(data.allCategories);
            setAllStores(data.allStores);
            setFlashSales(data.flashSales);
            setAllOrders(data.allOrders);
            setAllPromoCodes(data.allPromoCodes);
            setAllPickupPoints(data.allPickupPoints);
            setAllShippingPartners(data.allShippingPartners);
            setPayouts(data.payouts);
            setSiteSettings(data.siteSettings);
            setSiteContent(data.siteContent);
            setAllAdvertisements(data.allAdvertisements);
            setAllPaymentMethods(data.allPaymentMethods);
            setSiteActivityLogs(data.siteActivityLogs);
            setAllNotifications(data.allNotifications);
            setAllTickets(data.allTickets);
            setAllAnnouncements(data.allAnnouncements);
            setAllZones(data.allZones);
            setAllUsers(data.allUsers);

        } catch (e: any) {
            setError(e.message || 'An unknown error occurred while fetching site data.');
        } finally {
            setIsLoading(false);
        }
    }, [
        setAllProducts, setAllCategories, setAllStores, setFlashSales, setAllOrders,
        setAllPromoCodes, setAllPickupPoints, setAllShippingPartners, setPayouts,
        setSiteSettings, setSiteContent, setAllAdvertisements, setAllPaymentMethods,
        setSiteActivityLogs, setAllNotifications, setAllTickets, setAllAnnouncements,
        setAllZones, setAllUsers
    ]);

    useEffect(() => {
        if (!siteSettings) { // Fetch only if settings are not in localStorage
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [fetchData, siteSettings]);

    // --- Mock Handlers for PageRouter ---
    // These functions simulate backend updates by directly modifying the local state.
    
    const handleDismissAnnouncement = (id: string) => setDismissedAnnouncements(prev => [...prev, id]);
    const handleMarkNotificationAsRead = (id: string) => setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    const createNotification = (notification: Omit<Notification, 'id'>) => setAllNotifications(prev => [{ ...notification, id: `notif-${Date.now()}`, isRead: false }, ...prev]);
    
    const handleAddOrUpdateProduct = (product: Product, user: User) => {
        setAllProducts(prev => {
            const exists = prev.some(p => p.id === product.id);
            return exists ? prev.map(p => p.id === product.id ? product : p) : [...prev, product];
        });
    };
    
     const handleDeleteProduct = (productId: string, user: User) => {
        setAllProducts(prev => prev.filter(p => p.id !== productId));
    };
    
    const handleUpdateProductStatus = (productId: string, status: Product['status'], user: User) => {
        setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, status } : p));
    };

    const handleSetPromotion = (productId: string, promoPrice: number | null, startDate?: string, endDate?: string) => {
        setAllProducts(prev => prev.map(p => {
            if (p.id === productId) {
                return {
                    ...p,
                    promotionPrice: promoPrice ?? undefined,
                    promotionStartDate: startDate || undefined,
                    promotionEndDate: endDate || undefined,
                };
            }
            return p;
        }));
    };
    
    const handleConfirmOrder = (orderData: NewOrderData, user: User) => {
        const newOrder: Order = {
            ...orderData,
            id: `ORDER-${Date.now()}`,
            orderDate: new Date().toISOString(),
            status: 'confirmed',
            trackingNumber: `KZ${Date.now()}`,
            trackingHistory: [{ status: 'confirmed', date: new Date().toISOString(), location: 'Système', details: 'Commande confirmée et en attente de préparation par le vendeur.' }],
            statusChangeLog: [{ status: 'confirmed', date: new Date().toISOString(), changedBy: `Customer: ${user.name}` }]
        };
        setAllOrders(prev => [...prev, newOrder]);
        return newOrder;
    };
    
    const createStoreAndNotifyAdmin = async (storeData: any, initialProductData: any, requiredDocs: any) => {
        // This is a complex operation that should be on the backend.
        // For the frontend, we'll just update the user's role and add the store.
        console.log("Simulating store creation:", storeData, initialProductData);
        // This function is called from PageRouter but its result is used in AuthContext.
        // We will return a fake updated user and token.
        return { updatedUser: {} as User, token: 'fake-token' };
    };

    // --- Logistics Handlers ---
    const handleDriverPickup = useCallback(async (orderId: string) => {
        const { updatedOrder } = await fetchDataFromApi(`/logistics/orders/${orderId}/pickup`, { method: 'POST' });
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    }, [setAllOrders]);

    const handleConfirmDelivery = useCallback(async (orderId: string, recipientName: string) => {
        const { updatedOrder } = await fetchDataFromApi(`/logistics/orders/${orderId}/confirm-delivery`, { method: 'POST', body: JSON.stringify({ recipientName }) });
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    }, [setAllOrders]);
    
    const handleDeliveryFailure = useCallback(async (orderId: string, failureReason: Required<Order['deliveryFailureReason']>, user?: User) => {
        const { updatedOrder } = await fetchDataFromApi(`/logistics/orders/${orderId}/report-failure`, { method: 'POST', body: JSON.stringify({ failureReason }) });
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    }, [setAllOrders]);

    const handleDepotCheckIn = useCallback(async (orderId: string, location: string, user?: User) => {
        const { updatedOrder } = await fetchDataFromApi(`/logistics/orders/${orderId}/check-in`, { method: 'POST', body: JSON.stringify({ location }) });
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    }, [setAllOrders]);
    
    const handleAssignAgentToOrder = useCallback(async (orderId: string, agentId: string, user?: User, allUsers?: User[]) => {
        const { updatedOrder } = await fetchDataFromApi(`/logistics/orders/${orderId}/assign-driver`, { method: 'POST', body: JSON.stringify({ agentId }) });
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    }, [setAllOrders]);
    
    const handleUpdateSchedule = useCallback(async (depotId: string, schedule: AgentSchedule, user?: User) => {
        const { updatedDepot } = await fetchDataFromApi(`/logistics/depots/${depotId}/schedule`, { method: 'PUT', body: JSON.stringify({ schedule }) });
        setAllPickupPoints(prev => prev.map((p: PickupPoint) => p.id === depotId ? updatedDepot : p));
    }, [setAllPickupPoints]);

    const handleCancelOrder = useCallback(async (orderId: string) => {
        const { updatedOrder } = await fetchDataFromApi(`/api/orders/${orderId}/cancel`, { method: 'POST' });
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    }, [setAllOrders]);
    
    const handleRequestRefund = useCallback(async (orderId: string, reason: string, evidenceUrls: string[]) => {
        // FIX: Object literal may only specify known properties, and 'reason' does not exist in type 'BodyInit'.
        const { updatedOrder } = await fetchDataFromApi(`/api/orders/${orderId}/request-refund`, { method: 'POST', body: JSON.stringify({ reason, evidenceUrls }) });
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    }, [setAllOrders]);

    const handleCustomerDisputeMessage = useCallback(async (orderId: string, message: string) => {
        // FIX: Object literal may only specify known properties, and 'message' does not exist in type 'BodyInit'.
        const { updatedOrder } = await fetchDataFromApi(`/api/orders/${orderId}/dispute-message`, { method: 'POST', body: JSON.stringify({ message }) });
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    }, [setAllOrders]);

    const onProposeForFlashSale = useCallback(async (flashSaleId: string, productId: string, flashPrice: number) => {
        // FIX: Object literal may only specify known properties, and 'productId' does not exist in type 'BodyInit'.
        const { updatedFlashSale } = await fetchDataFromApi(`/api/seller/flash-sales/${flashSaleId}/submit-product`, { method: 'POST', body: JSON.stringify({ productId, flashPrice }) });
        setFlashSales(prev => prev.map(fs => fs.id === flashSaleId ? updatedFlashSale : fs));
    }, [setFlashSales]);
    
    const onCreatePromoCode = useCallback(async (codeData: Omit<PromoCode, 'uses'>) => {
        // FIX: Type 'Omit<PromoCode, "uses">' is not assignable to type 'BodyInit'.
        const { newPromoCode } = await fetchDataFromApi('/api/seller/promo-codes', { method: 'POST', body: JSON.stringify(codeData) });
        setAllPromoCodes(prev => [...prev, newPromoCode]);
    }, [setAllPromoCodes]);
    
    const onDeletePromoCode = useCallback(async (code: string) => {
        await fetchDataFromApi(`/api/seller/promo-codes/${code}`, { method: 'DELETE' });
        setAllPromoCodes(prev => prev.filter(pc => pc.code !== code));
    }, [setAllPromoCodes]);

    const onReplyToReview = useCallback(async (productId: string, reviewIdentifier: { author: string, date: string }, replyText: string) => {
        // FIX: Object literal may only specify known properties, and 'reviewIdentifier' does not exist in type 'BodyInit'.
        const { updatedProduct } = await fetchDataFromApi(`/api/seller/products/${productId}/reviews/reply`, { method: 'POST', body: JSON.stringify({ reviewIdentifier, replyText }) });
        setAllProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    }, [setAllProducts]);
    
    const onUploadDocument = useCallback(async (storeId: string, documentName: string, fileUrl: string) => {
        // FIX: Object literal may only specify known properties, and 'documentName' does not exist in type 'BodyInit'.
        const { updatedStore } = await fetchDataFromApi('/api/seller/documents', { method: 'POST', body: JSON.stringify({ documentName, fileUrl }) });
        setAllStores(prev => prev.map(s => s.id === storeId ? updatedStore : s));
    }, [setAllStores]);
    
    const onRequestUpgrade = useCallback(async (storeId: string, level: 'premium' | 'super_premium') => {
        // FIX: Object literal may only specify known properties, and 'level' does not exist in type 'BodyInit'.
        const { updatedStore } = await fetchDataFromApi('/api/seller/upgrade-subscription', { method: 'POST', body: JSON.stringify({ level }) });
        setAllStores(prev => prev.map(s => s.id === storeId ? updatedStore : s));
    }, [setAllStores]);

    // Placeholder functions for other operations
    const handleCreateTicket = () => console.log('handleCreateTicket called');
    const handleUserReplyToTicket = () => console.log('handleUserReplyToTicket called');
    const handleSellerUpdateOrderStatus = () => console.log('handleSellerUpdateOrderStatus called');
    const handleSellerCancelOrder = () => console.log('handleSellerCancelOrder called');
    const handleCreateOrUpdateCollection = () => console.log('handleCreateOrUpdateCollection called');
    const handleDeleteCollection = () => console.log('handleDeleteCollection called');
    const handleUpdateStoreProfile = () => console.log('handleUpdateStoreProfile called');
    const handleAddProductToStory = () => console.log('handleAddProductToStory called');
    const handleAddStory = () => console.log('handleAddStory called');
    

    return {
        isLoading,
        error,
        allProducts, setAllProducts,
        allCategories, setAllCategories,
        allStores, setAllStores,
        flashSales, setFlashSales,
        allOrders, setAllOrders,
        allPromoCodes, setAllPromoCodes,
        allPickupPoints, setAllPickupPoints,
        allShippingPartners, setAllShippingPartners,
        payouts, setPayouts,
        siteSettings, setSiteSettings,
        siteContent, setSiteContent,
        allAdvertisements, setAllAdvertisements,
        allPaymentMethods, setAllPaymentMethods,
        siteActivityLogs, setSiteActivityLogs,
        allNotifications, setAllNotifications,
        allTickets, setAllTickets,
        allAnnouncements, setAllAnnouncements,
        allUsers, setAllUsers,
        allZones, setAllZones,
        recentlyViewedIds, setRecentlyViewedIds,
        dismissedAnnouncements,
        handleDismissAnnouncement,
        handleMarkNotificationAsRead,
        createNotification,
        handleAddOrUpdateProduct,
        handleDeleteProduct,
        handleUpdateProductStatus,
        handleSetPromotion,
        handleConfirmOrder,
        createStoreAndNotifyAdmin,
        // Logistics
        handleDriverPickup,
        handleConfirmDelivery,
        handleDeliveryFailure,
        handleDepotCheckIn,
        handleAssignAgentToOrder,
        handleUpdateSchedule,
        // Stubs for other handlers
        handleCreateTicket,
        handleUserReplyToTicket,
        handleSellerUpdateOrderStatus,
        handleSellerCancelOrder,
        handleCreateOrUpdateCollection,
        handleDeleteCollection,
        handleUpdateStoreProfile,
        handleAddProductToStory,
        handleAddStory,
        handleCancelOrder,
        handleRequestRefund,
        handleCustomerDisputeMessage,
        onProposeForFlashSale,
        onCreatePromoCode,
        onDeletePromoCode,
        onReplyToReview,
        onUploadDocument,
        onRequestUpgrade,
    };
};