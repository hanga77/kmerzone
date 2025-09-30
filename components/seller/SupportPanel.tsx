import React, { useState } from 'react';
import type { Ticket, Order } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface SupportPanelProps {
    allTickets: Ticket[];
    sellerOrders: Order[];
    onCreateTicket: (subject: string, message: string, orderId?: string) => void;
}

const SupportPanel: React.FC<SupportPanelProps> = ({ allTickets, sellerOrders, onCreateTicket }) => {
    const { t } = useLanguage();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [orderId, setOrderId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateTicket(subject, message, orderId);
        setSubject(''); setMessage(''); setOrderId('');
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{t('sellerDashboard.support.title')}</h2>
            <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('sellerDashboard.support.subject')} className="w-full p-2 border rounded" required />
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={t('sellerDashboard.support.describe')} rows={4} className="w-full p-2 border rounded" required />
                <select value={orderId} onChange={e => setOrderId(e.target.value)} className="w-full p-2 border rounded">
                    <option value="">{t('sellerDashboard.support.linkOrder')}</option>
                    {sellerOrders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                </select>
                <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">{t('sellerDashboard.support.sendTicket')}</button>
            </form>
        </div>
    );
};

export default SupportPanel;