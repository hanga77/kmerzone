import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Order, Category, OrderStatus, Store, SiteActivityLog, UserRole, FlashSale, Product, FlashSaleProduct, RequestedDocument, PickupPoint, User, Warning, SiteSettings, Payout, Advertisement } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AcademicCapIcon, ClockIcon, BuildingStorefrontIcon, ExclamationTriangleIcon, UsersIcon, ShoppingBagIcon, TagIcon, BoltIcon, CheckCircleIcon, XCircleIcon, XIcon, DocumentTextIcon, MapPinIcon, PencilSquareIcon, TrashIcon, ChartPieIcon, CurrencyDollarIcon, UserGroupIcon, Cog8ToothIcon, ChatBubbleBottomCenterTextIcon, ScaleIcon, StarIcon, StarPlatinumIcon, PlusIcon, SearchIcon, TruckIcon, PrinterIcon } from './Icons';
import FlashSaleForm from './FlashSaleForm';
import QRCode from 'qrcode';

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

const AssignAgentModal: React.FC<{
    orderId: string;
    deliveryAgents: User[];
    onClose: () => void;
    onAssign: (orderId: string, agentId: string) => void;
}> = ({ orderId, deliveryAgents, onClose, onAssign }) => {
    const [selectedAgent, setSelectedAgent] = useState('');
    
    const handleAssign = () => {
        if (selectedAgent) {
            onAssign(orderId, selectedAgent);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold dark:text-white">Assigner un livreur pour la commande {orderId}</h3>
                <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="w-full mt-4 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="">-- Choisir un livreur --</option>
                    {deliveryAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Annuler</button>
                    <button onClick={handleAssign} className="px-4 py-2 bg-blue-500 text-white rounded-md" disabled={!selectedAgent}>Valider l'assignation</button>
                </div>
            </div>
        </div>
    );
};

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

const getLogIconDetails = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('user') || lowerAction.includes('utilisateur')) {
        return { icon: <UserGroupIcon className="w-5 h-5"/>, color: 'text-blue-500' };
    }
    if (lowerAction.includes('store') || lowerAction.includes('boutique')) {
        return { icon: <BuildingStorefrontIcon className="w-5 h-5"/>, color: 'text-purple-500' };
    }
    if (lowerAction.includes('order') || lowerAction.includes('commande')) {
        return { icon: <ShoppingBagIcon className="w-5 h-5"/>, color: 'text-green-500' };
    }
    if (lowerAction.includes('flash sale') || lowerAction.includes('vente flash')) {
        return { icon: <BoltIcon className="w-5 h-5"/>, color: 'text-yellow-500' };
    }
    if (lowerAction.includes('product') || lowerAction.includes('produit') || lowerAction.includes('category') || lowerAction.includes('catégorie')) {
        return { icon: <TagIcon className="w-5 h-5"/>, color: 'text-indigo-500' };
    }
    return { icon: <ClockIcon className="w-5 h-5"/>, color: 'text-gray-500' };
};

const LogsPanel: React.FC<{ siteActivityLogs: SiteActivityLog[] }> = ({ siteActivityLogs }) => {
    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Logs d'Activité</h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {siteActivityLogs.map(log => {
                    const { icon, color } = getLogIconDetails(log.action);
                    return (
                        <div key={log.id} className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md text-sm">
                            <span className={`mt-1 ${color}`}>{icon}</span>
                            <div className="flex-1">
                                <p className="font-semibold dark:text-white">
                                    {log.user.name} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({log.user.role})</span>
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    <span className="font-bold text-kmer-green">{log.action}</span>: {log.details}
                                </p>
                                <p className="font-mono text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    );
                })}
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

const OrderManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allOrders' | 'allUsers' | 'onUpdateOrderStatus' | 'onAssignAgent'> & { onOpenAssignModal: (orderId: string) => void }> = ({ allOrders, allUsers, onUpdateOrderStatus, onAssignAgent, onOpenAssignModal }) => {
    const deliveryAgents = useMemo(() => allUsers.filter(u => u.role === 'delivery_agent'), [allUsers]);
    const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
    const printableRef = useRef<HTMLDivElement>(null);
    const qrCodeRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (printingOrder && qrCodeRef.current && printableRef.current) {
            QRCode.toCanvas(qrCodeRef.current, printingOrder.trackingNumber || '', { width: 80, margin: 1 }, (error) => {
                if (error) console.error(error);
                // Delay print to ensure QR code has rendered
                setTimeout(() => window.print(), 100);
            });
        }
    }, [printingOrder]);
    
    return (
        <div className="p-4 sm:p-6">
             {printingOrder && (
                <div className="printable fixed -left-[9999px] top-0">
                    <div ref={printableRef} className="w-[105mm] h-[148mm] p-2 border-2 border-black flex flex-col justify-between font-sans text-xs">
                        <div>
                            <h3 className="font-bold text-base">KMER ZONE - Commande #{printingOrder.id}</h3>
                            <p><b>Date:</b> {new Date(printingOrder.orderDate).toLocaleDateString()}</p>
                            <p><b>Destinataire:</b> {printingOrder.shippingAddress.fullName}</p>
                            <p>{printingOrder.shippingAddress.address}, {printingOrder.shippingAddress.city}</p>
                            <p><b>Tél:</b> {printingOrder.shippingAddress.phone}</p>
                        </div>
                        <div className="text-[10px] border-t border-gray-400 pt-1 mt-1">
                            <b>Contenu:</b> {printingOrder.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </div>
                        <div className="text-center">
                            <canvas ref={qrCodeRef}></canvas>
                            <p className="font-mono">{printingOrder.trackingNumber}</p>
                        </div>
                    </div>
                </div>
            )}
            <h2 className="text-xl font-bold mb-4 dark:text-white">Gestion des Commandes</h2>
            <div className="space-y-3">
                {allOrders.map(order => {
                    const assignedAgent = deliveryAgents.find(agent => agent.id === order.agentId);
                    return (
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
                                    <label className="text-xs font-medium dark:text-gray-300">Livreur assigné :</label>
                                    <div className="mt-1">
                                        {assignedAgent ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold dark:text-white bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md">{assignedAgent.name}</span>
                                                <button onClick={() => onOpenAssignModal(order.id)} className="text-xs text-blue-500 hover:underline">(Changer)</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => onOpenAssignModal(order.id)} className="text-sm bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-md hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50">
                                                Assigner
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                   <button onClick={() => setPrintingOrder(order)} className="flex items-center gap-2 text-sm bg-gray-200 dark:bg-gray-700 font-semibold px-3 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto justify-center">
                                      <PrinterIcon className="w-4 h-4"/> Imprimer l'étiquette
                                  </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const StoreManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allStores' | 'onApproveStore' | 'onRejectStore' | 'onToggleStoreStatus' | 'onToggleStorePremiumStatus' | 'onWarnStore' | 'onRequestDocument' | 'onVerifyDocumentStatus' | 'siteSettings' | 'onActivateSubscription'>> = ({ allStores, onApproveStore, onRejectStore, onToggleStoreStatus, onToggleStorePremiumStatus, onWarnStore, onRequestDocument, onVerifyDocumentStatus, siteSettings, onActivateSubscription }) => {
    const [warningStore, setWarningStore] = useState<Store | null>(null);
    const [warningReason, setWarningReason] = useState('');
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [cityFilter, setCityFilter] = useState<'all' | 'Douala' | 'Yaoundé'>('all');

     const cityCoordinates = {
        'Douala': { lat: 4.0511, lng: 9.7679, zoom: 12 },
        'Yaoundé': { lat: 3.8480, lng: 11.5021, zoom: 12 },
        'all': { lat: 3.95, lng: 10.6, zoom: 7 }
    };

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([cityCoordinates.all.lat, cityCoordinates.all.lng], cityCoordinates.all.zoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
        }
    }, []);

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.eachLayer((layer: any) => { if (layer instanceof L.Marker) mapRef.current.removeLayer(layer); });
            const { lat, lng, zoom } = cityCoordinates[cityFilter];
            mapRef.current.flyTo([lat, lng], zoom);
            const filteredStores = allStores.filter(s => cityFilter === 'all' || s.location === cityFilter);
            filteredStores.forEach(store => {
                if (store.latitude && store.longitude) {
                    L.marker([store.latitude, store.longitude]).addTo(mapRef.current).bindPopup(`<b>${store.name}</b><br>${store.physicalAddress}`);
                }
            });
        }
    }, [cityFilter, allStores]);

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
                
                <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg dark:text-white">Carte des Boutiques</h3>
                         <select value={cityFilter} onChange={e => setCityFilter(e.target.value as any)} className="p-1 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600">
                            <option value="all">Toutes</option>
                            <option value="Douala">Douala</option>
                            <option value="Yaoundé">Yaoundé</option>
                        </select>
                    </div>
                    <div ref={mapContainerRef} className="h-64 w-full rounded-md bg-gray-200 dark:bg-gray-900/50"></div>
                </div>
                
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
            setNewUserData({ name: '', email: '', role: 'customer' });
        }
    };

    const filteredUsers = useMemo(() => {
        return allUsers.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allUsers, searchTerm]);
    
    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold dark:text-white">Gestion des Utilisateurs</h2>
                <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-kmer-green"
                    />
                    <SearchIcon className="absolute top-1/2 right-3 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            </div>
            
            <button onClick={() => setIsCreatingUser(!isCreatingUser)} className="mb-4 bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2">
                <PlusIcon className="w-5 h-5" /> {isCreatingUser ? 'Annuler' : 'Créer un utilisateur'}
            </button>

            {isCreatingUser && (
                <form onSubmit={handleCreateUser} className="p-4 my-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 space-y-4">
                     <h3 className="font-semibold text-lg dark:text-white">Nouveau Compte Utilisateur</h3>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-300">Nom complet</label>
                      <input type="text" value={newUserData.name} onChange={e => setNewUserData(d => ({ ...d, name: e.target.value }))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                     <div>
                      <label className="text-sm font-medium dark:text-gray-300">Email</label>
                      <input type="email" value={newUserData.email} onChange={e => setNewUserData(d => ({ ...d, email: e.target.value }))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                     <div>
                      <label className="text-sm font-medium dark:text-gray-300">Rôle</label>
                      <select value={newUserData.role} onChange={e => setNewUserData(d => ({ ...d, role: e.target.value as UserRole }))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="customer">Client</option>
                        <option value="seller">Vendeur</option>
                        <option value="delivery_agent">Livreur</option>
                        <option value="depot_agent">Agent de dépôt</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-md">Créer</button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                {filteredUsers.map(user => (
                    <div key={user.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold dark:text-white">{user.name}
                                {user.loyalty.status === 'premium' && <StarIcon filled className="inline-block w-4 h-4 ml-1 text-kmer-yellow" />}
                                {user.loyalty.status === 'premium_plus' && <StarPlatinumIcon className="inline-block w-4 h-4 ml-1" />}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        <div>
                            <select
                                value={user.role}
                                onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserRole)}
                                className="text-sm border-gray-300 rounded-md shadow-sm dark:bg-gray-600 dark:border-gray-500"
                            >
                                <option value="customer">Client</option>
                                <option value="seller">Vendeur</option>
                                <option value="delivery_agent">Livreur</option>
                                <option value="depot_agent">Agent de dépôt</option>
                                <option value="superadmin">Super Admin</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CategoryManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allCategories' | 'onUpdateCategoryImage' | 'onAdminAddCategory' | 'onAdminDeleteCategory'>> = ({ allCategories, onUpdateCategoryImage, onAdminAddCategory, onAdminDeleteCategory }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newCatName, setNewCatName] = useState('');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, catId: string) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateCategoryImage(catId, reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleAddCategory = () => {
        if (newCatName.trim()) {
            onAdminAddCategory(newCatName);
            setNewCatName('');
            setIsAdding(false);
        }
    };

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Gestion des Catégories</h2>
             <div className="mb-4">
                <button onClick={() => setIsAdding(!isAdding)} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2">
                   <PlusIcon className="w-5 h-5"/> {isAdding ? 'Annuler' : 'Ajouter une catégorie'}
                </button>
                {isAdding && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 flex gap-2">
                        <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nom de la nouvelle catégorie" className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        <button onClick={handleAddCategory} className="bg-blue-500 text-white font-semibold px-4 rounded-md">Ajouter</button>
                    </div>
                )}
            </div>
            <div className="space-y-3">
                {allCategories.map(cat => (
                    <div key={cat.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img src={cat.imageUrl || PLACEHOLDER_IMAGE_URL} alt={cat.name} className="w-16 h-16 object-cover rounded-md" />
                            <span className="font-semibold dark:text-white">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-kmer-green cursor-pointer hover:underline">
                                Changer l'image
                                <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, cat.id)} accept="image/*"/>
                            </label>
                            <button onClick={() => onAdminDeleteCategory(cat.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FlashSaleManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'flashSales' | 'onSaveFlashSale' | 'allProducts' | 'onUpdateFlashSaleSubmissionStatus' | 'onBatchUpdateFlashSaleStatus'>> = (props) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const handleSave = (data: Omit<FlashSale, 'id' | 'products'>) => {
    props.onSaveFlashSale(data);
    setIsFormOpen(false);
  };

  const findProduct = (id: string) => props.allProducts.find(p => p.id === id);

  return (
    <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold dark:text-white">Gestion des Ventes Flash</h2>
            <button onClick={() => setIsFormOpen(true)} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Créer un événement</button>
        </div>
        {isFormOpen && <FlashSaleForm onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
        <div className="mt-6 space-y-4">
            {props.flashSales.map(fs => (
                <details key={fs.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg" open>
                    <summary className="font-semibold cursor-pointer dark:text-white">{fs.name} (Fin: {new Date(fs.endDate).toLocaleDateString()})</summary>
                    <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-2">
                         <div className="flex justify-end gap-2 mb-2">
                            <button onClick={() => props.onBatchUpdateFlashSaleStatus(fs.id, fs.products.filter(p => p.status === 'pending').map(p => p.productId), 'approved')} className="text-xs bg-green-500 text-white px-2 py-1 rounded-md">Tout Approuver</button>
                            <button onClick={() => props.onBatchUpdateFlashSaleStatus(fs.id, fs.products.filter(p => p.status === 'pending').map(p => p.productId), 'rejected')} className="text-xs bg-red-500 text-white px-2 py-1 rounded-md">Tout Rejeter</button>
                        </div>
                        {fs.products.map(fsp => {
                            const product = findProduct(fsp.productId);
                            if (!product) return null;
                            return (
                                <div key={fsp.productId} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-md">
                                    <div>
                                        <p className="font-medium dark:text-gray-200">{product.name} <span className="text-xs text-gray-500">({fsp.sellerShopName})</span></p>
                                        <p className="text-sm">
                                            Prix Flash: <span className="font-bold text-kmer-red">{fsp.flashPrice.toLocaleString('fr-CM')} FCFA</span>
                                            <span className="line-through text-gray-500 ml-2">{product.price.toLocaleString('fr-CM')} FCFA</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                            fsp.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            fsp.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>{fsp.status}</span>
                                        {fsp.status === 'pending' && <>
                                            <button onClick={() => props.onUpdateFlashSaleSubmissionStatus(fs.id, fsp.productId, 'approved')} className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600"><CheckCircleIcon className="w-4 h-4"/></button>
                                            <button onClick={() => props.onUpdateFlashSaleSubmissionStatus(fs.id, fsp.productId, 'rejected')} className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"><XCircleIcon className="w-4 h-4"/></button>
                                        </>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </details>
            ))}
        </div>
    </div>
  );
};

const PickupPointManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allPickupPoints' | 'onAddPickupPoint' | 'onUpdatePickupPoint' | 'onDeletePickupPoint'>> = ({ allPickupPoints, onAddPickupPoint, onUpdatePickupPoint, onDeletePickupPoint }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [formData, setFormData] = useState<Omit<PickupPoint, 'id'>>({ name: '', city: 'Douala', neighborhood: '', street: '' });
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([3.95, 10.6], 7);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
            mapRef.current.on('click', (e: any) => {
                setFormData(prev => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
            });
        }
    }, []);

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.eachLayer((layer: any) => { if (layer instanceof L.Marker) mapRef.current.removeLayer(layer); });
            allPickupPoints.forEach(point => {
                if (point.latitude && point.longitude) {
                    L.marker([point.latitude, point.longitude]).addTo(mapRef.current).bindPopup(point.name);
                }
            });
        }
    }, [allPickupPoints]);
    
    useEffect(() => {
        if (mapRef.current && formData.latitude && formData.longitude) {
            if (markerRef.current) {
                markerRef.current.setLatLng([formData.latitude, formData.longitude]);
            } else {
                markerRef.current = L.marker([formData.latitude, formData.longitude], { draggable: true }).addTo(mapRef.current);
                markerRef.current.on('dragend', (e: any) => {
                    const { lat, lng } = e.target.getLatLng();
                    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                });
            }
        }
    }, [formData.latitude, formData.longitude]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            onUpdatePickupPoint({ ...formData, id: editingId });
        } else {
            onAddPickupPoint(formData);
        }
        handleCancel();
    };

    const handleEdit = (point: PickupPoint) => {
        setEditingId(point.id);
        setFormData(point);
    };

    const handleCancel = () => {
        setFormData({ name: '', city: 'Douala', neighborhood: '', street: '' });
        setEditingId(null);
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold mb-4">{editingId ? 'Modifier le Point Relais' : 'Ajouter un Point Relais'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Nom (ex: Relais Akwa)" className="w-full p-2 border rounded" required />
                        <select name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border rounded">
                            <option value="Douala">Douala</option>
                            <option value="Yaoundé">Yaoundé</option>
                        </select>
                        <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} placeholder="Quartier" className="w-full p-2 border rounded" required />
                        <input name="street" value={formData.street} onChange={handleChange} placeholder="Rue / Repère" className="w-full p-2 border rounded" required />
                        <div className="flex gap-2">
                            <input name="latitude" value={formData.latitude || ''} onChange={handleChange} placeholder="Latitude" className="w-full p-2 border rounded" type="number" step="any" />
                            <input name="longitude" value={formData.longitude || ''} onChange={handleChange} placeholder="Longitude" className="w-full p-2 border rounded" type="number" step="any" />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">{editingId ? 'Mettre à jour' : 'Ajouter'}</button>
                            {editingId && <button type="button" onClick={handleCancel} className="bg-gray-200 px-4 py-2 rounded-md">Annuler</button>}
                        </div>
                    </form>
                </div>
                 <div>
                    <h3 className="text-lg font-bold mb-4">Points Relais Existants</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {allPickupPoints.map(point => (
                            <div key={point.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md flex justify-between items-center">
                                <div><p className="font-semibold">{point.name}</p><p className="text-xs">{point.neighborhood}, {point.city}</p></div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(point)} className="text-blue-500"><PencilSquareIcon className="w-5 h-5"/></button>
                                    <button onClick={() => onDeletePickupPoint(point.id)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div>
                <p className="text-sm text-gray-500 mb-2">Cliquez sur la carte pour définir les coordonnées.</p>
                <div ref={mapContainerRef} className="h-96 w-full rounded-lg" />
            </div>
        </div>
    );
};

const PayoutsPanel: React.FC<Pick<SuperAdminDashboardProps, 'payouts' | 'allStores' | 'allOrders' | 'onPayoutSeller'>> = ({ payouts, allStores, allOrders, onPayoutSeller }) => {
    const storeBalances = useMemo(() => {
        return allStores.map(store => {
            const deliveredOrders = allOrders.filter(o => o.status === 'delivered' && o.items.some(i => i.vendor === store.name));
            const totalRevenue = deliveredOrders.reduce((sum, order) => {
                const storeItemsTotal = order.items.filter(i => i.vendor === store.name).reduce((itemSum, item) => itemSum + (item.promotionPrice ?? item.price) * item.quantity, 0);
                return sum + storeItemsTotal;
            }, 0);
            const totalPaidOut = payouts.filter(p => p.storeId === store.id).reduce((sum, p) => sum + p.amount, 0);
            const balance = totalRevenue - totalPaidOut;
            return { store, totalRevenue, totalPaidOut, balance };
        });
    }, [allStores, allOrders, payouts]);

    const handlePayout = (storeId: string, amount: number) => {
        if (amount > 0 && window.confirm(`Confirmez-vous le paiement de ${amount.toLocaleString('fr-CM')} FCFA à cette boutique ?`)) {
            onPayoutSeller(storeId, amount);
        }
    };
    
    return (
        <div className="p-6">
             <h2 className="text-xl font-bold mb-4">Paiements aux Vendeurs</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-2">Boutique</th>
                            <th className="p-2">Revenu Total (Livré)</th>
                            <th className="p-2">Déjà Payé</th>
                            <th className="p-2">Solde Actuel</th>
                            <th className="p-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {storeBalances.map(({ store, balance, totalRevenue, totalPaidOut }) => (
                            <tr key={store.id} className="border-b dark:border-gray-700">
                                <td className="p-2 font-semibold">{store.name}</td>
                                <td className="p-2">{totalRevenue.toLocaleString('fr-CM')} FCFA</td>
                                <td className="p-2">{totalPaidOut.toLocaleString('fr-CM')} FCFA</td>
                                <td className="p-2 font-bold">{balance.toLocaleString('fr-CM')} FCFA</td>
                                <td className="p-2">
                                    {balance > 0 && <button onClick={() => handlePayout(store.id, balance)} className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 disabled:bg-gray-400" disabled={balance <=0}>Payer le solde</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'advertisements' | 'onAddAdvertisement' | 'onUpdateAdvertisement' | 'onDeleteAdvertisement'>> = ({ advertisements, onAddAdvertisement, onUpdateAdvertisement, onDeleteAdvertisement }) => {
    const [formData, setFormData] = useState<Omit<Advertisement, 'id'>>({ imageUrl: '', linkUrl: '#', location: 'homepage-banner', isActive: true });
    const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAd) {
            onUpdateAdvertisement({ ...formData, id: editingAd.id });
        } else {
            onAddAdvertisement(formData);
        }
        handleCancel();
    };

    const handleEdit = (ad: Advertisement) => {
        setEditingAd(ad);
        setFormData(ad);
    };

    const handleCancel = () => {
        setEditingAd(null);
        setFormData({ imageUrl: '', linkUrl: '#', location: 'homepage-banner', isActive: true });
    };
    
    return (
        <div className="p-6 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <h3 className="text-lg font-bold mb-4">{editingAd ? 'Modifier' : 'Ajouter'} une Publicité</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm">Image (URL ou téléverser)</label>
                        <input type="file" onChange={handleImageChange} className="mt-1 w-full text-sm"/>
                        <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="Ou coller une URL" className="mt-1 w-full p-2 border rounded text-sm"/>
                        {formData.imageUrl && <img src={formData.imageUrl} alt="preview" className="mt-2 h-24 w-full object-contain rounded"/>}
                    </div>
                    <input type="text" name="linkUrl" value={formData.linkUrl} onChange={handleChange} placeholder="Lien de redirection" className="w-full p-2 border rounded" required />
                    <select name="location" value={formData.location} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="homepage-banner">Bannière page d'accueil</option>
                    </select>
                    <label className="flex items-center gap-2"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} /> Actif</label>
                    <div className="flex gap-2">
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">{editingAd ? 'Mettre à jour' : 'Ajouter'}</button>
                        {editingAd && <button type="button" onClick={handleCancel} className="bg-gray-200 px-4 py-2 rounded-md">Annuler</button>}
                    </div>
                </form>
            </div>
            <div className="md:col-span-2">
                 <h3 className="text-lg font-bold mb-4">Publicités Actuelles</h3>
                 <div className="space-y-2">
                    {advertisements.map(ad => (
                        <div key={ad.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md flex justify-between items-center">
                            <img src={ad.imageUrl} alt="ad" className="h-12 w-24 object-cover rounded"/>
                            <span className={`text-xs font-bold ${ad.isActive ? 'text-green-500' : 'text-gray-500'}`}>{ad.isActive ? 'Actif' : 'Inactif'}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(ad)} className="text-blue-500"><PencilSquareIcon className="w-5 h-5"/></button>
                                <button onClick={() => onDeleteAdvertisement(ad.id)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

const SiteSettingsPanel: React.FC<Pick<SuperAdminDashboardProps, 'siteSettings' | 'onUpdateSiteSettings' | 'isChatEnabled' | 'isComparisonEnabled' | 'onToggleChatFeature' | 'onToggleComparisonFeature'>> = ({ siteSettings, onUpdateSiteSettings, isChatEnabled, isComparisonEnabled, onToggleChatFeature, onToggleComparisonFeature }) => {
    const [localSettings, setLocalSettings] = useState(siteSettings);
    const [logoPreview, setLogoPreview] = useState(siteSettings.logoUrl);
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setLogoPreview(result);
                setLocalSettings(s => ({...s, logoUrl: result}));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const keys = name.split('.');
        
        setLocalSettings(s => {
            let newSettings = JSON.parse(JSON.stringify(s));
            let currentLevel: any = newSettings;
            for(let i=0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            currentLevel[keys[keys.length - 1]] = type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value);
            return newSettings;
        });
    };

    const handleSave = () => {
        onUpdateSiteSettings(localSettings);
        alert("Paramètres sauvegardés !");
    };

    return (
        <div className="p-4 sm:p-6 space-y-8">
            <h2 className="text-xl font-bold dark:text-white">Paramètres Généraux du Site</h2>
            
            <div className="p-4 border dark:border-gray-700 rounded-lg space-y-4">
                <h3 className="font-semibold dark:text-white">Image de marque & Fonctionnalités</h3>
                 <div>
                    <label className="block text-sm font-medium">Logo de la Plateforme</label>
                    <div className="mt-1 flex items-center gap-4">
                        <img src={logoPreview || PLACEHOLDER_IMAGE_URL} alt="Aperçu" className="h-16 w-16 object-contain rounded-md bg-gray-100 dark:bg-gray-700 p-1"/>
                        <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600">
                            Changer le logo
                            <input id="logo-upload" type="file" className="sr-only" onChange={handleLogoChange} accept="image/*" />
                        </label>
                    </div>
                </div>
                 <div className="space-y-3 pt-4 border-t dark:border-gray-600">
                    <label className="flex items-center gap-3"><input type="checkbox" checked={isChatEnabled} onChange={onToggleChatFeature} className="h-4 w-4 rounded"/><span>Activer le Chat Vendeur-Client</span></label>
                    <label className="flex items-center gap-3"><input type="checkbox" checked={isComparisonEnabled} onChange={onToggleComparisonFeature} className="h-4 w-4 rounded"/><span>Activer la Comparaison de Produits</span></label>
                    <label className="flex items-center gap-3"><input type="checkbox" name="isStoriesEnabled" checked={localSettings.isStoriesEnabled} onChange={handleChange} className="h-4 w-4 rounded"/><span>Activer les Stories des boutiques</span></label>
                 </div>
            </div>

            <div className="p-4 border dark:border-gray-700 rounded-lg space-y-4">
                <h3 className="font-semibold dark:text-white">Programme Premium</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">Configurez les règles du programme de fidélité pour les clients.</p>
                <label className="flex items-center gap-3 pt-2"><input type="checkbox" name="isPremiumProgramEnabled" checked={localSettings.isPremiumProgramEnabled} onChange={handleChange} className="h-4 w-4 rounded"/><span>Activer le Programme Premium</span></label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Nb. de commandes pour devenir Premium</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Le client devient Premium après ce nombre de commandes livrées.</p>
                        <input type="number" name="premiumThresholds.orders" value={localSettings.premiumThresholds.orders} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Montant dépensé pour devenir Premium (FCFA)</label>
                         <p className="text-xs text-gray-500 dark:text-gray-400">Le client devient Premium après avoir dépensé ce montant total.</p>
                        <input type="number" name="premiumThresholds.spending" value={localSettings.premiumThresholds.spending} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Montant de la caution pour accès immédiat (FCFA)</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Permet aux clients de payer pour devenir Premium instantanément.</p>
                        <input type="number" name="premiumCautionAmount" value={localSettings.premiumCautionAmount} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
                    </div>
                </div>
                <div className="pt-4 border-t dark:border-gray-600 space-y-3">
                    <label className="flex items-center gap-3"><input type="checkbox" name="isPremiumPlusEnabled" checked={localSettings.isPremiumPlusEnabled} onChange={handleChange} className="h-4 w-4 rounded"/><span>Activer l'abonnement Premium+</span></label>
                     <div>
                        <label className="block text-sm font-medium">Frais annuels Premium+ (FCFA)</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Le coût de l'abonnement annuel pour le statut Premium+.</p>
                        <input type="number" name="premiumPlusAnnualFee" value={localSettings.premiumPlusAnnualFee} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
                    </div>
                </div>
            </div>

             <div className="p-4 border dark:border-gray-700 rounded-lg space-y-4">
                <h3 className="font-semibold dark:text-white">Gestion des Loyers de Boutique</h3>
                 <label className="flex items-center gap-3"><input type="checkbox" name="isRentEnabled" checked={localSettings.isRentEnabled} onChange={handleChange} className="h-4 w-4 rounded"/><span>Activer le Loyer pour les boutiques</span></label>
                <div>
                    <label className="block text-sm font-medium">Montant du loyer mensuel (FCFA)</label>
                    <input type="number" name="rentAmount" value={localSettings.rentAmount} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <button onClick={handleSave} className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">Sauvegarder les Paramètres</button>
            </div>
        </div>
    );
};

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = (props) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [assignModal, setAssignModal] = useState<{ isOpen: boolean; orderId: string | null }>({ isOpen: false, orderId: null });

    const deliveryAgents = useMemo(() => props.allUsers.filter(u => u.role === 'delivery_agent'), [props.allUsers]);

    const handleOpenAssignModal = (orderId: string) => {
        setAssignModal({ isOpen: true, orderId });
    };

    const handleCloseAssignModal = () => {
        setAssignModal({ isOpen: false, orderId: null });
    };

    const handleAssignAgent = (orderId: string, agentId: string) => {
        props.onAssignAgent(orderId, agentId);
        handleCloseAssignModal();
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <DashboardOverviewPanel {...props} />;
            case 'orders': return <OrderManagementPanel {...props} onOpenAssignModal={handleOpenAssignModal} />;
            case 'stores': return <StoreManagementPanel {...props} />;
            case 'users': return <UserManagementPanel {...props} />;
            case 'categories': return <CategoryManagementPanel {...props} />;
            case 'flash-sales': return <FlashSaleManagementPanel {...props} />;
            case 'pickup-points': return <PickupPointManagementPanel {...props} />;
            case 'payouts': return <PayoutsPanel {...props} />;
            case 'advertisements': return <AdManagementPanel {...props} />;
            case 'settings': return <SiteSettingsPanel {...props} />;
            case 'logs': return <LogsPanel siteActivityLogs={props.siteActivityLogs} />;
            default: return <DashboardOverviewPanel {...props} />;
        }
    };
    
    return (
        <>
        {assignModal.isOpen && assignModal.orderId && (
            <AssignAgentModal
                orderId={assignModal.orderId}
                deliveryAgents={deliveryAgents}
                onClose={handleCloseAssignModal}
                onAssign={handleAssignAgent}
            />
        )}
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <AcademicCapIcon className="w-8 h-8 text-kmer-green"/>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Super Administration</h1>
                        </div>
                    </div>
                     <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-2 -mb-5">
                        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
                            <TabButton icon={<ChartPieIcon className="w-5 h-5"/>} label="Aperçu" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                            <TabButton icon={<ShoppingBagIcon className="w-5 h-5"/>} label="Commandes" isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                            <TabButton icon={<BuildingStorefrontIcon className="w-5 h-5"/>} label="Boutiques" isActive={activeTab === 'stores'} onClick={() => setActiveTab('stores')} />
                            <TabButton icon={<UsersIcon className="w-5 h-5"/>} label="Utilisateurs" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                            <TabButton icon={<TagIcon className="w-5 h-5"/>} label="Catégories" isActive={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
                            <TabButton icon={<BoltIcon className="w-5 h-5"/>} label="Ventes Flash" isActive={activeTab === 'flash-sales'} onClick={() => setActiveTab('flash-sales')} />
                            <TabButton icon={<MapPinIcon className="w-5 h-5"/>} label="Points Relais" isActive={activeTab === 'pickup-points'} onClick={() => setActiveTab('pickup-points')} />
                             <TabButton icon={<CurrencyDollarIcon className="w-5 h-5"/>} label="Paiements" isActive={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')} />
                             <TabButton icon={<UsersIcon className="w-5 h-5"/>} label="Publicités" isActive={activeTab === 'advertisements'} onClick={() => setActiveTab('advertisements')} />
                            <TabButton icon={<Cog8ToothIcon className="w-5 h-5"/>} label="Paramètres" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                            <TabButton icon={<ClockIcon className="w-5 h-5"/>} label="Logs" isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
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
        </>
    );
};