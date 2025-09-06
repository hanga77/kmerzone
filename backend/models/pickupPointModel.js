import mongoose from 'mongoose';
const { Schema } = mongoose;

const pickupPointSchema = new Schema({
    name: { type: String, required: true },
    streetNumber: String,
    street: { type: String, required: true },
    additionalInfo: String,
    city: { type: String, required: true },
    neighborhood: { type: String, required: true },
    latitude: Number,
    longitude: Number,
}, { timestamps: true });

const PickupPoint = mongoose.model('PickupPoint', pickupPointSchema);
export default PickupPoint;
