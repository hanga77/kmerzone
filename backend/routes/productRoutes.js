import express from 'express';
import {
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { productValidation } from '../utils/validation.js';

const router = express.Router();

// NOTE: Public routes for getting products are in /routes/publicRoutes.js for clarity.

// Protected seller/admin routes
router.post('/', protect, authorize('seller', 'superadmin'), productValidation, createProduct);
router.put('/:id', protect, authorize('seller', 'superadmin'), productValidation, updateProduct);
router.delete('/:id', protect, authorize('seller', 'superadmin'), deleteProduct);

export default router;