import Category from '../models/categoryModel.js';
import Store from '../models/storeModel.js';
import Product from '../models/productModel.js';
import FlashSale from '../models/flashSaleModel.js';
import PickupPoint from '../models/pickupPointModel.js';
import Advertisement from '../models/advertisementModel.js';

// @desc    Get all categories
// @route   GET /api/public/categories
// @access  Public
export const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all active stores
// @route   GET /api/public/stores
// @access  Public
export const getActiveStores = async (req, res, next) => {
    try {
        const stores = await Store.find({ status: 'active' });
        res.json(stores);
    } catch (error) {
        next(error);
    }
};

// @desc    Get store by name
// @route   GET /api/public/stores/:name
// @access  Public
export const getStoreByName = async (req, res, next) => {
    try {
        const store = await Store.findOne({ name: req.params.name, status: 'active' });
        if (store) {
            res.json(store);
        } else {
            res.status(404);
            throw new Error('Store not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get active flash sales
// @route   GET /api/public/flash-sales
// @access  Public
export const getActiveFlashSales = async (req, res, next) => {
    try {
        const now = new Date();
        const flashSales = await FlashSale.find({
            startDate: { $lte: now },
            endDate: { $gte: now },
        });
        res.json(flashSales);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all pickup points
// @route   GET /api/public/pickup-points
// @access  Public
export const getPickupPoints = async (req, res, next) => {
    try {
        const pickupPoints = await PickupPoint.find({});
        res.json(pickupPoints);
    } catch (error) {
        next(error);
    }
};

// @desc    Fetch all products with advanced filtering
// @route   GET /api/public/products
// @access  Public
export const getProducts = async (req, res, next) => {
    try {
        const pageSize = parseInt(req.query.limit) || 50; // Return more products by default
        const page = parseInt(req.query.page) || 1;

        const filter = { status: 'published' };

        if (req.query.keyword) {
            const keyword = req.query.keyword.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            filter.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { vendor: { $regex: keyword, $options: 'i' } },
                { brand: { $regex: keyword, $options: 'i' } },
            ];
        }

        if (req.query.categoryId) {
            const category = await Category.findById(req.query.categoryId);
            if (category) {
                const subCategories = await Category.find({ parentId: category._id });
                const categoryIds = [category._id, ...subCategories.map(c => c._id)];
                filter.categoryId = { $in: categoryIds };
            }
        }
        
        const count = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ createdAt: -1 });

        res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        next(error);
    }
};

// @desc    Fetch single product
// @route   GET /api/public/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product && product.status === 'published') {
            res.json(product);
        } else {
            res.status(404);
            throw new Error('Product not found or not published');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get active advertisements
// @route   GET /api/public/advertisements
// @access  Public
export const getAdvertisements = async (req, res, next) => {
    try {
        const ads = await Advertisement.find({ isActive: true });
        res.json(ads);
    } catch (error) {
        next(error);
    }
};

// These are temporarily static until a model is created
const initialPaymentMethods = [
    { id: 'pm1', name: 'Orange Money', imageUrl: 'data:image/svg+xml;utf8,<svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-label="Orange Money Logo"><rect width="64" height="40" rx="4" fill="%23FF7900"/><text x="32" y="22" font-family="Helvetica, Arial, sans-serif" font-size="9" font-weight="bold" fill="white" text-anchor="middle">ORANGE</text><text x="32" y="31" font-family="Helvetica, Arial, sans-serif" font-size="9" font-weight="bold" fill="white" text-anchor="middle">MONEY</text><rect x="8" y="8" width="10" height="7" rx="2" fill="white" fill-opacity="0.8"/></svg>' },
    { id: 'pm2', name: 'MTN MoMo', imageUrl: 'data:image/svg+xml;utf8,<svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-label="MTN Mobile Money Logo"><rect width="64" height="40" rx="4" fill="%23FFCC00"/><text x="32" y="26" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="bold" fill="%23004F9F" text-anchor="middle">MoMo</text><rect x="8" y="8" width="10" height="7" rx="2" fill="%23004F9F" fill-opacity="0.8"/></svg>' },
    { id: 'pm3', name: 'Visa', imageUrl: 'data:image/svg+xml;utf8,<svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-label="Visa Logo"><rect width="64" height="40" rx="4" fill="white" stroke="%23E0E0E0"/><path d="M24.7,25.8h-3.4L17.6,14h3.8l2,7.1c0.4,1.6,0.6,2.7,0.8,3.6h0.1c0.2-0.9,0.5-2.1,0.8-3.6l2-7.1h3.7L24.7,25.8z M45.1,14.2c-0.8-0.2-1.9-0.5-3.1-0.5c-3.1,0-5.4,1.7-5.4,4.2c0,2.1,1.7,3.4,3.1,4.1c1.4,0.6,1.9,1,1.9,1.6c0,0.8-0.9,1.2-2.1,1.2c-1.6,0-2.4-0.3-3.3-0.6l-0.5-0.2l-0.6,3.2c0.8,0.3,2.3,0.5,4,0.5c3.3,0,5.6-1.7,5.6-4.4c0-2.6-1.9-3.7-3.4-4.4c-1.3-0.6-1.7-1-1.7-1.5c0-0.5,0.6-1.1,2-1.1c1.3,0,2.1,0.3,2.8,0.6l0.4,0.2L45.1,14.2z M47,14h-3.1l-2.1,11.8h3.8L47,14z M14.8,14.2l-3,11.6h3.7l3-11.6H14.8z" fill="%23142688" /></svg>' },
    { id: 'pm4', name: 'Mastercard', imageUrl: 'data:image/svg+xml;utf8,<svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard Logo"><rect width="64" height="40" rx="4" fill="white" stroke="%23E0E0E0"/><circle cx="26" cy="20" r="8" fill="%23EA001B"/><circle cx="38" cy="20" r="8" fill="%23F79E1B"/><path d="M32,20 a8,8 0 0,1 -6,-1.41a8,8 0 0,0 0,2.82a8,8 0 0,1 6,1.41a8,8 0 0,0 6,-1.41a8,8 0 0,1 0,-2.82A8,8 0 0,0 32,20Z" fill="%23FF5F00" /></svg>' },
    { id: 'pm5', name: 'PayPal', imageUrl: 'data:image/svg+xml;utf8,<svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal Logo"><rect width="64" height="40" rx="4" fill="%23003087"/><path fill="white" d="M32.12,12.62c-2.28-.1-4.2,1.3-4.72,3.42-.64,2.58.74,4.52,2.7,5.2,2.16.76,4.48.3,5.92-1.32,1.26-1.42,1.68-3.32,1-5.12-1.02-3.1-3.6-4.5-5-4.2h.1Z"/><path fill="%23009cde" d="M29.1,19.2c-.52,2.12,1.02,4,2.94,4.54,2.14.6,4.5.1,5.9-1.52.92-1.04,1.2-2.38.74-3.6-.82-2.18-3-3.44-4.9-2.92h.22Z"/></svg>' },
];
const initialSiteContent = [
    { slug: 'about', title: "À propos de KMER ZONE", content: "KMER ZONE est la première plateforme e-commerce camerounaise..." },
    { slug: 'contact', title: "Contactez-nous", content: "Pour toute question, contactez support@kmerzone.com." },
    { slug: 'faq', title: "Foire Aux Questions (FAQ)", content: "Q: Délais de livraison ?\nR: 24h à 72h." },
    { slug: 'careers', title: "Carrières", content: "Rejoignez-nous ! careers@kmerzone.com." },
    { slug: 'sell', title: "Vendre sur KMER ZONE", content: "Augmentez votre visibilité..." },
    { slug: 'training-center', title: "Centre de formation", content: "Bientôt disponible." },
    { slug: 'logistics', title: "Logistique & Livraison", content: "Notre réseau de livreurs..." }
];

export const getPaymentMethods = (req, res) => res.json(initialPaymentMethods);
export const getSiteContent = (req, res) => res.json(initialSiteContent);
