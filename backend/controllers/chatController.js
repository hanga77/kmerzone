import Chat from '../models/chatModel.js';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';
import Store from '../models/storeModel.js';
import Product from '../models/productModel.js';

// @desc    Get or create a chat conversation
// @route   POST /api/chat
// @access  Private
const getOrCreateChat = async (req, res, next) => {
    const { sellerId, productId } = req.body;
    const customerId = req.user._id;

    try {
        if (sellerId === customerId.toString()) {
            res.status(400);
            throw new Error("You cannot start a chat with yourself.");
        }

        let chat = await Chat.findOne({
            participantIds: { $all: [customerId, sellerId] },
            'productContext.id': productId || null,
        });

        if (chat) {
            return res.json(chat);
        }

        const seller = await User.findById(sellerId);
        const store = await Store.findOne({ userId: sellerId });
        const product = productId ? await Product.findById(productId) : null;

        if (!seller || !store) {
            res.status(404);
            throw new Error("Seller or store not found.");
        }

        const newChat = await Chat.create({
            participantIds: [customerId, sellerId],
            participantNames: {
                [customerId]: req.user.name,
                [sellerId]: seller.name,
            },
            productContext: product ? {
                id: product._id,
                name: product.name,
                imageUrl: product.imageUrls[0],
            } : undefined,
            sellerStoreInfo: {
                physicalAddress: store.physicalAddress,
                location: store.location,
                neighborhood: store.neighborhood,
            },
            unreadCount: { [customerId]: 0, [sellerId]: 0 }
        });

        res.status(201).json(newChat);

    } catch (error) {
        next(error);
    }
};

// @desc    Get all chats for the logged-in user
// @route   GET /api/chat
// @access  Private
const getMyChats = async (req, res, next) => {
    try {
        const chats = await Chat.find({ participantIds: req.user._id })
            .sort({ lastMessageTimestamp: -1 });
        res.json(chats);
    } catch (error) {
        next(error);
    }
};

// @desc    Get messages for a specific chat
// @route   GET /api/chat/:chatId/messages
// @access  Private
const getChatMessages = async (req, res, next) => {
    try {
        const chat = await Chat.findById(req.params.chatId);

        if (!chat || !chat.participantIds.includes(req.user._id)) {
            res.status(403);
            throw new Error("User not authorized to view this chat.");
        }

        const messages = await Message.find({ chatId: req.params.chatId })
            .sort({ timestamp: 1 });
            
        // Mark messages as read for the current user
        if (chat.unreadCount.get(req.user._id.toString()) > 0) {
            chat.unreadCount.set(req.user._id.toString(), 0);
            await chat.save();
        }

        res.json(messages);

    } catch (error) {
        next(error);
    }
};


export { getOrCreateChat, getMyChats, getChatMessages };