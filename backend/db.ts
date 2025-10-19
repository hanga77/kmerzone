import { MongoClient, Db } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI;
const isDev = process.argv.includes('--dev');

// --- Database Connection Caching for Serverless ---
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<Db | null> { // Allow null return
    if (cachedDb) {
        return cachedDb;
    }
    
    if (!MONGO_URI) {
        if (isDev) {
            console.warn("\n⚠️  WARNING: MONGO_URI is not defined. Running in mock data mode. ⚠️\n");
            return null; // Return null in dev mode to signal mock data usage
        } else {
            console.error("MONGO_URI is not defined in .env file for production.");
            process.exit(1);
        }
    }

    try {
        const client = await MongoClient.connect(MONGO_URI!);
        const db = client.db();
        cachedDb = db;
        console.log("New DB connection established.");
        return db;
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        if (isDev) {
            console.warn("\n⚠️  DB connection failed. Running in mock data mode. ⚠️\n");
            return null;
        }
        throw new Error("Could not connect to database.");
    }
}