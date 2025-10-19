import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import * as data from './data.js';
import process from 'process';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI is not defined in your .env file.");
    process.exit(1);
}

const seedDatabase = async () => {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log("Connected to MongoDB.");
        const db = client.db();

        const collectionsToSeed = [
            'users', 'categories', 'products', 'stores', 'flashsales', 
            'pickuppoints', 'shippingpartners', 'sitesettings', 'sitecontent', 
            'advertisements', 'paymentmethods', 'zones', 'orders'
        ];

        for (const collectionName of collectionsToSeed) {
            try {
                await db.collection(collectionName).drop();
                console.log(`Dropped collection: ${collectionName}`);
            } catch (err: any) {
                if (err.codeName !== 'NamespaceNotFound') {
                    throw err;
                }
            }
        }
        
        const usersWithHashedPasswords = await Promise.all(
            data.initialUsers.map(async (user: any) => {
                if (!user.password) {
                    console.warn(`User ${user.email} has no password. Skipping.`);
                    return { ...user, password: '' };
                }
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                return { ...user, password: hashedPassword };
            })
        );
        await db.collection('users').insertMany(usersWithHashedPasswords);
        console.log("Seeded users.");

        await db.collection('categories').insertMany(data.initialCategories);
        console.log("Seeded categories.");
        await db.collection('products').insertMany(data.initialProducts);
        console.log("Seeded products.");
        await db.collection('stores').insertMany(data.initialStores);
        console.log("Seeded stores.");
        await db.collection('flashsales').insertMany(data.initialFlashSales);
        console.log("Seeded flash sales.");
        await db.collection('pickuppoints').insertMany(data.initialPickupPoints);
        console.log("Seeded pickup points.");
        await db.collection('shippingpartners').insertMany(data.initialShippingPartners);
        console.log("Seeded shipping partners.");
        await db.collection('sitesettings').insertOne(data.initialSiteSettings);
        console.log("Seeded site settings.");
        await db.collection('sitecontent').insertMany(data.initialSiteContent);
        console.log("Seeded site content.");
        await db.collection('advertisements').insertMany(data.initialAdvertisements);
        console.log("Seeded advertisements.");
        await db.collection('paymentmethods').insertMany(data.initialPaymentMethods);
        console.log("Seeded payment methods.");
        await db.collection('zones').insertMany(data.initialZones);
        console.log("Seeded zones.");
        await db.collection('orders').insertMany([data.sampleDeliveredOrder, data.sampleDeliveredOrder2, data.sampleDeliveredOrder3, data.sampleNewMissionOrder]);
        console.log("Seeded sample orders.");
        
        console.log("\n✅ Database seeding complete!");

    } catch (error: any) {
        console.error("An error occurred during seeding:", error);
        if (error.name === 'MongoServerSelectionError') {
            console.error("\n---[ Erreur de Connexion MongoDB ]---");
            console.error("Impossible de se connecter à la base de données. Causes possibles :");
            console.error("1. Votre adresse IP n'est pas autorisée : Dans MongoDB Atlas, allez dans 'Network Access' et ajoutez votre adresse IP actuelle.");
            console.error("2. Chaîne de connexion incorrecte : Vérifiez la variable MONGO_URI dans votre fichier .env.");
            console.error("3. Cluster en pause : Assurez-vous que votre cluster MongoDB Atlas est actif.");
            console.error("-------------------------------------\n");
        }
    } finally {
        await client.close();
        console.log("MongoDB connection closed.");
    }
};

seedDatabase();