import express from 'express';
import { generateDescription, visualSearch } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/generate-description', protect, authorize('seller'), generateDescription);
router.post('/visual-search', visualSearch); // Can be public or protected depending on usage


export default router;