import mongoose from 'mongoose';
const { Schema } = mongoose;

const ticketMessageSchema = new Schema({
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
});

const ticketSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    subject: { type: String, required: true },
    relatedOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    status: {
        type: String,
        enum: ['Ouvert', 'En cours', 'Résolu'],
        default: 'Ouvert',
    },
    priority: {
        type: String,
        enum: ['Basse', 'Moyenne', 'Haute'],
        default: 'Moyenne',
    },
    messages: [ticketMessageSchema],
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
