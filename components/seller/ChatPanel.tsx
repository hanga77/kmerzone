import React from 'react';
import ChatWidget from '../ChatWidget'; // We can reuse the main chat widget component
import { useAuth } from '../../contexts/AuthContext';
import { useChatContext } from '../../contexts/ChatContext';

const ChatPanel: React.FC = () => {
    const { user, allUsers } = useAuth();
    const { isWidgetOpen, setIsWidgetOpen } = useChatContext();

    // Since ChatWidget is a full-screen modal-like component, 
    // we can just provide a button to open it from within the dashboard panel.
    // A full integration would require refactoring ChatWidget to be embeddable.
    
    // For a better experience, we will simulate an embedded chat.
    // We'll reuse the logic from ChatWidget but without the modal wrapper.
    const { chats, messages, activeChatId, setActiveChatId, sendMessage } = useChatContext();
    
    // This is a placeholder as the real ChatWidget is global
    if (!user) return null;

    return (
        <div className="p-6 h-[calc(100vh-10rem)]">
            <h2 className="text-2xl font-bold mb-4">Messagerie</h2>
             <div className="border rounded-lg h-full overflow-hidden">
                {/* The ChatWidget is globally positioned, so we can't truly embed it without a refactor.
                    This panel will serve as a placeholder for the chat functionality.
                    For a better demo, we will embed a simplified version.
                */}
                <p className="p-4 text-center text-gray-500">
                    La gestion de la messagerie se fait via le widget de chat global.
                    Cliquez sur l'icône "Messages" dans l'en-tête pour ouvrir vos conversations.
                </p>
                {/* A proper implementation would require refactoring ChatWidget to be embeddable */}
             </div>
        </div>
    );
};

export default ChatPanel;