


import React, { useState, useMemo } from 'react';
import type { Order, OrderStatus } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations';

interface OrdersPanelProps {
    allOrders: Order[];
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    onResolveDispute: (orderId: string, resolution: 'refunded' | 'rejected') => void;
}

const AllOrdersView: React.FC<{orders: Order[]}> = ({ orders }) => {
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const searchMatch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || o.shippingAddress.fullName.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = !statusFilter || o.status === statusFilter;
            return searchMatch && statusMatch;
        });
    }, [orders, searchTerm, statusFilter]);

    return (
        <div>
             <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input type="text" placeholder={t('superadmin.orders.searchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-md w-full sm:w-1/2 dark:bg-gray-700 dark:border-gray-600"/>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as OrderStatus | '')} className="p-2 border rounded-md w-full sm:w-auto dark:bg-gray-700 dark:border-gray-600">
                    <option value="">{t('superadmin.orders.allStatuses')}</option>
                    {/* FIX: Corrected typo in translations key from orderStatuts to orderStatus */}
                    {Object.keys((translations as any)[language]?.orderStatus || translations.fr.orderStatus).map(key => (
                        <option key={key} value={key}>{t(`orderStatus.${key}`)}</option>
                    ))}
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">{t('common.orderId')}</th>
                            <th className="p-2 text-left">{t('common.customer')}</th>
                            <th className="p-2 text-left">{t('common.date')}</th>
                            <th className="p-2 text-right">{t('common.total')}</th>
                            <th className="p-2 text-center">{t('common.status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => (
                            <tr key={order.id} className="border-b dark:border-gray-700">
                                <td className="p-2 font-mono">{order.id}</td>
                                <td className="p-2">{order.shippingAddress.fullName}</td>
                                <td className="p-2">{new Date(order.orderDate).toLocaleDateString()}</td>
                                <td className="p-2 text-right font-semibold">{order.total.toLocaleString('fr-CM')} FCFA</td>
                                <td className="p-2 text-center">{t(`orderStatus.${order.status as OrderStatus}`, order.status)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const OrdersPanel: React.FC<OrdersPanelProps> = ({ allOrders, onUpdateOrderStatus, onResolveDispute }) => {
    const { t } = useLanguage();
    
    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">{t('superadmin.orders.title')}</h2>
            <AllOrdersView orders={allOrders} />
        </div>
    );
};