import React, { useState, useMemo } from 'react';
import type { Order, OrderStatus } from '../../types';

interface OrdersPanelProps {
    allOrders: Order[];
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const statusTranslations: {[key in OrderStatus]: string} = {
    confirmed: 'Confirmée', 'ready-for-pickup': 'Prêt pour enlèvement', 'picked-up': 'Pris en charge',
    'at-depot': 'Au dépôt', 'out-for-delivery': 'En livraison', delivered: 'Livré',
    cancelled: 'Annulé', 'refund-requested': 'Remboursement demandé', refunded: 'Remboursé',
    returned: 'Retourné', 'depot-issue': 'Problème au dépôt', 'delivery-failed': 'Échec de livraison'
};

export const OrdersPanel: React.FC<OrdersPanelProps> = ({ allOrders, onUpdateOrderStatus }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

    const filteredOrders = useMemo(() => {
        return allOrders.filter(o => {
            const searchMatch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || o.shippingAddress.fullName.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = !statusFilter || o.status === statusFilter;
            return searchMatch && statusMatch;
        });
    }, [allOrders, searchTerm, statusFilter]);

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">Gestion des Commandes ({filteredOrders.length})</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input type="text" placeholder="Rechercher par ID ou client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-md w-full sm:w-1/2 dark:bg-gray-700 dark:border-gray-600"/>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as OrderStatus | '')} className="p-2 border rounded-md w-full sm:w-auto dark:bg-gray-700 dark:border-gray-600">
                    <option value="">Tous les statuts</option>
                    {Object.entries(statusTranslations).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">ID</th>
                            <th className="p-2 text-left">Client</th>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-right">Total</th>
                            <th className="p-2 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => (
                            <tr key={order.id} className="border-b dark:border-gray-700">
                                <td className="p-2 font-mono">{order.id}</td>
                                <td className="p-2">{order.shippingAddress.fullName}</td>
                                <td className="p-2">{new Date(order.orderDate).toLocaleDateString()}</td>
                                <td className="p-2 text-right font-semibold">{order.total.toLocaleString('fr-CM')} FCFA</td>
                                <td className="p-2 text-center">{statusTranslations[order.status]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
