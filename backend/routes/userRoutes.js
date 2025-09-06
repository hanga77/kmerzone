import express from 'express';
import {
    updateUserProfile,
    getUserAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    toggleFollowStore,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { addressValidation } from '../utils/validation.js';

const router = express.Router();

// All routes here are protected as they relate to the logged-in user's profile
router.use(protect);

router.route('/profile').put(updateUserProfile);

router.route('/addresses')
    .get(getUserAddresses)
    .post(addressValidation, addAddress);

router.route('/addresses/:id')
    .put(addressValidation, updateAddress)
    .delete(deleteAddress);

router.route('/addresses/:id/default').put(setDefaultAddress);

router.route('/followed-stores/:storeId').post(toggleFollowStore);

export default router;