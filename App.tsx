import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProductDetail from './components/ProductDetail';
import CartView from './components/Cart';
import Checkout from './components/Checkout';
import OrderSuccess from './components/OrderSuccess';
import LoginModal from './components/LoginModal';
import StoresPage from './components/StoresPage';
import BecomeSeller from './components/BecomeSeller';
import CategoryPage from './components/CategoryPage';
import SellerDashboard from './components/SellerDashboard';
import VendorPage from './components/VendorPage';
import ProductForm from './components/ProductForm';
import SellerProfile from './components/SellerProfile';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import OrderHistoryPage from './components/OrderHistoryPage';
import OrderDetailPage from './components/OrderDetailPage';
import PromotionsPage from './components/PromotionsPage';
import FlashSalesPage from './components/FlashSalesPage';
import SearchResultsPage from './components/SearchResultsPage';
import WishlistPage from './components/WishlistPage';
import DeliveryAgentDashboard from './components/DeliveryAgentDashboard';
import DepotAgentDashboard from './components/DepotAgentDashboard';
import ComparisonPage from './components/ComparisonPage';
import ComparisonBar from './components/ComparisonBar';
import BecomePremiumPage from './components/BecomePremiumPage';
import InfoPage from './components/InfoPage';
import MaintenancePage from './components/MaintenancePage';
import NotFoundPage from './components/NotFoundPage';
import ForbiddenPage from './components/ForbiddenPage';
import ServerErrorPage from './components/ServerErrorPage';
import { useAuth } from './contexts/AuthContext';
import { useComparison } from './contexts/ComparisonContext';
import type { Product, Category, Store, Review, Order, Address, OrderStatus, User, SiteActivityLog, FlashSale, DocumentStatus, PickupPoint, NewOrderData, TrackingEvent, PromoCode, Warning, SiteSettings, CartItem, UserRole, Payout, Advertisement, Discrepancy, Story, UserAvailabilityStatus } from './types';
import AddToCartModal from './components/AddToCartModal';
import { useUI } from './contexts/UIContext';
import StoryViewer from './components/StoryViewer';
import PromotionModal from './components/PromotionModal';
import { useCart } from './contexts/CartContext';
import ChatWidget from './components/ChatWidget';
import { ArrowLeftIcon, BarChartIcon, ShieldCheckIcon, CurrencyDollarIcon, ShoppingBagIcon, UsersIcon, StarIcon } from './components/Icons';
import { usePersistentState } from './hooks/usePersistentState';

type Page = 'home' | 'product' | 'cart' | 'checkout' | 'order-success' | 'stores' | 'become-seller' | 'category' | 'seller-dashboard' | 'vendor-page' | 'product-form' | 'seller-profile' | 'superadmin-dashboard' | 'order-history' | 'order-detail' | 'promotions' | 'flash-sales' | 'search-results' | 'wishlist' | 'delivery-agent-dashboard' | 'depot-agent-dashboard' | 'comparison' | 'become-premium' | 'analytics-dashboard' | 'review-moderation' | 'info' | 'not-found' | 'forbidden' | 'server-error';

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

const AnalyticsSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {children}
    </div>
);

const AnalyticsDashboard: React.FC<{ onBack: () => void; allOrders: Order[]; allProducts: Product[]; allStores: Store[]; allUsers: User[]; allCategories: Category[] }> = ({ onBack, allOrders, allProducts, allStores, allUsers, allCategories }) => {
    const analytics = useMemo(() => {
        const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
        const totalCustomers = allUsers.filter(u => u.role === 'customer').length;
        const averageOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

        const getFinalPrice = (item: CartItem) => {
            return item.promotionPrice ?? item.price;
        };

        const topProducts = deliveredOrders
            .flatMap(o => o.items)
            .reduce((acc, item) => {
                acc[item.id] = (acc[item.id] || 0) + getFinalPrice(item) * item.quantity;
                return acc;
            }, {} as Record<string, number>);
        
        const sortedTopProducts = Object.entries(topProducts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id, revenue]) => ({ product: allProducts.find(p => p.id === id), revenue }));

        const salesByCategory = deliveredOrders
            .flatMap(o => o.items)
            .reduce((acc, item) => {
                const category = allCategories.find(c => c.id === item.categoryId);
                const categoryName = category?.name || 'Inconnue';
                acc[categoryName] = (acc[categoryName] || 0) + getFinalPrice(item) * item.quantity;
                return acc;
            }, {} as Record<string, number>);
        
        const sortedSalesByCategory = Object.entries(salesByCategory).sort(([, a], [, b]) => b - a);
        
        const salesByStore = deliveredOrders
            .flatMap(o => o.items.map(item => ({ vendor: item.vendor, amount: getFinalPrice(item) * item.quantity })))
            .reduce((acc, { vendor, amount }) => {
                acc[vendor] = (acc[vendor] || 0) + amount;
                return acc;
            }, {} as Record<string, number>);

        const sortedTopStores = Object.entries(salesByStore).sort(([, a], [, b]) => b - a).slice(0, 5);
        
        return {
            totalRevenue,
            totalOrders: deliveredOrders.length,
            totalCustomers,
            averageOrderValue,
            topProducts: sortedTopProducts,
            salesByCategory: sortedSalesByCategory,
            topStores: sortedTopStores
        };
    }, [allOrders, allProducts, allUsers, allCategories]);

    return (
        <div className="container mx-auto p-4 sm:p-8 animate-in bg-gray-50 dark:bg-gray-900">
            <button onClick={onBack} className="text-kmer-green font-semibold mb-6 inline-flex items-center gap-2">
                <ArrowLeftIcon className="w-5 h-5"/>
                Retour
            </button>
            <div className="flex items-center gap-3 mb-8">
                <BarChartIcon className="w-8 h-8"/>
                <h1 className="text-3xl font-bold">Tableau de Bord Analytique (BI)</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={<CurrencyDollarIcon className="w-7 h-7"/>} label="Revenu Total" value={`${analytics.totalRevenue.toLocaleString('fr-CM')} FCFA`} color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300" />
                <StatCard icon={<ShoppingBagIcon className="w-7 h-7"/>} label="Commandes" value={analytics.totalOrders} color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" />
                <StatCard icon={<UsersIcon className="w-7 h-7"/>} label="Clients" value={analytics.totalCustomers} color="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300" />
                <StatCard icon={<StarIcon className="w-7 h-7"/>} label="Panier Moyen" value={`${analytics.averageOrderValue.toLocaleString('fr-CM', { maximumFractionDigits: 0 })} FCFA`} color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AnalyticsSection title="Top 5 Produits (par revenu)">
                    <ul className="space-y-3">
                        {analytics.topProducts.map(({ product, revenue }) => product ? (
                            <li key={product.id} className="flex justify-between items-center text-sm">
                                <span className="font-medium dark:text-gray-200">{product.name}</span>
                                <span className="font-bold text-kmer-green">{revenue.toLocaleString('fr-CM')} FCFA</span>
                            </li>
                        ) : null)}
                    </ul>
                </AnalyticsSection>
                <AnalyticsSection title="Top 5 Boutiques (par revenu)">
                     <ul className="space-y-3">
                        {analytics.topStores.map(([vendorName, revenue]) => (
                            <li key={vendorName} className="flex justify-between items-center text-sm">
                                <span className="font-medium dark:text-gray-200">{vendorName}</span>
                                <span className="font-bold text-kmer-green">{revenue.toLocaleString('fr-CM')} FCFA</span>
                            </li>
                        ))}
                    </ul>
                </AnalyticsSection>
                 <AnalyticsSection title="Ventes par Catégorie">
                     <ul className="space-y-3">
                        {analytics.salesByCategory.map(([category, revenue]) => (
                            <li key={category} className="flex justify-between items-center text-sm">
                                <span className="font-medium dark:text-gray-200">{category}</span>
                                <span className="font-bold text-kmer-green">{revenue.toLocaleString('fr-CM')} FCFA</span>
                            </li>
                        ))}
                    </ul>
                </AnalyticsSection>
            </div>
        </div>
    );
};

const ReviewModeration: React.FC<{ onBack: () => void; allProducts: Product[]; onReviewModeration: (productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected') => void; }> = ({ onBack, allProducts, onReviewModeration }) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

    const allReviews = useMemo(() => allProducts.flatMap(p => 
        p.reviews.map(r => ({ ...r, productName: p.name, productId: p.id }))
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [allProducts]);
    
    const filteredReviews = allReviews.filter(r => r.status === activeTab);

    return (
      <div className="container mx-auto p-4 sm:p-8 animate-in bg-gray-50 dark:bg-gray-900">
        <button onClick={onBack} className="text-kmer-green font-semibold mb-6 inline-flex items-center gap-2">
            <ArrowLeftIcon className="w-5 h-5"/>
            Retour
        </button>
        <div className="flex items-center gap-3 mb-6">
             <ShieldCheckIcon className="w-8 h-8"/>
             <h1 className="text-3xl font-bold">Modération des Avis Clients</h1>
        </div>
        
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('pending')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending' ? 'border-kmer-green text-kmer-green' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    En attente ({allReviews.filter(r=>r.status === 'pending').length})
                </button>
                <button onClick={() => setActiveTab('approved')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'approved' ? 'border-kmer-green text-kmer-green' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    Approuvés
                </button>
                 <button onClick={() => setActiveTab('rejected')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'rejected' ? 'border-kmer-green text-kmer-green' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    Rejetés
                </button>
            </nav>
        </div>

        <div className="space-y-4">
            {filteredReviews.length > 0 ? filteredReviews.map((review, index) => (
                 <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-start">
                        <div>
                           <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{review.productName}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400">Par {review.author} le {new Date(review.date).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-kmer-yellow' : 'text-gray-300'}`}/>)}
                        </div>
                    </div>
                    <p className="mt-2 text-gray-600 dark:text-gray-300 italic">"{review.comment}"</p>
                    {activeTab === 'pending' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t dark:border-gray-700 justify-end">
                            <button onClick={() => onReviewModeration(review.productId, review, 'rejected')} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-md font-semibold hover:bg-red-600">Rejeter</button>
                            <button onClick={() => onReviewModeration(review.productId, review, 'approved')} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-md font-semibold hover:bg-green-600">Approuver</button>
                        </div>
                    )}
                 </div>
             )) : (
                 <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>Aucun avis dans cette catégorie.</p>
                </div>
             )}
        </div>
      </div>
    );
};

const initialCategories: Category[] = [
  // Main Categories
  { id: 'cat-main-1', name: 'Alimentation & Boissons', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop' },
  { id: 'cat-main-2', name: 'Vêtements et chaussures', imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop' },
  { id: 'cat-main-3', name: 'Beauté & Soins', imageUrl: 'https://images.unsplash.com/photo-1596422846543-75c6fc101b89?q=80&w=2070&auto=format&fit=crop' },
  { id: 'cat-main-4', name: 'Électronique & Électroménager', imageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=1925&auto=format&fit=crop' },
  { id: 'cat-main-5', name: 'Maison, Mobilier & Jardin', imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1925&auto=format&fit=crop' },
  { id: 'cat-main-6', name: 'Accessoires & Bijoux', imageUrl: 'https://images.unsplash.com/photo-1611652022417-a551155e9984?q=80&w=1974&auto=format&fit=crop' },
  { id: 'cat-main-7', name: 'Produits pour Enfants', imageUrl: 'https://images.unsplash.com/photo-1518498391512-42f5b89a81c1?q=80&w=2070&auto=format&fit=crop' },
  
  // Sub-categories
  { id: 'cat-sub-1', parentId: 'cat-main-1', name: 'Plats préparés', imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop' },
  { id: 'cat-sub-2', parentId: 'cat-main-1', name: 'Épicerie', imageUrl: 'https://images.unsplash.com/photo-1578680384594-3a5a87351543?q=80&w=1974&auto=format&fit=crop' },
  { id: 'cat-sub-3', parentId: 'cat-main-1', name: 'Boissons', imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f81?q=80&w=2070&auto=format&fit=crop' },
  { id: 'cat-sub-4', parentId: 'cat-main-2', name: 'Vêtements', imageUrl: 'https://images.unsplash.com/photo-1612053648936-285a2b342c8d?q=80&w=1974&auto=format&fit=crop' },
  { id: 'cat-sub-5', parentId: 'cat-main-2', name: 'Chaussures', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop' },
  { id: 'cat-sub-6', parentId: 'cat-main-3', name: 'Cosmétiques', imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90137ba0a43?q=80&w=1974&auto=format&fit=crop' },
  { id: 'cat-sub-10', parentId: 'cat-main-3', name: 'Parfums', imageUrl: 'https://images.unsplash.com/photo-1585399009939-f4639a4f78d1?q=80&w=2070&auto=format&fit=crop' },
  { id: 'cat-sub-7', parentId: 'cat-main-4', name: 'Smartphones & Accessoires', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1780&auto=format&fit=crop' },
  { id: 'cat-sub-8', parentId: 'cat-main-4', name: 'Électroménager', imageUrl: 'https://images.unsplash.com/photo-1626806819282-2c1dc01654e8?q=80&w=2070&auto=format&fit=crop' },
  { id: 'cat-sub-11', parentId: 'cat-main-5', name: 'Mobilier', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop' },
  { id: 'cat-sub-12', parentId: 'cat-main-5', name: 'Décoration', imageUrl: 'https://images.unsplash.com/photo-1534349762230-e08968f43152?q=80&w=1974&auto=format&fit=crop' },
  { id: 'cat-sub-13', parentId: 'cat-main-5', name: 'Luminaire', imageUrl: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=1974&auto=format&fit=crop' },
  { id: 'cat-sub-9', parentId: 'cat-main-6', name: 'Sacs & Maroquinerie', imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1935&auto=format&fit=crop' },
  { id: 'cat-sub-14', parentId: 'cat-main-6', name: 'Bijoux', imageUrl: 'https://images.unsplash.com/photo-1611591437281-462bf4d3ab45?q=80&w=1974&auto=format&fit=crop' },
  { id: 'cat-sub-15', parentId: 'cat-main-6', name: 'Montres', imageUrl: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?q=80&w=1974&auto=format&fit=crop' },
  { id: 'cat-sub-16', parentId: 'cat-main-7', name: 'Jouets', imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=2070&auto=format&fit=crop' },
  { id: 'cat-sub-17', parentId: 'cat-main-7', name: 'Fournitures Scolaires', imageUrl: 'https://images.unsplash.com/photo-1456735185569-8a8b122b1236?q=80&w=2068&auto=format&fit=crop' },
];

const initialProducts: Product[] = [
    { id: '1', name: 'Ndolé Royal', price: 3500, promotionPrice: 3000, imageUrls: ['https://images.unsplash.com/photo-1604329352680-e4a2896d8c22?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Le plat national du Cameroun, un délicieux mélange de légumes, d'arachides et de viande ou de poisson.", reviews: [{author: "Jean P.", rating: 5, comment: "Incroyable !", date: "2023-10-10", status: 'approved'}], stock: 15, categoryId: 'cat-sub-1', status: 'published' },
    { id: '2', name: 'Robe en Tissu Pagne', price: 15000, imageUrls: ['https://images.unsplash.com/photo-1617051395299-52d33b7336b1?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Une robe élégante confectionnée à la main avec du tissu pagne de haute qualité.", reviews: [{author: "Aïcha B.", rating: 4, comment: "Très belles couleurs.", date: "2023-10-11", status: 'approved'}], stock: 8, categoryId: 'cat-sub-4', status: 'published' },
    { id: '3', name: 'Savon Artisanal à l\'huile d\'olive', price: 1500, imageUrls: ['https://images.unsplash.com/photo-1600966492337-1d83c4bee955?q=80&w=2070&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Un savon artisanal fabriqué localement. Doux pour la peau et respectueux de l'environnement.", reviews: [], stock: 50, categoryId: 'cat-sub-6', status: 'published' },
    { id: '4', name: 'Smartphone Pro Max', price: 75000, promotionPrice: 69900, imageUrls: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1965&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un smartphone performant avec un excellent rapport qualité-prix. Grand écran et bonne autonomie.", reviews: [{author: "Eric K.", rating: 5, comment: "Super téléphone pour le prix.", date: "2023-10-12", status: 'approved'}], stock: 4, categoryId: 'cat-sub-7', status: 'published', promotionStartDate: '2024-07-01', promotionEndDate: '2024-07-31' },
    { id: '5', name: 'Miel d\'Oku', price: 5000, imageUrls: ['https://images.unsplash.com/photo-1558642754-b27b3b95a8a9?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Un miel blanc rare et primé, récolté sur les flancs du mont Oku.", reviews: [{author: "Fatima G.", rating: 5, comment: "Le meilleur miel que j'ai jamais goûté.", date: "2023-10-13", status: 'approved'}], stock: 25, categoryId: 'cat-sub-2', status: 'published' },
    { id: '6', name: 'Sandales en cuir', price: 8000, imageUrls: ['https://images.unsplash.com/photo-1620652755231-c2f8b16a2b8e?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Sandales en cuir véritable, faites à la main. Confortables et durables.", reviews: [], stock: 10, categoryId: 'cat-sub-5', status: 'draft' },
    { id: '7', name: 'Poulet DG', price: 6500, imageUrls: ['https://images.unsplash.com/photo-1543339308-43e59d6b70a6?q=80&w=2070&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Un plat de fête succulent avec du poulet frit, des plantains et une sauce riche en légumes.", reviews: [], stock: 12, categoryId: 'cat-sub-1', status: 'published' },
    { id: '8', name: 'Jus de Bissap Naturel', price: 1000, imageUrls: ['https://images.unsplash.com/photo-1623341214825-9f4f96d62c54?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Boisson rafraîchissante et naturelle à base de fleurs d'hibiscus.", reviews: [], stock: 30, categoryId: 'cat-sub-3', status: 'published' },
    { id: '9', name: 'Beignets Haricots Bouillie', price: 1500, imageUrls: ['https://img.cuisineaz.com/660x660/2022/01/24/i181710-beignets-souffles-camerounais.jpeg'], vendor: 'Mama Africa', description: "Le petit-déjeuner camerounais par excellence. Des beignets soufflés accompagnés d'une purée de haricots.", reviews: [], stock: 20, categoryId: 'cat-sub-1', status: 'published' },
    { id: '10', name: 'Chemise en Toghu', price: 25000, imageUrls: ['https://i.pinimg.com/564x/a0/0c/37/a00c3755255673a5a415958253a5f82c.jpg'], vendor: 'Kmer Fashion', description: "Chemise de cérémonie pour homme, en velours noir brodé avec les motifs colorés traditionnels du Toghu.", reviews: [], stock: 5, categoryId: 'cat-sub-4', status: 'published' },
    { id: '11', name: 'Poivre de Penja', price: 4500, imageUrls: ['https://images.unsplash.com/photo-1508616258423-f3e4e73b29b4?q=80&w=1935&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Considéré comme l'un des meilleurs poivres au monde, cultivé sur les terres volcaniques de Penja.", reviews: [], stock: 40, categoryId: 'cat-sub-2', status: 'published' },
    { id: '12', name: 'Sac à main en pagne', price: 12000, imageUrls: ['https://images.unsplash.com/photo-1566150905458-1bf1f2961239?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Accessoirisez votre tenue avec ce magnifique sac à main fait main, alliant cuir et tissu pagne.", reviews: [], stock: 15, categoryId: 'cat-sub-9', status: 'published' },
    { id: '13', name: 'Téléviseur LED 32"', price: 85000, imageUrls: ['https://images.unsplash.com/photo-1593359677879-a4bb92f82acb?q=80&w=2070&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un téléviseur LED de 32 pouces avec une image de haute qualité.", reviews: [], stock: 9, categoryId: 'cat-sub-7', status: 'published' },
    { id: '14', name: 'Fer à repasser', price: 7500, imageUrls: ['https://images.unsplash.com/photo-1622629734636-95a239552382?q=80&w=1932&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Simple, efficace et durable. Ce fer à repasser est parfait pour un usage quotidien.", reviews: [], stock: 25, categoryId: 'cat-sub-8', status: 'published' },
    { id: '15', name: 'Blender / Mixeur', price: 18000, imageUrls: ['https://images.unsplash.com/photo-1582142391035-61f20a003881?q=80&w=1974&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un mixeur puissant pour préparer vos jus, soupes et sauces. Bol en verre robuste de 1.5L.", reviews: [], stock: 18, categoryId: 'cat-sub-8', status: 'published' },
    { id: '16', name: 'Savon noir gommant', price: 2500, imageUrls: ['https://images.unsplash.com/photo-1623461624469-8a964343169f?q=80&w=1974&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Savon noir africain pour un gommage naturel et une peau douce et purifiée.", reviews: [], stock: 40, categoryId: 'cat-sub-6', status: 'published' },
    { id: '17', name: 'Huile de coco vierge', price: 4000, imageUrls: ['https://images.unsplash.com/photo-1590945259635-e1a532ac9695?q=80&w=1974&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Huile de coco 100% pure et pressée à froid. Idéale pour la peau, les cheveux et la cuisson.", reviews: [], stock: 30, categoryId: 'cat-sub-6', status: 'published' },
    { id: '18', name: 'Beurre de karité', price: 3000, imageUrls: ['https://images.unsplash.com/photo-1554153041-33924bb6aa67?q=80&w=2070&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Beurre de karité brut et non raffiné, parfait pour hydrater en profondeur la peau et les cheveux secs.", reviews: [], stock: 60, categoryId: 'cat-sub-6', status: 'published' },
    { id: '19', name: 'Baskets de Ville', price: 22000, imageUrls: ['https://images.unsplash.com/photo-1515955656352-a1fa3ffcdda9?q=80&w=2070&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Baskets confortables et stylées pour un usage quotidien.", reviews: [], stock: 20, categoryId: 'cat-sub-5', status: 'published' },
    { id: '20', name: 'Eau de Parfum "Sawa"', price: 28000, imageUrls: ['https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1904&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Un parfum boisé et épicé pour homme, inspiré par la côte camerounaise.", reviews: [], stock: 15, categoryId: 'cat-sub-10', status: 'published' },
    { id: '21', name: 'Fauteuil en Rotin', price: 45000, imageUrls: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1965&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Fauteuil artisanal en rotin, parfait pour votre salon ou votre terrasse.", reviews: [], stock: 5, categoryId: 'cat-sub-11', status: 'published' },
    { id: '22', name: 'Masque décoratif Fang', price: 18000, imageUrls: ['https://images.unsplash.com/photo-1513480749022-2f7a0b1e4a1a?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Authentique masque décoratif de l'ethnie Fang, sculpté à la main.", reviews: [], stock: 10, categoryId: 'cat-sub-12', status: 'published' },
    { id: '23', name: 'Lampe de chevet "Wouri"', price: 13500, imageUrls: ['https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=1974&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Lampe de chevet au design moderne avec une base en bois local.", reviews: [], stock: 22, categoryId: 'cat-sub-13', status: 'published' },
    { id: '24', name: 'Collier de perles', price: 9500, imageUrls: ['https://images.unsplash.com/photo-1599643477877-539eb8a52f18?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Collier artisanal fait de perles traditionnelles colorées.", reviews: [], stock: 30, categoryId: 'cat-sub-14', status: 'published' },
    { id: '25', name: 'Montre Classique Homme', price: 32000, imageUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Montre élégante avec bracelet en cuir, idéale pour le bureau ou les sorties.", reviews: [], stock: 12, categoryId: 'cat-sub-15', status: 'published' },
    { id: '26', name: 'Poupée "Penda"', price: 7000, imageUrls: ['https://images.unsplash.com/photo-1620243423599-da1c88a51e6c?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Poupée en tissu pagne, faite à la main, pour le bonheur des plus petits.", reviews: [], stock: 25, categoryId: 'cat-sub-16', status: 'published' },
    { id: '27', name: 'Lot de 10 Cahiers', price: 2500, imageUrls: ['https://images.unsplash.com/photo-1529142893173-665a0a1027c4?q=80&w=2070&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un lot de 10 cahiers de 100 pages pour la rentrée scolaire.", reviews: [], stock: 100, categoryId: 'cat-sub-17', status: 'published' },
    { id: '28', name: 'Bière "33" Export (Pack de 6)', price: 4000, imageUrls: ['https://www.bebe-cash.com/wp-content/uploads/2021/07/33-export.jpg'], vendor: 'Mama Africa', description: "La bière blonde de référence au Cameroun. Pack de 6 bouteilles de 65cl.", reviews: [], stock: 50, categoryId: 'cat-sub-3', status: 'published' },
];

const sampleDeliveredOrder: Order = {
    id: 'ORDER-SAMPLE-1',
    userId: 'customer-1', // A generic customer ID
    items: [
        // Using a non-null assertion because we know these products exist in initialProducts
        { ...initialProducts.find(p => p.id === '1')!, quantity: 1 }, // Ndolé Royal
        { ...initialProducts.find(p => p.id === '5')!, quantity: 2 }  // Miel d'Oku
    ],
    subtotal: 13000, // 3000 (promo) + 2 * 5000 = 13000
    deliveryFee: 1000,
    total: 14000,
    shippingAddress: { fullName: 'Client de Test', phone: '655555555', address: '123 Rue du Test', city: 'Yaoundé' },
    deliveryMethod: 'home-delivery',
    orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
    trackingNumber: 'KZSAMPLE1',
    trackingHistory: [
        { status: 'confirmed', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), location: 'Mama Africa', details: 'Commande confirmée' },
        { status: 'picked-up', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), location: 'Livreur', details: 'Colis pris en charge' },
        { status: 'delivered', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), location: 'Yaoundé', details: 'Livré avec succès' }
    ]
};

const initialStores: Store[] = [
    { 
        id: 'store-1', name: 'Kmer Fashion', logoUrl: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/fashion-brand-logo-design-template-5355651c6b65163155af4e2c246f5647_screen.jpg?ts=1675753069', category: 'Mode et Vêtements', warnings: [], status: 'active', premiumStatus: 'premium',
        location: 'Douala', neighborhood: 'Akwa', sellerFirstName: 'Aïcha', sellerLastName: 'Bakari', sellerPhone: '699887766',
        physicalAddress: '45 Avenue de la Mode, Akwa', latitude: 4.0483, longitude: 9.7020, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-15T00:00:00.000Z',
        documents: [
            { name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' },
            { name: "Registre de Commerce", status: 'uploaded', fileUrl: '...' },
        ],
        stories: [{id: 's1', imageUrl: 'https://i.pinimg.com/564x/08/94/a3/0894a30e8a719c676767576f3f054812.jpg', createdAt: new Date().toISOString() }]
    },
    { 
        id: 'store-2', name: 'Mama Africa', logoUrl: 'https://img.freepik.com/vecteurs-premium/modele-logo-cuisine-africaine_210834-31.jpg', category: 'Alimentation', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Bastos', sellerFirstName: 'Jeanne', sellerLastName: 'Abena', sellerPhone: '677665544',
        physicalAddress: '12 Rue des Saveurs, Bastos', latitude: 3.8968, longitude: 11.5213, subscriptionStatus: 'overdue', subscriptionDueDate: '2024-07-10T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'requested' }]
    },
    { 
        id: 'store-3', name: 'Electro Plus', logoUrl: 'https://cdn.dribbble.com/users/188652/screenshots/1029415/electro-logo-2.jpg', category: 'Électronique', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Mokolo', sellerFirstName: 'Paul', sellerLastName: 'Kouam', sellerPhone: '655443322',
        physicalAddress: 'Grand Marché Mokolo, Stand 52', latitude: 3.8731, longitude: 11.5152, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-20T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }]
    },
    { 
        id: 'store-4', name: 'Douala Soaps', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-M3k_vJXuV2zD6D3XoJzQZzO8Z6O8Z6O8Q&s', category: 'Beauté et Hygiène', warnings: [], status: 'suspended', premiumStatus: 'standard',
        location: 'Douala', neighborhood: 'Bonapriso', sellerFirstName: 'Céline', sellerLastName: 'Ngassa', sellerPhone: '691234567',
        physicalAddress: 'Rue Njo-Njo, Bonapriso', latitude: 4.0321, longitude: 9.715, subscriptionStatus: 'inactive',
        documents: [{ name: "Registre de Commerce", status: 'rejected', rejectionReason: 'Document illisible.' }]
    },
     { 
        id: 'store-5', name: 'Yaoundé Style', logoUrl: 'https://img.freepik.com/premium-vector/traditional-african-woman-head-wrap-turban-logo_103045-81.jpg', category: 'Mode et Vêtements', warnings: [], status: 'pending', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Mvog-Ada', sellerFirstName: 'Franck', sellerLastName: 'Essomba', sellerPhone: '698765432',
        physicalAddress: 'Avenue Kennedy', latitude: 3.8647, longitude: 11.521,
        documents: []
    },
];

const initialFlashSales: FlashSale[] = [
    {
      id: 'fs1',
      name: 'Vente Flash de la Rentrée',
      startDate: '2024-07-20T00:00:00.000Z',
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Ends in 3 days
      products: [
        { productId: '4', sellerShopName: 'Electro Plus', flashPrice: 68000, status: 'approved' },
        { productId: '2', sellerShopName: 'Kmer Fashion', flashPrice: 12000, status: 'approved' },
        { productId: '16', sellerShopName: 'Douala Soaps', flashPrice: 2000, status: 'pending' },
        { productId: '5', sellerShopName: 'Mama Africa', flashPrice: 4500, status: 'rejected' },
      ],
    },
];

const initialPickupPoints: PickupPoint[] = [
    { id: 'pp1', name: 'Relais KMER ZONE - Akwa', city: 'Douala', neighborhood: 'Akwa', street: 'Rue de la Joie', latitude: 4.047, longitude: 9.704 },
    { id: 'pp2', name: 'Relais KMER ZONE - Bonamoussadi', city: 'Douala', neighborhood: 'Bonamoussadi', street: 'Carrefour Kotto', latitude: 4.09, longitude: 9.74 },
    { id: 'pp3', name: 'Relais KMER ZONE - Bastos', city: 'Yaoundé', neighborhood: 'Bastos', street: 'Avenue des Banques', latitude: 3.89, longitude: 11.52 },
];

const initialSiteSettings: SiteSettings = {
  logoUrl: '',
  isStoriesEnabled: true,
  isPremiumProgramEnabled: true,
  premiumThresholds: { orders: 10, spending: 50000 },
  premiumCautionAmount: 10000,
  isPremiumPlusEnabled: true,
  premiumPlusAnnualFee: 25000,
  requiredSellerDocuments: {
      "CNI (Carte Nationale d'Identité)": true,
      "Registre de Commerce": true,
      "Photo du gérant": false,
      "Plan de localisation": false,
  },
  isRentEnabled: true,
  rentAmount: 5000,
  canSellersCreateCategories: true,
  maintenanceMode: {
      isEnabled: false,
      message: "Nous effectuons une mise à jour. Nous serons de retour très bientôt !",
      reopenDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  }
};

const initialAdvertisements: Advertisement[] = [
    { id: 'ad1', imageUrl: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1920&auto=format&fit=crop', linkUrl: '#', location: 'homepage-banner', isActive: true },
    { id: 'ad2', imageUrl: 'https://images.unsplash.com/photo-1598327105151-586673437584?q=80&w=1920&auto=format&fit=crop', linkUrl: '#', location: 'homepage-banner', isActive: true },
];

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingStoriesOfStore, setViewingStoriesOfStore] = useState<Store | null>(null);
  const [infoPageContent, setInfoPageContent] = useState({ title: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [siteSettings, setSiteSettings] = usePersistentState<SiteSettings>('siteSettings', initialSiteSettings);

  const [allProducts, setAllProducts] = usePersistentState<Product[]>('allProducts', initialProducts);
  const [allCategories, setAllCategories] = usePersistentState<Category[]>('allCategories', initialCategories);
  const [allStores, setAllStores] = usePersistentState<Store[]>('allStores', initialStores);
  const [allOrders, setAllOrders] = usePersistentState<Order[]>('allOrders', [sampleDeliveredOrder]);
  const [allPromoCodes, setAllPromoCodes] = usePersistentState<PromoCode[]>('allPromoCodes', []);
  const [siteActivityLogs, setSiteActivityLogs] = usePersistentState<SiteActivityLog[]>('siteActivityLogs', []);
  const [flashSales, setFlashSales] = usePersistentState<FlashSale[]>('flashSales', initialFlashSales);
  const [allPickupPoints, setAllPickupPoints] = usePersistentState<PickupPoint[]>('allPickupPoints', initialPickupPoints);
    const [payouts, setPayouts] = usePersistentState<Payout[]>('payouts', []);
    const [advertisements, setAdvertisements] = usePersistentState<Advertisement[]>('advertisements', initialAdvertisements);

    const { user, logout: authLogout, allUsers, setAllUsers, updateUser: authUpdateUser } = useAuth();
    const { isModalOpen, modalProduct, closeModal: uiCloseModal } = useUI();
    const { cart, clearCart } = useCart();
    const { comparisonList, setProducts: setComparisonProducts } = useComparison();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [promotionModalProduct, setPromotionModalProduct] = useState<Product | null>(null);

    const [isChatEnabled, setIsChatEnabled] = useState(true);
    const [isComparisonEnabled, setIsComparisonEnabled] = useState(true);

    const visibleProducts = useMemo(() => {
        const activeStoreNames = new Set(allStores.filter(s => s.status === 'active').map(s => s.name));
        return allProducts.filter(p => activeStoreNames.has(p.vendor));
    }, [allProducts, allStores]);

    useEffect(() => {
      setComparisonProducts(allProducts);
    }, [allProducts, setComparisonProducts]);

     useEffect(() => {
        // Log application start if no logs exist yet.
        if (siteActivityLogs.length === 0) {
            const newLog: SiteActivityLog = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                user: { id: 'system', name: 'Système', role: 'superadmin' },
                action: 'Application Started',
                details: 'The KMER ZONE application has been successfully initialized.'
            };
            setSiteActivityLogs([newLog]);
        }
    }, []); // Run only once on mount

    useEffect(() => {
        if (user && user.role === 'customer' && siteSettings.isPremiumProgramEnabled) {
            const userOrders = allOrders.filter(o => o.userId === user.id && o.status === 'delivered');
            const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
            const orderCount = userOrders.length;

            const shouldBePremium = orderCount >= siteSettings.premiumThresholds.orders || totalSpent >= siteSettings.premiumThresholds.spending;
            
            if (shouldBePremium && user.loyalty.status === 'standard' && user.loyalty.premiumStatusMethod !== 'deposit') {
                const updatedUser = { ...user, loyalty: { ...user.loyalty, status: 'premium' as const, premiumStatusMethod: 'loyalty' as const } };
                setAllUsers(users => users.map(u => u.id === user.id ? updatedUser : u));
            }
        }
    }, [allOrders, user, siteSettings, setAllUsers]);

    const logActivity = useCallback((action: string, details: string) => {
        if (!user) return;
        const newLog: SiteActivityLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            user: { id: user.id, name: user.name, role: user.role },
            action,
            details
        };
        setSiteActivityLogs(prev => [newLog, ...prev].slice(0, 100));
    }, [user, setSiteActivityLogs]);

    const handleUpdateUserAvailability = useCallback((userId: string, status: UserAvailabilityStatus) => {
        setAllUsers(users => users.map(u => 
            u.id === userId ? { ...u, availabilityStatus: status } : u
        ));
        const actor = user ? `${user.name} (${user.role})` : 'System';
        logActivity('User Availability Update', `Status for user ${userId} set to ${status} by ${actor}.`);
    }, [setAllUsers, logActivity, user]);
    
    const handleAdminAddCategory = useCallback((categoryName: string, parentId?: string) => {
        if (!categoryName.trim()) {
            alert("Le nom de la catégorie ne peut pas être vide.");
            return;
        }
        if (allCategories.some(c => c.name.toLowerCase() === categoryName.trim().toLowerCase() && c.parentId === parentId)) {
            alert("Une catégorie avec ce nom existe déjà à ce niveau.");
            return;
        }

        const newCategory: Category = {
            id: `cat-${Date.now()}`,
            name: categoryName.trim(),
            imageUrl: 'https://images.unsplash.com/photo-1588422221063-654854db2583?q=80&w=1974&auto=format&fit=crop', // A generic default image
            parentId: parentId || undefined,
        };
        setAllCategories(prev => [...prev, newCategory]);
        logActivity('Category Added', `New category "${newCategory.name}" created.`);
    }, [allCategories, setAllCategories, logActivity]);

    const handleAdminDeleteCategory = useCallback((categoryId: string) => {
        // Check if it's a parent category
        const isParent = allCategories.some(c => c.parentId === categoryId);
        if (isParent) {
            alert("Impossible de supprimer cette catégorie car elle contient des sous-catégories. Veuillez d'abord supprimer les sous-catégories.");
            return;
        }
        
        // Check if any product uses this category
        const isUsedByProduct = allProducts.some(p => p.categoryId === categoryId);
        if (isUsedByProduct) {
            alert("Impossible de supprimer cette catégorie car elle est utilisée par des produits. Veuillez d'abord changer la catégorie de ces produits.");
            return;
        }
        
        const categoryToDelete = allCategories.find(c => c.id === categoryId);
        if (categoryToDelete && window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryToDelete.name}" ?`)) {
            setAllCategories(prev => prev.filter(c => c.id !== categoryId));
            logActivity('Category Deleted', `Category "${categoryToDelete.name}" (ID: ${categoryId}) deleted.`);
        }
    }, [allCategories, allProducts, setAllCategories, logActivity]);


    const handleNavigate = useCallback((newPage: Page, stateReset: () => void = () => {}) => {
        setPage(newPage);
        stateReset();
        window.scrollTo(0, 0);
    }, []);

    const resetSelections = () => {
        setSelectedProduct(null);
        setSelectedCategoryId(null);
        setSelectedVendor(null);
        setSelectedOrder(null);
        setProductToEdit(null);
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        handleNavigate('product');
    };

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategoryId(categoryId);
        handleNavigate('category');
    };

    const handleVendorClick = (vendorName: string) => {
        setSelectedVendor(vendorName);
        handleNavigate('vendor-page');
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        handleNavigate('search-results');
    };
    
    const handleLogout = () => {
        authLogout();
        handleNavigate('home', resetSelections);
    };

    const handleOrderConfirm = async (orderData: NewOrderData) => {
        const newOrder: Order = {
            ...orderData,
            id: Math.random().toString(36).substr(2, 9).toUpperCase(),
            orderDate: new Date().toISOString(),
            status: 'confirmed',
            trackingNumber: `KZ${Date.now()}`,
            trackingHistory: [{
                status: 'confirmed',
                date: new Date().toISOString(),
                location: orderData.items[0]?.vendor || 'Unknown',
                details: 'Order confirmed by customer.'
            }]
        };
        setAllOrders(prev => [...prev, newOrder]);
        setSelectedOrder(newOrder);
        clearCart();
        setAppliedPromoCode(null);
        logActivity('Order Placed', `Order #${newOrder.id} for ${newOrder.total} FCFA`);
        handleNavigate('order-success');
    };

    const handleCloseModal = () => {
      uiCloseModal();
    };

    const handleToggleStoreStatus = useCallback((store: Store) => {
        const newStatus = store.status === 'active' ? 'suspended' : 'active';
        setAllStores(prev => prev.map(s => s.id === store.id ? { ...s, status: newStatus } : s));
        logActivity('Store Status Change', `Store "${store.name}" status changed to ${newStatus}.`);
    }, [setAllStores, logActivity]);

    const handleApproveStore = useCallback((store: Store) => {
        setAllStores(prev => prev.map(s => s.id === store.id ? { ...s, status: 'active' } : s));
        logActivity('Store Approved', `Store "${store.name}" has been approved.`);
    }, [setAllStores, logActivity]);
    
    const handlePayoutSeller = useCallback((store: Store, amount: number) => {
        const newPayout: Payout = {
            storeId: store.id,
            amount,
            date: new Date().toISOString(),
        };
        setPayouts(prev => [...prev, newPayout]);
        logActivity('Seller Payout', `Paid ${amount.toLocaleString('fr-CM')} FCFA to store "${store.name}".`);
    }, [setPayouts, logActivity]);

    const handleUpdateUserRole = useCallback((userToUpdate: User, newRole: UserRole) => {
        setAllUsers(users => users.map(u => {
            if (u.id === userToUpdate.id) {
                const updatedUser = { ...u, role: newRole };
                if (u.role === 'seller' && newRole !== 'seller') {
                    delete updatedUser.shopName;
                }
                return updatedUser;
            }
            return u;
        }));
        logActivity('User Role Changed', `Role for ${userToUpdate.name} (${userToUpdate.email}) set to ${newRole}.`);
    }, [setAllUsers, logActivity]);

    const handleWarnStore = useCallback((storeToWarn: Store, reason: string) => {
        const newWarning: Warning = {
            id: `warn_${Date.now()}`,
            date: new Date().toISOString(),
            reason,
        };
        setAllStores(stores => stores.map(s => 
            s.id === storeToWarn.id ? { ...s, warnings: [...(s.warnings || []), newWarning] } : s
        ));
        logActivity('Store Warned', `Warning issued to "${storeToWarn.name}": ${reason}`);
    }, [setAllStores, logActivity]);
    
    const handleSanctionAgent = useCallback((agentId: string, reason: string) => {
        const agent = allUsers.find(u => u.id === agentId);
        if (!agent) return;

        const newWarning: Warning = {
            id: `warn_agent_${Date.now()}`,
            date: new Date().toISOString(),
            reason,
        };
        setAllUsers(users => users.map(u =>
            u.id === agentId ? { ...u, warnings: [...(u.warnings || []), newWarning] } : u
        ));
        logActivity('Delivery Agent Sanctioned', `Agent ${agent.name} (ID: ${agentId}) sanctioned for: ${reason}`);
    }, [allUsers, setAllUsers, logActivity]);


    const handleToggleStorePremiumStatus = useCallback((storeToUpdate: Store) => {
        const newStatus = storeToUpdate.premiumStatus === 'premium' ? 'standard' : 'premium';
        setAllStores(stores => stores.map(s =>
            s.id === storeToUpdate.id ? { ...s, premiumStatus: newStatus } : s
        ));
        logActivity('Store Premium Status Changed', `Premium status for "${storeToUpdate.name}" set to ${newStatus}.`);
    }, [setAllStores, logActivity]);

    const handleRejectStore = useCallback((storeToReject: Store) => {
        setAllStores(stores => stores.filter(s => s.id !== storeToReject.id));
        logActivity('Store Rejected', `Pending store application for "${storeToReject.name}" was rejected and removed.`);
    }, [setAllStores, logActivity]);
    
    const handleVerifyDocumentStatus = useCallback((store: Store, documentName: string, status: 'verified' | 'rejected', reason?: string) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === store.id) {
                return {
                    ...s,
                    documents: s.documents.map(doc => {
                        if (doc.name === documentName) {
                            return { ...doc, status, rejectionReason: reason };
                        }
                        return doc;
                    })
                };
            }
            return s;
        }));
        logActivity('Document Status Updated', `Document "${documentName}" for store "${store.name}" set to ${status}.`);
    }, [setAllStores, logActivity]);

    const handleUpdateOrderStatus = useCallback((order: Order, status: OrderStatus) => {
        setAllOrders(prev => prev.map(o => {
            if (o.id === order.id) {
                const newHistory: TrackingEvent = {
                    status,
                    date: new Date().toISOString(),
                    location: user?.role === 'superadmin' ? 'Admin Dashboard' : 'System',
                    details: `Status updated by ${user?.name || 'Admin'}`
                };
                return { ...o, status, trackingHistory: [...o.trackingHistory, newHistory] };
            }
            return o;
        }));
        logActivity('Order Status Update', `Order ${order.id} status set to ${status}.`);
    }, [setAllOrders, logActivity, user]);

    const handleSavePromotion = useCallback((productId: string, promoPrice: number, startDate?: string, endDate?: string) => {
        setAllProducts(prevProducts =>
            prevProducts.map(p =>
                p.id === productId
                    ? { ...p, promotionPrice: promoPrice, promotionStartDate: startDate, promotionEndDate: endDate }
                    : p
            )
        );
        logActivity('Promotion Set', `Promotion set for product ID ${productId} at ${promoPrice} FCFA.`);
        setPromotionModalProduct(null); // Close the modal
    }, [setAllProducts, logActivity]);
    
    const handleRequestRefund = useCallback((orderId: string, reason: string, evidenceUrls: string[]) => {
        setAllOrders(prevOrders =>
            prevOrders.map(o =>
                o.id === orderId
                    ? { ...o, status: 'refund-requested' as const, refundReason: reason, refundEvidenceUrls: evidenceUrls }
                    : o
            )
        );
        logActivity('Refund Requested', `Refund requested for order ${orderId}. Reason: ${reason}. Evidence provided: ${evidenceUrls.length} files.`);
    }, [setAllOrders, logActivity]);


    const renderPage = () => {
        if (siteSettings.maintenanceMode.isEnabled && user?.role !== 'superadmin') {
            return <MaintenancePage message={siteSettings.maintenanceMode.message} reopenDate={siteSettings.maintenanceMode.reopenDate} />;
        }
        
        switch (page) {
            case 'home': return <HomePage products={visibleProducts.filter(p=> p.status === 'published')} categories={allCategories} stores={allStores.filter(s => s.status === 'active')} flashSales={flashSales} advertisements={advertisements.filter(ad => ad.isActive)} onProductClick={handleProductClick} onCategoryClick={handleCategoryClick} onVendorClick={handleVendorClick} onVisitStore={handleVendorClick} onViewStories={(store) => setViewingStoriesOfStore(store)} isComparisonEnabled={isComparisonEnabled} isStoriesEnabled={siteSettings.isStoriesEnabled} />;
            case 'product':
                if (selectedProduct) {
                    const isVisible = visibleProducts.some(p => p.id === selectedProduct.id);
                    if (!isVisible) {
                        handleNavigate('home', resetSelections);
                        return null; // or a placeholder while navigating
                    }
                    return <ProductDetail product={selectedProduct} allProducts={visibleProducts} allUsers={allUsers} stores={allStores} flashSales={flashSales} onBack={() => handleNavigate('home')} onAddReview={(p,r) => {}} onVendorClick={handleVendorClick} onProductClick={handleProductClick} onOpenLogin={() => setIsLoginModalOpen(true)} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} />;
                } else {
                    handleNavigate('home');
                }
                break;
            case 'cart': return <CartView onBack={() => handleNavigate('home')} onNavigateToCheckout={() => handleNavigate('checkout')} flashSales={flashSales} allPromoCodes={allPromoCodes} appliedPromoCode={appliedPromoCode} onApplyPromoCode={setAppliedPromoCode} />;
            case 'checkout': return <Checkout onBack={() => handleNavigate('cart')} onOrderConfirm={handleOrderConfirm} flashSales={flashSales} allPickupPoints={allPickupPoints} appliedPromoCode={appliedPromoCode} allStores={allStores} />;
            case 'order-success':
                if (selectedOrder) return <OrderSuccess order={selectedOrder} onNavigateHome={() => handleNavigate('home', resetSelections)} onNavigateToOrders={() => handleNavigate('order-history')} />;
                else handleNavigate('home');
                break;
            case 'stores': return <StoresPage stores={allStores.filter(s => s.status === 'active')} onBack={() => handleNavigate('home')} onVisitStore={handleVendorClick} />;
            case 'become-seller': return <BecomeSeller onBack={() => handleNavigate('home')} onBecomeSeller={() => {}} onRegistrationSuccess={() => handleNavigate('seller-dashboard')} siteSettings={siteSettings} />;
            case 'category':
                if (selectedCategoryId) return <CategoryPage categoryId={selectedCategoryId} allCategories={allCategories} allProducts={visibleProducts.filter(p => p.status === 'published')} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
                else handleNavigate('home');
                break;
            case 'seller-dashboard':
                if (user?.role === 'seller') {
                    const sellerStore = allStores.find(s => s.name === user.shopName);
                    const sellerProducts = allProducts.filter(p => p.vendor === user.shopName);
                    const sellerOrders = allOrders.filter(o => o.items.some(i => i.vendor === user.shopName));
                    const sellerPromoCodes = allPromoCodes.filter(c => c.sellerId === user.id);
                    return <SellerDashboard
                        store={sellerStore} products={sellerProducts} categories={allCategories} flashSales={flashSales} sellerOrders={sellerOrders} promoCodes={sellerPromoCodes} onBack={() => handleNavigate('home')} onAddProduct={() => { setProductToEdit(null); handleNavigate('product-form'); }} onEditProduct={(p) => { setProductToEdit(p); handleNavigate('product-form'); }} onDeleteProduct={()=>{}} onToggleStatus={()=>{}} onNavigateToProfile={() => handleNavigate('seller-profile')} onSetPromotion={(p) => setPromotionModalProduct(p)} onRemovePromotion={()=>{}} onProposeForFlashSale={()=>{}} onUploadDocument={()=>{}} onUpdateOrderStatus={()=>{}} onCreatePromoCode={()=>{}} onDeletePromoCode={()=>{}} isChatEnabled={isChatEnabled} onPayRent={()=>{}} siteSettings={siteSettings} onAddStory={()=>{}} onDeleteStory={()=>{}}
                    />;
                } else handleNavigate('forbidden');
                break;
            case 'vendor-page':
                if (selectedVendor) return <VendorPage vendorName={selectedVendor} allProducts={visibleProducts.filter(p => p.status === 'published')} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
                else handleNavigate('home');
                break;
            case 'product-form': return <ProductForm onSave={()=>{}} onCancel={() => handleNavigate('seller-dashboard')} productToEdit={productToEdit} categories={allCategories} onAddCategory={() => ({} as Category)} siteSettings={siteSettings} />;
            case 'seller-profile':
                 if (user?.role === 'seller') {
                    const sellerStore = allStores.find(s => s.name === user.shopName);
                    if (sellerStore) return <SellerProfile store={sellerStore} onBack={() => handleNavigate('seller-dashboard')} onUpdateProfile={()=>{}} />;
                 }
                 handleNavigate('forbidden');
                 break;
            case 'superadmin-dashboard':
                if (user?.role === 'superadmin') return <SuperAdminDashboard allUsers={allUsers} allOrders={allOrders} allCategories={allCategories} allStores={allStores} siteActivityLogs={siteActivityLogs} onUpdateOrderStatus={handleUpdateOrderStatus} onUpdateCategoryImage={()=>{}} onWarnStore={handleWarnStore} onToggleStoreStatus={handleToggleStoreStatus} onToggleStorePremiumStatus={handleToggleStorePremiumStatus} onApproveStore={handleApproveStore} onRejectStore={handleRejectStore} onSaveFlashSale={()=>{}} flashSales={flashSales} allProducts={allProducts} onUpdateFlashSaleSubmissionStatus={()=>{}} onBatchUpdateFlashSaleStatus={()=>{}} onRequestDocument={()=>{}} onVerifyDocumentStatus={handleVerifyDocumentStatus} allPickupPoints={allPickupPoints} onAddPickupPoint={()=>{}} onUpdatePickupPoint={()=>{}} onDeletePickupPoint={()=>{}} onAssignAgent={()=>{}} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onToggleChatFeature={() => setIsChatEnabled(p => !p)} onToggleComparisonFeature={() => setIsComparisonEnabled(p => !p)} siteSettings={siteSettings} onUpdateSiteSettings={setSiteSettings} onAdminAddCategory={handleAdminAddCategory} onAdminDeleteCategory={handleAdminDeleteCategory} onUpdateUserRole={handleUpdateUserRole} payouts={payouts} onPayoutSeller={handlePayoutSeller} onActivateSubscription={()=>{}} advertisements={advertisements} onAddAdvertisement={()=>{}} onUpdateAdvertisement={()=>{}} onDeleteAdvertisement={()=>{}} onCreateUserByAdmin={()=>{}} onSanctionAgent={handleSanctionAgent} />;
                else handleNavigate('forbidden');
                break;
            case 'order-history': 
                if (user) return <OrderHistoryPage userOrders={allOrders.filter(o => o.userId === user.id)} onBack={() => handleNavigate('home')} onSelectOrder={(o) => { setSelectedOrder(o); handleNavigate('order-detail'); }} />;
                else handleNavigate('forbidden');
                break;
            case 'order-detail':
                if (selectedOrder) return <OrderDetailPage order={selectedOrder} onBack={() => handleNavigate('order-history')} allPickupPoints={allPickupPoints} onCancelOrder={()=>{}} onRequestRefund={handleRequestRefund} />;
                else handleNavigate('order-history');
                break;
            case 'promotions': return <PromotionsPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'flash-sales': return <FlashSalesPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'search-results': return <SearchResultsPage searchQuery={searchQuery} allProducts={visibleProducts} allStores={allStores} allCategories={allCategories} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'wishlist': return <WishlistPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
            case 'delivery-agent-dashboard': 
                if (user?.role === 'delivery_agent') return <DeliveryAgentDashboard allOrders={allOrders} allStores={allStores} allPickupPoints={allPickupPoints} onUpdateOrderStatus={()=>{}} onLogout={handleLogout} onUpdateUserAvailability={handleUpdateUserAvailability} />;
                else handleNavigate('forbidden');
                break;
            case 'depot-agent-dashboard': 
                if (user?.role === 'depot_agent') return <DepotAgentDashboard allOrders={allOrders} onCheckIn={()=>{}} onReportDiscrepancy={()=>{}} onLogout={handleLogout} />;
                else handleNavigate('forbidden');
                break;
            case 'comparison': return <ComparisonPage allCategories={allCategories} onBack={() => handleNavigate('home')} />;
            case 'become-premium': return <BecomePremiumPage siteSettings={siteSettings} onBack={() => handleNavigate('home')} onBecomePremiumByCaution={()=>{}} onUpgradeToPremiumPlus={()=>{}} />;
            case 'analytics-dashboard': 
                if (user?.role === 'superadmin') return <AnalyticsDashboard onBack={() => handleNavigate('superadmin-dashboard')} allOrders={allOrders} allProducts={allProducts} allStores={allStores} allUsers={allUsers} allCategories={allCategories} />;
                else handleNavigate('forbidden');
                break;
            case 'review-moderation':
                 if (user?.role === 'superadmin') return <ReviewModeration onBack={() => handleNavigate('superadmin-dashboard')} allProducts={allProducts} onReviewModeration={()=>{}} />;
                else handleNavigate('forbidden');
                break;
            case 'info': return <InfoPage title={infoPageContent.title} content={infoPageContent.content} onBack={() => handleNavigate('home')} />;
            case 'not-found': return <NotFoundPage onNavigateHome={() => handleNavigate('home', resetSelections)} />;
            case 'forbidden': return <ForbiddenPage onNavigateHome={() => handleNavigate('home', resetSelections)} />;
            case 'server-error': return <ServerErrorPage onNavigateHome={() => handleNavigate('home', resetSelections)} />;
            default: return <HomePage products={visibleProducts.filter(p=> p.status === 'published')} categories={allCategories} stores={allStores.filter(s => s.status === 'active')} flashSales={flashSales} advertisements={advertisements.filter(ad => ad.isActive)} onProductClick={handleProductClick} onCategoryClick={handleCategoryClick} onVendorClick={handleVendorClick} onVisitStore={handleVendorClick} onViewStories={(store) => setViewingStoriesOfStore(store)} isComparisonEnabled={isComparisonEnabled} isStoriesEnabled={siteSettings.isStoriesEnabled}/>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header
                categories={allCategories}
                onNavigateHome={() => handleNavigate('home', resetSelections)}
                onNavigateCart={() => handleNavigate('cart')}
                onNavigateToStores={() => handleNavigate('stores')}
                onNavigateToPromotions={() => handleNavigate('promotions')}
                onNavigateToCategory={handleCategoryClick}
                onNavigateToBecomeSeller={() => handleNavigate('become-seller')}
                onNavigateToSellerDashboard={() => handleNavigate('seller-dashboard')}
                onNavigateToSellerProfile={() => handleNavigate('seller-profile')}
                onNavigateToOrderHistory={() => handleNavigate('order-history')}
                onNavigateToSuperAdminDashboard={() => handleNavigate('superadmin-dashboard')}
                onNavigateToFlashSales={() => handleNavigate('flash-sales')}
                onNavigateToWishlist={() => handleNavigate('wishlist')}
                onNavigateToDeliveryAgentDashboard={() => handleNavigate('delivery-agent-dashboard')}
                onNavigateToDepotAgentDashboard={() => handleNavigate('depot-agent-dashboard')}
                onNavigateToBecomePremium={() => handleNavigate('become-premium')}
                onNavigateToAnalyticsDashboard={() => handleNavigate('analytics-dashboard')}
                onNavigateToReviewModeration={() => handleNavigate('review-moderation')}
                onOpenLogin={() => setIsLoginModalOpen(true)}
                onLogout={handleLogout}
                onSearch={handleSearch}
                isChatEnabled={isChatEnabled}
                isPremiumProgramEnabled={siteSettings.isPremiumProgramEnabled}
                logoUrl={siteSettings.logoUrl}
            />
            <main className="flex-grow">
                {renderPage()}
            </main>
            <Footer 
                logoUrl={siteSettings.logoUrl}
                onNavigate={(title, content) => {
                    setInfoPageContent({ title, content });
                    handleNavigate('info');
                }}
            />
            {isModalOpen && modalProduct && <AddToCartModal product={modalProduct} onClose={handleCloseModal} onNavigateToCart={() => { handleCloseModal(); handleNavigate('cart'); }} />}
            {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} />}
            {viewingStoriesOfStore && <StoryViewer store={viewingStoriesOfStore} onClose={() => setViewingStoriesOfStore(null)} />}
            {promotionModalProduct && <PromotionModal product={promotionModalProduct} onClose={() => setPromotionModalProduct(null)} onSave={handleSavePromotion} />}
            {isComparisonEnabled && <ComparisonBar onCompareClick={() => handleNavigate('comparison')} />}
            {isChatEnabled && <ChatWidget allUsers={allUsers} allProducts={allProducts} allCategories={allCategories} />}
        </div>
    );
}