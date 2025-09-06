import Category from '../models/categoryModel.js';
import Store from '../models/storeModel.js';
import Product from '../models/productModel.js';
import FlashSale from '../models/flashSaleModel.js';
import PickupPoint from '../models/pickupPointModel.js';

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
        const pageSize = parseInt(req.query.limit) || 12;
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