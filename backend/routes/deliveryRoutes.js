import express from 'express';
import {
    getMyMissions,
    updateOrderStatus,
    updateAvailability,
    confirmDelivery
} from '../controllers/deliveryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes are protected and for delivery agents only
router.use(protect, authorize('delivery_agent'));

router.get('/missions', getMyMissions);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/confirm', upload.single('proof'), confirmDelivery);
router.put('/availability', updateAvailability);

export default router;