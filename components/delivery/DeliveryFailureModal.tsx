import React, { useState } from 'react';
import type { Order } from '../../types';
import { XIcon } from '../Icons';

export const DeliveryFailureModal: React.FC<{
    order: Order;
    onClose: () => void;
    onConfirm: (orderId: string, failureReason: Required<Order['deliveryFailureReason']>) => void;
    t: (key: string) => string;
}> = ({ order, onClose, onConfirm, t }) => {
    const [reason, setReason] = useState<'client-absent' | 'adresse-erronee' | 'colis-refuse'>('client-absent');
    const [details, setDetails] = useState('');
    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 dark:text-white">{t('deliveryDashboard.reportFailure')}</h3>
                <p className="text-sm mb-4">{t('deliveryDashboard.order')}: <span className="font-mono">{order.id}</span></p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="failureReason" className="block text-sm font-medium dark:text-gray-300">{t('deliveryDashboard.reason')}</label>
                        <select
                            id="failureReason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value as any)}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="client-absent">{t('deliveryDashboard.clientAbsent')}</option>
                            <option value="adresse-erronee">{t('deliveryDashboard.wrongAddress')}</option>
                            <option value="colis-refuse">{t('deliveryDashboard.packageRefused')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="failureDetails" className="block text-sm font-medium dark:text-gray-300">{t('deliveryDashboard.details')}</label>
                        <textarea
                            id="failureDetails"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={3}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Ex: Le client ne répond pas au téléphone, la porte est fermée..."
                            required
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg">{t('common.cancel')}</button>
                    <button onClick={() => onConfirm(order.id, { reason, details, date: new Date().toISOString() })} disabled={!details.trim()} className="bg-red-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 flex items-center gap-2">
                        <XIcon className="w-5 h-5"/> {t('deliveryDashboard.confirmFailure')}
                    </button>
                </div>
            </div>
        </div>
    );
};
