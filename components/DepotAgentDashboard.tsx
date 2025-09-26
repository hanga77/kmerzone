import React, { useState, useMemo, FC } from 'react';
import type { Order, OrderStatus, User, CartItem, Store, Zone } from '../types';
import { ArchiveBoxIcon, ShoppingBagIcon, ChartPieIcon, BuildingStorefrontIcon, TruckIcon, UserGroupIcon, ExclamationTriangleIcon, XIcon, CheckIcon, DocumentTextIcon, MapPinIcon } from './Icons';

interface DepotAgentDashboardProps {
  user: User;
  allUsers: User[];
  allOrders: Order[];
  allStores: Store[];
  allZones: Zone[];
  onLogout: () => void;
  onAssignAgentToOrder: (orderId: string, agentId: string) => void;
}

const statusTranslations: { [key in OrderStatus]: string } = {
    confirmed: 'Confirmée', 'ready-for-pickup': 'Prêt pour enlèvement', 'picked-up': 'Pris en charge',
    'at-depot': 'Au dépôt', 'out-for-delivery': 'En livraison', delivered: 'Livré',
    cancelled: 'Annulé', 'refund-requested': 'Remboursement demandé', refunded: 'Remboursé',
    returned: 'Retourné', 'depot-issue': 'Problème au dépôt', 'delivery-failed': 'Échec de livraison'
};

const AssignModal: FC<{ order: Order; agents: User[]; onAssign: (orderId: string, agentId: string) => void; onCancel: () => void }> = ({ order, agents, onAssign, onCancel }) => {
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const availableAgents = agents.filter(a => a.availabilityStatus === 'available');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Affecter un livreur</h3>
                <p className="text-sm mb-4">Commande: <span className="font-mono">{order.id}</span></p>
                <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="">-- Choisir un livreur disponible --</option>
                    {availableAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded-lg">Annuler</button>
                    <button onClick={() => onAssign(order.id, selectedAgentId)} disabled={!selectedAgentId} className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">Affecter</button>
                </div>
            </div>
        </div>
    );
};

export const DepotAgentDashboard: React.FC<DepotAgentDashboardProps> = ({ user, allUsers, allOrders, allStores, allZones, onLogout, onAssignAgentToOrder }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'parcels' | 'inventory' | 'agents' | 'sellers' | 'reports'>('overview');
    const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);

    const { ordersToAssign, ordersInDelivery, ordersWithIssues, depotInventory, deliveryAgents, zoneName } = useMemo(() => {
        const userZoneId = user.zoneId;
        const _zoneName = allZones.find(z => z.id === userZoneId)?.name || 'Inconnue';

        if (!userZoneId || !user.depotId) return { ordersToAssign: [], ordersInDelivery: [], ordersWithIssues: [], depotInventory: [], deliveryAgents: [], zoneName: _zoneName };
        
        const ordersInDepot = allOrders.filter(o => o.storageLocationId === user.depotId || (o.pickupPointId === user.depotId && o.deliveryMethod === 'pickup'));

        const _ordersToAssign = ordersInDepot.filter(o => o.status === 'at-depot' && o.deliveryMethod === 'home-delivery');
        const _ordersInDelivery = allOrders.filter(o => o.status === 'out-for-delivery' && allUsers.find(u => u.id === o.agentId)?.zoneId === userZoneId);
        const _ordersWithIssues = ordersInDepot.filter(o => ['returned', 'depot-issue', 'delivery-failed'].includes(o.status));

        const _depotInventory = ordersInDepot
            .filter(o => ['at-depot', 'ready-for-pickup'].includes(o.status))
            .flatMap(o => o.items)
            .reduce((acc, item) => {
                const existing = acc.get(item.id);
                if (existing) { existing.quantity += item.quantity; } 
                else { acc.set(item.id, { ...item }); }
                return acc;
            }, new Map<string, CartItem>());

        const _deliveryAgents = allUsers.filter(u => u.role === 'delivery_agent' && u.zoneId === userZoneId);
        
        const agentsWithPerf = _deliveryAgents.map(agent => {
            const agentOrders = allOrders.filter(o => o.agentId === agent.id);
            const deliveredCount = agentOrders.filter(o => o.status === 'delivered').length;
            const successRate = agentOrders.length > 0 ? (deliveredCount / agentOrders.length) * 100 : 0;
            return { ...agent, deliveredCount, successRate, totalMissions: agentOrders.length };
        });

        return {
            ordersToAssign: _ordersToAssign,
            ordersInDelivery: _ordersInDelivery,
            ordersWithIssues: _ordersWithIssues,
            depotInventory: Array.from(_depotInventory.values()),
            deliveryAgents: agentsWithPerf,
            zoneName: _zoneName
        };
    }, [allOrders, allUsers, user, allZones]);

    const OverviewPanel = () => (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg"><h3 className="font-bold text-blue-800 dark:text-blue-300">Colis à affecter</h3><p className="text-3xl font-bold text-blue-600 dark:text-blue-200">{ordersToAssign.length}</p></div>
                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg"><h3 className="font-bold text-indigo-800 dark:text-indigo-300">Colis en livraison</h3><p className="text-3xl font-bold text-indigo-600 dark:text-indigo-200">{ordersInDelivery.length}</p></div>
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg"><h3 className="font-bold text-yellow-800 dark:text-yellow-300">Livreurs disponibles</h3><p className="text-3xl font-bold text-yellow-600 dark:text-yellow-200">{deliveryAgents.filter(a => a.availabilityStatus === 'available').length}</p></div>
             </div>
        </div>
    );
    
    const ParcelsPanel = () => {
        const [subTab, setSubTab] = useState<'to-assign' | 'in-delivery' | 'issues'>('to-assign');
        const ordersToShow = { 'to-assign': ordersToAssign, 'in-delivery': ordersInDelivery, 'issues': ordersWithIssues }[subTab];
        return (
            <div>
                <div className="flex border-b dark:border-gray-700 mb-4">
                    <button onClick={() => setSubTab('to-assign')} className={`px-4 py-2 font-semibold ${subTab==='to-assign' ? 'border-b-2 border-kmer-green text-kmer-green' : ''}`}>À Affecter ({ordersToAssign.length})</button>
                    <button onClick={() => setSubTab('in-delivery')} className={`px-4 py-2 font-semibold ${subTab==='in-delivery' ? 'border-b-2 border-kmer-green text-kmer-green' : ''}`}>En Livraison ({ordersInDelivery.length})</button>
                    <button onClick={() => setSubTab('issues')} className={`px-4 py-2 font-semibold ${subTab==='issues' ? 'border-b-2 border-kmer-green text-kmer-green' : ''}`}>Problèmes ({ordersWithIssues.length})</button>
                </div>
                <div className="space-y-2">
                    {ordersToShow.map(order => (
                        <div key={order.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-bold">{order.id}</p>
                                <p className="text-sm">Client: {order.shippingAddress.fullName} à {order.shippingAddress.city}</p>
                                {order.status === 'out-for-delivery' && <p className="text-sm">Livreur: {allUsers.find(u => u.id === order.agentId)?.name}</p>}
                            </div>
                            {subTab === 'to-assign' && <button onClick={() => setAssigningOrder(order)} className="bg-blue-500 text-white font-bold py-1 px-3 rounded-lg text-sm">Affecter</button>}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const InventoryPanel = () => (
        <div><h3 className="font-bold mb-4">Inventaire Actuel du Dépôt</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {depotInventory.map(item => (
                    <div key={item.id} className="p-3 border rounded-lg text-center">
                        <img src={item.imageUrls[0]} alt={item.name} className="w-16 h-16 object-cover mx-auto rounded-md mb-2"/>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-lg font-bold">{item.quantity} <span className="text-xs">en stock</span></p>
                    </div>
                ))}
            </div>
        </div>
    );
    
    const AgentsPanel = () => (
        <div><h3 className="font-bold mb-4">Gestion des Livreurs de la Zone {zoneName}</h3>
            <div className="space-y-2">
                {deliveryAgents.map(agent => (
                    <div key={agent.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{agent.name}</p>
                            <p className={`text-sm font-bold ${agent.availabilityStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>{agent.availabilityStatus === 'available' ? 'Disponible' : 'Indisponible'}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm">Taux de réussite: {agent.successRate.toFixed(1)}%</p>
                             <p className="text-xs">{agent.deliveredCount} / {agent.totalMissions} livraisons réussies</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    
    const SellersPanel = () => {
        const sellersWithStock = useMemo(() => {
            const sellerIds = new Set(depotInventory.map(item => allStores.find(s => s.name === item.vendor)?.sellerId));
            return allStores.filter(s => sellerIds.has(s.sellerId));
        }, [depotInventory, allStores]);

        return (
             <div><h3 className="font-bold mb-4">Vendeurs avec Colis au Dépôt</h3>
                <div className="space-y-2">
                    {sellersWithStock.map(store => (
                        <div key={store.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={store.logoUrl} alt={store.name} className="w-10 h-10 rounded-full object-contain bg-white" />
                                <div>
                                    <p className="font-semibold">{store.name}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1"><MapPinIcon className="w-3 h-3"/>{store.physicalAddress}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        );
    }

    const ReportsPanel = () => (
         <div><h3 className="font-bold mb-4">Rapports et Statistiques</h3>
            <p className="text-center text-gray-500 py-8">Section des rapports en cours de construction.</p>
         </div>
    );

    const renderContent = () => {
        switch(activeTab) {
            case 'overview': return <OverviewPanel />;
            case 'parcels': return <ParcelsPanel />;
            case 'inventory': return <InventoryPanel />;
            case 'agents': return <AgentsPanel />;
            case 'sellers': return <SellersPanel />;
            case 'reports': return <ReportsPanel />;
            default: return null;
        }
    };
    
    return (
        <>
            {assigningOrder && <AssignModal order={assigningOrder} agents={deliveryAgents} onAssign={(orderId, agentId) => { onAssignAgentToOrder(orderId, agentId); setAssigningOrder(null); }} onCancel={() => setAssigningOrder(null)} />}
            <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
                 <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                    <div className="container mx-auto px-4 sm:px-6 py-3">
                         <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Tableau de bord - Dépôt (Zone {zoneName})</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Chef de Dépôt: {user.name}</p>
                            </div>
                            <button onClick={onLogout} className="text-sm bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Déconnexion</button>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <div className="p-2 border-b dark:border-gray-700 flex flex-wrap justify-around">
                             <button onClick={() => setActiveTab('overview')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'overview' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><ChartPieIcon className="w-5 h-5"/>Aperçu</button>
                             <button onClick={() => setActiveTab('parcels')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'parcels' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><ArchiveBoxIcon className="w-5 h-5"/>Suivi Colis</button>
                             <button onClick={() => setActiveTab('inventory')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'inventory' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><ShoppingBagIcon className="w-5 h-5"/>Inventaire</button>
                             <button onClick={() => setActiveTab('agents')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'agents' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><UserGroupIcon className="w-5 h-5"/>Livreurs</button>
                             <button onClick={() => setActiveTab('sellers')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'sellers' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><BuildingStorefrontIcon className="w-5 h-5"/>Vendeurs</button>
                             <button onClick={() => setActiveTab('reports')} className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold rounded-lg ${activeTab === 'reports' ? 'bg-kmer-green/20 text-kmer-green' : ''}`}><DocumentTextIcon className="w-5 h-5"/>Rapports</button>
                        </div>
                        <div className="p-4 sm:p-6">
                            {renderContent()}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};
