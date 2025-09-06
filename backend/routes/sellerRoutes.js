import express from 'express';
import {
    becomeSeller,
    getMyStore,
    updateMyStore,
    getMyProducts,
    getMyOrders,
    updateOrderStatus,
    getMyPromoCodes,
    createPromoCode,
    deletePromoCode,
    proposeForFlashSale,
    uploadDocument,
    addStory,
    deleteStory,
    getSellerFinances,
    addDisputeMessage,
    bulkUpdateProducts,
    replyToReview,
    getCollections,
    createOrUpdateCollection,
    deleteCollection
} from '../controllers/sellerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public route for application
router.post('/apply', protect, becomeSeller);

// All subsequent routes are for authenticated sellers only
router.use(protect, authorize('seller'));

router.route('/profile')
    .get(getMyStore)
    .put(updateMyStore);

router.route('/products').get(getMyProducts);
router.route('/products/bulk-update').put(bulkUpdateProducts);
router.route('/products/:productId/reviews/reply').post(replyToReview);

router.route('/orders').get(getMyOrders);
router.route('/orders/:id/status').put(updateOrderStatus);
router.route('/orders/:id/dispute').post(addDisputeMessage);

router.route('/promocodes')
    .get(getMyPromoCodes)
    .post(createPromoCode);
router.route('/promocodes/:code').delete(deletePromoCode);

router.route('/flash-sales/propose').post(proposeForFlashSale);

router.route('/documents/upload').post(upload.single('file'), uploadDocument);

router.route('/stories')
    .post(addStory);
router.route('/stories/:storyId').delete(deleteStory);

router.route('/collections')
    .get(getCollections)
    .post(createOrUpdateCollection);
router.route('/collections/:id')
    .put(createOrUpdateCollection)
    .delete(deleteCollection);

router.get('/finances', getSellerFinances);


export default router;