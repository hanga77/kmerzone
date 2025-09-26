import { useState, useCallback } from 'react';
import { usePersistentState } from './usePersistentState';
import type { 
    Product, Category, Store, FlashSale, Order, SiteSettings, SiteContent, Advertisement, 
    PaymentMethod, SiteActivityLog, PickupPoint, Payout, PromoCode, OrderStatus, 
    NewOrderData, Review, User, DocumentStatus, Warning, Story, ProductCollection, 
    Notification, Ticket, Announcement, ShippingPartner, ShippingSettings, UserRole, TrackingEvent, Zone 
} from '../types';
import { 
    initialCategories, initialProducts, initialStores, initialFlashSales, initialPickupPoints, 
    initialSiteSettings, initialSiteContent, initialAdvertisements, initialPaymentMethods, 
    initialShippingPartners, sampleDeliveredOrder, sampleDeliveredOrder2, sampleDeliveredOrder3, sampleNewMissionOrder,
    initialSiteActivityLogs, initialZones
} from '../constants';

export const useSiteData = () => {
    const [allProducts, setAllProducts] = usePersistentState<Product[]>('allProducts', initialProducts);
    const [allCategories, setAllCategories] = usePersistentState<Category[]>('allCategories', initialCategories);
    const [allStores, setAllStores] = usePersistentState<Store[]>('allStores', initialStores);
    const [allOrders, setAllOrders] = usePersistentState<Order[]>('allOrders', [sampleDeliveredOrder, sampleDeliveredOrder2, sampleDeliveredOrder3, sampleNewMissionOrder]);
    const [flashSales, setFlashSales] = usePersistentState<FlashSale[]>('allFlashSales', initialFlashSales);
    const [allPickupPoints, setAllPickupPoints] = usePersistentState<PickupPoint[]>('allPickupPoints', initialPickupPoints);
    const [siteSettings, setSiteSettings] = usePersistentState<SiteSettings>('siteSettings', initialSiteSettings);
    const [siteContent, setSiteContent] = usePersistentState<SiteContent[]>('siteContent', initialSiteContent);
    const [allAdvertisements, setAllAdvertisements] = usePersistentState<Advertisement[]>('allAdvertisements', initialAdvertisements);
    const [allPaymentMethods, setAllPaymentMethods] = usePersistentState<PaymentMethod[]>('allPaymentMethods', initialPaymentMethods);
    const [allShippingPartners, setAllShippingPartners] = usePersistentState<ShippingPartner[]>('allShippingPartners', initialShippingPartners);
    const [siteActivityLogs, setSiteActivityLogs] = usePersistentState<SiteActivityLog[]>('siteActivityLogs', initialSiteActivityLogs);
    const [payouts, setPayouts] = usePersistentState<Payout[]>('payouts', []);
    const [allPromoCodes, setAllPromoCodes] = usePersistentState<PromoCode[]>('allPromoCodes', []);
    const [allNotifications, setAllNotifications] = usePersistentState<Notification[]>('allNotifications', []);
    const [allTickets, setAllTickets] = usePersistentState<Ticket[]>('allTickets', []);
    const [allAnnouncements, setAllAnnouncements] = usePersistentState<Announcement[]>('allAnnouncements', []);
    const [dismissedAnnouncements, setDismissedAnnouncements] = usePersistentState<string[]>('dismissedAnnouncements', []);
    const [recentlyViewedIds, setRecentlyViewedIds] = usePersistentState<string[]>('recentlyViewed', []);
    const [allZones, setAllZones] = usePersistentState<Zone[]>('allZones', initialZones);

    const logActivity = useCallback((user: User, action: string, details: string) => {
        const newLog: SiteActivityLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: { id: user.id, name: user.name, role: user.role },
            action,
            details,
        };
        setSiteActivityLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
    }, [setSiteActivityLogs]);

    const handleAdminUpdateUser = useCallback((userId: string, updates: Partial<User>, allUsers: User[]) => {
        let oldUser: User | undefined;
        const userToUpdate = allUsers.find(u => u.id === userId);
        if(userToUpdate) {
            oldUser = {...userToUpdate};
        }

        const updatedUsers = allUsers.map(u => (u.id === userId ? { ...u, ...updates } : u));
        
        const newRole = updates.role;
        const newDepotId = updates.depotId;

        if (oldUser) {
             // Case 1: User is assigned as a new manager
            if (newRole === 'depot_manager' && newDepotId) {
                setAllPickupPoints((prevPoints: PickupPoint[]) => prevPoints.map(p => {
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
                setAllPickupPoints((prevPoints: PickupPoint[]) => prevPoints.map(p => 
                    p.id === oldUser.depotId ? { ...p, managerId: undefined } : p
                ));
            }
        }
        return updatedUsers;
    }, [setAllPickupPoints]);


    const handleDismissAnnouncement = useCallback((id: string) => {
        setDismissedAnnouncements(prev => [...prev, id]);
    }, [setDismissedAnnouncements]);

    const handleSetPromotion = useCallback((productId: string, promoPrice: number, startDate?: string, endDate?: string) => {
        setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, promotionPrice: promoPrice, promotionStartDate: startDate, promotionEndDate: endDate } : p));
    }, [setAllProducts]);
    
    const handleConfirmOrder = useCallback((orderData: NewOrderData, user: User) => {
        const newOrder: Order = {
            ...orderData,
            id: `ORDER-${Date.now()}`,
            orderDate: new Date().toISOString(),
            status: 'confirmed',
            trackingNumber: `KZ${Date.now()}`,
            trackingHistory: [{
                status: 'confirmed',
                date: new Date().toISOString(),
                location: 'Système',
                details: 'Commande confirmée et transmise au vendeur.'
            }],
        };
        setAllOrders(prev => [...prev, newOrder]);
        logActivity(user, 'ORDER_PLACED', `Nouvelle commande: ${newOrder.id} pour un total de ${newOrder.total} FCFA.`);
    }, [setAllOrders, logActivity]);
    
    const handleMarkNotificationAsRead = useCallback((notificationId: string) => {
        setAllNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    }, [setAllNotifications]);
    
    const handlePayoutSeller = useCallback((storeId: string, amount: number, user: User) => {
        const storeName = allStores.find(s => s.id === storeId)?.name || 'Inconnu';
        const newPayout: Payout = {
            storeId,
            amount,
            date: new Date().toISOString(),
        };
        setPayouts(prev => [...prev, newPayout]);
        logActivity(user, 'PAYOUT_PROCESSED', `Paiement de ${amount.toLocaleString('fr-CM')} FCFA effectué pour la boutique ${storeName} (${storeId}).`);
    }, [setPayouts, logActivity, allStores]);

    const handleAddAdvertisement = useCallback((data: Omit<Advertisement, 'id'>, user: User) => {
        const newAd: Advertisement = { ...data, id: `ad-${Date.now()}`};
        setAllAdvertisements(prev => [...prev, newAd]);
        logActivity(user, 'AD_CREATED', `Publicité créée: ${newAd.linkUrl}`);
    }, [setAllAdvertisements, logActivity]);
    
    const handleUpdateAdvertisement = useCallback((id: string, data: Partial<Omit<Advertisement, 'id'>>, user: User) => {
        setAllAdvertisements(prev => prev.map(ad => ad.id === id ? {...ad, ...data} : ad));
        logActivity(user, 'AD_UPDATED', `Publicité modifiée: ${id}`);
    }, [setAllAdvertisements, logActivity]);

    const handleDeleteAdvertisement = useCallback((id: string, user: User) => {
        setAllAdvertisements(prev => prev.filter(ad => ad.id !== id));
        logActivity(user, 'AD_DELETED', `Publicité supprimée: ${id}`);
    }, [setAllAdvertisements, logActivity]);

    const handleAssignAgentToOrder = useCallback((orderId: string, agentId: string, user: User, allUsers: User[]) => {
        setAllOrders(prevOrders => prevOrders.map(o => {
            if (o.id === orderId) {
                const agentName = allUsers.find(u => u.id === agentId)?.name || 'Inconnu';
                const newTrackingHistory: TrackingEvent = {
                    status: 'out-for-delivery',
                    date: new Date().toISOString(),
                    location: `Dépôt (Agent: ${user.name})`,
                    details: `Colis assigné au livreur ${agentName} (ID: ${agentId})`
                };
                return {
                    ...o,
                    status: 'out-for-delivery',
                    agentId: agentId,
                    trackingHistory: [...(o.trackingHistory || []), newTrackingHistory],
                    departureProcessedByAgentId: user.id,
                    processedForDepartureAt: new Date().toISOString(),
                };
            }
            return o;
        }));
        logActivity(user, 'ORDER_ASSIGNED_TO_AGENT', `Commande ${orderId} assignée au livreur ${agentId}.`);
    }, [setAllOrders, logActivity]);

    const handleSendBulkEmail = useCallback((recipientIds: string[], subject: string, body: string, currentUser: User) => {
        // This is a simulation. In a real app, this would trigger a backend service.
        logActivity(currentUser, 'BULK_EMAIL_SENT', `E-mail envoyé à ${recipientIds.length} utilisateur(s) avec le sujet : "${subject}".`);
        // We could also create notifications for each user here.
    }, [logActivity]);

    return {
        allProducts, setAllProducts,
        allCategories, setAllCategories,
        allStores, setAllStores,
        allOrders, setAllOrders,
        flashSales, setFlashSales,
        allPickupPoints, setAllPickupPoints,
        siteSettings, setSiteSettings,
        siteContent, setSiteContent,
        allAdvertisements, setAllAdvertisements,
        allPaymentMethods, setAllPaymentMethods,
        allShippingPartners, setAllShippingPartners,
        siteActivityLogs, setSiteActivityLogs,
        payouts, setPayouts,
        allPromoCodes, setAllPromoCodes,
        allNotifications, setAllNotifications,
        allTickets, setAllTickets,
        allAnnouncements, setAllAnnouncements,
        dismissedAnnouncements, setDismissedAnnouncements,
        recentlyViewedIds, setRecentlyViewedIds,
        allZones, setAllZones,
        handleAdminUpdateUser,
        handleDismissAnnouncement,
        handleSetPromotion,
        handleConfirmOrder,
        handleMarkNotificationAsRead,
        handlePayoutSeller,
        handleAddAdvertisement,
        handleUpdateAdvertisement,
        handleDeleteAdvertisement,
        handleAssignAgentToOrder,
        handleSendBulkEmail,
        logActivity,
    };
};
