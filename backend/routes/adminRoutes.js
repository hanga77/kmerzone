
import express from 'express';
import {
    getStores,
    updateStoreStatus,
    updateStorePremiumStatus,
    rejectStore,
    warnStore,
    requestDocument,
    verifyDocument,
    activateSubscription,
    getUsers,
    updateUser,
    createUser,
    sanctionUser,
    getOrders,
    updateOrder,
    assignAgentToOrder,
    resolveRefund,
    addAdminDisputeMessage,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getFlashSales,
    createFlashSale,
    updateFlashSaleSubmission,
    getSiteActivityLogs,
    getSiteSettings,
    updateSiteSettings,
    getPickupPoints,
    createOrUpdatePickupPoint,
    deletePickupPoint,
    getPayouts,
    createPayout,
    getAdvertisements,
    createOrUpdateAdvertisement,
    deleteAdvertisement,
    getSiteContent,
    updateSiteContent,
    getTickets,
    replyToTicket,
    updateTicketStatus,
    getAnnouncements,
    createOrUpdateAnnouncement,
    deleteAnnouncement,
    moderateReview,
    getPaymentMethods,
    updatePaymentMethods
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes in this file are protected and for superadmins only
router.use(protect, authorize('superadmin'));

// Store Management
router.get('/stores', getStores);
router.put('/stores/:id/status', updateStoreStatus);
router.put('/stores/:id/premium-status', updateStorePremiumStatus);
router.delete('/stores/:id', rejectStore);
router.post('/stores/:id/warn', warnStore);
router.post('/stores/:id/documents', requestDocument);
router.put('/stores/:storeId/documents/:docName/verify', verifyDocument);
router.post('/stores/:id/activate-subscription', activateSubscription);


// User Management
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.post('/users/:id/sanction', sanctionUser);

// Order Management
router.get('/orders', getOrders);
router.put('/orders/:id', updateOrder);
router.post('/orders/:id/assign-agent', assignAgentToOrder);
router.post('/orders/:id/resolve-refund', resolveRefund);
router.post('/orders/:id/dispute', addAdminDisputeMessage);

// Category Management
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Review Moderation
router.put('/reviews/moderate', moderateReview);

// Flash Sale Management
router.get('/flash-sales', getFlashSales);
router.post('/flash-sales', createFlashSale);
router.put('/flash-sales/:saleId/submissions', updateFlashSaleSubmission);

// Pickup Point Management
router.get('/pickup-points', getPickupPoints);
router.post('/pickup-points', createOrUpdatePickupPoint);
router.put('/pickup-points/:id', createOrUpdatePickupPoint);
router.delete('/pickup-points/:id', deletePickupPoint);

// Payout Management
router.get('/payouts', getPayouts);
router.post('/payouts', createPayout);

// Advertisement Management
router.get('/advertisements', getAdvertisements);
router.post('/advertisements', createOrUpdateAdvertisement);
router.put('/advertisements/:id', createOrUpdateAdvertisement);
router.delete('/advertisements/:id', deleteAdvertisement);

// Site Content Management
router.get('/site-content', getSiteContent);
router.put('/site-content', updateSiteContent);

// Ticket Management
router.get('/tickets', getTickets);
router.post('/tickets/:id/reply', replyToTicket);
router.put('/tickets/:id/status', updateTicketStatus);

// Announcement Management
router.get('/announcements', getAnnouncements);
router.post('/announcements', createOrUpdateAnnouncement);
router.put('/announcements/:id', createOrUpdateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Payment Methods
router.get('/payment-methods', getPaymentMethods);
router.put('/payment-methods', updatePaymentMethods);

// Site Settings & Logs
router.get('/settings', getSiteSettings);
router.put('/settings', updateSiteSettings);
router.get('/logs', getSiteActivityLogs);


export default router;
