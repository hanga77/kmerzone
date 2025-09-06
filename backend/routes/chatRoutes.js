import express from 'express';
import {
    getOrCreateChat,
    getMyChats,
    getChatMessages
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
    .get(getMyChats)
    .post(getOrCreateChat);

router.route('/:chatId/messages')
    .get(getChatMessages);

export default router;