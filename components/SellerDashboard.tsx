import React, { useState, useMemo, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import type { Product, Category, Store, FlashSale, Order, OrderStatus, PromoCode, DocumentStatus, SiteSettings, Story, FlashSaleProduct, Payout, CartItem, ProductCollection, Review, Notification, Ticket, ShippingPartner, ShippingSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { PencilSquareIcon, TrashIcon, Cog8ToothIcon, TagIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, BoltIcon, DocumentTextIcon, ShoppingBagIcon, TruckIcon, BuildingStorefrontIcon, CurrencyDollarIcon, ChartPieIcon, StarIcon, ChatBubbleBottomCenterTextIcon, PlusIcon, XCircleIcon, XIcon as XIconSmall, PrinterIcon, SparklesIcon, QrCodeIcon, BarChartIcon, PaperAirplaneIcon, BanknotesIcon, ChatBubbleLeftRightIcon, BookmarkSquareIcon, BellIcon, PaperclipIcon, UsersIcon, StarPlatinumIcon } from './Icons';
import ShippingSettingsPanel from './ShippingSettingsPanel';

declare const Html5Qrcode: any;

interface SellerDashboardProps {
  store?: Store;
  products: Product[];
  categories: Category[];
  flashSales: FlashSale[];
  sellerOrders: Order[];
  promoCodes: PromoCode[];
  allTickets: Ticket[];
  onBack: () => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateProductStatus: (productId: string, status: Product['status']) => void;
  onNavigateToProfile: () => void;
  onNavigateToAnalytics: () => void;
  onSetPromotion: (product: Product) => void;
  onRemovePromotion: (productId: string) => void;
  onProposeForFlashSale: (flashSaleId: string, productId: string, flashPrice: number, sellerShopName: string) => void;
  onUploadDocument: (storeId: string, documentName: string, fileUrl: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onCreatePromoCode: (codeData: Omit<PromoCode, 'uses'>) => void;
  onDeletePromoCode: (code: string) => void;
  isChatEnabled: boolean;
  onPayRent: (storeId: string) => void;
  siteSettings: SiteSettings;
  onAddStory: (storeId: string, imageUrl: string) => void;
  onDeleteStory: (storeId: string, storyId: string) => void;
  payouts: Payout[];
  onSellerDisputeMessage: (orderId: string, message: string) => void;
  onBulkUpdateProducts: (updates: Array<Pick<Product, 'id' | 'price' | 'stock'>>) => void;
  onReplyToReview: (productId: string, reviewIdentifier: { author: string; date: string }, replyText: string) => void;
  onCreateOrUpdateCollection: (storeId: string, collection: Omit<ProductCollection, 'id' | 'storeId'> | ProductCollection) => void;
  onDeleteCollection: (storeId: string, collectionId: string) => void;
  initialTab: string;
  sellerNotifications: Notification[];
  onMarkNotificationAsRead: (notificationId: string) => void;
  onNavigateFromNotification: (link: Notification['link']) => void;
  onCreateTicket: (subject: string, message: string, relatedOrderId?: string, type?: 'support' | 'service_request', attachmentUrls?: string[]) => void;
  allShippingPartners: ShippingPartner[];
  onUpdateShippingSettings: (storeId: string, settings: ShippingSettings) => void;
}

const PLACEHOLDER_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23E5E7EB'/%3E%3Cpath d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' stroke='%239CA3AF' stroke-width='1.5'/%3E%3C/svg%3E";

const statusTranslations: {[key in OrderStatus]: string} = {
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
  'delivery-failed': 'Échec de livraison',
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

const getActiveFlashSalePrice = (productId: string, flashSales: FlashSale[]): number | null => {
    const now = new Date();
    for (const sale of flashSales) {
        const startDate = new Date(sale.startDate);
        const endDate = new Date(sale.endDate);
        if (now >= startDate && now <= endDate) {
            const productInSale = sale.products.find(p => p.productId === productId && p.status === 'approved');
            if (productInSale) return productInSale.flashPrice;
        }
    }
    return null;
}

const isPromotionActive = (product: Product): boolean => {
  if (!product.promotionPrice || product.promotionPrice >= product.price) {
    return false;
  }
  const now = new Date();
  const startDate = product.promotionStartDate ? new Date(product.promotionStartDate + 'T00:00:00') : null;
  const endDate = product.promotionEndDate ? new Date(product.promotionEndDate + 'T23:59:59') : null;

  if (!startDate && !endDate) return false; 
  if (startDate && endDate) return now >= startDate && now <= endDate;
  if (startDate) return now >= startDate;
  if (endDate) return now <= endDate;
  
  return false; 
};

const getFinalPrice = (item: CartItem, flashSales: FlashSale[]): number => {
    const flashPrice = getActiveFlashSalePrice(item.id, flashSales);
    if (flashPrice !== null) return flashPrice;
    if (isPromotionActive(item)) return item.promotionPrice!;
    return item.price;
};


const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, count?: number }> = ({ icon, label, isActive, onClick, count }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center gap-3 w-full text-left px-3 py-3 text-sm font-semibold rounded-lg transition-colors ${
            isActive
                ? 'bg-kmer-green/10 text-kmer-green'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
        }`}
    >
        {icon}
        <span className="flex-grow">{label}</span>
        {count !== undefined && count > 0 && (
            <span className="ml-1 text-xs bg-kmer-red text-white rounded-full px-1.5 py-0.5">{count}</span>
        )}
    </button>
);

const StatCard: React.FC<{icon: React.ReactNode, label: string, value: string | number}> = ({icon, label, value}) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center gap-4">
            <div className="text-kmer-green">{icon}</div>
            <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </div>
        </div>
    </div>
);

const ScannerModal: React.FC<{
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    scanResult: { success: boolean, message: string } | null;
}> = ({ onClose, onScanSuccess, scanResult }) => {
    const html5QrCodeRef = useRef<any>(null);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const viewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!Html5Qrcode) {
            console.error("Html5Qrcode library not loaded!");
            setScannerError("La bibliothèque de scan n'a pas pu être chargée. Veuillez rafraîchir la page.");
            return;
        }

        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        const startScanner = async () => {
            try {
                if (!html5QrCodeRef.current?.isScanning) {
                    setScannerError(null);
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText: string, decodedResult: any) => {
                           onScanSuccess(decodedText);
                        },
                        (errorMessage: string) => {}
                    );
                }
            } catch (err) {
                console.error("Failed to start scanner", err);
                setScannerError("Impossible d'activer la caméra. Veuillez vérifier les permissions dans votre navigateur.");
            }
        };

        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch((err: any) => console.error("Failed to stop scanner on unmount", err));
            }
        };
    }, [onScanSuccess]);

    useEffect(() => {
        if (scanResult && html5QrCodeRef.current?.isScanning) {
            html5QrCodeRef.current.stop().catch((err: any) => console.error("Failed to stop scanner on result", err));
            if (viewRef.current) {
                viewRef.current.style.display = 'none';
            }
        }
    }, [scanResult]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-6 max-w-lg w-full relative text-white">
                <h3 className="text-xl font-bold mb-4 text-center">Scanner le code-barres du colis</h3>
                
                <div className="w-full h-64 bg-gray-800 rounded-md overflow-hidden flex items-center justify-center">
                    <div id="reader" ref={viewRef} className="w-full"></div>
                    
                    {scannerError && (
                         <div className="text-center p-4">
                            <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mb-4 mx-auto"/>
                            <p className="text-red-300 font-semibold">Erreur de Caméra</p>
                            <p className="text-sm text-red-300/80">{scannerError}</p>
                        </div>
                    )}
                    
                    {scanResult && (
                        <div className="text-center p-4">
                            <div className={`p-3 rounded-full mb-4 inline-block ${scanResult.success ? 'bg-green-600/30' : 'bg-red-600/30'}`}>
                               {scanResult.success ? <CheckCircleIcon className="w-10 h-10 text-green-300"/> : <ExclamationTriangleIcon className="w-10 h-10 text-red-300"/>}
                            </div>
                            <p className={`font-semibold text-lg ${scanResult.success ? 'text-green-300' : 'text-red-300'}`}>
                               {scanResult.message}
                            </p>
                        </div>
                    )}
                </div>

                {!scanResult && !scannerError && (
                    <p className="text-center text-gray-400 text-sm mt-4">Visez le code-barres avec votre caméra.</p>
                )}
                
                <button onClick={onClose} className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    Fermer
                </button>
            </div>
        </div>
    );
};

const OrderCard: React.FC<{order: Order, onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void, onScan: (order: Order) => void, onPrint: (order: Order) => void}> = ({ order, onUpdateOrderStatus, onScan, onPrint }) => {
    
    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div>
                    <p className="font-semibold dark:text-gray-200">{order.id}</p>
                    <p className="text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
                <div className="text-left sm:text-right mt-2 sm:mt-0">
                    <p className="font-semibold dark:text-gray-200">{order.total.toLocaleString('fr-CM')} FCFA</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>{statusTranslations[order.status]}</span>
                </div>
            </div>
             <div className="mt-3 pt-3 border-t dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm">
                    <p className="font-semibold">Client: {order.shippingAddress.fullName}</p>
                    <p>{order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                </div>
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={() => onPrint(order)} className="flex items-center gap-2 text-sm bg-gray-200 dark:bg-gray-700 font-semibold px-3 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto justify-center">
                        <PrinterIcon className="w-4 h-4"/> Imprimer
                    </button>
                    {order.status === 'confirmed' && (
                        <button onClick={() => onScan(order)} className="flex items-center gap-2 text-sm bg-kmer-green text-white font-semibold px-3 py-2 rounded-md hover:bg-green-700 w-full sm:w-auto justify-center">
                           <QrCodeIcon className="w-4 h-4"/> Scanner le colis
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const OverviewPanel: React.FC<{ 
    analytics: any; 
    onNavigate: () => void; 
    lowStockProductsCount: number;
    store: Store;
    siteSettings: SiteSettings;
    onUpgradeRequest: (type: 'premium' | 'super_premium') => void;
    upgradeRequestSent: boolean;
}> = ({ analytics, onNavigate, lowStockProductsCount, store, siteSettings, onUpgradeRequest, upgradeRequestSent }) => (
    <div className="p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold dark:text-white">Aperçu</h2>
            <button onClick={onNavigate} className="text-sm bg-blue-500 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2">
                <BarChartIcon className="w-4 h-4"/> Voir les analyses détaillées
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<CurrencyDollarIcon className="w-7 h-7"/>} label="Revenu Total (Livré)" value={`${analytics.totalRevenue.toLocaleString('fr-CM')} FCFA`} />
            <StatCard icon={<TruckIcon className="w-7 h-7"/>} label="Commandes en attente" value={analytics.openOrders} />
            <StatCard icon={<UsersIcon className="w-7 h-7"/>} label="Visites de la boutique (jour)" value={store.visits || 0} />
            {lowStockProductsCount > 0 ? (
                 <div className="p-4 bg-orange-100 dark:bg-orange-900/50 rounded-lg border-l-4 border-orange-500">
                    <div className="flex items-center gap-4">
                        <div className="text-orange-500"><ExclamationTriangleIcon className="w-7 h-7"/></div>
                        <div>
                            <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{lowStockProductsCount}</p>
                            <p className="text-sm text-orange-700 dark:text-orange-300">Produits en stock faible</p>
                        </div>
                    </div>
                </div>
            ) : (
                <StatCard icon={<ShoppingBagIcon className="w-7 h-7"/>} label="Produits" value={analytics.totalProducts} />
            )}
        </div>

        {store.premiumStatus === 'standard' && (
            <div className="mt-8 p-6 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-lg shadow-lg">
                <div className="flex items-center gap-4">
                    <StarIcon className="w-12 h-12 text-white flex-shrink-0" />
                    <div>
                        <h3 className="text-2xl font-bold">Passez au niveau supérieur avec le statut Premium !</h3>
                        <p className="opacity-90">Débloquez des avantages exclusifs pour booster votre visibilité et vos ventes.</p>
                    </div>
                </div>
                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> Support technique prioritaire</li>
                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> Mise en avant sur le site</li>
                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> Frais de service réduits</li>
                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> Tarifs logistiques préférentiels</li>
                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> Résolution de litiges accélérée</li>
                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> Meilleure visibilité (Réseaux sociaux)</li>
                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> Service de photographie professionnelle</li>
                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> Outils de catalogue avancés</li>
                </ul>
                {upgradeRequestSent ? (
                     <div className="mt-6 text-center font-bold bg-white/20 p-3 rounded-md">
                        <CheckCircleIcon className="w-6 h-6 mx-auto mb-1" />
                        Votre demande a été envoyée ! Nous vous contacterons bientôt.
                    </div>
                ) : (
                    <button onClick={() => onUpgradeRequest('premium')} className="mt-6 bg-white text-yellow-600 font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition-transform transform hover:scale-105">
                        Je veux devenir Premium ({siteSettings.premiumPlan.price.toLocaleString('fr-CM')} FCFA / {siteSettings.premiumPlan.durationDays} jrs)
                    </button>
                )}
            </div>
        )}
        
        {store.premiumStatus === 'premium' && (
            <div className="mt-8 p-6 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded-lg shadow-lg">
                 <div className="flex items-center gap-4">
                    <StarPlatinumIcon className="w-12 h-12 text-white flex-shrink-0" />
                    <div>
                        <h3 className="text-2xl font-bold">Devenez Super Premium pour une visibilité maximale !</h3>
                        <p className="opacity-90">Dominez le marché avec le statut le plus élevé de notre plateforme.</p>
                    </div>
                </div>
                {upgradeRequestSent ? (
                     <div className="mt-6 text-center font-bold bg-white/20 p-3 rounded-md">
                        <CheckCircleIcon className="w-6 h-6 mx-auto mb-1" />
                        Votre demande a été envoyée ! Nous vous contacterons bientôt.
                    </div>
                ) : (
                    <button onClick={() => onUpgradeRequest('super_premium')} className="mt-6 bg-white text-red-600 font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition-transform transform hover:scale-105">
                       Je veux devenir Super Premium ({siteSettings.superPremiumPlan.price.toLocaleString('fr-CM')} FCFA / {siteSettings.superPremiumPlan.durationDays} jrs)
                    </button>
                )}
            </div>
        )}

    </div>
);

const ProductsPanel: React.FC<Pick<SellerDashboardProps, 'products' | 'onAddProduct' | 'onEditProduct' | 'onDeleteProduct' | 'onUpdateProductStatus' | 'onSetPromotion' | 'onRemovePromotion'>> = ({ products, onAddProduct, onEditProduct, onDeleteProduct, onUpdateProductStatus, onSetPromotion, onRemovePromotion }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');
    const [currentPage, setCurrentPage] = useState(1);
    const PRODUCTS_PER_PAGE = 5;

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    const filteredProducts = useMemo(() => {
        if (statusFilter === 'active') {
            return products.filter(p => p.status === 'published' || p.status === 'draft');
        }
        return products.filter(p => p.status === 'archived');
    }, [products, statusFilter]);

    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
    }, [filteredProducts, currentPage, PRODUCTS_PER_PAGE]);

    const PaginationControls = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-gray-700">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Précédent
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} sur {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Suivant
                </button>
            </div>
        );
    };
    
    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                 <div className="flex items-center gap-2">
                    <button onClick={() => setStatusFilter('active')} className={`px-3 py-1.5 text-sm font-semibold rounded-md ${statusFilter === 'active' ? 'bg-kmer-green text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Actifs & Brouillons</button>
                    <button onClick={() => setStatusFilter('archived')} className={`px-3 py-1.5 text-sm font-semibold rounded-md ${statusFilter === 'archived' ? 'bg-kmer-green text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Archivés</button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={onAddProduct} className="flex-1 sm:flex-none bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                        <PlusIcon className="w-5 h-5"/> Ajouter un produit
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {paginatedProducts.map(product => (
                    <div key={product.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md flex flex-col sm:flex-row gap-4">
                        <img src={product.imageUrls[0] || PLACEHOLDER_IMAGE_URL} alt={product.name} className="w-full sm:w-24 h-24 object-cover rounded-md flex-shrink-0" />
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold dark:text-white">{product.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Stock: {product.stock} | Prix: {product.price.toLocaleString('fr-CM')} FCFA</p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                                    product.status === 'published' ? 'bg-green-100 text-green-800' :
                                    product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-200 text-gray-700'
                                }`}>{product.status}</span>
                            </div>
                             <div className="flex flex-wrap gap-2 mt-2">
                                <button onClick={() => onEditProduct(product)} className="text-xs flex items-center gap-1 bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-md hover:bg-blue-200"><PencilSquareIcon className="w-4 h-4"/> Modifier</button>
                                <button onClick={() => onSetPromotion(product)} className="text-xs flex items-center gap-1 bg-yellow-100 text-yellow-800 font-semibold px-3 py-1 rounded-md hover:bg-yellow-200"><TagIcon className="w-4 h-4"/> Promo</button>
                                {product.status === 'published' ? (
                                    <button onClick={() => onUpdateProductStatus(product.id, 'draft')} className="text-xs flex items-center gap-1 bg-gray-200 text-gray-800 font-semibold px-3 py-1 rounded-md hover:bg-gray-300">Dépublier</button>
                                ) : (
                                     <button onClick={() => onUpdateProductStatus(product.id, 'published')} className="text-xs flex items-center gap-1 bg-green-100 text-green-800 font-semibold px-3 py-1 rounded-md hover:bg-green-200">Publier</button>
                                )}
                                <button onClick={() => onDeleteProduct(product.id)} className="text-xs flex items-center gap-1 bg-red-100 text-red-800 font-semibold px-3 py-1 rounded-md hover:bg-red-200"><TrashIcon className="w-4 h-4"/> Supprimer</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <PaginationControls />
        </div>
    );
};

const OrdersPanel: React.FC<{ title: string, orders: Order[], onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void, onScan: (order: Order) => void, onPrint: (order: Order) => void }> = ({ title, orders, onUpdateOrderStatus, onScan, onPrint }) => {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold dark:text-white mb-4">{title}</h2>
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((o: Order) => <OrderCard key={o.id} order={o} onUpdateOrderStatus={onUpdateOrderStatus} onScan={onScan} onPrint={onPrint} />)
          ) : (
            <p className="text-center text-gray-500 py-8">Aucune commande dans cette catégorie.</p>
          )}
        </div>
      </div>
    );
};

const PromoCodeForm: React.FC<{
  sellerId: string;
  onCreatePromoCode: (codeData: Omit<PromoCode, 'uses'>) => void;
  onCancel: () => void;
}> = ({ sellerId, onCreatePromoCode, onCancel }) => {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [minPurchase, setMinPurchase] = useState<number | undefined>(undefined);
  const [validUntil, setValidUntil] = useState<string | undefined>(undefined);
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) {
      alert("Le code et la valeur de la remise sont obligatoires.");
      return;
    }
    onCreatePromoCode({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minPurchase,
      validUntil,
      maxUses,
      sellerId,
    });
    onCancel(); // Close form on successful creation
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 my-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 space-y-4">
      <h3 className="font-semibold text-lg dark:text-white">Créer un nouveau Code Promo</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Code</label>
          <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="SOLDE10" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
        </div>
        <div>
          <label className="text-sm font-medium">Type de Remise</label>
          <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
            <option value="percentage">Pourcentage (%)</option>
            <option value="fixed">Montant Fixe (FCFA)</option>
          </select>
        </div>
      </div>
       <div>
          <label className="text-sm font-medium">Valeur de la Remise</label>
          <input type="number" value={discountValue || ''} onChange={e => setDiscountValue(Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
        </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div>
          <label className="text-sm font-medium">Achat Minimum (FCFA)</label>
          <input type="number" value={minPurchase || ''} onChange={e => setMinPurchase(e.target.value ? Number(e.target.value) : undefined)} placeholder="Optionnel" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
        </div>
         <div>
          <label className="text-sm font-medium">Date d'expiration</label>
          <input type="date" value={validUntil || ''} onChange={e => setValidUntil(e.target.value || undefined)} placeholder="Optionnel" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 font-semibold px-4 py-2 rounded-md">Annuler</button>
        <button type="submit" className="bg-kmer-green text-white font-semibold px-4 py-2 rounded-md">Créer</button>
      </div>
    </form>
  );
};

const FlashSaleProposalModal: React.FC<{
  flashSale: FlashSale;
  sellerProducts: Product[];
  onClose: () => void;
  onSubmit: (productId: string, flashPrice: number) => void;
}> = ({ flashSale, sellerProducts, onClose, onSubmit }) => {
    const [selectedProductId, setSelectedProductId] = useState('');
    const [flashPrice, setFlashPrice] = useState('');
    const [error, setError] = useState('');

    const availableProducts = useMemo(() => {
        const proposedProductIds = new Set(flashSale.products.map(p => p.productId));
        return sellerProducts.filter(p => !proposedProductIds.has(p.id) && p.status === 'published');
    }, [flashSale, sellerProducts]);

    const selectedProduct = useMemo(() => {
        return availableProducts.find(p => p.id === selectedProductId);
    }, [selectedProductId, availableProducts]);

    const handleSubmit = () => {
        setError('');
        if (!selectedProductId || !flashPrice) {
            setError("Veuillez sélectionner un produit et définir un prix.");
            return;
        }
        const price = parseFloat(flashPrice);
        if (isNaN(price) || price <= 0) {
            setError("Le prix est invalide.");
            return;
        }
        if (selectedProduct && price >= selectedProduct.price) {
            setError("Le prix promotionnel doit être inférieur au prix original.");
            return;
        }
        onSubmit(selectedProductId, price);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold dark:text-white">Proposer un produit</h3>
                    <button onClick={onClose}><XIconSmall className="w-6 h-6"/></button>
                </div>
                <p className="text-sm mb-4">Pour l'événement: <span className="font-semibold">{flashSale.name}</span></p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Produit</label>
                        <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option value="">-- Choisir un produit --</option>
                            {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Prix Promotionnel (FCFA)</label>
                        <input type="number" value={flashPrice} onChange={e => setFlashPrice(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        {selectedProduct && <p className="text-xs text-gray-500 mt-1">Prix original : {selectedProduct.price.toLocaleString('fr-CM')} FCFA</p>}
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Annuler</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-kmer-green text-white rounded-md">Soumettre la proposition</button>
                </div>
            </div>
        </div>
    );
};


const PromotionsPanel: React.FC<{
  promoCodes: PromoCode[];
  sellerId: string;
  onCreatePromoCode: (codeData: Omit<PromoCode, 'uses'>) => void;
  onDeletePromoCode: (code: string) => void;
  flashSales: FlashSale[];
  products: Product[];
  onProposeForFlashSale: (flashSaleId: string, productId: string, flashPrice: number, sellerShopName: string) => void;
  storeName: string;
  sellerOrders: Order[];
}> = ({ promoCodes, sellerId, onCreatePromoCode, onDeletePromoCode, flashSales, products, onProposeForFlashSale, storeName, sellerOrders }) => {
  const [showForm, setShowForm] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState<FlashSale | null>(null);
  const now = new Date();
  const activeFlashSales = flashSales.filter(fs => new Date(fs.endDate) > now);

  const handleProposalSubmit = (productId: string, flashPrice: number) => {
      if (proposalModalOpen) {
          onProposeForFlashSale(proposalModalOpen.id, productId, flashPrice, storeName);
          setProposalModalOpen(null);
      }
  };

  const getStatusChip = (status: FlashSaleProduct['status']) => {
    switch (status) {
        case 'approved': return <span className="text-xs font-semibold text-green-600">Approuvé</span>;
        case 'rejected': return <span className="text-xs font-semibold text-red-600">Rejeté</span>;
        case 'pending':
        default:
            return <span className="text-xs font-semibold text-yellow-600">En attente</span>;
    }
  };
  
  return (
    <div className="p-6">
      {proposalModalOpen && (
        <FlashSaleProposalModal
          flashSale={proposalModalOpen}
          sellerProducts={products}
          onClose={() => setProposalModalOpen(null)}
          onSubmit={handleProposalSubmit}
        />
      )}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold dark:text-white">Mes Codes Promo</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2">
            <PlusIcon className="w-5 h-5"/> Créer un code
        </button>
      </div>
      {showForm && <PromoCodeForm sellerId={sellerId} onCreatePromoCode={onCreatePromoCode} onCancel={() => setShowForm(false)} />}
      <div className="space-y-2 mt-4">
          {promoCodes.map(pc => {
              const generatedRevenue = sellerOrders
                .filter(o => o.appliedPromoCode?.code === pc.code && o.status === 'delivered')
                .reduce((sum, order) => {
                    const sellerItemsTotal = order.items
                        .filter(item => item.vendor === storeName)
                        .reduce((itemSum, item) => itemSum + getFinalPrice(item, flashSales) * item.quantity, 0);
                    return sum + sellerItemsTotal;
                }, 0);

              return (
                <div key={pc.code} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4">
                    <div>
                        <p className="font-mono text-lg font-bold text-kmer-green">{pc.code}</p>
                        <p className="text-sm font-semibold">{pc.discountType === 'percentage' ? `${pc.discountValue}% de remise` : `${pc.discountValue.toLocaleString('fr-CM')} FCFA de remise`}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {pc.minPurchase && <span>Achat min: {pc.minPurchase.toLocaleString('fr-CM')} FCFA</span>}
                            {pc.minPurchase && pc.validUntil && <span> | </span>}
                            {pc.validUntil && <span>Expire le: {new Date(pc.validUntil).toLocaleDateString()}</span>}
                        </div>
                    </div>
                    <div className="flex gap-6 text-center">
                        <div>
                            <p className="font-bold text-lg">{pc.uses}</p>
                            <p className="text-xs text-gray-500">Utilisations</p>
                        </div>
                        <div>
                            <p className="font-bold text-lg">{generatedRevenue.toLocaleString('fr-CM')}</p>
                            <p className="text-xs text-gray-500">Revenu (FCFA)</p>
                        </div>
                    </div>
                    <button onClick={() => onDeletePromoCode(pc.code)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon className="w-5 h-5"/></button>
                </div>
              );
          })}
          {promoCodes.length === 0 && !showForm && <p className="text-sm text-gray-500 dark:text-gray-400">Vous n'avez aucun code promo actif.</p>}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold border-t dark:border-gray-700 pt-6 dark:text-white">Ventes Flash Actives</h3>
        {activeFlashSales.length > 0 ? (
          <div className="space-y-3 mt-4">
            {activeFlashSales.map(fs => {
              const myProposals = fs.products.filter(p => p.sellerShopName === storeName);
              return (
                <div key={fs.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-lg">{fs.name}</h4>
                        <p className="text-sm text-gray-500">Se termine le {new Date(fs.endDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <button onClick={() => setProposalModalOpen(fs)} className="text-sm bg-blue-500 text-white font-semibold px-3 py-2 rounded-md hover:bg-blue-600">
                        Proposer un produit
                    </button>
                  </div>
                  {myProposals.length > 0 && (
                     <div className="mt-3 pt-3 border-t dark:border-gray-700">
                         <h5 className="text-sm font-semibold mb-2">Mes produits proposés :</h5>
                         <ul className="space-y-1 text-sm">
                            {myProposals.map(p => {
                                const product = products.find(prod => prod.id === p.productId);
                                return (
                                    <li key={p.productId} className="flex justify-between items-center">
                                        <span>{product?.name || 'Produit inconnu'} - <span className="font-bold">{p.flashPrice.toLocaleString('fr-CM')} FCFA</span></span>
                                        {getStatusChip(p.status)}
                                    </li>
                                );
                            })}
                         </ul>
                     </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-2">Aucun événement de vente flash actif pour le moment.</p>
        )}
      </div>
    </div>
  );
};

const DocumentsPanel: React.FC<{
  store: Store;
  onUploadDocument: (storeId: string, documentName: string, fileUrl: string) => void;
}> = ({ store, onUploadDocument }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docName: string) => {
        if (e.target.files && e.target.files[0]) {
            // In a real app, this would upload the file and return a URL.
            // Here we just simulate it.
            const simulatedFileUrl = URL.createObjectURL(e.target.files[0]);
            onUploadDocument(store.id, docName, simulatedFileUrl);
        }
    }
    
    const getDocStatusClass = (status: string) => ({
        'requested': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'uploaded': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'verified': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    }[status]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold dark:text-white mb-4">Mes Documents</h2>
            <div className="space-y-3">
                {store.documents.map(doc => (
                    <div key={doc.name} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                           <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{doc.name}</p>
                            <span className={`px-2 py-0.5 mt-1 inline-block rounded-full text-xs font-medium ${getDocStatusClass(doc.status)}`}>{doc.status}</span>
                           </div>
                           <div className="mt-2 sm:mt-0">
                            {(doc.status === 'requested' || doc.status === 'rejected') && (
                                <label className="text-sm font-semibold text-kmer-green cursor-pointer hover:underline">
                                    Téléverser un fichier
                                    <input type="file" className="hidden" onChange={(e) => handleFileChange(e, doc.name)} />
                                </label>
                            )}
                            {doc.status === 'uploaded' && <p className="text-sm text-blue-600 dark:text-blue-400">En attente de vérification...</p>}
                            {doc.status === 'verified' && <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4"/> Vérifié</p>}
                           </div>
                        </div>
                        {doc.status === 'rejected' && <p className="text-sm text-red-600 dark:text-red-400 mt-2">Motif du rejet: {doc.rejectionReason}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const StoriesPanel: React.FC<{
    store: Store;
    onAddStory: (storeId: string, imageUrl: string) => void;
    onDeleteStory: (storeId: string, storyId: string) => void;
}> = ({ store, onAddStory, onDeleteStory }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeStories = useMemo(() => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return (store.stories || []).filter(s => new Date(s.createdAt) > twentyFourHoursAgo);
    }, [store.stories]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                onAddStory(store.id, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">Gérer mes Stories</h2>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Ajouter une Story
                </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Les stories sont visibles pendant 24 heures sur la page d'accueil.</p>

            {activeStories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {activeStories.map(story => (
                        <div key={story.id} className="relative group aspect-[9/16] rounded-lg overflow-hidden shadow-md">
                            <img src={story.imageUrl} alt="Story" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30"></div>
                            <button onClick={() => onDeleteStory(store.id, story.id)} className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed rounded-lg">
                    <p>Vous n'avez aucune story active.</p>
                    <p className="text-sm">Ajoutez-en une pour mettre en avant vos produits !</p>
                </div>
            )}
        </div>
    );
};

const FinancePanel: React.FC<{
    deliveredOrders: Order[];
    payouts: Payout[];
    commissionRate: number;
    flashSales: FlashSale[];
}> = ({ deliveredOrders, payouts, commissionRate, flashSales }) => {
     const financials = useMemo(() => {
        const totalRevenue = deliveredOrders.reduce((sum, order) => {
            const sellerItemsTotal = order.items.reduce((itemSum, item) => itemSum + getFinalPrice(item, flashSales) * item.quantity, 0);
            return sum + sellerItemsTotal;
        }, 0);

        const totalCommission = totalRevenue * (commissionRate / 100);
        const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0);
        const currentBalance = totalRevenue - totalCommission - totalPaidOut;

        return { totalRevenue, totalCommission, totalPaidOut, currentBalance };
    }, [deliveredOrders, payouts, commissionRate, flashSales]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Tableau de Bord Financier</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<CurrencyDollarIcon className="w-7 h-7"/>} label="Revenu Brut Total (Livré)" value={`${financials.totalRevenue.toLocaleString('fr-CM')} FCFA`} />
                <StatCard icon={<ChartPieIcon className="w-7 h-7"/>} label="Commission KMER ZONE" value={`${financials.totalCommission.toLocaleString('fr-CM')} FCFA`} />
                <StatCard icon={<BanknotesIcon className="w-7 h-7"/>} label="Total Payé" value={`${financials.totalPaidOut.toLocaleString('fr-CM')} FCFA`} />
                 <div className="p-4 bg-kmer-green/10 dark:bg-kmer-green/20 rounded-lg border-l-4 border-kmer-green">
                    <div className="flex items-center gap-4">
                        <div className="text-kmer-green"><BanknotesIcon className="w-7 h-7"/></div>
                        <div>
                            <p className="text-2xl font-bold text-kmer-green">{financials.currentBalance.toLocaleString('fr-CM')} FCFA</p>
                            <p className="text-sm text-kmer-green/80 font-semibold">Solde Actuel</p>
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold mt-8 mb-4 dark:text-white">Historique des Paiements (Payouts)</h3>
             <div className="max-h-80 overflow-y-auto">
                {/* Mobile View */}
                <div className="space-y-3 md:hidden">
                    {payouts.length > 0 ? (
                        payouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payout, index) => (
                            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-300">{new Date(payout.date).toLocaleDateString('fr-FR')}</span>
                                <span className="font-semibold text-gray-800 dark:text-white">{payout.amount.toLocaleString('fr-CM')} FCFA</span>
                            </div>
                        ))
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
                                <th className="p-2">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payouts.length > 0 ? (
                                payouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payout, index) => (
                                    <tr key={index} className="border-b dark:border-gray-700">
                                        <td className="p-2">{new Date(payout.date).toLocaleDateString('fr-FR')}</td>
                                        <td className="p-2 font-semibold">{payout.amount.toLocaleString('fr-CM')} FCFA</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="p-4 text-center text-gray-500">Aucun paiement enregistré.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const DisputesPanel: React.FC<{
    disputedOrders: Order[];
    onSellerDisputeMessage: (orderId: string, message: string) => void;
}> = ({ disputedOrders, onSellerDisputeMessage }) => {
    
    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>, orderId: string) => {
        e.preventDefault();
        const input = (e.target as any).message as HTMLInputElement;
        if(input.value.trim()){
            onSellerDisputeMessage(orderId, input.value.trim());
            input.value = '';
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Gestion des Litiges</h2>
            <div className="space-y-4">
                {disputedOrders.length > 0 ? (
                    disputedOrders.map(order => (
                        <details key={order.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <summary className="font-semibold cursor-pointer">
                                Commande {order.id} - Client: {order.shippingAddress.fullName}
                            </summary>
                             <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                <p className="font-semibold text-sm mb-2">Motif du client:</p>
                                <p className="text-sm italic p-2 bg-white dark:bg-gray-800 rounded-md">"{order.refundReason}"</p>
                                
                                <h4 className="font-semibold text-sm mt-4 mb-2">Conversation:</h4>
                                <div className="space-y-3 p-3 bg-white dark:bg-gray-800 rounded-lg max-h-60 overflow-y-auto">
                                   {(order.disputeLog || []).map((msg, i) => {
                                        const isMe = msg.author === 'seller';
                                        const authorName = msg.author.charAt(0).toUpperCase() + msg.author.slice(1);
                                        return (
                                           <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-md p-3 rounded-xl text-sm ${isMe ? 'bg-kmer-green text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                <p className="font-bold mb-1">{isMe ? 'Vous' : authorName}</p>
                                                <p>{msg.message}</p>
                                                <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.date).toLocaleTimeString('fr-FR')}</p>
                                            </div>
                                        </div>
                                        );
                                   })}
                                </div>
                                <form onSubmit={(e) => handleSendMessage(e, order.id)} className="mt-3">
                                    <div className="flex gap-2">
                                        <input name="message" placeholder="Répondre au client ou à l'admin..." className="flex-grow text-sm p-2 border rounded-md dark:bg-gray-700"/>
                                        <button type="submit" className="p-2 bg-blue-500 text-white rounded-md"><PaperAirplaneIcon className="w-5 h-5"/></button>
                                    </div>
                                </form>
                            </div>
                        </details>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-8">Aucun litige en cours.</p>
                )}
            </div>
        </div>
    );
};

const BulkEditPanel: React.FC<{
    products: Product[];
    onSave: (updates: Array<Pick<Product, 'id' | 'price' | 'stock'>>) => void;
}> = ({ products, onSave }) => {
    const [editedProducts, setEditedProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const originalProductsMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

    useEffect(() => {
        // Deep copy to prevent mutation of the original prop
        setEditedProducts(JSON.parse(JSON.stringify(products)));
    }, [products]);

    const handleCellChange = (id: string, field: 'price' | 'stock', value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) || value === '') {
            setEditedProducts(prev => prev.map(p => 
                p.id === id ? { ...p, [field]: value === '' ? 0 : numValue } : p
            ));
        }
    };

    const handleSave = () => {
        const updates = editedProducts
            .filter(ep => {
                const original = originalProductsMap.get(ep.id);
                if (!original) return false;
                return ep.price !== original.price || ep.stock !== original.stock;
            })
            .map(p => ({ id: p.id, price: p.price, stock: p.stock }));
        
        if (updates.length > 0) {
            onSave(updates);
            alert(`${updates.length} produit(s) mis à jour !`);
        } else {
            alert("Aucune modification n'a été apportée.");
        }
    };

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return editedProducts;
        const lowerSearch = searchTerm.toLowerCase();
        return editedProducts.filter(p => 
            p.name.toLowerCase().includes(lowerSearch) ||
            p.sku?.toLowerCase().includes(lowerSearch)
        );
    }, [editedProducts, searchTerm]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold dark:text-white mb-4">Modification Rapide des Produits</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Rechercher par nom ou SKU..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
                <button onClick={handleSave} className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 whitespace-nowrap">
                    Enregistrer les modifications
                </button>
            </div>
            <div className="overflow-x-auto max-h-[60vh] border rounded-lg dark:border-gray-700">
                <table className="w-full min-w-[600px] text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th className="p-2 text-left font-semibold">Produit</th>
                            <th className="p-2 text-left font-semibold w-24">SKU</th>
                            <th className="p-2 text-left font-semibold w-32">Prix (FCFA)</th>
                            <th className="p-2 text-left font-semibold w-24">Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {filteredProducts.map(p => (
                            <tr key={p.id}>
                                <td className="p-2 flex items-center gap-2">
                                    <img src={p.imageUrls[0] || PLACEHOLDER_IMAGE_URL} alt={p.name} className="w-10 h-10 object-cover rounded"/>
                                    <span className="font-medium">{p.name}</span>
                                </td>
                                <td className="p-2 font-mono text-xs">{p.sku || '-'}</td>
                                <td className="p-2">
                                    <input 
                                        type="number" 
                                        value={p.price}
                                        onChange={e => handleCellChange(p.id, 'price', e.target.value)}
                                        className="w-full p-1 border rounded bg-transparent dark:bg-gray-800 dark:border-gray-600 focus:ring-1 focus:ring-kmer-green focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input 
                                        type="number" 
                                        value={p.stock}
                                        onChange={e => handleCellChange(p.id, 'stock', e.target.value)}
                                        className={`w-full p-1 border rounded bg-transparent dark:bg-gray-800 dark:border-gray-600 focus:ring-1 focus:ring-kmer-green focus:outline-none ${!!p.variants?.length ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                                        readOnly={!!p.variants?.length}
                                        title={p.variants?.length ? "Le stock est géré au niveau des variantes" : ""}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ReviewsPanel: React.FC<Pick<SellerDashboardProps, 'products' | 'onReplyToReview'>> = ({ products, onReplyToReview }) => {
    const [replyingTo, setReplyingTo] = useState<{ productId: string; reviewIdentifier: { author: string; date: string; } } | null>(null);
    const [replyText, setReplyText] = useState('');

    const allReviews = useMemo(() => {
        return products.flatMap(p => 
            p.reviews.map(r => ({ ...r, productId: p.id, productName: p.name }))
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [products]);

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyingTo && replyText.trim()) {
            onReplyToReview(replyingTo.productId, replyingTo.reviewIdentifier, replyText.trim());
            setReplyingTo(null);
            setReplyText('');
        }
    };
    
    const Rating: React.FC<{ rating: number }> = ({ rating }) => (
        <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <StarIcon 
                key={i} 
                className={`w-4 h-4 ${i < rating ? 'text-kmer-yellow' : 'text-gray-300'}`} 
                filled={i < rating}
            />
        ))}
        </div>
    );

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold dark:text-white mb-4">Avis des Clients</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {allReviews.map((review, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-500">Produit: <span className="text-kmer-green">{review.productName}</span></p>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="font-bold">{review.author}</p>
                            <Rating rating={review.rating} />
                        </div>
                        <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString('fr-FR')}</p>
                        <p className="italic mt-2">"{review.comment}"</p>
                        {review.sellerReply ? (
                            <div className="mt-2 ml-4 p-2 bg-green-50 dark:bg-green-900/50 border-l-2 border-green-500">
                                <p className="font-semibold text-sm">Votre réponse:</p>
                                <p className="italic text-sm">"{review.sellerReply.text}"</p>
                            </div>
                        ) : (
                            replyingTo?.reviewIdentifier.date === review.date && replyingTo?.reviewIdentifier.author === review.author ? (
                                <form onSubmit={handleReplySubmit} className="mt-2 ml-4">
                                    <textarea
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        rows={2}
                                        placeholder="Votre réponse..."
                                        className="w-full p-2 border rounded-md dark:bg-gray-700"
                                    />
                                    <div className="flex gap-2 justify-end mt-1">
                                        <button type="button" onClick={() => setReplyingTo(null)} className="text-xs font-semibold">Annuler</button>
                                        <button type="submit" className="text-xs font-semibold bg-blue-500 text-white px-2 py-1 rounded">Envoyer</button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setReplyingTo({ productId: review.productId, reviewIdentifier: { author: review.author, date: review.date } })}
                                    className="text-sm font-semibold text-blue-500 hover:underline mt-2"
                                >
                                    Répondre
                                </button>
                            )
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const CollectionForm: React.FC<{
    collection?: ProductCollection | null;
    products: Product[];
    onSave: (collection: Omit<ProductCollection, 'id' | 'storeId'> | ProductCollection) => void;
    onCancel: () => void;
}> = ({ collection, products, onSave, onCancel }) => {
    const [name, setName] = useState(collection?.name || '');
    const [description, setDescription] = useState(collection?.description || '');
    const [selectedProducts, setSelectedProducts] = useState<string[]>(collection?.productIds || []);

    const handleToggleProduct = (productId: string) => {
        setSelectedProducts(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId) 
                : [...prev, productId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert("Le nom de la collection est obligatoire.");
            return;
        }
        const collectionData = {
            name,
            description,
            productIds: selectedProducts
        };
        if (collection?.id && collection?.storeId) {
            onSave({ ...collectionData, id: collection.id, storeId: collection.storeId });
        } else {
            onSave(collectionData);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="p-4 my-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 space-y-4">
            <h3 className="font-semibold text-lg dark:text-white">{collection ? 'Modifier la collection' : 'Nouvelle collection'}</h3>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la collection (ex: Nouveautés Pagne)" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optionnel)" rows={2} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            <div>
                <h4 className="font-medium text-sm mb-2">Sélectionner les produits</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                    {products.map(p => (
                        <label key={p.id} className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 text-sm">
                            <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => handleToggleProduct(p.id)} className="h-4 w-4 rounded border-gray-300 text-kmer-green focus:ring-kmer-green"/>
                            <span>{p.name}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 font-semibold px-4 py-2 rounded-md">Annuler</button>
                <button type="submit" className="bg-kmer-green text-white font-semibold px-4 py-2 rounded-md">Enregistrer</button>
            </div>
        </form>
    );
};

const CollectionsPanel: React.FC<Pick<SellerDashboardProps, 'store' | 'products' | 'onCreateOrUpdateCollection' | 'onDeleteCollection'>> = ({ store, products, onCreateOrUpdateCollection, onDeleteCollection }) => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingCollection, setEditingCollection] = useState<ProductCollection | null>(null);

    if (!store) return null;

    const handleSave = (collectionData: Omit<ProductCollection, 'id' | 'storeId'> | ProductCollection) => {
        onCreateOrUpdateCollection(store.id, collectionData);
        setIsFormVisible(false);
        setEditingCollection(null);
    };

    const handleEdit = (collection: ProductCollection) => {
        setEditingCollection(collection);
        setIsFormVisible(true);
    };
    
    const handleCancel = () => {
        setIsFormVisible(false);
        setEditingCollection(null);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">Mes Collections</h2>
                <button onClick={() => { setIsFormVisible(prev => !prev); setEditingCollection(null); }} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> {isFormVisible && !editingCollection ? 'Annuler' : 'Créer une collection'}
                </button>
            </div>

            {isFormVisible && (
                <CollectionForm 
                    collection={editingCollection} 
                    products={products}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
            
            <div className="space-y-3 mt-4">
                {(store.collections || []).map(collection => (
                    <div key={collection.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg">{collection.name}</h3>
                                <p className="text-sm text-gray-500">{collection.productIds.length} produit(s)</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(collection)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"><PencilSquareIcon className="w-5 h-5"/></button>
                                <button onClick={() => onDeleteCollection(store.id, collection.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    </div>
                ))}
                 {(store.collections || []).length === 0 && !isFormVisible && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Vous n'avez aucune collection. Créez-en une pour organiser vos produits !</p>}
            </div>
        </div>
    );
};

const PhotographyServicePanel: React.FC<{
  onCreateTicket: (subject: string, message: string, relatedOrderId?: string, type?: 'support' | 'service_request', attachmentUrls?: string[]) => void;
  sellerServiceTickets: Ticket[];
}> = ({ onCreateTicket, sellerServiceTickets }) => {
    const [specifications, setSpecifications] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    const [requestSent, setRequestSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (attachments.length + files.length > 5) {
                alert("Vous pouvez joindre jusqu'à 5 fichiers.");
                return;
            }
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAttachments(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!specifications.trim() && attachments.length === 0) {
            alert("Veuillez fournir des instructions ou joindre des images.");
            return;
        }
        setIsSubmitting(true);
        const subject = "Nouvelle demande - Service Photographie";
        const message = specifications || "Veuillez vous référer aux images jointes pour la demande de photographie.";
        
        onCreateTicket(subject, message, undefined, 'service_request', attachments);
        
        setSpecifications('');
        setAttachments([]);
        setIsSubmitting(false);
        setRequestSent(true);
        
        setTimeout(() => setRequestSent(false), 5000);
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <SparklesIcon className="w-8 h-8 text-kmer-yellow" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Service de Photographie Professionnelle</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Nouvelle demande</h3>
                    {requestSent ? (
                        <div className="p-4 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg flex items-center gap-3">
                            <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold">Demande envoyée !</h4>
                                <p className="text-sm">Un ticket a été créé. Notre équipe vous contactera bientôt. Vous pouvez suivre la conversation dans votre historique.</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="specifications" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instructions et Spécifications</label>
                                <textarea
                                    id="specifications"
                                    value={specifications}
                                    onChange={e => setSpecifications(e.target.value)}
                                    rows={5}
                                    className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="Décrivez vos besoins : type de fond, angles de vue, retouches souhaitées, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Joindre des images de référence (max 5)</label>
                                <label htmlFor="photo-upload" className="mt-1 cursor-pointer flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                                    <PaperclipIcon className="w-5 h-5"/>
                                    Choisir des fichiers
                                </label>
                                <input id="photo-upload" type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*" />
                                {attachments.length > 0 && (
                                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                                        {attachments.map((url, i) => (
                                            <div key={i} className="relative group">
                                                <img src={url} alt={`Aperçu ${i}`} className="h-20 w-full object-cover rounded-md"/>
                                                <button type="button" onClick={() => removeAttachment(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-kmer-green text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:bg-green-700 transition-colors disabled:bg-gray-400">
                                <PaperAirplaneIcon className="w-5 h-5"/>
                                {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Historique des demandes</h3>
                    {sellerServiceTickets.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {sellerServiceTickets.map(ticket => (
                                <div key={ticket.id} className="p-3 border rounded-md dark:border-gray-700">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{ticket.subject}</p>
                                            <p className="text-xs text-gray-500">
                                                Créé le: {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ticket.status === 'Résolu' ? 'bg-green-100 text-green-800' : ticket.status === 'En cours' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <details className="mt-2 text-sm">
                                        <summary className="cursor-pointer font-medium text-blue-600 dark:text-blue-400">Voir les détails</summary>
                                        <div className="mt-2 space-y-2 pt-2 border-t dark:border-gray-600">
                                            {ticket.messages.map((msg, i) => (
                                                <div key={i}>
                                                    <p className="font-bold text-xs">{msg.authorName}:</p>
                                                    <p className="whitespace-pre-wrap pl-2">{msg.message}</p>
                                                    {msg.attachmentUrls && msg.attachmentUrls.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-1 pl-2">
                                                            {msg.attachmentUrls.map((url, j) => <a href={url} target="_blank" rel="noopener noreferrer" key={j}><img src={url} alt={`Pièce jointe ${j+1}`} className="h-16 w-16 rounded object-cover border"/></a>)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Aucune demande de service pour le moment.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export const SellerDashboard: React.FC<SellerDashboardProps> = (props) => {
    const { store, products, sellerOrders, promoCodes, onAddProduct, onEditProduct, onDeleteProduct, onUpdateProductStatus, onNavigateToProfile, onNavigateToAnalytics, onSetPromotion, onRemovePromotion, onUploadDocument, onUpdateOrderStatus, onCreatePromoCode, onDeletePromoCode, isChatEnabled, onPayRent, siteSettings, onAddStory, onDeleteStory, flashSales, onProposeForFlashSale, payouts, onSellerDisputeMessage, onBulkUpdateProducts, onReplyToReview, onCreateOrUpdateCollection, onDeleteCollection, initialTab, sellerNotifications, onMarkNotificationAsRead, onNavigateFromNotification, onCreateTicket, allTickets, allShippingPartners, onUpdateShippingSettings } = props;
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'bulk-edit' | 'stories' | 'orders-in-progress' | 'orders-delivered' | 'orders-cancelled' | 'promotions' | 'documents' | 'finances' | 'disputes' | 'reviews' | 'collections' | 'services' | 'livraison'>(initialTab as any || 'overview');
    const { user } = useAuth();
    const { totalUnreadCount, setIsWidgetOpen } = useChatContext();
    const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
    const qrCodeRef = useRef<HTMLCanvasElement>(null);
    const [scanningOrder, setScanningOrder] = useState<Order | null>(null);
    const [scanResult, setScanResult] = useState<{ success: boolean, message: string } | null>(null);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsMenuRef = useRef<HTMLDivElement>(null);
    const unreadNotificationsCount = sellerNotifications.filter(n => !n.isRead).length;
    const [upgradeRequestSent, setUpgradeRequestSent] = useState(false);

    const handleUpgradeRequest = (type: 'premium' | 'super_premium') => {
        const subject = type === 'premium' 
            ? "Demande de passage au statut Vendeur Premium"
            : "Demande de passage au statut Vendeur Super Premium";
            
        const message = `Bonjour, je suis intéressé(e) par les avantages du statut Vendeur ${type.charAt(0).toUpperCase() + type.slice(1)} et souhaiterais mettre à niveau ma boutique. Pourriez-vous me donner plus d'informations sur la procédure ? Merci.`;

        onCreateTicket(subject, message, undefined, 'support');
        setUpgradeRequestSent(true);
    };
    
    useEffect(() => {
        setActiveTab(initialTab as any || 'overview');
    }, [initialTab]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        if (isNotificationsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotificationsOpen]);

    useEffect(() => {
        if (!printingOrder) return;

        const qrCanvas = qrCodeRef.current;
        if (!qrCanvas) {
            console.error("Canvas ref for printing not ready.");
            setPrintingOrder(null);
            return;
        }

        let printJobActive = true;

        const cleanup = () => {
            if (printJobActive) {
                printJobActive = false;
                window.removeEventListener('afterprint', cleanup);
                setPrintingOrder(null);
            }
        };

        window.addEventListener('afterprint', cleanup);

        QRCode.toCanvas(qrCanvas, printingOrder.trackingNumber || 'NO_ID', { width: 80, margin: 1 }, (error) => {
            if (!printJobActive) return;
            if (error) {
                console.error('QR Code Generation Error:', error);
                cleanup();
                return;
            }
            
            setTimeout(() => {
                if (printJobActive) {
                    window.print();
                }
            }, 300);
        });

    }, [printingOrder]);

    const handlePrintOrder = (order: Order) => {
        setPrintingOrder(order);
    };

    const handleScanCheckIn = (order: Order) => {
        setScanResult(null);
        setScanningOrder(order);
    };

    const handleScanSuccess = (decodedText: string) => {
        if(scanningOrder && scanningOrder.trackingNumber === decodedText) {
            onUpdateOrderStatus(scanningOrder.id, 'ready-for-pickup');
            setScanResult({ success: true, message: 'Colis prêt pour l\'enlèvement !' });
        } else {
             setScanResult({ success: false, message: 'Le code-barres ne correspond pas à cette commande.' });
        }
        setTimeout(() => {
            setScanningOrder(null);
            setScanResult(null);
        }, 3000);
    };

    if (!store) {
        return (
            <div className="container mx-auto p-8 text-center">
                <p>Informations sur la boutique non trouvées.</p>
            </div>
        );
    }
    
    const ordersInProgress = sellerOrders.filter(o => ['confirmed', 'ready-for-pickup'].includes(o.status));
    const ordersDelivered = sellerOrders.filter(o => o.status === 'delivered');
    const ordersCancelled = sellerOrders.filter(o => ['cancelled', 'refunded', 'returned'].includes(o.status));
    const disputedOrders = sellerOrders.filter(o => ['refund-requested', 'depot-issue', 'delivery-failed'].includes(o.status));
    const unreadDisputesCount = disputedOrders.filter(o => {
        const lastMessage = o.disputeLog?.[o.disputeLog.length - 1];
        return lastMessage && lastMessage.author !== 'seller'; // Simplistic unread logic
    }).length;
    
    const unreadReviewsCount = products.flatMap(p => p.reviews.filter(r => r.status === 'approved' && !r.sellerReply)).length;

    const deliveredOrdersForAnalytics = sellerOrders.filter(o => o.status === 'delivered');
    
    const analytics = useMemo(() => {
        const totalRevenue = deliveredOrdersForAnalytics.reduce((sum, order) => {
             const sellerItemsTotal = order.items
                .filter(item => item.vendor === store.name)
                .reduce((itemSum, item) => itemSum + getFinalPrice(item, flashSales) * item.quantity, 0);
             return sum + sellerItemsTotal;
        }, 0);
        
        const approvedReviews = products.flatMap(p => p.reviews).filter(r => r.status === 'approved');
        const avgRatingValue = approvedReviews.length > 0 ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length : 0;

        return {
            totalRevenue,
            totalProducts: products.length,
            openOrders: ordersInProgress.length,
            avgRating: approvedReviews.length > 0 ? avgRatingValue.toFixed(1) : "N/A"
        };
    }, [deliveredOrdersForAnalytics, products, ordersInProgress.length, store.name, flashSales]);

    const lowStockProductsCount = useMemo(() => {
        return products.filter(p => p.stock < 5).length;
    }, [products]);

    const sellerServiceTickets = useMemo(() => {
        if (!user) return [];
        return allTickets
            .filter(t => t.userId === user.id && t.type === 'service_request')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [allTickets, user]);
    
    const renderContent = () => {
        switch(activeTab) {
            case 'overview': return <OverviewPanel analytics={analytics} onNavigate={onNavigateToAnalytics} lowStockProductsCount={lowStockProductsCount} store={store} siteSettings={siteSettings} onUpgradeRequest={handleUpgradeRequest} upgradeRequestSent={upgradeRequestSent} />;
            case 'products': return <ProductsPanel products={products} onAddProduct={onAddProduct} onEditProduct={onEditProduct} onDeleteProduct={onDeleteProduct} onUpdateProductStatus={onUpdateProductStatus} onSetPromotion={onSetPromotion} onRemovePromotion={onRemovePromotion} />;
            case 'bulk-edit': return <BulkEditPanel products={products} onSave={onBulkUpdateProducts} />;
            case 'stories': return <StoriesPanel store={store} onAddStory={onAddStory} onDeleteStory={onDeleteStory} />;
            case 'orders-in-progress': return <OrdersPanel title="Commandes en cours" orders={ordersInProgress} onUpdateOrderStatus={onUpdateOrderStatus} onScan={handleScanCheckIn} onPrint={handlePrintOrder} />;
            case 'orders-delivered': return <OrdersPanel title="Commandes livrées" orders={ordersDelivered} onUpdateOrderStatus={onUpdateOrderStatus} onScan={handleScanCheckIn} onPrint={handlePrintOrder} />;
            case 'orders-cancelled': return <OrdersPanel title="Commandes annulées/retournées" orders={ordersCancelled} onUpdateOrderStatus={onUpdateOrderStatus} onScan={handleScanCheckIn} onPrint={handlePrintOrder} />;
            case 'promotions': return <PromotionsPanel promoCodes={promoCodes} sellerId={user.id} onCreatePromoCode={onCreatePromoCode} onDeletePromoCode={onDeletePromoCode} flashSales={flashSales} products={products} onProposeForFlashSale={onProposeForFlashSale} storeName={store.name} sellerOrders={sellerOrders} />;
            case 'documents': return <DocumentsPanel store={store} onUploadDocument={onUploadDocument} />;
            case 'finances': return <FinancePanel deliveredOrders={deliveredOrdersForAnalytics} payouts={payouts} commissionRate={siteSettings.commissionRate} flashSales={flashSales} />;
            case 'disputes': return <DisputesPanel disputedOrders={disputedOrders} onSellerDisputeMessage={onSellerDisputeMessage} />;
            case 'reviews': return <ReviewsPanel products={products} onReplyToReview={onReplyToReview} />;
            case 'collections': return <CollectionsPanel store={store} products={products} onCreateOrUpdateCollection={onCreateOrUpdateCollection} onDeleteCollection={onDeleteCollection} />;
            case 'livraison':
                if (store.premiumStatus === 'premium' || store.premiumStatus === 'super_premium') {
                    return <ShippingSettingsPanel store={store} allShippingPartners={allShippingPartners} onUpdate={onUpdateShippingSettings} />;
                } else {
                    return (
                        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/50 min-h-[50vh] flex items-center justify-center">
                            <div className="max-w-2xl mx-auto">
                                <TruckIcon className="w-16 h-16 mx-auto text-kmer-green mb-4" />
                                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Optimisez votre Logistique</h2>
                                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Définissez vos propres tarifs, choisissez vos transporteurs et offrez la livraison gratuite. Ce service est un avantage exclusif pour nos vendeurs Premium.</p>
                                {upgradeRequestSent ? (
                                    <div className="mt-8 p-4 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg flex items-center gap-3">
                                        <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold">Demande envoyée !</h4>
                                            <p className="text-sm">Un ticket a été créé. Notre équipe vous contactera bientôt. Vous pouvez suivre la conversation via les notifications et le chat de support.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => handleUpgradeRequest('premium')} className="mt-8 bg-kmer-yellow text-gray-900 font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-colors">
                                        Demander le statut Premium
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }
            case 'services':
                if (store.premiumStatus === 'premium' || store.premiumStatus === 'super_premium') {
                    return <PhotographyServicePanel onCreateTicket={onCreateTicket} sellerServiceTickets={sellerServiceTickets} />;
                } else {
                    return (
                        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/50 min-h-[50vh] flex items-center justify-center">
                            <div className="max-w-2xl mx-auto">
                                <StarIcon className="w-16 h-16 mx-auto text-kmer-yellow mb-4" />
                                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Accès Exclusif aux Vendeurs Premium</h2>
                                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Le Service de Photographie Professionnelle est un avantage réservé à nos vendeurs Premium pour garantir des images de la plus haute qualité.</p>
                                <p className="mt-4 text-gray-600 dark:text-gray-400">Passez au statut Premium pour bénéficier de ce service et de bien d'autres avantages exclusifs qui boosteront vos ventes.</p>
                                {upgradeRequestSent ? (
                                    <div className="mt-8 p-4 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg flex items-center gap-3">
                                        <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold">Demande envoyée !</h4>
                                            <p className="text-sm">Un ticket a été créé. Notre équipe vous contactera bientôt. Vous pouvez suivre la conversation via les notifications et le chat de support.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => handleUpgradeRequest('premium')} className="mt-8 bg-kmer-yellow text-gray-900 font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-colors">
                                        Demander le statut Premium
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }
            default: return null;
        }
    };
    
    return (
        <>
            {scanningOrder && <ScannerModal onClose={() => setScanningOrder(null)} onScanSuccess={handleScanSuccess} scanResult={scanResult} />}
            {printingOrder && (
                <div className="printable fixed -left-[9999px] top-0">
                    <div className="w-[105mm] h-[148mm] p-2 border-2 border-black flex flex-col justify-between font-sans text-xs">
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
            <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
                <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                    <div className="container mx-auto px-4 sm:px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <img src={store.logoUrl} alt={store.name} className="w-12 h-12 object-contain rounded-md" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{store.name}</h1>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Tableau de bord Vendeur</p>
                                        {store.premiumStatus === 'premium' && <span className="text-xs font-bold bg-kmer-yellow/20 text-kmer-yellow px-2 py-0.5 rounded-full flex items-center gap-1"><StarIcon className="w-3 h-3"/> Premium</span>}
                                        {store.premiumStatus === 'super_premium' && <span className="text-xs font-bold bg-kmer-red/20 text-kmer-red px-2 py-0.5 rounded-full flex items-center gap-1"><StarPlatinumIcon className="w-3 h-3"/> Super Premium</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                               {isChatEnabled && (
                                    <button onClick={() => setIsWidgetOpen(true)} className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <ChatBubbleBottomCenterTextIcon className="w-6 h-6"/>
                                        {totalUnreadCount > 0 && <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-kmer-red text-white text-xs flex items-center justify-center">{totalUnreadCount}</span>}
                                    </button>
                                )}
                                <div className="relative" ref={notificationsMenuRef}>
                                    <button onClick={() => setIsNotificationsOpen(o => !o)} className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <BellIcon className="w-6 h-6"/>
                                        {unreadNotificationsCount > 0 && <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-kmer-red text-white text-xs flex items-center justify-center">{unreadNotificationsCount}</span>}
                                    </button>
                                    {isNotificationsOpen && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto">
                                           <div className="p-3 border-b dark:border-gray-700">
                                            <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
                                           </div>
                                           {sellerNotifications.length === 0 ? (
                                               <p className="p-4 text-sm text-gray-500">Aucune notification.</p>
                                           ) : (
                                               sellerNotifications.map(notif => (
                                                <button
                                                    key={notif.id}
                                                    onClick={() => {
                                                        onMarkNotificationAsRead(notif.id);
                                                        if (notif.link) onNavigateFromNotification(notif.link);
                                                        setIsNotificationsOpen(false);
                                                    }}
                                                    className={`w-full text-left p-3 border-b dark:border-gray-700/50 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!notif.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                                >
                                                    <p className="text-sm text-gray-700 dark:text-gray-200">{notif.message}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{new Date(notif.timestamp).toLocaleString('fr-FR')}</p>
                                                </button>
                                               ))
                                           )}
                                        </div>
                                    )}
                                </div>
                                <button onClick={onNavigateToProfile} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <Cog8ToothIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        {store.status !== 'active' && (
                            <div className={`mt-4 p-3 rounded-md text-sm font-semibold ${store.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                               {store.status === 'pending' ? "Votre boutique est en attente d'approbation. Certaines fonctionnalités sont limitées." : "Votre boutique est suspendue. Veuillez contacter le support."}
                            </div>
                        )}
                         {store.subscriptionStatus === 'overdue' && (
                            <div className="mt-4 p-3 rounded-md text-sm font-semibold bg-red-100 text-red-800 flex justify-between items-center">
                               <span>Votre loyer est en retard. Votre boutique risque d'être suspendue.</span>
                               <button onClick={() => onPayRent(store.id)} className="bg-red-500 text-white font-bold py-1 px-3 rounded-md hover:bg-red-600">Payer {siteSettings.rentAmount.toLocaleString('fr-CM')} FCFA</button>
                            </div>
                        )}
                    </div>
                </header>
                <div className="container mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-8">
                    <aside className="md:w-1/4 lg:w-1/5 flex-shrink-0">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-2 sticky top-24">
                            <TabButton icon={<ChartPieIcon className="w-5 h-5"/>} label="Aperçu" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                            <TabButton icon={<ShoppingBagIcon className="w-5 h-5"/>} label="Produits" isActive={activeTab === 'products'} onClick={() => setActiveTab('products')} />
                            <TabButton icon={<PencilSquareIcon className="w-5 h-5"/>} label="Modification Rapide" isActive={activeTab === 'bulk-edit'} onClick={() => setActiveTab('bulk-edit')} />
                            <TabButton icon={<SparklesIcon className="w-5 h-5"/>} label="Stories" isActive={activeTab === 'stories'} onClick={() => setActiveTab('stories')} />
                            <TabButton icon={<TruckIcon className="w-5 h-5"/>} label="Commandes" isActive={['orders-in-progress', 'orders-delivered', 'orders-cancelled'].includes(activeTab)} onClick={() => setActiveTab('orders-in-progress')} count={ordersInProgress.length} />
                            <TabButton icon={<TagIcon className="w-5 h-5"/>} label="Promotions" isActive={activeTab === 'promotions'} onClick={() => setActiveTab('promotions')} />
                            <TabButton icon={<BookmarkSquareIcon className="w-5 h-5"/>} label="Collections" isActive={activeTab === 'collections'} onClick={() => setActiveTab('collections')} />
                            <TabButton icon={<StarIcon className="w-5 h-5"/>} label="Avis" isActive={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} count={unreadReviewsCount} />
                            <TabButton icon={<ExclamationTriangleIcon className="w-5 h-5"/>} label="Litiges" isActive={activeTab === 'disputes'} onClick={() => setActiveTab('disputes')} count={unreadDisputesCount} />
                            <TabButton icon={<DocumentTextIcon className="w-5 h-5"/>} label="Documents" isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
                            <TabButton icon={<CurrencyDollarIcon className="w-5 h-5"/>} label="Finances" isActive={activeTab === 'finances'} onClick={() => setActiveTab('finances')} />
                            <TabButton icon={<TruckIcon className="w-5 h-5"/>} label="Livraison" isActive={activeTab === 'livraison'} onClick={() => setActiveTab('livraison')} />
                            <TabButton icon={<SparklesIcon className="w-5 h-5"/>} label="Services" isActive={activeTab === 'services'} onClick={() => setActiveTab('services')} />
                        </div>
                    </aside>
                    <main className="flex-grow">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-full">
                           {['orders-in-progress', 'orders-delivered', 'orders-cancelled'].includes(activeTab) && (
                                <div className="p-4 border-b dark:border-gray-700 flex flex-wrap gap-2">
                                    <button onClick={() => setActiveTab('orders-in-progress')} className={`px-3 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'orders-in-progress' ? 'bg-kmer-green/20 text-kmer-green' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>En cours ({ordersInProgress.length})</button>
                                    <button onClick={() => setActiveTab('orders-delivered')} className={`px-3 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'orders-delivered' ? 'bg-kmer-green/20 text-kmer-green' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Livrées ({ordersDelivered.length})</button>
                                    <button onClick={() => setActiveTab('orders-cancelled')} className={`px-3 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'orders-cancelled' ? 'bg-kmer-green/20 text-kmer-green' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Annulées ({ordersCancelled.length})</button>
                                </div>
                            )}
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};
