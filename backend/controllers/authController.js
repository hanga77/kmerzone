import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'customer', // Default role
            loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
            addresses: [],
            followedStores: [],
        });
        
        const userResponse = await User.findById(user._id);

        if (userResponse) {
            res.status(201).json({
                _id: userResponse._id,
                id: userResponse._id, // For frontend compatibility
                name: userResponse.name,
                email: userResponse.email,
                role: userResponse.role,
                loyalty: userResponse.loyalty,
                addresses: userResponse.addresses,
                followedStores: userResponse.followedStores,
                token: generateToken(userResponse._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            
            const userResponse = await User.findById(user._id);

            res.json({
                _id: userResponse._id,
                id: userResponse._id, // For frontend compatibility
                name: userResponse.name,
                email: userResponse.email,
                role: userResponse.role,
                shopName: userResponse.shopName,
                loyalty: userResponse.loyalty,
                addresses: userResponse.addresses,
                followedStores: userResponse.followedStores,
                availabilityStatus: userResponse.availabilityStatus,
                depotId: userResponse.depotId,
                token: generateToken(userResponse._id),
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        // req.user is set by the authMiddleware and is already the full user document
        if (req.user) {
            res.json({
              ...req.user.toObject(),
              id: req.user._id // for frontend compatibility
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

export { registerUser, loginUser, getMe };