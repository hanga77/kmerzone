import mongoose from 'mongoose';
const { Schema } = mongoose;

const warningSchema = new Schema({
    date: { type: Date, required: true },
    reason: { type: String, required: true },
});

const requestedDocumentSchema = new Schema({
    name: { type: String, required: true },
    status: {
        type: String,
        enum: ['requested', 'uploaded', 'verified', 'rejected'],
        required: true,
    },
    fileUrl: String,
    rejectionReason: String,
});

const storySchema = new Schema({
    imageUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '24h' },
});

const productCollectionSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
});

const storeSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, unique: true },
    logoUrl: { type: String, required: true },
    bannerUrl: String,
    category: { type: String, required: true },
    warnings: [warningSchema],
    status: {
        type: String,
        enum: ['active', 'suspended', 'pending'],
        default: 'pending',
    },
    location: { type: String, required: true },
    neighborhood: { type: String, required: true },
    sellerFirstName: { type: String, required: true },
    sellerLastName: { type: String, required: true },
    sellerPhone: { type: String, required: true },
    physicalAddress: { type: String, required: true },
    documents: [requestedDocumentSchema],
    latitude: Number,
    longitude: Number,
    subscriptionStatus: {
        type: String,
        enum: ['active', 'overdue', 'inactive'],
        default: 'inactive',
    },
    subscriptionDueDate: Date,
    stories: [storySchema],
    premiumStatus: {
        type: String,
        enum: ['standard', 'premium'],
        default: 'standard',
    },
    visits: { type: Number, default: 0 },
    collections: [productCollectionSchema],
}, { timestamps: true });

const Store = mongoose.model('Store', storeSchema);
export default Store;
