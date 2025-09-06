import mongoose from 'mongoose';
const { Schema } = mongoose;

const messageSchema = new Schema({
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    censoredText: String,
    isRead: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'timestamp' } });

const Message = mongoose.model('Message', messageSchema);
export default Message;
