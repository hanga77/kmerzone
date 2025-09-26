import React, { useState } from 'react';
import type { Ticket, TicketStatus, TicketMessage } from '../../types';

interface SupportPanelProps {
    allTickets: Ticket[];
    onAdminReplyToTicket: (ticketId: string, message: string) => void;
    onAdminUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
}

const TicketDetail: React.FC<{ ticket: Ticket, onReply: (id: string, msg: string) => void, onStatusChange: (id: string, status: TicketStatus) => void, onBack: () => void }> = ({ ticket, onReply, onStatusChange, onBack }) => {
    const [reply, setReply] = useState('');
    return (
        <div>
            <button onClick={onBack} className="text-sm font-semibold text-blue-500 mb-4">&lt; Retour à la liste</button>
            <h3 className="font-bold">{ticket.subject}</h3>
            <p className="text-sm">Utilisateur: {ticket.userName}</p>
            <div className="my-4 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg max-h-60 overflow-y-auto space-y-2">
                {ticket.messages.map((msg, i) => (
                    <div key={i} className="p-2 bg-white dark:bg-gray-700 rounded-md">
                        <p className="font-semibold text-xs">{msg.authorName}</p>
                        <p>{msg.message}</p>
                    </div>
                ))}
            </div>
            <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Votre réponse..." rows={3} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            <div className="flex justify-between items-center mt-2">
                <select value={ticket.status} onChange={e => onStatusChange(ticket.id, e.target.value as TicketStatus)} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option>Ouvert</option><option>En cours</option><option>Résolu</option>
                </select>
                <button onClick={() => { onReply(ticket.id, reply); setReply(''); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Répondre</button>
            </div>
        </div>
    );
};

export const SupportPanel: React.FC<SupportPanelProps> = ({ allTickets, onAdminReplyToTicket, onAdminUpdateTicketStatus }) => {
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    if (selectedTicket) {
        return (
            <div className="p-4 sm:p-6">
                <TicketDetail ticket={selectedTicket} onReply={onAdminReplyToTicket} onStatusChange={onAdminUpdateTicketStatus} onBack={() => setSelectedTicket(null)} />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">Tickets de Support ({allTickets.length})</h2>
            <div className="space-y-2">
                {allTickets.map(ticket => (
                    <button key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="w-full text-left p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{ticket.subject} <span className="font-normal text-sm text-gray-500">- {ticket.userName}</span></p>
                            <p className="text-xs text-gray-500">Dernière mise à jour: {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ticket.status === 'Résolu' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{ticket.status}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
