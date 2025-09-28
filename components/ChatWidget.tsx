import React, { useState, useEffect, useRef } from 'react';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { XIcon, PaperAirplaneIcon, ArrowLeftIcon, ChevronDownIcon } from './Icons';
import type { Chat, Message, User, Product, Category } from '../types';

const PLACEHOLDER_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23E5E7EB'/%3E%3Cpath d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' stroke='%239CA3AF' stroke-width='1.5'/%3E%3C/svg%3E";

const ConversationList: React.FC<{
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUser: User;
}> = ({ chats, messages, activeChatId, onSelectChat, currentUser }) => {
  const getOtherParticipant = (chat: Chat) => {
    const otherId = chat.participantIds.find(id => id !== currentUser.id)!;
    return { id: otherId, name: chat.participantNames[otherId] };
  };

  const getLastMessage = (chatId: string) => {
    const chatMessages = messages[chatId] || [];
    return chatMessages[chatMessages.length - 1];
  }

  return (
    <div className="w-full h-full overflow-y-auto border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {chats
          .sort((a,b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime())
          .map(chat => {
            const otherParticipant = getOtherParticipant(chat);
            const lastMessage = getLastMessage(chat.id);
            const unreadCount = chat.unreadCount[currentUser.id] || 0;
            
            const isReceiver = lastMessage?.senderId !== currentUser.id;
            const lastMessageText = isReceiver && lastMessage?.censoredText ? lastMessage.censoredText : lastMessage?.text;

            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${activeChatId === chat.id ? 'bg-gray-100 dark:bg-gray-700/50' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <p className={`font-semibold text-gray-800 dark:text-gray-200 ${unreadCount > 0 ? 'font-bold' : ''}`}>{chat.participantNames[otherParticipant.id] || otherParticipant.name}</p>
                  {lastMessage && <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(lastMessage.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate pr-4">{lastMessageText}</p>
                  {unreadCount > 0 && (
                    <span className="bg-kmer-red text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{unreadCount}</span>
                  )}
                </div>
              </button>
            )
        })}
      </div>
    </div>
  )
};

const MessageThread: React.FC<{
  chat: Chat | null;
  messages: Message[];
  currentUser: User;
  onSendMessage: (text: string) => void;
  onBack: () => void;
  isTyping: boolean;
}> = ({ chat, messages, currentUser, onSendMessage, onBack, isTyping }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!chat) {
    return (
      <div className="h-full flex flex-col justify-center items-center text-center p-4">
        <p className="text-gray-500 dark:text-gray-400">Sélectionnez une conversation pour commencer à discuter.</p>
      </div>
    )
  }

  const otherParticipant = chat.participantIds.find(id => id !== currentUser.id)!;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <button onClick={onBack} className="lg:hidden text-gray-500 dark:text-gray-400">
            <ArrowLeftIcon className="w-6 h-6"/>
        </button>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{chat.participantNames[otherParticipant]}</h3>
          {chat.productContext && <p className="text-xs text-gray-500 dark:text-gray-400">À propos de : {chat.productContext.name}</p>}
        </div>
      </header>

      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {chat.productContext && (
             <div className="flex gap-2 items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-900/50 mb-4">
                <img src={chat.productContext.imageUrl || PLACEHOLDER_IMAGE_URL} alt={chat.productContext.name} className="w-12 h-12 object-cover rounded-md" />
                <p className="text-sm font-semibold">{chat.productContext.name}</p>
             </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === currentUser.id;
          const isAssistant = msg.senderId === 'assistant-id';
          
          const textToDisplay = msg.censoredText ? msg.censoredText : msg.text;

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md p-3 rounded-xl ${isMe ? 'bg-kmer-green text-white' : (isAssistant ? 'bg-gray-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200')}`}>
                <p>{textToDisplay}</p>
              </div>
            </div>
          )
        })}
        {isTyping && (
            <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md p-3 rounded-xl bg-gray-500 text-white">
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-kmer-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button type="submit" className="bg-kmer-green text-white rounded-full p-3 hover:bg-green-700 transition-colors">
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
};

const ChatWidget: React.FC<{allUsers: User[], allProducts: Product[], allCategories: Category[]}> = ({ allUsers, allProducts, allCategories }) => {
  const { user } = useAuth();
  const { chats, messages, activeChatId, setActiveChatId, sendMessage, isWidgetOpen, setIsWidgetOpen, isTyping } = useChatContext();

  if (!isWidgetOpen || !user) return null;

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeChatIsTyping = activeChatId ? isTyping[activeChatId] || false : false;

  return (
    <div className="fixed bottom-0 right-0 sm:right-5 h-full w-full sm:h-[600px] sm:w-[700px] sm:max-h-[80vh] bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-lg shadow-2xl z-50 flex flex-col transition-transform duration-300">
      <header className="bg-kmer-green text-white p-3 flex justify-between items-center rounded-t-lg flex-shrink-0">
        <h2 className="font-bold">Messagerie</h2>
        <div>
          <button onClick={() => setIsWidgetOpen(false)} className="text-white opacity-80 hover:opacity-100">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
      </header>
      <div className="flex-grow flex overflow-hidden">
        <div className={`w-full lg:w-1/3 flex-shrink-0 transition-transform duration-300 ${activeChatId ? 'hidden lg:block' : ''}`}>
           <ConversationList
                chats={chats}
                messages={messages}
                activeChatId={activeChatId}
                onSelectChat={setActiveChatId}
                currentUser={user}
            />
        </div>
         <div className={`w-full lg:w-2/3 flex-shrink-0 transition-transform duration-300 ${!activeChatId ? 'hidden lg:flex' : 'flex'}`}>
            <MessageThread
                chat={activeChat || null}
                messages={activeChatId ? messages[activeChatId] || [] : []}
                currentUser={user}
                onSendMessage={(text) => activeChatId && sendMessage(activeChatId, text, allProducts, allCategories)}
                onBack={() => setActiveChatId(null)}
                isTyping={activeChatIsTyping}
            />
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;