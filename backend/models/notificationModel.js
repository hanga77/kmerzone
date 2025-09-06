import mongoose from 'mongoose';
const { Schema } = mongoose;

const notificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    link: {
        page: String,
        params: Schema.Types.Mixed,
    },
    isRead: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'timestamp' } });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
