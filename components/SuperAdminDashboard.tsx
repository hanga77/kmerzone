import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Order, Category, OrderStatus, Store, SiteActivityLog, UserRole, FlashSale, Product, FlashSaleProduct, RequestedDocument, PickupPoint, User, Warning, SiteSettings, Payout } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AcademicCapIcon, ClockIcon, BuildingStorefrontIcon, ExclamationTriangleIcon, UsersIcon, ShoppingBagIcon, TagIcon, BoltIcon, CheckCircleIcon, XCircleIcon, XIcon, DocumentTextIcon, MapPinIcon, PencilSquareIcon, TrashIcon, ChartPieIcon, CurrencyDollarIcon, UserGroupIcon, Cog8ToothIcon, ChatBubbleBottomCenterTextIcon, ScaleIcon, StarIcon, StarPlatinumIcon, PlusIcon, SearchIcon, TruckIcon } from './Icons';
import FlashSaleForm from './FlashSaleForm';

declare const L: any;

const PLACEHOLDER_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23E5E7EB'/%3E%3Cpath d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' stroke='%239CA3AF' stroke-width='1.5'/%3E%3C/svg%3E";

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

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number, color: string }> = ({ icon, label, value, color }) => (
    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    </div>
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

const getStatusClass = (status: OrderStatus) => {
    switch(status) {
        case 'confirmed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case 'ready-for-pickup': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
        case 'picked-up': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300';
        case 'at-depot': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case 'out-for-delivery': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
        case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        case 'refund-requested': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
        case 'refunded': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

const DashboardOverviewPanel: React.FC<Pick<SuperAdminDashboardProps, 'allOrders' | 'allStores' | 'allUsers' | 'siteActivityLogs'>> = ({ allOrders, allStores, allUsers, siteActivityLogs }) => {
    const stats = useMemo(() => {
        const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
        return {
            totalRevenue,
            totalOrders: allOrders.length,
            pendingStores: allStores.filter(s => s.status === 'pending').length,
            totalUsers: allUsers.length
        };
    }, [allOrders, allStores, allUsers]);

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<CurrencyDollarIcon className="w-7 h-7"/>} label="Revenu Total" value={`${stats.totalRevenue.toLocaleString('fr-CM')} FCFA`} color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300" />
                <StatCard icon={<ShoppingBagIcon className="w-7 h-7"/>} label="Commandes Totales" value={stats.totalOrders} color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" />
                <StatCard icon={<UsersIcon className="w-7 h-7"/>} label="Utilisateurs Totals" value={stats.totalUsers} color="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300" />
                <StatCard icon={<BuildingStorefrontIcon className="w-7 h-7"/>} label="Boutiques en Attente" value={stats.pendingStores} color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
                 <h2 className="text-xl font-bold mb-4 dark:text-white">Activité Récente</h2>
                 <LogsPanel siteActivityLogs={siteActivityLogs.slice(0, 10)} />
            </div>
        </div>
    );
};

const OrderManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allOrders' | 'allUsers' | 'onUpdateOrderStatus' | 'onAssignAgent'>> = ({ allOrders, allUsers, onUpdateOrderStatus, onAssignAgent }) => {
    const deliveryAgents = useMemo(() => allUsers.filter(u => u.role === 'delivery_agent'), [allUsers]);
    
    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Gestion des Commandes</h2>
            <div className="space-y-3">
                {allOrders.map(order => (
                    <div key={order.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <div>
                                <p className="font-bold text-kmer-green">{order.id}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(order.orderDate).toLocaleString('fr-FR')}</p>
                            </div>
                            <div className="mt-2 sm:mt-0 text-left sm:text-right">
                                <p className="font-semibold text-gray-800 dark:text-white">{order.total.toLocaleString('fr-CM')} FCFA</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                                    {statusTranslations[order.status]}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="flex-1">
                                <label className="text-xs font-medium dark:text-gray-300">Changer le statut :</label>
                                <select 
                                    value={order.status}
                                    onChange={e => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                    className="text-xs mt-1 w-full sm:w-auto border-gray-300 rounded-md shadow-sm dark:bg-gray-600 dark:border-gray-500 focus:ring-kmer-green"
                                >
                                    {Object.keys(statusTranslations).map(s => <option key={s} value={s}>{statusTranslations[s as OrderStatus]}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-medium dark:text-gray-300">Assigner un livreur :</label>
                                <select
                                    value={order.agentId || ''}
                                    onChange={e => onAssignAgent(order.id, e.target.value)}
                                    className="text-xs mt-1 w-full sm:w-auto border-gray-300 rounded-md shadow-sm dark:bg-gray-600 dark:border-gray-500 focus:ring-kmer-green"
                                >
                                    <option value="">Non assigné</option>
                                    {deliveryAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StoreManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allStores' | 'onApproveStore' | 'onRejectStore' | 'onToggleStoreStatus' | 'onWarnStore' | 'onRequestDocument' | 'onVerifyDocumentStatus'>> = ({ allStores, onApproveStore, onRejectStore, onToggleStoreStatus, onWarnStore, onRequestDocument, onVerifyDocumentStatus }) => {
    const [warningStore, setWarningStore] = useState<Store | null>(null);
    const [warningReason, setWarningReason] = useState('');

    const handleWarn = () => {
        if (warningStore && warningReason) {
            onWarnStore(warningStore.id, warningReason);
            setWarningStore(null);
            setWarningReason('');
        }
    };
    
    const handleRequestNewDoc = (e: React.FormEvent<HTMLFormElement>, storeId: string) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.elements.namedItem('docName') as HTMLInputElement;
        const docName = input.value.trim();
        if (docName) {
            onRequestDocument(storeId, docName);
            input.value = '';
        }
    };

    const getDocStatusClass = (status: string) => ({
        'requested': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'uploaded': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'verified': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    }[status] || 'bg-gray-100 text-gray-800');


    return (
        <>
            {warningStore && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold dark:text-white">Avertir la boutique: {warningStore.name}</h3>
                        <textarea value={warningReason} onChange={e => setWarningReason(e.target.value)} placeholder="Motif de l'avertissement" className="w-full mt-4 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" rows={3}></textarea>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setWarningStore(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Annuler</button>
                            <button onClick={handleWarn} className="px-4 py-2 bg-yellow-500 text-white rounded-md">Envoyer</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="p-4 sm:p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Gestion des Boutiques</h2>
                <div className="space-y-4">
                    {allStores.map(store => (
                        <details key={store.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-sm group" open={store.status === 'pending'}>
                            <summary className="font-semibold cursor-pointer dark:text-white flex justify-between items-center">
                                <span>{store.name}</span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                                    store.status === 'active' ? 'bg-green-100 text-green-800' :
                                    store.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>{store.status}</span>
                            </summary>
                            <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2 dark:text-white text-sm">Actions Rapides</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {store.status === 'pending' && <>
                                            <button onClick={() => onApproveStore(store.id)} className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors">Approuver</button>
                                            <button onClick={() => onRejectStore(store.id)} className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors">Rejeter</button>
                                        </>}
                                        {store.status === 'active' && <button onClick={() => onToggleStoreStatus(store.id)} className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors">Suspendre</button>}
                                        {store.status === 'suspended' && <button onClick={() => onToggleStoreStatus(store.id)} className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors">Réactiver</button>}
                                        {store.status === 'active' && <button onClick={() => setWarningStore(store)} className="text-sm bg-yellow-500 text-white px-3 py-1.5 rounded-md hover:bg-yellow-600 transition-colors">Avertir</button>}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-semibold mb-2 dark:text-white text-sm">Gestion des Documents</h4>
                                    <div className="space-y-2">
                                        {store.documents.map(doc => (
                                            <div key={doc.name} className="flex flex-col sm:flex-row justify-between sm:items-center p-2 bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700">
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-gray-200">{doc.name}</p>
                                                    <span className={`px-2 py-0.5 mt-1 inline-block rounded-full text-xs font-medium ${getDocStatusClass(doc.status)}`}>{doc.status}</span>
                                                    {doc.status === 'rejected' && doc.rejectionReason && <p className="text-xs text-red-500 mt-1">Motif: {doc.rejectionReason}</p>}
                                                </div>
                                                {doc.status === 'uploaded' && (
                                                    <div className="flex gap-2 mt-2 sm:mt-0">
                                                        <button 
                                                            onClick={() => {
                                                                const reason = window.prompt('Motif du rejet (optionnel) :');
                                                                if (reason !== null) {
                                                                    onVerifyDocumentStatus(store.id, doc.name, 'rejected', reason || 'Non spécifié');
                                                                }
                                                            }} 
                                                            className="text-xs bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600"
                                                        >
                                                            Rejeter
                                                        </button>
                                                        <button 
                                                            onClick={() => onVerifyDocumentStatus(store.id, doc.name, 'verified')} 
                                                            className="text-xs bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600"
                                                        >
                                                            Approuver
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                     <form onSubmit={(e) => handleRequestNewDoc(e, store.id)} className="mt-3">
                                        <div className="flex gap-2">
                                            <input name="docName" type="text" placeholder="Demander un nouveau document (ex: Patente)" className="flex-grow p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"/>
                                            <button type="submit" className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600">Demander</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </>
    );
};

const UserManagementPanel: React.FC<{ allUsers: User[], onUpdateUserRole: (userId: string, newRole: UserRole) => void }> = ({ allUsers, onUpdateUserRole }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        return allUsers.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allUsers, searchTerm]);
    
    const roleColors: Record<UserRole, string> = {
        customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        seller: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        superadmin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        delivery_agent: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold dark:text-white">Gestion des Utilisateurs</h2>
                <div className="relative w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Rechercher un utilisateur..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-full dark:bg-gray-700 dark:border-gray-600"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            </div>
            <div className="overflow-x-auto bg-white dark:bg-gray-800/50 rounded-lg shadow-sm">
                <table className="w-full min-w-[600px] text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Nom</th>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold">Rôle</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                <td className="px-4 py-3 font-medium dark:text-white">{user.name}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${roleColors[user.role]}`}>
                                        {user.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {user.role === 'customer' && (
                                        <button
                                            onClick={() => onUpdateUserRole(user.id, 'delivery_agent')}
                                            className="text-xs font-semibold text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1"
                                        >
                                           <TruckIcon className="w-4 h-4"/> Promouvoir en Livreur
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LogsPanel: React.FC<{ siteActivityLogs: SiteActivityLog[] }> = ({ siteActivityLogs }) => {
    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Logs d'Activité</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {siteActivityLogs.map(log => (
                    <div key={log.id} className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md text-sm">
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</span><br/>
                        <span className="font-semibold dark:text-white">{log.user.name} ({log.user.role})</span> a effectué l'action : <span className="font-bold text-kmer-green">{log.action}</span> - <span className="italic dark:text-gray-300">{log.details}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ToggleSwitch: React.FC<{
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}> = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
    <div>
      <h4 className="font-semibold text-gray-800 dark:text-white">{label}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    <button
      type="button"
      className={`${
        enabled ? 'bg-kmer-green' : 'bg-gray-300 dark:bg-gray-600'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-kmer-green focus:ring-offset-2`}
      onClick={onChange}
    >
      <span
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  </div>
);

const SettingsPanel: React.FC<Pick<SuperAdminDashboardProps, 'siteSettings' | 'onUpdateSiteSettings' | 'isChatEnabled' | 'isComparisonEnabled' | 'onToggleChatFeature' | 'onToggleComparisonFeature'>> = (props) => {
    const [settings, setSettings] = useState(props.siteSettings);
    
    const handleSettingsChange = (field: keyof SiteSettings, value: any) => {
        setSettings(s => ({ ...s, [field]: value }));
    };

    const handleThresholdChange = (field: keyof SiteSettings['premiumThresholds'], value: any) => {
        setSettings(s => ({
            ...s,
            premiumThresholds: { ...s.premiumThresholds, [field]: Number(value) }
        }));
    };
    
    const handleDocumentSettingChange = (docName: string) => {
        setSettings(s => ({
            ...s,
            requiredSellerDocuments: {
                ...s.requiredSellerDocuments,
                [docName]: !s.requiredSellerDocuments[docName],
            }
        }));
    };


    return (
        <div className="p-4 sm:p-6 space-y-8">
            <h2 className="text-xl font-bold dark:text-white">Paramètres du Site</h2>

            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 dark:border-gray-700 dark:text-white">Fonctionnalités Générales</h3>
                <div className="space-y-4">
                    <ToggleSwitch label="Activer le Chat" description="Permet aux clients de discuter avec les vendeurs." enabled={props.isChatEnabled} onChange={props.onToggleChatFeature} />
                    <ToggleSwitch label="Activer la Comparaison" description="Permet aux clients de comparer jusqu'à 4 produits." enabled={props.isComparisonEnabled} onChange={props.onToggleComparisonFeature} />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 dark:border-gray-700 dark:text-white">Documents Vendeurs Requis</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choisissez les documents que les nouveaux vendeurs doivent fournir lors de l'inscription.</p>
                <div className="space-y-4">
                    {Object.keys(settings.requiredSellerDocuments).map((docName) => (
                        <ToggleSwitch
                            key={docName}
                            label={docName}
                            description={`Activer pour demander ce document.`}
                            enabled={settings.requiredSellerDocuments[docName]}
                            onChange={() => handleDocumentSettingChange(docName)}
                        />
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 dark:border-gray-700 dark:text-white">Programme de Fidélité KMER Premium</h3>
                <div className="space-y-4">
                    <ToggleSwitch label="Activer le programme Premium" description="Permet aux clients de devenir membres Premium." enabled={settings.isPremiumProgramEnabled} onChange={() => handleSettingsChange('isPremiumProgramEnabled', !settings.isPremiumProgramEnabled)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Commandes requises (Fidélité)</label>
                            <input type="number" value={settings.premiumThresholds.orders} onChange={e => handleThresholdChange('orders', e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Dépenses requises (Fidélité)</label>
                            <input type="number" value={settings.premiumThresholds.spending} onChange={e => handleThresholdChange('spending', e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Montant de la caution (FCFA)</label>
                            <input type="number" value={settings.premiumCautionAmount} onChange={e => handleSettingsChange('premiumCautionAmount', Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 dark:border-gray-700 dark:text-white">Programme Premium+</h3>
                <div className="space-y-4">
                     <ToggleSwitch label="Activer le programme Premium+" description="Permet aux membres de souscrire à Premium+." enabled={settings.isPremiumPlusEnabled} onChange={() => handleSettingsChange('isPremiumPlusEnabled', !settings.isPremiumPlusEnabled)} />
                     <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Frais annuels (FCFA)</label>
                        <input type="number" value={settings.premiumPlusAnnualFee} onChange={e => handleSettingsChange('premiumPlusAnnualFee', Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={() => props.onUpdateSiteSettings(settings)} className="bg-kmer-green text-white font-bold px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Sauvegarder les modifications
                </button>
            </div>
        </div>
    );
};

const FlashSaleManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'flashSales' | 'allProducts' | 'onSaveFlashSale' | 'onUpdateFlashSaleSubmissionStatus' | 'onBatchUpdateFlashSaleStatus'>> = ({ flashSales, allProducts, onSaveFlashSale, onUpdateFlashSaleSubmissionStatus, onBatchUpdateFlashSaleStatus }) => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    return (
        <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">Gestion des Ventes Flash</h2>
                <button onClick={() => setIsFormVisible(true)} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">Créer un événement</button>
            </div>
            {isFormVisible && <FlashSaleForm onSave={(data) => { onSaveFlashSale(data); setIsFormVisible(false); }} onCancel={() => setIsFormVisible(false)} />}
            <div className="space-y-4 mt-4">
                {flashSales.map(fs => (
                    <details key={fs.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <summary className="font-semibold cursor-pointer dark:text-white">{fs.name}</summary>
                        <div className="mt-2 pt-2 border-t dark:border-gray-700">
                           {fs.products.filter(p=>p.status === 'pending').map(p => {
                                const product = allProducts.find(prod => prod.id === p.productId);
                                return (
                                <div key={p.productId} className="text-sm my-2 flex justify-between items-center dark:text-gray-300">
                                    <span>{product?.name} ({p.sellerShopName}) - {p.flashPrice} FCFA</span>
                                    <div>
                                        <button onClick={() => onUpdateFlashSaleSubmissionStatus(fs.id, p.productId, 'approved')} className="text-green-500">Approuver</button> /
                                        <button onClick={() => onUpdateFlashSaleSubmissionStatus(fs.id, p.productId, 'rejected')} className="text-red-500">Rejeter</button>
                                    </div>
                                </div>
                                )
                           })}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
};

const PickupPointManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allPickupPoints' | 'onAddPickupPoint' | 'onUpdatePickupPoint' | 'onDeletePickupPoint'>> = ({ allPickupPoints, onAddPickupPoint, onUpdatePickupPoint, onDeletePickupPoint }) => {
    const initialFormState = { name: '', street: '', city: 'Douala', neighborhood: '', streetNumber: '', additionalInfo: '' };
    const [formData, setFormData] = useState<Omit<PickupPoint, 'id'>>(initialFormState);
    const [editingId, setEditingId] = useState<string|null>(null);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.name || !formData.street || !formData.neighborhood) {
            alert("Veuillez remplir au moins le nom, la rue et le quartier.");
            return;
        }
        if (editingId) {
            onUpdatePickupPoint({ id: editingId, ...formData });
        } else {
            onAddPickupPoint(formData);
        }
        setFormData(initialFormState);
        setEditingId(null);
    }
    
    return (
        <div className="p-4 sm:p-6 lg:flex lg:gap-8">
            <div className="lg:w-1/3 mb-6 lg:mb-0">
                <h3 className="text-lg font-bold mb-4 dark:text-white">{editingId ? 'Modifier le point de dépôt' : 'Ajouter un point de dépôt'}</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3 sticky top-28">
                    <input name="name" type="text" placeholder="Nom du point (ex: Relais Akwa)" value={formData.name} onChange={handleFormChange} className="p-2 border rounded-md w-full dark:bg-gray-700 dark:border-gray-600"/>
                    <input name="streetNumber" type="text" placeholder="N° de rue (ex: 123B)" value={formData.streetNumber} onChange={handleFormChange} className="p-2 border rounded-md w-full dark:bg-gray-700 dark:border-gray-600"/>
                    <input name="street" type="text" placeholder="Nom de la rue (ex: Rue de la Liberté)" value={formData.street} onChange={handleFormChange} className="p-2 border rounded-md w-full dark:bg-gray-700 dark:border-gray-600"/>
                    <input name="neighborhood" type="text" placeholder="Quartier" value={formData.neighborhood} onChange={handleFormChange} className="p-2 border rounded-md w-full dark:bg-gray-700 dark:border-gray-600"/>
                    <input name="additionalInfo" type="text" placeholder="Info additionnelle (ex: En face de...)" value={formData.additionalInfo} onChange={handleFormChange} className="p-2 border rounded-md w-full dark:bg-gray-700 dark:border-gray-600"/>
                    <select name="city" value={formData.city} onChange={handleFormChange} className="p-2 border rounded-md w-full dark:bg-gray-700 dark:border-gray-600">
                        <option>Douala</option>
                        <option>Yaoundé</option>
                    </select>
                    <div className="flex gap-2">
                        {editingId && <button onClick={() => { setEditingId(null); setFormData(initialFormState); }} className="bg-gray-200 dark:bg-gray-600 w-full px-4 py-2 rounded-md">Annuler</button>}
                        <button onClick={handleSave} className="bg-kmer-green text-white w-full px-4 py-2 rounded-md">{editingId ? 'Mettre à jour' : 'Ajouter'}</button>
                    </div>
                </div>
            </div>
            <div className="lg:w-2/3">
                 <h3 className="text-lg font-bold mb-4 dark:text-white">Points de dépôt existants</h3>
                <div className="space-y-2">
                    {allPickupPoints.map(pp => (
                        <div key={pp.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold dark:text-white">{pp.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{[pp.streetNumber, pp.street, pp.neighborhood, pp.city].filter(Boolean).join(', ')}</p>
                            </div>
                            <div>
                            <button onClick={() => { setEditingId(pp.id); setFormData(pp); }} className="p-2 text-blue-500 hover:text-blue-700"><PencilSquareIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDeletePickupPoint(pp.id)} className="p-2 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface CategoryManagementPanelProps {
    allCategories: Category[];
    onUpdateCategoryImage: (categoryId: string, imageUrl: string) => void;
    onAdminAddCategory: (categoryName: string) => void;
    onAdminDeleteCategory: (categoryId: string) => void;
}

const CategoryManagementPanel: React.FC<CategoryManagementPanelProps> = ({
    allCategories,
    onUpdateCategoryImage,
    onAdminAddCategory,
    onAdminDeleteCategory
}) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleEditClick = (categoryId: string) => {
        setEditingCategoryId(categoryId);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && editingCategoryId) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                onUpdateCategoryImage(editingCategoryId, result);
                setEditingCategoryId(null); 
            };
            reader.readAsDataURL(file);
        }
        if(e.target) e.target.value = '';
    };

    const handleAddNewCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            onAdminAddCategory(newCategoryName.trim());
            setNewCategoryName('');
        }
    };

    return (
        <div className="p-4 sm:p-6">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
            <form onSubmit={handleAddNewCategory} className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                <h3 className="text-lg font-semibold mb-2 dark:text-white">Ajouter une nouvelle catégorie</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nom de la catégorie"
                        className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        required
                    />
                    <button type="submit" className="bg-kmer-green text-white font-semibold px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2">
                        <PlusIcon className="w-5 h-5"/> Ajouter
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allCategories.map(cat => (
                    <div key={cat.id} className="group relative">
                        <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-full h-32 object-cover rounded-lg shadow-sm bg-gray-200 dark:bg-gray-700"
                            onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMAGE_URL)}
                        />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2">
                            <h4 className="text-white font-bold text-center text-sm" style={{ textShadow: '1px 1px 2px black' }}>{cat.name}</h4>
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-2">
                            <div className="flex gap-2">
                                <button onClick={() => handleEditClick(cat.id)} className="bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600" title="Modifier l'image"><PencilSquareIcon className="w-4 h-4" /></button>
                                <button onClick={() => onAdminDeleteCategory(cat.id)} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600" title="Supprimer"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PaymentsManagementPanel: React.FC<{
    allOrders: Order[];
    allStores: Store[];
    payouts: Payout[];
    onPayoutSeller: (storeId: string, amount: number) => void;
}> = ({ allOrders, allStores, payouts, onPayoutSeller }) => {
    const COMMISSION_RATE = 0.10; // 10% commission

    const paymentData = useMemo(() => {
        const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
        
        const totalTransactionVolume = deliveredOrders
            .flatMap(o => o.items)
            .reduce((sum, item) => sum + (item.promotionPrice ?? item.price) * item.quantity, 0);
        
        const totalCommission = totalTransactionVolume * COMMISSION_RATE;
        const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0);
        const totalDueToSellers = totalTransactionVolume - totalCommission;
        
        const sellerPayouts = allStores.map(store => {
            const storeDeliveredItems = deliveredOrders.flatMap(o => o.items.filter(i => i.vendor === store.name));
            const grossRevenue = storeDeliveredItems.reduce((sum, item) => sum + (item.promotionPrice ?? item.price) * item.quantity, 0);
            
            const commission = grossRevenue * COMMISSION_RATE;
            const netDue = grossRevenue - commission;
            
            const paidAmount = payouts
                .filter(p => p.storeId === store.id)
                .reduce((sum, p) => sum + p.amount, 0);
            
            const remainingDue = netDue - paidAmount;

            return {
                storeId: store.id,
                storeName: store.name,
                grossRevenue,
                commission,
                netDue,
                paidAmount,
                remainingDue,
            };
        });

        return {
            totalTransactionVolume,
            totalCommission,
            totalPaidOut,
            totalDueToSellers,
            sellerPayouts,
        };
    }, [allOrders, allStores, payouts, COMMISSION_RATE]);

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <h2 className="text-xl font-bold dark:text-white">Gestion des Paiements</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<CurrencyDollarIcon className="w-7 h-7"/>} label="Volume des Ventes" value={`${paymentData.totalTransactionVolume.toLocaleString('fr-CM')} FCFA`} color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" />
                <StatCard icon={<ChartPieIcon className="w-7 h-7"/>} label="Commission Plateforme" value={`${paymentData.totalCommission.toLocaleString('fr-CM')} FCFA`} color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300" />
                <StatCard icon={<TruckIcon className="w-7 h-7"/>} label="Total Reversé aux Vendeurs" value={`${paymentData.totalPaidOut.toLocaleString('fr-CM')} FCFA`} color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300" />
                <StatCard icon={<ExclamationTriangleIcon className="w-7 h-7"/>} label="Montant Restant à Payer" value={`${(paymentData.totalDueToSellers - paymentData.totalPaidOut).toLocaleString('fr-CM')} FCFA`} color="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300" />
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800/50 rounded-lg shadow-sm">
                 <table className="w-full min-w-[800px] text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Boutique</th>
                            <th className="px-4 py-3 font-semibold text-right">Revenu Brut</th>
                            <th className="px-4 py-3 font-semibold text-right">Commission (10%)</th>
                            <th className="px-4 py-3 font-semibold text-right">Montant Net Dû</th>
                            <th className="px-4 py-3 font-semibold text-right">Déjà Versé</th>
                            <th className="px-4 py-3 font-semibold text-right">Reste à Payer</th>
                            <th className="px-4 py-3 font-semibold text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {paymentData.sellerPayouts.map(seller => (
                            <tr key={seller.storeId} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                <td className="px-4 py-3 font-medium dark:text-white">{seller.storeName}</td>
                                <td className="px-4 py-3 text-right">{seller.grossRevenue.toLocaleString('fr-CM')} FCFA</td>
                                <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">- {seller.commission.toLocaleString('fr-CM')} FCFA</td>
                                <td className="px-4 py-3 text-right font-semibold">{seller.netDue.toLocaleString('fr-CM')} FCFA</td>
                                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{seller.paidAmount.toLocaleString('fr-CM')} FCFA</td>
                                <td className="px-4 py-3 text-right font-bold text-orange-600 dark:text-orange-400">{seller.remainingDue.toLocaleString('fr-CM')} FCFA</td>
                                <td className="px-4 py-3 text-center">
                                    <button 
                                        onClick={() => onPayoutSeller(seller.storeId, seller.remainingDue)}
                                        disabled={seller.remainingDue <= 0}
                                        className="bg-kmer-green text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        Payer le solde
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
        </div>
    );
};

const StoresMapPanel: React.FC<{ allStores: Store[] }> = ({ allStores }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [selectedCity, setSelectedCity] = useState<'all' | 'Douala' | 'Yaoundé'>('all');

    const cityCoordinates = {
        'Douala': { lat: 4.0511, lng: 9.7679, zoom: 12 },
        'Yaoundé': { lat: 3.8480, lng: 11.5021, zoom: 12 },
        'all': { lat: 3.95, lng: 10.6, zoom: 7 }
    };

    const statusColors: Record<Store['status'], string> = {
        active: '#007A5E', // kmer-green
        pending: '#F59E0B', // amber-500
        suspended: '#EF4444' // red-500
    };

    const createIcon = (color: string) => {
        return L.divIcon({
            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" class="w-8 h-8 drop-shadow-lg"><path d="M12 11.5A2.5 2.5 0 019.5 9A2.5 2.5 0 0112 6.5A2.5 2.5 0 0114.5 9A2.5 2.5 0 0112 11.5M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path></svg>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    };

    useEffect(() => {
        if (mapContainer.current && !mapRef.current) {
            mapRef.current = L.map(mapContainer.current).setView([cityCoordinates.all.lat, cityCoordinates.all.lng], cityCoordinates.all.zoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapRef.current);
        }
    }, []);

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.eachLayer((layer: any) => {
                if (layer instanceof L.Marker) {
                    mapRef.current.removeLayer(layer);
                }
            });

            const { lat, lng, zoom } = cityCoordinates[selectedCity];
            mapRef.current.flyTo([lat, lng], zoom);

            const filteredStores = allStores.filter(store =>
                selectedCity === 'all' || store.location === selectedCity
            );
            
            filteredStores.forEach(store => {
                if (store.latitude && store.longitude) {
                    const icon = createIcon(statusColors[store.status]);
                    const marker = L.marker([store.latitude, store.longitude], { icon }).addTo(mapRef.current);
                    const popupContent = `
                        <div class="p-1 font-sans">
                            <b class="text-base" style="color: #007A5E;">${store.name}</b><br>
                            Vendeur: ${store.sellerFirstName} ${store.sellerLastName}<br>
                            Statut: <span style="font-weight: bold; color: ${statusColors[store.status]}; text-transform: capitalize;">${store.status}</span>
                        </div>
                    `;
                    marker.bindPopup(popupContent);
                }
            });
        }
    }, [selectedCity, allStores]);

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                <h2 className="text-xl font-bold dark:text-white">Carte des Boutiques</h2>
                <div className="flex items-center gap-2">
                    <label htmlFor="city-filter-admin" className="text-sm font-medium dark:text-gray-300">Filtrer par ville:</label>
                    <select
                        id="city-filter-admin"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value as any)}
                        className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm font-semibold focus:ring-kmer-green focus:border-kmer-green"
                    >
                        <option value="all">Toutes</option>
                        <option value="Douala">Douala</option>
                        <option value="Yaoundé">Yaoundé</option>
                    </select>
                </div>
            </div>
            <div ref={mapContainer} style={{ height: '600px', width: '100%', borderRadius: '8px', zIndex: 1 }} />
        </div>
    );
};

interface SuperAdminDashboardProps {
    allUsers: User[];
    allOrders: Order[];
    allCategories: Category[];
    allStores: Store[];
    siteActivityLogs: SiteActivityLog[];
    flashSales: FlashSale[];
    allProducts: Product[];
    allPickupPoints: PickupPoint[];
    payouts: Payout[];
    onUpdateOrderStatus: (id: string, status: OrderStatus) => void;
    onUpdateCategoryImage: (id: string, imageUrl: string) => void;
    onWarnStore: (id: string, reason: string) => void;
    onToggleStoreStatus: (id: string) => void;
    onApproveStore: (id: string) => void;
    onRejectStore: (id: string) => void;
    onSaveFlashSale: (flashSale: Omit<FlashSale, 'id' | 'products'>) => void;
    onUpdateFlashSaleSubmissionStatus: (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => void;
    onBatchUpdateFlashSaleStatus: (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => void;
    onRequestDocument: (storeId: string, documentName: string) => void;
    onVerifyDocumentStatus: (storeId: string, documentName: string, status: 'verified' | 'rejected', reason?: string) => void;
    onAddPickupPoint: (pointData: Omit<PickupPoint, 'id'>) => void;
    onUpdatePickupPoint: (point: PickupPoint) => void;
    onDeletePickupPoint: (pointId: string) => void;
    onAssignAgent: (orderId: string, agentId: string) => void;
    isChatEnabled: boolean;
    isComparisonEnabled: boolean;
    onToggleChatFeature: () => void;
    onToggleComparisonFeature: () => void;
    siteSettings: SiteSettings;
    onUpdateSiteSettings: (settings: SiteSettings) => void;
    onAdminAddCategory: (categoryName: string) => void;
    onAdminDeleteCategory: (categoryId: string) => void;
    onUpdateUserRole: (userId: string, newRole: UserRole) => void;
    onPayoutSeller: (storeId: string, amount: number) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = (props) => {
    const [activeTab, setActiveTab] = useState('overview');
    const { user } = useAuth();
    
    if (!user || user.role !== 'superadmin') {
        return <div className="p-8 text-center text-red-500">Accès non autorisé.</div>;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <DashboardOverviewPanel {...props} />;
            case 'orders': return <OrderManagementPanel {...props} />;
            case 'payments': return <PaymentsManagementPanel {...props} />;
            case 'stores': return <StoreManagementPanel {...props} />;
            case 'map': return <StoresMapPanel allStores={props.allStores} />;
            case 'categories': return <CategoryManagementPanel {...props} />;
            case 'flash-sales': return <FlashSaleManagementPanel {...props} />;
            case 'users': return <UserManagementPanel {...props} />;
            case 'pickuppoints': return <PickupPointManagementPanel {...props} />;
            case 'logs': return <LogsPanel {...props} />;
            case 'settings': return <SettingsPanel {...props} />;
            default: return <DashboardOverviewPanel {...props} />;
        }
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <AcademicCapIcon className="h-10 w-10 text-kmer-green"/>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">Tableau de Bord Superadmin</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Connecté en tant que {user.name}</p>
                            </div>
                        </div>
                    </div>
                     <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-2 -mb-5">
                        <div className="flex space-x-2 overflow-x-auto">
                           <TabButton icon={<ChartPieIcon className="w-5 h-5"/>} label="Aperçu" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                           <TabButton icon={<ShoppingBagIcon className="w-5 h-5"/>} label="Commandes" isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                           <TabButton icon={<CurrencyDollarIcon className="w-5 h-5"/>} label="Paiements" isActive={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
                           <TabButton icon={<BuildingStorefrontIcon className="w-5 h-5"/>} label="Boutiques" isActive={activeTab === 'stores'} onClick={() => setActiveTab('stores')} />
                           <TabButton icon={<MapPinIcon className="w-5 h-5"/>} label="Carte des Boutiques" isActive={activeTab === 'map'} onClick={() => setActiveTab('map')} />
                           <TabButton icon={<TagIcon className="w-5 h-5"/>} label="Catégories" isActive={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
                           <TabButton icon={<BoltIcon className="w-5 h-5"/>} label="Ventes Flash" isActive={activeTab === 'flash-sales'} onClick={() => setActiveTab('flash-sales')} />
                           <TabButton icon={<UsersIcon className="w-5 h-5"/>} label="Utilisateurs" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                           <TabButton icon={<MapPinIcon className="w-5 h-5"/>} label="Points Dépôt" isActive={activeTab === 'pickuppoints'} onClick={() => setActiveTab('pickuppoints')} />
                           <TabButton icon={<ClockIcon className="w-5 h-5"/>} label="Logs" isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                           <TabButton icon={<Cog8ToothIcon className="w-5 h-5"/>} label="Paramètres" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                        </div>
                    </div>
                </div>
            </header>
             <main className="container mx-auto px-4 sm:px-6 py-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                   {renderContent()}
                </div>
            </main>
        </div>
    );
};