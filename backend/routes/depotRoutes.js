import express from 'express';
import {
    checkInOrder,
    processDeparture,
    reportDiscrepancy,
    getDepotInventory
} from '../controllers/depotController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes are protected and for depot agents only
router.use(protect, authorize('depot_agent'));

router.get('/inventory', getDepotInventory);
router.post('/orders/check-in', checkInOrder);
router.post('/orders/process-departure', processDeparture);
router.post('/orders/discrepancy', reportDiscrepancy);

export default router;