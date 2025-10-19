import { MongoClient, Db } from 'mongodb';
import { exit } from 'process';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI is not defined in .env file.");
    exit(1);
}

// --- Database Connection Caching for Serverless ---
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
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
