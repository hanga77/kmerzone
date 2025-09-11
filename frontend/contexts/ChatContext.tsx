import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Chat, Message, Product, User, Store, Category } from '../types';
import { useAuth } from './AuthContext';
import { io, Socket } from "socket.io-client";

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

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>(initialMessages);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user) {
      // Connect to the backend server explicitly.
      socketRef.current = io('http://localhost:5000');

      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current?.id);
      });

      socketRef.current.on('newMessage', (newMessage: Message) => {
        setMessages(prev => {
          const chatMessages = prev[newMessage.chatId] || [];
          // FIX: Corrected logic to handle incoming messages with `_id` from the server.
          // The check for duplicates now correctly uses `_id` and the new message's `id` is properly set.
          if (chatMessages.some(m => m.id === (newMessage._id || newMessage.id) || m._id === newMessage._id)) {
            return prev;
          }
          return {
            ...prev,
            [newMessage.chatId]: [...chatMessages, { ...newMessage, id: newMessage._id || newMessage.id, _id: newMessage._id }]
          };
        });
        setChats(prev => prev.map(c => c.id === newMessage.chatId ? { ...c, lastMessageTimestamp: newMessage.timestamp } : c));
      });

      socketRef.current.on('messageChunk', ({ messageId, chunk, chatId }) => {
        setMessages(prev => {
            const chatMessages = prev[chatId] || [];
            return {
                ...prev,
                [chatId]: chatMessages.map(msg => 
                    (msg.id === messageId || msg._id === messageId) ? { ...msg, text: msg.text + chunk } : msg
                )
            };
        });
      });
      
      socketRef.current.on('typingUpdate', ({ chatId, isTyping: typingStatus }) => {
          setIsTyping(prev => ({ ...prev, [chatId]: typingStatus }));
      });
      
      socketRef.current.on('chatError', (error) => {
          console.error('Chat Error from server:', error.message);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

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
      const newChatId = `chat_local_${Date.now()}`;
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

  const sendMessage = useCallback((chatId: string, text: string, allProducts: Product[], allCategories: Category[]) => {
    if (!user || !socketRef.current) return;

    const userMessage: Message = {
      id: `msg_local_${Date.now()}`,
      chatId,
      senderId: user.id,
      text: text,
      timestamp: new Date().toISOString(),
      isRead: true,
    };
    
    setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), userMessage]
    }));
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastMessageTimestamp: userMessage.timestamp } : c));

    socketRef.current.emit('sendMessage', {
      chatId,
      senderId: user.id,
      text,
      allProducts, 
      allCategories,
    });
  }, [user]);

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
