import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Order, Category, OrderStatus, Store, SiteActivityLog, UserRole, FlashSale, Product, FlashSaleProduct, RequestedDocument, PickupPoint, User, Warning, SiteSettings, Payout, Advertisement } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AcademicCapIcon, ClockIcon, BuildingStorefrontIcon, ExclamationTriangleIcon, UsersIcon, ShoppingBagIcon, TagIcon, BoltIcon, CheckCircleIcon, XCircleIcon, XIcon, DocumentTextIcon, MapPinIcon, PencilSquareIcon, TrashIcon, ChartPieIcon, CurrencyDollarIcon, UserGroupIcon, Cog8ToothIcon, ChatBubbleBottomCenterTextIcon, ScaleIcon, StarIcon, StarPlatinumIcon, PlusIcon, SearchIcon, TruckIcon } from './Icons';
import FlashSaleForm from './FlashSaleForm';

declare const L: any;

const PLACEHOLDER_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23E5E7EB'/%3E%3Cpath d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' stroke='%239CA3AF' stroke-width='1.5'/%3E%3C/svg%3E";

interface SuperAdminDashboardProps {
    allUsers: User[];
    allOrders: Order[];
    allCategories: Category[];
    allStores: Store[];
    siteActivityLogs: SiteActivityLog[];
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    onUpdateCategoryImage: (categoryId: string, imageUrl: string) => void;
    onWarnStore: (storeId: string, reason: string) => void;
    onToggleStoreStatus: (storeId: string) => void;
    onToggleStorePremiumStatus: (storeId: string) => void;
    onApproveStore: (storeId: string) => void;
    onRejectStore: (storeId: string) => void;
    onSaveFlashSale: (flashSaleData: Omit<FlashSale, 'id' | 'products'>) => void;
    flashSales: FlashSale[];
    allProducts: Product[];
    onUpdateFlashSaleSubmissionStatus: (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => void;
    onBatchUpdateFlashSaleStatus: (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => void;
    onRequestDocument: (storeId: string, documentName: string) => void;
    onVerifyDocumentStatus: (storeId: string, documentName: string, status: 'verified' | 'rejected', reason?: string) => void;
    allPickupPoints: PickupPoint[];
    onAddPickupPoint: (pointData: Omit<PickupPoint, 'id'>) => void;
    onUpdatePickupPoint: (updatedPoint: PickupPoint) => void;
    onDeletePickupPoint: (pointId: string) => void;
    onAssignAgent: (orderId: string, agentId: string) => void;
    isChatEnabled: boolean;
    isComparisonEnabled: boolean;
    onToggleChatFeature: () => void;
    onToggleComparisonFeature: () => void;
    siteSettings: SiteSettings;
    onUpdateSiteSettings: (newSettings: SiteSettings) => void;
    onAdminAddCategory: (categoryName: string) => void;
    onAdminDeleteCategory: (categoryId: string) => void;
    onUpdateUserRole: (userId: string, newRole: UserRole) => void;
    payouts: Payout[];
    onPayoutSeller: (storeId: string, amount: number) => void;
    onActivateSubscription: (storeId: string) => void;
    advertisements: Advertisement[];
    onAddAdvertisement: (ad: Omit<Advertisement, 'id'>) => void;
    onUpdateAdvertisement: (ad: Advertisement) => void;
    onDeleteAdvertisement: (adId: string) => void;
    onCreateUserByAdmin: (userData: Omit<User, 'id' | 'loyalty'>) => void;
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
    refunded: 'Remboursé',
    returned: 'Retourné',
    'depot-issue': 'Problème au dépôt'
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
        case 'depot-issue': return 'bg-red-200 text-red-900 dark:bg-red-800/50 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
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

const StoreManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allStores' | 'onApproveStore' | 'onRejectStore' | 'onToggleStoreStatus' | 'onToggleStorePremiumStatus' | 'onWarnStore' | 'onRequestDocument' | 'onVerifyDocumentStatus' | 'siteSettings' | 'onActivateSubscription'>> = ({ allStores, onApproveStore, onRejectStore, onToggleStoreStatus, onToggleStorePremiumStatus, onWarnStore, onRequestDocument, onVerifyDocumentStatus, siteSettings, onActivateSubscription }) => {
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
                                <span className="flex items-center gap-2">
                                  {store.name}
                                  {store.premiumStatus === 'premium' && <StarIcon className="w-5 h-5 text-kmer-yellow" title="Boutique Premium" />}
                                </span>
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
                                        {store.status === 'active' && (
                                            <button onClick={() => onToggleStorePremiumStatus(store.id)} className={`text-sm text-white px-3 py-1.5 rounded-md transition-colors ${store.premiumStatus === 'premium' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-kmer-yellow hover:bg-yellow-500'}`}>
                                                {store.premiumStatus === 'premium' ? 'Retirer Premium' : 'Promouvoir en Premium'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {siteSettings.isRentEnabled && (
                                    <div>
                                        <h4 className="font-semibold mb-2 dark:text-white text-sm">Abonnement</h4>
                                        <div className="flex items-center gap-4 p-2 bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700">
                                            <p className="text-sm flex-grow">
                                                Statut : <span className="font-bold">{store.subscriptionStatus || 'inactif'}</span>
                                                {store.subscriptionDueDate && ` (Échéance : ${new Date(store.subscriptionDueDate).toLocaleDateString('fr-FR')})`}
                                            </p>
                                            {store.status === 'active' && store.subscriptionStatus !== 'active' && (
                                                <button
                                                    onClick={() => onActivateSubscription(store.id)}
                                                    className="text-sm bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600"
                                                >
                                                    Activer l'abonnement
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
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

const UserManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allUsers' | 'onUpdateUserRole' | 'onCreateUserByAdmin'>> = ({ allUsers, onUpdateUserRole, onCreateUserByAdmin }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUserData, setNewUserData] = useState({ name: '', email: '', role: 'customer' as UserRole });

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUserData.name && newUserData.email) {
            onCreateUserByAdmin(newUserData);
            setIsCreatingUser(false);
            setNewUserData({ name: '', email: '', role: 'customer' as UserRole });
        }
    };

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
        depot_agent: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold dark:text-white">Gestion des Utilisateurs</h2>
                <div className="flex items-center gap-2">
                     <button onClick={() => setIsCreatingUser(true)} className="bg-kmer-green text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 text-sm"><PlusIcon className="w-4 h-4"/> Créer</button>
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
            </div>
             {isCreatingUser && (
                <form onSubmit={handleCreateUser} className="p-4 my-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 space-y-4">
                    <h3 className="font-semibold text-lg dark:text-white">Créer un nouvel utilisateur</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input type="text" placeholder="Nom complet" value={newUserData.name} onChange={e => setNewUserData(d => ({ ...d, name: e.target.value }))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                        <input type="email" placeholder="Email" value={newUserData.email} onChange={e => setNewUserData(d => ({ ...d, email: e.target.value }))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                        <select value={newUserData.role} onChange={e => setNewUserData(d => ({ ...d, role: e.target.value as UserRole }))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option value="customer">Client</option>
                            <option value="seller">Vendeur</option>
                            <option value="delivery_agent">Livreur</option>
                            <option value="depot_agent">Agent Dépôt</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsCreatingUser(false)} className="bg-gray-200 dark:bg-gray-600 font-semibold px-4 py-2 rounded-md">Annuler</button>
                        <button type="submit" className="bg-kmer-green text-white font-semibold px-4 py-2 rounded-md">Créer l'utilisateur</button>
                    </div>
                </form>
            )}
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
    
    useEffect(() => {
        setSettings(props.siteSettings);
    }, [props.siteSettings]);

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
                <h3 className="text-lg font-bold mb-4 border-b pb-2 dark:border-gray-700 dark:text-white">Gestion des Loyers de Boutique</h3>
                <div className="space-y-4">
                    <ToggleSwitch
                        label="Activer le système de loyer"
                        description="Les vendeurs devront payer un loyer mensuel."
                        enabled={settings.isRentEnabled}
                        onChange={() => handleSettingsChange('isRentEnabled', !settings.isRentEnabled)}
                    />
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Montant du loyer mensuel (FCFA)</label>
                        <input
                            type="number"
                            value={settings.rentAmount}
                            onChange={e => handleSettingsChange('rentAmount', Number(e.target.value))}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            disabled={!settings.isRentEnabled}
                        />
                    </div>
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
                            <label className="block text-sm font-medium dark:text-gray-300">Nb de commandes pour Premium</label>
                            <input type="number" value={settings.premiumThresholds.orders} onChange={e => handleThresholdChange('orders', e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" disabled={!settings.isPremiumProgramEnabled} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Montant dépensé pour Premium (FCFA)</label>
                            <input type="number" value={settings.premiumThresholds.spending} onChange={e => handleThresholdChange('spending', e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" disabled={!settings.isPremiumProgramEnabled} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Montant caution Premium (FCFA)</label>
                            <input type="number" value={settings.premiumCautionAmount} onChange={e => handleSettingsChange('premiumCautionAmount', Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" disabled={!settings.isPremiumProgramEnabled} />
                         </div>
                    </div>
                    <ToggleSwitch label="Activer Premium+" description="Permet aux clients de souscrire à l'abonnement Premium+." enabled={settings.isPremiumPlusEnabled} onChange={() => handleSettingsChange('isPremiumPlusEnabled', !settings.isPremiumPlusEnabled)} />
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Frais annuels Premium+ (FCFA)</label>
                        <input type="number" value={settings.premiumPlusAnnualFee} onChange={e => handleSettingsChange('premiumPlusAnnualFee', Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" disabled={!settings.isPremiumPlusEnabled} />
                    </div>
                </div>
            </div>
             <button onClick={() => props.onUpdateSiteSettings(settings)} className="w-full bg-kmer-green text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors">Enregistrer les paramètres</button>
        </div>
    );
};

const CategoryManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allCategories' | 'onUpdateCategoryImage' | 'onAdminAddCategory' | 'onAdminDeleteCategory'>> = ({ allCategories, onUpdateCategoryImage, onAdminAddCategory, onAdminDeleteCategory }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingState, setEditingState] = useState<{ id: string | null; url: string }>({ id: null, url: '' });

    const handleAdd = () => {
        if (newCategoryName.trim()) {
            onAdminAddCategory(newCategoryName.trim());
            setNewCategoryName('');
        }
    };
    
    const handleEditClick = (cat: Category) => {
        setEditingState({ id: cat.id, url: cat.imageUrl });
    };

    const handleSaveImage = () => {
        if (editingState.id && editingState.url.trim()) {
            onUpdateCategoryImage(editingState.id, editingState.url);
        }
        setEditingState({ id: null, url: '' });
    };
    
    const handleCancelEdit = () => {
        setEditingState({ id: null, url: '' });
    };

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Gestion des Catégories</h2>
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nom de la nouvelle catégorie"
                        className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button onClick={handleAdd} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Ajouter</button>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allCategories.map(cat => (
                    <div key={cat.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-sm overflow-hidden group">
                        <img src={editingState.id === cat.id ? editingState.url : cat.imageUrl} alt={cat.name} className="h-32 w-full object-cover bg-gray-200" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL }}/>
                        <div className="p-3">
                            <p className="font-semibold dark:text-white truncate">{cat.name}</p>
                             {editingState.id === cat.id ? (
                                <div className="mt-2 space-y-2">
                                    <input
                                        type="text"
                                        value={editingState.url}
                                        onChange={(e) => setEditingState(s => ({ ...s, url: e.target.value }))}
                                        placeholder="Nouvelle URL de l'image"
                                        className="w-full p-1 text-xs border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveImage} className="text-xs bg-green-500 text-white px-2 py-1 rounded-md">OK</button>
                                        <button onClick={handleCancelEdit} className="text-xs bg-gray-300 text-gray-800 px-2 py-1 rounded-md">X</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => handleEditClick(cat)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><PencilSquareIcon className="w-3 h-3"/>Changer</button>
                                    <button onClick={() => onAdminDeleteCategory(cat.id)} className="text-xs text-red-600 hover:underline flex items-center gap-1"><TrashIcon className="w-3 h-3"/>Supprimer</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FlashSaleManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'flashSales' | 'allProducts' | 'onSaveFlashSale' | 'onUpdateFlashSaleSubmissionStatus' | 'onBatchUpdateFlashSaleStatus'>> = ({ flashSales, allProducts, onSaveFlashSale, onUpdateFlashSaleSubmissionStatus, onBatchUpdateFlashSaleStatus }) => {
    const [showForm, setShowForm] = useState(false);
    
    return (
        <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">Gestion des Ventes Flash</h2>
              <button onClick={() => setShowForm(!showForm)} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <PlusIcon className="w-5 h-5"/> {showForm ? 'Annuler' : 'Créer un événement'}
              </button>
            </div>
            {showForm && <FlashSaleForm onSave={(data) => { onSaveFlashSale(data); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
        </div>
    );
};

const PickupPointManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allPickupPoints' | 'onAddPickupPoint' | 'onUpdatePickupPoint' | 'onDeletePickupPoint'>> = ({ allPickupPoints, onAddPickupPoint, onUpdatePickupPoint, onDeletePickupPoint }) => {
    const [editingPoint, setEditingPoint] = useState<Partial<PickupPoint> | null>(null);

    const handleSave = () => {
        if (!editingPoint || !editingPoint.name || !editingPoint.street || !editingPoint.city || !editingPoint.neighborhood) {
            alert("Veuillez remplir tous les champs obligatoires.");
            return;
        }
        if (editingPoint.id) {
            onUpdatePickupPoint(editingPoint as PickupPoint);
        } else {
            onAddPickupPoint(editingPoint as Omit<PickupPoint, 'id'>);
        }
        setEditingPoint(null);
    };

    const form = (
        <div className="p-4 my-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 space-y-4">
            <h3 className="font-semibold text-lg">{editingPoint?.id ? 'Modifier' : 'Ajouter'} un point de dépôt</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Nom du point" value={editingPoint?.name || ''} onChange={e => setEditingPoint(p => ({...p, name: e.target.value}))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Ville" value={editingPoint?.city || ''} onChange={e => setEditingPoint(p => ({...p, city: e.target.value}))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Quartier" value={editingPoint?.neighborhood || ''} onChange={e => setEditingPoint(p => ({...p, neighborhood: e.target.value}))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Rue" value={editingPoint?.street || ''} onChange={e => setEditingPoint(p => ({...p, street: e.target.value}))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={() => setEditingPoint(null)} className="bg-gray-200 dark:bg-gray-600 font-semibold px-4 py-2 rounded-md">Annuler</button>
                <button onClick={handleSave} className="bg-kmer-green text-white font-semibold px-4 py-2 rounded-md">Enregistrer</button>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">Gestion des Points de Dépôt</h2>
                <button onClick={() => setEditingPoint({})} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><PlusIcon className="w-5 h-5"/> Ajouter</button>
            </div>
            {editingPoint && form}
            <div className="space-y-2">
                {allPickupPoints.map(point => (
                    <div key={point.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{point.name}</p>
                            <p className="text-sm text-gray-500">{point.street}, {point.neighborhood}, {point.city}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingPoint(point)} className="p-2 text-gray-500 hover:text-blue-500"><PencilSquareIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDeletePickupPoint(point.id)} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PayoutManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allStores' | 'allOrders' | 'payouts' | 'onPayoutSeller'>> = ({ allStores, allOrders, payouts, onPayoutSeller }) => {
    const [payoutAmount, setPayoutAmount] = useState<Record<string, number | undefined>>({});
    
    const storeBalances = useMemo(() => {
        const balances: Record<string, { revenue: number, paid: number, balance: number }> = {};
        
        allStores.forEach(store => {
            const revenue = allOrders
                .filter(o => o.status === 'delivered' && o.items.some(i => i.vendor === store.name))
                .reduce((total, order) => {
                    const storeItemsTotal = order.items
                        .filter(i => i.vendor === store.name)
                        .reduce((sum, item) => sum + item.price * item.quantity, 0);
                    return total + storeItemsTotal;
                }, 0);

            const paid = payouts
                .filter(p => p.storeId === store.id)
                .reduce((sum, p) => sum + p.amount, 0);
            
            balances[store.id] = { revenue, paid, balance: revenue - paid };
        });
        
        return balances;
    }, [allStores, allOrders, payouts]);
    
    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Paiements aux Vendeurs</h2>
            <div className="space-y-3">
                {allStores.filter(s => s.status === 'active').map(store => (
                    <div key={store.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <p className="font-bold text-lg dark:text-white">{store.name}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 text-sm">
                            <div><span className="font-semibold">Revenu total:</span> {storeBalances[store.id]?.revenue.toLocaleString('fr-CM')} FCFA</div>
                            <div><span className="font-semibold">Total versé:</span> {storeBalances[store.id]?.paid.toLocaleString('fr-CM')} FCFA</div>
                            <div className="font-bold text-kmer-green"><span className="font-semibold text-black dark:text-white">Solde:</span> {storeBalances[store.id]?.balance.toLocaleString('fr-CM')} FCFA</div>
                        </div>
                        <div className="mt-4 pt-3 border-t dark:border-gray-700 flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Montant à verser"
                                value={payoutAmount[store.id] || ''}
                                onChange={e => setPayoutAmount(prev => ({ ...prev, [store.id]: Number(e.target.value) }))}
                                className="w-48 p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                            />
                            <button
                                onClick={() => onPayoutSeller(store.id, payoutAmount[store.id] || 0)}
                                disabled={!payoutAmount[store.id] || payoutAmount[store.id]! <= 0 || payoutAmount[store.id]! > storeBalances[store.id]?.balance}
                                className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                            >
                                Verser
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MapPanel: React.FC<Pick<SuperAdminDashboardProps, 'allStores' | 'allPickupPoints'>> = ({ allStores, allPickupPoints }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [selectedCity, setSelectedCity] = useState<'all' | 'Douala' | 'Yaoundé'>('all');

    const cityCoordinates = {
        'Douala': { lat: 4.0511, lng: 9.7679, zoom: 12 },
        'Yaoundé': { lat: 3.8480, lng: 11.5021, zoom: 12 },
        'all': { lat: 3.95, lng: 10.6, zoom: 7 }
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

            const statusColors: Record<Store['status'], string> = {
                active: 'green',
                pending: 'orange',
                suspended: 'red'
            };

            const filteredStores = allStores.filter(store => selectedCity === 'all' || store.location === selectedCity);
            filteredStores.forEach(store => {
                if (store.latitude && store.longitude) {
                    const icon = L.divIcon({
                        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${statusColors[store.status]}" class="w-8 h-8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
                        className: 'map-marker-icon',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32]
                    });
                    L.marker([store.latitude, store.longitude], { icon }).addTo(mapRef.current)
                        .bindPopup(`<b>${store.name}</b><br>Statut: ${store.status}`);
                }
            });

            const filteredPickupPoints = allPickupPoints.filter(pp => selectedCity === 'all' || pp.city === selectedCity);
            filteredPickupPoints.forEach(pp => {
                if (pp.latitude && pp.longitude) {
                     const icon = L.divIcon({
                        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="blue" class="w-8 h-8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
                        className: 'map-marker-icon',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32]
                    });
                    L.marker([pp.latitude, pp.longitude], { icon }).addTo(mapRef.current)
                        .bindPopup(`<b>${pp.name}</b><br>Point de dépôt`);
                }
            });
        }
    }, [selectedCity, allStores, allPickupPoints]);

    return (
        <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">Carte des Boutiques et Points de Dépôt</h2>
                <select value={selectedCity} onChange={e => setSelectedCity(e.target.value as any)} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm">
                    <option value="all">Toutes les villes</option>
                    <option value="Douala">Douala</option>
                    <option value="Yaoundé">Yaoundé</option>
                </select>
            </div>
            <div ref={mapContainer} style={{ height: '500px', width: '100%', borderRadius: '8px' }}></div>
        </div>
    );
};

const AdvertisementManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'advertisements' | 'onAddAdvertisement' | 'onUpdateAdvertisement' | 'onDeleteAdvertisement'>> = ({ advertisements, onAddAdvertisement, onUpdateAdvertisement, onDeleteAdvertisement }) => {
    const [editingAd, setEditingAd] = useState<Partial<Advertisement> | null>(null);

    const handleSave = () => {
        if (!editingAd || !editingAd.imageUrl || !editingAd.linkUrl) {
            alert("L'URL de l'image et le lien sont obligatoires.");
            return;
        }
        const adData: Omit<Advertisement, 'id'> = {
            imageUrl: editingAd.imageUrl,
            linkUrl: editingAd.linkUrl,
            location: 'homepage-banner',
            isActive: editingAd.isActive ?? false,
        };

        if ('id' in editingAd && editingAd.id) {
            onUpdateAdvertisement({ ...adData, id: editingAd.id });
        } else {
            onAddAdvertisement(adData);
        }
        setEditingAd(null);
    };

    const adForm = (
        <div className="p-4 my-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 space-y-4">
            <h3 className="font-semibold text-lg">{editingAd?.id ? 'Modifier' : 'Ajouter'} une Publicité</h3>
            <div>
                <label className="text-sm font-medium">URL de l'image</label>
                <input type="text" placeholder="https://..." value={editingAd?.imageUrl || ''} onChange={e => setEditingAd(ad => ({ ...ad, imageUrl: e.target.value }))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label className="text-sm font-medium">Lien de destination</label>
                <input type="text" placeholder="https://..." value={editingAd?.linkUrl || ''} onChange={e => setEditingAd(ad => ({ ...ad, linkUrl: e.target.value }))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <label className="flex items-center gap-2">
                <input type="checkbox" checked={editingAd?.isActive || false} onChange={e => setEditingAd(ad => ({ ...ad, isActive: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-kmer-green" />
                <span>Active</span>
            </label>
            <div className="flex justify-end gap-2">
                <button onClick={() => setEditingAd(null)} className="bg-gray-200 dark:bg-gray-600 font-semibold px-4 py-2 rounded-md">Annuler</button>
                <button onClick={handleSave} className="bg-kmer-green text-white font-semibold px-4 py-2 rounded-md">Enregistrer</button>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">Gestion des Publicités</h2>
                <button onClick={() => setEditingAd({isActive: true})} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><PlusIcon className="w-5 h-5"/> Ajouter</button>
            </div>
            {editingAd && adForm}
            <div className="space-y-2">
                {advertisements.map(ad => (
                    <div key={ad.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <img src={ad.imageUrl} alt="Ad preview" className="w-24 h-12 object-cover rounded-md bg-gray-200"/>
                            <div>
                                <p className="text-sm text-gray-500 truncate max-w-xs">{ad.linkUrl}</p>
                                <span className={`px-2 py-0.5 mt-1 inline-block rounded-full text-xs font-medium ${ad.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{ad.isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingAd(ad)} className="p-2 text-gray-500 hover:text-blue-500"><PencilSquareIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDeleteAdvertisement(ad.id)} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = (props) => {
    const [activeTab, setActiveTab] = useState('overview');
    
    const panelComponents = {
        'overview': <DashboardOverviewPanel {...props} />,
        'orders': <OrderManagementPanel {...props} />,
        'stores': <StoreManagementPanel {...props} />,
        'users': <UserManagementPanel {...props} />,
        'map': <MapPanel {...props} />,
        'categories': <CategoryManagementPanel {...props} />,
        'flash_sales': <FlashSaleManagementPanel {...props} />,
        'pickup_points': <PickupPointManagementPanel {...props} />,
        'payouts': <PayoutManagementPanel {...props} />,
        'advertisements': <AdvertisementManagementPanel {...props} />,
        'logs': <LogsPanel siteActivityLogs={props.siteActivityLogs} />,
        'settings': <SettingsPanel {...props} />,
    };
    
    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-[76px] z-20">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                     <div className="flex items-center gap-4">
                        <AcademicCapIcon className="w-8 h-8 text-kmer-green"/>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tableau de Bord Super Admin</h1>
                     </div>
                     <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-2 -mb-5">
                        <div className="flex space-x-2 overflow-x-auto">
                           {Object.keys(panelComponents).map(key => {
                               const icons: Record<string, React.ReactNode> = {
                                   'overview': <ChartPieIcon className="w-5 h-5"/>,
                                   'orders': <ShoppingBagIcon className="w-5 h-5"/>,
                                   'stores': <BuildingStorefrontIcon className="w-5 h-5"/>,
                                   'users': <UserGroupIcon className="w-5 h-5"/>,
                                   'map': <MapPinIcon className="w-5 h-5"/>,
                                   'categories': <TagIcon className="w-5 h-5"/>,
                                   'flash_sales': <BoltIcon className="w-5 h-5"/>,
                                   'pickup_points': <BuildingStorefrontIcon className="w-5 h-5"/>,
                                   'payouts': <CurrencyDollarIcon className="w-5 h-5"/>,
                                   'advertisements': <ExclamationTriangleIcon className="w-5 h-5"/>,
                                   'logs': <ClockIcon className="w-5 h-5"/>,
                                   'settings': <Cog8ToothIcon className="w-5 h-5"/>
                               };
                               const labels: Record<string, string> = {
                                   'overview': 'Aperçu',
                                   'orders': 'Commandes',
                                   'stores': 'Boutiques',
                                   'users': 'Utilisateurs',
                                   'map': 'Carte',
                                   'categories': 'Catégories',
                                   'flash_sales': 'Ventes Flash',
                                   'pickup_points': 'Points Relais',
                                   'payouts': 'Paiements',
                                   'advertisements': 'Publicités',
                                   'logs': 'Logs',
                                   'settings': 'Paramètres'
                               };
                               return (
                                  <TabButton 
                                    key={key}
                                    icon={icons[key]} 
                                    label={labels[key]} 
                                    isActive={activeTab === key} 
                                    onClick={() => setActiveTab(key)} 
                                  />
                               );
                           })}
                        </div>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 sm:px-6 py-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                   {Object.entries(panelComponents).map(([key, panel]) => (
                        <div key={key} hidden={activeTab !== key}>
                            {panel}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};