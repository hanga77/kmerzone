import mongoose from 'mongoose';
const { Schema } = mongoose;

const chatSchema = new Schema({
    participantIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    participantNames: { type: Map, of: String },
    productContext: {
        id: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        imageUrl: String,
    },
    sellerStoreInfo: {
        physicalAddress: String,
        location: String,
        neighborhood: String,
    },
    lastMessageTimestamp: { type: Date, default: Date.now },
    unreadCount: { type: Map, of: Number, default: {} },
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
