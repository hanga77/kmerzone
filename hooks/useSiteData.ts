import { useState, useCallback } from 'react';
import { usePersistentState } from './usePersistentState';
import type { 
    Product, Category, Store, FlashSale, Order, SiteSettings, SiteContent, Advertisement, 
    PaymentMethod, SiteActivityLog, PickupPoint, Payout, PromoCode, OrderStatus, 
    NewOrderData, Review, User, DocumentStatus, Warning, Story, ProductCollection, 
    Notification, Ticket, Announcement, ShippingPartner, ShippingSettings, UserRole 
} from '../types';
import { 
    initialCategories, initialProducts, initialStores, initialFlashSales, initialPickupPoints, 
    initialSiteSettings, initialSiteContent, initialAdvertisements, initialPaymentMethods, 
    initialShippingPartners, sampleDeliveredOrder, sampleDeliveredOrder2, sampleDeliveredOrder3, sampleNewMissionOrder,
    initialSiteActivityLogs
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
        handleDismissAnnouncement,
        handleSetPromotion,
        handleConfirmOrder,
        handleMarkNotificationAsRead,
        handlePayoutSeller,
        handleAddAdvertisement,
        handleUpdateAdvertisement,
        handleDeleteAdvertisement,
        logActivity,
    };
};