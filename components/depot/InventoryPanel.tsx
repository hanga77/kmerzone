import React, { useState, useMemo } from 'react';
import type { Order, PickupPoint } from '../../types';
import { CheckCircleIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { StatCard } from './StatCard';

export const InventoryPanel: React.FC<{ inventory: Order[]; depot: PickupPoint | undefined; recentMovements: any[] }> = ({ inventory, depot, recentMovements }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredInventory = useMemo(() => {
        if (!searchTerm) return inventory;
        const lowerSearch = searchTerm.toLowerCase();
        return inventory.filter(order =>
            order.id.toLowerCase().includes(lowerSearch) ||
            order.shippingAddress.fullName.toLowerCase().includes(lowerSearch) ||
            order.storageLocationId?.toLowerCase().includes(lowerSearch)
        );
    }, [inventory, searchTerm]);

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
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('depotDashboard.inventoryPanel.searchPlaceholder')}
                        className="w-full p-2 border rounded-md mb-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                     <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md overflow-hidden max-h-96 overflow-y-auto">
                        <table className="w-full text-sm"><thead className="bg-gray-100 dark:bg-gray-700 sticky top-0"><tr><th className="p-2 text-left">{t('depotDashboard.table.orderId')}</th><th className="p-2 text-left">{t('depotDashboard.table.location')}</th><th className="p-2 text-left">{t('depotDashboard.table.customer')}</th></tr></thead>
                            <tbody>
                                {filteredInventory.map(order => (<tr key={order.id} className="border-b dark:border-gray-700"><td className="p-2 font-mono">{order.id}</td><td className="p-2 font-semibold">{order.storageLocationId}</td><td className="p-2">{order.shippingAddress.fullName}</td></tr>))}
                            </tbody>
                        </table>
                        {filteredInventory.length === 0 && <p className="text-center p-4">{t('depotDashboard.noParcelsInStock')}</p>}
                    </div>
                </div>
                <div>
                     <h3 className="font-bold mb-2">{t('depotDashboard.inventoryPanel.freeLocations')}</h3>
                     {depot?.layout ? (<div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4 max-h-96 overflow-y-auto"><div className="flex flex-wrap gap-2">{freeLocations.map(loc => <span key={loc} className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-xs font-mono px-2 py-1 rounded-full">{loc}</span>)}</div></div>) : (<p className="text-center p-4 text-sm text-gray-500">{t('depotDashboard.inventoryPanel.noLayout')}</p>)}
                </div>
            </div>

            <div className="mt-8">
                <h3 className="font-bold mb-2">{t('depotDashboard.inventoryPanel.recentMovements')}</h3>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="p-2 text-left">{t('depotDashboard.inventoryPanel.table.timestamp')}</th>
                                <th className="p-2 text-left">{t('depotDashboard.inventoryPanel.table.action')}</th>
                                <th className="p-2 text-left">{t('common.orderId')}</th>
                                <th className="p-2 text-left">{t('depotDashboard.inventoryPanel.table.details')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentMovements.map((move, index) => (
                                <tr key={index} className="border-b dark:border-gray-700">
                                    <td className="p-2 text-xs text-gray-500">{new Date(move.timestamp).toLocaleString('fr-FR')}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${move.type === 'Entrée' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'}`}>
                                            {move.type}
                                        </span>
                                    </td>
                                    <td className="p-2 font-mono">{move.orderId}</td>
                                    <td className="p-2 text-xs">{move.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {recentMovements.length === 0 && <p className="text-center p-4 text-gray-500">{t('depotDashboard.noData')}</p>}
                </div>
            </div>
        </div>
    );
};
