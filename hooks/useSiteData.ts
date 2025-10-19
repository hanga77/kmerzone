import React, { useState, useCallback, useEffect } from 'react';
import { usePersistentState } from './usePersistentState';
import { useAuth } from './AuthContext';
import type { SiteData, Product, Category, Store, FlashSale, Order, NewOrderData, SiteSettings, User, SiteContent, Advertisement, PaymentMethod, PickupPoint, Zone, EmailTemplate, Ticket, UserRole, DocumentStatus, PromoCode, Warning, ProductCollection, UserAvailabilityStatus, PaymentDetails, AgentSchedule, Payout, ShippingPartner, Notification } from '../types';

async function makeApiRequest(url: string, method: string = 'GET', body?: any) {
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const token = localStorage.getItem('authToken');
    if (token) {
        (options.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        // Try to parse error message, but fallback if it's not JSON
        try {
            const errorData = await response.json();
            throw new Error(errorData.message || `API Error on ${method} ${url}`);
        } catch (e) {
             throw new Error(`API Error: ${response.status} ${response.statusText} on ${method} ${url}`);
        }
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        const text = await response.text();
        throw new Error(`Expected JSON response, but got ${contentType}. Response body: ${text}`);
    }
}

const defaultSiteSettings: SiteSettings = {
  logoUrl: '',
  bannerUrl: '',
  companyName: "KMER ZONE",
  isStoriesEnabled: true,
  requiredSellerDocuments: {},
  isRentEnabled: false,
  rentAmount: 0,
  canSellersCreateCategories: false,
  commissionRate: 8,
  standardPlan: {} as any,
  premiumPlan: {} as any,
  superPremiumPlan: {} as any,
  customerLoyaltyProgram: {} as any,
  deliverySettings: {} as any,
  maintenanceMode: { isEnabled: false, message: '', reopenDate: '' },
  seo: { metaTitle: '', metaDescription: '', ogImageUrl: '' },
  socialLinks: { facebook: { linkUrl: '#', iconUrl: '' }, twitter: { linkUrl: '#', iconUrl: '' }, instagram: { linkUrl: '#', iconUrl: '' } },
  isChatEnabled: true,
  isComparisonEnabled: true,
};

export const useSiteData = () => {
    const { user } = useAuth();
    const [data, setData] = useState<SiteData>({
        allProducts: [], allCategories: [], allStores: [], flashSales: [], allOrders: [], allPromoCodes: [], allPickupPoints: [], allShippingPartners: [], payouts: [],
        siteSettings: defaultSiteSettings,
        siteContent: [], allAdvertisements: [], allPaymentMethods: [], siteActivityLogs: [], allNotifications: [], allTickets: [], allAnnouncements: [], allZones: [], allUsers: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentlyViewedIds, setRecentlyViewedIds] = usePersistentState<string[]>('recentlyViewed', []);
    const [dismissedAnnouncements, setDismissedAnnouncements] = usePersistentState<string[]>('dismissedAnnouncements', []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                const initialData = await makeApiRequest('/api/all-data');
                setData(prev => ({...prev, ...initialData}));
                setError(null);
            } catch (error: any) {
                console.error("Failed to fetch initial site data:", error);
                setError("Impossible de charger les données du site. Le serveur backend est peut-être inaccessible ou une erreur de base de données est survenue. Assurez-vous que le backend est en cours d'exécution et connecté à la base de données. Erreur: " + error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);
    
    const setAllUsers = (updater: React.SetStateAction<User[]>) => {
        setData(prev => {
            const newAllUsers = typeof updater === 'function' ? updater(prev.allUsers) : updater;
            return { ...prev, allUsers: newAllUsers };
        });
    };

    const createActivityLog = useCallback((actingUser: User | null, action: string, details: string) => {
        if (!actingUser) return;
        const newLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: { id: actingUser.id, name: actingUser.name, role: actingUser.role },
            action,
            details,
        };
        setData(prev => ({
            ...prev,
            siteActivityLogs: [newLog, ...prev.siteActivityLogs]
        }));
    }, []);

    const handleConfirmOrder = useCallback(async (orderData: NewOrderData) => {
        // This would be an API call in a real app
    }, []);
    
    const handleAddOrUpdateProduct = useCallback(async (product: Product) => {
        // This would be an API call in a real app
    }, []);

    const stubs = {
        handleApproveStore: (store: Store) => {
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === store.id ? {...s, status: 'active'} : s)}));
            if(user) createActivityLog(user, "Approve Store", `Approved store: ${store.name}`);
        },
        handleRejectStore: (store: Store) => {
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === store.id ? {...s, status: 'rejected'} : s)}));
            if(user) createActivityLog(user, "Reject Store", `Rejected store: ${store.name}`);
        },
        handleToggleStoreStatus: (storeId: string, currentStatus: 'active' | 'suspended') => {
            const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === storeId ? {...s, status: newStatus} : s)}));
            if(user) createActivityLog(user, "Toggle Store Status", `Changed store ${storeId} to ${newStatus}`);
        },
        handleWarnStore: (storeId: string, reason: string) => {
            const newWarning: Warning = { id: `warn-${Date.now()}`, date: new Date().toISOString(), reason };
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === storeId ? {...s, warnings: [...s.warnings, newWarning]} : s)}));
            if(user) createActivityLog(user, "Warn Store", `Warned store ${storeId} for: ${reason}`);
        },
        handleUpdateDocumentStatus: (storeId: string, documentName: string, status: DocumentStatus, reason = '') => {
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === storeId ? {...s, documents: s.documents.map(d => d.name === documentName ? {...d, status, rejectionReason: reason} : d)} : s)}));
            if(user) createActivityLog(user, "Update Document Status", `Set document ${documentName} for store ${storeId} to ${status}`);
        },
        handleToggleStoreCertification: (storeId: string) => {
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === storeId ? {...s, isCertified: !s.isCertified} : s)}));
            if(user) createActivityLog(user, "Toggle Certification", `Toggled certification for store ${storeId}`);
        },
        handleDismissAnnouncement: (id: string) => setDismissedAnnouncements(prev => [...prev, id]),
        handleMarkNotificationAsRead: (id: string) => setData(prev => ({...prev, allNotifications: prev.allNotifications.map(n => n.id === id ? {...n, isRead: true} : n)})),
        handleSetPromotion: (productId: string, promoPrice: number | null, startDate?: string, endDate?: string) => console.log('handleSetPromotion', productId, promoPrice),
        createNotification: (notif: any) => console.log('createNotification', notif),
        createStoreAndNotifyAdmin: (storeData: any, user: User, allUsers: User[], initialProductData?: any) => { console.log("createStoreAndNotifyAdmin called"); return { id: `store-${Date.now()}`, ...storeData }; },
        handleDeleteProduct: (productId: string, user: User) => console.log('handleDeleteProduct', productId, user),
        handleUpdateProductStatus: (productId: string, status: Product['status'], user: User) => console.log('handleUpdateProductStatus', productId, status, user),
        handleCancelOrder: (orderId: string, user: User) => console.log('handleCancelOrder', orderId, user),
        handleRequestRefund: (orderId: string, reason: string, evidenceUrls: string[], user: User) => console.log('handleRequestRefund', orderId, user),
        handleCustomerDisputeMessage: (orderId: string, message: string, user: User) => console.log('handleCustomerDisputeMessage', orderId, user),
        handleCreateTicket: (subject: string, message: string, orderId: string | undefined, type: 'support' | 'service_request' | undefined, attachments: string[] | undefined, user: User, allUsers: User[]) => console.log('handleCreateTicket'),
        handleUserReplyToTicket: (ticketId: string, message: string, attachments: string[] | undefined, user: User, allUsers: User[]) => console.log('handleUserReplyToTicket'),
        handleSellerUpdateOrderStatus: (orderId: string, status: Order['status'], user: User) => console.log('handleSellerUpdateOrderStatus', orderId, status),
        handleSellerCancelOrder: (orderId: string, user: User) => console.log('handleSellerCancelOrder', orderId),
        handleCreateOrUpdateCollection: (storeId: string, collection: ProductCollection, user: User) => console.log('handleCreateOrUpdateCollection', storeId),
        handleDeleteCollection: (storeId: string, collectionId: string, user: User) => console.log('handleDeleteCollection', storeId, collectionId),
        handleUpdateStoreProfile: (storeId: string, data: Partial<Store>, user: User) => console.log('handleUpdateStoreProfile', storeId),
        handleAddProductToStory: (productId: string, user: User) => console.log('handleAddProductToStory', productId),
        handleAddStory: (imageUrl: string, user: User) => console.log('handleAddStory', imageUrl),
    };

    return {
        ...data,
        isLoading,
        error,
        recentlyViewedIds,
        setRecentlyViewedIds,
        dismissedAnnouncements,
        handleConfirmOrder,
        handleAddOrUpdateProduct,
        setAllUsers,
        onApproveStore: stubs.handleApproveStore,
        onRejectStore: stubs.handleRejectStore,
        onToggleStoreStatus: stubs.handleToggleStoreStatus,
        onWarnStore: stubs.handleWarnStore,
        onUpdateDocumentStatus: stubs.handleUpdateDocumentStatus,
        onToggleStoreCertification: stubs.handleToggleStoreCertification,
        handleDismissAnnouncement: stubs.handleDismissAnnouncement,
        handleMarkNotificationAsRead: stubs.handleMarkNotificationAsRead,
        handleSetPromotion: stubs.handleSetPromotion,
        createNotification: stubs.createNotification,
        createStoreAndNotifyAdmin: stubs.createStoreAndNotifyAdmin,
        handleDeleteProduct: stubs.handleDeleteProduct,
        handleUpdateProductStatus: stubs.handleUpdateProductStatus,
        handleCancelOrder: stubs.handleCancelOrder,
        handleRequestRefund: stubs.handleRequestRefund,
        handleCustomerDisputeMessage: stubs.handleCustomerDisputeMessage,
        handleCreateTicket: stubs.handleCreateTicket,
        handleUserReplyToTicket: stubs.handleUserReplyToTicket,
        handleSellerUpdateOrderStatus: stubs.handleSellerUpdateOrderStatus,
        handleSellerCancelOrder: stubs.handleSellerCancelOrder,
        handleCreateOrUpdateCollection: stubs.handleCreateOrUpdateCollection,
        handleDeleteCollection: stubs.handleDeleteCollection,
        handleUpdateStoreProfile: stubs.handleUpdateStoreProfile,
        handleAddProductToStory: stubs.handleAddProductToStory,
        handleAddStory: stubs.handleAddStory,
    };
};