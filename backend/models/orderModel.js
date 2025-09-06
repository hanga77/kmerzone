import mongoose from 'mongoose';
const { Schema } = mongoose;

const orderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrls: [String],
    vendor: { type: String, required: true },
    quantity: { type: Number, required: true },
    selectedVariant: { type: Map, of: String },
    weight: Number,
    additionalShippingFee: Number,
});

const addressSchema = new Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    latitude: Number,
    longitude: Number,
}, { _id: false });

const trackingEventSchema = new Schema({
    status: { type: String, required: true },
    date: { type: Date, required: true },
    location: String,
    details: String,
}, { _id: false });

const disputeMessageSchema = new Schema({
    author: { type: String, enum: ['admin', 'seller', 'customer'], required: true },
    message: { type: String, required: true },
    date: { type: Date, required: true },
}, { _id: false });

const statusChangeLogSchema = new Schema({
    status: { type: String, required: true },
    date: { type: Date, required: true },
    changedBy: { type: String, required: true },
}, { _id: false });

const orderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },
    shippingAddress: { type: addressSchema, required: true },
    deliveryMethod: { type: String, enum: ['pickup', 'home-delivery'], required: true },
    deliveryTimeSlot: String,
    pickupPointId: { type: Schema.Types.ObjectId, ref: 'PickupPoint' },
    appliedPromoCode: {
        code: String,
        discountType: String,
        discountValue: Number,
    },
    status: {
        type: String,
        enum: ['confirmed', 'ready-for-pickup', 'picked-up', 'at-depot', 'out-for-delivery', 'delivered', 'cancelled', 'refund-requested', 'refunded', 'returned', 'depot-issue', 'delivery-failed'],
        default: 'confirmed',
    },
    orderDate: { type: Date, default: Date.now },
    trackingNumber: { type: String, unique: true },
    cancellationFee: Number,
    refundReason: String,
    refundEvidenceUrls: [String],
    trackingHistory: [trackingEventSchema],
    agentId: { type: Schema.Types.ObjectId, ref: 'User' },
    storageLocationId: String,
    checkedInAt: Date,
    checkedInBy: { type: Schema.Types.ObjectId, ref: 'User' },
    discrepancy: {
        reason: String,
        reportedAt: Date,
        reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    disputeLog: [disputeMessageSchema],
    statusChangeLog: [statusChangeLogSchema],
    deliveryFailureReason: {
        reason: { type: String, enum: ['client-absent', 'adresse-erronee', 'colis-refuse'] },
        details: String,
        date: Date,
    },
    departureProcessedByAgentId: { type: Schema.Types.ObjectId, ref: 'User' },
    processedForDepartureAt: Date,
    pickupRecipientName: String,
    pickupRecipientId: String,
    proofOfDeliveryUrl: String,
    signatureUrl: String,
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
