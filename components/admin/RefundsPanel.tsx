import React from 'react';
import type { Order } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface RefundsPanelProps {
    allOrders: Order[];
    onResolveDispute: (orderId: string, resolution: 'refunded' | 'rejected') => void;
}

export const RefundsPanel: React.FC<RefundsPanelProps> = ({ allOrders, onResolveDispute }) => {
    const { t } = useLanguage();
    const disputeOrders = allOrders.filter(o => o.status === 'refund-requested');

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">{t('superadmin.tabs.refunds')} ({disputeOrders.length})</h2>
            <div className="space-y-4">
                {disputeOrders.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">{t('superadmin.orders.noDisputes')}</p>
                ) : (
                    disputeOrders.map(order => (
                        <div key={order.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                            <p className="font-bold">{t('common.orderId')}: {order.id}</p>
                            <p className="text-sm">{t('common.customer')}: {order.shippingAddress.fullName}</p>
                            <p className="mt-2 text-sm italic">"{order.refundReason}"</p>
                            {order.refundEvidenceUrls && (
                                <div className="mt-2">
                                    <p className="text-xs font-semibold">{t('superadmin.orders.evidence')}</p>
                                    <div className="flex gap-2 flex-wrap">{order.refundEvidenceUrls.map((url, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs">Preuve {i+1}</a>)}</div>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => onResolveDispute(order.id, 'rejected')} className="bg-gray-500 text-white px-3 py-1 text-sm rounded-md">{t('superadmin.orders.rejectRequest')}</button>
                                <button onClick={() => onResolveDispute(order.id, 'refunded')} className="bg-red-500 text-white px-3 py-1 text-sm rounded-md">{t('superadmin.orders.approveRefund')}</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};