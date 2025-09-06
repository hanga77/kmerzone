import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Store from '../models/storeModel.js';
import Category from '../models/categoryModel.js';
import Order from '../models/orderModel.js';
import FlashSale from '../models/flashSaleModel.js';
import PromoCode from '../models/promoCodeModel.js';
import Ticket from '../models/ticketModel.js';
import Notification from '../models/notificationModel.js';
import PickupPoint from '../models/pickupPointModel.js';
import Advertisement from '../models/advertisementModel.js';
import Payout from '../models/payoutModel.js';
import Message from '../models/messageModel.js';
import Chat from '../models/chatModel.js';
import Announcement from '../models/announcementModel.js';

import { initialUsers, initialCategories, initialProducts, initialStores } from './initialData.js';
import connectDB from '../config/db.js';

dotenv.config({ path: './backend/.env' });

connectDB();

const importData = async () => {
    try {
        // Clear all existing data
        await destroyData();
        console.log('Previous data destroyed...');

        // 1. Hash passwords and insert users
        const usersWithHashedPasswords = await Promise.all(
            initialUsers.map(async (user) => {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                return { 
                    name: user.name,
                    email: user.email,
                    password: hashedPassword,
                    role: user.role,
                };
            })
        );
        const createdUsers = await User.insertMany(usersWithHashedPasswords);
        console.log(`${createdUsers.length} users imported.`);
        const userMap = new Map(createdUsers.map(u => [u.email, u._id]));

        // 2. Insert Categories and create a map
        // We remove the temporary frontend 'id' before insertion
        const categoriesToCreate = initialCategories.map(({ id, parentId, ...rest }) => rest);
        const createdCategories = await Category.insertMany(categoriesToCreate);
        console.log(`${createdCategories.length} categories imported.`);
        
        // Create a map from the old temp ID to the new mongoose ObjectId
        const categoryTempIdMap = new Map();
        initialCategories.forEach((cat, index) => {
            categoryTempIdMap.set(cat.id, createdCategories[index]._id);
        });

        // Update parentId for subcategories now that we have the real _ids
        for (const initialCat of initialCategories) {
            if (initialCat.parentId) {
                const catId = categoryTempIdMap.get(initialCat.id);
                const parentId = categoryTempIdMap.get(initialCat.parentId);
                if (catId && parentId) {
                    await Category.findByIdAndUpdate(catId, { parentId: parentId });
                }
            }
        }
        console.log('Subcategory parents updated.');

        // 3. Prepare and insert stores
        const storesToCreate = initialStores.map(storeData => {
            const userId = userMap.get(storeData.sellerEmail);
            if (!userId) {
                console.warn(`Could not find user for store: ${storeData.name}`);
                return null;
            }
            // Remove temp frontend ID and linking email
            const { id, sellerEmail, ...rest } = storeData;
            return {
                ...rest,
                userId,
                logoUrl: `https://picsum.photos/seed/${storeData.name.replace(/\s+/g, '')}/200`,
                bannerUrl: `https://picsum.photos/seed/${storeData.name.replace(/\s+/g, '')}Banner/800/200`,
                documents: [
                    { name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' },
                    { name: "Registre de Commerce", status: 'uploaded', fileUrl: '...' },
                ]
            };
        }).filter(Boolean);
        const createdStores = await Store.insertMany(storesToCreate);
        console.log(`${createdStores.length} stores imported.`);

        // Update the user model with the shopName
        for (const store of createdStores) {
            await User.findByIdAndUpdate(store.userId, { shopName: store.name });
        }
        console.log('Users updated with shop names.');

        // 4. Prepare and insert products
        const productsToCreate = initialProducts.map(productData => {
            const categoryId = categoryTempIdMap.get(productData.categoryId);
            if (!categoryId) {
                console.warn(`Could not find category for product: ${productData.name}`);
                return null;
            }
            const { id, ...rest } = productData;
            return {
                ...rest,
                categoryId,
            };
        }).filter(Boolean);
        const createdProducts = await Product.insertMany(productsToCreate);
        console.log(`${createdProducts.length} products imported.`);


        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error during data import: ${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await User.deleteMany();
        await Product.deleteMany();
        await Store.deleteMany();
        await Category.deleteMany();
        await Order.deleteMany();
        await FlashSale.deleteMany();
        await PromoCode.deleteMany();
        await Ticket.deleteMany();
        await Notification.deleteMany();
        await PickupPoint.deleteMany();
        await Advertisement.deleteMany();
        await Payout.deleteMany();
        await Message.deleteMany();
        await Chat.deleteMany();
        await Announcement.deleteMany();

        console.log('Data Destroyed!');
        // Don't exit process if called from importData
    } catch (error) {
        console.error(`Error during data destruction: ${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '--delete') {
    destroyData().then(() => process.exit());
} else {
    importData();
}
