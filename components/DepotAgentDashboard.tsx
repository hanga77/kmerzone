import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { Order, OrderStatus, Store, PickupPoint, User, UserAvailabilityStatus, Zone, AgentSchedule, Shift } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { QrCodeIcon, ArchiveBoxIcon, ShoppingBagIcon, UserGroupIcon, BuildingStorefrontIcon, XIcon, CheckIcon, CheckCircleIcon, ChartPieIcon, TruckIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

declare namespace L {
    interface LatLng {
        lat: number;
        lng: number;
        alt?: number;
    }
}

declare const L: any;
declare const Html5Qrcode: any;

interface DepotAgentDashboardProps {
  user: User;
  allUsers: User[];
  allOrders: Order[];
  allStores: Store[];
  allZones: Zone[];
  allPickupPoints: PickupPoint[];
  onLogout: () => void;
  onAssignAgentToOrder: (orderId: string, agentId: string) => void;
  handleDepotCheckIn: (orderId: string, storageLocationId: string, user: User) => void;
  onUpdateSchedule: (depotId: string, newSchedule: AgentSchedule) => void;
}

const StatCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>
        <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
    </div>
);

const ScannerModal: React.FC<{
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    t: (key: string) => string;
}> = ({ onClose, onScanSuccess, t }) => {
    const html5QrCodeRef = useRef<any>(null);
    useEffect(() => {
        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        const startScanner = async () => {
            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    onScanSuccess,
                    () => {}
                );
            } catch (err) { console.error("Scanner start error", err); }
        };
        startScanner();
        return () => {
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch((err: any) => console.error("Scanner stop error", err));
            }
        };
    }, [onScanSuccess]);
    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-white">
                <h3 className="text-xl font-bold mb-4">{t('deliveryDashboard.scanPackage')}</h3>
                <div id="reader" className="w-full h-64 bg-gray-900 rounded-md"></div>
                <button onClick={onClose} className="mt-4 w-full bg-gray-600 py-2 rounded-md">{t('common.cancel')}</button>
            </div>
        </div>
    );
};

const CheckInModal: React.FC<{
    order: Order;
    onClose: () => void;
    onConfirm: (orderId: string, location: string) => void;
    t: (key: string) => string;
}> = ({ order, onClose, onConfirm, t }) => {
    const [location, setLocation] = useState('');
    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">{t('depotDashboard.checkInParcel')}</h3>
                <p className="text-sm mb-4">{t('common.orderId')}: <span className="font-mono">{order.id}</span></p>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium">{t('depotDashboard.storageLocation')}</label>
                    <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value.toUpperCase())} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg">{t('common.cancel')}</button>
                    <button onClick={() => onConfirm(order.id, location)} disabled={!location.trim()} className="bg-green-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">
                        {t('depotDashboard.checkIn')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const InventoryPanel: React.FC<{ inventory: Order[]; depot: PickupPoint | undefined; }> = ({ inventory, depot }) => {
    const { t } = useLanguage();
    const { totalSlots, occupiedSlots, freeSlots, freeLocations } = useMemo(() => {
        if (!depot?.layout) return { totalSlots: 0, occupiedSlots: 0, freeSlots: 0, freeLocations: [] };
        const { aisles, shelves, locations } = depot.layout;
        const total = aisles * shelves * locations;
        const allPossibleLocations = new Set<string>();
        for (let a = 1; a <= aisles; a++) for (let s = 1; s <= shelves; s++) for (let l = 1; l <= locations; l++) allPossibleLocations.add(`A${a}-S${s}-L${l}`);
        const occupied = new Set(inventory.map(o => o.storageLocationId).filter(Boolean) as string[]);
        const free = [...allPossibleLocations].filter(loc => !occupied.has(loc));
        return { totalSlots: total, occupiedSlots: occupied.size, freeSlots: free.length, freeLocations: free, };
    }, [inventory, depot]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard label={t('depotDashboard.inventoryPanel.totalSlots')} value={totalSlots} />
                 <StatCard label={t('depotDashboard.inventoryPanel.occupiedSlots')} value={occupiedSlots} />
                 <StatCard label={t('depotDashboard.inventoryPanel.freeSlots')} value={freeSlots} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-bold mb-2">{t('depotDashboard.inventoryPanel.currentInventory')}</h3>
                     <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md overflow-hidden max-h-96 overflow-y-auto">
                        <table className="w-full text-sm"><thead className="bg-gray-100 dark:bg-gray-700 sticky top-0"><tr><th className="p-2 text-left">{t('depotDashboard.table.orderId')}</th><th className="p-2 text-left">{t('depotDashboard.table.location')}</th><th className="p-2 text-left">{t('depotDashboard.table.customer')}</th></tr></thead>
                            <tbody>
                                {inventory.map(order => (<tr key={order.id} className="border-b dark:border-gray-700"><td className="p-2 font-mono">{order.id}</td><td className="p-2 font-semibold">{order.storageLocationId}</td><td className="p-2">{order.shippingAddress.fullName}</td></tr>))}
                            </tbody>
                        </table>
                        {inventory.length === 0 && <p className="text-center p-4">{t('depotDashboard.noParcelsInStock')}</p>}
                    </div>
                </div>
                <div>
                     <h3 className="font-bold mb-2">{t('depotDashboard.inventoryPanel.freeLocations')}</h3>
                     {depot?.layout ? (<div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4 max-h-96 overflow-y-auto"><div className="flex flex-wrap gap-2">{freeLocations.map(loc => <span key={loc} className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-xs font-mono px-2 py-1 rounded-full">{loc}</span>)}</div></div>) : (<p className="text-center p-4 text-sm text-gray-500">{t('depotDashboard.inventoryPanel.noLayout')}</p>)}
                </div>
            </div>
        </div>
    );
};

const AssignModal: React.FC<{ order: Order; agents: User[]; onAssign: (orderId: string, agentId: string) => void; onCancel: () => void }> = ({ order, agents, onAssign, onCancel }) => {
    const { t } = useLanguage();
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const availableAgents = agents.filter(a => a.availabilityStatus === 'available');
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">{t('depotDashboard.assignDriver')}</h3><p className="text-sm mb-4">{t('common.orderId')}: <span className="font-mono">{order.id}</span></p>
                <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="">{t('depotDashboard.chooseAvailableDriver')}</option>{availableAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select>
                <div className="flex justify-end gap-2 mt-4"><button onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded-lg">{t('common.cancel')}</button><button onClick={() => onAssign(order.id, selectedAgentId)} disabled={!selectedAgentId} className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">{t('depotDashboard.assign')}</button></div>
            </div>
        </div>
    );
};

const ParcelsPanel: React.FC<{
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

const AgentsPanel: React.FC<{ 
    agents: any[];
    depot: PickupPoint;
    onSaveSchedule: (depotId: string, schedule: AgentSchedule) => void;
}> = ({ agents, depot, onSaveSchedule }) => {
    const { t } = useLanguage();
    const [schedule, setSchedule] = useState<AgentSchedule>(depot.schedule || {});
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setSchedule(depot.schedule || {});
    }, [depot.schedule]);

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const shifts: Shift[] = ['Matin', 'Après-midi', 'Nuit', 'Repos'];
    
    const translatedShifts: Record<Shift, string> = {
        'Matin': t('depotDashboard.shifts.morning'),
        'Après-midi': t('depotDashboard.shifts.afternoon'),
        'Nuit': t('depotDashboard.shifts.night'),
        'Repos': t('depotDashboard.shifts.off'),
    };

    const handleScheduleChange = (agentId: string, day: string, value: Shift) => {
        setSchedule(prev => ({
            ...prev,
            [agentId]: {
                ...(prev[agentId] || {}),
                [day]: value,
            },
        }));
    };
    
    const handleSave = () => {
        onSaveSchedule(depot.id, schedule);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
    <div className="space-y-6">
        <div>
            <h3 className="font-bold mb-4">{t('depotDashboard.schedule')}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border dark:border-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">{t('depotDashboard.table.agent')}</th>
                            {days.map(day => <th key={day} className="p-2 text-center">{t(`depotDashboard.weekdays.${day}`)}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map(agent => (
                            <tr key={agent.id} className="border-b dark:border-gray-700">
                                <td className="p-2 font-semibold">{agent.name}</td>
                                {days.map(day => (
                                    <td key={day} className="p-1">
                                        <select
                                            value={schedule[agent.id]?.[day] || 'Repos'}
                                            onChange={e => handleScheduleChange(agent.id, day, e.target.value as Shift)}
                                            className="w-full p-1 border rounded-md text-xs dark:bg-gray-600 dark:border-gray-500"
                                        >
                                            {shifts.map(shift => (
                                                <option key={shift} value={shift}>{translatedShifts[shift]}</option>
                                            ))}
                                        </select>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="mt-4 flex justify-end items-center gap-4">
                {saved && <span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircleIcon className="w-5 h-5"/> {t('depotDashboard.scheduleSaved')}</span>}
                <button onClick={handleSave} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">{t('depotDashboard.saveSchedule')}</button>
            </div>
        </div>
    </div>);
}

const DriversPanel: React.FC<{ deliveryAgents: any[] }> = ({ deliveryAgents }) => {
    const { t } = useLanguage();
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                        <th className="p-2 text-left">{t('depotDashboard.table.agent')}</th>
                        <th className="p-2 text-left">{t('depotDashboard.table.availability')}</th>
                        <th className="p-2 text-left">{t('depotDashboard.table.performance')}</th>
                    </tr>
                </thead>
                <tbody>
                    {deliveryAgents.map(agent => (
                        <tr key={agent.id} className="border-b dark:border-gray-700">
                            <td className="p-2 font-semibold">{agent.name}</td>
                            <td className="p-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${agent.availabilityStatus === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {agent.availabilityStatus === 'available' ? t('deliveryDashboard.available') : t('deliveryDashboard.unavailable')}
                                </span>
                            </td>
                            <td>{t('depotDashboard.successRate')}: {agent.successRate.toFixed(1)}% ({t('depotDashboard.deliveriesSucceeded', agent.deliveredCount, agent.totalMissions)})</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const SellersPanel: React.FC<{ depotInventory: Order[], allStores: Store[] }> = ({ depotInventory, allStores }) => {
    const { t } = useLanguage();
    const sellersWithParcels = useMemo(() => {
        const sellerParcelCount: Record<string, number> = {};
        depotInventory.forEach(order => {
            order.items.forEach(item => {
                sellerParcelCount[item.vendor] = (sellerParcelCount[item.vendor] || 0) + 1;
            });
        });
        return Object.entries(sellerParcelCount).map(([name, count]) => ({ name, count, store: allStores.find(s => s.name === name) }));
    }, [depotInventory, allStores]);

    return (<div>
        <h3 className="font-bold mb-4">{t('depotDashboard.sellersWithParcels')}</h3>
        <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-2 text-left">{t('depotDashboard.table.seller')}</th><th className="p-2 text-left">{t('depotDashboard.table.location')}</th><th className="p-2 text-right">{t('depotDashboard.table.parcels')}</th></tr></thead>
            <tbody>
                {sellersWithParcels.map(({ name, count, store }) => (<tr key={name} className="border-b dark:border-gray-700">
                    <td className="p-2 font-semibold">{name}</td><td className="p-2">{store?.location}, {store?.neighborhood}</td><td className="p-2 text-right font-bold">{count}</td>
                </tr>))}
            </tbody>
        </table>
    </div>);
};

const ReportsPanel: React.FC = () => {
    const { t } = useLanguage();
    return <div className="text-center py-8 text-gray-500">{t('depotDashboard.reportsWIP')}</div>
};

export const DepotAgentDashboard: React.FC<DepotAgentDashboardProps> = ({ user, allUsers, allOrders, allStores, allZones, allPickupPoints, onLogout, onAssignAgentToOrder, handleDepotCheckIn, onUpdateSchedule }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'overview' | 'parcels' | 'inventory' | 'drivers' | 'agents' | 'sellers' | 'reports'>('overview');
    const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [checkingInOrder, setCheckingInOrder] = useState<Order | null>(null);

    const isManager = user.role === 'depot_manager';

    const { ordersToAssign, ordersInDelivery, ordersWithIssues, depotInventory, deliveryAgents, depotAgents, zoneName } = useMemo(() => {
        const userZoneId = user.zoneId; const _zoneName = allZones.find(z => z.id === userZoneId)?.name || 'Inconnue';
        if (!userZoneId || !user.depotId) return { ordersToAssign: [], ordersInDelivery: [], ordersWithIssues: [], depotInventory: [], deliveryAgents: [], depotAgents: [], zoneName: _zoneName };
        const _depotInventory = allOrders.filter(o => o.pickupPointId === user.depotId && o.status === 'at-depot');
        const _ordersToAssign = _depotInventory.filter(o => o.deliveryMethod === 'home-delivery' && !o.agentId);
        const _ordersInDelivery = allOrders.filter(o => o.status === 'out-for-delivery' && allUsers.find(u => u.id === o.agentId)?.zoneId === userZoneId);
        const _ordersWithIssues = allOrders.filter(o => ['returned', 'depot-issue', 'delivery-failed'].includes(o.status) && (o.pickupPointId === user.depotId || allUsers.find(u => u.id === o.agentId)?.zoneId === userZoneId));
        const _deliveryAgents = allUsers.filter(u => u.role === 'delivery_agent' && u.zoneId === userZoneId);
        const _depotAgents = allUsers.filter(u => u.role === 'depot_agent' && u.depotId === user.depotId);
        
        const agentsWithPerf = _deliveryAgents.map(agent => {
            const agentOrders = allOrders.filter(o => o.agentId === agent.id);
            const deliveredCount = agentOrders.filter(o => o.status === 'delivered').length;
            const successRate = agentOrders.length > 0 ? (deliveredCount / agentOrders.length) * 100 : 0;
            return { ...agent, deliveredCount, successRate, totalMissions: agentOrders.length };
        });
        return { ordersToAssign: _ordersToAssign, ordersInDelivery: _ordersInDelivery, ordersWithIssues: _ordersWithIssues, depotInventory: _depotInventory, deliveryAgents: agentsWithPerf, depotAgents: _depotAgents, zoneName: _zoneName };
    }, [allOrders, allUsers, user, allZones]);

    const handleScanSuccess = useCallback((decodedText: string) => {
        setIsScannerOpen(false);
        const order = allOrders.find(o => o.trackingNumber === decodedText);
        if (!order) { alert('Commande non trouvée.'); return; }
        setCheckingInOrder(order);
    }, [allOrders]);

    const handleConfirmCheckIn = useCallback((orderId: string, location: string) => {
        handleDepotCheckIn(orderId, location, user);
        setCheckingInOrder(null);
    }, [handleDepotCheckIn, user]);

    const renderContent = () => {
        const depot = allPickupPoints.find(p => p.id === user.depotId);
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
            case 'inventory': return <InventoryPanel inventory={depotInventory} depot={depot} />;
            case 'drivers': return isManager ? <DriversPanel deliveryAgents={deliveryAgents} /> : null;
            case 'agents': return isManager ? <AgentsPanel agents={[user, ...depotAgents]} depot={depot} onSaveSchedule={(depotId, schedule) => onUpdateSchedule(depotId, schedule)} /> : null;
            case 'sellers': return isManager ? <SellersPanel depotInventory={depotInventory} allStores={allStores} /> : null;
            case 'reports': return isManager ? <ReportsPanel /> : null;
            default: return <div className="text-center py-8 text-gray-500">{t('superadmin.panelUnderConstruction', activeTab)}</div>;
        }
    };

    const TABS = [
        { id: 'overview', label: t('depotDashboard.overview'), icon: <ChartPieIcon className="w-5 h-5"/>, managerOnly: false },
        { id: 'parcels', label: t('depotDashboard.parcels'), icon: <ShoppingBagIcon className="w-5 h-5"/>, managerOnly: false },
        { id: 'inventory', label: t('depotDashboard.inventory'), icon: <ArchiveBoxIcon className="w-5 h-5"/>, managerOnly: false },
        { id: 'drivers', label: t('header.deliveryDashboard'), icon: <TruckIcon className="w-5 h-5"/>, managerOnly: true },
        { id: 'agents', label: t('depotDashboard.agents'), icon: <UserGroupIcon className="w-5 h-5"/>, managerOnly: true },
        { id: 'sellers', label: t('depotDashboard.sellers'), icon: <BuildingStorefrontIcon className="w-5 h-5"/>, managerOnly: true },
        { id: 'reports', label: t('depotDashboard.reports'), icon: <ChartPieIcon className="w-5 h-5"/>, managerOnly: true },
    ].filter(tab => !tab.managerOnly || isManager);


    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
            {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} t={t} />}
            {checkingInOrder && <CheckInModal order={checkingInOrder} onClose={() => setCheckingInOrder(null)} onConfirm={handleConfirmCheckIn} t={t} />}
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