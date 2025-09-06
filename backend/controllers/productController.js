import Product from '../models/productModel.js';
import Store from '../models/storeModel.js';
import Category from '../models/categoryModel.js';

// @desc    Fetch all products with advanced filtering
// @route   GET /api/public/products (moved to publicController)
// @access  Public
const getProducts = async (req, res, next) => {
    // This is now handled by publicController. This file only contains protected CRUD.
    res.status(404).json({ message: 'This endpoint is deprecated. Use /api/public/products' });
};


// @desc    Fetch single product
// @route   GET /api/public/products/:id (moved to publicController)
// @access  Public
const getProductById = async (req, res, next) => {
     // This is now handled by publicController. This file only contains protected CRUD.
     res.status(404).json({ message: 'This endpoint is deprecated. Use /api/public/products/:id' });
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Seller or SuperAdmin
const createProduct = async (req, res, next) => {
    try {
        const store = await Store.findOne({ userId: req.user._id });
        if (!store && req.user.role !== 'superadmin') {
            res.status(404);
            throw new Error('Store not found for this user.');
        }

        const product = new Product({
            ...req.body,
            vendor: store.name, // Set vendor from user's store
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Seller or SuperAdmin
const updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }
        
        // Authorization check
        if (req.user.role !== 'superadmin') {
            const store = await Store.findOne({ userId: req.user._id });
            if (!store || product.vendor !== store.name) {
                res.status(403);
                throw new Error('User not authorized to update this product');
            }
        }
        
        Object.assign(product, req.body);
        const updatedProduct = await product.save();
        res.json(updatedProduct);

    } catch (error) {
        next(error);
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Seller or SuperAdmin
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        // Authorization check
        if (req.user.role !== 'superadmin') {
            const store = await Store.findOne({ userId: req.user._id });
            if (!store || product.vendor !== store.name) {
                res.status(403);
                throw new Error('User not authorized to delete this product');
            }
        }

        await product.deleteOne();
        res.json({ message: 'Product removed' });
        
    } catch (error) {
        next(error);
    }
};

export {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};