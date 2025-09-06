import Store from '../models/storeModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import PromoCode from '../models/promoCodeModel.js';
import FlashSale from '../models/flashSaleModel.js';
import Payout from '../models/payoutModel.js';

// @desc    Apply to become a seller
// @route   POST /api/seller/apply
// @access  Private
const becomeSeller = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'customer') {
            res.status(400);
            throw new Error('Only customers can apply to become sellers.');
        }

        const existingStore = await Store.findOne({ userId: req.user._id });
        if (existingStore) {
            res.status(400);
            throw new Error('You already have a store application.');
        }

        const { shopName, location, neighborhood, sellerFirstName, sellerLastName, sellerPhone, physicalAddress, logoUrl, latitude, longitude, documents } = req.body;
        
        const store = await Store.create({
            name: shopName, location, neighborhood, sellerFirstName, sellerLastName, sellerPhone, physicalAddress, logoUrl, latitude, longitude, documents,
            userId: req.user._id,
            status: 'pending',
        });

        user.shopName = store.name;
        await user.save();

        res.status(201).json(store);
    } catch (error) {
        next(error);
    }
};

// @desc    Get the logged in seller's store data
// @route   GET /api/seller/profile
// @access  Private/Seller
const getMyStore = async (req, res, next) => {
    try {
        const store = await Store.findOne({ userId: req.user._id });
        if (!store) {
            res.status(404);
            throw new Error('Store not found for this seller.');
        }
        res.json(store);
    } catch (error) {
        next(error);
    }
};

// @desc    Update seller's own store profile
// @route   PUT /api/seller/profile
// @access  Private/Seller
const updateMyStore = async (req, res, next) => {
    try {
        const store = await Store.findOne({ userId: req.user._id });

        if (store) {
            Object.assign(store, req.body);
            const updatedStore = await store.save();
            res.json(updatedStore);
        } else {
            res.status(404);
            throw new Error('Store not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get all products for the logged in seller
// @route   GET /api/seller/products
// @access  Private/Seller
const getMyProducts = async (req, res, next) => {
    try {
        const products = await Product.find({ vendor: req.user.shopName });
        res.json(products);
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk update products
// @route   PUT /api/seller/products/bulk-update
// @access  Private/Seller
const bulkUpdateProducts = async (req, res, next) => {
    const updates = req.body; // Array of { id, price, stock }
    try {
        const productIds = updates.map(u => u.id);
        const productsToUpdate = await Product.find({ _id: { $in: productIds }, vendor: req.user.shopName });

        if (productsToUpdate.length !== productIds.length) {
            res.status(403);
            throw new Error('Attempted to update products not belonging to this store.');
        }

        const bulkOps = updates.map(update => ({
            updateOne: {
                filter: { _id: update.id },
                update: { $set: { price: update.price, stock: update.stock } }
            }
        }));

        await Product.bulkWrite(bulkOps);
        res.json({ message: `${updates.length} products updated successfully.` });
    } catch (error) {
        next(error);
    }
};

// @desc    Reply to a product review
// @route   POST /api/seller/products/:productId/reviews/reply
// @access  Private/Seller
const replyToReview = async (req, res, next) => {
    const { productId } = req.params;
    const { reviewIdentifier, replyText } = req.body; 

    try {
        const product = await Product.findById(productId);
        if (!product || product.vendor !== req.user.shopName) {
            res.status(403);
            throw new Error('Not authorized to reply to this review');
        }

        const review = product.reviews.find(r => 
            r.author === reviewIdentifier.author &&
            new Date(r.date).toISOString().split('T')[0] === new Date(reviewIdentifier.date).toISOString().split('T')[0]
        );
        
        if (!review) {
            res.status(404);
            throw new Error('Review not found');
        }

        review.sellerReply = { text: replyText, date: new Date() };
        await product.save();
        res.json(product);
    } catch (error) {
        next(error);
    }
};


// @desc    Get all orders for the logged in seller
// @route   GET /api/seller/orders
// @access  Private/Seller
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ 'items.vendor': req.user.shopName }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

// @desc    Update an order's status by seller
// @route   PUT /api/seller/orders/:id/status
// @access  Private/Seller
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) { res.status(404); throw new Error('Order not found'); }
        
        const isOrderForSeller = order.items.some(item => item.vendor === req.user.shopName);
        if (!isOrderForSeller) { res.status(403); throw new Error('Not authorized to update this order'); }

        order.status = status;
        order.trackingHistory.push({ status, date: new Date(), details: `Status updated by seller ${req.user.shopName}` });
        order.statusChangeLog.push({ status, date: new Date(), changedBy: `Seller: ${req.user.shopName}` });

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

// @desc    Add a message to a dispute log by seller
// @route   POST /api/seller/orders/:id/dispute
// @access  Private/Seller
const addDisputeMessage = async (req, res, next) => {
    const { message } = req.body;
    try {
        const order = await Order.findById(req.params.id);
        if (!order) { res.status(404); throw new Error('Order not found'); }
        
        const isSellerInOrder = order.items.some(item => item.vendor === req.user.shopName);
        if (!isSellerInOrder) { res.status(403); throw new Error('Not authorized for this order'); }

        order.disputeLog.push({ author: 'seller', message, date: new Date() });
        const updatedOrder = await order.save();
        res.json(updatedOrder);

    } catch(error) {
        next(error);
    }
}

// @desc    Get seller's promo codes
// @route   GET /api/seller/promocodes
// @access  Private/Seller
const getMyPromoCodes = async (req, res, next) => {
    try {
        const promoCodes = await PromoCode.find({ sellerId: req.user._id });
        res.json(promoCodes);
    } catch(error) { next(error); }
};

// @desc    Create a promo code
// @route   POST /api/seller/promocodes
// @access  Private/Seller
const createPromoCode = async (req, res, next) => {
    try {
        const newCode = await PromoCode.create({ ...req.body, sellerId: req.user._id });
        res.status(201).json(newCode);
    } catch (error) { next(error); }
};

// @desc    Delete a promo code
// @route   DELETE /api/seller/promocodes/:code
// @access  Private/Seller
const deletePromoCode = async (req, res, next) => {
    try {
        const code = await PromoCode.findOne({ code: req.params.code, sellerId: req.user._id });
        if (code) {
            await code.deleteOne();
            res.json({ message: 'Promo code deleted' });
        } else {
            res.status(404); throw new Error('Promo code not found');
        }
    } catch (error) { next(error); }
};

// @desc    Propose a product for a flash sale
// @route   POST /api/seller/flash-sales/propose
// @access  Private/Seller
const proposeForFlashSale = async (req, res, next) => {
    const { flashSaleId, productId, flashPrice } = req.body;
    try {
        const flashSale = await FlashSale.findById(flashSaleId);
        if (!flashSale) { res.status(404); throw new Error('Flash sale not found'); }

        const product = await Product.findById(productId);
        if (!product || product.vendor !== req.user.shopName) { res.status(403); throw new Error('Product not found or not owned by seller'); }
        
        flashSale.products.push({ productId, flashPrice, sellerShopName: req.user.shopName, status: 'pending' });
        await flashSale.save();
        res.status(201).json(flashSale);

    } catch (error) { next(error); }
};

// @desc    Upload a document for the store
// @route   POST /api/seller/documents/upload
// @access  Private/Seller
const uploadDocument = async (req, res, next) => {
    const { documentName } = req.body;
    try {
        const store = await Store.findOne({ userId: req.user._id });
        if (!store) { res.status(404); throw new Error('Store not found'); }
        
        const doc = store.documents.find(d => d.name === documentName);
        if (!doc) { res.status(400); throw new Error('Invalid document name for this store'); }

        doc.fileUrl = req.file.path;
        doc.status = 'uploaded';
        await store.save();
        res.json(store);
    } catch(error) { next(error); }
};

// @desc    Add a story
// @route   POST /api/seller/stories
// @access  Private/Seller
const addStory = async (req, res, next) => {
    const { imageUrl } = req.body;
    try {
        const store = await Store.findOne({ userId: req.user._id });
        if (!store) { res.status(404); throw new Error('Store not found'); }
        store.stories.push({ imageUrl, createdAt: new Date() });
        await store.save();
        res.status(201).json(store);
    } catch(error) { next(error); }
};

// @desc    Delete a story
// @route   DELETE /api/seller/stories/:storyId
// @access  Private/Seller
const deleteStory = async (req, res, next) => {
    try {
        const store = await Store.findOne({ userId: req.user._id });
        if (!store) { res.status(404); throw new Error('Store not found'); }
        store.stories.pull({ _id: req.params.storyId });
        await store.save();
        res.json(store);
    } catch(error) { next(error); }
};

// @desc    Get seller's financial overview
// @route   GET /api/seller/finances
// @access  Private/Seller
const getSellerFinances = async (req, res, next) => {
    try {
        const store = await Store.findOne({ userId: req.user._id });
        if (!store) { res.status(404); throw new Error('Store not found'); }
        
        const deliveredOrders = await Order.find({ 'items.vendor': store.name, status: 'delivered' });
        
        let totalRevenue = 0;
        deliveredOrders.forEach(order => {
            order.items.forEach(item => {
                if (item.vendor === store.name) {
                     totalRevenue += item.price * item.quantity;
                }
            });
        });

        // Assuming a fixed commission rate for now. This should come from site settings.
        const COMMISSION_RATE = process.env.COMMISSION_RATE || 10;
        const totalCommission = totalRevenue * (COMMISSION_RATE / 100);
        
        const payouts = await Payout.find({ storeId: store._id });
        const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0);
        
        const currentBalance = totalRevenue - totalCommission - totalPaidOut;

        res.json({
            totalRevenue,
            totalCommission,
            totalPaidOut,
            currentBalance,
            payoutHistory: payouts
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get seller's collections
// @route   GET /api/seller/collections
// @access  Private/Seller
const getCollections = async (req, res, next) => {
    try {
        const store = await Store.findOne({ userId: req.user._id }).select('collections');
        if (!store) { res.status(404); throw new Error('Store not found'); }
        res.json(store.collections);
    } catch (error) {
        next(error);
    }
};

// @desc    Create or update a collection
// @route   POST /api/seller/collections or PUT /api/seller/collections/:id
// @access  Private/Seller
const createOrUpdateCollection = async (req, res, next) => {
    const { name, description, productIds } = req.body;
    const { id } = req.params;
    try {
        const store = await Store.findOne({ userId: req.user._id });
        if (!store) { res.status(404); throw new Error('Store not found'); }

        if (id) { // Update
            const collection = store.collections.id(id);
            if (!collection) { res.status(404); throw new Error('Collection not found'); }
            collection.name = name;
            collection.description = description;
            collection.productIds = productIds;
        } else { // Create
            store.collections.push({ name, description, productIds });
        }
        await store.save();
        res.status(id ? 200 : 201).json(store.collections);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a collection
// @route   DELETE /api/seller/collections/:id
// @access  Private/Seller
const deleteCollection = async (req, res, next) => {
    try {
        const store = await Store.findOne({ userId: req.user._id });
        if (!store) { res.status(404); throw new Error('Store not found'); }
        
        const collection = store.collections.id(req.params.id);
        if (!collection) { res.status(404); throw new Error('Collection not found'); }
        
        store.collections.pull(req.params.id);
        await store.save();
        res.json({ message: 'Collection deleted' });
    } catch (error) {
        next(error);
    }
};

export { 
    becomeSeller,
    getMyStore, 
    updateMyStore,
    getMyProducts,
    bulkUpdateProducts,
    replyToReview, 
    getMyOrders, 
    updateOrderStatus,
    addDisputeMessage,
    getMyPromoCodes,
    createPromoCode,
    deletePromoCode,
    proposeForFlashSale,
    uploadDocument,
    addStory,
    deleteStory,
    getSellerFinances,
    getCollections,
    createOrUpdateCollection,
    deleteCollection
};