import User from '../models/userModel.js';
import Store from '../models/storeModel.js';
import bcrypt from 'bcryptjs';

// @desc    Update user profile info (name, etc.)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                // include other fields you want to return
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Change user password
// @route   PUT /api/users/profile/password
// @access  Private
const changePassword = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user._id).select('+password');
        if (user && (await user.matchPassword(oldPassword))) {
            user.password = newPassword;
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401);
            throw new Error('Invalid old password');
        }
    } catch (error) {
        next(error);
    }
};

// --- Address Management ---

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
const getUserAddresses = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user.addresses);
    } catch (error) {
        next(error);
    }
};

// @desc    Add a new address
// @route   POST /api/users/addresses
// @access  Private
const addAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const { fullName, phone, address, city, latitude, longitude } = req.body;
        
        const newAddress = { fullName, phone, address, city, latitude, longitude };
        
        if (user.addresses.length === 0) {
            newAddress.isDefault = true;
        }

        user.addresses.push(newAddress);
        await user.save();
        res.status(201).json(user.addresses);
    } catch (error) {
        next(error);
    }
};

// @desc    Update an address
// @route   PUT /api/users/addresses/:id
// @access  Private
const updateAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const address = user.addresses.id(req.params.id);

        if (address) {
            Object.assign(address, req.body);
            await user.save();
            res.json(user.addresses);
        } else {
            res.status(404);
            throw new Error('Address not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:id
// @access  Private
const deleteAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const address = user.addresses.id(req.params.id);

        if (address) {
            const wasDefault = address.isDefault;
            user.addresses.pull(address._id);

            if (wasDefault && user.addresses.length > 0) {
                user.addresses[0].isDefault = true;
            }

            await user.save();
            res.json(user.addresses);
        } else {
            res.status(404);
            throw new Error('Address not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Set a default address
// @route   PUT /api/users/addresses/:id/default
// @access  Private
const setDefaultAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        user.addresses.forEach(addr => addr.isDefault = false);
        const address = user.addresses.id(req.params.id);

        if (address) {
            address.isDefault = true;
            await user.save();
            res.json(user.addresses);
        } else {
            res.status(404);
            throw new Error('Address not found');
        }
    } catch (error) {
        next(error);
    }
};

// --- Followed Stores Management ---

// @desc    Toggle follow status for a store
// @route   POST /api/users/followed-stores/:storeId
// @access  Private
const toggleFollowStore = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const store = await Store.findById(req.params.storeId);

        if (!store) {
            res.status(404);
            throw new Error('Store not found');
        }

        const isFollowing = user.followedStores.includes(store._id);

        if (isFollowing) {
            user.followedStores.pull(store._id);
        } else {
            user.followedStores.push(store._id);
        }

        await user.save();
        res.json(user.followedStores);
    } catch (error) {
        next(error);
    }
};


export {
    updateUserProfile,
    changePassword,
    getUserAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    toggleFollowStore,
};