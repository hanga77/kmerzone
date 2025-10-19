
import React, { useState, useCallback, useEffect } from 'react';
import { usePersistentState } from './usePersistentState';
import { useAuth } from '../contexts/AuthContext';
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

    const handleApproveStore = async (store: Store) => {
        try {
            await makeApiRequest(`/api/admin/stores/${store.id}/approve`, 'POST');
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === store.id ? {...s, status: 'active'} : s)}));
            if(user) createActivityLog(user, "Approve Store", `Approved store: ${store.name}`);
        } catch (error) {
            console.error("Failed to approve store:", error);
            alert("Échec de l'approbation du magasin.");
        }
    };
    const handleRejectStore = async (store: Store) => {
        try {
            await makeApiRequest(`/api/admin/stores/${store.id}/reject`, 'POST');
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === store.id ? {...s, status: 'rejected'} : s)}));
            if(user) createActivityLog(user, "Reject Store", `Rejected store: ${store.name}`);
        } catch (error) {
            console.error("Failed to reject store:", error);
            alert("Échec du rejet du magasin.");
        }
    };
    const handleToggleStoreStatus = async (storeId: string, currentStatus: 'active' | 'suspended') => {
        try {
            const { status } = await makeApiRequest(`/api/admin/stores/${storeId}/toggle-status`, 'POST');
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === storeId ? {...s, status } : s)}));
            if(user) createActivityLog(user, "Toggle Store Status", `Changed store ${storeId} to ${status}`);
        } catch (error) {
            console.error("Failed to toggle store status:", error);
            alert("Échec du changement de statut du magasin.");
        }
    };
    const handleWarnStore = async (storeId: string, reason: string) => {
        try {
            const { newWarning } = await makeApiRequest(`/api/admin/stores/${storeId}/warn`, 'POST', { reason });
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === storeId ? {...s, warnings: [...(s.warnings || []), newWarning]} : s)}));
            if(user) createActivityLog(user, "Warn Store", `Warned store ${storeId} for: ${reason}`);
        } catch (error) {
            console.error("Failed to warn store:", error);
            alert("Échec de l'avertissement du magasin.");
        }
    };
    const handleUpdateDocumentStatus = async (storeId: string, documentName: string, status: DocumentStatus, reason = '') => {
        try {
            await makeApiRequest(`/api/admin/stores/${storeId}/documents`, 'PUT', { documentName, status, reason });
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === storeId ? {...s, documents: s.documents.map(d => d.name === documentName ? {...d, status, rejectionReason: reason || undefined} : d)} : s)}));
            if(user) createActivityLog(user, "Update Document Status", `Set document ${documentName} for store ${storeId} to ${status}`);
        } catch (error) {
            console.error("Failed to update document status:", error);
            alert("Échec de la mise à jour du statut du document.");
        }
    };
    const handleToggleStoreCertification = async (storeId: string) => {
        try {
            const { isCertified } = await makeApiRequest(`/api/admin/stores/${storeId}/toggle-certification`, 'POST');
            setData(prev => ({...prev, allStores: prev.allStores.map(s => s.id === storeId ? {...s, isCertified } : s)}));
            if(user) createActivityLog(user, "Toggle Certification", `Toggled certification for store ${storeId}`);
        } catch (error) {
            console.error("Failed to toggle certification:", error);
            alert("Échec du changement de certification.");
        }
    };

    const onUpdateUser = async (userId: string, updates: Partial<User>) => {
        try {
            const updatedUser = await makeApiRequest(`/api/admin/users/${userId}`, 'PATCH', updates);
            setData(prev => ({...prev, allUsers: prev.allUsers.map(u => u.id === userId ? { ...updatedUser, id: userId } : u) }));
            if (user) createActivityLog(user, "Update User", `Updated user profile for ${updatedUser.name}`);
        } catch (error) {
            console.error("Failed to update user:", error);
            alert("Failed to update user.");
        }
    };
    
    const onCreateUserByAdmin = async (data: { name: string, email: string, role: UserRole }) => {
        try {
            const { newUser } = await makeApiRequest('/api/admin/users', 'POST', data);
            setData(prev => ({ ...prev, allUsers: [...prev.allUsers, newUser] }));
            if (user) createActivityLog(user, "Create User", `Created new user: ${data.name} (${data.role})`);
        } catch (error) {
            console.error("Failed to create user:", error);
            alert("Échec de la création de l'utilisateur.");
        }
    };

    const stubs = {
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
        onApproveStore: handleApproveStore,
        onRejectStore: handleRejectStore,
        onToggleStoreStatus: handleToggleStoreStatus,
        onWarnStore: handleWarnStore,
        onUpdateDocumentStatus: handleUpdateDocumentStatus,
        onToggleStoreCertification: handleToggleStoreCertification,
        onUpdateUser,
        onCreateUserByAdmin,
        ...stubs,
    };
};
