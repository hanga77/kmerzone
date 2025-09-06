import mongoose from 'mongoose';
const { Schema } = mongoose;

const promoCodeSchema = new Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    minPurchase: Number,
    validUntil: Date,
    maxUses: Number,
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uses: { type: Number, default: 0 },
}, { timestamps: true });

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
export default PromoCode;
