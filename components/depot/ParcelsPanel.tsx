import React, { useState } from 'react';
import type { Order, User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export const ParcelsPanel: React.FC<{
    ordersToAssign: Order[];
    ordersInDelivery: Order[];
    ordersWithIssues: Order[];
    deliveryAgents: User[];
    setAssigningOrder: (order: Order | null) => void;
}> = ({ ordersToAssign, ordersInDelivery, ordersWithIssues, deliveryAgents, setAssigningOrder }) => {
    const { t } = useLanguage();
    const [subTab, setSubTab] = useState<'toAssign' | 'inDelivery' | 'issues'>('toAssign');
    
    const renderTable = (orders: Order[]) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-2 text-left">{t('depotDashboard.table.orderId')}</th><th className="p-2 text-left">{t('depotDashboard.table.customer')}</th><th className="p-2 text-left">{subTab === 'inDelivery' ? t('depotDashboard.table.agent') : t('depotDashboard.table.numItems')}</th><th className="p-2 text-center">{t('common.actions')}</th></tr></thead>
                <tbody>
                    {orders.map(order => (<tr key={order.id} className="border-b dark:border-gray-700">
                        <td className="p-2 font-mono">{order.id}</td><td className="p-2">{order.shippingAddress.fullName}</td><td className="p-2">{subTab === 'inDelivery' ? (deliveryAgents.find(a => a.id === order.agentId)?.name || order.agentId) : order.items.length}</td>
                        <td className="p-2 text-center">{subTab === 'toAssign' && <button onClick={() => setAssigningOrder(order)} className="bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded-md">{t('depotDashboard.assign')}</button>}</td>
                    </tr>))}
                </tbody>
            </table>
            {orders.length === 0 && <p className="text-center p-4 text-gray-500">{t('depotDashboard.noData')}</p>}
        </div>
    );

    return (
        <div>
            <div className="flex border-b dark:border-gray-700 mb-4">
                <button onClick={() => setSubTab('toAssign')} className={`px-4 py-2 font-semibold ${subTab === 'toAssign' ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500'}`}>{t('depotDashboard.toAssign', ordersToAssign.length)}</button>
                <button onClick={() => setSubTab('inDelivery')} className={`px-4 py-2 font-semibold ${subTab === 'inDelivery' ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500'}`}>{t('depotDashboard.inDelivery', ordersInDelivery.length)}</button>
                <button onClick={() => setSubTab('issues')} className={`px-4 py-2 font-semibold ${subTab === 'issues' ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500'}`}>{t('depotDashboard.issues', ordersWithIssues.length)}</button>
            </div>
            {subTab === 'toAssign' && renderTable(ordersToAssign)}
            {subTab === 'inDelivery' && renderTable(ordersInDelivery)}
            {subTab === 'issues' && renderTable(ordersWithIssues)}
        </div>
    );
};
