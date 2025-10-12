import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { Chat, Message, Product, User, Store, Category } from '../types';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

interface ChatContextType {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  startChat: (seller: User, store: Store, product?: Product) => void;
  sendMessage: (chatId: string, text: string) => void;
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
  const { t } = useLanguage();
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>(initialMessages);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});

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
            text: `Bonjour ! Je suis l'assistant KMER ZONE. Comment puis-je vous aider ${product ? `concernant "${product.name}"` : ''} ? Posez votre question au vendeur ici.`,
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

  const sendMessage = useCallback((chatId: string, text: string) => {
    if (!user) return;
    
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const censoredVersion = censorText(text, chat.sellerStoreInfo);
    
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId: user.id,
      text: text,
      censoredText: censoredVersion !== text ? censoredVersion : undefined,
      timestamp: new Date().toISOString(),
      isRead: false, // Will be marked as read by receiver
    };
    
    const receiverId = chat.participantIds.find(id => id !== user.id)!;

    setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), userMessage]
    }));

    setChats(prev => prev.map(c => {
        if (c.id === chatId) {
            return { 
                ...c, 
                lastMessageTimestamp: userMessage.timestamp,
                unreadCount: {
                    ...c.unreadCount,
                    [receiverId]: (c.unreadCount[receiverId] || 0) + 1,
                }
            };
        }
        return c;
    }));

  }, [user, chats]);


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
