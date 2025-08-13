import React, { useState, useMemo } from 'react';
import type { Product, Category, Store, FlashSale, Order, OrderStatus, PromoCode, DocumentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { PencilSquareIcon, TrashIcon, Cog8ToothIcon, TagIcon, ExclamationTriangleIcon, CheckCircleIcon, BoltIcon, DocumentTextIcon, ShoppingBagIcon, TruckIcon, BuildingStorefrontIcon, CurrencyDollarIcon, ChartPieIcon, StarIcon, ChatBubbleBottomCenterTextIcon, PlusIcon, XCircleIcon } from './Icons';

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
  onSetPromotion: (product: Product) => void;
  onRemovePromotion: (productId: string) => void;
  onProposeForFlashSale: (flashSaleId: string, productId: string, flashPrice: number, sellerShopName: string) => void;
  onUploadDocument: (storeId: string, documentName: string, fileUrl: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onCreatePromoCode: (codeData: Omit<PromoCode, 'uses'>) => void;
  onDeletePromoCode: (code: string) => void;
  isChatEnabled: boolean;
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

const OverviewPanel: React.FC<{ analytics: any }> = ({ analytics }) => (
    <div className="p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Aperçu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<CurrencyDollarIcon className="w-7 h-7"/>} label="Revenu Total (Livré)" value={`${analytics.totalRevenue.toLocaleString('fr-CM')} FCFA`} />
            <StatCard icon={<ShoppingBagIcon className="w-7 h-7"/>} label="Produits" value={analytics.totalProducts} />
            <StatCard icon={<TruckIcon className="w-7 h-7"/>} label="Commandes en attente" value={analytics.openOrders} />
            <StatCard icon={<StarIcon className="w-7 h-7"/>} label="Note Moyenne" value={analytics.avgRating} />
        </div>
    </div>
);

const ProductsPanel: React.FC<Pick<SellerDashboardProps, 'products' | 'onAddProduct' | 'onEditProduct' | 'onDeleteProduct' | 'onToggleStatus' | 'onSetPromotion' | 'onRemovePromotion'>> = ({ products, onAddProduct, onEditProduct, onDeleteProduct, onToggleStatus, onSetPromotion, onRemovePromotion }) => {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">Mes Produits</h2>
          <button onClick={onAddProduct} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Ajouter un produit</button>
        </div>
        <div className="space-y-2">
          {products.map((p: Product) => (
            <div key={p.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src={p.imageUrls[0] || PLACEHOLDER_IMAGE_URL} alt={p.name} className="w-12 h-12 object-cover rounded-md" />
                <div>
                  <p className="font-semibold dark:text-gray-200">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.price.toLocaleString('fr-CM')} FCFA - {p.stock} en stock</p>
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
          ))}
        </div>
      </div>
    );
};

const OrdersPanel: React.FC<{orders: Order[], onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void}> = ({ orders, onUpdateOrderStatus }) => {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold dark:text-white mb-4">Mes Commandes</h2>
        <div className="space-y-2">
          {orders.map((o: Order) => (
            <div key={o.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold dark:text-gray-200">{o.id}</p>
                        <p className="text-sm text-gray-500">{new Date(o.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold dark:text-gray-200">{o.total.toLocaleString('fr-CM')} FCFA</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(o.status)}`}>{statusTranslations[o.status]}</span>
                    </div>
                </div>
                {['confirmed', 'ready-for-pickup'].includes(o.status) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                        <span className="text-sm">Marquer comme:</span>
                        <select
                          value={o.status}
                          onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                          className="text-xs border-gray-300 rounded-md shadow-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-kmer-green"
                        >
                            <option value="confirmed" disabled={o.status !== 'confirmed'}>Confirmée</option>
                            <option value="ready-for-pickup">Prêt pour enlèvement</option>
                        </select>
                    </div>
                )}
            </div>
          ))}
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

const PromotionsPanel: React.FC<{
  promoCodes: PromoCode[];
  sellerId: string;
  onCreatePromoCode: (codeData: Omit<PromoCode, 'uses'>) => void;
  onDeletePromoCode: (code: string) => void;
}> = ({ promoCodes, sellerId, onCreatePromoCode, onDeletePromoCode }) => {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="p-6">
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
  onSetPromotion,
  onRemovePromotion,
  onUploadDocument,
  onUpdateOrderStatus,
  onCreatePromoCode,
  onDeletePromoCode,
  isChatEnabled,
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const { user } = useAuth();
    const { totalUnreadCount, setIsWidgetOpen } = useChatContext();

    const analytics = useMemo(() => {
        const totalRevenue = sellerOrders
            .filter(o => o.status === 'delivered')
            .reduce((sum, order) => sum + order.subtotal, 0);

        const allReviews = products.flatMap(p => p.reviews);
        const avgRating = allReviews.length > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            : 0;

        return {
            totalProducts: products.length,
            openOrders: sellerOrders.filter(o => ['confirmed', 'ready-for-pickup'].includes(o.status)).length,
            totalRevenue,
            avgRating: avgRating.toFixed(1),
        };
    }, [products, sellerOrders]);
    
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

    const renderContent = () => {
        switch(activeTab) {
            case 'products':
                return <ProductsPanel products={products} onAddProduct={onAddProduct} onEditProduct={onEditProduct} onDeleteProduct={onDeleteProduct} onToggleStatus={onToggleStatus} onSetPromotion={onSetPromotion} onRemovePromotion={onRemovePromotion} />;
            case 'orders':
                return <OrdersPanel orders={sellerOrders} onUpdateOrderStatus={onUpdateOrderStatus} />;
            case 'promotions':
                 return <PromotionsPanel promoCodes={promoCodes} sellerId={user.id} onCreatePromoCode={onCreatePromoCode} onDeletePromoCode={onDeletePromoCode}/>;
            case 'documents':
                 return <DocumentsPanel store={store} onUploadDocument={onUploadDocument} />;
            case 'overview':
            default:
                return <OverviewPanel analytics={analytics} />;
        }
    };
    
    return (
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
                           <TabButton icon={<TruckIcon className="w-5 h-5"/>} label="Commandes" isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} count={analytics.openOrders} />
                           <TabButton icon={<TagIcon className="w-5 h-5"/>} label="Promotions" isActive={activeTab === 'promotions'} onClick={() => setActiveTab('promotions')} />
                           <TabButton icon={<DocumentTextIcon className="w-5 h-5"/>} label="Documents" isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
                           {isChatEnabled && <TabButton icon={<ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>} label="Messages" isActive={false} onClick={() => setIsWidgetOpen(true)} count={totalUnreadCount} />}
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

export default SellerDashboard;