import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { Order, OrderStatus, Store, PickupPoint, User, UserAvailabilityStatus, Zone } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { QrCodeIcon, MapIcon, ListBulletIcon, PhotoIcon, ChartPieIcon, XIcon, CheckIcon, DocumentTextIcon, MapPinIcon, ArchiveBoxIcon, ShoppingBagIcon, UserGroupIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

declare namespace L {
    // Basic type for LatLng to satisfy the type checker for the global L object from Leaflet.
    interface LatLng {
        lat: number;
        lng: number;
        alt?: number;
    }
}

declare const L: any; // Leaflet is loaded from a script tag in index.html
declare const Html5Qrcode: any;

interface DepotAgentDashboardProps {
  user: User;
  allUsers: User[];
  allOrders: Order[];
  allStores: Store[];
  allZones: Zone[];
  onLogout: () => void;
  onAssignAgentToOrder: (orderId: string, agentId: string) => void;
}

const AssignModal: React.FC<{ order: Order; agents: User[]; onAssign: (orderId: string, agentId: string) => void; onCancel: () => void }> = ({ order, agents, onAssign, onCancel }) => {
    const { t } = useLanguage();
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const availableAgents = agents.filter(a => a.availabilityStatus === 'available');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">{t('depotDashboard.assignDriver')}</h3>
                <p className="text-sm mb-4">{t('common.orderId')}: <span className="font-mono">{order.id}</span></p>
                <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="">{t('depotDashboard.chooseAvailableDriver')}</option>
                    {availableAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded-lg">{t('common.cancel')}</button>
                    <button onClick={() => onAssign(order.id, selectedAgentId)} disabled={!selectedAgentId} className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">{t('depotDashboard.assign')}</button>
                </div>
            </div>
        </div>
    );
};

export const DepotAgentDashboard: React.FC<DepotAgentDashboardProps> = ({ user, allUsers, allOrders, allStores, allZones, onLogout, onAssignAgentToOrder }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'overview' | 'parcels' | 'inventory' | 'agents' | 'sellers' | 'reports'>('overview');
    const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);

    const { ordersToAssign, ordersInDelivery, ordersWithIssues, depotInventory, deliveryAgents, zoneName } = useMemo(() => {
        const userZoneId = user.zoneId;
        const _zoneName = allZones.find(z => z.id === userZoneId)?.name || 'Inconnue';

        if (!userZoneId || !user.depotId) return { ordersToAssign: [], ordersInDelivery: [], ordersWithIssues: [], depotInventory: [], deliveryAgents: [], zoneName: _zoneName };
        
        const ordersPhysicallyInDepot = allOrders.filter(o => 
            (o.status === 'at-depot' || o.status === 'ready-for-pickup') &&
            (o.storageLocationId || o.pickupPointId === user.depotId)
        );

        const _ordersToAssign = ordersPhysicallyInDepot.filter(o => o.status === 'at-depot' && o.deliveryMethod === 'home-delivery');
        const _ordersInDelivery = allOrders.filter(o => o.status === 'out-for-delivery' && allUsers.find(u => u.id === o.agentId)?.zoneId === userZoneId);
        const _ordersWithIssues = allOrders.filter(o => ['returned', 'depot-issue', 'delivery-failed'].includes(o.status) && o.pickupPointId === user.depotId);

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
            depotInventory: ordersPhysicallyInDepot,
            deliveryAgents: agentsWithPerf,
            zoneName: _zoneName
        };
    }, [allOrders, allUsers, user, allZones]);

    const OverviewPanel = () => (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg"><h3 className="font-bold text-blue-800 dark:text-blue-300">{t('depotDashboard.parcelsToAssign')}</h3><p className="text-3xl font-bold">{ordersToAssign.length}</p></div>
                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg"><h3 className="font-bold text-indigo-800 dark:text-indigo-300">{t('depotDashboard.parcelsInDelivery')}</h3><p className="text-3xl font-bold">{ordersInDelivery.length}</p></div>
                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg"><h3 className="font-bold text-green-800 dark:text-green-300">{t('depotDashboard.availableAgents')}</h3><p className="text-3xl font-bold">{deliveryAgents.filter(a => a.availabilityStatus === 'available').length}</p></div>
             </div>
        </div>
    );
    
    // Placeholder for other panels
    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewPanel />;
            // other cases can return placeholder text
            default:
                return <div className="text-center py-8 text-gray-500">{t('superadmin.panelUnderConstruction', activeTab)}</div>
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 py-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('depotDashboard.title', zoneName)}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.role === 'depot_manager' ? t('depotDashboard.manager') : 'Agent'}: {user.name}</p>
                        </div>
                        <button onClick={onLogout} className="text-sm bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">{t('depotDashboard.logout')}</button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 sm:px-6 py-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="p-2 border-b dark:border-gray-700 flex justify-start items-center overflow-x-auto">
                        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 font-semibold flex-shrink-0 ${activeTab === 'overview' ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500'}`}>{t('depotDashboard.overview')}</button>
                        <button onClick={() => setActiveTab('parcels')} className={`px-4 py-2 font-semibold flex-shrink-0 ${activeTab === 'parcels' ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500'}`}>{t('depotDashboard.parcels')}</button>
                        <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 font-semibold flex-shrink-0 ${activeTab === 'inventory' ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500'}`}>{t('depotDashboard.inventory')}</button>
                        <button onClick={() => setActiveTab('agents')} className={`px-4 py-2 font-semibold flex-shrink-0 ${activeTab === 'agents' ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500'}`}>{t('depotDashboard.agents')}</button>
                        <button onClick={() => setActiveTab('sellers')} className={`px-4 py-2 font-semibold flex-shrink-0 ${activeTab === 'sellers' ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500'}`}>{t('depotDashboard.sellers')}</button>
                        <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 font-semibold flex-shrink-0 ${activeTab === 'reports' ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500'}`}>{t('depotDashboard.reports')}</button>
                    </div>
                    <div className="p-4">
                        {renderContent()}
                    </div>
                </div>
            </main>
            {assigningOrder && <AssignModal order={assigningOrder} agents={deliveryAgents} onAssign={(orderId, agentId) => {onAssignAgentToOrder(orderId, agentId); setAssigningOrder(null);}} onCancel={() => setAssigningOrder(null)} />}
        </div>
    );
};
