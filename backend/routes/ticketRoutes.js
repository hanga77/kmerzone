import express from 'express';
import { getMyTickets, createTicket, replyToTicket } from '../controllers/ticketController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.route('/')
    .get(getMyTickets)
    .post(createTicket);

router.route('/:id/reply')
    .post(replyToTicket);

export default router;