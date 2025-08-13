import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Order, Category, OrderStatus, Store, SiteActivityLog, UserRole, FlashSale, Product, FlashSaleProduct, RequestedDocument, PickupPoint, User, Warning, SiteSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AcademicCapIcon, ClockIcon, BuildingStorefrontIcon, ExclamationTriangleIcon, UsersIcon, ShoppingBagIcon, TagIcon, BoltIcon, CheckCircleIcon, XCircleIcon, XIcon, DocumentTextIcon, MapPinIcon, PencilSquareIcon, TrashIcon, ChartPieIcon, CurrencyDollarIcon, UserGroupIcon, Cog8ToothIcon, ChatBubbleBottomCenterTextIcon, ScaleIcon, StarIcon, StarPlatinumIcon, PlusIcon } from './Icons';
import FlashSaleForm from './FlashSaleForm';

interface SuperAdminDashboardProps {
  allOrders: Order[];
  allCategories: Category[];
  allStores: Store[];
  allUsers: User[];
  siteActivityLogs: SiteActivityLog[];
  flashSales: FlashSale[];
  allProducts: Product[];
  allPickupPoints: PickupPoint[];
  siteSettings: SiteSettings;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateCategoryImage: (categoryId: string, imageUrl: string) => void;
  onWarnStore: (storeId: string, reason: string) => void;
  onToggleStoreStatus: (storeId: string) => void;
  onApproveStore: (storeId: string) => void;
  onRejectStore: (storeId: string) => void;
  onSaveFlashSale: (flashSale: Omit<FlashSale, 'id' | 'products'>) => void;
  onUpdateFlashSaleSubmissionStatus: (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => void;
  onBatchUpdateFlashSaleStatus: (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => void;
  onRequestDocument: (storeId: string, documentName: string) => void;
  onVerifyDocumentStatus: (storeId: string, documentName: string, status: 'verified' | 'rejected', reason?: string) => void;
  onAddPickupPoint: (pointData: Omit<PickupPoint, 'id'>) => void;
  onUpdatePickupPoint: (updatedPoint: PickupPoint) => void;
  onDeletePickupPoint: (pointId: string) => void;
  onAssignAgent: (orderId: string, agentId: string) => void;
  isChatEnabled: boolean;
  isComparisonEnabled: boolean;
  onToggleChatFeature: () => void;
  onToggleComparisonFeature: () => void;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
}

const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-3 text-sm font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
            isActive
                ? 'text-kmer-green border-kmer-green'
                : 'text-gray-500 border-transparent hover:text-kmer-green hover:border-kmer-green/50 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const statusTranslations: Record<OrderStatus, string> = {
    confirmed: 'Confirmée',
    'ready-for-pickup': 'Prêt pour enlèvement',
    'picked-up': 'Pris en charge',
    'at-depot': 'Au dépôt',
    'out-for-delivery': 'En livraison',
    delivered: 'Livré',
    cancelled: 'Annulé',
    'refund-requested': 'Remboursement demandé',
    refunded: 'Remboursé'
};

const WarningModal: React.FC<{
    store: Store,
    onClose: () => void,
    onConfirm: (reason: string) => void
}> = ({ store, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) {
            alert("Veuillez fournir un motif pour l'avertissement.");
            return;
        }
        onConfirm(reason);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-lg w-full relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <XIcon className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold mb-4 dark:text-white">Avertir la boutique "{store.name}"</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    L'avertissement sera enregistré et visible par le vendeur. Après 3 avertissements, la boutique sera automatiquement suspendue.
                </p>
                <div>
                    <label htmlFor="warning-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motif de l'avertissement</label>
                    <textarea 
                        id="warning-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Ex: Non-respect des délais de livraison, plaintes répétées de clients..."
                    />
                </div>
                 <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-md">Annuler</button>
                    <button onClick={handleConfirm} className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">Envoyer l'avertissement</button>
                </div>
            </div>
        </div>
    );
};


const ManageDocumentsModal: React.FC<{
    store: Store,
    onClose: () => void,
    onRequestDocument: (storeId: string, documentName: string) => void,
    onVerifyDocumentStatus: (storeId: string, documentName: string, status: 'verified' | 'rejected', reason?: string) => void,
}> = ({ store, onClose, onRequestDocument, onVerifyDocumentStatus }) => {
    const [newDocName, setNewDocName] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingDoc, setRejectingDoc] = useState<string | null>(null);

    const handleRequest = () => {
        if (newDocName.trim()) {
            onRequestDocument(store.id, newDocName.trim());
            setNewDocName('');
        }
    }
    
    const handleReject = () => {
        if(rejectingDoc && rejectionReason.trim()) {
            onVerifyDocumentStatus(store.id, rejectingDoc, 'rejected', rejectionReason.trim());
            setRejectingDoc(null);
            setRejectionReason('');
        }
    }
    
    const getDocStatusClass = (status: string) => ({
        'requested': 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
        'uploaded': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'verified': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    }[status]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-2xl w-full relative h-[90vh] flex flex-col">
                <h3 className="text-xl font-bold mb-4 dark:text-white flex-shrink-0">Gérer les documents pour "{store.name}"</h3>
                <div className="overflow-y-auto flex-grow mb-4">
                  {store.documents.map(doc => (
                    <div key={doc.name} className="p-3 my-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold dark:text-gray-200">{doc.name}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDocStatusClass(doc.status)}`}>{doc.status}</span>
                               {doc.status === 'rejected' && <p className="text-xs text-red-500 mt-1">Motif: {doc.rejectionReason}</p>}
                          </div>
                            <div className="flex gap-2 items-center">
                                {(doc.status === 'uploaded' || doc.status === 'verified') && doc.fileUrl && (
                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Voir</a>
                                )}
                                {doc.status === 'uploaded' && (
                                    <>
                                        <button onClick={() => onVerifyDocumentStatus(store.id, doc.name, 'verified')} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Vérifier</button>
                                        <button onClick={() => setRejectingDoc(doc.name)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Rejeter</button>
                                    </>
                                )}
                            </div>
                        </div>
                        {rejectingDoc === doc.name && (
                            <div className="mt-2 flex gap-2">
                                <input type="text" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Motif du rejet" className="w-full text-sm border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600"/>
                                <button onClick={handleReject} className="bg-red-600 text-white px-3 rounded-md text-sm">Confirmer</button>
                                <button onClick={() => setRejectingDoc(null)} className="text-sm">Annuler</button>
                            </div>
                        )}
                    </div>
                  ))}
                  {store.documents.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aucun document demandé pour cette boutique.</p>}
                </div>
                <div className="border-t pt-4 flex-shrink-0 dark:border-gray-700">
                    <h4 className="font-semibold dark:text-white">Demander un nouveau document</h4>
                    <div className="flex gap-2 mt-2">
                        <input type="text" value={newDocName} onChange={e => setNewDocName(e.target.value)} placeholder="Ex: CNI, Registre de Commerce" className="w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600"/>
                        <button onClick={handleRequest} className="bg-kmer-green text-white px-4 py-2 rounded-md">Demander</button>
                    </div>
                </div>
                <button onClick={onClose} className="mt-4 w-full bg-gray-200 dark:bg-gray-600 py-2 rounded-md flex-shrink-0">Fermer</button>
            </div>
        </div>
    );
};


const StoreManagementPanel: React.FC<{
  stores: Store[],
  onWarnStore: (id: string, reason: string) => void,
  onToggleStoreStatus: (id: string) => void,
  onApproveStore: (id: string) => void,
  onRejectStore: (id: string) => void,
  onRequestDocument: (storeId: string, documentName: string) => void;
  onVerifyDocumentStatus: (storeId: string, documentName: string, status: 'verified' | 'rejected', reason?: string) => void;
}> = (props) => {
  const { stores, onWarnStore, onToggleStoreStatus, onApproveStore, onRejectStore, onRequestDocument, onVerifyDocumentStatus } = props;
  const [managingDocsForStore, setManagingDocsForStore] = useState<Store | null>(null);
  const [warningStore, setWarningStore] = useState<Store | null>(null);

  const handleConfirmWarning = (reason: string) => {
    if (warningStore) {
        onWarnStore(warningStore.id, reason);
        setWarningStore(null);
    }
  };
  
  const StoreListSection: React.FC<{ title: string, stores: Store[] }> = ({ title, stores }) => (
    <div className="mb-8">
        <h3 className="font-bold text-lg mb-2 dark:text-gray-200">{title} ({stores.length})</h3>
        {stores.length > 0 ? (
          <>
            <div className="md:hidden space-y-3">
              {stores.map(store => {
                const allDocsVerified = store.documents.length > 0 && store.documents.every(d => d.status === 'verified');
                return (
                    <div key={store.id} className="bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                        <div>
                            <div className="font-bold dark:text-white">{store.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{store.sellerFirstName} {store.sellerLastName}</div>
                        </div>
                        <div className="text-center text-xs">
                            <div className="font-bold text-lg dark:text-gray-200">{store.warnings.length}</div>
                            <div className="text-gray-500">Avert.</div>
                        </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300 border-t dark:border-gray-600 pt-2">
                            <div>{store.sellerPhone}</div>
                            <div>{store.physicalAddress}, {store.location}</div>
                        </div>
                        <div className="text-xs flex flex-wrap gap-2 border-t dark:border-gray-600 pt-3">
                        {store.status === 'pending' && (
                            <>
                            <button onClick={() => onApproveStore(store.id)} disabled={!allDocsVerified} title={!allDocsVerified ? "Tous les documents doivent être vérifiés" : "Approuver la boutique"} className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                <CheckCircleIcon className="w-4 h-4" /> Approuver
                            </button>
                            <button onClick={() => onRejectStore(store.id)} className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                                <XCircleIcon className="w-4 h-4" /> Rejeter
                            </button>
                            <button onClick={() => setManagingDocsForStore(store)} className="flex items-center gap-1 bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600">
                                <DocumentTextIcon className="w-4 h-4" /> Docs
                            </button>
                            </>
                        )}
                        {store.status === 'active' && (
                            <>
                                <button onClick={() => setWarningStore(store)} className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                                    <ExclamationTriangleIcon className="w-4 h-4" /> Avertir
                                </button>
                                <button onClick={() => onToggleStoreStatus(store.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                                    Suspendre
                                </button>
                            </>
                        )}
                        {store.status === 'suspended' && (
                            <button onClick={() => onToggleStoreStatus(store.id)} className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                                Réactiver
                            </button>
                        )}
                        </div>
                    </div>
                )
              })}
            </div>

            <div className="hidden md:block overflow-x-auto border dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3">Boutique / Vendeur</th>
                            <th className="px-4 py-3">Contact / Adresse</th>
                            <th className="px-4 py-3 text-center">Avert.</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.map(store => {
                            const allDocsVerified = store.documents.length > 0 && store.documents.every(d => d.status === 'verified');
                            return (
                                <tr key={store.id} className="border-b dark:border-gray-600 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3 font-medium">
                                        <div className="text-base dark:text-white font-semibold">{store.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{store.sellerFirstName} {store.sellerLastName}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs dark:text-gray-300">
                                        <div>{store.sellerPhone}</div>
                                        <div>{store.physicalAddress}, {store.location}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold dark:text-gray-200">{store.warnings.length} / 3</td>
                                    <td className="px-4 py-3 text-xs flex flex-wrap gap-2">
                                        {store.status === 'pending' && (
                                        <>
                                            <button onClick={() => onApproveStore(store.id)} disabled={!allDocsVerified} title={!allDocsVerified ? "Tous les documents doivent être vérifiés" : "Approuver la boutique"} className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                                <CheckCircleIcon className="w-4 h-4" /> Approuver
                                            </button>
                                            <button onClick={() => onRejectStore(store.id)} className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                                                <XCircleIcon className="w-4 h-4" /> Rejeter
                                            </button>
                                            <button onClick={() => setManagingDocsForStore(store)} className="flex items-center gap-1 bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600">
                                                <DocumentTextIcon className="w-4 h-4" /> Docs
                                            </button>
                                        </>
                                        )}
                                        {store.status === 'active' && (
                                        <>
                                            <button onClick={() => setWarningStore(store)} className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                                                <ExclamationTriangleIcon className="w-4 h-4" /> Avertir
                                            </button>
                                            <button onClick={() => onToggleStoreStatus(store.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                                                Suspendre
                                            </button>
                                        </>
                                        )}
                                        {store.status === 'suspended' && (
                                            <button onClick={() => onToggleStoreStatus(store.id)} className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                                                Réactiver
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
          </>
        ) : <p className="text-sm text-gray-500 dark:text-gray-400">Aucune boutique dans cette catégorie.</p>}
    </div>
  );

  return (
    <>
      {managingDocsForStore && <ManageDocumentsModal store={managingDocsForStore} onClose={() => setManagingDocsForStore(null)} onRequestDocument={onRequestDocument} onVerifyDocumentStatus={onVerifyDocumentStatus} />}
      {warningStore && <WarningModal store={warningStore} onClose={() => setWarningStore(null)} onConfirm={handleConfirmWarning} />}
      <div className="p-4 sm:p-6">
          <StoreListSection title="Boutiques en attente de validation" stores={stores.filter(s => s.status === 'pending')} />
          <StoreListSection title="Boutiques actives" stores={stores.filter(s => s.status === 'active')} />
          <StoreListSection title="Boutiques suspendues" stores={stores.filter(s => s.status === 'suspended')} />
      </div>
    </>
  );
};


const OrderManagementPanel: React.FC<{orders: Order[], users: User[], onUpdateOrderStatus: (id: string, status: OrderStatus) => void, onAssignAgent: (orderId: string, agentId: string) => void}> = ({ orders, users, onUpdateOrderStatus, onAssignAgent }) => {
    const statusOptions: OrderStatus[] = ['confirmed', 'ready-for-pickup', 'picked-up', 'at-depot', 'out-for-delivery', 'delivered', 'cancelled', 'refund-requested', 'refunded'];
    const deliveryAgents = users.filter(u => u.role === 'delivery_agent');

    const handleAssign = (orderId: string, e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const agentId = formData.get(`agent-${orderId}`) as string;
        if (agentId) {
            onAssignAgent(orderId, agentId);
        }
    }

    return (
      <>
        <div className="md:hidden space-y-3 p-4">
          {orders.map(order => (
            <div key={order.id} className="bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm text-gray-600 dark:text-gray-400">{order.id}</div>
                  <div className="font-semibold dark:text-white">{order.shippingAddress.fullName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.orderDate).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="font-bold dark:text-white">{order.total.toLocaleString('fr-CM')} FCFA</div>
              </div>
               {order.status === 'refund-requested' && (
                <div className="text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 p-2 rounded-md">
                    <p className="font-bold">Demande de remboursement:</p>
                    <p>{order.refundReason}</p>
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => onUpdateOrderStatus(order.id, 'refunded')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Approuver</button>
                        <button onClick={() => onUpdateOrderStatus(order.id, 'delivered')} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Rejeter</button>
                    </div>
                </div>
                )}
                {order.status === 'cancelled' && order.cancellationFee && (
                    <div className="text-xs text-red-700 dark:text-red-300 p-2">
                        Frais d'annulation: {order.cancellationFee.toLocaleString('fr-CM')} FCFA
                    </div>
                )}
              <div className="border-t dark:border-gray-600 pt-3">
                 {order.status === 'ready-for-pickup' && !order.agentId && (
                     <form onSubmit={(e) => handleAssign(order.id, e)} className="flex gap-2">
                        <select name={`agent-${order.id}`} className="w-full text-sm border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-500 dark:text-white focus:ring-kmer-green">
                          <option value="">Choisir un agent</option>
                          {deliveryAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                        </select>
                        <button type="submit" className="bg-kmer-green text-white px-3 text-sm rounded-md">Assigner</button>
                    </form>
                 )}
                 {order.agentId && <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Agent: {users.find(u => u.id === order.agentId)?.name || 'Inconnu'}</div>}
                 {order.status !== 'refund-requested' && (
                    <select
                        value={order.status}
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="w-full text-sm border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-500 dark:text-white focus:ring-kmer-green mt-2"
                    >
                        {statusOptions.map(opt => <option key={opt} value={opt}>{statusTranslations[opt]}</option>)}
                    </select>
                 )}
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="p-4 text-center text-gray-500">Aucune commande trouvée.</p>}
        </div>

        <div className="hidden md:block overflow-x-auto max-h-[calc(100vh-350px)]">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                        <th className="px-6 py-3">ID Commande</th>
                        <th className="px-6 py-3">Client & Détails</th>
                        <th className="px-6 py-3">Agent</th>
                        <th className="px-6 py-3">Total</th>
                        <th className="px-6 py-3">Statut</th>
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                    {orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{order.id}<p className="text-xs font-normal text-gray-500">{new Date(order.orderDate).toLocaleDateString('fr-FR')}</p></td>
                            <td className="px-6 py-4 dark:text-gray-200">
                                <div>{order.shippingAddress.fullName}</div>
                                {order.status === 'refund-requested' && (
                                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 max-w-xs">
                                        <strong>Remboursement:</strong> {order.refundReason}
                                    </div>
                                )}
                                {order.status === 'cancelled' && order.cancellationFee && (
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                        <strong>Frais:</strong> {order.cancellationFee.toLocaleString('fr-CM')} FCFA
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 dark:text-gray-300">
                              {order.agentId ? (
                                  <div className="font-semibold text-xs">{users.find(u => u.id === order.agentId)?.name || 'Inconnu'}</div>
                              ) : order.status === 'ready-for-pickup' ? (
                                  <form onSubmit={(e) => handleAssign(order.id, e)} className="flex gap-2">
                                      <select name={`agent-${order.id}`} className="text-xs w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-600 dark:border-gray-500 focus:ring-kmer-green">
                                        <option value="">Choisir...</option>
                                        {deliveryAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                                      </select>
                                      <button type="submit" className="bg-kmer-green text-white px-2 text-xs rounded-md">OK</button>
                                  </form>
                              ) : ('-')}
                            </td>
                            <td className="px-6 py-4 dark:text-gray-200">{order.total.toLocaleString('fr-CM')} FCFA</td>
                            <td className="px-6 py-4">
                                {order.status === 'refund-requested' ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => onUpdateOrderStatus(order.id, 'refunded')} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Approuver</button>
                                        <button onClick={() => onUpdateOrderStatus(order.id, 'delivered')} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Rejeter</button>
                                    </div>
                                ) : (
                                    <select
                                        value={order.status}
                                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                        className="text-xs border-gray-300 rounded-md shadow-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-kmer-green"
                                    >
                                        {statusOptions.map(opt => <option key={opt} value={opt}>{statusTranslations[opt]}</option>)}
                                    </select>
                                )}
                            </td>
                        </tr>
                    ))}
                     {orders.length === 0 && <tr><td colSpan={5}><p className="p-4 text-center text-gray-500">Aucune commande trouvée.</p></td></tr>}
                </tbody>
            </table>
        </div>
      </>
)};

const CategoryManagementPanel: React.FC<{categories: Category[], onUpdateCategoryImage: (id: string, url: string) => void}> = ({ categories, onUpdateCategoryImage }) => {
    const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null);
    const [newImageUrl, setNewImageUrl] = useState('');

    const handleStartEdit = (category: Category) => {
        setEditingCategory({id: category.id, name: category.name});
        setNewImageUrl(category.imageUrl);
    };

    const handleSaveImage = () => {
        if (editingCategory && newImageUrl) {
            onUpdateCategoryImage(editingCategory.id, newImageUrl);
            setEditingCategory(null);
            setNewImageUrl('');
        }
    };

    return (
        <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {categories.map(cat => (
                    <div key={cat.id} className="relative group">
                        <img src={cat.imageUrl} alt={cat.name} className="h-32 w-full object-cover rounded-md"/>
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-md p-2">
                            <p className="text-white font-bold text-center">{cat.name}</p>
                            <button onClick={() => handleStartEdit(cat)} className="text-xs mt-1 bg-white/80 text-black px-2 py-0.5 rounded-full hover:bg-white">Modifier</button>
                        </div>
                    </div>
                ))}
            </div>
            {editingCategory && (
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <h3 className="font-semibold dark:text-white">Modifier l'image pour "{editingCategory.name}"</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <input 
                            type="text" 
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Nouvelle URL de l'image"
                        />
                        <button onClick={handleSaveImage} className="bg-kmer-green text-white px-4 py-2 rounded-md">Sauver</button>
                        <button onClick={() => setEditingCategory(null)} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-md">Annuler</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const LogsPanel: React.FC<{ siteActivityLogs: SiteActivityLog[] }> = ({ siteActivityLogs }) => {
    const getRoleClass = (role: UserRole) => ({
        customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        seller: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        superadmin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        delivery_agent: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    }[role]);

    return (
        <div>
            <div className="overflow-x-auto max-h-[calc(100vh-350px)]">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Utilisateur</th>
                            <th className="px-4 py-3">Action</th>
                            <th className="px-4 py-3">Détails</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {siteActivityLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                                <td className="px-4 py-3 font-medium dark:text-white whitespace-nowrap">{log.user.name} <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${getRoleClass(log.user.role)}`}>{log.user.role}</span></td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.action}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.details}</td>
                            </tr>
                        ))}
                        {siteActivityLogs.length === 0 && <tr><td colSpan={4}><p className="p-4 text-center text-gray-500">Aucune activité enregistrée.</p></td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const ManageFlashSaleModal: React.FC<{
  flashSale: FlashSale;
  allProducts: Product[];
  onClose: () => void;
  onUpdateStatus: (productId: string, status: 'approved' | 'rejected') => void;
  onBatchUpdateStatus: (productIds: string[], status: 'approved' | 'rejected') => void;
}> = ({ flashSale, allProducts, onClose, onUpdateStatus, onBatchUpdateStatus }) => {
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

    const pendingSubmissions = flashSale.products.filter(p => p.status === 'pending');
    const pendingSubmissionIds = pendingSubmissions.map(p => p.productId);

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const allPendingSelected = pendingSubmissionIds.length > 0 && pendingSubmissionIds.every(id => selectedProductIds.includes(id));
            selectAllCheckboxRef.current.checked = allPendingSelected;
            selectAllCheckboxRef.current.indeterminate = !allPendingSelected && selectedProductIds.some(id => pendingSubmissionIds.includes(id));
        }
    }, [selectedProductIds, pendingSubmissionIds]);
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProductIds(prev => [...new Set([...prev, ...pendingSubmissionIds])]);
        } else {
            setSelectedProductIds(prev => prev.filter(id => !pendingSubmissionIds.includes(id)));
        }
    };

    const handleSelectOne = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };
    
    const handleBatchAction = (status: 'approved' | 'rejected') => {
        if (selectedProductIds.length === 0) return;
        const idsToUpdate = selectedProductIds.filter(id => pendingSubmissionIds.includes(id));
        if (idsToUpdate.length > 0) {
            onBatchUpdateStatus(idsToUpdate, status);
        }
        setSelectedProductIds([]);
    };

    const getStatusClass = (status: FlashSaleProduct['status']) => {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-300';
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-300';
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-4xl w-full relative h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-bold dark:text-white">Gérer les propositions pour : "{flashSale.name}"</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                {selectedProductIds.length > 0 && (
                  <div className="mb-4 flex items-center gap-4 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md flex-shrink-0">
                    <span className="font-semibold text-sm dark:text-gray-200">{selectedProductIds.length} sélectionné(s)</span>
                    <button onClick={() => handleBatchAction('approved')} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 font-bold">Approuver la sélection</button>
                    <button onClick={() => handleBatchAction('rejected')} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 font-bold">Rejeter la sélection</button>
                  </div>
                )}
                
                <div className="overflow-y-auto flex-grow">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="px-2 py-3">
                                  <input 
                                    type="checkbox"
                                    ref={selectAllCheckboxRef}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 dark:bg-gray-900 dark:border-gray-600 text-kmer-green focus:ring-kmer-green"
                                  />
                                </th>
                                <th className="px-4 py-3">Produit</th>
                                <th className="px-4 py-3">Vendeur</th>
                                <th className="px-4 py-3">Prix Proposé</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-600">
                            {flashSale.products.map(fsp => {
                                const product = allProducts.find(p => p.id === fsp.productId);
                                if (!product) return null;
                                return (
                                    <tr key={fsp.productId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-2 py-3">
                                          {fsp.status === 'pending' && (
                                            <input 
                                              type="checkbox"
                                              checked={selectedProductIds.includes(fsp.productId)}
                                              onChange={() => handleSelectOne(fsp.productId)}
                                              className="rounded border-gray-300 dark:bg-gray-900 dark:border-gray-600 text-kmer-green focus:ring-kmer-green"
                                            />
                                          )}
                                        </td>
                                        <td className="px-4 py-3 font-medium dark:text-white">{product.name}</td>
                                        <td className="px-4 py-3 dark:text-gray-300">{fsp.sellerShopName}</td>
                                        <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">{fsp.flashPrice.toLocaleString('fr-CM')} FCFA</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(fsp.status)}`}>{fsp.status}</span>
                                        </td>
                                        <td className="px-4 py-3 flex gap-2">
                                            {fsp.status === 'pending' && (
                                                <>
                                                    <button onClick={() => onUpdateStatus(fsp.productId, 'approved')} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Approuver</button>
                                                    <button onClick={() => onUpdateStatus(fsp.productId, 'rejected')} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Rejeter</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {flashSale.products.length === 0 && <tr><td colSpan={6} className="text-center p-4 text-gray-500 dark:text-gray-400">Aucune proposition de produit pour cette vente.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}


const FlashSaleManagementPanel: React.FC<{
    flashSales: FlashSale[], 
    allProducts: Product[],
    onSave: (flashSale: Omit<FlashSale, 'id' | 'products'>) => void,
    onUpdateFlashSaleSubmissionStatus: (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => void,
    onBatchUpdateFlashSaleStatus: (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => void
}> = ({ flashSales, allProducts, onSave, onUpdateFlashSaleSubmissionStatus, onBatchUpdateFlashSaleStatus }) => {
    const [showForm, setShowForm] = useState(false);
    const [managingSale, setManagingSale] = useState<FlashSale | null>(null);

    useEffect(() => {
        if (managingSale) {
            const updatedSale = flashSales.find(fs => fs.id === managingSale.id);
            if (updatedSale) {
                setManagingSale(updatedSale);
            } else {
                setManagingSale(null); // Sale was deleted, close modal
            }
        }
    }, [flashSales, managingSale]);

    const handleSaveEvent = (data: Omit<FlashSale, 'id' | 'products'>) => {
        onSave(data);
        setShowForm(false);
    }
    
    return (
        <>
            {managingSale && (
                <ManageFlashSaleModal 
                    flashSale={managingSale}
                    allProducts={allProducts}
                    onClose={() => setManagingSale(null)}
                    onUpdateStatus={(productId, status) => onUpdateFlashSaleSubmissionStatus(managingSale.id, productId, status)}
                    onBatchUpdateStatus={(productIds, status) => onBatchUpdateFlashSaleStatus(managingSale.id, productIds, status)}
                />
            )}
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold dark:text-white">Gestion des Ventes Flash</h3>
                    <button onClick={() => setShowForm(!showForm)} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">{showForm ? 'Annuler' : 'Créer un événement'}</button>
                </div>
                {showForm && <FlashSaleForm onSave={handleSaveEvent} onCancel={() => setShowForm(false)} />}
                <div className="mt-4 space-y-2">
                    {flashSales.map(fs => (
                        <div key={fs.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <p className="font-semibold">{fs.name}</p>
                            <p className="text-xs">Du {new Date(fs.startDate).toLocaleDateString()} au {new Date(fs.endDate).toLocaleDateString()}</p>
                            <button onClick={() => setManagingSale(fs)} className="text-sm text-kmer-green font-semibold mt-1">Gérer les propositions ({fs.products.filter(p=>p.status==='pending').length})</button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

const PickupPointPanel: React.FC<{
    pickupPoints: PickupPoint[],
    onAdd: (data: Omit<PickupPoint, 'id'>) => void,
    onUpdate: (data: PickupPoint) => void,
    onDelete: (id: string) => void,
}> = ({ pickupPoints, onAdd, onUpdate, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingPoint, setEditingPoint] = useState<PickupPoint | null>(null);
    
    const PointForm: React.FC<{
        point?: PickupPoint | null,
        onSave: (data: any) => void,
        onCancel: () => void,
    }> = ({ point, onSave, onCancel }) => {
        const [formData, setFormData] = useState({
            name: point?.name || '',
            address: point?.address || '',
            city: point?.city || 'Douala',
            neighborhood: point?.neighborhood || '',
        });

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setFormData({...formData, [e.target.name]: e.target.value });
        }
        
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave(point ? { ...point, ...formData } : formData);
        }

        return (
            <form onSubmit={handleSubmit} className="p-4 my-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Nom du point (ex: Relais Akwa)" className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    <input name="address" value={formData.address} onChange={handleChange} placeholder="Adresse complète" className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} placeholder="Quartier" className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    <select name="city" value={formData.city} onChange={handleChange} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option>Douala</option>
                        <option>Yaoundé</option>
                    </select>
                </div>
                 <div className="flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 font-semibold px-4 py-2 rounded-md">Annuler</button>
                    <button type="submit" className="bg-kmer-green text-white font-semibold px-4 py-2 rounded-md">Enregistrer</button>
                </div>
            </form>
        );
    }
    
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold dark:text-white">Gestion des Points de Dépôt</h3>
                <button onClick={() => { setIsAdding(true); setEditingPoint(null); }} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Ajouter un point
                </button>
            </div>
            {isAdding && <PointForm onSave={(data) => { onAdd(data); setIsAdding(false); }} onCancel={() => setIsAdding(false)}/>}
            
            <div className="space-y-2">
                {pickupPoints.map(point => (
                    editingPoint?.id === point.id ? (
                        <PointForm key={point.id} point={point} onSave={(data) => { onUpdate(data); setEditingPoint(null); }} onCancel={() => setEditingPoint(null)} />
                    ) : (
                        <div key={point.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold dark:text-white">{point.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{point.address}, {point.neighborhood}, {point.city}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingPoint(point)} className="p-2 text-gray-500 hover:text-blue-500"><PencilSquareIcon className="w-5 h-5"/></button>
                                <button onClick={() => onDelete(point.id)} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

const SiteSettingsPanel: React.FC<{
    isChatEnabled: boolean;
    isComparisonEnabled: boolean;
    onToggleChatFeature: () => void;
    onToggleComparisonFeature: () => void;
}> = ({ isChatEnabled, isComparisonEnabled, onToggleChatFeature, onToggleComparisonFeature }) => {
    return (
        <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Paramètres du site</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="font-medium dark:text-gray-200">Activer la messagerie Client-Vendeur</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isChatEnabled} onChange={onToggleChatFeature} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-kmer-green/30 dark:peer-focus:ring-kmer-green/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-kmer-green"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="font-medium dark:text-gray-200">Activer le comparateur de produits</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isComparisonEnabled} onChange={onToggleComparisonFeature} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-kmer-green/30 dark:peer-focus:ring-kmer-green/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-kmer-green"></div>
                    </label>
                </div>
            </div>
        </div>
    );
};

const PremiumProgramPanel: React.FC<{
    siteSettings: SiteSettings;
    onUpdateSiteSettings: (settings: SiteSettings) => void;
    premiumUsers: User[];
}> = ({ siteSettings, onUpdateSiteSettings, premiumUsers }) => {
    const [settings, setSettings] = useState(siteSettings);

    useEffect(() => {
        setSettings(siteSettings);
    }, [siteSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const keys = name.split('.');

        setSettings(prev => {
            const newSettings = JSON.parse(JSON.stringify(prev));
            let current: any = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = type === 'checkbox' ? checked : (value ? Number(value) : 0);
            return newSettings;
        });
    };

    const handleSave = () => {
        onUpdateSiteSettings(settings);
    };

    return (
        <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Programme de fidélité Premium</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Activer le programme Premium</span>
                        <input type="checkbox" name="isPremiumProgramEnabled" checked={settings.isPremiumProgramEnabled} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-kmer-green focus:ring-kmer-green" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Nb commandes pour Premium</label>
                        <input type="number" name="premiumThresholds.orders" value={settings.premiumThresholds.orders} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Montant dépensé pour Premium (FCFA)</label>
                        <input type="number" name="premiumThresholds.spending" value={settings.premiumThresholds.spending} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Montant caution Premium (FCFA)</label>
                        <input type="number" name="premiumCautionAmount" value={settings.premiumCautionAmount} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div className="flex items-center justify-between pt-4 border-t dark:border-gray-600">
                        <span className="font-medium">Activer Premium+</span>
                        <input type="checkbox" name="isPremiumPlusEnabled" checked={settings.isPremiumPlusEnabled} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-kmer-green focus:ring-kmer-green" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Abonnement annuel Premium+ (FCFA)</label>
                        <input type="number" name="premiumPlusAnnualFee" value={settings.premiumPlusAnnualFee} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <button onClick={handleSave} className="w-full bg-kmer-green text-white font-bold py-2 rounded-lg mt-2">Enregistrer les paramètres</button>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-bold mb-2">Membres Premium ({premiumUsers.length})</h4>
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {premiumUsers.map(u => (
                            <li key={u.id} className="text-sm flex justify-between items-center">
                                <span>{u.name}</span>
                                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                                    {u.loyalty.status === 'premium_plus' ? <StarPlatinumIcon className="w-4 h-4"/> : <StarIcon className="w-4 h-4"/>}
                                    {u.loyalty.status === 'premium_plus' ? 'Premium+' : 'Premium'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};


export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = (props) => {
    const { 
        allOrders, allCategories, allStores, allUsers, siteActivityLogs, flashSales, allProducts, allPickupPoints, siteSettings,
        onUpdateOrderStatus, onUpdateCategoryImage, onWarnStore, onToggleStoreStatus, onApproveStore, onRejectStore, 
        onSaveFlashSale, onUpdateFlashSaleSubmissionStatus, onBatchUpdateFlashSaleStatus,
        onRequestDocument, onVerifyDocumentStatus, onAddPickupPoint, onUpdatePickupPoint, onDeletePickupPoint,
        onAssignAgent, isChatEnabled, isComparisonEnabled, onToggleChatFeature, onToggleComparisonFeature, onUpdateSiteSettings
    } = props;
    
    const [activeTab, setActiveTab] = useState('stores');
    const { user, logout } = useAuth();
    
    const premiumUsers = useMemo(() => allUsers.filter(u => u.loyalty.status === 'premium' || u.loyalty.status === 'premium_plus'), [allUsers]);


    const renderContent = () => {
        switch (activeTab) {
            case 'stores': return <StoreManagementPanel stores={allStores} onWarnStore={onWarnStore} onToggleStoreStatus={onToggleStoreStatus} onApproveStore={onApproveStore} onRejectStore={onRejectStore} onRequestDocument={onRequestDocument} onVerifyDocumentStatus={onVerifyDocumentStatus} />;
            case 'orders': return <OrderManagementPanel orders={allOrders} users={allUsers} onUpdateOrderStatus={onUpdateOrderStatus} onAssignAgent={onAssignAgent} />;
            case 'categories': return <CategoryManagementPanel categories={allCategories} onUpdateCategoryImage={onUpdateCategoryImage} />;
            case 'flash-sales': return <FlashSaleManagementPanel flashSales={flashSales} allProducts={allProducts} onSave={onSaveFlashSale} onUpdateFlashSaleSubmissionStatus={onUpdateFlashSaleSubmissionStatus} onBatchUpdateFlashSaleStatus={onBatchUpdateFlashSaleStatus} />;
            case 'pickup-points': return <PickupPointPanel pickupPoints={allPickupPoints} onAdd={onAddPickupPoint} onUpdate={onUpdatePickupPoint} onDelete={onDeletePickupPoint} />;
            case 'settings': return <SiteSettingsPanel isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onToggleChatFeature={onToggleChatFeature} onToggleComparisonFeature={onToggleComparisonFeature} />;
            case 'premium-program': return <PremiumProgramPanel siteSettings={siteSettings} onUpdateSiteSettings={onUpdateSiteSettings} premiumUsers={premiumUsers} />;
            case 'logs': return <LogsPanel siteActivityLogs={siteActivityLogs} />;
            default: return <div>Contenu non défini</div>;
        }
    };
    
    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
             <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <AcademicCapIcon className="w-10 h-10 text-kmer-green"/>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">Tableau de bord Superadmin</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Bienvenue, {user?.name}</p>
                            </div>
                        </div>
                        <button onClick={logout} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">Déconnexion</button>
                    </div>
                     <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-2 -mb-5">
                        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
                           <TabButton icon={<BuildingStorefrontIcon className="w-5 h-5"/>} label="Boutiques" isActive={activeTab === 'stores'} onClick={() => setActiveTab('stores')} />
                           <TabButton icon={<ShoppingBagIcon className="w-5 h-5"/>} label="Commandes" isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                           <TabButton icon={<TagIcon className="w-5 h-5"/>} label="Catégories" isActive={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
                           <TabButton icon={<BoltIcon className="w-5 h-5"/>} label="Ventes Flash" isActive={activeTab === 'flash-sales'} onClick={() => setActiveTab('flash-sales')} />
                           <TabButton icon={<MapPinIcon className="w-5 h-5"/>} label="Points Dépôt" isActive={activeTab === 'pickup-points'} onClick={() => setActiveTab('pickup-points')} />
                           <TabButton icon={<StarIcon className="w-5 h-5"/>} label="Programme Premium" isActive={activeTab === 'premium-program'} onClick={() => setActiveTab('premium-program')} />
                           <TabButton icon={<Cog8ToothIcon className="w-5 h-5"/>} label="Paramètres" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                           <TabButton icon={<ClockIcon className="w-5 h-5"/>} label="Logs" isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                        </div>
                    </div>
                </div>
            </header>
             <main className="container mx-auto px-4 sm:px-6 py-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[calc(100vh-250px)]">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};
