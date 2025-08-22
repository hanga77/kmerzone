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
import { useAuth } from './contexts/AuthContext';
import { useComparison } from './contexts/ComparisonContext';
import type { Product, Category, Store, Review, Order, Address, OrderStatus, User, SiteActivityLog, FlashSale, DocumentStatus, PickupPoint, NewOrderData, TrackingEvent, PromoCode, Warning, SiteSettings, CartItem, UserRole, Payout, Advertisement, Discrepancy } from './types';
import AddToCartModal from './components/AddToCartModal';
import { useUI } from './contexts/UIContext';
import PromotionModal from './components/PromotionModal';
import { useCart } from './contexts/CartContext';
import ChatWidget from './components/ChatWidget';
import { ArrowLeftIcon, BarChartIcon, ShieldCheckIcon, CurrencyDollarIcon, ShoppingBagIcon, UsersIcon, StarIcon } from './components/Icons';
import { usePersistentState } from './hooks/usePersistentState';

type Page = 'home' | 'product' | 'cart' | 'checkout' | 'order-success' | 'stores' | 'become-seller' | 'category' | 'seller-dashboard' | 'vendor-page' | 'product-form' | 'seller-profile' | 'superadmin-dashboard' | 'order-history' | 'order-detail' | 'promotions' | 'flash-sales' | 'search-results' | 'wishlist' | 'delivery-agent-dashboard' | 'depot-agent-dashboard' | 'comparison' | 'become-premium' | 'analytics-dashboard' | 'review-moderation' | 'info' | 'not-found';

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

const AnalyticsDashboard: React.FC<{ onBack: () => void; allOrders: Order[]; allProducts: Product[]; allStores: Store[]; allUsers: User[] }> = ({ onBack, allOrders, allProducts, allStores, allUsers }) => {
    const analytics = useMemo(() => {
        const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
        const totalCustomers = allUsers.filter(u => u.role === 'customer').length;
        const averageOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

        const topProducts = deliveredOrders
            .flatMap(o => o.items)
            .reduce((acc, item) => {
                acc[item.id] = (acc[item.id] || 0) + item.price * item.quantity;
                return acc;
            }, {} as Record<string, number>);
        
        const sortedTopProducts = Object.entries(topProducts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id, revenue]) => ({ product: allProducts.find(p => p.id === id), revenue }));

        const salesByCategory = deliveredOrders
            .flatMap(o => o.items)
            .reduce((acc, item) => {
                acc[item.category] = (acc[item.category] || 0) + item.price * item.quantity;
                return acc;
            }, {} as Record<string, number>);
        
        const sortedSalesByCategory = Object.entries(salesByCategory).sort(([, a], [, b]) => b - a);
        
        const salesByStore = deliveredOrders
            .flatMap(o => o.items.map(item => ({ vendor: item.vendor, amount: item.price * item.quantity })))
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
    }, [allOrders, allProducts, allUsers]);

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

const initialProducts: Product[] = [
    { 
      id: '1', name: 'Ndolé Royal', price: 3500, promotionPrice: 3000, imageUrls: [], vendor: 'Mama Africa', 
      description: "Le plat national du Cameroun, un délicieux mélange de légumes, d'arachides et de viande ou de poisson. Préparé avec amour par Mama Africa.",
      reviews: [
        {author: "Jean P.", rating: 5, comment: "Incroyable ! Comme celui de ma grand-mère.", date: "2023-10-10", status: 'approved'},
        {author: "Marie C.", rating: 4, comment: "Très bon, mais j'aurais aimé un peu plus de crevettes.", date: "2024-07-15", status: 'pending'}
      ],
      stock: 15, category: 'Alimentation alimentaire', status: 'published',
      brand: 'Mama Africa Cuisine', weight: '500g', expirationDate: '2024-12-31'
    },
    { 
      id: '101', name: 'Ndolé Royal', price: 3200, imageUrls: [], vendor: 'Douala Soaps', // Same product, different vendor
      description: "Le plat national du Cameroun, version spéciale de Douala Soaps.",
      reviews: [{author: "Test T.", rating: 4, comment: "Très bon aussi!", date: "2023-11-11", status: 'approved'}],
      stock: 10, category: 'Alimentation alimentaire', status: 'published',
      brand: 'Douala Cuisine', weight: '450g', expirationDate: '2024-12-25'
    },
    { 
      id: '2', name: 'Robe en Tissu Pagne', price: 15000, imageUrls: [], vendor: 'Kmer Fashion',
      description: "Une robe élégante confectionnée à la main avec du tissu pagne de haute qualité. Parfaite pour toutes les occasions.",
      reviews: [{author: "Aïcha B.", rating: 4, comment: "Très belles couleurs, mais la taille est un peu juste.", date: "2023-10-11", status: 'approved'}],
      stock: 0, category: 'Vêtements', status: 'published',
      variants: [
        { name: 'Taille', options: ['S', 'M', 'L', 'XL'] },
        { name: 'Couleur', options: ['Bleu', 'Rouge', 'Vert'] }
      ],
      variantDetails: [
        { options: { 'Taille': 'S', 'Couleur': 'Bleu' }, stock: 2, price: 15000 },
        { options: { 'Taille': 'M', 'Couleur': 'Bleu' }, stock: 3, price: 15000 },
        { options: { 'Taille': 'L', 'Couleur': 'Bleu' }, stock: 1, price: 15000 },
        { options: { 'Taille': 'S', 'Couleur': 'Rouge' }, stock: 4, price: 15500 },
        { options: { 'Taille': 'M', 'Couleur': 'Rouge' }, stock: 0, price: 15500 },
        { options: { 'Taille': 'L', 'Couleur': 'Rouge' }, stock: 2, price: 15500 },
        { options: { 'Taille': 'XL', 'Couleur': 'Vert' }, stock: 2, price: 16000 },
      ],
      brand: 'Kmer Fashion', material: 'Coton (Pagne)', gender: 'Femme'
    },
    { 
      id: '3', name: 'Savon de Marseille (Local)', price: 1500, imageUrls: [], vendor: 'Douala Soaps',
      description: "Un savon artisanal fabriqué localement selon la méthode traditionnelle. Doux pour la peau et respectueux de l'environnement.",
      reviews: [
        {author: "Client Anonyme", rating: 1, comment: "Ce produit est une arnaque, ne fonctionne pas du tout.", date: "2024-07-20", status: 'pending'}
      ], 
      stock: 50, category: 'Chimie domestique et hygiène', status: 'published',
      brand: 'Douala Soaps', weight: '150g', material: 'Huile végétale', productionDate: '2023-01-15'
    },
    { 
      id: '4', name: 'Smartphone Tecno Spark', price: 75000, promotionPrice: 69900, imageUrls: [], vendor: 'Electro Plus',
      description: "Un smartphone performant avec un excellent rapport qualité-prix. Idéal pour un usage quotidien, avec un grand écran et une bonne autonomie.",
      reviews: [{author: "Eric K.", rating: 5, comment: "Super téléphone pour le prix, je recommande.", date: "2023-10-12", status: 'approved'}],
      stock: 4, category: 'Électronique', status: 'published',
      brand: 'Tecno', dimensions: '164 x 76 x 9 mm', weight: '190g', serialNumber: 'TEC-SPK-2023-XYZ123',
      promotionStartDate: '2024-07-01', promotionEndDate: '2024-07-31',
    },
    { 
      id: '5', name: 'Miel d\'Oku', price: 5000, imageUrls: [], vendor: 'Mama Africa',
      description: "Un miel blanc rare et primé, récolté sur les flancs du mont Oku. Connu pour ses propriétés médicinales et son goût unique.",
      reviews: [{author: "Fatima G.", rating: 5, comment: "Le meilleur miel que j'ai jamais goûté.", date: "2023-10-13", status: 'approved'}],
      stock: 25, category: 'Alimentation alimentaire', status: 'published',
       brand: 'Oku Honey', weight: '250ml', expirationDate: '2026-01-01'
    },
     { 
      id: '6', name: 'Sandales en cuir', price: 8000, imageUrls: [], vendor: 'Kmer Fashion',
      description: "Sandales en cuir véritable, faites à la main. Confortables et durables.",
      reviews: [], stock: 10, category: 'Chaussures', status: 'draft',
      brand: 'Kmer Fashion', material: 'Cuir', gender: 'Unisexe'
    },
    // More products for Mama Africa
    { 
      id: '7', name: 'Poulet DG', price: 6500, imageUrls: [], vendor: 'Mama Africa',
      description: "Un plat de fête succulent avec du poulet frit, des plantains et une sauce riche en légumes. Un régal pour les papilles.",
      reviews: [], stock: 12, category: 'Alimentation alimentaire', status: 'published',
      brand: 'Mama Africa Cuisine', weight: '750g'
    },
    { 
      id: '8', name: 'Jus de Bissap', price: 1000, imageUrls: [], vendor: 'Mama Africa',
      description: "Boisson rafraîchissante et naturelle à base de fleurs d'hibiscus, sucrée juste comme il faut.",
      reviews: [], stock: 30, category: 'Alimentation alimentaire', status: 'published',
      brand: 'Mama Africa Drinks', weight: '500ml'
    },
    { 
      id: '9', name: 'Beignets Haricots Bouillie', price: 1500, imageUrls: [], vendor: 'Mama Africa',
      description: "Le petit-déjeuner ou goûter camerounais par excellence. Des beignets soufflés accompagnés d'une purée de haricots et de bouillie de maïs.",
      reviews: [], stock: 20, category: 'Alimentation alimentaire', status: 'published',
      brand: 'Mama Africa Cuisine', weight: '400g'
    },
    // More products for Kmer Fashion
    { 
      id: '10', name: 'Chemise en Toghu', price: 25000, imageUrls: [], vendor: 'Kmer Fashion',
      description: "Chemise de cérémonie pour homme, en velours noir brodé avec les motifs colorés traditionnels du Toghu.",
      reviews: [], stock: 5, category: 'Vêtements', status: 'published',
      variants: [{ name: 'Taille', options: ['M', 'L', 'XL', 'XXL'] }],
      brand: 'Kmer Fashion', material: 'Velours, fil de coton', gender: 'Homme'
    },
    { 
      id: '11', name: 'Ensemble Boubou Pagne', price: 35000, imageUrls: [], vendor: 'Kmer Fashion',
      description: "Un ensemble boubou ample et confortable, confectionné dans un tissu pagne aux motifs vibrants. Idéal pour un look élégant et décontracté.",
      reviews: [], stock: 7, category: 'Vêtements', status: 'published',
      variants: [{ name: 'Couleur', options: ['Jaune', 'Violet', 'Indigo'] }],
      brand: 'Kmer Fashion', material: 'Coton (Pagne)', gender: 'Femme'
    },
    { 
      id: '12', name: 'Sac à main en pagne', price: 12000, imageUrls: [], vendor: 'Kmer Fashion',
      description: "Accessoirisez votre tenue avec ce magnifique sac à main fait main, alliant cuir et tissu pagne.",
      reviews: [], stock: 15, category: 'Accessoires', status: 'published',
      brand: 'Kmer Fashion', material: 'Cuir, Coton (Pagne)', gender: 'Femme'
    },
    // More products for Electro Plus
    { 
      id: '13', name: 'Téléviseur LED 32"', price: 85000, imageUrls: [], vendor: 'Electro Plus',
      description: "Un téléviseur LED de 32 pouces avec une image de haute qualité et des ports HDMI et USB pour tous vos divertissements.",
      reviews: [], stock: 9, category: 'Électronique', status: 'published',
      brand: 'Generic TV', dimensions: '73 x 43 x 8 cm', shippingCost: 5000
    },
    { 
      id: '14', name: 'Fer à repasser à sec', price: 7500, imageUrls: [], vendor: 'Electro Plus',
      description: "Simple, efficace et durable. Ce fer à repasser à sec est parfait pour un usage quotidien.",
      reviews: [], stock: 25, category: 'Appareils électroménagers', status: 'published',
      brand: 'Generic Home', weight: '1.2kg'
    },
    { 
      id: '15', name: 'Blender / Mixeur', price: 18000, imageUrls: [], vendor: 'Electro Plus',
      description: "Un mixeur puissant pour préparer vos jus de fruits, soupes et sauces en un clin d'œil. Bol en plastique robuste de 1.5L.",
      reviews: [], stock: 18, category: 'Appareils électroménagers', status: 'published',
      brand: 'Generic Kitchen', dimensions: '20 x 20 x 40 cm', shippingCost: 2000
    },
    // More products for Douala Soaps
    { 
      id: '16', name: 'Savon noir gommant', price: 2500, imageUrls: [], vendor: 'Douala Soaps',
      description: "Savon noir africain enrichi aux herbes locales pour un gommage naturel et une peau douce et purifiée.",
      reviews: [], stock: 40, category: 'Chimie domestique et hygiène', status: 'published',
      brand: 'Douala Soaps', weight: '200g', material: 'Cendres de plantes, huiles végétales'
    },
    { 
      id: '17', name: 'Huile de coco vierge', price: 4000, imageUrls: [], vendor: 'Douala Soaps',
      description: "Huile de coco 100% pure et pressée à froid. Idéale pour les soins de la peau, des cheveux et pour la cuisson.",
      reviews: [], stock: 30, category: 'Beauté et santé', status: 'published',
      brand: 'Douala Soaps', weight: '250ml'
    },
     { 
      id: '18', name: 'Beurre de karité', price: 3000, imageUrls: [], vendor: 'Douala Soaps',
      description: "Beurre de karité brut et non raffiné, parfait pour hydrater en profondeur la peau et les cheveux secs.",
      reviews: [], stock: 60, category: 'Beauté et santé', status: 'published',
      brand: 'Douala Soaps', weight: '150g'
    }
];

const initialCategories: Category[] = [
    { id: '1', name: 'Alimentation alimentaire', imageUrl: 'https://picsum.photos/seed/food/400/300' },
    { id: '2', name: 'Vêtements', imageUrl: 'https://picsum.photos/seed/fashion/400/300' },
    { id: '3', name: 'Chimie domestique et hygiène', imageUrl: 'https://picsum.photos/seed/soap/400/300' },
    { id: '4', name: 'Électronique', imageUrl: 'https://picsum.photos/seed/electronics/400/300' },
    { id: '5', name: 'Beauté et santé', imageUrl: 'https://picsum.photos/seed/beauty/400/300' },
    { id: '6', name: 'Appareils électroménagers', imageUrl: 'https://picsum.photos/seed/appliances/400/300' },
    { id: '7', name: 'Accessoires', imageUrl: 'https://picsum.photos/seed/accessories/400/300' },
    { id: '8', name: 'Chaussures', imageUrl: 'https://picsum.photos/seed/shoes/400/300' },
];

const initialStores: Store[] = [
    { 
        id: 'store-1', name: 'Kmer Fashion', logoUrl: '', category: 'Mode et Vêtements', warnings: [], status: 'active', premiumStatus: 'premium',
        location: 'Douala', neighborhood: 'Akwa', sellerFirstName: 'Aïcha', sellerLastName: 'Bakari', sellerPhone: '699887766',
        physicalAddress: '45 Avenue de la Mode, Akwa', latitude: 4.0483, longitude: 9.7020, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-15T00:00:00.000Z',
        documents: [
            { name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' },
            { name: "Registre de Commerce", status: 'uploaded', fileUrl: '...' },
        ],
        stories: [{id: 's1', imageUrl: 'https://picsum.photos/seed/story1/300/500', createdAt: new Date().toISOString() }]
    },
    { 
        id: 'store-2', name: 'Mama Africa', logoUrl: '', category: 'Alimentation', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Bastos', sellerFirstName: 'Jeanne', sellerLastName: 'Abena', sellerPhone: '677665544',
        physicalAddress: '12 Rue des Saveurs, Bastos', latitude: 3.8968, longitude: 11.5213, subscriptionStatus: 'overdue', subscriptionDueDate: '2024-07-10T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'requested' }]
    },
    { 
        id: 'store-3', name: 'Electro Plus', logoUrl: '', category: 'Électronique', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Mokolo', sellerFirstName: 'Paul', sellerLastName: 'Kouam', sellerPhone: '655443322',
        physicalAddress: 'Grand Marché Mokolo, Stand 52', latitude: 3.8731, longitude: 11.5152, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-20T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }]
    },
    { 
        id: 'store-4', name: 'Douala Soaps', logoUrl: '', category: 'Beauté et Hygiène', warnings: [], status: 'suspended', premiumStatus: 'standard',
        location: 'Douala', neighborhood: 'Bonapriso', sellerFirstName: 'Céline', sellerLastName: 'Ngassa', sellerPhone: '691234567',
        physicalAddress: 'Rue Njo-Njo, Bonapriso', latitude: 4.0321, longitude: 9.715, subscriptionStatus: 'inactive',
        documents: [{ name: "Registre de Commerce", status: 'rejected', rejectionReason: 'Document illisible.' }]
    },
     { 
        id: 'store-5', name: 'Yaoundé Style', logoUrl: '', category: 'Mode et Vêtements', warnings: [], status: 'pending', premiumStatus: 'standard',
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
  maintenanceMode: {
      isEnabled: false,
      message: "Nous effectuons une mise à jour. Nous serons de retour très bientôt !",
      reopenDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  }
};

const initialAdvertisements: Advertisement[] = [
    { id: 'ad1', imageUrl: 'https://picsum.photos/seed/ad1/1200/300', linkUrl: '#', location: 'homepage-banner', isActive: true },
    { id: 'ad2', imageUrl: 'https://picsum.photos/seed/ad2/1200/300', linkUrl: '#', location: 'homepage-banner', isActive: true },
];

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [infoPageContent, setInfoPageContent] = useState({ title: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [siteSettings, setSiteSettings] = usePersistentState<SiteSettings>('siteSettings', initialSiteSettings);

  const [allProducts, setAllProducts] = usePersistentState<Product[]>('allProducts', initialProducts);
  const [allCategories, setAllCategories] = usePersistentState<Category[]>('allCategories', initialCategories);
  const [allStores, setAllStores] = usePersistentState<Store[]>('allStores', initialStores);
  const [allOrders, setAllOrders] = usePersistentState<Order[]>('allOrders', []);
  const [allPromoCodes, setAllPromoCodes] = usePersistentState<PromoCode[]>('allPromoCodes', []);
  const [siteActivityLogs, setSiteActivityLogs] = usePersistentState<SiteActivityLog[]>('siteActivityLogs', []);
  const [flashSales, setFlashSales] = usePersistentState<FlashSale[]>('flashSales', initialFlashSales);
  const [allPickupPoints, setAllPickupPoints] = usePersistentState<PickupPoint[]>('allPickupPoints', initialPickupPoints);
  const [payouts, setPayouts] = usePersistentState<Payout[]>('allPayouts', []);
  const [advertisements, setAdvertisements] = usePersistentState<Advertisement[]>('advertisements', initialAdvertisements);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isChatEnabled, setIsChatEnabled] = usePersistentState('isChatEnabled', true);
  const [isComparisonEnabled, setIsComparisonEnabled] = usePersistentState('isComparisonEnabled', true);
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);
  
  const { user, allUsers, setAllUsers } = useAuth();
  const { clearCart } = useCart();
  const comparison = useComparison();
  const { modalProduct, isModalOpen, closeModal } = useUI();
  
  useEffect(() => {
    comparison.setProducts(allProducts);
  }, [allProducts, comparison.setProducts]);
  
  const addLog = useCallback((action: string, details: string) => {
    if (!user) return;
    const newLog: SiteActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: { id: user.id, name: user.name, role: user.role },
      action,
      details,
    };
    setSiteActivityLogs(prev => [newLog, ...prev]);
  }, [user, setSiteActivityLogs]);

  const handleCreateUserByAdmin = useCallback((userData: Omit<User, 'id' | 'loyalty'>) => {
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`,
      loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
    };
    setAllUsers(prev => [...prev, newUser]);
    if(user && user.role === 'superadmin') {
      addLog('User Created', `Admin ${user.name} created user ${newUser.name} with role ${newUser.role}.`);
    }
  }, [setAllUsers, addLog, user]);

  const handleReportDiscrepancy = useCallback((orderId: string, reason: string) => {
      if (!user) return;
      setAllOrders(prevOrders => prevOrders.map(o => {
          if (o.id === orderId) {
              addLog('Order Issue Reported', `Depot agent ${user.name} reported issue for order ${orderId}: ${reason}`);
              return {
                  ...o,
                  status: 'depot-issue',
                  discrepancy: {
                      reason,
                      reportedAt: new Date().toISOString(),
                      reportedBy: user.id
                  }
              };
          }
          return o;
      }));
  }, [setAllOrders, addLog, user]);


  if (siteSettings.maintenanceMode.isEnabled && user?.role !== 'superadmin') {
      return <MaintenancePage message={siteSettings.maintenanceMode.message} reopenDate={siteSettings.maintenanceMode.reopenDate} />;
  }
  
  const renderPage = () => {
    switch(page) {
      case 'home': return <HomePage categories={allCategories} products={allProducts} stores={allStores} flashSales={flashSales} advertisements={advertisements} onProductClick={(p) => { setSelectedProduct(p); setPage('product'); }} onCategoryClick={(c) => { setSelectedCategory(c); setPage('category'); }} onVendorClick={(v) => { setSelectedVendor(v); setPage('vendor-page'); }} onVisitStore={(v) => { setSelectedVendor(v); setPage('vendor-page'); }} isComparisonEnabled={isComparisonEnabled}/>;
      case 'product': return selectedProduct && <ProductDetail product={selectedProduct} allProducts={allProducts} allUsers={allUsers} stores={allStores} flashSales={flashSales} onBack={() => { setSelectedProduct(null); setPage(selectedCategory ? 'category' : (searchQuery ? 'search-results' : 'home')); }} onAddReview={(productId, review) => {setAllProducts(products => products.map(p => p.id === productId ? {...p, reviews: [...p.reviews, review]} : p))}} onVendorClick={(v) => { setSelectedVendor(v); setPage('vendor-page'); }} onProductClick={(p) => setSelectedProduct(p)} onOpenLogin={() => setIsLoginOpen(true)} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} />;
      case 'cart': return <CartView onBack={() => setPage('home')} onNavigateToCheckout={() => setPage('checkout')} flashSales={flashSales} allPromoCodes={allPromoCodes} appliedPromoCode={appliedPromoCode} onApplyPromoCode={setAppliedPromoCode} />;
      case 'checkout': return <Checkout onBack={() => setPage('cart')} onOrderConfirm={async (orderData) => { const newOrder: Order = { ...orderData, id: `CMD-${new Date().getTime()}`, orderDate: new Date().toISOString(), status: 'confirmed', trackingHistory: [{status: 'confirmed', date: new Date().toISOString(), location: 'Plateforme', details: 'Commande confirmée et en attente de préparation.'}], trackingNumber: `KZ${Date.now()}`}; setAllOrders(prev => [newOrder, ...prev]); clearCart(); setAppliedPromoCode(null); setPage('order-success'); }} flashSales={flashSales} allPickupPoints={allPickupPoints} appliedPromoCode={appliedPromoCode} allStores={allStores}/>;
      case 'order-success': return <OrderSuccess onNavigateHome={() => setPage('home')} onNavigateToOrders={() => setPage('order-history')} />;
      case 'stores': return <StoresPage stores={allStores} onBack={() => setPage('home')} onVisitStore={(v) => { setSelectedVendor(v); setPage('vendor-page'); }} />;
      case 'become-seller': return <BecomeSeller onBack={() => setPage('home')} onBecomeSeller={(shopName, location, neighborhood, sellerFirstName, sellerLastName, sellerPhone, physicalAddress, logoUrl, latitude, longitude) => { const newStore: Store = { id: `store-${Date.now()}`, name: shopName, logoUrl, category: 'Divers', warnings: [], status: 'pending', premiumStatus: 'standard', location, neighborhood, sellerFirstName, sellerLastName, sellerPhone, physicalAddress, latitude, longitude, documents: siteSettings.requiredSellerDocuments['CNI (Carte Nationale d\'Identité)'] ? [{name: "CNI (Carte Nationale d'Identité)", status: 'requested'}] : [] }; setAllStores(prev => [...prev, newStore]); }} onRegistrationSuccess={() => setPage('home')} siteSettings={siteSettings} />;
      case 'category': return selectedCategory && <CategoryPage categoryName={selectedCategory} allProducts={allProducts} allStores={allStores} flashSales={flashSales} onProductClick={(p) => { setSelectedProduct(p); setPage('product'); }} onBack={() => { setSelectedCategory(null); setPage('home'); }} onVendorClick={(v) => { setSelectedVendor(v); setPage('vendor-page'); }} isComparisonEnabled={isComparisonEnabled}/>;
      case 'seller-dashboard': return user?.shopName && <SellerDashboard store={allStores.find(s=>s.name === user.shopName)} products={allProducts.filter(p => p.vendor === user.shopName)} categories={allCategories} flashSales={flashSales} sellerOrders={allOrders.filter(o => o.items.some(i => i.vendor === user.shopName))} promoCodes={allPromoCodes.filter(pc => pc.sellerId === user.id)} onBack={() => setPage('home')} onAddProduct={() => setPage('product-form')} onEditProduct={(p) => { setSelectedProduct(p); setPage('product-form'); }} onDeleteProduct={(id) => setAllProducts(products => products.filter(p => p.id !== id))} onToggleStatus={(id) => setAllProducts(products => products.map(p => p.id === id ? {...p, status: p.status === 'published' ? 'draft' : 'published'} : p))} onNavigateToProfile={() => setPage('seller-profile')} onSetPromotion={(p) => setSelectedProduct(p)} onRemovePromotion={(id) => setAllProducts(products => products.map(p => p.id === id ? {...p, promotionPrice: undefined} : p))} onProposeForFlashSale={(flashSaleId, productId, flashPrice, sellerShopName) => { setFlashSales(prev => prev.map(fs => fs.id === flashSaleId ? {...fs, products: [...fs.products, {productId, flashPrice, sellerShopName, status: 'pending'}]} : fs)); }} onUploadDocument={(storeId, documentName, fileUrl) => { setAllStores(stores => stores.map(s => s.id === storeId ? {...s, documents: s.documents.map(d => d.name === documentName ? {...d, status: 'uploaded', fileUrl} : d)} : s)); }} onUpdateOrderStatus={(orderId, status) => setAllOrders(orders => orders.map(o => o.id === orderId ? {...o, status} : o))} onCreatePromoCode={(codeData) => setAllPromoCodes(prev => [...prev, {...codeData, uses: 0}])} onDeletePromoCode={(code) => setAllPromoCodes(prev => prev.filter(c => c.code !== code))} isChatEnabled={isChatEnabled} onPayRent={(storeId) => { setAllStores(stores => stores.map(s => s.id === storeId ? {...s, subscriptionStatus: 'active', subscriptionDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()} : s)); alert('Paiement du loyer effectué !'); }} siteSettings={siteSettings} />;
      case 'vendor-page': return selectedVendor && <VendorPage vendorName={selectedVendor} allProducts={allProducts} allStores={allStores} flashSales={flashSales} onProductClick={(p) => { setSelectedProduct(p); setPage('product'); }} onBack={() => { setSelectedVendor(null); setPage('stores'); }} onVendorClick={(v) => setSelectedVendor(v)} isComparisonEnabled={isComparisonEnabled} />;
      case 'product-form': return <ProductForm onSave={(p) => { setAllProducts(products => { const exists = products.some(prod => prod.id === p.id); return exists ? products.map(prod => prod.id === p.id ? p : prod) : [...products, p]; }); setSelectedProduct(null); setPage('seller-dashboard'); }} onCancel={() => { setSelectedProduct(null); setPage('seller-dashboard'); }} productToEdit={selectedProduct} categories={allCategories} onAddCategory={(name) => {const newCat = {id: `cat-${Date.now()}`, name, imageUrl: ''}; setAllCategories(cats => [...cats, newCat]); return newCat;}} />;
      case 'seller-profile': return user?.shopName && <SellerProfile store={allStores.find(s => s.name === user.shopName)!} onBack={() => setPage('seller-dashboard')} onUpdateProfile={(storeId, updatedData) => {setAllStores(stores => stores.map(s => s.id === storeId ? {...s, name: updatedData.shopName, location: updatedData.location, logoUrl: updatedData.logoUrl} : s)); setAllUsers(users => users.map(u => u.id === user.id ? {...u, shopName: updatedData.shopName} : u))}} />;
      case 'superadmin-dashboard': return <SuperAdminDashboard allUsers={allUsers} allOrders={allOrders} allCategories={allCategories} allStores={allStores} siteActivityLogs={siteActivityLogs} onUpdateOrderStatus={(orderId, status) => setAllOrders(orders => orders.map(o => o.id === orderId ? {...o, status} : o))} onUpdateCategoryImage={(catId, url) => setAllCategories(cats => cats.map(c => c.id === catId ? {...c, imageUrl: url} : c))} onWarnStore={(storeId, reason) => { const newWarning: Warning = { id: `warn-${Date.now()}`, date: new Date().toISOString(), reason }; setAllStores(stores => stores.map(s => s.id === storeId ? {...s, warnings: [...s.warnings, newWarning]} : s)); }} onToggleStoreStatus={(storeId) => setAllStores(stores => stores.map(s => s.id === storeId ? {...s, status: s.status === 'active' ? 'suspended' : 'active'} : s))} onToggleStorePremiumStatus={(storeId) => setAllStores(stores => stores.map(s => s.id === storeId ? {...s, premiumStatus: s.premiumStatus === 'premium' ? 'standard' : 'premium'} : s))} onApproveStore={(storeId) => setAllStores(stores => stores.map(s => s.id === storeId ? {...s, status: 'active'} : s))} onRejectStore={(storeId) => setAllStores(stores => stores.filter(s => s.id !== storeId))} onSaveFlashSale={(data) => {const newFS: FlashSale = {...data, id: `fs-${Date.now()}`, products: []}; setFlashSales(fs => [...fs, newFS]);}} flashSales={flashSales} allProducts={allProducts} onUpdateFlashSaleSubmissionStatus={(flashSaleId, productId, status) => { setFlashSales(prev => prev.map(fs => fs.id === flashSaleId ? {...fs, products: fs.products.map(p => p.productId === productId ? {...p, status} : p)} : fs)); }} onBatchUpdateFlashSaleStatus={(flashSaleId, productIds, status) => { setFlashSales(prev => prev.map(fs => fs.id === flashSaleId ? {...fs, products: fs.products.map(p => productIds.includes(p.productId) ? {...p, status} : p)} : fs)) }} onRequestDocument={(storeId, documentName) => setAllStores(stores => stores.map(s => s.id === storeId ? {...s, documents: [...s.documents, {name: documentName, status: 'requested'}]} : s))} onVerifyDocumentStatus={(storeId, docName, status, reason) => setAllStores(stores => stores.map(s => s.id === storeId ? {...s, documents: s.documents.map(d => d.name === docName ? {...d, status, rejectionReason: reason} : d)} : s))} allPickupPoints={allPickupPoints} onAddPickupPoint={(data) => setAllPickupPoints(prev => [...prev, {...data, id: `pp-${Date.now()}`}])} onUpdatePickupPoint={(point) => setAllPickupPoints(prev => prev.map(p => p.id === point.id ? point : p))} onDeletePickupPoint={(id) => setAllPickupPoints(prev => prev.filter(p => p.id !== id))} onAssignAgent={(orderId, agentId) => setAllOrders(orders => orders.map(o => o.id === orderId ? {...o, agentId} : o))} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onToggleChatFeature={() => setIsChatEnabled(e => !e)} onToggleComparisonFeature={() => setIsComparisonEnabled(e => !e)} siteSettings={siteSettings} onUpdateSiteSettings={setSiteSettings} onAdminAddCategory={(name) => {const newCat = {id: `cat-${Date.now()}`, name, imageUrl: ''}; setAllCategories(cats => [...cats, newCat]);}} onAdminDeleteCategory={(id) => setAllCategories(cats => cats.filter(c => c.id !== id))} onUpdateUserRole={(userId, role) => setAllUsers(users => users.map(u => u.id === userId ? {...u, role} : u))} payouts={payouts} onPayoutSeller={(storeId, amount) => { setPayouts(prev => [...prev, {storeId, amount, date: new Date().toISOString()}]); alert(`Paiement de ${amount} FCFA effectué.`); }} onActivateSubscription={(storeId) => setAllStores(stores => stores.map(s => s.id === storeId ? {...s, subscriptionStatus: 'active', subscriptionDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()} : s))} advertisements={advertisements} onAddAdvertisement={(ad) => setAdvertisements(prev => [...prev, {...ad, id: `ad-${Date.now()}`}])} onUpdateAdvertisement={(ad) => setAdvertisements(prev => prev.map(a => a.id === ad.id ? ad : a))} onDeleteAdvertisement={(id) => setAdvertisements(prev => prev.filter(a => a.id !== id))} onCreateUserByAdmin={handleCreateUserByAdmin} />;
      case 'order-history': return <OrderHistoryPage userOrders={allOrders.filter(o => o.userId === user?.id)} onBack={() => setPage('home')} onSelectOrder={(o) => {setSelectedOrder(o); setPage('order-detail');}} />;
      case 'order-detail': return selectedOrder && <OrderDetailPage order={selectedOrder} onBack={() => {setSelectedOrder(null); setPage('order-history');}} allPickupPoints={allPickupPoints} onCancelOrder={(id) => {setAllOrders(orders => orders.map(o => o.id === id ? {...o, status: 'cancelled'} : o)); setSelectedOrder(null); setPage('order-history')}} onRequestRefund={(id, reason) => {setAllOrders(orders => orders.map(o => o.id === id ? {...o, status: 'refund-requested', refundReason: reason} : o)); setSelectedOrder(o => ({...o!, status: 'refund-requested'}));}} />;
      case 'promotions': return <PromotionsPage allProducts={allProducts} allStores={allStores} flashSales={flashSales} onProductClick={(p) => { setSelectedProduct(p); setPage('product'); }} onBack={() => setPage('home')} onVendorClick={(v) => { setSelectedVendor(v); setPage('vendor-page'); }} isComparisonEnabled={isComparisonEnabled}/>;
      case 'flash-sales': return <FlashSalesPage allProducts={allProducts} allStores={allStores} flashSales={flashSales} onProductClick={(p) => { setSelectedProduct(p); setPage('product'); }} onBack={() => setPage('home')} onVendorClick={(v) => { setSelectedVendor(v); setPage('vendor-page'); }} isComparisonEnabled={isComparisonEnabled}/>;
      case 'search-results': return <SearchResultsPage searchQuery={searchQuery} allProducts={allProducts} allStores={allStores} flashSales={flashSales} onProductClick={(p) => { setSelectedProduct(p); setPage('product'); }} onBack={() => setPage('home')} onVendorClick={(v) => { setSelectedVendor(v); setPage('vendor-page'); }} isComparisonEnabled={isComparisonEnabled}/>;
      case 'wishlist': return <WishlistPage allProducts={allProducts} allStores={allStores} flashSales={flashSales} onProductClick={(p) => { setSelectedProduct(p); setPage('product'); }} onBack={() => setPage('home')} onVendorClick={(v) => { setSelectedVendor(v); setPage('vendor-page'); }} isComparisonEnabled={isComparisonEnabled}/>;
      case 'delivery-agent-dashboard': return <DeliveryAgentDashboard allOrders={allOrders} allStores={allStores} allPickupPoints={allPickupPoints} onUpdateOrderStatus={(orderId, status) => setAllOrders(orders => orders.map(o => o.id === orderId ? {...o, status} : o))} />;
      case 'depot-agent-dashboard': return <DepotAgentDashboard allOrders={allOrders} onCheckIn={(orderId, storageLocationId) => { setAllOrders(orders => orders.map(o => o.id === orderId ? {...o, status: 'at-depot', storageLocationId, checkedInAt: new Date().toISOString(), checkedInBy: user?.id} : o)); }} onReportDiscrepancy={handleReportDiscrepancy} />;
      case 'comparison': return <ComparisonPage onBack={() => setPage('home')} />;
      case 'become-premium': return <BecomePremiumPage siteSettings={siteSettings} onBack={() => setPage('home')} onBecomePremiumByCaution={() => { if(user) { setAllUsers(users => users.map(u => u.id === user.id ? {...u, loyalty: {...u.loyalty, status: 'premium', premiumStatusMethod: 'deposit'}} : u)); alert('Félicitations, vous êtes maintenant membre Premium !'); setPage('home'); } }} onUpgradeToPremiumPlus={() => { if(user) { setAllUsers(users => users.map(u => u.id === user.id ? {...u, loyalty: {...u.loyalty, status: 'premium_plus', premiumStatusMethod: 'subscription'}} : u)); alert('Félicitations, vous êtes maintenant membre Premium+ !'); setPage('home'); } }} />;
      case 'info': return <InfoPage title={infoPageContent.title} content={infoPageContent.content} onBack={() => setPage('home')} />;
      case 'analytics-dashboard': return <AnalyticsDashboard onBack={() => setPage('superadmin-dashboard')} allOrders={allOrders} allProducts={allProducts} allStores={allStores} allUsers={allUsers} />;
      case 'review-moderation': return <ReviewModeration onBack={() => setPage('superadmin-dashboard')} allProducts={allProducts} onReviewModeration={(productId, reviewIdentifier, newStatus) => { setAllProducts(products => products.map(p => p.id === productId ? {...p, reviews: p.reviews.map(r => r.author === reviewIdentifier.author && r.date === reviewIdentifier.date ? {...r, status: newStatus} : r)} : p)); }} />;
      default: return <NotFoundPage onNavigateHome={() => setPage('home')} />;
    }
  };
  
  return (
    <>
      <Header 
        categories={allCategories} 
        onNavigateHome={() => setPage('home')} 
        onNavigateCart={() => setPage('cart')} 
        onNavigateToStores={() => setPage('stores')} 
        onNavigateToPromotions={() => setPage('promotions')} 
        onNavigateToCategory={(c) => {setSelectedCategory(c); setPage('category');}} 
        onNavigateToBecomeSeller={() => setPage('become-seller')} 
        onNavigateToSellerDashboard={() => setPage('seller-dashboard')} 
        onNavigateToSellerProfile={() => setPage('seller-profile')}
        onNavigateToOrderHistory={() => setPage('order-history')}
        onNavigateToSuperAdminDashboard={() => setPage('superadmin-dashboard')}
        onNavigateToFlashSales={() => setPage('flash-sales')}
        onNavigateToWishlist={() => setPage('wishlist')}
        onNavigateToDeliveryAgentDashboard={() => setPage('delivery-agent-dashboard')}
        onNavigateToDepotAgentDashboard={() => setPage('depot-agent-dashboard')}
        onNavigateToBecomePremium={() => setPage('become-premium')}
        onNavigateToAnalyticsDashboard={() => setPage('analytics-dashboard')}
        onNavigateToReviewModeration={() => setPage('review-moderation')}
        onOpenLogin={() => setIsLoginOpen(true)}
        onSearch={(q) => { setSearchQuery(q); setPage('search-results'); }}
        isChatEnabled={isChatEnabled}
        isPremiumProgramEnabled={siteSettings.isPremiumProgramEnabled}
      />
      <main className="min-h-[calc(100vh-145px)]">
          {renderPage()}
      </main>
      <Footer onNavigate={(title, content) => { setInfoPageContent({title, content}); setPage('info'); }} />
      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
      {isModalOpen && modalProduct && <AddToCartModal product={modalProduct} onClose={closeModal} onNavigateToCart={() => { closeModal(); setPage('cart'); }} />}
      {user?.role === 'seller' && selectedProduct?.vendor === user.shopName && <PromotionModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onSave={(id, promoPrice, startDate, endDate) => { setAllProducts(products => products.map(p => p.id === id ? {...p, promotionPrice: promoPrice, promotionStartDate: startDate, promotionEndDate: endDate} : p)); setSelectedProduct(null); }} />}
      {isChatEnabled && <ChatWidget allUsers={allUsers} allProducts={allProducts} />}
      {isComparisonEnabled && <ComparisonBar onCompareClick={() => setPage('comparison')}/>}
    </>
  );
}