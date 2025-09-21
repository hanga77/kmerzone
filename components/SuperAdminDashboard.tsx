import React, { useState, useMemo, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import type { Order, Category, OrderStatus, Store, SiteActivityLog, UserRole, FlashSale, Product, FlashSaleProduct, RequestedDocument, PickupPoint, User, Warning, SiteSettings, Payout, Advertisement, UserAvailabilityStatus, CartItem, DisputeMessage, SiteContent, Review, Ticket, TicketStatus, TicketPriority, Announcement, PaymentMethod } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AcademicCapIcon, ClockIcon, BuildingStorefrontIcon, ExclamationTriangleIcon, UsersIcon, ShoppingBagIcon, TagIcon, BoltIcon, CheckCircleIcon, XCircleIcon, XIcon, DocumentTextIcon, MapPinIcon, PencilSquareIcon, TrashIcon, ChartPieIcon, CurrencyDollarIcon, UserGroupIcon, Cog8ToothIcon, ChatBubbleLeftRightIcon, ScaleIcon, StarIcon, StarPlatinumIcon, PlusIcon, SearchIcon, TruckIcon, PrinterIcon, ChevronLeftIcon, ChevronRightIcon, PaperAirplaneIcon, ShieldCheckIcon, MegaphoneIcon, BanknotesIcon, BarChartIcon, PaperclipIcon } from './Icons';
import FlashSaleForm from './FlashSaleForm';
import ReviewModerationPanel from './ReviewModerationPanel';

declare const L: any;

const PLACEHOLDER_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23E5E7EB'/%3E%3Cpath d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 017.5 0z' stroke='%239CA3AF' stroke-width='1.5'/%3E%3C/svg%3E";

interface SuperAdminDashboardProps {
    allUsers: User[];
    allOrders: Order[];
    allCategories: Category[];
    allStores: Store[];
    allProducts: Product[];
    siteActivityLogs: SiteActivityLog[];
    onUpdateOrderStatus: (order: Order, status: OrderStatus) => void;
    onUpdateCategoryImage: (categoryId: string, imageUrl: string) => void;
    onWarnStore: (store: Store, reason: string) => void;
    onToggleStoreStatus: (store: Store) => void;
    onToggleStorePremiumStatus: (store: Store) => void;
    onApproveStore: (store: Store) => void;
    onRejectStore: (store: Store) => void;
    onSaveFlashSale: (flashSaleData: Omit<FlashSale, 'id' | 'products'>) => void;
    flashSales: FlashSale[];
    onUpdateFlashSaleSubmissionStatus: (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => void;
    onBatchUpdateFlashSaleStatus: (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => void;
    onRequestDocument: (storeId: string, documentName: string) => void;
    onVerifyDocumentStatus: (store: Store, documentName: string, status: 'verified' | 'rejected', reason?: string) => void;
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
    onAdminAddCategory: (categoryName: string, parentId?: string) => void;
    onAdminDeleteCategory: (categoryId: string) => void;
    onUpdateUser: (userId: string, updates: Partial<User>) => void;
    payouts: Payout[];
    onPayoutSeller: (store: Store, amount: number) => void;
    onActivateSubscription: (store: Store) => void;
    advertisements: Advertisement[];
    onAddAdvertisement: (ad: Omit<Advertisement, 'id'>) => void;
    onUpdateAdvertisement: (ad: Advertisement) => void;
    onDeleteAdvertisement: (adId: string) => void;
    onCreateUserByAdmin: (userData: Omit<User, 'id' | 'loyalty' | 'password'>) => void;
    onSanctionAgent: (agentId: string, reason: string) => void;
    onResolveRefund: (orderId: string, resolution: 'approved' | 'rejected') => void;
    onAdminStoreMessage: (orderId: string, message: string) => void;
    onAdminCustomerMessage: (orderId: string, message: string) => void;
    siteContent: SiteContent[];
    onUpdateSiteContent: (newContent: SiteContent[]) => void;
    allTickets: Ticket[];
    allAnnouncements: Announcement[];
    onAdminReplyToTicket: (ticketId: string, message: string, attachmentUrls?: string[]) => void;
    onAdminUpdateTicketStatus: (ticketId: string, status: TicketStatus, priority: TicketPriority) => void;
    onCreateOrUpdateAnnouncement: (announcement: Omit<Announcement, 'id'> | Announcement) => void;
    onDeleteAnnouncement: (id: string) => void;
    onReviewModeration: (productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected') => void;
    paymentMethods: PaymentMethod[];
    onUpdatePaymentMethods: (newMethods: PaymentMethod[]) => void;
}

// Helper functions (could be moved to a utils file)
const isPromotionActive = (product: Product): boolean => {
  if (!product.promotionPrice || product.promotionPrice >= product.price) { return false; }
  const now = new Date();
  const startDate = product.promotionStartDate ? new Date(product.promotionStartDate + 'T00:00:00') : null;
  const endDate = product.promotionEndDate ? new Date(product.promotionEndDate + 'T23:59:59') : null;
  if (!startDate && !endDate) return false;
  if (startDate && endDate) return now >= startDate && now <= endDate;
  if (startDate) return now >= startDate;
  if (endDate) return now <= endDate;
  return false;
};

const getActiveFlashSalePrice = (productId: string, flashSales: FlashSale[]): number | null => {
    const now = new Date();
    for (const sale of flashSales) {
        if (now >= new Date(sale.startDate) && now <= new Date(sale.endDate)) {
            const productInSale = sale.products.find(p => p.productId === productId && p.status === 'approved');
            if (productInSale) return productInSale.flashPrice;
        }
    }
    return null;
};

const getFinalPriceForPayout = (item: CartItem, flashSales: FlashSale[]): number => {
    if (item.selectedVariant) {
        const variantDetail = item.variantDetails?.find(vd => {
            if (!item.selectedVariant) return false;
            const vdKeys = Object.keys(vd.options);
            const selectedKeys = Object.keys(item.selectedVariant);
            if (vdKeys.length !== selectedKeys.length) return false;
            return vdKeys.every(key => vd.options[key] === item.selectedVariant![key]);
        });
        if (variantDetail?.price) {
            return variantDetail.price;
        }
    }
    const flashPrice = getActiveFlashSalePrice(item.id, flashSales);
    if (flashPrice !== null) return flashPrice;
    
    if (isPromotionActive(item)) return item.promotionPrice!;
    
    return item.price;
};


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
                    <option value="">-- Choisir un livreur disponible --</option>
                    {deliveryAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
                {deliveryAgents.length === 0 && <p className="text-xs text-yellow-600 mt-2">Aucun livreur n'est actuellement disponible.</p>}
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Annuler</button>
                    <button onClick={handleAssign} className="px-4 py-2 bg-blue-500 text-white rounded-md" disabled={!selectedAgent}>Valider l'assignation</button>
                </div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, count?: number }> = ({ icon, label, isActive, onClick, count }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center gap-3 w-full text-left px-3 py-3 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
            isActive
                ? 'bg-kmer-green/10 text-kmer-green'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
        }`}
    >
        {icon}
        <span>{label}</span>
        {count !== undefined && count > 0 && (
            <span className="ml-auto text-xs bg-kmer-red text-white rounded-full px-1.5 py-0.5">{count}</span>
        )}
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
    'depot-issue': 'Problème au dépôt',
    'delivery-failed': 'Échec de livraison'
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
        case 'delivery-failed': return 'bg-red-200 text-red-900 dark:bg-red-800/50 dark:text-red-200 font-bold';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

const getLogIconDetails = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('user') || lowerAction.includes('utilisateur') || lowerAction.includes('role')) {
        return { icon: <UserGroupIcon className="w-5 h-5"/>, color: 'text-blue-500' };
    }
    if (lowerAction.includes('store') || lowerAction.includes('boutique') || lowerAction.includes('seller') || lowerAction.includes('payout')) {
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
            {siteActivityLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>Aucune activité enregistrée pour le moment.</p>
                </div>
            ) : (
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
            )}
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

const OrderManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allOrders' | 'allUsers' | 'onUpdateOrderStatus' | 'onAssignAgent' | 'onResolveRefund' | 'onAdminStoreMessage' | 'onAdminCustomerMessage'> & { onOpenAssignModal: (orderId: string) => void }> = ({ allOrders, allUsers, onUpdateOrderStatus, onAssignAgent, onOpenAssignModal, onResolveRefund, onAdminStoreMessage, onAdminCustomerMessage }) => {
    const deliveryAgents = useMemo(() => allUsers.filter(u => u.role === 'delivery_agent'), [allUsers]);
    const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
    const printableRef = useRef<HTMLDivElement>(null);
    const qrCodeRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (printingOrder && qrCodeRef.current && printableRef.current) {
            QRCode.toCanvas(qrCodeRef.current, printingOrder.trackingNumber || '', { width: 80, margin: 1 }, (error) => {
                if (error) {
                    console.error('QR Code Generation Error:', error);
                    setPrintingOrder(null);
                    return;
                }
                
                const handleAfterPrint = () => {
                    setPrintingOrder(null);
                    window.removeEventListener('afterprint', handleAfterPrint);
                };
                window.addEventListener('afterprint', handleAfterPrint);
                
                // Use a short timeout to ensure the QR code is rendered before printing
                setTimeout(() => {
                    window.print();
                }, 100);
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
                    const client = allUsers.find(u => u.id === order.userId);
                    const storesInOrder = [...new Set(order.items.map(item => item.vendor))].join(', ');
                    const lastTracking = order.trackingHistory[order.trackingHistory.length - 1];

                    return (
                        <details key={order.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-sm group">
                            <summary className="font-semibold cursor-pointer dark:text-white flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-kmer-green">{order.id}</span>
                                    <span className="text-gray-600 dark:text-gray-400"> - {client?.name || 'Client Inconnu'}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                                    {statusTranslations[order.status]}
                                </span>
                            </summary>

                            <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-4">
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <h4 className="font-bold mb-1">Détails Client</h4>
                                        <p><strong>Nom:</strong> {order.shippingAddress.fullName}</p>
                                        <p><strong>Tél:</strong> {order.shippingAddress.phone}</p>
                                        <p><strong>Adresse:</strong> {order.shippingAddress.address}, {order.shippingAddress.city}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-1">Détails Commande</h4>
                                        <p><strong>Boutique(s):</strong> {storesInOrder}</p>
                                        <p><strong>Dernier Suivi:</strong> {lastTracking ? `${new Date(lastTracking.date).toLocaleString('fr-FR')} - ${lastTracking.details}`: 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold mb-1 text-sm">Historique des statuts</h4>
                                    <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400 max-h-24 overflow-y-auto">
                                        {order.statusChangeLog?.map((log, i) => (
                                            <li key={i}>
                                                <span className="font-semibold">{new Date(log.date).toLocaleString('fr-FR')}:</span> {statusTranslations[log.status]} (par {log.changedBy})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                {order.deliveryFailureReason && (
                                    <div className="p-2 bg-red-50 dark:bg-red-900/50 rounded-md text-sm">
                                        <p className="font-semibold text-red-800 dark:text-red-200">Échec de livraison :</p>
                                        <p className="italic text-red-700 dark:text-red-300">
                                            <strong>Motif:</strong> {order.deliveryFailureReason.reason} <br />
                                            <strong>Détails:</strong> {order.deliveryFailureReason.details || 'N/A'}
                                        </p>
                                    </div>
                                )}
                                {order.status === 'refund-requested' && (
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/50 rounded-md">
                                        <p className="font-semibold text-sm text-purple-800 dark:text-purple-200">Demande de remboursement :</p>
                                        <p className="text-sm italic text-purple-700 dark:text-purple-300">"{order.refundReason}"</p>
                                        {order.refundEvidenceUrls && order.refundEvidenceUrls.length > 0 && (
                                            <div className="mt-2">
                                                <p className="font-semibold text-xs text-purple-800 dark:text-purple-200">Preuves fournies :</p>
                                                <div className="flex gap-2 flex-wrap mt-1">
                                                    {order.refundEvidenceUrls.map((url, i) => (
                                                        <a href={url} target="_blank" rel="noopener noreferrer" key={i} className="block border-2 border-purple-200 rounded-md overflow-hidden">
                                                            <img src={url} alt={`Evidence ${i + 1}`} className="h-16 w-16 object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div className="flex-1">
                                        <label className="text-xs font-medium dark:text-gray-300">Changer le statut :</label>
                                        <select
                                            value={order.status}
                                            onChange={e => onUpdateOrderStatus(order, e.target.value as OrderStatus)}
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
                                            <PrinterIcon className="w-4 h-4" /> Imprimer l'étiquette
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </details>
                    )
                })}
            </div>
        </div>
    );
};

const StoreManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allStores' | 'allUsers' | 'onApproveStore' | 'onRejectStore' | 'onToggleStoreStatus' | 'onToggleStorePremiumStatus' | 'onWarnStore' | 'onRequestDocument' | 'onVerifyDocumentStatus' | 'siteSettings' | 'onActivateSubscription'>> = ({ allStores, allUsers, onApproveStore, onRejectStore, onToggleStoreStatus, onToggleStorePremiumStatus, onWarnStore, onRequestDocument, onVerifyDocumentStatus, siteSettings, onActivateSubscription }) => {
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
            onWarnStore(warningStore, warningReason);
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
                                    store.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                    store.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                }`}>{store.status}</span>
                            </summary>
                            <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2 dark:text-white text-sm">Actions Rapides</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {store.status === 'pending' && <>
                                            <button onClick={() => onApproveStore(store)} className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors">Approuver</button>
                                            <button onClick={() => onRejectStore(store)} className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors">Rejeter</button>
                                        </>}
                                        {store.status === 'active' && <button onClick={() => onToggleStoreStatus(store)} className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors">Suspendre</button>}
                                        {store.status === 'suspended' && <button onClick={() => onToggleStoreStatus(store)} className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors">Réactiver</button>}
                                        {store.status === 'active' && <button onClick={() => setWarningStore(store)} className="text-sm bg-yellow-500 text-white px-3 py-1.5 rounded-md hover:bg-yellow-600 transition-colors">Avertir</button>}
                                        {store.status === 'active' && (
                                            <button onClick={() => onToggleStorePremiumStatus(store)} className={`text-sm text-white px-3 py-1.5 rounded-md transition-colors ${store.premiumStatus === 'premium' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-kmer-yellow hover:bg-yellow-500'}`}>
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
                                                    onClick={() => onActivateSubscription(store)}
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
                                                <div className="flex gap-2 mt-2 sm:mt-0 items-center">
                                                    {doc.fileUrl && ['uploaded', 'verified'].includes(doc.status) && (
                                                        <a 
                                                            href={doc.fileUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors"
                                                        >
                                                            Voir le document
                                                        </a>
                                                    )}
                                                    {doc.status === 'uploaded' && (
                                                        <>
                                                            <button 
                                                                onClick={() => {
                                                                    const reason = window.prompt('Motif du rejet (optionnel) :');
                                                                    if (reason !== null) {
                                                                        onVerifyDocumentStatus(store, doc.name, 'rejected', reason || 'Non spécifié');
                                                                    }
                                                                }} 
                                                                className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors"
                                                            >
                                                                Rejeter
                                                            </button>
                                                            <button 
                                                                onClick={() => onVerifyDocumentStatus(store, doc.name, 'verified')} 
                                                                className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors"
                                                            >
                                                                Approuver
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
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
                                 <div>
                                    <h4 className="font-semibold mb-2 dark:text-white text-sm">Personnel Assigné</h4>
                                    <div className="text-sm bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 p-2">
                                        {(allUsers.filter(u => u.role === 'depot_agent' && u.depotId === store.id).map(agent => agent.name).join(', ') || <span className="text-gray-500 italic">Aucun agent assigné</span>)}
                                    </div>
                                </div>
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </>
    );
};

const UserDetailModal: React.FC<{
    user: User;
    allStores: Store[];
    allPickupPoints: PickupPoint[];
    onClose: () => void;
    onUpdateUser: (userId: string, updates: Partial<User>) => void;
}> = ({ user, allStores, allPickupPoints, onClose, onUpdateUser }) => {
    const [formData, setFormData] = useState<Partial<User>>(user);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onUpdateUser(user.id, formData);
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold dark:text-white">Détails de l'utilisateur</h3>
                    <button onClick={onClose}><XIcon className="w-6 h-6"/></button>
                </div>
                <div className="space-y-4">
                     <div>
                        <label className="text-sm font-medium">Nom</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Email (non modifiable)</label>
                        <input type="email" value={formData.email || ''} readOnly className="mt-1 w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Rôle</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option value="customer">Client</option>
                            <option value="seller">Vendeur</option>
                            <option value="delivery_agent">Livreur</option>
                            <option value="depot_agent">Agent de dépôt</option>
                            <option value="superadmin">Super Admin</option>
                        </select>
                    </div>
                    {formData.role === 'seller' && (
                        <div>
                            <label className="text-sm font-medium">Boutique Associée</label>
                            <input type="text" name="shopName" value={formData.shopName || ''} onChange={handleChange} placeholder="Nom exact de la boutique" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                    )}
                    {formData.role === 'depot_agent' && (
                        <div>
                            <label className="text-sm font-medium">Dépôt Assigné</label>
                            <select name="depotId" value={formData.depotId || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option value="">-- Aucun dépôt --</option>
                                {allPickupPoints.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Annuler</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md">Enregistrer</button>
                </div>
            </div>
        </div>
    );
};

const UserManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allUsers' | 'onUpdateUser' | 'onCreateUserByAdmin' | 'allPickupPoints' | 'allStores'>> = ({ allUsers, onUpdateUser, onCreateUserByAdmin, allPickupPoints, allStores }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUserData, setNewUserData] = useState({ name: '', email: '', role: 'seller' as UserRole });
    const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const usersPerPage = 10;

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUserData.name && newUserData.email) {
            onCreateUserByAdmin(newUserData);
            setIsCreatingUser(false);
            setNewUserData({ name: '', email: '', role: 'seller' });
        }
    };

    const filteredUsers = useMemo(() => {
        return allUsers.filter(user => {
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesSearch = searchTerm === '' || user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesRole && matchesSearch;
        });
    }, [allUsers, searchTerm, roleFilter]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * usersPerPage;
        return filteredUsers.slice(startIndex, startIndex + usersPerPage);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    
    return (
        <div className="p-4 sm:p-6">
             {editingUser && (
                <UserDetailModal 
                    user={editingUser}
                    allStores={allStores}
                    allPickupPoints={allPickupPoints}
                    onClose={() => setEditingUser(null)}
                    onUpdateUser={onUpdateUser}
                />
            )}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold dark:text-white">Gestion des Utilisateurs</h2>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <select
                        value={roleFilter}
                        onChange={e => { setRoleFilter(e.target.value as any); setCurrentPage(1); }}
                        className="w-full sm:w-auto p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 text-sm"
                    >
                        <option value="all">Tous les rôles</option>
                        <option value="customer">Client</option>
                        <option value="seller">Vendeur</option>
                        <option value="delivery_agent">Livreur</option>
                        <option value="depot_agent">Agent de dépôt</option>
                        <option value="superadmin">Super Admin</option>
                    </select>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou email..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-kmer-green"
                        />
                        <SearchIcon className="absolute top-1/2 right-3 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
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
                        <option value="seller">Vendeur</option>
                        <option value="delivery_agent">Livreur</option>
                        <option value="depot_agent">Agent de dépôt</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-md">Créer</button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                {paginatedUsers.map(user => (
                    <button key={user.id} onClick={() => setEditingUser(user)} className="w-full text-left p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-900">
                        <div>
                            <p className="font-semibold dark:text-white">{user.name}
                                {user.loyalty.status === 'premium' && <StarIcon filled className="inline-block w-4 h-4 ml-1 text-kmer-yellow" />}
                                {user.loyalty.status === 'premium_plus' && <StarPlatinumIcon className="inline-block w-4 h-4 ml-1" />}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-sm font-semibold capitalize px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md">{user.role.replace('_', ' ')}</span>
                        </div>
                    </button>
                ))}
            </div>
            {totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center text-sm">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 disabled:opacity-50"><ChevronLeftIcon className="w-5 h-5"/></button>
                    <span>Page {currentPage} sur {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 disabled:opacity-50"><ChevronRightIcon className="w-5 h-5"/></button>
                </div>
            )}
        </div>
    );
};

const CategoryManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allCategories' | 'onUpdateCategoryImage' | 'onAdminAddCategory' | 'onAdminDeleteCategory'>> = ({ allCategories, onUpdateCategoryImage, onAdminAddCategory, onAdminDeleteCategory }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatParent, setNewCatParent] = useState<string>(''); // Empty string for main category

    const mainCategories = useMemo(() => allCategories.filter(c => !c.parentId), [allCategories]);

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
            onAdminAddCategory(newCatName, newCatParent || undefined);
            setNewCatName('');
            setNewCatParent('');
            setIsAdding(false);
        }
    };

    const CategoryItem: React.FC<{ category: Category }> = ({ category }) => (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
                <img src={category.imageUrl || PLACEHOLDER_IMAGE_URL} alt={category.name} className="w-16 h-16 object-cover rounded-md" />
                <span className="font-semibold dark:text-white">{category.name}</span>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-blue-500 cursor-pointer hover:underline">
                    Changer l'image
                    <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, category.id)} accept="image/*"/>
                </label>
                <button onClick={() => onAdminDeleteCategory(category.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">Gestion des Catégories</h2>
              <button onClick={() => setIsAdding(!isAdding)} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2">
                 <PlusIcon className="w-5 h-5"/> {isAdding ? 'Annuler' : 'Ajouter une catégorie'}
              </button>
            </div>
            
            {isAdding && (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 flex flex-col sm:flex-row gap-4">
                    <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nom de la catégorie" className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    <select value={newCatParent} onChange={e => setNewCatParent(e.target.value)} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="">-- Catégorie Principale (aucun parent) --</option>
                        {mainCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <button onClick={handleAddCategory} className="bg-blue-500 text-white font-semibold px-4 rounded-md">Ajouter</button>
                </div>
            )}
            
            <div className="space-y-4">
                {mainCategories.map(mainCat => (
                    <div key={mainCat.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <CategoryItem category={mainCat} />
                        <div className="pl-6 mt-3 space-y-2 border-l-2 border-gray-200 dark:border-gray-600 ml-8">
                            {allCategories.filter(c => c.parentId === mainCat.id).map(subCat => (
                                <CategoryItem key={subCat.id} category={subCat} />
                            ))}
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

const PickupPointManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allPickupPoints' | 'onAddPickupPoint' | 'onUpdatePickupPoint' | 'onDeletePickupPoint' | 'allUsers'>> = ({ allPickupPoints, onAddPickupPoint, onUpdatePickupPoint, onDeletePickupPoint, allUsers }) => {
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
            mapRef.current.eachLayer((layer: any) => { if (layer instanceof L.Marker && layer !== markerRef.current) mapRef.current.removeLayer(layer); });
            allPickupPoints.forEach(point => {
                if (point.latitude && point.longitude) {
                    L.marker([point.latitude, point.longitude]).addTo(mapRef.current).bindPopup(point.name);
                }
            });
        }
    }, [allPickupPoints]);
    
     useEffect(() => {
        if (mapRef.current) {
            if (formData.latitude && formData.longitude) {
                const latLng: [number, number] = [formData.latitude, formData.longitude];
                if (markerRef.current) {
                    markerRef.current.setLatLng(latLng);
                } else {
                    markerRef.current = L.marker(latLng, { draggable: true }).addTo(mapRef.current);
                    markerRef.current.on('dragend', (e: any) => {
                        const { lat, lng } = e.target.getLatLng();
                        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                    });
                }
                mapRef.current.panTo(latLng);
            } else {
                if (markerRef.current) {
                    markerRef.current.remove();
                    markerRef.current = null;
                }
            }
        }
    }, [formData.latitude, formData.longitude]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'latitude' || name === 'longitude') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Cliquez sur la carte ou entrez les coordonnées :</p>
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
                        {allPickupPoints.map(point => {
                            const assignedAgents = allUsers.filter(u => u.role === 'depot_agent' && u.depotId === point.id);
                            return (
                                <details key={point.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                    <summary className="font-semibold flex justify-between items-center cursor-pointer">
                                        <span>{point.name} <span className="text-xs text-gray-500">({point.city})</span></span>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.preventDefault(); handleEdit(point); }} className="text-blue-500"><PencilSquareIcon className="w-5 h-5"/></button>
                                            <button onClick={(e) => { e.preventDefault(); onDeletePickupPoint(point.id); }} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </summary>
                                    <div className="mt-2 pt-2 border-t dark:border-gray-600">
                                        <h4 className="text-xs font-bold">Personnel Assigné:</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                            {assignedAgents.length > 0 ? assignedAgents.map(a => a.name).join(', ') : <i className="text-gray-400">Aucun</i>}
                                        </p>
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div>
                <div ref={mapContainerRef} className="h-96 w-full rounded-lg" />
            </div>
        </div>
    );
};

const PayoutsPanel: React.FC<Pick<SuperAdminDashboardProps, 'payouts' | 'allStores' | 'allOrders' | 'onPayoutSeller' | 'flashSales' | 'siteSettings'>> = ({ payouts, allStores, allOrders, onPayoutSeller, flashSales, siteSettings }) => {
    const storeBalances = useMemo(() => {
        const commissionRate = siteSettings.commissionRate || 0;

        return allStores.map(store => {
            const deliveredOrders = allOrders.filter(o => o.status === 'delivered' && o.items.some(i => i.vendor === store.name));
            
            const totalRevenue = deliveredOrders.reduce((sum, order) => {
                const storeItemsTotal = order.items
                    .filter(i => i.vendor === store.name)
                    .reduce((itemSum, item) => itemSum + getFinalPriceForPayout(item, flashSales) * item.quantity, 0);
                return sum + storeItemsTotal;
            }, 0);
            
            const commission = totalRevenue * (commissionRate / 100);
            const totalPaidOut = payouts.filter(p => p.storeId === store.id).reduce((sum, p) => sum + p.amount, 0);
            const balance = totalRevenue - commission - totalPaidOut;
            
            return { store, totalRevenue, totalPaidOut, commission, balance };
        });
    }, [allStores, allOrders, payouts, flashSales, siteSettings.commissionRate]);
    
    return (
        <div className="p-6">
             <h2 className="text-xl font-bold mb-4">Paiements aux Vendeurs</h2>
            <div>
                {/* Mobile View */}
                <div className="space-y-4 md:hidden">
                    {storeBalances.map(({ store, balance, totalRevenue, totalPaidOut, commission }) => (
                        <div key={store.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-sm">
                            <h4 className="font-bold text-lg dark:text-white">{store.name}</h4>
                            <div className="mt-2 space-y-1 text-sm border-t dark:border-gray-700 pt-2">
                                <div className="flex justify-between"><span>Revenu Total:</span> <span className="font-semibold">{totalRevenue.toLocaleString('fr-CM')} FCFA</span></div>
                                <div className="flex justify-between"><span>Commission:</span> <span className="text-red-600 font-semibold">-{commission.toLocaleString('fr-CM')} FCFA</span></div>
                                <div className="flex justify-between"><span>Déjà Payé:</span> <span className="font-semibold">{totalPaidOut.toLocaleString('fr-CM')} FCFA</span></div>
                                <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t dark:border-gray-700"><span>Solde Actuel:</span> <span className="text-kmer-green">{balance.toLocaleString('fr-CM')} FCFA</span></div>
                            </div>
                            <button onClick={() => onPayoutSeller(store, balance)} className="mt-4 w-full text-sm bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400" disabled={balance <=0}>
                                Payer le solde
                            </button>
                        </div>
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="p-2">Boutique</th>
                                <th className="p-2">Revenu Total (Livré)</th>
                                <th className="p-2">Commission KMER ZONE ({siteSettings.commissionRate}%)</th>
                                <th className="p-2">Déjà Payé</th>
                                <th className="p-2">Solde Actuel</th>
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {storeBalances.map(({ store, balance, totalRevenue, totalPaidOut, commission }) => (
                                <tr key={store.id} className="border-b dark:border-gray-700">
                                    <td className="p-2 font-semibold">{store.name}</td>
                                    <td className="p-2">{totalRevenue.toLocaleString('fr-CM')} FCFA</td>
                                    <td className="p-2 text-red-600">-{commission.toLocaleString('fr-CM')} FCFA</td>
                                    <td className="p-2">{totalPaidOut.toLocaleString('fr-CM')} FCFA</td>
                                    <td className="p-2 font-bold">{balance.toLocaleString('fr-CM')} FCFA</td>
                                    <td className="p-2">
                                        <button onClick={() => onPayoutSeller(store, balance)} className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 disabled:bg-gray-400" disabled={balance <=0}>Payer le solde</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            <h3 className="text-lg font-bold mt-8 mb-4">Historique Détaillé des Paiements</h3>
            <div className="max-h-80 overflow-y-auto">
                {/* Mobile View */}
                <div className="space-y-3 md:hidden">
                    {payouts.length > 0 ? (
                        payouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payout, index) => {
                            const store = allStores.find(s => s.id === payout.storeId);
                            return (
                                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-between items-center">
                                    <span className="font-semibold">{store?.name || 'Boutique Inconnue'}</span>
                                    <span className="font-semibold text-gray-800 dark:text-white">{payout.amount.toLocaleString('fr-CM')} FCFA</span>
                                </div>
                            );
                        })
                    ) : (
                        <p className="p-4 text-center text-gray-500">Aucun paiement enregistré.</p>
                    )}
                </div>
                
                {/* Desktop View */}
                <div className="hidden md:block">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="p-2">Date</th>
                                <th className="p-2">Boutique</th>
                                <th className="p-2">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payouts.length > 0 ? (
                                payouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payout, index) => {
                                     const store = allStores.find(s => s.id === payout.storeId);
                                     return (
                                        <tr key={index} className="border-b dark:border-gray-700">
                                            <td className="p-2">{new Date(payout.date).toLocaleDateString('fr-FR')}</td>
                                            <td className="p-2 font-semibold">{store?.name || 'Boutique Inconnue'}</td>
                                            <td className="p-2">{payout.amount.toLocaleString('fr-CM')} FCFA</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-gray-500">Aucun paiement enregistré.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const AdvertisementsManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'advertisements' | 'onAddAdvertisement' | 'onUpdateAdvertisement' | 'onDeleteAdvertisement'>> = ({ advertisements, onAddAdvertisement, onUpdateAdvertisement, onDeleteAdvertisement }) => {
    const [formData, setFormData] = useState<Omit<Advertisement, 'id'>>({ imageUrl: '', linkUrl: '#', location: 'homepage-banner', isActive: true });
    const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

    const handleCancel = () => {
        setEditingAd(null);
        setFormData({ imageUrl: '', linkUrl: '#', location: 'homepage-banner', isActive: true });
    };

    useEffect(() => {
        if (editingAd) {
            setFormData({
                imageUrl: editingAd.imageUrl,
                linkUrl: editingAd.linkUrl,
                location: editingAd.location,
                isActive: editingAd.isActive,
            });
        } else {
             setFormData({ imageUrl: '', linkUrl: '#', location: 'homepage-banner', isActive: true });
        }
    }, [editingAd]);

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
    
    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <h3 className="text-lg font-bold mb-4">{editingAd ? 'Modifier' : 'Ajouter'} une Publicité</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm">Image (URL ou téléverser)</label>
                        <input type="file" onChange={handleImageChange} className="mt-1 w-full text-sm"/>
                        <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="Ou coller une URL" className="mt-1 w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"/>
                        {formData.imageUrl && <img src={formData.imageUrl} alt="preview" className="mt-2 h-24 w-full object-contain rounded"/>}
                    </div>
                    <input type="text" name="linkUrl" value={formData.linkUrl} onChange={handleChange} placeholder="Lien de redirection" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <select name="location" value={formData.location} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                        <option value="homepage-banner">Bannière page d'accueil</option>
                    </select>
                    <label className="flex items-center gap-2"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} /> Actif</label>
                    <div className="flex gap-2">
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">{editingAd ? 'Mettre à jour' : 'Ajouter'}</button>
                        {editingAd && <button type="button" onClick={handleCancel} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-md">Annuler</button>}
                    </div>
                </form>
            </div>
             <div className="md:col-span-2">
                <h3 className="text-lg font-bold mb-4">Publicités Actuelles</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {advertisements.map(ad => (
                        <div key={ad.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src={ad.imageUrl} alt="Ad" className="h-16 w-32 object-cover rounded-md" />
                                <div>
                                    <p className="font-semibold capitalize">{ad.location.replace('-', ' ')}</p>
                                    <p className={`text-xs font-bold ${ad.isActive ? 'text-green-500' : 'text-gray-500'}`}>{ad.isActive ? 'Actif' : 'Inactif'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingAd(ad)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"><PencilSquareIcon className="w-5 h-5" /></button>
                                <button onClick={() => onDeleteAdvertisement(ad.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PaymentMethodsPanel: React.FC<{
    paymentMethods: PaymentMethod[];
    onUpdatePaymentMethods: (newMethods: PaymentMethod[]) => void;
}> = ({ paymentMethods, onUpdatePaymentMethods }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newMethod, setNewMethod] = useState({ name: '', imageUrl: '' });

    const handleAdd = () => {
        if (newMethod.name && newMethod.imageUrl) {
            const updatedMethods = [...paymentMethods, { ...newMethod, id: `pm-${Date.now()}` }];
            onUpdatePaymentMethods(updatedMethods);
            setNewMethod({ name: '', imageUrl: '' });
            setIsAdding(false);
        }
    };

    const handleUpdate = (id: string, field: 'name' | 'imageUrl', value: string) => {
        const updatedMethods = paymentMethods.map(m => m.id === id ? { ...m, [field]: value } : m);
        onUpdatePaymentMethods(updatedMethods);
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Supprimer ce moyen de paiement ?")) {
            const updatedMethods = paymentMethods.filter(m => m.id !== id);
            onUpdatePaymentMethods(updatedMethods);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, id?: string) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const imageUrl = reader.result as string;
                if (id) {
                    handleUpdate(id, 'imageUrl', imageUrl);
                } else {
                    setNewMethod(prev => ({ ...prev, imageUrl }));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    return (
      <div className="p-4 border dark:border-gray-700 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="font-semibold dark:text-white">Moyens de Paiement</h3>
            <button onClick={() => setIsAdding(!isAdding)} className="bg-blue-500 text-white text-sm font-semibold px-3 py-1 rounded-md">{isAdding ? 'Annuler' : 'Ajouter'}</button>
        </div>

        {isAdding && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md space-y-3 border dark:border-gray-600">
            <h4 className="font-medium">Nouveau moyen de paiement</h4>
            <input type="text" placeholder="Nom (ex: Wave)" value={newMethod.name} onChange={e => setNewMethod(p => ({...p, name: e.target.value}))} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"/>
            <input type="text" placeholder="URL de l'image" value={newMethod.imageUrl} onChange={e => setNewMethod(p => ({...p, imageUrl: e.target.value}))} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"/>
            <div className="flex items-center gap-2">
              <label className="text-sm">Ou téléverser :</label>
              <input type="file" onChange={handleImageUpload} className="text-sm" />
            </div>
            <button onClick={handleAdd} className="bg-kmer-green text-white px-4 py-2 rounded-md">Ajouter</button>
          </div>
        )}
        
        <div className="space-y-2">
            {paymentMethods.map(method => (
                <div key={method.id} className="flex items-center gap-4 p-2 border dark:border-gray-600 rounded-md">
                    <img src={method.imageUrl} alt={method.name} className="h-8 w-12 object-contain bg-white rounded p-1"/>
                    <input type="text" value={method.name} onChange={e => handleUpdate(method.id, 'name', e.target.value)} className="flex-grow p-1 border rounded-md text-sm bg-transparent dark:bg-gray-700"/>
                    <input type="file" id={`file-${method.id}`} onChange={(e) => handleImageUpload(e, method.id)} className="hidden"/>
                    <label htmlFor={`file-${method.id}`} className="text-blue-500 cursor-pointer text-sm hover:underline">Changer l'image</label>
                    <button onClick={() => handleDelete(method.id)} className="text-red-500 p-1"><TrashIcon className="w-5 h-5"/></button>
                </div>
            ))}
        </div>
      </div>
    );
};

const SiteSettingsPanel: React.FC<Pick<SuperAdminDashboardProps, 'siteSettings' | 'onUpdateSiteSettings' | 'isChatEnabled' | 'isComparisonEnabled' | 'onToggleChatFeature' | 'onToggleComparisonFeature' | 'paymentMethods' | 'onUpdatePaymentMethods'>> = ({ siteSettings, onUpdateSiteSettings, isChatEnabled, isComparisonEnabled, onToggleChatFeature, onToggleComparisonFeature, paymentMethods, onUpdatePaymentMethods }) => {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
                     <div className="pt-2">
                        <label className="flex items-center gap-3">
                            <input 
                                type="checkbox" 
                                name="canSellersCreateCategories" 
                                checked={localSettings.canSellersCreateCategories} 
                                onChange={handleChange} 
                                className="h-4 w-4 rounded"
                            />
                            <span>Autoriser les vendeurs à créer de nouvelles catégories</span>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 pl-7">Si désactivé, les vendeurs devront choisir parmi les catégories existantes lors de l'ajout d'un produit.</p>
                    </div>
                 </div>
            </div>

            <div className="p-4 border dark:border-gray-700 rounded-lg space-y-4">
              <h3 className="font-semibold dark:text-white">Paramètres de Livraison</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">Frais de base intra-urbain (FCFA)</label>
                  <input type="number" name="deliverySettings.intraUrbanBaseFee" value={localSettings.deliverySettings.intraUrbanBaseFee} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Frais de base inter-urbain (FCFA)</label>
                  <input type="number" name="deliverySettings.interUrbanBaseFee" value={localSettings.deliverySettings.interUrbanBaseFee} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Coût par Kg supplémentaire (FCFA)</label>
                  <input type="number" name="deliverySettings.costPerKg" value={localSettings.deliverySettings.costPerKg} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                </div>
              </div>
            </div>

            <PaymentMethodsPanel paymentMethods={paymentMethods} onUpdatePaymentMethods={onUpdatePaymentMethods} />

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

            <div className="p-4 border dark:border-gray-700 rounded-lg space-y-4">
                <h3 className="font-semibold dark:text-white">Mode Maintenance</h3>
                <label className="flex items-center gap-3">
                    <input type="checkbox" name="maintenanceMode.isEnabled" checked={localSettings.maintenanceMode.isEnabled} onChange={handleChange} className="h-4 w-4 rounded"/>
                    <span>Activer le mode maintenance</span>
                </label>
                <div>
                    <label className="block text-sm font-medium">Message de maintenance</label>
                    <textarea name="maintenanceMode.message" value={localSettings.maintenanceMode.message} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Date de réouverture estimée</label>
                    <input type="datetime-local" name="maintenanceMode.reopenDate" value={localSettings.maintenanceMode.reopenDate ? localSettings.maintenanceMode.reopenDate.slice(0, 16) : ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <button onClick={handleSave} className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">Sauvegarder les Paramètres</button>
            </div>
        </div>
    );
};

const AvailabilityPanel: React.FC<{
    deliveryAgents: User[];
}> = ({ deliveryAgents }) => {
    return (
        <div className="p-6">
            <h2 className="text-xl font-bold dark:text-white mb-4">Disponibilité des Agents de Livraison</h2>
            <div className="space-y-2">
                {deliveryAgents.map(agent => (
                    <div key={agent.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md flex justify-between items-center">
                        <p className="font-semibold">{agent.name}</p>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">Disponible</span>
                    </div>
                ))}
                {deliveryAgents.length === 0 && <p className="text-gray-500">Aucun agent disponible pour le moment.</p>}
            </div>
        </div>
    );
};

const SupportPanel: React.FC<Pick<SuperAdminDashboardProps, 'allTickets' | 'onAdminReplyToTicket' | 'onAdminUpdateTicketStatus'>> = ({ allTickets, onAdminReplyToTicket, onAdminUpdateTicketStatus }) => {
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [reply, setReply] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    const [status, setStatus] = useState<TicketStatus>('Ouvert');
    const [priority, setPriority] = useState<TicketPriority>('Moyenne');

    useEffect(() => {
        if (selectedTicket) {
            setStatus(selectedTicket.status);
            setPriority(selectedTicket.priority);
        }
    }, [selectedTicket]);

    const handleStatusUpdate = () => {
        if (selectedTicket) {
            onAdminUpdateTicketStatus(selectedTicket.id, status, priority);
            setSelectedTicket(prev => prev ? {...prev, status, priority} : null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => setAttachments(prev => [...prev, reader.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };
    
    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    const AttachmentPreview: React.FC<{ attachments: string[], onRemove: (index: number) => void }> = ({ attachments, onRemove }) => (
        <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {attachments.map((url, i) => (
                <div key={i} className="relative group">
                    <img src={url} alt={`Aperçu ${i}`} className="h-20 w-full object-cover rounded-md"/>
                    <button type="button" onClick={() => onRemove(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );

    const MessageAttachments: React.FC<{ urls: string[] }> = ({ urls }) => (
        <div className="mt-2 flex flex-wrap gap-2">
            {urls.map((url, i) => {
                const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(url) || url.startsWith('data:image');
                if (isImage) {
                    return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block"><img src={url} alt={`Pièce jointe ${i+1}`} className="h-24 w-auto rounded-md object-contain border dark:border-gray-600"/></a>
                }
                return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-sm flex items-center gap-1 p-2 bg-blue-50 dark:bg-blue-900/50 rounded-md"><PaperclipIcon className="w-4 h-4"/>Pièce jointe {i+1}</a>
            })}
        </div>
    );
    
    const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
        <div className={className}>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{title}</h2>
            {children}
        </div>
    );

    const TicketDetailView: React.FC<{ ticket: Ticket, onReply: (id: string, msg: string, attachments?: string[]) => void, onBack: () => void }> = ({ ticket, onReply, onBack }) => {
        const { user } = useAuth();
        
        // FIX: Defined missing handleSubmit function
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (selectedTicket) {
                onAdminReplyToTicket(selectedTicket.id, reply, attachments);
                setReply('');
                setAttachments([]);
            }
        };

        return (
            <Section title={ticket.subject}>
                 <button onClick={onBack} className="text-sm font-semibold text-kmer-green mb-4"> &lt; Retour à la liste</button>
                {/* FIX: Added status update controls for admin */}
                <div className="flex flex-col sm:flex-row gap-4 items-center mb-4 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-medium">Statut</label>
                        <select value={status} onChange={e => setStatus(e.target.value as TicketStatus)} className="w-full p-2 border rounded-md dark:bg-gray-700">
                            <option value="Ouvert">Ouvert</option>
                            <option value="En cours">En cours</option>
                            <option value="Résolu">Résolu</option>
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="text-xs font-medium">Priorité</label>
                        <select value={priority} onChange={e => setPriority(e.target.value as TicketPriority)} className="w-full p-2 border rounded-md dark:bg-gray-700">
                            <option value="Basse">Basse</option>
                            <option value="Moyenne">Moyenne</option>
                            <option value="Haute">Haute</option>
                        </select>
                    </div>
                    <button onClick={handleStatusUpdate} className="bg-blue-500 text-white px-4 py-2 rounded-md self-end">Mettre à jour</button>
                </div>
                <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50 mb-4 space-y-4">
                  {ticket.messages.map((msg, i) => {
                      const isMe = msg.authorId === user?.id;
                      return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-3 rounded-lg max-w-sm ${isMe ? 'bg-kmer-green text-white' : 'bg-white'}`}>
                            <p className="font-bold text-sm">{msg.authorName}</p>
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                            {msg.attachmentUrls && <MessageAttachments urls={msg.attachmentUrls} />}
                          </div>
                        </div>
                      );
                  })}
                </div>
                <form onSubmit={handleSubmit}>
                    <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Votre réponse..." className="w-full p-2 border rounded-md"></textarea>
                    <div className="mt-2">
                        <label htmlFor="attachments-upload-reply" className="cursor-pointer text-sm font-semibold text-blue-500 flex items-center gap-2"><PaperclipIcon className="w-4 h-4" /> Joindre des fichiers</label>
                        <input id="attachments-upload-reply" type="file" multiple onChange={handleFileChange} className="hidden" />
                        {attachments.length > 0 && <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />}
                    </div>
                    <button type="submit" className="mt-2 bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">Envoyer</button>
                </form>
            </Section>
        );
    };

    // FIX: Added main return logic for the SupportPanel component
    if (selectedTicket) {
        return (
            <div className="p-4 sm:p-6">
                <TicketDetailView ticket={selectedTicket} onReply={onAdminReplyToTicket} onBack={() => setSelectedTicket(null)} />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <h2 className="text-xl font-bold mb-4">Tickets de Support ({allTickets.length})</h2>
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                    {allTickets.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(ticket => (
                        <button key={ticket.id} onClick={() => setSelectedTicket(ticket)} className={`w-full text-left p-3 border rounded-lg ${selectedTicket?.id === ticket.id ? 'bg-kmer-green/10 border-kmer-green' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{ticket.subject}</p>
                                    <p className="text-xs text-gray-500">Par: {ticket.userName} | MàJ: {new Date(ticket.updatedAt).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-xs font-semibold">
                                    <span className={`px-2 py-0.5 rounded-full ${ticket.status === 'Résolu' ? 'bg-green-100 text-green-800' : ticket.status === 'En cours' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{ticket.status}</span>
                                    <span className={`px-2 py-0.5 rounded-full ${ticket.priority === 'Haute' ? 'bg-red-100 text-red-800' : ticket.priority === 'Moyenne' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>{ticket.priority}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="md:col-span-2">
                <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p>Sélectionnez un ticket pour voir les détails.</p>
                </div>
            </div>
        </div>
    );
};

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ allUsers, allOrders, allCategories, allStores, allProducts, siteActivityLogs, onUpdateOrderStatus, onUpdateCategoryImage, onWarnStore, onToggleStoreStatus, onToggleStorePremiumStatus, onApproveStore, onRejectStore, onSaveFlashSale, flashSales, onUpdateFlashSaleSubmissionStatus, onBatchUpdateFlashSaleStatus, onRequestDocument, onVerifyDocumentStatus, allPickupPoints, onAddPickupPoint, onUpdatePickupPoint, onDeletePickupPoint, onAssignAgent, isChatEnabled, isComparisonEnabled, onToggleChatFeature, onToggleComparisonFeature, siteSettings, onUpdateSiteSettings, onAdminAddCategory, onAdminDeleteCategory, onUpdateUser, payouts, onPayoutSeller, onActivateSubscription, advertisements, onAddAdvertisement, onUpdateAdvertisement, onDeleteAdvertisement, onCreateUserByAdmin, onSanctionAgent, onResolveRefund, onAdminStoreMessage, onAdminCustomerMessage, siteContent, onUpdateSiteContent, allTickets, allAnnouncements, onAdminReplyToTicket, onAdminUpdateTicketStatus, onCreateOrUpdateAnnouncement, onDeleteAnnouncement, onReviewModeration, paymentMethods, onUpdatePaymentMethods }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
    const { user } = useAuth();
    
    const deliveryAgents = useMemo(() => allUsers.filter(u => u.role === 'delivery_agent' && u.availabilityStatus === 'available'), [allUsers]);
    const pendingStoresCount = allStores.filter(s => s.status === 'pending').length;
    const pendingReviewsCount = allProducts.flatMap(p => p.reviews).filter(r => r.status === 'pending').length;
    const openTicketsCount = allTickets.filter(t => t.status !== 'Résolu').length;

    const handleAssign = (orderId: string, agentId: string) => {
        onAssignAgent(orderId, agentId);
        setAssigningOrder(null);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <DashboardOverviewPanel allOrders={allOrders} allStores={allStores} allUsers={allUsers} siteActivityLogs={siteActivityLogs} />;
            case 'orders':
                return <OrderManagementPanel allOrders={allOrders} allUsers={allUsers} onUpdateOrderStatus={onUpdateOrderStatus} onAssignAgent={onAssignAgent} onOpenAssignModal={setAssigningOrder} onResolveRefund={onResolveRefund} onAdminStoreMessage={onAdminStoreMessage} onAdminCustomerMessage={onAdminCustomerMessage} />;
            case 'stores':
                return <StoreManagementPanel allStores={allStores} allUsers={allUsers} onApproveStore={onApproveStore} onRejectStore={onRejectStore} onToggleStoreStatus={onToggleStoreStatus} onToggleStorePremiumStatus={onToggleStorePremiumStatus} onWarnStore={onWarnStore} onRequestDocument={onRequestDocument} onVerifyDocumentStatus={onVerifyDocumentStatus} siteSettings={siteSettings} onActivateSubscription={onActivateSubscription} />;
            case 'users':
                return <UserManagementPanel allUsers={allUsers} onUpdateUser={onUpdateUser} onCreateUserByAdmin={onCreateUserByAdmin} allPickupPoints={allPickupPoints} allStores={allStores} />;
            case 'categories':
                return <CategoryManagementPanel allCategories={allCategories} onUpdateCategoryImage={onUpdateCategoryImage} onAdminAddCategory={onAdminAddCategory} onAdminDeleteCategory={onAdminDeleteCategory} />;
            case 'flash-sales':
                return <FlashSaleManagementPanel flashSales={flashSales} onSaveFlashSale={onSaveFlashSale} allProducts={allProducts} onUpdateFlashSaleSubmissionStatus={onUpdateFlashSaleSubmissionStatus} onBatchUpdateFlashSaleStatus={onBatchUpdateFlashSaleStatus} />;
            case 'pickup-points':
                return <PickupPointManagementPanel allPickupPoints={allPickupPoints} onAddPickupPoint={onAddPickupPoint} onUpdatePickupPoint={onUpdatePickupPoint} onDeletePickupPoint={onDeletePickupPoint} allUsers={allUsers}/>;
            case 'payouts':
                return <PayoutsPanel payouts={payouts} allStores={allStores} allOrders={allOrders} onPayoutSeller={onPayoutSeller} flashSales={flashSales} siteSettings={siteSettings} />;
            case 'ads':
                return <AdvertisementsManagementPanel advertisements={advertisements} onAddAdvertisement={onAddAdvertisement} onUpdateAdvertisement={onUpdateAdvertisement} onDeleteAdvertisement={onDeleteAdvertisement} />;
            case 'logs':
                return <LogsPanel siteActivityLogs={siteActivityLogs} />;
            case 'support':
                return <SupportPanel allTickets={allTickets} onAdminReplyToTicket={onAdminReplyToTicket} onAdminUpdateTicketStatus={onAdminUpdateTicketStatus} />;
            case 'reviews':
                return <ReviewModerationPanel allProducts={allProducts} onReviewModeration={onReviewModeration} />;
            case 'settings':
                return <SiteSettingsPanel siteSettings={siteSettings} onUpdateSiteSettings={onUpdateSiteSettings} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onToggleChatFeature={onToggleChatFeature} onToggleComparisonFeature={onToggleComparisonFeature} paymentMethods={paymentMethods} onUpdatePaymentMethods={onUpdatePaymentMethods} />;
            default: return null;
        }
    }
    
    return (
        <>
            {assigningOrder && <AssignAgentModal orderId={assigningOrder} deliveryAgents={deliveryAgents} onClose={() => setAssigningOrder(null)} onAssign={handleAssign} />}
            <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
                <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                    <div className="container mx-auto px-4 sm:px-6 py-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><AcademicCapIcon className="w-6 h-6"/> Tableau de bord Super Admin</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Connecté en tant que {user?.name}</p>
                            </div>
                        </div>
                    </div>
                </header>
                 <div className="container mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-8">
                    <aside className="md:w-64 flex-shrink-0">
                         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-1 sticky top-24">
                            <TabButton icon={<ChartPieIcon className="w-5 h-5"/>} label="Aperçu" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                            <TabButton icon={<ShoppingBagIcon className="w-5 h-5"/>} label="Commandes" isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                            <TabButton icon={<BuildingStorefrontIcon className="w-5 h-5"/>} label="Boutiques" isActive={activeTab === 'stores'} onClick={() => setActiveTab('stores')} count={pendingStoresCount} />
                            <TabButton icon={<UsersIcon className="w-5 h-5"/>} label="Utilisateurs" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                            <TabButton icon={<TagIcon className="w-5 h-5"/>} label="Catégories" isActive={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
                            <TabButton icon={<BoltIcon className="w-5 h-5"/>} label="Ventes Flash" isActive={activeTab === 'flash-sales'} onClick={() => setActiveTab('flash-sales')} />
                            <TabButton icon={<StarIcon className="w-5 h-5"/>} label="Avis" isActive={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} count={pendingReviewsCount}/>
                            <TabButton icon={<MapPinIcon className="w-5 h-5"/>} label="Points Relais" isActive={activeTab === 'pickup-points'} onClick={() => setActiveTab('pickup-points')} />
                            <TabButton icon={<BanknotesIcon className="w-5 h-5"/>} label="Paiements" isActive={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')} />
                            <TabButton icon={<MegaphoneIcon className="w-5 h-5"/>} label="Publicités" isActive={activeTab === 'ads'} onClick={() => setActiveTab('ads')} />
                            <TabButton icon={<ChatBubbleLeftRightIcon className="w-5 h-5"/>} label="Support" isActive={activeTab === 'support'} onClick={() => setActiveTab('support')} count={openTicketsCount} />
                            <TabButton icon={<ClockIcon className="w-5 h-5"/>} label="Logs" isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                            <TabButton icon={<Cog8ToothIcon className="w-5 h-5"/>} label="Paramètres" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                        </div>
                    </aside>
                    <main className="flex-grow">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-full">
                           {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default SuperAdminDashboard;
