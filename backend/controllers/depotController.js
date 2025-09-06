import Order from '../models/orderModel.js';
import User from '../models/userModel.js';

// @desc    Get all orders currently at the agent's depot
// @route   GET /api/depot/inventory
// @access  Private/DepotAgent
const getDepotInventory = async (req, res, next) => {
    try {
        const depotId = req.user.depotId;
        if (!depotId) {
            res.status(400);
            throw new Error('Agent is not assigned to a depot.');
        }

        const orders = await Order.find({ 
            status: 'at-depot',
            pickupPointId: depotId // Assuming depotId from user matches pickupPointId for simplicity
        });
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

// @desc    Check in an order at the depot
// @route   POST /api/depot/orders/check-in
// @access  Private/DepotAgent
const checkInOrder = async (req, res, next) => {
    const { trackingNumber, storageLocationId, notes } = req.body;
    try {
        const order = await Order.findOne({ trackingNumber });
        if (!order) {
            res.status(404); throw new Error('Order not found');
        }
        if (order.status !== 'picked-up') {
            res.status(400); throw new Error(`Order status is currently '${order.status}', cannot check in.`);
        }

        order.status = 'at-depot';
        order.storageLocationId = storageLocationId;
        order.checkedInAt = new Date();
        order.checkedInBy = req.user._id;
        order.trackingHistory.push({ status: 'at-depot', date: new Date(), details: `Arrived at depot, stored at ${storageLocationId}` });
        order.statusChangeLog.push({ status: 'at-depot', date: new Date(), changedBy: `Depot Agent: ${req.user.name}` });
        
        if (notes) {
            order.discrepancy = {
                reason: `Note at check-in: ${notes}`,
                reportedAt: new Date(),
                reportedBy: req.user._id
            };
        }
        
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

// @desc    Process an order's departure from the depot
// @route   POST /api/depot/orders/process-departure
// @access  Private/DepotAgent
const processDeparture = async (req, res, next) => {
    const { trackingNumber, recipientInfo } = req.body; // recipientInfo for customer pickup
    try {
        const order = await Order.findOne({ trackingNumber });
        if (!order) { res.status(404); throw new Error('Order not found'); }
        if (order.status !== 'at-depot') { res.status(400); throw new Error('Order is not at depot.'); }
        
        let nextStatus;
        if (order.deliveryMethod === 'pickup') {
            order.pickupRecipientName = recipientInfo.name;
            order.pickupRecipientId = recipientInfo.idNumber;
            nextStatus = 'delivered';
        } else {
            nextStatus = 'out-for-delivery';
        }
        
        order.status = nextStatus;
        order.departureProcessedByAgentId = req.user._id;
        order.processedForDepartureAt = new Date();
        order.trackingHistory.push({ status: nextStatus, date: new Date(), details: `Processed for departure by depot agent ${req.user.name}` });
        order.statusChangeLog.push({ status: nextStatus, date: new Date(), changedBy: `Depot Agent: ${req.user.name}` });

        const updatedOrder = await order.save();
        res.json(updatedOrder);

    } catch (error) {
        next(error);
    }
};


// @desc    Report a discrepancy for an order at the depot
// @route   POST /api/depot/orders/discrepancy
// @access  Private/DepotAgent
const reportDiscrepancy = async (req, res, next) => {
    const { trackingNumber, reason } = req.body;
    try {
        const order = await Order.findOne({ trackingNumber });
        if (!order) { res.status(404); throw new Error('Order not found'); }

        order.status = 'depot-issue';
        order.discrepancy = { reason, reportedAt: new Date(), reportedBy: req.user._id };
        order.statusChangeLog.push({ status: 'depot-issue', date: new Date(), changedBy: `Depot Agent: ${req.user.name}` });
        
        await order.save();
        res.json(order);
    } catch (error) {
        next(error);
    }
};

export {
    getDepotInventory,
    checkInOrder,
    processDeparture,
    reportDiscrepancy,
};