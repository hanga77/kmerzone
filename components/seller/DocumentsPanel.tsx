import React from 'react';
import type { Store, DocumentStatus } from '../../types';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface DocumentsPanelProps {
    store: Store;
    onUploadDocument: (storeId: string, documentName: string, fileUrl: string) => void;
}

const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
        case 'verified': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        case 'uploaded': return <ClockIcon className="w-5 h-5 text-blue-500" />;
        case 'rejected': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
        default: return null;
    }
};

const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ store, onUploadDocument }) => {
    const { t } = useLanguage();

    const handleFileUpload = (documentName: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // In a real app, this would upload to a server and return a URL.
            // For now, we simulate with a data URL.
            const reader = new FileReader();
            reader.onload = (event) => {
                onUploadDocument(store.id, documentName, event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{t('sellerDashboard.documents.title')}</h2>
            <div className="space-y-4">
                {store.documents.map(doc => (
                    <div key={doc.name} className="p-4 border rounded-lg dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{doc.name}</p>
                                <p className="text-sm capitalize flex items-center gap-1">{getStatusIcon(doc.status)} {doc.status}</p>
                            </div>
                            {doc.status !== 'verified' && (
                                <label className="bg-blue-500 text-white text-sm font-bold py-1 px-3 rounded-md cursor-pointer">
                                    {doc.status === 'uploaded' ? t('sellerDashboard.documents.replace') : t('sellerDashboard.documents.upload')}
                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(doc.name, e)} />
                                </label>
                            )}
                        </div>
                        {doc.rejectionReason && <p className="text-xs text-red-500 mt-1">{t('sellerDashboard.documents.rejectionReason', doc.rejectionReason)}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentsPanel;