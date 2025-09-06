import mongoose from 'mongoose';
const { Schema } = mongoose;

const reviewSchema = new Schema({
    author: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    date: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    sellerReply: {
        text: String,
        date: Date,
    },
});

const variantSchema = new Schema({
    name: { type: String, required: true },
    options: [{ type: String, required: true }],
});

const variantDetailSchema = new Schema({
    options: { type: Map, of: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    price: Number,
    sku: String,
});

const productSchema = new Schema({
    name: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    promotionPrice: Number,
    imageUrls: [{ type: String, required: true }],
    vendor: { type: String, required: true, index: true },
    description: { type: String, required: true },
    reviews: [reviewSchema],
    stock: { type: Number, required: true, default: 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    variants: [variantSchema],
    variantDetails: [variantDetailSchema],
    status: {
        type: String,
        enum: ['published', 'draft', 'archived'],
        default: 'draft',
    },
    additionalShippingFee: Number,
    sku: { type: String, index: true },
    viewCount: { type: Number, default: 0 },
    brand: { type: String, index: true },
    weight: Number,
    dimensions: String,
    material: String,
    gender: { type: String, enum: ['Homme', 'Femme', 'Enfant', 'Unisexe'] },
    color: String,
    promotionStartDate: Date,
    promotionEndDate: Date,
    serialNumber: String,
    productionDate: Date,
    expirationDate: Date,
    modelNumber: String,
    warranty: String,
    operatingSystem: String,
    accessories: String,
    ingredients: String,
    allergens: String,
    storageInstructions: String,
    origin: String,
    assemblyInstructions: String,
    productType: String,
    volume: String,
    skinType: String,
    author: String,
    publisher: String,
    publicationYear: Number,
    isbn: String,
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
