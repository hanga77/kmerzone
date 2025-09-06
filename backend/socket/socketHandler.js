import mongoose from 'mongoose';
import Message from '../models/messageModel.js';
import Chat from '../models/chatModel.js';
import { censorText } from '../utils/censor.js';
import { GoogleGenAI } from '@google/genai';

const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

const initializeSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('joinChat', (chatId) => {
            socket.join(chatId);
            console.log(`User ${socket.id} joined chat ${chatId}`);
        });

        socket.on('sendMessage', async (data) => {
            const { chatId, senderId, text, allProducts, allCategories } = data;
            
            try {
                const chat = await Chat.findById(chatId);
                if (!chat) return;

                // Censor and save user message
                const censoredUserText = censorText(text, chat.sellerStoreInfo);
                const userMessage = await Message.create({ chatId, senderId, text, censoredText: censoredUserText });
                
                chat.lastMessageTimestamp = new Date();
                // We don't broadcast the user message back, client adds it optimistically.
                
                // Start Gemini response if AI is configured
                if (ai) {
                    io.to(chatId).emit('typingUpdate', { chatId, isTyping: true });
                    handleGeminiResponse(io, chat, userMessage, allProducts, allCategories);
                } else {
                     const errorMessage = {
                        _id: new mongoose.Types.ObjectId(),
                        chatId: chat._id,
                        senderId: 'assistant-id',
                        text: "Désolé, la fonction de chat n'est pas disponible.",
                        timestamp: new Date(),
                    };
                    io.to(chatId).emit('newMessage', errorMessage);
                }
                
                await chat.save();

            } catch (error) {
                console.error('Error handling message:', error);
                socket.emit('chatError', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};

const handleGeminiResponse = async (io, chat, userMessage, allProducts, allCategories) => {
    try {
        const chatHistory = await Message.find({ chatId: chat._id }).sort({ timestamp: -1 }).limit(10);
        const formattedHistory = chatHistory.reverse().map(msg => 
            `${msg.senderId.toString() === userMessage.senderId.toString() ? 'Customer' : 'Assistant'}: ${msg.text}`
        ).join('\n');

        const getCategoryName = (categoryId) => allCategories.find(c => c.id === categoryId)?.name || 'Inconnue';
        const simplifiedProducts = allProducts.map(p => ({
            id: p.id, name: p.name, price: p.price, vendor: p.vendor, category: getCategoryName(p.categoryId)
        }));
        
        const productContext = chat.productContext ? `The user is asking about this product: ${JSON.stringify(chat.productContext)}.` : '';

        const prompt = `You are a friendly and helpful shopping assistant for KMER ZONE, an e-commerce marketplace in Cameroon.
        Your goal is to help customers find products and answer their questions about the platform.
        Provide concise, helpful answers in French.
        When recommending products, list their name, price, and vendor.
        Your knowledge is limited to the product data provided. Do not invent products or information.
        For your safety, never ask for or provide personal contact information like phone numbers or email addresses. Keep all communication on the platform.

        Here is a simplified product catalog for KMER ZONE:
        ${JSON.stringify(simplifiedProducts.slice(0, 30))}

        ${productContext}

        Here is the recent chat history:
        ${formattedHistory}

        The customer just said: "${userMessage.text}"

        Please provide a helpful response as the KMER ZONE assistant.`;
        
        const assistantMessageId = new mongoose.Types.ObjectId();
        io.to(chat._id.toString()).emit('newMessage', {
            _id: assistantMessageId,
            id: assistantMessageId.toString(),
            chatId: chat._id.toString(),
            senderId: 'assistant-id', // A generic ID for the AI
            text: '', // Start with empty text
            timestamp: new Date().toISOString(),
        });

        const stream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        let fullText = '';
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                io.to(chat._id.toString()).emit('messageChunk', {
                    messageId: assistantMessageId.toString(),
                    chunk: chunkText,
                    chatId: chat._id.toString()
                });
            }
        }
        
        // Censor and save the final message to the database
        const censoredAssistantText = censorText(fullText, chat.sellerStoreInfo);
        await Message.create({
            _id: assistantMessageId,
            chatId: chat._id,
            senderId: 'assistant-id',
            text: fullText,
            censoredText: censoredAssistantText,
            timestamp: new Date()
        });
        
        chat.lastMessageTimestamp = new Date();
        await chat.save();

    } catch (error) {
        console.error("Gemini stream error:", error);
    } finally {
        io.to(chat._id.toString()).emit('typingUpdate', { chatId: chat._id.toString(), isTyping: false });
    }
};

export default initializeSocket;