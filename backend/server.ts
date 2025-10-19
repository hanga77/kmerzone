
// FIX: Changed to standard ES module import for Express to resolve type errors.
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { MongoClient, ObjectId, Db } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// FIX: Import process to resolve type error for process.exit.
import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
import type { User, UserRole } from '../types';
import * as initialData from './data.js';

dotenv.config();

const isDev = process.argv.includes('--dev');
// FIX: __dirname is not available in ES modules. This calculates it from import.meta.url.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, '..');

// --- ESBUILD DEV WATCHER ---
if (isDev) {
    esbuild.context({
        entryPoints: [path.join(rootPath, 'index.tsx')],
        bundle: true,
        outfile: path.join(rootPath, 'bundle.js'),
        define: { 'process.env.API_KEY': `"${process.env.API_KEY}"` },
        loader: { '.tsx': 'tsx' },
        sourcemap: true,
    }).then(ctx => {
        ctx.watch();
        console.log('[esbuild] Watching for frontend changes...');
    }).catch(err => {
        console.error("[esbuild] Watch failed:", err);
        process.exit(1);
    });
}


const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI || !JWT_SECRET) {
    console.error("MONGO_URI or JWT_SECRET is not defined in .env file.");
    process.exit(1);
}

// --- Database Connection Caching for Serverless ---
let cachedDb: Db | null = null;

async function connectToDatabase(): Promise<Db> {
    if (cachedDb) {
        return cachedDb;
    }
    try {
        const client = await MongoClient.connect(MONGO_URI!);
        const db = client.db();
        cachedDb = db;
        console.log("New DB connection established.");
        return db;
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        throw new Error("Could not connect to database.");
    }
}
// --------------------------------------------------


// FIX: Use imported Request, Response, NextFunction types from express.
const protectRoute = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET!, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        (req as any).user = user;
        next();
    });
};

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user?.user;
    if (user && user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
};


// --- API ROUTES ---
app.get('/api/all-data', async (req: Request, res: Response) => {
    try {
        const db = await connectToDatabase();
        const [
            allProducts, allCategories, allStores, flashSales, allOrders, 
            allPromoCodes, allPickupPoints, allShippingPartners, payouts, 
            siteSettingsResult, siteContent, allAdvertisements, allPaymentMethods, 
            siteActivityLogs, allNotifications, allTickets, allAnnouncements, 
            allZones, allUsers
        ] = await Promise.all([
            db.collection('products').find().toArray(),
            db.collection('categories').find().toArray(),
            db.collection('stores').find().toArray(),
            db.collection('flashsales').find().toArray(),
            db.collection('orders').find().toArray(),
            db.collection('promocodes').find().toArray(),
            db.collection('pickuppoints').find().toArray(),
            db.collection('shippingpartners').find().toArray(),
            db.collection('payouts').find().toArray(),
            db.collection('sitesettings').findOne(),
            db.collection('sitecontent').find().toArray(),
            db.collection('advertisements').find().toArray(),
            db.collection('paymentmethods').find().toArray(),
            db.collection('activitylogs').find().sort({ timestamp: -1 }).limit(100).toArray(),
            db.collection('notifications').find().toArray(),
            db.collection('tickets').find().toArray(),
            db.collection('announcements').find().toArray(),
            db.collection('zones').find().toArray(),
            db.collection('users').find({}, { projection: { password: 0 } }).toArray(),
        ]);
        
        const siteSettings = siteSettingsResult || initialData.initialSiteSettings;

        res.json({
            allProducts, allCategories, allStores, flashSales, allOrders, 
            allPromoCodes, allPickupPoints, allShippingPartners, payouts, 
            siteSettings, siteContent, allAdvertisements, allPaymentMethods, 
            siteActivityLogs, allNotifications, allTickets, allAnnouncements, 
            allZones, allUsers
        });
    } catch (error) {
        console.error("Error fetching all data:", error);
        res.status(500).json({ message: "Internal server error while fetching data." });
    }
});


// AUTH ROUTES
app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, password, role, phone, birthDate, address } = req.body;
    try {
        const db = await connectToDatabase();
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser: Omit<User, 'id'> = {
            name, email, password: hashedPassword, role, phone, birthDate,
            shopName: role === 'seller' ? name : undefined,
            loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
            addresses: address ? [{ ...address, id: new ObjectId().toHexString(), isDefault: true }] : [],
        };

        const result = await db.collection('users').insertOne(newUser);
        const userForToken = { ...newUser, id: result.insertedId.toHexString(), _id: result.insertedId };
        delete (userForToken as any).password;

        const token = jwt.sign({ user: userForToken }, JWT_SECRET!, { expiresIn: '1d' });

        res.status(201).json({ token, user: userForToken });
    } catch (error) {
        console.error("Error in /api/auth/register:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const db = await connectToDatabase();
        const user = await db.collection('users').findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        
        const userForToken = { ...user, id: user._id.toHexString() };
        delete (userForToken as any).password;
        const token = jwt.sign({ user: userForToken }, JWT_SECRET!, { expiresIn: '1d' });
        res.json({ token, user: userForToken });
    } catch (error) {
        console.error("Error in /api/auth/login:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- ADMIN STORE MANAGEMENT ---
app.post('/api/admin/stores/:id/approve', protectRoute, isAdmin, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const result = await db.collection('stores').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: 'active' } });
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Store not found' });
        res.status(200).json({ success: true, status: 'active' });
    } catch (e) { res.status(500).json({ message: (e as Error).message }) }
});

app.post('/api/admin/stores/:id/reject', protectRoute, isAdmin, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const result = await db.collection('stores').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: 'rejected' } });
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Store not found' });
        res.status(200).json({ success: true, status: 'rejected' });
    } catch (e) { res.status(500).json({ message: (e as Error).message }) }
});

app.post('/api/admin/stores/:id/toggle-status', protectRoute, isAdmin, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const store = await db.collection('stores').findOne({ _id: new ObjectId(req.params.id) });
        if (!store) return res.status(404).json({ message: 'Store not found' });
        const newStatus = store.status === 'active' ? 'suspended' : 'active';
        await db.collection('stores').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: newStatus } });
        res.status(200).json({ success: true, status: newStatus });
    } catch (e) { res.status(500).json({ message: (e as Error).message }) }
});

app.post('/api/admin/stores/:id/warn', protectRoute, isAdmin, async (req, res) => {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });
    try {
        const db = await connectToDatabase();
        const newWarning = { id: new ObjectId().toHexString(), date: new Date().toISOString(), reason };
        const result = await db.collection('stores').updateOne({ _id: new ObjectId(req.params.id) }, { $push: { warnings: newWarning } });
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Store not found' });
        res.status(200).json({ success: true, newWarning });
    } catch (e) { res.status(500).json({ message: (e as Error).message }) }
});

app.put('/api/admin/stores/:storeId/documents', protectRoute, isAdmin, async (req, res) => {
    const { storeId } = req.params;
    const { documentName, status, reason } = req.body;
    try {
        const db = await connectToDatabase();
        const result = await db.collection('stores').updateOne(
            { _id: new ObjectId(storeId), "documents.name": documentName },
            { $set: { "documents.$.status": status, "documents.$.rejectionReason": reason || null } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Store or document not found' });
        res.status(200).json({ success: true });
    } catch (e) { res.status(500).json({ message: (e as Error).message }) }
});

app.post('/api/admin/stores/:id/toggle-certification', protectRoute, isAdmin, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const store = await db.collection('stores').findOne({ _id: new ObjectId(req.params.id) });
        if (!store) return res.status(404).json({ message: 'Store not found' });
        const isCertified = !store.isCertified;
        await db.collection('stores').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { isCertified } });
        res.status(200).json({ success: true, isCertified });
    } catch (e) { res.status(500).json({ message: (e as Error).message }) }
});


// --- ADMIN USER MANAGEMENT ---
app.patch('/api/admin/users/:id', protectRoute, isAdmin, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const allowed = ['name', 'role', 'depotId', 'zoneId'];
    const finalUpdates = Object.keys(updates).reduce((acc, key) => {
        if(allowed.includes(key)) (acc as any)[key] = updates[key as keyof typeof updates];
        return acc;
    }, {} as Partial<User>);

    if (Object.keys(finalUpdates).length === 0) return res.status(400).json({ message: 'No valid update fields.' });

    try {
        const db = await connectToDatabase();
        const result = await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: finalUpdates });
        if (result.matchedCount === 0) return res.status(404).json({ message: 'User not found' });
        const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
        res.json({ ...updatedUser, id: updatedUser!._id.toHexString() });
    } catch (e) { res.status(500).json({ message: (e as Error).message }) }
});

app.post('/api/admin/users', protectRoute, isAdmin, async (req, res) => {
    const { name, email, role } = req.body;
    const tempPassword = Math.random().toString(36).slice(-8);
    try {
        const db = await connectToDatabase();
        if (await db.collection('users').findOne({ email })) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const newUser: Omit<User, 'id'> = { name, email, password: hashedPassword, role, loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } };
        const result = await db.collection('users').insertOne(newUser);
        const createdUser = { ...newUser, id: result.insertedId.toHexString() };
        delete (createdUser as any).password;
        console.log(`Temp password for ${email}: ${tempPassword}`);
        res.status(201).json({ newUser: createdUser });
    } catch (e) { res.status(500).json({ message: (e as Error).message }) }
});


app.post('/api/orders', protectRoute, async (req: Request, res: Response) => {
    const orderData = req.body;
    try {
        const db = await connectToDatabase();
        const newOrder = {
            ...orderData,
            orderDate: new Date().toISOString(),
            status: 'confirmed',
            trackingNumber: `KZ${Date.now()}`,
        };
        const result = await db.collection('orders').insertOne(newOrder);
        res.status(201).json({ ...newOrder, _id: result.insertedId });
    } catch (error) {
        console.error("Error in /api/orders:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- STATIC FILES & SPA CATCH-ALL ---
// Serve static files from the project root for local development.
// On Vercel, this is handled automatically.
if (isDev) {
    app.use(express.static(rootPath));

    // Serve bundle.js with the correct MIME type
    app.get('/bundle.js', (req, res) => {
        res.sendFile(path.join(rootPath, 'bundle.js'), {
            headers: {
                'Content-Type': 'application/javascript'
            }
        });
    });

    app.get('*', (req: Request, res: Response) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(rootPath, 'index.html'));
        } else {
            res.status(404).json({ message: "API endpoint not found" });
        }
    });
}


// Start server only for local development
if (isDev) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(`🚀 Server running at: http://localhost:${PORT}`);
        console.log(`=================================================\n`);
    });
}


export default app;
