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
import { DepotAgentDashboard } from './components/DepotAgentDashboard';
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
import type { Product, Category, Store, Review, Order, Address, OrderStatus, User, SiteActivityLog, FlashSale, DocumentStatus, PickupPoint, NewOrderData, TrackingEvent, PromoCode, Warning, SiteSettings, CartItem, UserRole, Payout, Advertisement, Discrepancy, Story, UserAvailabilityStatus, DisputeMessage, StatusChangeLogEntry } from './types';
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
    { id: 'cat-vetements', name: 'Vêtements et chaussures', imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop' },
    { id: 'cat-accessoires', name: 'Accessoires & bijoux', imageUrl: 'https://images.unsplash.com/photo-1611652022417-a551155e9984?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-beaute', name: 'Beauté', imageUrl: 'https://images.unsplash.com/photo-1596422846543-75c6fc101b89?q=80&w=2070&auto=format&fit=crop' },
    { id: 'cat-mobilier', name: 'Mobilier (Meubles)', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop' },
    { id: 'cat-electronique', name: 'Électronique', imageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=1925&auto=format&fit=crop' },
    { id: 'cat-textile', name: 'Textile maison', imageUrl: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-bureau', name: 'Fournitures de bureau', imageUrl: 'https://images.unsplash.com/photo-1456735185569-8a8b122b1236?q=80&w=2068&auto=format&fit=crop' },
    { id: 'cat-animaux', name: 'Produits pour animaux', imageUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-loisirs', name: 'Loisirs & Créativité', imageUrl: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-jardin', name: 'Maison & Jardin', imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1925&auto=format&fit=crop' },
    { id: 'cat-electronique-grand-public', name: 'Électronique grand public', imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f82acb?q=80&w=2070&auto=format&fit=crop' },
    { id: 'cat-enfants', name: 'Produits pour enfants et scolaires', imageUrl: 'https://images.unsplash.com/photo-1518498391512-42f5b89a81c1?q=80&w=2070&auto=format&fit=crop' },

    // Sub-categories
    { id: 'sub-vetements', parentId: 'cat-vetements', name: 'Vêtements', imageUrl: 'https://images.unsplash.com/photo-1612053648936-285a2b342c8d?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-chaussures', parentId: 'cat-vetements', name: 'Chaussures', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-sacs', parentId: 'cat-accessoires', name: 'Sacs', imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1935&auto=format&fit=crop' },
    { id: 'sub-montres', parentId: 'cat-accessoires', name: 'Montres', imageUrl: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-lunettes', parentId: 'cat-accessoires', name: 'Lunettes', imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1780&auto=format&fit=crop' },
    { id: 'sub-bijoux', parentId: 'cat-accessoires', name: 'Bijoux', imageUrl: 'https://images.unsplash.com/photo-1611591437281-462bf4d3ab45?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-accessoires-cheveux', parentId: 'cat-accessoires', name: 'Accessoires cheveux', imageUrl: 'https://images.unsplash.com/photo-1599386348459-717a6a70a040?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-cosmetiques', parentId: 'cat-beaute', name: 'Cosmétiques', imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90137ba0a43?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-parfums', parentId: 'cat-beaute', name: 'Parfums', imageUrl: 'https://images.unsplash.com/photo-1585399009939-f4639a4f78d1?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-chaises', parentId: 'cat-mobilier', name: 'Chaises', imageUrl: 'https://images.unsplash.com/photo-1561582299-a403c00a0063?q=80&w=1964&auto=format&fit=crop' },
    { id: 'sub-autres-meubles', parentId: 'cat-mobilier', name: 'Autres meubles', imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=2160&auto=format&fit=crop' },
    { id: 'sub-chargeurs-cables-batteries', parentId: 'cat-electronique', name: 'Chargeurs, câbles, batteries', imageUrl: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-rideaux', parentId: 'cat-textile', name: 'Rideaux', imageUrl: 'https://images.unsplash.com/photo-1605334182479-54a4347781c7?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-autres-textiles', parentId: 'cat-textile', name: 'Autres textiles domestiques', imageUrl: 'https://images.unsplash.com/photo-1617325247854-dce5e6a83607?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-papeterie', parentId: 'cat-bureau', name: 'Papeterie', imageUrl: 'https://images.unsplash.com/photo-1600869158702-818a7c168305?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-office-goods', parentId: 'cat-bureau', name: 'Office goods', imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-accessoires-animaux', parentId: 'cat-animaux', name: 'Accessoires pour animaux', imageUrl: 'https://images.unsplash.com/photo-1598808520297-8c24c7f76d23?q=80&w=2071&auto=format&fit=crop' },
    { id: 'sub-artisanat-jeux', parentId: 'cat-loisirs', name: 'Hobbies, artisanat, jeux', imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-decoration', parentId: 'cat-jardin', name: 'Décoration intérieure, luminaire, objets festifs', imageUrl: 'https://images.unsplash.com/photo-1534349762230-e08968f43152?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-telephones-casques', parentId: 'cat-electronique-grand-public', name: 'Téléphones, casques, électroménagers', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1780&auto=format&fit=crop' },
    { id: 'sub-jouets-fournitures', parentId: 'cat-enfants', name: 'Jouets, fournitures scolaires', imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=2070&auto=format&fit=crop' },
];

const initialProducts: Product[] = [
    { id: '1', name: 'Ndolé Royal', price: 3500, promotionPrice: 3000, imageUrls: ['https://images.unsplash.com/photo-1604329352680-e4a2896d8c22?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Le plat national du Cameroun, un délicieux mélange de légumes, d'arachides et de viande ou de poisson.", reviews: [{author: "Jean P.", rating: 5, comment: "Incroyable !", date: "2023-10-10", status: 'approved'}], stock: 15, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '2', name: 'Robe en Tissu Pagne', price: 15000, imageUrls: ['https://images.unsplash.com/photo-1617051395299-52d33b7336b1?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Une robe élégante confectionnée à la main avec du tissu pagne de haute qualité.", reviews: [{author: "Aïcha B.", rating: 4, comment: "Très belles couleurs.", date: "2023-10-11", status: 'approved'}], stock: 8, categoryId: 'sub-vetements', status: 'published' },
    { id: '3', name: 'Savon Artisanal à l\'huile d\'olive', price: 1500, imageUrls: ['https://images.unsplash.com/photo-1600966492337-1d83c4bee955?q=80&w=2070&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Un savon artisanal fabriqué localement. Doux pour la peau et respectueux de l'environnement.", reviews: [], stock: 50, categoryId: 'sub-cosmetiques', status: 'published' },
    { id: '4', name: 'Smartphone Pro Max', price: 75000, promotionPrice: 69900, imageUrls: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1965&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un smartphone performant avec un excellent rapport qualité-prix. Grand écran et bonne autonomie.", reviews: [{author: "Eric K.", rating: 5, comment: "Super téléphone pour le prix.", date: "2023-10-12", status: 'approved'}], stock: 4, categoryId: 'sub-telephones-casques', status: 'published', promotionStartDate: '2024-07-01', promotionEndDate: '2024-07-31' },
    { id: '5', name: 'Miel d\'Oku', price: 5000, imageUrls: ['https://images.unsplash.com/photo-1558642754-b27b3b95a8a9?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Un miel blanc rare et primé, récolté sur les flancs du mont Oku.", reviews: [{author: "Fatima G.", rating: 5, comment: "Le meilleur miel que j'ai jamais goûté.", date: "2023-10-13", status: 'approved'}], stock: 25, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '6', name: 'Sandales en cuir', price: 8000, imageUrls: ['https://images.unsplash.com/photo-1620652755231-c2f8b16a2b8e?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Sandales en cuir véritable, faites à la main. Confortables et durables.", reviews: [], stock: 10, categoryId: 'sub-chaussures', status: 'draft' },
    { id: '7', name: 'Poulet DG', price: 6500, imageUrls: ['https://images.unsplash.com/photo-1543339308-43e59d6b70a6?q=80&w=2070&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Un plat de fête succulent avec du poulet frit, des plantains et une sauce riche en légumes.", reviews: [], stock: 12, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '8', name: 'Jus de Bissap Naturel', price: 1000, imageUrls: ['https://images.unsplash.com/photo-1623341214825-9f4f96d62c54?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Boisson rafraîchissante et naturelle à base de fleurs d'hibiscus.", reviews: [], stock: 30, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '9', name: 'Beignets Haricots Bouillie', price: 1500, imageUrls: ['https://img.cuisineaz.com/660x660/2022/01/24/i181710-beignets-souffles-camerounais.jpeg'], vendor: 'Mama Africa', description: "Le petit-déjeuner camerounais par excellence. Des beignets soufflés accompagnés d'une purée de haricots.", reviews: [], stock: 20, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '10', name: 'Chemise en Toghu', price: 25000, imageUrls: ['https://i.pinimg.com/564x/a0/0c/37/a00c3755255673a5a415958253a5f82c.jpg'], vendor: 'Kmer Fashion', description: "Chemise de cérémonie pour homme, en velours noir brodé avec les motifs colorés traditionnels du Toghu.", reviews: [], stock: 5, categoryId: 'sub-vetements', status: 'published' },
    { id: '11', name: 'Poivre de Penja', price: 4500, imageUrls: ['https://images.unsplash.com/photo-1508616258423-f3e4e73b29b4?q=80&w=1935&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Considéré comme l'un des meilleurs poivres au monde, cultivé sur les terres volcaniques de Penja.", reviews: [], stock: 40, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '12', name: 'Sac à main en pagne', price: 12000, imageUrls: ['https://images.unsplash.com/photo-1566150905458-1bf1f2961239?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Accessoirisez votre tenue avec ce magnifique sac à main fait main, alliant cuir et tissu pagne.", reviews: [], stock: 15, categoryId: 'sub-sacs', status: 'published' },
    { id: '13', name: 'Téléviseur LED 32"', price: 85000, imageUrls: ['https://images.unsplash.com/photo-1593359677879-a4bb92f82acb?q=80&w=2070&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un téléviseur LED de 32 pouces avec une image de haute qualité.", reviews: [], stock: 9, categoryId: 'sub-telephones-casques', status: 'published' },
    { id: '14', name: 'Fer à repasser', price: 7500, imageUrls: ['https://images.unsplash.com/photo-1622629734636-95a239552382?q=80&w=1932&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Simple, efficace et durable. Ce fer à repasser est parfait pour un usage quotidien.", reviews: [], stock: 25, categoryId: 'sub-telephones-casques', status: 'published' },
    { id: '15', name: 'Blender / Mixeur', price: 18000, imageUrls: ['https://images.unsplash.com/photo-1582142391035-61f20a003881?q=80&w=1974&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un mixeur puissant pour préparer vos jus, soupes et sauces. Bol en verre robuste de 1.5L.", reviews: [], stock: 18, categoryId: 'sub-telephones-casques', status: 'published' },
    { id: '16', name: 'Savon noir gommant', price: 2500, imageUrls: ['https://images.unsplash.com/photo-1623461624469-8a964343169f?q=80&w=1974&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Savon noir africain pour un gommage naturel et une peau douce et purifiée.", reviews: [], stock: 40, categoryId: 'sub-cosmetiques', status: 'published' },
    { id: '17', name: 'Huile de coco vierge', price: 4000, imageUrls: ['https://images.unsplash.com/photo-1590945259635-e1a532ac9695?q=80&w=1974&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Huile de coco 100% pure et pressée à froid. Idéale pour la peau, les cheveux et la cuisson.", reviews: [], stock: 30, categoryId: 'sub-cosmetiques', status: 'published' },
    { id: '18', name: 'Beurre de karité', price: 3000, imageUrls: ['https://images.unsplash.com/photo-1554153041-33924bb6aa67?q=80&w=2070&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Beurre de karité brut et non raffiné, parfait pour hydrater en profondeur la peau et les cheveux secs.", reviews: [], stock: 60, categoryId: 'sub-cosmetiques', status: 'published' },
    { id: '19', name: 'Baskets de Ville', price: 22000, imageUrls: ['https://images.unsplash.com/photo-1515955656352-a1fa3ffcdda9?q=80&w=2070&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Baskets confortables et stylées pour un usage quotidien.", reviews: [], stock: 20, categoryId: 'sub-chaussures', status: 'published' },
    { id: '20', name: 'Eau de Parfum "Sawa"', price: 28000, imageUrls: ['https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1904&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Un parfum boisé et épicé pour homme, inspiré par la côte camerounaise.", reviews: [], stock: 15, categoryId: 'sub-parfums', status: 'published' },
    { id: '21', name: 'Fauteuil en Rotin', price: 45000, imageUrls: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1965&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Fauteuil artisanal en rotin, parfait pour votre salon ou votre terrasse.", reviews: [], stock: 5, categoryId: 'sub-chaises', status: 'published' },
    { id: '22', name: 'Masque décoratif Fang', price: 18000, imageUrls: ['https://images.unsplash.com/photo-1513480749022-2f7a0b1e4a1a?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Authentique masque décoratif de l'ethnie Fang, sculpté à la main.", reviews: [], stock: 10, categoryId: 'sub-decoration', status: 'published' },
    { id: '23', name: 'Lampe de chevet "Wouri"', price: 13500, imageUrls: ['https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=1974&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Lampe de chevet au design moderne avec une base en bois local.", reviews: [], stock: 22, categoryId: 'sub-decoration', status: 'published' },
    { id: '24', name: 'Collier de perles', price: 9500, imageUrls: ['https://images.unsplash.com/photo-1599643477877-539eb8a52f18?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Collier artisanal fait de perles traditionnelles colorées.", reviews: [], stock: 30, categoryId: 'sub-bijoux', status: 'published' },
    { id: '25', name: 'Montre Classique Homme', price: 32000, imageUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Montre élégante avec bracelet en cuir, idéale pour le bureau ou les sorties.", reviews: [], stock: 12, categoryId: 'sub-montres', status: 'published' },
    { id: '26', name: 'Poupée "Penda"', price: 7000, imageUrls: ['https://images.unsplash.com/photo-1620243423599-da1c88a51e6c?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Poupée en tissu pagne, faite à la main, pour le bonheur des plus petits.", reviews: [], stock: 25, categoryId: 'sub-jouets-fournitures', status: 'published' },
    { id: '27', name: 'Lot de 10 Cahiers', price: 2500, imageUrls: ['https://images.unsplash.com/photo-1529142893173-665a0a1027c4?q=80&w=2070&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un lot de 10 cahiers de 100 pages pour la rentrée scolaire.", reviews: [], stock: 100, categoryId: 'sub-papeterie', status: 'published' },
    { id: '28', name: 'Bière "33" Export (Pack de 6)', price: 4000, imageUrls: ['https://www.bebe-cash.com/wp-content/uploads/2021/07/33-export.jpg'], vendor: 'Mama Africa', description: "La bière blonde de référence au Cameroun. Pack de 6 bouteilles de 65cl.", reviews: [], stock: 50, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '29', name: 'Café Arabica en Grains', price: 6000, imageUrls: ['https://images.unsplash.com/photo-1559449272-4d24b2f27b72?q=80&w=1974&auto=format&fit=crop'], vendor: 'Bafoussam Brews', description: "Café Arabica de l'Ouest Cameroun, torréfaction artisanale. Sachet de 500g.", reviews: [], stock: 30, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '30', name: 'Statuette en bois d\'ébène', price: 22000, imageUrls: ['https://i.pinimg.com/564x/7d/50/e0/7d50e0529d1ccf1b36952d76d4a52efc.jpg'], vendor: 'Limbe Arts & Crafts', description: "Statuette finement sculptée à la main par des artisans de la région du Sud-Ouest.", reviews: [], stock: 8, categoryId: 'sub-decoration', status: 'published' },
    { id: '31', name: 'Tableau d\'art contemporain', price: 48000, imageUrls: ['https://i.pinimg.com/564x/e7/7d/1f/e77d1f6d396a84c25f573453347f31b2.jpg'], vendor: 'Limbe Arts & Crafts', description: "Peinture sur toile vibrante, représentant une scène de marché local.", reviews: [], stock: 3, categoryId: 'sub-decoration', status: 'published' },
    { id: '32', name: 'Écouteurs sans fil', price: 12500, imageUrls: ['https://images.unsplash.com/photo-1606220588913-b35474623dc5?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kribi Digital', description: "Écouteurs Bluetooth avec une bonne autonomie et un son clair. Idéal pour la musique et les appels.", reviews: [], stock: 25, categoryId: 'sub-chargeurs-cables-batteries', status: 'draft' }, // In draft, store is pending
    { id: '33', name: 'Café Robusta Moulu', price: 4500, imageUrls: ['https://images.unsplash.com/photo-1611162458022-20c24b071a2a?q=80&w=2070&auto=format&fit=crop'], vendor: 'Bafoussam Brews', description: "Café Robusta puissant et aromatique, parfait pour un expresso corsé. Sachet de 500g.", reviews: [], stock: 40, categoryId: 'sub-autres-textiles', status: 'published' },
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
    { 
        id: 'store-6', name: 'Bafoussam Brews', logoUrl: 'https://cdn.dribbble.com/users/1586931/screenshots/3443128/coffee-logo-design.png', category: 'Alimentation & Boissons', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Bafoussam', neighborhood: 'Centre Ville', sellerFirstName: 'Pierre', sellerLastName: 'Kamdem', sellerPhone: '696543210',
        physicalAddress: 'Marché Central, Bafoussam', latitude: 5.4744, longitude: 10.4193, subscriptionStatus: 'active', subscriptionDueDate: '2024-09-01T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }]
    },
    { 
        id: 'store-7', name: 'Limbe Arts & Crafts', logoUrl: 'https://i.pinimg.com/736x/8a/9e/12/8a9e-1261a8779728283575647585355e.jpg', category: 'Artisanat & Décoration', warnings: [], status: 'active', premiumStatus: 'premium',
        location: 'Limbe', neighborhood: 'Down Beach', sellerFirstName: 'Sarah', sellerLastName: 'Eko', sellerPhone: '678901234',
        physicalAddress: 'Bord de mer, Limbe', latitude: 4.0165, longitude: 9.2131, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-25T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }, { name: "Registre de Commerce", status: 'verified', fileUrl: '...' }],
        stories: [{id: 's2', imageUrl: 'https://i.pinimg.com/564x/c7/2b/42/c72b429158221c97a552e67a145cb1d6.jpg', createdAt: new Date().toISOString() }]
    },
    { 
        id: 'store-8', name: 'Kribi Digital', logoUrl: 'https://static.vecteezy.com/system/resources/previews/007/618/856/non_2x/kd-logo-k-d-design-white-kd-letter-kd-letter-logo-design-initial-letter-kd-linked-circle-uppercase-monogram-logo-vector.jpg', category: 'Électronique', warnings: [], status: 'pending', premiumStatus: 'standard',
        location: 'Kribi', neighborhood: 'Centre', sellerFirstName: 'David', sellerLastName: 'Lobe', sellerPhone: '654321098',
        physicalAddress: 'Avenue des Banques, Kribi', latitude: 2.9431, longitude: 9.9077,
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

    const addStatusLog = (order: Order, status: OrderStatus, changedBy: string): Order => {
        const newLogEntry: StatusChangeLogEntry = {
            status,
            date: new Date().toISOString(),
            changedBy,
        };
        const updatedOrder = {
            ...order,
            status,
            statusChangeLog: [...(order.statusChangeLog || []), newLogEntry],
        };
         if (!order.trackingHistory.some(h => h.status === status)) {
            updatedOrder.trackingHistory = [...order.trackingHistory, { status, date: new Date().toISOString(), location: 'System', details: `Status changed to ${status} by ${changedBy}` }];
        }
        return updatedOrder;
    };


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

    const handleLoginSuccess = useCallback((loggedInUser: User) => {
        setIsLoginModalOpen(false); // Close modal
        switch (loggedInUser.role) {
            case 'superadmin':
                handleNavigate('superadmin-dashboard');
                break;
            case 'seller':
                handleNavigate('seller-dashboard');
                break;
            case 'delivery_agent':
                handleNavigate('delivery-agent-dashboard');
                break;
            case 'depot_agent':
                handleNavigate('depot-agent-dashboard');
                break;
            default:
                handleNavigate('home');
        }
    }, [handleNavigate]);

    const handleOrderConfirm = async (orderData: NewOrderData) => {
        const newOrder: Order = {
            ...orderData,
            id: `ORD-${Date.now().toString().slice(-6)}`,
            orderDate: new Date().toISOString(),
            status: 'confirmed',
            trackingNumber: `KZ${Date.now()}`,
            trackingHistory: [],
            statusChangeLog: []
        };
        const finalOrder = addStatusLog(newOrder, 'confirmed', user?.name || 'Customer');
        setAllOrders(prev => [...prev, finalOrder]);
        setSelectedOrder(finalOrder);
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

    const handleUpdateUser = useCallback((userId: string, updates: Partial<User>) => {
        setAllUsers(users => users.map(u => 
            u.id === userId ? { ...u, ...updates } : u
        ));
        logActivity('User Updated', `User profile for ID ${userId} was updated.`);
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

    const handleAssignAgent = useCallback((orderId: string, agentId: string) => {
        const agentName = allUsers.find(u => u.id === agentId)?.name || 'ID inconnu';
        setAllOrders(prevOrders => prevOrders.map(o =>
            o.id === orderId ? addStatusLog({ ...o, agentId }, o.status, `Admin: Assigner à ${agentName}`) : o
        ));
        logActivity('Agent Assigned', `Agent ${agentName} assigned to order ${orderId}.`);
    }, [setAllOrders, allUsers, logActivity]);


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
        setAllOrders(prev => prev.map(o =>
            o.id === order.id ? addStatusLog(o, status, user?.name || 'Admin') : o
        ));
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
                    ? addStatusLog({ ...o, refundReason: reason, refundEvidenceUrls: evidenceUrls }, 'refund-requested', user?.name || 'Customer')
                    : o
            )
        );
        logActivity('Refund Requested', `Refund requested for order ${orderId}. Reason: ${reason}. Evidence provided: ${evidenceUrls.length} files.`);
    }, [setAllOrders, logActivity, user]);

    const handleResolveRefund = useCallback((orderId: string, resolution: 'approved' | 'rejected') => {
        setAllOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const newStatus = resolution === 'approved' ? 'refunded' : o.status;
                const finalOrder = addStatusLog(o, newStatus, user?.name || 'Admin');
                logActivity(`Refund ${resolution}`, `Refund for order ${orderId} was ${resolution}.`);
                return finalOrder;
            }
            return o;
        }));
    }, [setAllOrders, logActivity, user]);

    const handleAdminStoreMessage = useCallback((orderId: string, message: string) => {
        setAllOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const newMessage: DisputeMessage = { author: 'admin', message, date: new Date().toISOString() };
                const newLog = [...(o.disputeLog || []), newMessage];
                logActivity('Dispute Message Sent', `Message sent to seller for order ${orderId}.`);
                return { ...o, disputeLog: newLog };
            }
            return o;
        }));
    }, [setAllOrders, logActivity]);

    const handleAdminCustomerMessage = useCallback((orderId: string, message: string) => {
        setAllOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const newMessage: DisputeMessage = { author: 'admin', message, date: new Date().toISOString() };
                const newLog = [...(o.disputeLog || []), newMessage];
                logActivity('Dispute Message Sent', `Message sent to customer for order ${orderId}.`);
                return { ...o, disputeLog: newLog };
            }
            return o;
        }));
    }, [setAllOrders, logActivity]);

    const handleCustomerDisputeMessage = useCallback((orderId: string, message: string) => {
        if (!user) return;
        setAllOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const newMessage: DisputeMessage = { author: 'customer', message, date: new Date().toISOString() };
                const newLog = [...(o.disputeLog || []), newMessage];
                logActivity('Dispute Reply Received', `Customer replied on order ${orderId}.`);
                return { ...o, disputeLog: newLog };
            }
            return o;
        }));
    }, [setAllOrders, logActivity, user]);

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
                if (user?.role === 'superadmin') return <SuperAdminDashboard allUsers={allUsers} allOrders={allOrders} allCategories={allCategories} allStores={allStores} siteActivityLogs={siteActivityLogs} onUpdateOrderStatus={handleUpdateOrderStatus} onUpdateCategoryImage={()=>{}} onWarnStore={handleWarnStore} onToggleStoreStatus={handleToggleStoreStatus} onToggleStorePremiumStatus={handleToggleStorePremiumStatus} onApproveStore={handleApproveStore} onRejectStore={handleRejectStore} onSaveFlashSale={()=>{}} flashSales={flashSales} allProducts={allProducts} onUpdateFlashSaleSubmissionStatus={()=>{}} onBatchUpdateFlashSaleStatus={()=>{}} onRequestDocument={()=>{}} onVerifyDocumentStatus={handleVerifyDocumentStatus} allPickupPoints={allPickupPoints} onAddPickupPoint={()=>{}} onUpdatePickupPoint={()=>{}} onDeletePickupPoint={()=>{}} onAssignAgent={handleAssignAgent} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onToggleChatFeature={() => setIsChatEnabled(p => !p)} onToggleComparisonFeature={() => setIsComparisonEnabled(p => !p)} siteSettings={siteSettings} onUpdateSiteSettings={setSiteSettings} onAdminAddCategory={handleAdminAddCategory} onAdminDeleteCategory={handleAdminDeleteCategory} onUpdateUser={handleUpdateUser} payouts={payouts} onPayoutSeller={handlePayoutSeller} onActivateSubscription={()=>{}} advertisements={advertisements} onAddAdvertisement={()=>{}} onUpdateAdvertisement={()=>{}} onDeleteAdvertisement={()=>{}} onCreateUserByAdmin={()=>{}} onSanctionAgent={handleSanctionAgent} onResolveRefund={handleResolveRefund} onAdminStoreMessage={handleAdminStoreMessage} onAdminCustomerMessage={handleAdminCustomerMessage} />;
                else handleNavigate('forbidden');
                break;
            case 'order-history': 
                if (user) return <OrderHistoryPage userOrders={allOrders.filter(o => o.userId === user.id)} onBack={() => handleNavigate('home')} onSelectOrder={(o) => { setSelectedOrder(o); handleNavigate('order-detail'); }} />;
                else handleNavigate('forbidden');
                break;
            case 'order-detail':
                if (selectedOrder) return <OrderDetailPage order={selectedOrder} onBack={() => handleNavigate('order-history')} allPickupPoints={allPickupPoints} onCancelOrder={()=>{}} onRequestRefund={handleRequestRefund} onCustomerDisputeMessage={handleCustomerDisputeMessage} />;
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
                if (user?.role === 'depot_agent') return <DepotAgentDashboard user={user} allOrders={allOrders} onCheckIn={()=>{}} onReportDiscrepancy={()=>{}} onLogout={handleLogout} />;
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
                onLoginSuccess={handleLoginSuccess}
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
            {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />}
            {viewingStoriesOfStore && <StoryViewer store={viewingStoriesOfStore} onClose={() => setViewingStoriesOfStore(null)} />}
            {promotionModalProduct && <PromotionModal product={promotionModalProduct} onClose={() => setPromotionModalProduct(null)} onSave={handleSavePromotion} />}
            {isComparisonEnabled && <ComparisonBar onCompareClick={() => handleNavigate('comparison')} />}
            {isChatEnabled && <ChatWidget allUsers={allUsers} allProducts={allProducts} allCategories={allCategories} />}
        </div>
    );
}