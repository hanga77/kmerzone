import mongoose from 'mongoose';
const { Schema } = mongoose;

const announcementSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    target: {
        type: String,
        enum: ['all', 'customers', 'sellers'],
        required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
