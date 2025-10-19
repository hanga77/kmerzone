import React, { useState } from 'react';
import type { Order } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export const CheckInModal: React.FC<{
    order: Order;
    onClose: () => void;
    onConfirm: (orderId: string, location: string) => void;
    t: (key: string) => string;
}> = ({ order, onClose, onConfirm, t }) => {
    const [location, setLocation] = useState('');
    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">{t('depotDashboard.checkInParcel')}</h3>
                <p className="text-sm mb-4">{t('common.orderId')}: <span className="font-mono">{order.id}</span></p>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium">{t('depotDashboard.storageLocation')}</label>
                    <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value.toUpperCase())} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg">{t('common.cancel')}</button>
                    <button onClick={() => onConfirm(order.id, location)} disabled={!location.trim()} className="bg-green-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">
                        {t('depotDashboard.checkIn')}
                    </button>
                </div>
            </div>
        </div>
    );
};
