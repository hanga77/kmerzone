import React, { useState } from 'react';
import type { Ticket, Order } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { NewTicketForm } from '../account/NewTicketForm';
import { TicketDetailView } from '../account/TicketDetailView';
import { Section } from '../account/common';

interface SupportPanelProps {
    allTickets: Ticket[];
    sellerOrders: Order[];
    onCreateTicket: (subject: string, message: string, orderId?: string, type?: 'support' | 'service_request', attachments?: string[]) => void;
    onUserReplyToTicket: (ticketId: string, message: string, attachments?: string[]) => void;
}

const SupportPanel: React.FC<SupportPanelProps> = (props) => {
    const { t } = useLanguage();
    const { allTickets, sellerOrders, onCreateTicket, onUserReplyToTicket } = props;
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleCreateTicketAndClose = (subject: string, message: string, orderId?: string, type?: 'support' | 'service_request', attachments?: string[]) => {
        onCreateTicket(subject, message, orderId, type, attachments);
        setIsCreating(false);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
    };
    
    if (isCreating) {
        return <NewTicketForm userOrders={sellerOrders} onCreate={handleCreateTicketAndClose} onCancel={() => setIsCreating(false)} />;
    }
    
    if (selectedTicket) {
        return <TicketDetailView ticket={selectedTicket} onReply={onUserReplyToTicket} onBack={() => setSelectedTicket(null)} />;
    }

    return (
        <Section title={t('accountPage.support')}>
             {showConfirmation && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 animate-in" role="alert">
                    <strong className="font-bold">{t('accountPage.ticketSentSuccessTitle')}</strong>
                    <span className="block sm:inline"> {t('accountPage.ticketSentSuccessMessage')}</span>
                </div>
            )}
            <button onClick={() => setIsCreating(true)} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg mb-4">{t('accountPage.createTicket')}</button>
            <div className="space-y-2">
                {allTickets.map(ticket => (
                    <button key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="w-full text-left p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold">{ticket.subject}</p>
                                {ticket.type === 'service_request' && (
                                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Demande de Service</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">{ticket.userName}</p>
                            <p className="text-xs text-gray-500">{t('accountPage.lastUpdate')}: {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ticket.status === 'Résolu' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{ticket.status}</span>
                    </button>
                ))}
                {allTickets.length === 0 && (
                     <div className="text-center py-8 text-gray-500">
                        <p>Vous n'avez aucun ticket de support.</p>
                    </div>
                )}
            </div>
        </Section>
    );
};

export default SupportPanel;