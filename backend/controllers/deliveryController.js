import Order from '../models/orderModel.js';
import User from '../models/userModel.js';

// @desc    Get orders assigned to the delivery agent (missions)
// @route   GET /api/delivery/missions
// @access  Private/DeliveryAgent
const getMyMissions = async (req, res, next) => {
    try {
        const orders = await Order.find({ agentId: req.user._id })
            .where('status').in(['ready-for-pickup', 'picked-up', 'at-depot', 'out-for-delivery'])
            .sort({ createdAt: 'desc' });
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status by delivery agent
// @route   PUT /api/delivery/orders/:id/status
// @access  Private/DeliveryAgent
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status, details, reason, photoUrl } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order || order.agentId?.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this order');
        }

        const validTransitions = {
            'picked-up': ['ready-for-pickup'],
            'at-depot': ['picked-up'],
            'out-for-delivery': ['at-depot'],
            'delivered': ['out-for-delivery'],
            'delivery-failed': ['out-for-delivery'],
        };

        if (validTransitions[status] && !validTransitions[status].includes(order.status)) {
            res.status(400);
            throw new Error(`Cannot change status from ${order.status} to ${status}`);
        }
        
        order.status = status;
        const logDetails = details || `Status updated by delivery agent ${req.user.name}`;
        order.trackingHistory.push({ status, date: new Date(), details: logDetails });
        order.statusChangeLog.push({ status, date: new Date(), changedBy: `Delivery Agent: ${req.user.name}` });

        if (status === 'delivery-failed') {
            order.deliveryFailureReason = { reason, details, date: new Date() };
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);

    } catch (error) {
        next(error);
    }
};

// @desc    Confirm delivery with proof
// @route   POST /api/delivery/orders/:id/confirm
// @access  Private/DeliveryAgent
const confirmDelivery = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order || order.agentId?.toString() !== req.user._id.toString()) {
            res.status(403); throw new Error('Not authorized');
        }

        order.status = 'delivered';
        order.proofOfDeliveryUrl = req.file?.path;
        order.statusChangeLog.push({ status: 'delivered', date: new Date(), changedBy: `Delivery Agent: ${req.user.name}` });

        await order.save();
        res.json(order);
    } catch(error) {
        next(error);
    }
}


// @desc    Update agent's availability
// @route   PUT /api/delivery/availability
// @access  Private/DeliveryAgent
const updateAvailability = async (req, res, next) => {
    try {
        const { status } = req.body;
        const user = await User.findById(req.user._id);
        if (user) {
            user.availabilityStatus = status;
            await user.save();
            res.json({ id: user._id, availabilityStatus: user.availabilityStatus });
        } else {
            res.status(404); throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

export { getMyMissions, updateOrderStatus, updateAvailability, confirmDelivery };