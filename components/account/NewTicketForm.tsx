import React, { useState } from 'react';
import type { Order } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { PaperclipIcon, TrashIcon } from '../Icons';
import { Section } from './common';
import { useAuth } from '../../contexts/AuthContext';

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


export const NewTicketForm: React.FC<{ userOrders: Order[], onCreate: (s: string, m: string, o?: string, type?: 'support' | 'service_request', a?: string[]) => void, onCancel: () => void }> = ({ userOrders, onCreate, onCancel }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [orderId, setOrderId] = useState('');
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(subject, message, orderId, 'support', attachments);
    };

    const problemTypes = [
        'order_issue', 'product_question', 'delivery_issue', 'return_request',
        'payment_issue', 'technical_issue', 'report_seller', 'other'
    ];
    
    const canLinkOrders = user && ['customer', 'seller', 'enterprise'].includes(user.role);

    return (
        <Section title={t('accountPage.createTicket')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-2 border rounded-md" required>
                    <option value="">{t('supportProblemTypes.select')}</option>
                    {problemTypes.map(type => (
                        <option key={type} value={t(`supportProblemTypes.${type}`)}>{t(`supportProblemTypes.${type}`)}</option>
                    ))}
                 </select>
                 
                 {canLinkOrders && (
                    <select value={orderId} onChange={e => setOrderId(e.target.value)} className="w-full p-2 border rounded-md">
                        <option value="">{t('accountPage.linkToOrder')}</option>
                        {userOrders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                    </select>
                 )}

                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={t('accountPage.describeProblem')} rows={5} className="w-full p-2 border rounded-md" required />
                <div>
                    <label htmlFor="attachments-upload-new" className="cursor-pointer text-sm font-semibold text-blue-500 flex items-center gap-2"><PaperclipIcon className="w-4 h-4" /> {t('accountPage.attachFiles')}</label>
                    <input id="attachments-upload-new" type="file" multiple onChange={handleFileChange} className="hidden" />
                    {attachments.length > 0 && <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />}
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={onCancel} className="bg-gray-200 font-bold py-2 px-4 rounded-lg">{t('common.cancel')}</button>
                    <button type="submit" className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">{t('accountPage.send')}</button>
                </div>
            </form>
        </Section>
    );
};