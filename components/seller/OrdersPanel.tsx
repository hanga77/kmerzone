

import React from 'react';
import type { Order, OrderStatus, Store } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface OrdersPanelProps {
    sellerOrders: Order[];
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    store: Store;
    onSellerCancelOrder: (orderId: string) => void;
}

const statusTranslations: { [key in OrderStatus]: string } = {
    confirmed: 'Confirmée',
    'ready-for-pickup': 'Prêt pour enlèvement',
    'picked-up': 'Pris en charge',
    'at-depot': 'Au dépôt',
    'out-for-delivery': 'En livraison',
    delivered: 'Livré',
    cancelled: 'Annulé',
    'refund-requested': 'Litige',
    refunded: 'Remboursé',
    returned: 'Retourné',
    'depot-issue': 'Problème au dépôt',
    'delivery-failed': 'Échec de livraison'
};

const OrdersPanel: React.FC<OrdersPanelProps> = ({ sellerOrders, onUpdateOrderStatus, store, onSellerCancelOrder }) => {
    const { t } = useLanguage();
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{t('sellerDashboard.orders.title', sellerOrders.length)}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">{t('sellerDashboard.orders.table.orderId')}</th>
                            <th className="p-2 text-left">{t('sellerDashboard.orders.table.customer')}</th>
                            <th className="p-2 text-right">{t('sellerDashboard.orders.table.total')}</th>
                            <th className="p-2 text-center">{t('sellerDashboard.orders.table.status')}</th>
                            <th className="p-2 text-center">{t('sellerDashboard.orders.table.action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sellerOrders.map(order => (
                             <tr key={order.id} className="border-b dark:border-gray-700">
                                <td className="p-2 font-mono">{order.id}</td>
                                <td className="p-2">{order.shippingAddress.fullName}</td>
                                <td className="p-2 text-right font-semibold">{order.total.toLocaleString('fr-CM')} FCFA</td>
                                <td className="p-2 text-center capitalize">{statusTranslations[order.status] || order.status}</td>
                                <td className="p-2 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        {order.status === 'confirmed' && (
                                            <button onClick={() => onUpdateOrderStatus(order.id, 'ready-for-pickup')} className="bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded-md hover:bg-blue-600">
                                                {t('sellerDashboard.orders.markReady')}
                                            </button>
                                        )}
                                        {order.status === 'confirmed' && (
                                            <button onClick={() => {if(window.confirm(t('sellerDashboard.orders.cancelConfirm'))) {onSellerCancelOrder(order.id)}}} className="bg-red-500 text-white text-xs font-bold py-1 px-2 rounded-md hover:bg-red-600">
                                                {t('sellerDashboard.orders.cancelOrder')}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrdersPanel;
