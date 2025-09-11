import Ticket from '../models/ticketModel.js';

// @desc    Get logged in user's tickets
// @route   GET /api/tickets
// @access  Private
const getMyTickets = async (req, res, next) => {
    try {
        const tickets = await Ticket.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        res.json(tickets);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new support ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res, next) => {
    const { subject, message, relatedOrderId } = req.body;
    try {
        const newTicket = await Ticket.create({
            userId: req.user._id,
            userName: req.user.name,
            subject,
            relatedOrderId: relatedOrderId || undefined,
            messages: [{
                authorId: req.user._id,
                authorName: req.user.name,
                message: message,
                date: new Date(),
            }],
        });
        res.status(201).json(newTicket);
    } catch (error) {
        next(error);
    }
};

// @desc    Reply to a ticket
// @route   POST /api/tickets/:id/reply
// @access  Private
const replyToTicket = async (req, res, next) => {
    const { message } = req.body;
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            res.status(404);
            throw new Error('Ticket not found');
        }

        // Only the user who created it or an admin can reply
        if (ticket.userId.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
            res.status(403);
            throw new Error('Not authorized to reply to this ticket');
        }

        ticket.messages.push({
            authorId: req.user._id,
            authorName: req.user.name,
            message,
            date: new Date(),
        });
        
        // If an admin replies, status is 'En cours'. If user replies, it's 'Ouvert'.
        ticket.status = req.user.role === 'superadmin' ? 'En cours' : 'Ouvert';
        ticket.updatedAt = new Date();

        const updatedTicket = await ticket.save();
        res.json(updatedTicket);

    } catch (error) {
        next(error);
    }
};

export { getMyTickets, createTicket, replyToTicket };