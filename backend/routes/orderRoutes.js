import express from 'express';
import {
    addOrderItems,
    getOrderById,
    getMyOrders,
    cancelMyOrder,
    requestRefundForMyOrder,
    addDisputeMessage
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
    .post(addOrderItems);

router.route('/myorders')
    .get(getMyOrders);

router.route('/:id')
    .get(getOrderById);

router.route('/:id/cancel')
    .put(cancelMyOrder);

router.route('/:id/refund')
    .post(requestRefundForMyOrder);
    
router.route('/:id/dispute')
    .post(addDisputeMessage);


export default router;