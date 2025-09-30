import React, { useState } from 'react';
import type { Store, DocumentStatus } from '../../types';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, CheckIcon, XIcon, DocumentTextIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface StoresPanelProps {
    allStores: Store[];
    onApproveStore: (store: Store) => void;
    onRejectStore: (store: Store) => void;
    onToggleStoreStatus: (storeId: string, currentStatus: 'active' | 'suspended') => void;
    onWarnStore: (storeId: string, reason: string) => void;
    onUpdateDocumentStatus: (storeId: string, documentName: string, status: DocumentStatus, reason?: string) => void;
}

const DocumentStatusBadge: React.FC<{status: DocumentStatus}> = ({ status }) => {
    const styles = {
        requested: 'bg-gray-200 text-gray-700',
        uploaded: 'bg-blue-100 text-blue-700',
        verified: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
}

export const StoresPanel: React.FC<StoresPanelProps> = ({ allStores, onApproveStore, onRejectStore, onToggleStoreStatus, onWarnStore, onUpdateDocumentStatus }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'suspended'>('pending');
    
    const storesByStatus = {
        pending: allStores.filter(s => s.status === 'pending'),
        active: allStores.filter(s => s.status === 'active'),
        suspended: allStores.filter(s => s.status === 'suspended'),
    };
    
    const tabLabels: Record<typeof activeTab, string> = {
        pending: t('superadmin.stores.tabs.pending'),
        active: t('superadmin.stores.tabs.active'),
        suspended: t('superadmin.stores.tabs.suspended'),
    }

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">{t('superadmin.stores.title')}</h2>
            <div className="flex border-b dark:border-gray-700 mb-4">
                {(Object.keys(storesByStatus) as Array<keyof typeof storesByStatus>).map(status => (
                    <button key={status} onClick={() => setActiveTab(status)} className={`px-4 py-2 font-semibold capitalize ${activeTab === status ? 'border-b-2 border-kmer-green text-kmer-green' : 'text-gray-500 dark:text-gray-400'}`}>
                        {tabLabels[status]} ({storesByStatus[status].length})
                    </button>
                ))}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">{t('superadmin.stores.table.store')}</th>
                            <th className="p-2 text-left">{t('superadmin.stores.table.seller')}</th>
                            {activeTab === 'pending' && <th className="p-2 text-left">{t('superadmin.stores.table.documents')}</th>}
                            <th className="p-2 text-left">{t('superadmin.stores.table.location')}</th>
                            <th className="p-2 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {storesByStatus[activeTab].map(store => (
                            <tr key={store.id} className="border-b dark:border-gray-700">
                                <td className="p-2 font-semibold">{store.name}</td>
                                <td className="p-2">{store.sellerFirstName} {store.sellerLastName}</td>
                                 {activeTab === 'pending' && (
                                    <td className="p-2">
                                        {store.documents.map(doc => (
                                            <div key={doc.name} className="flex items-center gap-2 mb-1">
                                                <DocumentStatusBadge status={doc.status}/>
                                                <span>{doc.name}</span>
                                                {doc.status === 'uploaded' && (
                                                    <div className="flex items-center">
                                                        <button onClick={() => onUpdateDocumentStatus(store.id, doc.name, 'verified')} className="p-1 text-green-500"><CheckIcon className="w-4 h-4"/></button>
                                                        <button onClick={() => {
                                                            const reason = prompt(t('superadmin.stores.rejectionReason'));
                                                            if(reason) onUpdateDocumentStatus(store.id, doc.name, 'rejected', reason);
                                                        }} className="p-1 text-red-500"><XIcon className="w-4 h-4"/></button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </td>
                                )}
                                <td className="p-2">{store.location}</td>
                                <td className="p-2">
                                    <div className="flex justify-center gap-2">
                                        {activeTab === 'pending' && (
                                            <>
                                                <button onClick={() => onApproveStore(store)} className="text-green-500 flex items-center gap-1 text-xs font-bold"><CheckCircleIcon className="w-4 h-4"/> {t('common.approve')}</button>
                                                <button onClick={() => onRejectStore(store)} className="text-red-500 flex items-center gap-1 text-xs font-bold"><XCircleIcon className="w-4 h-4"/> {t('common.reject')}</button>
                                            </>
                                        )}
                                        {activeTab === 'active' && (
                                            <>
                                                <button onClick={() => onToggleStoreStatus(store.id, 'active')} className="text-red-500 flex items-center gap-1 text-xs font-bold"><XCircleIcon className="w-4 h-4"/> {t('superadmin.stores.tabs.suspended')}</button>
                                                <button onClick={() => { const reason = prompt(`${t('superadmin.stores.warnReason')}:`); if(reason) onWarnStore(store.id, reason); }} className="text-yellow-500 flex items-center gap-1 text-xs font-bold"><ExclamationTriangleIcon className="w-4 h-4"/> {t('common.warn')}</button>
                                            </>
                                        )}
                                        {activeTab === 'suspended' && (
                                            <button onClick={() => onToggleStoreStatus(store.id, 'suspended')} className="text-green-500 flex items-center gap-1 text-xs font-bold"><CheckCircleIcon className="w-4 h-4"/> {t('superadmin.stores.tabs.active')}</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {storesByStatus[activeTab].length === 0 && <p className="text-center text-gray-500 py-8">{t('superadmin.stores.noStores')}</p>}
            </div>
        </div>
    );
};
