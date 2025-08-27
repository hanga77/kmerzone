import React, { useState, useMemo, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import type { Product, Category, Store, FlashSale, Order, OrderStatus, PromoCode, DocumentStatus, SiteSettings, Story, FlashSaleProduct } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { PencilSquareIcon, TrashIcon, Cog8ToothIcon, TagIcon, ExclamationTriangleIcon, CheckCircleIcon, BoltIcon, DocumentTextIcon, ShoppingBagIcon, TruckIcon, BuildingStorefrontIcon, CurrencyDollarIcon, ChartPieIcon, StarIcon, ChatBubbleBottomCenterTextIcon, PlusIcon, XCircleIcon, XIcon as XIconSmall, PrinterIcon, SparklesIcon, QrCodeIcon, BarChartIcon } from './Icons';

declare const Html5Qrcode: any;

interface SellerDashboardProps {
  store?: Store;
  products: Product[];
  categories: Category[];
  flashSales: FlashSale[];
  sellerOrders: Order[];
  promoCodes: PromoCode[];
  onBack: () => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleStatus: (productId: string) => void;
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

const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, count?: number }> = ({ icon, label, isActive, onClick, count }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center gap-2 px-3 py-3 text-sm font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
            isActive
                ? 'text-kmer-green border-kmer-green'
                : 'text-gray-500 border-transparent hover:text-kmer-green hover:border-kmer-green/50 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
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

const OverviewPanel: React.FC<{ analytics: any; onNavigate: () => void; lowStockProductsCount: number }> = ({ analytics, onNavigate, lowStockProductsCount }) => (
    <div className="p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold dark:text-white">Aperçu</h2>
            <button onClick={onNavigate} className="text-sm bg-blue-500 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2">
                <BarChartIcon className="w-4 h-4"/> Voir les analyses détaillées
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<CurrencyDollarIcon className="w-7 h-7"/>} label="Revenu Total (Livré)" value={`${analytics.totalRevenue.toLocaleString('fr-CM')} FCFA`} />
            <StatCard icon={<ShoppingBagIcon className="w-7 h-7"/>} label="Produits" value={analytics.totalProducts} />
            <StatCard icon={<TruckIcon className="w-7 h-7"/>} label="Commandes en attente" value={analytics.openOrders} />
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
                <StatCard icon={<StarIcon className="w-7 h-7"/>} label="Note Moyenne" value={analytics.avgRating} />
            )}
        </div>
    </div>
);

const ProductsPanel: React.FC<Pick<SellerDashboardProps, 'products' | 'onAddProduct' | 'onEditProduct' | 'onDeleteProduct' | 'onToggleStatus' | 'onSetPromotion' | 'onRemovePromotion'>> = ({ products, onAddProduct, onEditProduct, onDeleteProduct, onToggleStatus, onSetPromotion, onRemovePromotion }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            alert(`Fichier "${e.target.files[0].name}" sélectionné. L'importation de produits est en cours de développement. Dans une version future, les produits de ce fichier seront ajoutés en tant que brouillons.`);
        }
    };

    const escapeCsvCell = (cell: any): string => {
        if (cell === null || cell === undefined) {
            return '';
        }
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            const escapedStr = str.replace(/"/g, '""');
            return `"${escapedStr}"`;
        }
        return str;
    };

    const handleExportProducts = () => {
        const headers: (keyof Product)[] = [ 'id', 'name', 'price', 'promotionPrice', 'stock', 'categoryId', 'status', 'description', 'imageUrls', 'brand', 'weight', 'dimensions', 'material', 'gender', 'color', 'modelNumber', 'warranty', 'operatingSystem', 'accessories', 'shippingCost', 'promotionStartDate', 'promotionEndDate', 'serialNumber', 'productionDate', 'expirationDate', 'ingredients', 'allergens', 'storageInstructions', 'origin', 'assemblyInstructions', 'productType', 'volume', 'skinType', 'author', 'publisher', 'publicationYear', 'isbn' ];
        const csvRows = [headers.join(',')];
        
        products.forEach(product => {
            const row = headers.map(header => {
                let value = product[header];
                if (header === 'imageUrls' && Array.isArray(value)) {
                    value = value.join(';');
                }
                return escapeCsvCell(value);
            });
            csvRows.push(row.join(','));
        });
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'mes_produits_kmer_zone.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
      <div className="p-6">
        <input type="file" ref={fileInputRef} onChange={handleImportProducts} style={{ display: 'none' }} accept=".csv" />
        <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">Mes Produits</h2>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleImportClick} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600">Importer</button>
            <button onClick={handleExportProducts} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700">Exporter</button>
            <button onClick={onAddProduct} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Ajouter un produit</button>
          </div>
        </div>
        <div className="space-y-2">
          {products.map((p: Product) => {
             const isLowStock = p.stock < 5;
             return (
                <div key={p.id} className={`p-3 rounded-md flex justify-between items-center ${isLowStock ? 'bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-400' : 'bg-gray-50 dark:bg-gray-900/50'}`}>
                <div className="flex items-center gap-3">
                    <img src={p.imageUrls[0] || PLACEHOLDER_IMAGE_URL} alt={p.name} className="w-12 h-12 object-cover rounded-md" />
                    <div>
                    <p className="font-semibold dark:text-gray-200">{p.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {p.price.toLocaleString('fr-CM')} FCFA - {p.stock} en stock
                        {isLowStock && <span className="ml-2 text-xs font-bold text-orange-600 dark:text-orange-400">(Stock Faible)</span>}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{p.status === 'published' ? 'Publié' : 'Brouillon'}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onToggleStatus(p.id)} className="p-2 text-gray-500 hover:text-green-500" title={p.status === 'published' ? 'Mettre en brouillon' : 'Publier'}>
                        <CheckCircleIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => onSetPromotion(p)} className="p-2 text-gray-500 hover:text-kmer-red" title="Mettre en promotion"><TagIcon className="w-5 h-5"/></button>
                    <button onClick={() => onEditProduct(p)} className="p-2 text-gray-500 hover:text-blue-500" title="Modifier"><PencilSquareIcon className="w-5 h-5"/></button>
                    <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-gray-500 hover:text-red-600" title="Supprimer"><TrashIcon className="w-5 h-5"/></button>
                </div>
                </div>
            );
          })}
        </div>
      </div>
    );
};

const OrdersPanel: React.FC<{ title: string, orders: Order[], onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void, onScan: (order: Order) => void, onPrint: (order: Order) => void }> = ({ title, orders, onUpdateOrderStatus, onScan, onPrint }) => {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold dark:text-white mb-4">{title}</h2>
        <div className="space-y-4">
          {orders.map((o: Order) => <OrderCard key={o.id} order={o} onUpdateOrderStatus={onUpdateOrderStatus} onScan={onScan} onPrint={onPrint} />)}
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
}> = ({ promoCodes, sellerId, onCreatePromoCode, onDeletePromoCode, flashSales, products, onProposeForFlashSale, storeName }) => {
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
          {promoCodes.map(pc => (
              <div key={pc.code} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md flex justify-between items-center">
                  <div>
                      <p className="font-mono text-lg font-bold text-kmer-green">{pc.code}</p>
                      <p className="text-sm font-semibold">{pc.discountType === 'percentage' ? `${pc.discountValue}% de remise` : `${pc.discountValue.toLocaleString('fr-CM')} FCFA de remise`}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Utilisé {pc.uses} fois</p>
                  </div>
                  <button onClick={() => onDeletePromoCode(pc.code)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon className="w-5 h-5"/></button>
              </div>
          ))}
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

const SellerDashboard: React.FC<SellerDashboardProps> = ({
  store,
  products,
  sellerOrders,
  promoCodes,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleStatus,
  onNavigateToProfile,
  onNavigateToAnalytics,
  onSetPromotion,
  onRemovePromotion,
  onUploadDocument,
  onUpdateOrderStatus,
  onCreatePromoCode,
  onDeletePromoCode,
  isChatEnabled,
  onPayRent,
  siteSettings,
  onAddStory,
  onDeleteStory,
  flashSales,
  onProposeForFlashSale,
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'stories' | 'orders-in-progress' | 'orders-delivered' | 'orders-cancelled' | 'promotions' | 'documents'>('overview');
    const { user } = useAuth();
    const { totalUnreadCount, setIsWidgetOpen } = useChatContext();
    const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
    const qrCodeRef = useRef<HTMLCanvasElement>(null);
    const [scanningOrder, setScanningOrder] = useState<Order | null>(null);
    const [scanResult, setScanResult] = useState<{ success: boolean, message: string } | null>(null);

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

        return cleanup;
    }, [printingOrder]);

    const handleScanSuccess = (decodedText: string) => {
      if (!scanningOrder || scanResult) return;
  
      if (decodedText !== scanningOrder.trackingNumber) {
        setScanResult({ success: false, message: "Le code scanné ne correspond pas à cette commande." });
        return;
      }
      if (scanningOrder.status !== 'confirmed') {
        setScanResult({ success: false, message: `Cette commande n'est pas en attente de préparation (Statut: ${statusTranslations[scanningOrder.status]})` });
        return;
      }
  
      onUpdateOrderStatus(scanningOrder.id, 'ready-for-pickup');
      setScanResult({ success: true, message: `Commande ${scanningOrder.id} marquée comme "Prête pour enlèvement".` });
    };

    const closeScanner = () => {
      setScanningOrder(null);
      setScanResult(null);
    };

    const inProgressOrders = useMemo(() => sellerOrders.filter(o => !['delivered', 'cancelled', 'refunded', 'refund-requested', 'returned', 'depot-issue'].includes(o.status)), [sellerOrders]);
    const deliveredOrders = useMemo(() => sellerOrders.filter(o => o.status === 'delivered'), [sellerOrders]);
    const cancelledRefundedOrders = useMemo(() => sellerOrders.filter(o => ['cancelled', 'refunded', 'refund-requested', 'returned', 'depot-issue'].includes(o.status)), [sellerOrders]);
    const lowStockProductsCount = useMemo(() => products.filter(p => p.stock < 5).length, [products]);

    const analytics = useMemo(() => {
        const totalRevenue = deliveredOrders.reduce((sum, order) => {
            const sellerItemsTotal = order.items.reduce((itemSum, item) => itemSum + (item.promotionPrice ?? item.price) * item.quantity, 0);
            return sum + sellerItemsTotal;
        }, 0);

        const allReviews = products.flatMap(p => p.reviews);
        const avgRating = allReviews.length > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            : 0;

        return {
            totalProducts: products.length,
            openOrders: inProgressOrders.length,
            totalRevenue,
            avgRating: avgRating.toFixed(1),
        };
    }, [products, deliveredOrders, inProgressOrders]);
    
    if (!user || user.role !== 'seller' || !store) {
        return (
            <div className="container mx-auto px-6 py-12 text-center">
                <p className="text-xl dark:text-white">Chargement du tableau de bord...</p>
            </div>
        );
    }

    const storeStatusInfo = {
        active: { text: "Actif", color: "text-green-500", icon: <CheckCircleIcon className="w-5 h-5"/> },
        pending: { text: "En attente de validation", color: "text-yellow-500", icon: <ExclamationTriangleIcon className="w-5 h-5"/> },
        suspended: { text: "Suspendu", color: "text-red-500", icon: <XCircleIcon className="w-5 h-5"/> },
    };
    
    const isRentDueSoon = store.subscriptionDueDate && (new Date(store.subscriptionDueDate).getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;

    const renderContent = () => {
        switch(activeTab) {
            case 'products':
                return <ProductsPanel products={products} onAddProduct={onAddProduct} onEditProduct={onEditProduct} onDeleteProduct={onDeleteProduct} onToggleStatus={onToggleStatus} onSetPromotion={onSetPromotion} onRemovePromotion={onRemovePromotion} />;
            case 'stories':
                return <StoriesPanel store={store} onAddStory={onAddStory} onDeleteStory={onDeleteStory} />;
            case 'orders-in-progress':
                return <OrdersPanel title="Commandes en cours" orders={inProgressOrders} onUpdateOrderStatus={onUpdateOrderStatus} onScan={setScanningOrder} onPrint={setPrintingOrder} />;
            case 'orders-delivered':
                return <OrdersPanel title="Commandes Livrées" orders={deliveredOrders} onUpdateOrderStatus={onUpdateOrderStatus} onScan={setScanningOrder} onPrint={setPrintingOrder} />;
            case 'orders-cancelled':
                return <OrdersPanel title="Commandes Annulées / Remboursées" orders={cancelledRefundedOrders} onUpdateOrderStatus={onUpdateOrderStatus} onScan={setScanningOrder} onPrint={setPrintingOrder} />;
            case 'promotions':
                 return <PromotionsPanel promoCodes={promoCodes} sellerId={user.id} onCreatePromoCode={onCreatePromoCode} onDeletePromoCode={onDeletePromoCode} flashSales={flashSales} products={products} onProposeForFlashSale={onProposeForFlashSale} storeName={store.name} />;
            case 'documents':
                 return <DocumentsPanel store={store} onUploadDocument={onUploadDocument} />;
            case 'overview':
            default:
                return <OverviewPanel analytics={analytics} onNavigate={onNavigateToAnalytics} lowStockProductsCount={lowStockProductsCount} />;
        }
    };
    
    return (
      <>
        {scanningOrder && (
            <ScannerModal 
                onClose={closeScanner}
                onScanSuccess={handleScanSuccess}
                scanResult={scanResult}
            />
        )}
        {printingOrder && (
            <div className="printable fixed -left-[9999px] top-0">
                <div className="w-[105mm] h-[148mm] p-2 border-2 border-black flex flex-col justify-between font-sans text-xs bg-white text-black">
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
                        <div className="flex items-center gap-4">
                            <img src={store.logoUrl} alt={store.name} className="h-12 w-12 object-contain rounded-md bg-gray-200 dark:bg-gray-700 p-1"/>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{store.name}</h1>
                                <div className={`flex items-center gap-1 text-sm font-semibold ${storeStatusInfo[store.status].color}`}>
                                    {storeStatusInfo[store.status].icon} {storeStatusInfo[store.status].text}
                                    {store.premiumStatus === 'premium' && (
                                      <span className="flex items-center gap-1 text-kmer-yellow" title="Boutique Premium">
                                        <StarIcon className="w-4 h-4" /> Premium
                                      </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <button onClick={onNavigateToProfile} className="text-gray-500 dark:text-gray-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Cog8ToothIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>
                     <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-2 -mb-5">
                        <div className="flex space-x-2 overflow-x-auto">
                           <TabButton icon={<ChartPieIcon className="w-5 h-5"/>} label="Aperçu" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                           <TabButton icon={<ShoppingBagIcon className="w-5 h-5"/>} label="Produits" isActive={activeTab === 'products'} onClick={() => setActiveTab('products')} />
                           <TabButton icon={<SparklesIcon className="w-5 h-5"/>} label="Stories" isActive={activeTab === 'stories'} onClick={() => setActiveTab('stories')} />
                           <TabButton icon={<TruckIcon className="w-5 h-5"/>} label="En cours" isActive={activeTab === 'orders-in-progress'} onClick={() => setActiveTab('orders-in-progress')} count={inProgressOrders.length} />
                           <TabButton icon={<CheckCircleIcon className="w-5 h-5"/>} label="Livrées" isActive={activeTab === 'orders-delivered'} onClick={() => setActiveTab('orders-delivered')} />
                           <TabButton icon={<XIconSmall className="w-5 h-5"/>} label="Annulées / Remb." isActive={activeTab === 'orders-cancelled'} onClick={() => setActiveTab('orders-cancelled')} count={cancelledRefundedOrders.length} />
                           <TabButton icon={<TagIcon className="w-5 h-5"/>} label="Promotions" isActive={activeTab === 'promotions'} onClick={() => setActiveTab('promotions')} />
                           <TabButton icon={<DocumentTextIcon className="w-5 h-5"/>} label="Documents" isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
                           {isChatEnabled && <TabButton icon={<ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>} label="Messages" isActive={false} onClick={() => setIsWidgetOpen(true)} count={totalUnreadCount} />}
                        </div>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 sm:px-6 py-6">
                 {store && siteSettings.isRentEnabled && store.subscriptionStatus !== 'inactive' && (
                    <div className={`p-4 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 ${
                        store.subscriptionStatus === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' 
                        : isRentDueSoon ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                    }`}>
                        <div className="flex items-center gap-3">
                           <ExclamationTriangleIcon className="w-6 h-6"/>
                           <div>
                                <h3 className="font-bold">Statut de votre abonnement</h3>
                                {store.subscriptionStatus === 'overdue' ? (
                                    <p className="text-sm">Votre loyer est en retard. Veuillez payer pour éviter la suspension de votre boutique.</p>
                                ) : (
                                    <p className="text-sm">Votre prochain paiement de loyer est dû le {new Date(store.subscriptionDueDate!).toLocaleDateString('fr-FR')}.</p>
                                )}
                           </div>
                        </div>
                        <button
                            onClick={() => onPayRent(store.id)}
                            className="bg-white text-gray-900 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-gray-200 transition-colors flex-shrink-0"
                        >
                            Payer le loyer ({siteSettings.rentAmount.toLocaleString('fr-CM')} FCFA)
                        </button>
                    </div>
                )}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    {renderContent()}
                </div>
            </main>
      </div>
    </>
    );
};

export default SellerDashboard;
