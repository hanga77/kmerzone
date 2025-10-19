import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Ticket } from '../../types';
import { PaperclipIcon, TrashIcon } from '../Icons';
import { Section } from './common';

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

export const TicketDetailView: React.FC<{ ticket: Ticket, onReply: (id: string, msg: string, attachments?: string[]) => void, onBack: () => void }> = ({ ticket, onReply, onBack }) => {
    const { t } = useLanguage();
    const [reply, setReply] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    const { user } = useAuth();
    
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onReply(ticket.id, reply, attachments);
        setReply('');
        setAttachments([]);
    };

    return (
        <Section title={ticket.subject}>
            <button onClick={onBack} className="text-sm font-semibold text-kmer-green mb-4">{t('accountPage.backToList')}</button>
            <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50 mb-4 space-y-4">
              {ticket.messages.map((msg, i) => {
                  const isMe = msg.authorId === user?.id;
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-lg max-w-sm ${isMe ? 'bg-kmer-green text-white' : 'bg-white'}`}>
                        <p className="font-bold text-sm">{msg.authorName}</p>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        {msg.attachmentUrls && <MessageAttachments urls={msg.attachmentUrls} />}
                      </div>
                    </div>
                  );
              })}
            </div>
            <form onSubmit={handleSubmit}>
                <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder={t('accountPage.yourReply')} className="w-full p-2 border rounded-md"></textarea>
                <div className="mt-2">
                    <label htmlFor="attachments-upload-reply" className="cursor-pointer text-sm font-semibold text-blue-500 flex items-center gap-2"><PaperclipIcon className="w-4 h-4" /> {t('accountPage.attachFiles')}</label>
                    <input id="attachments-upload-reply" type="file" multiple onChange={handleFileChange} className="hidden" />
                    {attachments.length > 0 && <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />}
                </div>
                <button type="submit" className="mt-2 bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">{t('accountPage.send')}</button>
            </form>
        </Section>
    );
};
