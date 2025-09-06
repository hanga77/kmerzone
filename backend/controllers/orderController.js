import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res, next) => {
    const { items, shippingAddress, subtotal, deliveryFee, total, deliveryMethod, pickupPointId, appliedPromoCode, deliveryTimeSlot } = req.body;

    if (!items || items.length === 0) {
        res.status(400);
        return next(new Error('No order items'));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        for (const item of items) {
            const product = await Product.findById(item.id).session(session);
            if (!product) {
                throw new Error(`Product not found: ${item.name}`);
            }

            if (item.selectedVariant) {
                const variantDetail = product.variantDetails.find(vd => {
                     const vdKeys = Object.keys(vd.options);
                     const selectedKeys = Object.keys(item.selectedVariant);
                     if (vdKeys.length !== selectedKeys.length) return false;
                     return vdKeys.every(key => vd.options[key] === item.selectedVariant[key]);
                });
                if (!variantDetail || variantDetail.stock < item.quantity) {
                    throw new Error(`Not enough stock for variant of ${item.name}.`);
                }
                variantDetail.stock -= item.quantity;
            } else {
                if (product.stock < item.quantity) {
                    throw new Error(`Not enough stock for ${item.name}. Only ${product.stock} available.`);
                }
                product.stock -= item.quantity;
            }
            
            await product.save({ session });
        }
        
        const orderItemsForDb = items.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            imageUrls: item.imageUrls,
            vendor: item.vendor,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant,
            weight: item.weight,
            additionalShippingFee: item.additionalShippingFee,
        }));

        const order = new Order({
            userId: req.user._id,
            items: orderItemsForDb,
            shippingAddress,
            subtotal,
            deliveryFee,
            total,
            deliveryMethod,
            pickupPointId,
            appliedPromoCode,
            deliveryTimeSlot,
            trackingNumber: `KZ${Date.now()}`,
            status: 'confirmed',
            trackingHistory: [{
                status: 'confirmed',
                date: new Date(),
                location: 'System',
                details: 'Order confirmed and awaiting seller preparation.'
            }],
            statusChangeLog: [{
                status: 'confirmed',
                date: new Date(),
                changedBy: `Customer: ${req.user.name}`
            }]
        });

        const createdOrder = await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(createdOrder);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400);
        next(error);
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('userId', 'name email');

        if (order) {
            if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
                res.status(403);
                throw new Error('Not authorized to view this order');
            }
            res.json(order);
        } else {
            res.status(404);
            throw new Error('Order not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel an order by the user
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelMyOrder = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const order = await Order.findById(req.params.id).session(session);

        if (!order) {
            res.status(404); throw new Error('Order not found');
        }
        if (order.userId.toString() !== req.user._id.toString()) {
            res.status(403); throw new Error('Not authorized to cancel this order');
        }
        if (!['confirmed', 'ready-for-pickup'].includes(order.status)) {
            res.status(400); throw new Error(`Order cannot be cancelled in its current state (${order.status})`);
        }

        order.status = 'cancelled';
        order.statusChangeLog.push({
            status: 'cancelled', date: new Date(), changedBy: `Customer: ${req.user.name}`
        });

        // Revert stock counts
        for (const item of order.items) {
            const product = await Product.findById(item.productId).session(session);
            if (product) {
                if (item.selectedVariant) {
                    const variantDetail = product.variantDetails.find(vd => {
                         const vdKeys = Object.keys(vd.options);
                         const selectedKeys = Object.keys(item.selectedVariant);
                         return vdKeys.length === selectedKeys.length && vdKeys.every(key => vd.options[key] === item.selectedVariant[key]);
                    });
                    if (variantDetail) variantDetail.stock += item.quantity;
                } else {
                    product.stock += item.quantity;
                }
                await product.save({ session });
            }
        }

        const updatedOrder = await order.save({ session });
        await session.commitTransaction();
        session.endSession();
        res.json(updatedOrder);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc    Request a refund for an order by the user
// @route   POST /api/orders/:id/refund
// @access  Private
const requestRefundForMyOrder = async (req, res, next) => {
    const { reason, evidenceUrls } = req.body;
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) { res.status(404); throw new Error('Order not found'); }
        if (order.userId.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized for this order'); }
        if (order.status !== 'delivered') { res.status(400); throw new Error('Can only request a refund for delivered orders.'); }

        order.status = 'refund-requested';
        order.refundReason = reason;
        order.refundEvidenceUrls = evidenceUrls || [];
        
        order.disputeLog.push({ author: 'customer', message: `Demande de remboursement: ${reason}`, date: new Date() });
        order.statusChangeLog.push({ status: 'refund-requested', date: new Date(), changedBy: `Customer: ${req.user.name}` });

        const updatedOrder = await order.save();
        res.json(updatedOrder);

    } catch (error) {
        next(error);
    }
};

// @desc    Add a message to a dispute log
// @route   POST /api/orders/:id/dispute
// @access  Private
const addDisputeMessage = async (req, res, next) => {
    const { message } = req.body;
    try {
        const order = await Order.findById(req.params.id);

        if (!order) { res.status(404); throw new Error('Order not found'); }
        
        // Authorization check: Must be customer or part of the order as a seller, or admin
        const isCustomer = order.userId.toString() === req.user._id.toString();
        const isSellerInOrder = order.items.some(item => item.vendor === req.user.shopName);

        if (!isCustomer && !isSellerInOrder && req.user.role !== 'superadmin') {
            res.status(403); throw new Error('Not authorized for this order');
        }

        order.disputeLog.push({
            author: req.user.role,
            message: message,
            date: new Date()
        });

        const updatedOrder = await order.save();
        res.json(updatedOrder);

    } catch(error) {
        next(error);
    }
}

export {
    addOrderItems,
    getOrderById,
    getMyOrders,
    cancelMyOrder,
    requestRefundForMyOrder,
    addDisputeMessage
};