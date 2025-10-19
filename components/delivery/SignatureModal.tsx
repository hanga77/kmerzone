import React, { useState } from 'react';
import type { Order } from '../../types';
import { CheckIcon } from '../Icons';

export const SignatureModal: React.FC<{
    order: Order;
    onClose: () => void;
    onConfirm: (orderId: string, recipientName: string) => void;
    t: (key: string) => string;
}> = ({ order, onClose, onConfirm, t }) => {
    const [recipientName, setRecipientName] = useState('');
    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 dark:text-white">{t('deliveryDashboard.confirmDelivery')}</h3>
                <p className="text-sm mb-4">{t('deliveryDashboard.order')}: <span className="font-mono">{order.id}</span></p>
                <div>
                    <label htmlFor="recipientName" className="block text-sm font-medium dark:text-gray-300">{t('deliveryDashboard.recipientName')}</label>
                    <input
                        id="recipientName"
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Ex: Jean Dupont"
                        required
                    />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg">{t('common.cancel')}</button>
                    <button onClick={() => onConfirm(order.id, recipientName)} disabled={!recipientName.trim()} className="bg-green-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 flex items-center gap-2">
                        <CheckIcon className="w-5 h-5"/> {t('deliveryDashboard.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};
