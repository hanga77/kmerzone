import React, { useState, useMemo } from 'react';
import type { Order, OrderStatus } from '../../types';

interface OrdersPanelProps {
    allOrders: Order[];
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    onResolveDispute: (orderId: string, resolution: 'refunded' | 'rejected') => void;
}

const statusTranslations: {[key in OrderStatus]: string} = {
    confirmed: 'Confirmée', 'ready-for-pickup': 'Prêt pour enlèvement', 'picked-up': 'Pris en charge',
    'at-depot': 'Au dépôt', 'out-for-delivery': 'En livraison', delivered: 'Livré',
    cancelled: 'Annulé', 'refund-requested': 'Litige', refunded: 'Remboursé',
    returned: 'Retourné', 'depot-issue': 'Problème au dépôt', 'delivery-failed': 'Échec de livraison'
};

const AllOrdersView: React.FC<{orders: Order[]}> = ({ orders }) => {
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

const DisputesView: React.FC<{orders: Order[], onResolve: (orderId: string, resolution: 'refunded' | 'rejected') => void}> = ({ orders, onResolve }) => (
    <div className="space-y-4">
        {orders.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Aucun litige en cours.</p>
        ) : (
            orders.map(order => (
                <div key={order.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                    <p className="font-bold">Commande: {order.id}</p>
                    <p className="text-sm">Client: {order.shippingAddress.fullName}</p>
                    <p className="mt-2 text-sm italic">"{order.refundReason}"</p>
                    {order.refundEvidenceUrls && (
                        <div className="mt-2">
                            <p className="text-xs font-semibold">Preuves:</p>
                            <div className="flex gap-2 flex-wrap">{order.refundEvidenceUrls.map((url, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs">Preuve {i+1}</a>)}</div>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => onResolve(order.id, 'rejected')} className="bg-gray-500 text-white px-3 py-1 text-sm rounded-md">Rejeter la demande</button>
                        <button onClick={() => onResolve(order.id, 'refunded')} className="bg-red-500 text-white px-3 py-1 text-sm rounded-md">Approuver le remboursement</button>
                    </div>
                </div>
            ))
        )}
    </div>
);

export const OrdersPanel: React.FC<OrdersPanelProps> = ({ allOrders, onUpdateOrderStatus, onResolveDispute }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'disputes'>('all');
    const disputeOrders = useMemo(() => allOrders.filter(o => o.status === 'refund-requested'), [allOrders]);
    
    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">Gestion des Commandes</h2>
            <div className="flex border-b dark:border-gray-700 mb-4">
                 <button onClick={() => setActiveTab('all')} className={`px-4 py-2 font-semibold ${activeTab === 'all' ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500 dark:text-gray-400'}`}>Toutes les commandes</button>
                 <button onClick={() => setActiveTab('disputes')} className={`relative px-4 py-2 font-semibold ${activeTab === 'disputes' ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500 dark:text-gray-400'}`}>
                    Litiges
                    {disputeOrders.length > 0 && <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{disputeOrders.length}</span>}
                 </button>
            </div>
            {activeTab === 'all' && <AllOrdersView orders={allOrders} />}
            {activeTab === 'disputes' && <DisputesView orders={disputeOrders} onResolve={onResolveDispute}/>}
        </div>
    );
};