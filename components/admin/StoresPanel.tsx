import React, { useState } from 'react';
import type { Store } from '../../types';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '../Icons';

interface StoresPanelProps {
    allStores: Store[];
    onApproveStore: (store: Store) => void;
    onRejectStore: (store: Store) => void;
    onToggleStoreStatus: (storeId: string, currentStatus: 'active' | 'suspended') => void;
    onWarnStore: (storeId: string, reason: string) => void;
}

export const StoresPanel: React.FC<StoresPanelProps> = ({ allStores, onApproveStore, onRejectStore, onToggleStoreStatus, onWarnStore }) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'suspended'>('pending');
    
    const storesByStatus = {
        pending: allStores.filter(s => s.status === 'pending'),
        active: allStores.filter(s => s.status === 'active'),
        suspended: allStores.filter(s => s.status === 'suspended'),
    };

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">Gestion des Boutiques</h2>
            <div className="flex border-b dark:border-gray-700 mb-4">
                {(Object.keys(storesByStatus) as Array<keyof typeof storesByStatus>).map(status => (
                    <button key={status} onClick={() => setActiveTab(status)} className={`px-4 py-2 font-semibold capitalize ${activeTab === status ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500 dark:text-gray-400'}`}>
                        {status} ({storesByStatus[status].length})
                    </button>
                ))}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">Boutique</th>
                            <th className="p-2 text-left">Vendeur</th>
                            <th className="p-2 text-left">Localisation</th>
                            <th className="p-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {storesByStatus[activeTab].map(store => (
                            <tr key={store.id} className="border-b dark:border-gray-700">
                                <td className="p-2 font-semibold">{store.name}</td>
                                <td className="p-2">{store.sellerFirstName} {store.sellerLastName}</td>
                                <td className="p-2">{store.location}</td>
                                <td className="p-2">
                                    <div className="flex justify-center gap-2">
                                        {activeTab === 'pending' && (
                                            <>
                                                <button onClick={() => onApproveStore(store)} className="text-green-500 flex items-center gap-1 text-xs font-bold"><CheckCircleIcon className="w-4 h-4"/> Approuver</button>
                                                <button onClick={() => onRejectStore(store)} className="text-red-500 flex items-center gap-1 text-xs font-bold"><XCircleIcon className="w-4 h-4"/> Rejeter</button>
                                            </>
                                        )}
                                        {activeTab === 'active' && (
                                            <>
                                                <button onClick={() => onToggleStoreStatus(store.id, 'active')} className="text-red-500 flex items-center gap-1 text-xs font-bold"><XCircleIcon className="w-4 h-4"/> Suspendre</button>
                                                <button onClick={() => { const reason = prompt('Motif de l\'avertissement:'); if(reason) onWarnStore(store.id, reason); }} className="text-yellow-500 flex items-center gap-1 text-xs font-bold"><ExclamationTriangleIcon className="w-4 h-4"/> Avertir</button>
                                            </>
                                        )}
                                        {activeTab === 'suspended' && (
                                            <button onClick={() => onToggleStoreStatus(store.id, 'suspended')} className="text-green-500 flex items-center gap-1 text-xs font-bold"><CheckCircleIcon className="w-4 h-4"/> Activer</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {storesByStatus[activeTab].length === 0 && <p className="text-center text-gray-500 py-8">Aucune boutique dans cette catégorie.</p>}
            </div>
        </div>
    );
};
