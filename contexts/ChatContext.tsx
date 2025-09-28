import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { Chat, Message, Product, User, Store, Category } from '../types';
import { useAuth } from './AuthContext';
import { GoogleGenAI } from '@google/genai';

interface ChatContextType {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  startChat: (seller: User, store: Store, product?: Product) => void;
  sendMessage: (chatId: string, text: string, allProducts: Product[], allCategories: Category[]) => void;
  setActiveChatId: (chatId: string | null) => void;
  activeChatId: string | null;
  isWidgetOpen: boolean;
  setIsWidgetOpen: (isOpen: boolean) => void;
  totalUnreadCount: number;
  isTyping: Record<string, boolean>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const initialChats: Chat[] = [];
const initialMessages: { [chatId: string]: Message[] } = {};

// Regex for phone numbers (Cameroon and general international)
const phoneRegex = /\b(\+?237\s*)?([6-9])([\s.-]*\d){8}\b|\b(?:\+\d{1,3}\s*)?(?:\d[\s-]*){8,}\d\b/g;
// Regex for email addresses
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const censorText = (text: string, storeInfo?: Chat['sellerStoreInfo']): string => {
    let censoredText = text.replace(phoneRegex, '***');
    censoredText = censoredText.replace(emailRegex, '***');

    if (storeInfo) {
      // Create a set of unique keywords from the store's location, including neighborhood
      const locationKeywords = new Set([
        ...storeInfo.physicalAddress.toLowerCase().split(/[\s,.-]+/),
        ...(storeInfo.neighborhood ? storeInfo.neighborhood.toLowerCase().split(/[\s,.-]+/) : []),
        ...storeInfo.location.toLowerCase().split(/[\s,.-]+/) // city
      ]);
      
      // Filter out small or common words to avoid false positives
      const commonWords = ['rue', 'de', 'la', 'le', 'et', 'au', 'a', 'des', 'du', 'en', 'face', 'près', 'derrière', 'devant', 'carrefour', 'akwa', 'yaounde', 'douala'];
      const significantKeywords = [...locationKeywords].filter(kw => kw.length > 3 && !commonWords.includes(kw));

      if (significantKeywords.length > 0) {
        // Create a regex to find any of these keywords, case-insensitively
        const regex = new RegExp(`\\b(${significantKeywords.join('|')})\\b`, 'gi');
        censoredText = censoredText.replace(regex, '***');
      }
    }

    return censoredText;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>(initialMessages);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    try {
      setAi(new GoogleGenAI({ apiKey: process.env.API_KEY as string }));
    } catch (error) {
      console.error("Failed to initialize Google GenAI:", error);
      setAi(null);
    }
  }, []);

  const startChat = useCallback((seller: User, store: Store, product?: Product) => {
    if (!user) {
      alert("Veuillez vous connecter pour contacter un vendeur.");
      return;
    }
    if (user.id === seller.id) {
        alert("Vous ne pouvez pas vous envoyer de message.");
        return;
    }

    const participantIds: [string, string] = [user.id, seller.id];
    let existingChat = chats.find(c =>
      c.participantIds.includes(participantIds[0]) &&
      c.participantIds.includes(participantIds[1]) &&
      c.productContext?.id === product?.id
    );
    
    let isNewChat = false;
    let chatId = existingChat?.id;

    if (!existingChat) {
      isNewChat = true;
      const newChatId = `chat_${Date.now()}`;
      chatId = newChatId;
      existingChat = {
        id: newChatId,
        participantIds,
        participantNames: {
          [user.id]: user.name,
          [seller.id]: seller.name,
        },
        productContext: product ? {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrls[0],
        } : undefined,
        sellerStoreInfo: {
          physicalAddress: store.physicalAddress,
          location: store.location,
          neighborhood: store.neighborhood,
        },
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: { [user.id]: 0, [seller.id]: 0 }
      };
      setChats(prev => [...prev, existingChat!]);
      setMessages(prev => ({...prev, [newChatId]: []}));
    }

    setActiveChatId(chatId);
    setIsWidgetOpen(true);
    
    // Add welcome message if it's a new chat and doesn't have messages yet
    if (isNewChat && (!messages[chatId!] || messages[chatId!].length === 0)) {
        const welcomeMessage: Message = {
            id: `msg_welcome_${Date.now()}`,
            chatId: chatId!,
            senderId: 'assistant-id',
            text: `Bonjour ! Je suis l'assistant KMER ZONE. Comment puis-je vous aider ${product ? `concernant "${product.name}"` : ''} ?`,
            timestamp: new Date().toISOString(),
            isRead: true,
        };
        setMessages(prev => ({
            ...prev,
            [chatId!]: [welcomeMessage]
        }));
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastMessageTimestamp: welcomeMessage.timestamp } : c));
    }

  }, [user, chats, messages]);

  const sendMessage = useCallback(async (chatId: string, text: string, allProducts: Product[], allCategories: Category[]) => {
    if (!user) return;
    
    const chat = chats.find(c => c.id === chatId);
    const censoredVersion = censorText(text, chat?.sellerStoreInfo);
    
    // Add user message immediately
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId: user.id,
      text: text,
      censoredText: censoredVersion !== text ? censoredVersion : undefined,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), userMessage]
    }));
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastMessageTimestamp: userMessage.timestamp } : c));

    if (!ai) {
        const errorMessage: Message = {
            id: `msg_error_${Date.now()}`,
            chatId,
            senderId: 'assistant-id',
            text: "Désolé, la fonction de chat n'est pas disponible pour le moment en raison d'un problème de configuration.",
            timestamp: new Date().toISOString(),
            isRead: false,
        };
        setMessages(prev => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), errorMessage]
        }));
        return;
    }

    // Set typing indicator
    setIsTyping(prev => ({ ...prev, [chatId]: true }));
    
    // AI Logic with Streaming
    try {
        if (!chat) throw new Error("Chat not found");

        const chatHistory = messages[chatId] || [];
        const formattedHistory = chatHistory.map(msg => `${msg.senderId === user.id ? 'Customer' : 'Assistant'}: ${msg.text}`).join('\n');

        const getCategoryName = (categoryId: string) => allCategories.find(c => c.id === categoryId)?.name || 'Unknown';

        const simplifiedProducts = allProducts.map(p => ({
            id: p.id,
            name: p.name,
            price: p.promotionPrice ?? p.price,
            vendor: p.vendor,
            category: getCategoryName(p.categoryId),
            description: p.description.substring(0, 150) + '...',
        }));

        const productContext = chat.productContext ? `The user is asking about this product: ${JSON.stringify(chat.productContext)}.` : '';

        const prompt = `
You are a friendly and helpful shopping assistant for KMER ZONE, an e-commerce marketplace in Cameroon.
Your goal is to help customers find products and answer their questions about the platform.
Provide concise, helpful answers in French.
When recommending products, list their name, price, and vendor.
Your knowledge is limited to the product data provided. Do not invent products or information.
For your safety, never ask for or provide personal contact information like phone numbers or email addresses. Keep all communication on the platform.

Here is the product catalog for KMER ZONE:
${JSON.stringify(simplifiedProducts)}

${productContext}

Here is the chat history so far:
${formattedHistory}

The customer just said: "${text}"

Please provide a helpful response as the KMER ZONE assistant.
        `;
        
        // Create an initial empty assistant message
        const assistantMessageId = `msg_assistant_${Date.now()}`;
        const initialAssistantMessage: Message = {
            id: assistantMessageId,
            chatId,
            senderId: 'assistant-id',
            text: '', // Start with empty text
            timestamp: new Date().toISOString(),
            isRead: false,
        };
        setMessages(prev => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), initialAssistantMessage]
        }));
        
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let fullText = '';
        for await (const chunk of response) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                // Update the existing message with the new text chunk
                setMessages(prev => ({
                    ...prev,
                    [chatId]: prev[chatId].map(msg => 
                        msg.id === assistantMessageId 
                            ? { ...msg, text: fullText } 
                            : msg
                    )
                }));
            }
        }
        
        // Final update to timestamp on chat object after the whole message is received
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastMessageTimestamp: new Date().toISOString() } : c));

    } catch (error) {
        console.error("Gemini API call failed or timed out:", error);
        const errorMessage: Message = {
             id: `msg_error_${Date.now()}`,
             chatId,
             senderId: 'assistant-id',
             text: "Désolé, je n'arrive pas à répondre pour le moment. Veuillez réessayer plus tard.",
             timestamp: new Date().toISOString(),
             isRead: false,
        };
        setMessages(prev => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), errorMessage]
        }));
    } finally {
        // Remove typing indicator
        setIsTyping(prev => ({ ...prev, [chatId]: false }));
    }

  }, [user, chats, messages, ai]);

  const handleSetActiveChat = useCallback((chatId: string | null) => {
     setActiveChatId(chatId);
     if (chatId && user) {
         setChats(prev => prev.map(chat => {
             if (chat.id === chatId) {
                 return { ...chat, unreadCount: { ...chat.unreadCount, [user.id]: 0 } };
             }
             return chat;
         }));
     }
  }, [user]);

  const totalUnreadCount = useMemo(() => {
    if (!user) return 0;
    return chats.reduce((total, chat) => total + (chat.unreadCount[user.id] || 0), 0);
  }, [chats, user]);


  const contextValue = useMemo(() => ({
    chats,
    messages,
    startChat,
    sendMessage,
    activeChatId,
    setActiveChatId: handleSetActiveChat,
    isWidgetOpen,
    setIsWidgetOpen,
    totalUnreadCount,
    isTyping,
  }), [chats, messages, startChat, sendMessage, activeChatId, handleSetActiveChat, isWidgetOpen, setIsWidgetOpen, totalUnreadCount, isTyping]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};