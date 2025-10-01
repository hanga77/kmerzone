import { useState, useCallback } from 'react';
import { usePersistentState } from './usePersistentState';
import type { 
    Product, Category, Store, FlashSale, Order, SiteSettings, SiteContent, Advertisement, 
    PaymentMethod, SiteActivityLog, PickupPoint, Payout, PromoCode, OrderStatus, 
    NewOrderData, Review, User, DocumentStatus, Warning, Story, ProductCollection, 
    Notification, Ticket, Announcement, ShippingPartner, ShippingSettings, UserRole, TrackingEvent, Zone, TicketStatus, UserAvailabilityStatus, AgentSchedule 
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
    
    const handleConfirmOrder = useCallback((orderData: NewOrderData, user: User): Order => {
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
        return newOrder;
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
                    storageLocationId: undefined, // Libère l'emplacement de stockage (check-out)
                };
            }
            return o;
        }));
        logActivity(user, 'ORDER_ASSIGNED_TO_AGENT', `Commande ${orderId} assignée au livreur ${agentId}.`);
    }, [setAllOrders, logActivity]);
    
    const handleUpdateDeliveryStatus = useCallback((orderId: string, status: OrderStatus, user: User, details?: { signature?: string; failureReason?: Order['deliveryFailureReason'] }) => {
        setAllOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const newTrackingEvent: TrackingEvent = {
                    status,
                    date: new Date().toISOString(),
                    location: user.name,
                    details: status === 'delivered'
                        ? `Livré à ${details?.signature}.`
                        : `Échec de livraison : ${details?.failureReason?.reason} - ${details?.failureReason?.details}.`
                };

                const updatedOrder: Order = {
                    ...o,
                    status,
                    trackingHistory: [...(o.trackingHistory || []), newTrackingEvent],
                };

                if (status === 'delivered' && details?.signature) {
                    updatedOrder.signatureUrl = details.signature;
                    updatedOrder.proofOfDeliveryUrl = "Signature captured";
                }

                if (status === 'delivery-failed' && details?.failureReason) {
                    updatedOrder.deliveryFailureReason = { ...details.failureReason, date: new Date().toISOString() };
                }

                return updatedOrder;
            }
            return o;
        }));
        logActivity(user, 'DELIVERY_STATUS_UPDATE', `Statut de la commande ${orderId} changé à ${status}.`);
    }, [setAllOrders, logActivity]);

    const handleSendBulkEmail = useCallback((recipientIds: string[], subject: string, body: string, currentUser: User) => {
        logActivity(currentUser, 'BULK_EMAIL_SENT', `E-mail envoyé à ${recipientIds.length} utilisateur(s) avec le sujet : "${subject}".`);
    }, [logActivity]);

    const handleApproveStore = useCallback((storeToApprove: Store, user: User) => {
        setAllStores(prev => prev.map(s => s.id === storeToApprove.id ? { ...s, status: 'active' } : s));
        logActivity(user, 'STORE_APPROVED', `Boutique approuvée : ${storeToApprove.name} (ID: ${storeToApprove.id})`);
    }, [setAllStores, logActivity]);

    const handleRejectStore = useCallback((storeToReject: Store, user: User) => {
        setAllStores(prev => prev.filter(s => s.id !== storeToReject.id));
        logActivity(user, 'STORE_REJECTED', `Boutique rejetée et supprimée : ${storeToReject.name} (ID: ${storeToReject.id})`);
    }, [setAllStores, logActivity]);

    const handleToggleStoreStatus = useCallback((storeId: string, currentStatus: 'active' | 'suspended', user: User) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        let storeName = '';
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                storeName = s.name;
                return { ...s, status: newStatus };
            }
            return s;
        }));
        logActivity(user, 'STORE_STATUS_TOGGLED', `Statut de la boutique ${storeName} (ID: ${storeId}) changé à ${newStatus}.`);
    }, [setAllStores, logActivity]);

    const handleWarnStore = useCallback((storeId: string, reason: string, user: User) => {
        const newWarning: Warning = {
            id: `warn-${Date.now()}`,
            date: new Date().toISOString(),
            reason,
        };
        let storeName = '';
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                storeName = s.name;
                return { ...s, warnings: [...(s.warnings || []), newWarning] };
            }
            return s;
        }));
        logActivity(user, 'STORE_WARNED', `Avertissement envoyé à la boutique ${storeName} (ID: ${storeId}). Motif : ${reason}`);
    }, [setAllStores, logActivity]);
    
    // Admin Actions
    const handleAdminAddCategory = useCallback((name: string, parentId: string | undefined, user: User) => {
        const newCategory: Category = { id: `cat-${Date.now()}`, name, parentId, imageUrl: 'https://via.placeholder.com/300' };
        setAllCategories(prev => [...prev, newCategory]);
        logActivity(user, 'CATALOG_UPDATE', `Catégorie créée : "${name}"`);
    }, [setAllCategories, logActivity]);
    
    const handleAdminDeleteCategory = useCallback((categoryId: string, user: User) => {
        setAllCategories(prev => prev.filter(c => c.id !== categoryId && c.parentId !== categoryId));
        logActivity(user, 'CATALOG_UPDATE', `Catégorie supprimée : ID ${categoryId}`);
    }, [setAllCategories, logActivity]);

    const handleAdminUpdateCategory = useCallback((categoryId: string, updates: Partial<Omit<Category, 'id'>>, user: User) => {
        setAllCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updates } : c));
        logActivity(user, 'CATALOG_UPDATE', `Catégorie modifiée : "${updates.name}" (ID: ${categoryId})`);
    }, [setAllCategories, logActivity]);
    
    const handleUpdateDocumentStatus = useCallback((storeId: string, documentName: string, status: DocumentStatus, rejectionReason: string | undefined, user: User) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                return { ...s, documents: s.documents.map(d => d.name === documentName ? { ...d, status, rejectionReason } : d) };
            }
            return s;
        }));
        logActivity(user, 'STORE_DOCUMENT_MODERATED', `Document "${documentName}" pour la boutique ${storeId} modéré à ${status}.`);
    }, [setAllStores, logActivity]);

    const handleResolveDispute = useCallback((orderId: string, resolution: 'refunded' | 'rejected', user: User) => {
        const newStatus = resolution === 'refunded' ? 'refunded' : 'delivered'; // Rejecting returns it to delivered status for now
        setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        logActivity(user, 'ORDER_DISPUTE_RESOLVED', `Litige pour la commande ${orderId} résolu. Résolution : ${resolution}.`);
    }, [setAllOrders, logActivity]);

    const handleSaveFlashSale = useCallback((saleData: Omit<FlashSale, 'id' | 'products'>, user: User) => {
        const newSale: FlashSale = { ...saleData, id: `fs-${Date.now()}`, products: [] };
        setFlashSales(prev => [...prev, newSale]);
        logActivity(user, 'MARKETING_UPDATE', `Vente flash créée : "${saleData.name}"`);
    }, [setFlashSales, logActivity]);
    
    const handleUpdateFlashSaleSubmissionStatus = useCallback((flashSaleId: string, productId: string, status: 'approved' | 'rejected', user: User) => {
        setFlashSales(prev => prev.map(fs => fs.id === flashSaleId ? { ...fs, products: fs.products.map(p => p.productId === productId ? { ...p, status } : p) } : fs));
        logActivity(user, 'MARKETING_UPDATE', `Statut du produit ${productId} changé à ${status} pour la vente flash ${flashSaleId}.`);
    }, [setFlashSales, logActivity]);

    const handleBatchUpdateFlashSaleStatus = useCallback((flashSaleId: string, productIds: string[], status: 'approved' | 'rejected', user: User) => {
        setFlashSales(prev => prev.map(fs => {
            if (fs.id === flashSaleId) {
                const updatedProducts = fs.products.map(p => {
                    if (productIds.includes(p.productId)) {
                        return { ...p, status };
                    }
                    return p;
                });
                return { ...fs, products: updatedProducts };
            }
            return fs;
        }));
        logActivity(user, 'MARKETING_UPDATE', `Statut de ${productIds.length} produit(s) changé à ${status} pour la vente flash ${flashSaleId}.`);
    }, [setFlashSales, logActivity]);

    const handleCreateOrUpdateAnnouncement = useCallback((data: Omit<Announcement, 'id'> | Announcement, user: User) => {
        if ('id' in data && data.id) {
            setAllAnnouncements(prev => prev.map(a => a.id === data.id ? { ...a, ...data } : a));
            logActivity(user, 'ANNOUNCEMENT_UPDATED', `Annonce modifiée : "${data.title}"`);
        } else {
            const newAnnouncement: Announcement = { ...data, id: `ann-${Date.now()}` };
            setAllAnnouncements(prev => [...prev, newAnnouncement]);
            logActivity(user, 'ANNOUNCEMENT_CREATED', `Annonce créée : "${data.title}"`);
        }
    }, [setAllAnnouncements, logActivity]);

    const handleDeleteAnnouncement = useCallback((id: string, user: User) => {
        setAllAnnouncements(prev => prev.filter(a => a.id !== id));
        logActivity(user, 'ANNOUNCEMENT_DELETED', `Annonce supprimée : ID ${id}`);
    }, [setAllAnnouncements, logActivity]);

    const handleAddPickupPoint = useCallback((point: Omit<PickupPoint, 'id'>, user: User) => {
        const newPoint: PickupPoint = { ...point, id: `pp-${Date.now()}` };
        setAllPickupPoints(prev => [...prev, newPoint]);
        logActivity(user, 'LOGISTICS_UPDATE', `Point de retrait ajouté : "${point.name}"`);
    }, [setAllPickupPoints, logActivity]);
    
    const handleUpdatePickupPoint = useCallback((point: PickupPoint, user: User) => {
        setAllPickupPoints(prev => prev.map(p => p.id === point.id ? point : p));
        logActivity(user, 'LOGISTICS_UPDATE', `Point de retrait mis à jour : "${point.name}"`);
    }, [setAllPickupPoints, logActivity]);

    const handleDeletePickupPoint = useCallback((pointId: string, user: User) => {
        setAllPickupPoints(prev => prev.filter(p => p.id !== pointId));
        logActivity(user, 'LOGISTICS_UPDATE', `Point de retrait supprimé : ID ${pointId}`);
    }, [setAllPickupPoints, logActivity]);

    const handleAdminReplyToTicket = useCallback((ticketId: string, message: string, user: User) => {
        const newMessage = { authorId: user.id, authorName: user.name, message, date: new Date().toISOString() };
        setAllTickets(prev => prev.map(t => t.id === ticketId ? { ...t, messages: [...t.messages, newMessage], updatedAt: new Date().toISOString() } : t));
        logActivity(user, 'SUPPORT_TICKET_REPLY', `Réponse au ticket ${ticketId}.`);
    }, [setAllTickets, logActivity]);
    
    const handleAdminUpdateTicketStatus = useCallback((ticketId: string, status: TicketStatus, user: User) => {
        setAllTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
        logActivity(user, 'SUPPORT_TICKET_STATUS_CHANGE', `Statut du ticket ${ticketId} changé à ${status}.`);
    }, [setAllTickets, logActivity]);

    const handleReviewModeration = useCallback((productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected', user: User) => {
        setAllProducts(prev => prev.map(p => {
            if (p.id === productId) {
                return { ...p, reviews: p.reviews.map(r => (r.author === reviewIdentifier.author && r.date === reviewIdentifier.date) ? { ...r, status: newStatus } : r) };
            }
            return p;
        }));
        logActivity(user, 'REVIEW_MODERATED', `Avis sur le produit ${productId} modéré à ${newStatus}.`);
    }, [setAllProducts, logActivity]);

    const handleCreateUserByAdmin = useCallback((data: { name: string, email: string, role: UserRole }, adminUser: User) => {
        const newUser: User = {
            id: `user-${Date.now()}`,
            name: data.name,
            email: data.email,
            role: data.role,
            password: 'password', // Default password
            loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
        };
        // This is a simplified way to handle this; useAuth's setAllUsers should be used.
        // For now, we'll log it. This logic should be moved to AuthContext.
        logActivity(adminUser, 'USER_CREATED', `Utilisateur créé : ${data.name} (${data.email}) avec le rôle ${data.role}.`);
        alert("La création d'utilisateur est simulée et logguée. La gestion des utilisateurs devrait être centralisée dans AuthContext pour un état persistant.");
    }, [logActivity]);

     const handleUpdateOrderStatus = useCallback((orderId: string, status: OrderStatus, user: User) => {
        setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        logActivity(user, 'ORDER_STATUS_UPDATED', `Statut de la commande ${orderId} changé à ${status}.`);
    }, [setAllOrders, logActivity]);
    
    const handleDepotCheckIn = useCallback((orderId: string, storageLocationId: string, user: User) => {
        setAllOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const newTrackingEvent: TrackingEvent = {
                    status: 'at-depot',
                    date: new Date().toISOString(),
                    location: user.name,
                    details: `Colis enregistré au dépôt à l'emplacement: ${storageLocationId}.`
                };
                return {
                    ...o,
                    status: 'at-depot',
                    storageLocationId,
                    checkedInAt: new Date().toISOString(),
                    checkedInBy: user.id,
                    trackingHistory: [...(o.trackingHistory || []), newTrackingEvent]
                };
            }
            return o;
        }));
        logActivity(user, 'DEPOT_CHECK_IN', `Colis ${orderId} enregistré à l'emplacement ${storageLocationId}.`);
    }, [setAllOrders, logActivity]);
    
    const handleUpdateSchedule = useCallback((depotId: string, newSchedule: AgentSchedule, user: User) => {
        setAllPickupPoints(prevPoints => prevPoints.map(point => 
            point.id === depotId ? { ...point, schedule: newSchedule } : point
        ));
        logActivity(user, 'SCHEDULE_UPDATED', `Planning mis à jour pour le dépôt ${depotId}.`);
    }, [setAllPickupPoints, logActivity]);

    // Seller-specific actions
    const handleSellerUpdateOrderStatus = useCallback((orderId: string, status: OrderStatus, user: User) => {
        setAllOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const newTrackingEvent: TrackingEvent = {
                    status,
                    date: new Date().toISOString(),
                    location: user.shopName || 'Vendeur',
                    details: 'Statut mis à jour par le vendeur.'
                };
                return { ...o, status, trackingHistory: [...(o.trackingHistory || []), newTrackingEvent] };
            }
            return o;
        }));
        logActivity(user, 'SELLER_ORDER_UPDATE', `Le vendeur a mis à jour le statut de la commande ${orderId} à ${status}.`);
    }, [setAllOrders, logActivity]);

    const handleCreateOrUpdateCollection = useCallback((storeId: string, collection: ProductCollection, user: User) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                const collections = s.collections || [];
                const existingIndex = collections.findIndex(c => c.id === collection.id);
                if (existingIndex > -1) {
                    collections[existingIndex] = collection;
                } else {
                    collections.push({ ...collection, id: `coll-${Date.now()}` });
                }
                return { ...s, collections };
            }
            return s;
        }));
        logActivity(user, 'STORE_COLLECTION_UPDATE', `Collection "${collection.name}" mise à jour pour la boutique ${storeId}.`);
    }, [setAllStores, logActivity]);

    const handleDeleteCollection = useCallback((storeId: string, collectionId: string, user: User) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                return { ...s, collections: (s.collections || []).filter(c => c.id !== collectionId) };
            }
            return s;
        }));
        logActivity(user, 'STORE_COLLECTION_DELETE', `Collection ${collectionId} supprimée pour la boutique ${storeId}.`);
    }, [setAllStores, logActivity]);

    const handleUpdateStoreProfile = useCallback((storeId: string, updatedData: Partial<Store>, user: User) => {
        setAllStores(prev => prev.map(s => s.id === storeId ? { ...s, ...updatedData } : s));
        logActivity(user, 'STORE_PROFILE_UPDATE', `Profil de la boutique ${storeId} mis à jour.`);
    }, [setAllStores, logActivity]);

    const createStoreAndNotifyAdmin = useCallback((
        storeData: Pick<Store, 'name' | 'logoUrl' | 'category' | 'location' | 'neighborhood' | 'sellerFirstName' | 'sellerLastName' | 'sellerPhone' | 'physicalAddress' | 'latitude' | 'longitude'>,
        user: User, 
        allUsers: User[]
    ) => {
        if (!user) {
            console.error("A valid user must be provided to create a store.");
            return null;
        }

        const requiredDocs = Object.entries(siteSettings.requiredSellerDocuments)
            .filter(([, isRequired]) => isRequired)
            .map(([name]) => ({ name, status: 'requested' as DocumentStatus }));

        const newStore: Store = {
            ...storeData,
            id: `store-${Date.now()}`,
            sellerId: user.id,
            warnings: [],
            status: 'pending',
            documents: requiredDocs,
            premiumStatus: 'standard',
            subscriptionStatus: 'inactive',
        };

        setAllStores(prev => [...prev, newStore]);

        const adminUsers = allUsers.filter(u => u.role === 'superadmin');
        const newNotifications: Notification[] = adminUsers.map(admin => ({
            id: `notif-${Date.now()}-${admin.id}`,
            userId: admin.id,
            message: `Nouvelle boutique en attente d'approbation : "${newStore.name}".`,
            link: {
                page: 'superadmin-dashboard',
            },
            isRead: false,
            timestamp: new Date().toISOString(),
        }));
        
        setAllNotifications(prev => [...prev, ...newNotifications]);
        logActivity(user, 'STORE_CREATED', `Boutique "${newStore.name}" créée et en attente d'approbation.`);
        
        return newStore;
    }, [setAllStores, setAllNotifications, logActivity, siteSettings.requiredSellerDocuments]);

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
        handleApproveStore,
        handleRejectStore,
        handleToggleStoreStatus,
        handleWarnStore,
        handleAdminAddCategory,
        handleAdminDeleteCategory,
        handleSaveFlashSale,
        handleUpdateFlashSaleSubmissionStatus,
        handleBatchUpdateFlashSaleStatus,
        handleCreateOrUpdateAnnouncement,
        handleDeleteAnnouncement,
        handleAddPickupPoint,
        handleUpdatePickupPoint,
        handleDeletePickupPoint,
        handleAdminReplyToTicket,
        handleAdminUpdateTicketStatus,
        handleReviewModeration,
        handleCreateUserByAdmin,
        handleUpdateOrderStatus,
        handleAdminUpdateCategory,
        handleUpdateDocumentStatus,
        handleResolveDispute,
        handleDepotCheckIn,
        handleUpdateSchedule,
        // Seller actions
        handleSellerUpdateOrderStatus,
        handleCreateOrUpdateCollection,
        handleDeleteCollection,
        handleUpdateStoreProfile,
        handleUpdateDeliveryStatus,
        createStoreAndNotifyAdmin,
    };
};