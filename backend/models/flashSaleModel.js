import mongoose from 'mongoose';
const { Schema } = mongoose;

const flashSaleProductSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sellerShopName: { type: String, required: true },
    flashPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
}, { _id: false });

const flashSaleSchema = new Schema({
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    products: [flashSaleProductSchema],
}, { timestamps: true });

const FlashSale = mongoose.model('FlashSale', flashSaleSchema);
export default FlashSale;
