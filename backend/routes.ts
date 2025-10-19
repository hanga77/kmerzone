
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from './db.js';
import { generateToken, protectRoute } from './auth.js';
import type { User } from '../types';

const router = Router();

// A helper to get all collections data for the initial site load
const getSiteData = async () => {
    const db = await connectToDatabase();
    const [
        allProducts, allCategories, allStores, flashSales, allOrders,
        allPromoCodes, allPickupPoints, allShippingPartners, payouts,
        siteSettings, siteContent, allAdvertisements, allPaymentMethods,
        siteActivityLogs, allNotifications, allTickets, allAnnouncements,
        allZones, allUsers
    ] = await Promise.all([
        db.collection('products').find({}).toArray(),
        db.collection('categories').find({}).toArray(),
        db.collection('stores').find({}).toArray(),
        db.collection('flashsales').find({}).toArray(),
        db.collection('orders').find({}).toArray(),
        db.collection('promocodes').find({}).toArray(),
        db.collection('pickuppoints').find({}).toArray(),
        db.collection('shippingpartners').find({}).toArray(),
        db.collection('payouts').find({}).toArray(),
        db.collection('sitesettings').findOne({}),
        db.collection('sitecontent').find({}).toArray(),
        db.collection('advertisements').find({}).toArray(),
        db.collection('paymentmethods').find({}).toArray(),
        db.collection('siteactivitylogs').find({}).sort({ timestamp: -1 }).limit(50).toArray(),
        db.collection('notifications').find({}).sort({ timestamp: -1 }).limit(100).toArray(),
        db.collection('tickets').find({}).sort({ createdAt: -1 }).toArray(),
        db.collection('announcements').find({}).toArray(),
        db.collection('zones').find({}).toArray(),
        db.collection('users').find({}, { projection: { password: 0 } }).toArray(),
    ]);

    return {
        allProducts, allCategories, allStores, flashSales, allOrders,
        allPromoCodes, allPickupPoints, allShippingPartners, payouts,
        siteSettings, siteContent, allAdvertisements, allPaymentMethods,
        siteActivityLogs, allNotifications, allTickets, allAnnouncements,
        allZones, allUsers
    };
};


router.get('/sitedata', async (req, res) => {
    try {
        const data = await getSiteData();
        res.json(data);
    } catch (error) {
        console.error("Error fetching site data:", error);
        res.status(500).json({ message: "Failed to fetch site data" });
    }
});

router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }
    
    try {
        const db = await connectToDatabase();
        const user = await db.collection('users').findOne({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            const token = generateToken(user as any);
            const { password: _, ...userWithoutPassword } = user;
            res.json({ token, user: userWithoutPassword });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

router.post('/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Missing required fields for registration." });
    }

    try {
        const db = await connectToDatabase();
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User with this email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser: Omit<User, 'id'> = {
            name,
            email,
            password: hashedPassword,
            role,
            loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
            addresses: [],
            followedStores: [],
            notificationPreferences: { promotions: true, orderUpdates: true, newsletters: false },
            ...req.body
        };

        const result = await db.collection('users').insertOne(newUser);
        const createdUser = { ...newUser, _id: result.insertedId };
        
        const token = generateToken(createdUser as any);
        const { password: _, ...userWithoutPassword } = createdUser;
        
        res.status(201).json({ token, user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Example of a protected route
router.patch('/users/me', protectRoute, async (req, res) => {
     const userId = (req as any).user.user.id;
     const updates = req.body;
     
     // Remove fields that shouldn't be updated this way
     delete updates._id;
     delete updates.id;
     delete updates.email;
     delete updates.password;
     delete updates.role;
     
     try {
        const db = await connectToDatabase();
        // The rest of the implementation would go here...
        // For now, we'll just return a success message as a stub.
        res.json({ message: "User updated successfully (stub).", updatedUser: { ... (req as any).user.user, ...updates }, token: (req.headers['authorization'] || '').split(' ')[1] });
     } catch(e) {
        res.status(500).json({ message: 'Server error' });
     }
});

router.post('/users/me/addresses', protectRoute, (req, res) => {
    res.json({ message: "Address added successfully (stub).", updatedUser: (req as any).user.user, token: (req.headers['authorization'] || '').split(' ')[1] });
});

router.post('/users/me/toggle-follow/:storeId', protectRoute, (req, res) => {
     res.json({ message: "Follow toggled successfully (stub).", updatedUser: (req as any).user.user, token: (req.headers['authorization'] || '').split(' ')[1] });
});


export default router;
