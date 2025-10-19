// FIX: Changed to standard ES module import for Express to resolve type errors.
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// FIX: Import process to resolve type error for process.exit.
import process from 'process';
import path from 'path';
import esbuild from 'esbuild';
import type { User } from '../types';
import * as initialData from './data';

dotenv.config();

const isDev = process.argv.includes('--dev');
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

let db: any;
let isDbConnected = false;

MongoClient.connect(MONGO_URI)
    .then(client => {
        console.log('Connected to Database');
        db = client.db();
        isDbConnected = true;
    })
    .catch(error => {
        console.error(error);
        if (error.name === 'MongoServerSelectionError') {
            console.error("\n---[ Erreur de Connexion MongoDB ]---");
            console.error("Impossible de se connecter à la base de données. L'application va démarrer avec des données de secours.");
            console.error("Pour une fonctionnalité complète, veuillez résoudre les problèmes suivants :");
            console.error("1. Votre adresse IP n'est pas autorisée : Dans MongoDB Atlas, allez dans 'Network Access' et ajoutez votre adresse IP actuelle.");
            console.error("2. Chaîne de connexion incorrecte : Vérifiez la variable MONGO_URI dans votre fichier .env.");
            console.error("3. Cluster en pause : Assurez-vous que votre cluster MongoDB Atlas est actif.");
            console.error("-------------------------------------\n");
        }
    });

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

// --- API ROUTES ---
// FIX: Define all API routes *before* serving static files.
app.get('/api/all-data', async (req: Request, res: Response) => {
    if (!isDbConnected) {
        console.warn("Database not connected. Serving initial fallback data.");
        const usersWithoutPasswords = initialData.initialUsers.map(({ password, ...user }) => user);

        res.json({
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
            siteActivityLogs: initialData.initialSiteActivityLogs,
            allNotifications: [],
            allTickets: [],
            allAnnouncements: [],
            allZones: initialData.initialZones,
            allUsers: usersWithoutPasswords,
        });
        return;
    }

    try {
        const [
            allProducts, allCategories, allStores, flashSales, allOrders, 
            allPromoCodes, allPickupPoints, allShippingPartners, payouts, 
            siteSettings, siteContent, allAdvertisements, allPaymentMethods, 
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

        res.json({
            allProducts, allCategories, allStores, flashSales, allOrders, 
            allPromoCodes, allPickupPoints, allShippingPartners, payouts, 
            siteSettings, siteContent, allAdvertisements, allPaymentMethods, 
            siteActivityLogs, allNotifications, allTickets, allAnnouncements, 
            allZones, allUsers
        });
    } catch (error) {
        console.error("Error fetching all data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// AUTH ROUTES
app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, password, role, phone, birthDate, address } = req.body;
    try {
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
        const userForToken = { ...newUser, id: result.insertedId, _id: result.insertedId };
        delete (userForToken as any).password;

        const token = jwt.sign({ user: userForToken }, JWT_SECRET!, { expiresIn: '1d' });

        res.status(201).json({ token, user: userForToken });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user = await db.collection('users').findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        
        const userForToken = { ...user };
        delete userForToken.password;
        const token = jwt.sign({ user: userForToken }, JWT_SECRET!, { expiresIn: '1d' });
        res.json({ token, user: userForToken });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/api/orders', protectRoute, async (req: Request, res: Response) => {
    const orderData = req.body;
    try {
        const newOrder = {
            ...orderData,
            orderDate: new Date().toISOString(),
            status: 'confirmed',
            trackingNumber: `KZ${Date.now()}`,
        };
        const result = await db.collection('orders').insertOne(newOrder);
        res.status(201).json({ ...newOrder, _id: result.insertedId });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- STATIC FILES & SPA CATCH-ALL ---
// Serve static files from the project root. This will serve `index.html` for `/`, `bundle.js` for `/bundle.js` etc.
app.use(express.static(rootPath));

// For any other GET request that is not an API route and was not found in the static folder,
// serve the index.html. This is the catch-all for Single Page Applications.
// It MUST be the last route registered.
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(rootPath, 'index.html'));
});

// Start server only if not in a serverless environment (like Vercel)
if (process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_ENV !== 'preview') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(`🚀 Server running at: http://localhost:${PORT}`);
        console.log(`=================================================\n`);
    });
}


export default app;