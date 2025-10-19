import React, { useState } from 'react';
import type { Ticket, TicketStatus, TicketMessage } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { PaperclipIcon, TrashIcon } from '../Icons';

const AttachmentPreview: React.FC<{ attachments: string[], onRemove: (index: number) => void }> = ({ attachments, onRemove }) => (
    <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
        {attachments.map((url, i) => (
            <div key={i} className="relative group">
                <img src={url} alt={`Aperçu ${i}`} className="h-20 w-full object-cover rounded-md"/>
                <button type="button" onClick={() => onRemove(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        ))}
    </div>
);

const MessageAttachments: React.FC<{ urls: string[] }> = ({ urls }) => {
    const { t } = useLanguage();
    return (
        <div className="mt-2 flex flex-wrap gap-2">
            {urls.map((url, i) => {
                const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(url) || url.startsWith('data:image');
                if (isImage) {
                    return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block"><img src={url} alt={`${t('accountPage.attachment')} ${i+1}`} className="h-24 w-auto rounded-md object-contain border dark:border-gray-600"/></a>
                }
                return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-sm flex items-center gap-1 p-2 bg-blue-50 dark:bg-blue-900/50 rounded-md"><PaperclipIcon className="w-4 h-4"/>{t('accountPage.attachment')} {i+1}</a>
            })}
        </div>
    );
};


interface SupportPanelProps {
    allTickets: Ticket[];
    onAdminReplyToTicket: (ticketId: string, message: string, attachments?: string[]) => void;
    onAdminUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
}

const TicketDetail: React.FC<{ ticket: Ticket, onReply: (id: string, msg: string, attachments?: string[]) => void, onStatusChange: (id: string, status: TicketStatus) => void, onBack: () => void }> = ({ ticket, onReply, onStatusChange, onBack }) => {
    const { t } = useLanguage();
    const [reply, setReply] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            files.forEach((file: Blob) => {
                const reader = new FileReader();
                reader.onloadend = () => setAttachments(prev => [...prev, reader.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };
    
    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!reply.trim()) return;
        onReply(ticket.id, reply, attachments);
        setReply('');
        setAttachments([]);
    };

    return (
        <div>
            <button onClick={onBack} className="text-sm font-semibold text-blue-500 mb-4">{t('superadmin.support.detail.back')}</button>
            <h3 className="font-bold">{ticket.subject}</h3>
            <p className="text-sm">{t('superadmin.support.detail.user')}: {ticket.userName}</p>
            <div className="my-4 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg max-h-60 overflow-y-auto space-y-2">
                {ticket.messages.map((msg, i) => (
                    <div key={i} className="p-2 bg-white dark:bg-gray-700 rounded-md">
                        <p className="font-semibold text-xs">{msg.authorName}</p>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        {msg.attachmentUrls && <MessageAttachments urls={msg.attachmentUrls} />}
                    </div>
                ))}
            </div>
            <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder={t('superadmin.support.detail.replyPlaceholder')} rows={3} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            
            <div className="mt-2">
                <label htmlFor="admin-attachments-upload" className="cursor-pointer text-sm font-semibold text-blue-500 flex items-center gap-2"><PaperclipIcon className="w-4 h-4" /> {t('accountPage.attachFiles')}</label>
                <input id="admin-attachments-upload" type="file" multiple onChange={handleFileChange} className="hidden" />
                {attachments.length > 0 && <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />}
            </div>
            
            <div className="flex justify-between items-center mt-2">
                <select value={ticket.status} onChange={e => onStatusChange(ticket.id, e.target.value as TicketStatus)} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="Ouvert">{t('superadmin.support.status.open')}</option>
                    <option value="En cours">{t('superadmin.support.status.inProgress')}</option>
                    <option value="Résolu">{t('superadmin.support.status.resolved')}</option>
                </select>
                <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded-lg">{t('superadmin.support.detail.reply')}</button>
            </div>
        </div>
    );
};

export const SupportPanel: React.FC<SupportPanelProps> = ({ allTickets, onAdminReplyToTicket, onAdminUpdateTicketStatus }) => {
    const { t } = useLanguage();
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
            <h2 className="text-xl font-bold mb-4">{t('superadmin.support.title', allTickets.length)}</h2>
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
                            <p className="text-xs text-gray-500">Dernière mise à jour: {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ticket.status === 'Résolu' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{ticket.status}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};