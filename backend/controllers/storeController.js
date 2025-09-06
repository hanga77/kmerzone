import Store from '../models/storeModel.js';
import User from '../models/userModel.js';

// @desc    Get all active stores
// @route   GET /api/stores
// @access  Public
const getStores = async (req, res, next) => {
    try {
        const stores = await Store.find({ status: 'active' });
        res.json(stores);
    } catch (error) {
        next(error);
    }
};

// @desc    Get store by name
// @route   GET /api/stores/:name
// @access  Public
const getStoreByName = async (req, res, next) => {
    try {
        const store = await Store.findOne({ name: req.params.name, status: 'active' });
        if (store) {
            res.json(store);
        } else {
            res.status(404);
            throw new Error('Store not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a store application
// @route   POST /api/stores/apply
// @access  Private
const createStoreApplication = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'customer') {
            res.status(400);
            throw new Error('Only customers can apply to become sellers.');
        }

        const existingStore = await Store.findOne({ userId: req.user._id });
        if (existingStore) {
            res.status(400);
            throw new Error('You already have a store application.');
        }

        const store = await Store.create({
            ...req.body,
            userId: req.user._id,
            status: 'pending', // Applications are pending by default
        });

        // Update user role to seller
        user.role = 'seller';
        user.shopName = store.name;
        await user.save();

        res.status(201).json(store);
    } catch (error) {
        next(error);
    }
};

// @desc    Update seller's own store
// @route   PUT /api/stores/my-store
// @access  Private/Seller
const updateMyStore = async (req, res, next) => {
    try {
        const store = await Store.findOne({ userId: req.user._id });

        if (store) {
            Object.assign(store, req.body);
            const updatedStore = await store.save();
            res.json(updatedStore);
        } else {
            res.status(404);
            throw new Error('Store not found');
        }
    } catch (error) {
        next(error);
    }
};

export {
    getStores,
    getStoreByName,
    createStoreApplication,
    updateMyStore,
};
