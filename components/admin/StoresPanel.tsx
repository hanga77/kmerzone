import React, { useState } from 'react';
import type { Store, DocumentStatus } from '../../types';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, CheckIcon, XIcon, DocumentTextIcon, ShieldCheckIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface StoresPanelProps {
    allStores: Store[];
    onApproveStore: (store: Store) => void;
    onRejectStore: (store: Store) => void;
    onToggleStoreStatus: (storeId: string, currentStatus: 'active' | 'suspended') => void;
    onWarnStore: (storeId: string, reason: string) => void;
    onUpdateDocumentStatus: (storeId: string, documentName: string, status: DocumentStatus, reason?: string) => void;
    onToggleStoreCertification: (storeId: string) => void;
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

const WarningDetailsModal: React.FC<{ store: Store; onClose: () => void; t: (key: string, ...args: any[]) => string; }> = ({ store, onClose, t }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{t('superadmin.stores.warningsFor', store.name)}</h3>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"/></button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {store.warnings.map(warning => (
                        <div key={warning.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400">
                            <p className="font-semibold text-sm">{t('superadmin.stores.warningOnDate', new Date(warning.date).toLocaleString('fr-FR'))}</p>
                            <p className="text-gray-700 dark:text-gray-300">{warning.reason}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export const StoresPanel: React.FC<StoresPanelProps> = ({ allStores, onApproveStore, onRejectStore, onToggleStoreStatus, onWarnStore, onUpdateDocumentStatus, onToggleStoreCertification }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'suspended' | 'rejected'>('pending');
    const [viewingWarningsFor, setViewingWarningsFor] = useState<Store | null>(null);
    
    const storesByStatus = {
        pending: allStores.filter(s => s.status === 'pending'),
        active: allStores.filter(s => s.status === 'active'),
        suspended: allStores.filter(s => s.status === 'suspended'),
        rejected: allStores.filter(s => s.status === 'rejected'),
    };
    
    const tabLabels: Record<typeof activeTab, string> = {
        pending: t('superadmin.stores.tabs.pending'),
        active: t('superadmin.stores.tabs.active'),
        suspended: t('superadmin.stores.tabs.suspended'),
        rejected: t('superadmin.stores.tabs.rejected'),
    }

    return (
        <div className="p-4 sm:p-6">
            {viewingWarningsFor && <WarningDetailsModal store={viewingWarningsFor} onClose={() => setViewingWarningsFor(null)} t={t} />}

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
                            <th className="p-2 text-left">{t('superadmin.stores.table.documents')}</th>
                            <th className="p-2 text-left">{t('superadmin.stores.table.location')}</th>
                            <th className="p-2 text-center">{t('superadmin.stores.table.certified')}</th>
                            <th className="p-2 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {storesByStatus[activeTab].map(store => (
                            <tr key={store.id} className="border-b dark:border-gray-700">
                                <td className="p-2 font-semibold">
                                    {store.name}
                                    {store.warnings && store.warnings.length > 0 && (
                                        <button onClick={() => setViewingWarningsFor(store)} className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full hover:bg-yellow-200">
                                            {store.warnings.length} {t('superadmin.stores.warningsSuffix')}
                                        </button>
                                    )}
                                </td>
                                <td className="p-2">{store.sellerFirstName} {store.sellerLastName}</td>
                                <td className="p-2 align-top">
                                    {store.documents.map(doc => (
                                         <div key={doc.name} className="mb-1">
                                            <div className="flex items-center gap-2">
                                                <DocumentStatusBadge status={doc.status}/>
                                                <span>{doc.name}</span>
                                                {doc.fileUrl && doc.fileUrl !== '...' && (
                                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" title={t('superadmin.stores.viewDocument')} className="text-blue-500 hover:underline">
                                                        <DocumentTextIcon className="w-4 h-4"/>
                                                    </a>
                                                )}
                                                {doc.status === 'uploaded' && (
                                                    <div className="flex items-center">
                                                        <button onClick={() => onUpdateDocumentStatus(store.id, doc.name, 'verified')} className="p-1 text-green-500" title={t('common.approve')}><CheckIcon className="w-4 h-4"/></button>
                                                        <button onClick={() => {
                                                            const reason = prompt(t('superadmin.stores.rejectionReason'));
                                                            if(reason) onUpdateDocumentStatus(store.id, doc.name, 'rejected', reason);
                                                        }} className="p-1 text-red-500" title={t('common.reject')}><XIcon className="w-4 h-4"/></button>
                                                    </div>
                                                )}
                                            </div>
                                            {doc.status === 'rejected' && doc.rejectionReason && (
                                                <p className="text-xs text-red-500 pl-2">{t('superadmin.stores.rejectionReasonText')}: {doc.rejectionReason}</p>
                                            )}
                                        </div>
                                    ))}
                                    {store.documents.length === 0 && <span className="text-xs text-gray-400">Aucun</span>}
                                </td>
                                <td className="p-2">{store.location}</td>
                                <td className="p-2 text-center">
                                    {store.isCertified ? 
                                        <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" title="Certifié" /> : 
                                        <span className="text-gray-400">-</span>
                                    }
                                </td>
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
                                                <button onClick={() => onToggleStoreCertification(store.id)} className={`flex items-center gap-1 text-xs font-bold ${store.isCertified ? 'text-yellow-600' : 'text-green-600'}`} title={store.isCertified ? "Retirer la certification" : "Certifier la boutique"}>
                                                    <ShieldCheckIcon className="w-4 h-4"/>
                                                </button>
                                                <button onClick={() => onToggleStoreStatus(store.id, 'active')} className="text-red-500 flex items-center gap-1 text-xs font-bold"><XCircleIcon className="w-4 h-4"/> {t('superadmin.stores.tabs.suspended')}</button>
                                                <button onClick={() => { const reason = prompt(`${t('superadmin.stores.warnReason')}:`); if(reason) onWarnStore(store.id, reason); }} className="text-yellow-500 flex items-center gap-1 text-xs font-bold"><ExclamationTriangleIcon className="w-4 h-4"/> {t('common.warn')}</button>
                                            </>
                                        )}
                                        {activeTab === 'suspended' && (
                                            <button onClick={() => onToggleStoreStatus(store.id, 'suspended')} className="text-green-500 flex items-center gap-1 text-xs font-bold"><CheckCircleIcon className="w-4 h-4"/> {t('superadmin.stores.tabs.active')}</button>
                                        )}
                                        {activeTab === 'rejected' && (
                                            <span className="text-xs text-gray-500 italic">Aucune action</span>
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