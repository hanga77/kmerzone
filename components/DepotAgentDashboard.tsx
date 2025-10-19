import React, { useMemo, useState, useCallback } from 'react';
import type { Order, OrderStatus, Store, PickupPoint, User, UserAvailabilityStatus, Zone, AgentSchedule, Shift, TrackingEvent } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { QrCodeIcon, ArchiveBoxIcon, ShoppingBagIcon, UserGroupIcon, BuildingStorefrontIcon, ChartPieIcon, TruckIcon } from './Icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { ScannerModal } from './shared/ScannerModal';
import { CheckInModal } from './depot/CheckInModal';
import { AssignModal } from './depot/AssignModal';
import { InventoryPanel } from './depot/InventoryPanel';
import { ParcelsPanel } from './depot/ParcelsPanel';
import { AgentsPanel } from './depot/AgentsPanel';
import { DriversPanel } from './depot/DriversPanel';
import { SellersPanel } from './depot/SellersPanel';
import { ReportsPanel } from './depot/ReportsPanel';
import { StatCard } from './depot/StatCard';


interface DepotAgentDashboardProps {
  user: User;
  onLogout: () => void;
  siteData: any;
}

export const DepotAgentDashboard: React.FC<DepotAgentDashboardProps> = ({ user, onLogout, siteData }) => {
    const { t } = useLanguage();
    const { allUsers, allOrders, allStores, allZones, allPickupPoints, handleDepotCheckIn, handleAssignAgentToOrder, handleUpdateSchedule } = siteData;
    const [activeTab, setActiveTab] = useState<'overview' | 'parcels' | 'inventory' | 'drivers' | 'agents' | 'sellers' | 'reports'>('overview');
    const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [checkingInOrder, setCheckingInOrder] = useState<Order | null>(null);

    const isManager = user.role === 'depot_manager';

    const onAssignAgentToOrder = (orderId: string, agentId: string) => {
        handleAssignAgentToOrder(orderId, agentId);
    };

    const onConfirmCheckIn = (orderId: string, location: string) => {
        handleDepotCheckIn(orderId, location);
    };
    
    const onUpdateSchedule = (depotId: string, schedule: AgentSchedule) => {
        handleUpdateSchedule(depotId, schedule);
    };

    const { ordersToAssign, ordersInDelivery, ordersWithIssues, depotInventory, deliveryAgents, depotAgents, zoneName, recentMovements, depotOrders } = useMemo(() => {
        const userZoneId = user.zoneId; const _zoneName = allZones.find((z: Zone) => z.id === userZoneId)?.name || 'Inconnue';
        if (!userZoneId || !user.depotId) return { ordersToAssign: [], ordersInDelivery: [], ordersWithIssues: [], depotInventory: [], deliveryAgents: [], depotAgents: [], zoneName: _zoneName, recentMovements: [], depotOrders: [] };
        
        const _depotOrders = allOrders.filter((o: Order) => o.pickupPointId === user.depotId || allUsers.find((u: User) => u.id === o.agentId)?.zoneId === userZoneId);
        
        const _depotInventory = _depotOrders.filter((o: Order) => o.status === 'at-depot' && o.storageLocationId);
        const _ordersToAssign = _depotInventory.filter((o: Order) => o.deliveryMethod === 'home-delivery' && !o.agentId);
        const _ordersInDelivery = _depotOrders.filter((o: Order) => o.status === 'out-for-delivery');
        const _ordersWithIssues = _depotOrders.filter((o: Order) => ['returned', 'depot-issue', 'delivery-failed'].includes(o.status));
        const _deliveryAgents = allUsers.filter((u: User) => u.role === 'delivery_agent' && u.zoneId === userZoneId);
        const _depotAgents = allUsers.filter((u: User) => u.role === 'depot_agent' && u.depotId === user.depotId);
        
        const agentsWithPerf = _deliveryAgents.map(agent => {
            const agentOrders = allOrders.filter((o: Order) => o.agentId === agent.id);
            const deliveredCount = agentOrders.filter((o: Order) => o.status === 'delivered').length;
            const successRate = agentOrders.length > 0 ? (deliveredCount / agentOrders.length) * 100 : 0;
            return { ...agent, deliveredCount, successRate, totalMissions: agentOrders.length };
        });

        const movements = _depotOrders.flatMap((order: Order) =>
            order.trackingHistory
                .filter(event =>
                    (event.status === 'at-depot' && event.details.includes('emplacement')) ||
                    (event.status === 'out-for-delivery' && event.details.includes('assigné au livreur'))
                )
                .map(event => ({
                    type: event.status === 'at-depot' ? 'Entrée' : 'Sortie',
                    orderId: order.id,
                    timestamp: event.date,
                    details: event.details.split('. ').pop() || event.details, // Get the relevant part
                }))
        );
        const sortedMovements = movements.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);

        return { ordersToAssign: _ordersToAssign, ordersInDelivery: _ordersInDelivery, ordersWithIssues: _ordersWithIssues, depotInventory: _depotInventory, deliveryAgents: agentsWithPerf, depotAgents: _depotAgents, zoneName: _zoneName, recentMovements: sortedMovements, depotOrders: _depotOrders };
    }, [allOrders, allUsers, user, allZones]);

    const handleScanSuccess = useCallback((decodedText: string) => {
        setIsScannerOpen(false);
        const order = allOrders.find((o: Order) => o.trackingNumber === decodedText);
        if (!order) { alert('Commande non trouvée.'); return; }
        setCheckingInOrder(order);
    }, [allOrders]);

    const handleConfirmCheckInAndClose = useCallback((orderId: string, location: string) => {
        onConfirmCheckIn(orderId, location);
        setCheckingInOrder(null);
    }, [onConfirmCheckIn]);

    const renderContent = () => {
        const depot = allPickupPoints.find((p: PickupPoint) => p.id === user.depotId);
        if (!depot) return <p>Erreur: Dépôt non trouvé.</p>;

        switch (activeTab) {
            case 'overview': return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard label={t('depotDashboard.parcelsToAssign')} value={ordersToAssign.length} />
                        <StatCard label={t('depotDashboard.parcelsInDelivery')} value={ordersInDelivery.length} />
                        <StatCard label={t('depotDashboard.availableAgents')} value={deliveryAgents.filter(a => a.availabilityStatus === 'available').length} />
                    </div>
                </div>
            );
            case 'parcels': return <ParcelsPanel ordersToAssign={ordersToAssign} ordersInDelivery={ordersInDelivery} ordersWithIssues={ordersWithIssues} deliveryAgents={deliveryAgents} setAssigningOrder={setAssigningOrder} />;
            case 'inventory': return <InventoryPanel inventory={depotInventory} depot={depot} recentMovements={recentMovements} />;
            case 'drivers': return isManager ? <DriversPanel deliveryAgents={deliveryAgents} /> : null;
            case 'agents': return isManager ? <AgentsPanel agents={[user, ...depotAgents]} depot={depot} onSaveSchedule={(depotId, schedule) => onUpdateSchedule(depotId, schedule)} /> : null;
            case 'sellers': return isManager ? <SellersPanel depotInventory={depotInventory} allStores={allStores} /> : null;
            case 'reports': return isManager ? <ReportsPanel depotOrders={depotOrders} deliveryAgents={deliveryAgents} /> : null;
            default: return <div className="text-center py-8 text-gray-500">{t('superadmin.panelUnderConstruction', activeTab)}</div>;
        }
    };

    const TABS = [
        { id: 'overview', label: t('depotDashboard.overview'), icon: <ChartPieIcon className="w-5 h-5"/>, managerOnly: false },
        { id: 'parcels', label: t('depotDashboard.parcels'), icon: <ShoppingBagIcon className="w-5 h-5"/>, managerOnly: false },
        { id: 'inventory', label: t('depotDashboard.inventory'), icon: <ArchiveBoxIcon className="w-5 h-5"/>, managerOnly: false },
        { id: 'drivers', label: t('depotDashboard.drivers'), icon: <TruckIcon className="w-5 h-5"/>, managerOnly: true },
        { id: 'agents', label: t('depotDashboard.agents'), icon: <UserGroupIcon className="w-5 h-5"/>, managerOnly: true },
        { id: 'sellers', label: t('depotDashboard.sellers'), icon: <BuildingStorefrontIcon className="w-5 h-5"/>, managerOnly: true },
        { id: 'reports', label: t('depotDashboard.reports'), icon: <ChartPieIcon className="w-5 h-5"/>, managerOnly: true },
    ].filter(tab => !tab.managerOnly || isManager);


    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
            {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} t={t} />}
            {checkingInOrder && <CheckInModal order={checkingInOrder} onClose={() => setCheckingInOrder(null)} onConfirm={handleConfirmCheckInAndClose} t={t} />}
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 py-3">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('depotDashboard.title', zoneName)}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{isManager ? t('depotDashboard.manager') : 'Agent'}: {user.name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsScannerOpen(true)} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                                <QrCodeIcon className="w-5 h-5"/> {t('depotDashboard.scanAndCheckIn')}
                            </button>
                            <button onClick={onLogout} className="text-sm bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">{t('depotDashboard.logout')}</button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 sm:px-6 py-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="p-2 border-b dark:border-gray-700 flex justify-start items-center overflow-x-auto">
                         {TABS.map(tab => (
                             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 font-semibold flex-shrink-0 flex items-center gap-2 ${activeTab === tab.id ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500'}`}>
                                 {tab.icon} {tab.label}
                             </button>
                         ))}
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