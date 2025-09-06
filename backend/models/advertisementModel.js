import mongoose from 'mongoose';
const { Schema } = mongoose;

const advertisementSchema = new Schema({
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, required: true },
    location: {
        type: String,
        enum: ['homepage-banner'],
        required: true,
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Advertisement = mongoose.model('Advertisement', advertisementSchema);
export default Advertisement;
