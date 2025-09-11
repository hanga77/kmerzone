import express from 'express';
import {
    getCategories,
    getActiveStores,
    getStoreByName,
    getActiveFlashSales,
    getPickupPoints,
    getProducts,
    getProductById,
    getAdvertisements,
    getPaymentMethods,
    getSiteContent
} from '../controllers/publicController.js';

const router = express.Router();

// This combines public product routes with other public data
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

router.get('/categories', getCategories);
router.get('/stores', getActiveStores);
router.get('/stores/:name', getStoreByName);
router.get('/flash-sales', getActiveFlashSales);
router.get('/pickup-points', getPickupPoints);
router.get('/advertisements', getAdvertisements);
router.get('/payment-methods', getPaymentMethods);
router.get('/site-content', getSiteContent);

export default router;