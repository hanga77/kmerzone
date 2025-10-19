import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChatContext } from '../../contexts/ChatContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChatBubbleLeftRightIcon } from '../Icons';

const ChatPanel: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { setIsWidgetOpen } = useChatContext();

    if (!user) return null;

    return (
        <div className="p-6 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4">{t('sellerDashboard.tabs.chat')}</h2>
            <div className="flex-grow flex items-center justify-center text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8">
                <div>
                    <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        La gestion de votre messagerie se fait via le widget de chat global.
                    </p>
                    <button 
                        onClick={() => setIsWidgetOpen(true)}
                        className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg"
                    >
                        Ouvrir la Messagerie
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
