import express from 'express';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from './db.js';
import { generateToken, protectRoute, isAdmin, isLogisticsAgent, isDepotManager } from './auth.js';
import type { User, Product, Order, Store, ProductCollection, Review, PickupPoint, AgentSchedule, PromoCode, FlashSale } from '../types';
import * as initialData from './data.js';

const router = express.Router();

// A helper to get all collections data for the initial site load
const getSiteData = async () => {
    const db = await connectToDatabase();
    
    if (!db) { // MOCK MODE
        // In mock mode, passwords are plaintext, remove them before sending
        const usersWithoutPasswords = initialData.initialUsers.map(({ password, ...user }) => user);
        return {
            allProducts: initialData.initialProducts,
            allCategories: initialData.initialCategories,
            allStores: initialData.initialStores,
            flashSales: initialData.initialFlashSales,
            allOrders: [initialData.sampleDeliveredOrder, initialData.sampleDeliveredOrder2, initialData.sampleDeliveredOrder3, initialData.sampleNewMissionOrder],
            allPromoCodes: [],
            allPickupPoints: initialData.initialPickupPoints,
            allShippingPartners: initialData.initialShippingPartners,
            payouts: [],
            siteSettings: initialData.initialSiteSettings,
            siteContent: initialData.initialSiteContent,
            allAdvertisements: initialData.initialAdvertisements,
            allPaymentMethods: initialData.initialPaymentMethods,
            siteActivityLogs: [],
            allNotifications: [],
            allTickets: [],
            allAnnouncements: [],
            allZones: initialData.initialZones,
            allUsers: usersWithoutPasswords
        };
    }
    
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

    // Convert _id to id
    const convert = (arr: any[]) => arr.map(item => ({...item, id: item._id.toHexString()}));
    
    return {
        allProducts: convert(allProducts), 
        allCategories: convert(allCategories), 
        allStores: convert(allStores), 
        flashSales: convert(flashSales), 
        allOrders: convert(allOrders),
        allPromoCodes: convert(allPromoCodes), 
        allPickupPoints: convert(allPickupPoints), 
        allShippingPartners: convert(allShippingPartners), 
        payouts: convert(payouts),
        siteSettings: siteSettings ? {...siteSettings, id: siteSettings._id.toHexString()} : null, 
        siteContent: convert(siteContent), 
        allAdvertisements: convert(allAdvertisements), 
        allPaymentMethods: convert(allPaymentMethods),
        siteActivityLogs: convert(siteActivityLogs), 
        allNotifications: convert(allNotifications), 
        allTickets: convert(allTickets), 
        allAnnouncements: convert(allAnnouncements),
        allZones: convert(allZones), 
        allUsers: convert(allUsers)
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

        if (!db) { // MOCK MODE
            const user = initialData.initialUsers.find(u => u.email === email);
            if (user && user.password === password) { // Plaintext check for mock
                const mockUserForToken = { ...user, _id: { toHexString: () => user.id } };
                const token = generateToken(mockUserForToken as any);
                const { password: _, ...userWithoutPassword } = user;
                return res.json({ token, user: userWithoutPassword });
            } else {
                return res.status(401).json({ message: "Invalid credentials" });
            }
        }
        
        const user = await db.collection('users').findOne({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            const token = generateToken(user as any);
            const { password: _, ...userWithoutPassword } = user;
            res.json({ token, user: {...userWithoutPassword, id: user._id.toHexString()} });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

router.post('/auth/register', async (req, res) => {
    const db = await connectToDatabase();
    if (!db) {
        return res.status(503).json({ message: "Registration is disabled in mock data mode. Please connect to a database." });
    }
    
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Missing required fields for registration." });
    }

    try {
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

        const result = await db.collection('users').insertOne(newUser as any);
        const createdUser = { ...newUser, _id: result.insertedId };
        
        const token = generateToken(createdUser as any);
        const { password: _, ...userWithoutPassword } = createdUser;
        
        res.status(201).json({ token, user: {...userWithoutPassword, id: createdUser._id.toHexString()} });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration' });
    }
});

router.post('/auth/change-password', protectRoute, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = (req as any).user.user.id;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user || !await bcrypt.compare(oldPassword, user.password)) {
            return res.status(401).json({ message: "Incorrect old password." });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { password: hashedPassword } });
        res.json({ message: "Password updated successfully." });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/auth/forgot-password', async (req, res) => {
    // In a real app, this would generate a token, save a hashed version to the DB,
    // and email a reset link to the user.
    console.log(`[SIMULATION] Password reset requested for ${req.body.email}. In a real app, an email would be sent.`);
    res.json({ message: "If a user exists with that email, a reset link has been sent." });
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
        if (!db) return res.status(503).json({ message: 'Database not connected.' });

        const result = await db.collection('users').findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $set: updates },
            { returnDocument: 'after', projection: { password: 0 } }
        );

        if (!result) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const updatedUser = { ...result, id: result._id.toHexString() };
        const token = generateToken(result as any);

        res.json({ message: "User updated successfully.", updatedUser, token });
     } catch(e) {
        console.error("Error updating user:", e);
        res.status(500).json({ message: 'Server error while updating user' });
     }
});

router.post('/users/me/addresses', protectRoute, async (req, res) => {
    const userId = (req as any).user.user.id;
    const address = { ...req.body, id: new ObjectId().toHexString() };
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $push: { addresses: address } as any });
        const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
        const token = generateToken(updatedUser as any);
        res.json({ updatedUser, token });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/users/me/addresses/:addressId', protectRoute, async (req, res) => {
    const userId = (req as any).user.user.id;
    const { addressId } = req.params;
    const addressData = req.body;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId), 'addresses.id': addressId },
            { $set: { 'addresses.$': addressData } }
        );
        const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
        const token = generateToken(updatedUser as any);
        res.json({ updatedUser, token });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/users/me/addresses/:addressId', protectRoute, async (req, res) => {
    const userId = (req as any).user.user.id;
    const { addressId } = req.params;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { addresses: { id: addressId } } } as any
        );
        const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
        const token = generateToken(updatedUser as any);
        res.json({ updatedUser, token });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/users/me/addresses/:addressId/default', protectRoute, async (req, res) => {
    const userId = (req as any).user.user.id;
    const { addressId } = req.params;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        // Set all to false
        await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { 'addresses.$[].isDefault': false } });
        // Set selected to true
        await db.collection('users').updateOne({ _id: new ObjectId(userId), 'addresses.id': addressId }, { $set: { 'addresses.$.isDefault': true } });
        const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
        const token = generateToken(updatedUser as any);
        res.json({ updatedUser, token });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});


router.post('/users/me/toggle-follow/:storeId', protectRoute, (req, res) => {
     res.json({ message: "Follow toggled successfully (stub).", updatedUser: (req as any).user.user, token: (req.headers['authorization'] || '').split(' ')[1] });
});

router.post('/orders/:orderId/cancel', protectRoute, async (req, res) => {
    const { orderId } = req.params;
    const userId = (req as any).user.user.id;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const result = await db.collection<Order>('orders').findOneAndUpdate(
            { _id: new ObjectId(orderId), userId, status: { $in: ['confirmed', 'ready-for-pickup'] } },
            { $set: { status: 'cancelled' } },
            { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ message: "Order not found or cannot be cancelled." });
        res.json({ updatedOrder: { ...result, id: result._id.toHexString() } });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/orders/:orderId/request-refund', protectRoute, async (req, res) => {
    const { orderId } = req.params;
    const { reason, evidenceUrls } = req.body;
    const user = (req as any).user.user;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const result = await db.collection<Order>('orders').findOneAndUpdate(
            { _id: new ObjectId(orderId), userId: user.id, status: 'delivered' },
            { $set: { status: 'refund-requested', refundReason: reason, refundEvidenceUrls: evidenceUrls } },
            { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ message: "Order not found or not eligible for refund request." });
        res.json({ updatedOrder: { ...result, id: result._id.toHexString() } });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/users/me/upgrade-loyalty', protectRoute, async (req, res) => {
    const userId = (req as any).user.user.id;
    const { level } = req.body;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { "loyalty.status": level } });
        res.json({ message: 'Loyalty status upgraded.' });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});


// --- SELLER ROUTER ---
const sellerRouter = express.Router();
sellerRouter.use(protectRoute);

// Middleware to check for seller role
sellerRouter.use(async (req, res, next) => {
    const user = (req as any).user.user;
    if (!user || (user.role !== 'seller' && user.role !== 'enterprise')) {
        return res.status(403).json({ message: 'Forbidden: Seller access required.' });
    }
    const db = await connectToDatabase();
    if (db) {
        const store = await db.collection<Store>('stores').findOne({ sellerId: user.id });
        if (!store) return res.status(403).json({ message: 'Forbidden: No store associated with this seller.' });
        (req as any).store = store;
    }
    next();
});


// Product Management
sellerRouter.post('/products', async (req, res) => {
    const user = (req as any).user.user;
    const productData = req.body as Product;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'Database not connected.' });
        const result = await db.collection<Omit<Product, 'id'>>('products').insertOne({ ...productData, vendor: user.shopName });
        const newProduct = { ...productData, id: result.insertedId.toHexString() };
        res.status(201).json({ newProduct });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create product.' });
    }
});

sellerRouter.put('/products/:id', async (req, res) => {
    const user = (req as any).user.user;
    const { id } = req.params;
    const { _id, ...productData } = req.body;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'Database not connected.' });
        const result = await db.collection('products').findOneAndUpdate(
            { _id: new ObjectId(id), vendor: user.shopName },
            { $set: productData },
            { returnDocument: 'after' }
        );
        // FIX: The result from findOneAndUpdate is the document itself in newer versions, not an object with a `value` property.
        if (!result) return res.status(404).json({ message: 'Product not found or not owned by user.' });
        res.json({ updatedProduct: { ...result, id: result._id.toHexString() } });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update product.' });
    }
});

sellerRouter.delete('/products/:id', async (req, res) => {
    const user = (req as any).user.user;
    const { id } = req.params;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'Database not connected.' });
        const result = await db.collection('products').deleteOne({ _id: new ObjectId(id), vendor: user.shopName });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Product not found or not owned by user.' });
        res.status(200).json({ message: 'Product deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete product.' });
    }
});

// Order Management
sellerRouter.patch('/orders/:id/status', async (req, res) => {
    const user = (req as any).user.user;
    const { id } = req.params;
    const { status } = req.body;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'Database not connected.' });
        // Ensure seller owns at least one item in the order
        const order = await db.collection<Order>('orders').findOne({ _id: new ObjectId(id), 'items.vendor': user.shopName });
        if (!order) return res.status(404).json({ message: 'Order not found or you are not a vendor for this order.' });

        const result = await db.collection('orders').updateOne({ _id: new ObjectId(id) }, { $set: { status } });
        res.json({ message: 'Order status updated.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order status.' });
    }
});

// Store Profile & Collections
sellerRouter.put('/profile', async (req, res) => {
    const store = (req as any).store;
    const updates = req.body as Partial<Store>;
    // FIX: Cast updates to any to allow deleting the _id property, which is not in the Store type but might be sent by the client.
    delete (updates as any)._id;
    delete updates.id;
    delete updates.sellerId;

    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'Database not connected.' });
        const result = await db.collection('stores').findOneAndUpdate(
            { _id: store._id },
            { $set: updates },
            { returnDocument: 'after' }
        );
        // FIX: The result from findOneAndUpdate is the document itself in newer versions, not an object with a `value` property.
        if (!result) return res.status(404).json({ message: 'Store not found.' });
        res.json({ updatedStore: { ...result, id: result._id.toHexString() } });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update store profile.' });
    }
});

sellerRouter.post('/collections', async (req, res) => {
    const store = (req as any).store;
    const collectionData = req.body as ProductCollection;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'Database not connected.' });
        await db.collection('stores').updateOne(
            { _id: store._id },
            // FIX: Cast the entire $push operator to 'any' to bypass strict type checking issues with the MongoDB driver.
            { $push: { collections: { ...collectionData, id: new ObjectId().toHexString() } } as any }
        );
        res.status(201).json({ message: 'Collection created.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create collection.' });
    }
});

sellerRouter.put('/collections/:id', async (req, res) => {
    const store = (req as any).store;
    const { id } = req.params;
    const collectionData = req.body;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'Database not connected.' });
        await db.collection('stores').updateOne(
            { _id: store._id, 'collections.id': id },
            { $set: { 'collections.$': collectionData } }
        );
        res.json({ message: 'Collection updated.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update collection.' });
    }
});

// Reply to review
sellerRouter.post('/products/:productId/reviews/reply', async (req, res) => {
    const store = (req as any).store;
    const { productId } = req.params;
    const { reviewIdentifier, replyText } = req.body;
    
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'Database not connected.' });
        const result = await db.collection('products').findOneAndUpdate(
            { _id: new ObjectId(productId), vendor: store.name, 'reviews.author': reviewIdentifier.author, 'reviews.date': reviewIdentifier.date },
            { $set: { 'reviews.$.sellerReply': { text: replyText, date: new Date().toISOString() } } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ message: 'Review not found or you do not own this product.' });
        }
        res.json({ message: 'Reply added.', updatedProduct: {...result, id: result._id.toHexString()} });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add reply.' });
    }
});

sellerRouter.post('/flash-sales/:saleId/submit-product', async (req, res) => {
    const store = (req as any).store;
    const { saleId } = req.params;
    const { productId, flashPrice } = req.body;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const product = await db.collection<Product>('products').findOne({ _id: new ObjectId(productId), vendor: store.name });
        if (!product) return res.status(404).json({ message: "Product not found or not owned by you." });
        
        const result = await db.collection<FlashSale>('flashsales').findOneAndUpdate(
            { _id: new ObjectId(saleId) },
            { $push: { products: { productId, sellerShopName: store.name, flashPrice, status: 'pending' } } as any},
            { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ message: "Flash sale not found." });
        res.json({ updatedFlashSale: {...result, id: result._id.toHexString()} });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

sellerRouter.post('/promo-codes', async (req, res) => {
    const store = (req as any).store;
    const codeData = req.body as Omit<PromoCode, 'uses'>;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const newPromoCode = { ...codeData, sellerId: store.sellerId, uses: 0 };
        const result = await db.collection('promocodes').insertOne(newPromoCode as any);
        res.status(201).json({ newPromoCode: { ...newPromoCode, id: result.insertedId.toHexString() } });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

sellerRouter.post('/documents', async (req, res) => {
    const store = (req as any).store;
    const { documentName, fileUrl } = req.body;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const result = await db.collection<Store>('stores').findOneAndUpdate(
            { _id: store._id, "documents.name": documentName },
            { $set: { "documents.$.status": "uploaded", "documents.$.fileUrl": fileUrl } },
            { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ message: "Document type not found for this store." });
        res.json({ updatedStore: {...result, id: result._id.toHexString()} });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

sellerRouter.post('/upgrade-subscription', async (req, res) => {
    const store = (req as any).store;
    const { level } = req.body;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const result = await db.collection<Store>('stores').findOneAndUpdate(
            { _id: store._id },
            { $set: { premiumStatus: level } },
            { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ message: 'Store not found.' });
        res.json({ updatedStore: {...result, id: result._id.toHexString()} });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});


router.use('/seller', sellerRouter);

// --- LOGISTICS ROUTER ---
const logisticsRouter = express.Router();
logisticsRouter.use(protectRoute, isLogisticsAgent);

logisticsRouter.post('/orders/:orderId/pickup', async (req, res) => {
    const { orderId } = req.params;
    const agent = (req as any).user.user;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        
        const result = await db.collection<Order>('orders').findOneAndUpdate(
            { _id: new ObjectId(orderId), status: 'ready-for-pickup' },
            { 
                $set: { status: 'picked-up', agentId: agent.id },
                $push: { 
                    trackingHistory: { status: 'picked-up', date: new Date().toISOString(), location: `Livreur: ${agent.name}`, details: 'Colis récupéré chez le vendeur.' },
                    statusChangeLog: { status: 'picked-up', date: new Date().toISOString(), changedBy: `Agent: ${agent.name}` }
                } as any
            },
            { returnDocument: 'after' }
        );

        if (!result) return res.status(404).json({ message: "Order not found or not ready for pickup." });
        res.json({ updatedOrder: { ...result, id: result._id.toHexString() } });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

logisticsRouter.post('/orders/:orderId/check-in', async (req, res) => {
    const { orderId } = req.params;
    const { location } = req.body;
    const agent = (req as any).user.user;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        
        const result = await db.collection<Order>('orders').findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            { 
                $set: { status: 'at-depot', storageLocationId: location },
                $push: { 
                    trackingHistory: { status: 'at-depot', date: new Date().toISOString(), location: `Dépôt (Zone ${agent.zoneId})`, details: `Colis enregistré à l'emplacement ${location}.` },
                    statusChangeLog: { status: 'at-depot', date: new Date().toISOString(), changedBy: `Agent Dépôt: ${agent.name}` }
                } as any
            },
            { returnDocument: 'after' }
        );

        if (!result) return res.status(404).json({ message: "Order not found." });
        res.json({ updatedOrder: { ...result, id: result._id.toHexString() } });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

logisticsRouter.post('/orders/:orderId/assign-driver', async (req, res) => {
    const { orderId } = req.params;
    const { agentId } = req.body;
    const assigningAgent = (req as any).user.user;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        
        const driver = await db.collection<User>('users').findOne({ _id: new ObjectId(agentId) });
        if (!driver) return res.status(404).json({ message: 'Driver not found.' });
        
        const result = await db.collection<Order>('orders').findOneAndUpdate(
            { _id: new ObjectId(orderId), status: 'at-depot' },
            { 
                $set: { status: 'out-for-delivery', agentId },
                $push: { 
                    trackingHistory: { status: 'out-for-delivery', date: new Date().toISOString(), location: `Dépôt (Zone ${assigningAgent.zoneId})`, details: `Colis assigné au livreur ${driver.name}.` },
                    statusChangeLog: { status: 'out-for-delivery', date: new Date().toISOString(), changedBy: `Agent Dépôt: ${assigningAgent.name}` }
                } as any
            },
            { returnDocument: 'after' }
        );

        if (!result) return res.status(404).json({ message: "Order not found or not in depot." });
        res.json({ updatedOrder: { ...result, id: result._id.toHexString() } });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

logisticsRouter.post('/orders/:orderId/confirm-delivery', async (req, res) => {
    const { orderId } = req.params;
    const { recipientName } = req.body;
    const agent = (req as any).user.user;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        
        const result = await db.collection<Order>('orders').findOneAndUpdate(
            { _id: new ObjectId(orderId), agentId: agent.id },
            { 
                $set: { status: 'delivered', pickupRecipientName: recipientName },
                $push: { 
                    trackingHistory: { status: 'delivered', date: new Date().toISOString(), location: 'Client', details: `Livré à ${recipientName}.` },
                    statusChangeLog: { status: 'delivered', date: new Date().toISOString(), changedBy: `Livreur: ${agent.name}` }
                } as any
            },
            { returnDocument: 'after' }
        );

        if (!result) return res.status(404).json({ message: "Order not found or not assigned to you." });
        res.json({ updatedOrder: { ...result, id: result._id.toHexString() } });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

logisticsRouter.post('/orders/:orderId/report-failure', async (req, res) => {
    const { orderId } = req.params;
    const { failureReason } = req.body;
    const agent = (req as any).user.user;
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        
        const result = await db.collection<Order>('orders').findOneAndUpdate(
            { _id: new ObjectId(orderId), agentId: agent.id },
            { 
                $set: { status: 'delivery-failed', deliveryFailureReason: failureReason },
                $push: { 
                    trackingHistory: { status: 'delivery-failed', date: new Date().toISOString(), location: 'Client', details: `Motif: ${failureReason.reason} - ${failureReason.details}` },
                    statusChangeLog: { status: 'delivery-failed', date: new Date().toISOString(), changedBy: `Livreur: ${agent.name}` }
                } as any
            },
            { returnDocument: 'after' }
        );

        if (!result) return res.status(404).json({ message: "Order not found or not assigned to you." });
        res.json({ updatedOrder: { ...result, id: result._id.toHexString() } });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

logisticsRouter.put('/depots/:depotId/schedule', isDepotManager, async (req, res) => {
    const { depotId } = req.params;
    const { schedule } = req.body as { schedule: AgentSchedule };
    try {
        const db = await connectToDatabase();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        
        const result = await db.collection<PickupPoint>('pickuppoints').findOneAndUpdate(
            { _id: new ObjectId(depotId) },
            { $set: { schedule } },
            { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ message: "Depot not found." });
        res.json({ updatedDepot: { ...result, id: result._id.toHexString() } });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.use('/logistics', logisticsRouter);


export default router;