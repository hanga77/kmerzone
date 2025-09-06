import mongoose from 'mongoose';
const { Schema } = mongoose;

const payoutSchema = new Schema({
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
}, { timestamps: true });

const Payout = mongoose.model('Payout', payoutSchema);
export default Payout;
