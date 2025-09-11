

import Store from '../models/storeModel.js';
import User from '../models/userModel.js';
import Order from '../models/orderModel.js';
import Category from '../models/categoryModel.js';
import Product from '../models/productModel.js';
import FlashSale from '../models/flashSaleModel.js';
import PickupPoint from '../models/pickupPointModel.js';
import Payout from '../models/payoutModel.js';
import Advertisement from '../models/advertisementModel.js';
import Ticket from '../models/ticketModel.js';
import Announcement from '../models/announcementModel.js';

// --- Store Management ---
export const getStores = async (req, res, next) => {
  try {
    const stores = await Store.find({}).populate('userId', 'name email');
    res.json(stores);
  } catch (error) {
    next(error);
  }
};

export const updateStoreStatus = async (req, res, next) => {
    const { status } = req.body;
    try {
        const store = await Store.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!store) { res.status(404); throw new Error('Store not found'); }
        res.json(store);
    } catch (error) { next(error); }
};

export const updateStorePremiumStatus = async (req, res, next) => {
    const { premiumStatus } = req.body;
    try {
        const store = await Store.findByIdAndUpdate(req.params.id, { premiumStatus }, { new: true });
        if (!store) { res.status(404); throw new Error('Store not found'); }
        res.json(store);
    } catch (error) { next(error); }
};


export const rejectStore = async (req, res, next) => {
    try {
        const store = await Store.findByIdAndDelete(req.params.id);
        if (!store) { res.status(404); throw new Error('Store not found'); }
        // Optionally, find the user and revert their role if needed
        await User.findByIdAndUpdate(store.userId, { role: 'customer', shopName: null });
        res.json({ message: 'Store rejected and deleted.' });
    } catch (error) { next(error); }
};

export const warnStore = async (req, res, next) => {
    const { reason } = req.body;
    try {
        const store = await Store.findById(req.params.id);
        if (!store) { res.status(404); throw new Error('Store not found'); }
        store.warnings.push({ reason, date: new Date() });
        await store.save();
        res.json(store);
    } catch (error) { next(error); }
};

export const requestDocument = async (req, res, next) => {
    const { name } = req.body;
    try {
        const store = await Store.findById(req.params.id);
        if (!store) { res.status(404); throw new Error('Store not found'); }
        store.documents.push({ name, status: 'requested' });
        await store.save();
        res.json(store);
    } catch (error) { next(error); }
};

export const verifyDocument = async (req, res, next) => {
    const { status, reason } = req.body;
    const { storeId, docName } = req.params;
    try {
        const store = await Store.findById(storeId);
        if (!store) { res.status(404); throw new Error('Store not found'); }
        const doc = store.documents.find(d => d.name === docName);
        if (!doc) { res.status(404); throw new Error('Document not found'); }
        doc.status = status;
        doc.rejectionReason = reason;
        await store.save();
        res.json(store);
    } catch (error) { next(error); }
};

export const activateSubscription = async (req, res, next) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) { res.status(404); throw new Error('Store not found'); }
        store.subscriptionStatus = 'active';
        store.subscriptionDueDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
        await store.save();
        res.json(store);
    } catch (error) { next(error); }
};

// --- User Management ---
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      res.status(404); throw new Error('User not found');
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch(error) {
        next(error);
    }
};

export const sanctionUser = async (req, res, next) => {
    const { reason } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) { res.status(404); throw new Error('User not found'); }
        user.warnings.push({ reason, date: new Date() });
        await user.save();
        res.json(user);
    } catch (error) { next(error); }
};

// --- Order Management ---
export const getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({}).populate('userId', 'name').sort({ createdAt: -1 });
        res.json(orders);
    } catch(error) { next(error); }
};

export const updateOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if(!order) { res.status(404); throw new Error('Order not found'); }

        const { status } = req.body;
        if(status && status !== order.status) {
            order.status = status;
            order.statusChangeLog.push({ status, date: new Date(), changedBy: `Admin: ${req.user.name}` });
        }
        
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch(error) { next(error); }
};

export const assignAgentToOrder = async (req, res, next) => {
    try {
        const { agentId } = req.body;
        const order = await Order.findById(req.params.id);
        if(!order) { res.status(404); throw new Error('Order not found'); }
        order.agentId = agentId;
        await order.save();
        res.json(order);
    } catch(error) { next(error); }
};

export const resolveRefund = async (req, res, next) => {
    const { resolution } = req.body;
    try {
        const order = await Order.findById(req.params.id);
        if(!order) { res.status(404); throw new Error('Order not found'); }

        const newStatus = resolution === 'approved' ? 'refunded' : order.status;
        order.status = newStatus;
        order.statusChangeLog.push({ status: newStatus, date: new Date(), changedBy: `Admin: ${req.user.name}` });
        order.disputeLog.push({ author: 'admin', message: `Refund request ${resolution}.`, date: new Date() });

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

export const addAdminDisputeMessage = async (req, res, next) => {
    const { message } = req.body;
    try {
        const order = await Order.findById(req.params.id);
        if (!order) { res.status(404); throw new Error('Order not found'); }
        order.disputeLog.push({ author: 'admin', message, date: new Date() });
        await order.save();
        res.json(order.disputeLog);
    } catch (error) {
        next(error);
    }
};

// --- Category & Review Management ---
export const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req, res, next) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json(category);
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if(!category) { res.status(404); throw new Error('Category not found'); }
        res.json(category);
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if(!category) { res.status(404); throw new Error('Category not found'); }
        await category.deleteOne();
        res.json({ message: 'Category deleted' });
    } catch (error) {
        next(error);
    }
};

export const moderateReview = async (req, res, next) => {
    const { productId, reviewId, status } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) { res.status(404); throw new Error('Product not found'); }
        const review = product.reviews.id(reviewId);
        if (!review) { res.status(404); throw new Error('Review not found'); }
        review.status = status;
        await product.save();
        res.json(review);
    } catch (error) {
        next(error);
    }
};


// --- Promotions Management ---
export const getFlashSales = async (req, res, next) => {
    try { res.json(await FlashSale.find({})); } catch (error) { next(error); }
};
export const createFlashSale = async (req, res, next) => {
    try { res.status(201).json(await FlashSale.create(req.body)); } catch (error) { next(error); }
};
export const updateFlashSaleSubmission = async (req, res, next) => {
    try {
        const { productIds, status } = req.body;
        const flashSale = await FlashSale.findById(req.params.saleId);
        if (!flashSale) { res.status(404); throw new Error('Flash sale not found'); }
        flashSale.products.forEach(p => {
            if(productIds.includes(p.productId.toString())) {
                p.status = status;
            }
        });
        await flashSale.save();
        res.json(flashSale);
    } catch (error) { next(error); }
};

// --- Logistics ---
export const getPickupPoints = async (req, res, next) => {
    try { res.json(await PickupPoint.find({})); } catch (error) { next(error); }
};
export const createOrUpdatePickupPoint = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (id) {
            const point = await PickupPoint.findByIdAndUpdate(id, req.body, { new: true });
            res.json(point);
        } else {
            const point = await PickupPoint.create(req.body);
            res.status(201).json(point);
        }
    } catch (error) { next(error); }
};
export const deletePickupPoint = async (req, res, next) => {
    try {
        await PickupPoint.findByIdAndDelete(req.params.id);
        res.json({ message: 'Pickup point deleted' });
    } catch (error) { next(error); }
};


// --- Finance ---
export const getPayouts = async (req, res, next) => {
    try {
        const payouts = await Payout.find({}).sort({ date: -1 });
        res.json(payouts);
    } catch (error) {
        next(error);
    }
};

export const createPayout = async (req, res, next) => {
    try {
        const payout = await Payout.create(req.body);
        res.status(201).json(payout);
    } catch (error) { next(error); }
};

// --- Marketing ---
export const getAdvertisements = async (req, res, next) => { try { res.json(await Advertisement.find({})); } catch(e) { next(e); } };
export const createOrUpdateAdvertisement = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (id) {
            res.json(await Advertisement.findByIdAndUpdate(id, req.body, { new: true }));
        } else {
            res.status(201).json(await Advertisement.create(req.body));
        }
    } catch (e) { next(e); }
};
export const deleteAdvertisement = async (req, res, next) => {
    try {
        await Advertisement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Advertisement deleted' });
    } catch (e) { next(e); }
};

// --- Site Content (simple example, could be a dedicated model for production) ---
let siteContentStore = []; 
export const getSiteContent = (req, res) => res.json(siteContentStore);
export const updateSiteContent = (req, res) => {
    siteContentStore = req.body;
    res.json(siteContentStore);
};

// --- Tickets ---
export const getTickets = async (req, res, next) => { try { res.json(await Ticket.find({}).sort({ updatedAt: -1 })); } catch (e) { next(e); } };
export const replyToTicket = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) { res.status(404); throw new Error('Ticket not found'); }
        ticket.messages.push({ authorId: req.user._id, authorName: req.user.name, message: req.body.message, date: new Date() });
        ticket.status = 'En cours';
        await ticket.save();
        res.json(ticket);
    } catch (e) { next(e); }
};
export const updateTicketStatus = async (req, res, next) => {
    try {
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status: req.body.status, priority: req.body.priority }, { new: true });
        res.json(ticket);
    } catch (e) { next(e); }
};

// --- Announcements ---
export const getAnnouncements = async (req, res, next) => { try { res.json(await Announcement.find({})); } catch(e) { next(e); }};
export const createOrUpdateAnnouncement = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (id) {
            res.json(await Announcement.findByIdAndUpdate(id, req.body, { new: true }));
        } else {
            res.status(201).json(await Announcement.create(req.body));
        }
    } catch (e) { next(e); }
};
export const deleteAnnouncement = async (req, res, next) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Announcement deleted' });
    } catch (e) { next(e); }
};

// --- Payment Methods ---
let paymentMethodsStore = [];
export const getPaymentMethods = (req, res) => res.json(paymentMethodsStore);
export const updatePaymentMethods = (req, res) => {
    paymentMethodsStore = req.body;
    res.json(paymentMethodsStore);
};


// --- Platform Settings & Logs (in-memory for simplicity) ---
let settingsStore = {};
export const getSiteSettings = (req, res) => res.json(settingsStore);
export const updateSiteSettings = (req, res) => {
    settingsStore = req.body;
    res.json(settingsStore);
};

let logStore = [];
export const getSiteActivityLogs = (req, res) => res.json(logStore);
// (Actual logging would be done via middleware, this is just for retrieval)