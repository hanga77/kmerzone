import React, { useState, useMemo, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import type { Order, Category, OrderStatus, Store, SiteActivityLog, UserRole, FlashSale, Product, FlashSaleProduct, RequestedDocument, PickupPoint, User, Warning, SiteSettings, Payout, Advertisement, UserAvailabilityStatus, CartItem, DisputeMessage, SiteContent, Review, Ticket, TicketStatus, TicketPriority, Announcement, PaymentMethod } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
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
                                        {(order.statusChangeLog || []).map((log, i) => (
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

const StoreManagementPanel: React.FC<Pick<SuperAdminDashboardProps, 'allStores' | 'allUsers' | 'onApproveStore' | 'onRejectStore' | 'onToggleStoreStatus' | 'onWarnStore' | 'onRequestDocument' | 'onVerifyDocumentStatus' | 'siteSettings'>> = ({ allStores, allUsers, onApproveStore, onRejectStore, onToggleStoreStatus, onWarnStore, onRequestDocument, onVerifyDocumentStatus, siteSettings }) => {
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
                    {allStores.map(store => {
                         const hasPaidSubscription = store.status === 'pending' && (store.premiumStatus === 'premium' || store.premiumStatus === 'super_premium');
                        return (
                            <details key={store.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-sm group" open={store.status === 'pending'}>
                                <summary className="font-semibold cursor-pointer dark:text-white flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <img src={store.logoUrl} alt={store.name} className="w-10 h-10 rounded-md object-contain bg-white"/>
                                        <div>
                                            <p>{store.name} {hasPaidSubscription && <span className="text-xs font-bold text-yellow-500">(Abonnement Payé)</span>}</p>
                                            <p className="text-xs text-gray-500">{store.location}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${store.status === 'active' ? 'bg-green-100 text-green-800' : (store.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}`}>
                                        {store.status}
                                    </span>
                                </summary>

                                <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-4">
                                    <div className="text-sm">
                                       <p><strong>Gérant:</strong> {store.sellerFirstName} {store.sellerLastName}</p>
                                       <p><strong>Contact:</strong> {store.sellerPhone}</p>
                                       <p><strong>Adresse:</strong> {store.physicalAddress}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Documents</h4>
                                        <div className="space-y-2">
                                            {store.documents.map(doc => (
                                                <div key={doc.name} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md">
                                                    <p className="text-sm">{doc.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDocStatusClass(doc.status)}`}>{doc.status}</span>
                                                        {doc.status === 'uploaded' && (
                                                            <>
                                                                <button onClick={() => onVerifyDocumentStatus(store, doc.name, 'verified')} className="text-green-500 hover:text-green-700"><CheckCircleIcon className="w-5 h-5"/></button>
                                                                <button onClick={() => onVerifyDocumentStatus(store, doc.name, 'rejected', prompt('Motif du rejet:') || 'Non conforme')} className="text-red-500 hover:text-red-700"><XCircleIcon className="w-5 h-5"/></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <form onSubmit={(e) => handleRequestNewDoc(e, store.id)} className="flex gap-2">
                                                <input name="docName" type="text" placeholder="Demander un autre document..." className="flex-grow p-1 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600" />
                                                <button type="submit" className="text-sm bg-blue-500 text-white font-semibold px-3 py-1 rounded-md">Demander</button>
                                            </form>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2 border-t dark:border-gray-600">
                                        {store.status === 'pending' && <button onClick={() => onApproveStore(store)} className="bg-green-500 text-white px-3 py-1 text-sm rounded-md">Approuver Boutique</button>}
                                        {store.status === 'pending' && <button onClick={() => onRejectStore(store)} className="bg-red-500 text-white px-3 py-1 text-sm rounded-md">Rejeter</button>}
                                        <button onClick={() => onToggleStoreStatus(store)} className="bg-gray-500 text-white px-3 py-1 text-sm rounded-md">{store.status === 'active' ? 'Suspendre' : 'Réactiver'}</button>
                                        <button onClick={() => setWarningStore(store)} className="bg-yellow-500 text-white px-3 py-1 text-sm rounded-md">Avertir</button>
                                    </div>
                                </div>
                            </details>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

const SettingsPanel: React.FC<Pick<SuperAdminDashboardProps, 'siteSettings' | 'onUpdateSiteSettings'>> = 
({ siteSettings, onUpdateSiteSettings }) => {
    const [localSettings, setLocalSettings] = useState(siteSettings);

    useEffect(() => {
        setLocalSettings(siteSettings);
    }, [siteSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');

        setLocalSettings(prev => {
            const newSettings = JSON.parse(JSON.stringify(prev));
            let current: any = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]] = current[keys[i]] || {};
            }
            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
    };

    const handleSave = () => {
        onUpdateSiteSettings(localSettings);
        alert('Paramètres SEO sauvegardés !');
    };

    return (
        <div className="p-4 sm:p-6 space-y-8">
            <h2 className="text-xl font-bold dark:text-white">Paramètres de Référencement (SEO)</h2>
            
            <div className="space-y-4 pt-2">
                <div>
                    <label htmlFor="seo.metaTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Méta Titre par défaut</label>
                    <input type="text" id="seo.metaTitle" name="seo.metaTitle" value={localSettings.seo.metaTitle} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Le titre qui apparaît dans l'onglet du navigateur et les résultats de recherche. Idéalement entre 50-60 caractères.</p>
                </div>
                <div>
                    <label htmlFor="seo.metaDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Méta Description par défaut</label>
                    <textarea id="seo.metaDescription" name="seo.metaDescription" value={localSettings.seo.metaDescription} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">La description qui apparaît sous le titre dans les résultats de recherche. Idéalement entre 150-160 caractères.</p>
                </div>
                <div>
                    <label htmlFor="seo.ogImageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL de l'image de partage (OpenGraph)</label>
                    <input type="text" id="seo.ogImageUrl" name="seo.ogImageUrl" value={localSettings.seo.ogImageUrl} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">L'image qui s'affiche lors du partage d'un lien vers le site sur les réseaux sociaux. Taille recommandée : 1200x630 pixels.</p>
                    {localSettings.seo.ogImageUrl && <img src={localSettings.seo.ogImageUrl} alt="Aperçu OpenGraph" className="mt-2 h-32 object-contain border rounded-md dark:border-gray-600"/>}
                </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                <button onClick={handleSave} className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">
                    Enregistrer les paramètres SEO
                </button>
            </div>
        </div>
    );
};


const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = (props) => {
    const { allUsers, allOrders, allStores, allProducts, allTickets, siteActivityLogs } = props;
    const [activeTab, setActiveTab] = useState('overview');
    const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
    
    const deliveryAgents = useMemo(() => allUsers.filter(u => u.role === 'delivery_agent' && u.availabilityStatus === 'available'), [allUsers]);
    
    const pendingStoresCount = useMemo(() => allStores.filter(s => s.status === 'pending').length, [allStores]);
    const refundRequestsCount = useMemo(() => allOrders.filter(o => o.status === 'refund-requested').length, [allOrders]);
    const pendingReviewsCount = useMemo(() => allProducts.flatMap(p => p.reviews).filter(r => r.status === 'pending').length, [allProducts]);
    const openTicketsCount = useMemo(() => allTickets.filter(t => t.status === 'Ouvert').length, [allTickets]);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <DashboardOverviewPanel {...props} />;
            case 'orders':
                return <OrderManagementPanel {...props} onOpenAssignModal={setAssigningOrder} />;
            case 'stores':
                return <StoreManagementPanel {...props} />;
            case 'reviews':
                 return <ReviewModerationPanel allProducts={allProducts} onReviewModeration={props.onReviewModeration} />;
            case 'logs':
                return <LogsPanel siteActivityLogs={siteActivityLogs} />;
            case 'settings':
                return <SettingsPanel siteSettings={props.siteSettings} onUpdateSiteSettings={props.onUpdateSiteSettings} />;
            default:
                return <div className="p-6">Panel for "{activeTab}" not implemented.</div>;
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
             {assigningOrder && (
                <AssignAgentModal 
                    orderId={assigningOrder}
                    deliveryAgents={deliveryAgents}
                    onClose={() => setAssigningOrder(null)}
                    onAssign={(orderId, agentId) => {
                        props.onAssignAgent(orderId, agentId);
                        setAssigningOrder(null);
                    }}
                />
            )}
            <div className="container mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4 lg:w-1/5 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-2 sticky top-24">
                        <TabButton icon={<ChartPieIcon className="w-5 h-5"/>} label="Aperçu" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <TabButton icon={<ShoppingBagIcon className="w-5 h-5"/>} label="Commandes" isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} count={refundRequestsCount} />
                        <TabButton icon={<BuildingStorefrontIcon className="w-5 h-5"/>} label="Boutiques" isActive={activeTab === 'stores'} onClick={() => setActiveTab('stores')} count={pendingStoresCount} />
                        <TabButton icon={<StarIcon className="w-5 h-5"/>} label="Avis" isActive={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} count={pendingReviewsCount} />
                        <TabButton icon={<BoltIcon className="w-5 h-5"/>} label="Marketing" isActive={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} />
                        <TabButton icon={<ScaleIcon className="w-5 h-5"/>} label="Logs" isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
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
    );
};

export default SuperAdminDashboard;
