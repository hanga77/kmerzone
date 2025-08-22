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
import { useAuth } from './contexts/AuthContext';
import { useComparison } from './contexts/ComparisonContext';
import type { Product, Category, Store, Review, Order, Address, OrderStatus, User, SiteActivityLog, FlashSale, DocumentStatus, PickupPoint, NewOrderData, TrackingEvent, PromoCode, Warning, SiteSettings, CartItem, UserRole, Payout, Advertisement } from './types';
import AddToCartModal from './components/AddToCartModal';
import { useUI } from './contexts/UIContext';
import PromotionModal from './components/PromotionModal';
import { useCart } from './contexts/CartContext';
import ChatWidget from './components/ChatWidget';
import { ArrowLeftIcon, BarChartIcon, ShieldCheckIcon, CurrencyDollarIcon, ShoppingBagIcon, UsersIcon, StarIcon } from './components/Icons';
import { usePersistentState } from './hooks/usePersistentState';

type Page = 'home' | 'product' | 'cart' | 'checkout' | 'order-success' | 'stores' | 'become-seller' | 'category' | 'seller-dashboard' | 'vendor-page' | 'product-form' | 'seller-profile' | 'superadmin-dashboard' | 'order-history' | 'order-detail' | 'promotions' | 'flash-sales' | 'search-results' | 'wishlist' | 'delivery-agent-dashboard' | 'depot-agent-dashboard' | 'comparison' | 'become-premium' | 'analytics-dashboard' | 'review-moderation' | 'info';

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
      id: '18', name: 'Beurre de karité pur', price: 3000, imageUrls: [], vendor: 'Douala Soaps',
      description: "Beurre de karité non raffiné, riche en vitamines A et E, pour une hydratation intense du corps et des cheveux.",
      reviews: [], stock: 35, category: 'Beauté et santé', status: 'published',
      brand: 'Douala Soaps', weight: '150g'
    },
];

const initialStores: Store[] = [
    { id: '1', name: 'Mama Africa', logoUrl: 'https://picsum.photos/seed/mama/200/100', category: 'Restaurant & Alimentation', warnings: [], status: 'active', location: 'Yaoundé', neighborhood: 'Bastos', sellerFirstName: 'Mama', sellerLastName: 'Africa', sellerPhone: '699887766', physicalAddress: '123 Rue de la Joie', documents: [], latitude: 3.8665, longitude: 11.521, subscriptionStatus: 'active', subscriptionDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), paymentHistory: [], premiumStatus: 'premium' },
    { id: '2', name: 'Kmer Fashion', logoUrl: 'https://picsum.photos/seed/kmerfashion/200/100', category: 'Mode', warnings: [{id: 'warn1', date: '2023-10-01T10:00:00Z', reason: 'Non-respect des délais de livraison.'}], status: 'active', location: 'Douala', neighborhood: 'Akwa', sellerFirstName: 'Adèle', sellerLastName: 'Ngo', sellerPhone: '677665544', physicalAddress: '45 Avenue de la Mode', documents: [], latitude: 4.0483, longitude: 9.702, subscriptionStatus: 'overdue', subscriptionDueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), paymentHistory: [], premiumStatus: 'standard' },
    { id: '3', name: 'Electro Plus', logoUrl: 'https://picsum.photos/seed/electro/200/100', category: 'Électronique', warnings: [{id: 'warn2', date: '2023-09-15T10:00:00Z', reason: 'Publicité mensongère sur un produit.'}, {id: 'warn3', date: '2023-10-05T14:00:00Z', reason: 'Mauvaise évaluation client non résolue.'}], status: 'active', location: 'Yaoundé', neighborhood: 'Centre Ville', sellerFirstName: 'Eric', sellerLastName: 'Kamdem', sellerPhone: '655443322', physicalAddress: '789 Boulevard du 20 Mai', documents: [], latitude: 3.8721, longitude: 11.5213, subscriptionStatus: 'inactive', premiumStatus: 'standard' },
    { id: '4', name: 'Douala Soaps', logoUrl: 'https://picsum.photos/seed/soap-store/200/100', category: 'Artisanat', warnings: [], status: 'active', location: 'Douala', neighborhood: 'Marché Central', sellerFirstName: 'Fatima', sellerLastName: 'Gaye', sellerPhone: '688776655', physicalAddress: 'Boutique 15', documents: [], latitude: 4.0475, longitude: 9.692, subscriptionStatus: 'active', subscriptionDueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), paymentHistory: [], premiumStatus: 'standard' },
];

const initialCategories: Category[] = [
    { id: 'cat1', name: 'Électronique', imageUrl: 'https://picsum.photos/seed/electronics/300/200' },
    { id: 'cat2', name: 'Vêtements', imageUrl: 'https://picsum.photos/seed/clothing/300/200' },
    { id: 'cat3', name: 'Chaussures', imageUrl: 'https://picsum.photos/seed/shoes-cat/300/200' },
    { id: 'cat4', name: 'Maison et jardin', imageUrl: 'https://picsum.photos/seed/home-garden/300/200' },
    { id: 'cat5', name: 'Biens pour enfants', imageUrl: 'https://picsum.photos/seed/kids-goods/300/200' },
    { id: 'cat6', name: 'Beauté et santé', imageUrl: 'https://picsum.photos/seed/beauty-health/300/200' },
    { id: 'cat7', name: 'Appareils électroménagers', imageUrl: 'https://picsum.photos/seed/appliances-cat/300/200' },
    { id: 'cat8', name: 'Sports et loisirs', imageUrl: 'https://picsum.photos/seed/sports-leisure/300/200' },
    { id: 'cat9', name: 'Construction et réparation', imageUrl: 'https://picsum.photos/seed/construction/300/200' },
    { id: 'cat10', name: 'Alimentation alimentaire', imageUrl: 'https://picsum.photos/seed/food-cat/300/200' },
    { id: 'cat11', name: 'Pharmacies', imageUrl: 'https://picsum.photos/seed/pharmacy/300/200' },
    { id: 'cat12', name: 'Produits pour animaux', imageUrl: 'https://picsum.photos/seed/pet-products/300/200' },
    { id: 'cat13', name: 'Livres', imageUrl: 'https://picsum.photos/seed/books/300/200' },
    { id: 'cat14', name: 'Mobilier', imageUrl: 'https://picsum.photos/seed/furniture/300/200' },
    { id: 'cat15', name: 'Loisirs et créativité', imageUrl: 'https://picsum.photos/seed/hobbies/300/200' },
    { id: 'cat16', name: 'Bijoux', imageUrl: 'https://picsum.photos/seed/jewelry-cat/300/200' },
    { id: 'cat17', name: 'Accessoires', imageUrl: 'https://picsum.photos/seed/accessories/300/200' },
    { id: 'cat18', name: 'Jeux et consoles', imageUrl: 'https://picsum.photos/seed/gaming/300/200' },
    { id: 'cat19', name: 'Marchandises de bureau', imageUrl: 'https://picsum.photos/seed/office-supplies/300/200' },
    { id: 'cat20', name: 'Produits pour adultes', imageUrl: 'https://picsum.photos/seed/adult-products/300/200' },
    { id: 'cat21', name: 'Antiquités et collectes', imageUrl: 'https://picsum.photos/seed/antiques/300/200' },
    { id: 'cat22', name: 'Produits numériques', imageUrl: 'https://picsum.photos/seed/digital-products/300/200' },
    { id: 'cat23', name: 'Chimie domestique et hygiène', imageUrl: 'https://picsum.photos/seed/hygiene/300/200' },
    { id: 'cat24', name: 'Musique et vidéo', imageUrl: 'https://picsum.photos/seed/music-video/300/200' },
];

const initialPickupPoints: PickupPoint[] = [
    { id: 'pp1', name: 'Point Relais Akwa', streetNumber: '123', street: 'Rue de la Liberté', additionalInfo: 'Près de la boulangerie Saker', city: 'Douala', neighborhood: 'Akwa', latitude: 4.049, longitude: 9.695 },
    { id: 'pp2', name: 'KMER ZONE Bonamoussadi', streetNumber: '456', street: 'Avenue Kayo', additionalInfo: 'Carrefour Kayo', city: 'Douala', neighborhood: 'Bonamoussadi', latitude: 4.101, longitude: 9.734 },
    { id: 'pp3', name: 'Point Relais Mvog-Mbi', streetNumber: '789', street: 'Boulevard Nsam', additionalInfo: 'Au rond-point', city: 'Yaoundé', neighborhood: 'Mvog-Mbi', latitude: 3.844, longitude: 11.512 },
    { id: 'pp4', name: 'KMER ZONE Bastos', streetNumber: '101', street: 'Rue des Ambassades', city: 'Yaoundé', neighborhood: 'Bastos', latitude: 3.882, longitude: 11.509 },
];


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [infoPageContent, setInfoPageContent] = useState<{title: string, content: string} | null>(null);

  const { user, allUsers, updateUser, setAllUsers } = useAuth();
  const { isModalOpen, modalProduct, closeModal } = useUI();
  const { setProducts: setComparisonProducts } = useComparison();
  const [promotionModalProduct, setPromotionModalProduct] = useState<Product | null>(null);
  const { clearCart } = useCart();
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);

  // Site feature flags & settings
  const [isChatEnabled, setIsChatEnabled] = usePersistentState<boolean>('isChatEnabled', true);
  const [isComparisonEnabled, setIsComparisonEnabled] = usePersistentState<boolean>('isComparisonEnabled', true);
  const [siteSettings, setSiteSettings] = usePersistentState<SiteSettings>('siteSettings', {
    isPremiumProgramEnabled: true,
    premiumThresholds: {
        orders: 5,
        spending: 100000,
    },
    premiumCautionAmount: 15000,
    isPremiumPlusEnabled: true,
    premiumPlusAnnualFee: 30000,
    requiredSellerDocuments: {
        "CNI (Carte Nationale d'Identité)": true,
        "Registre de Commerce": true,
        "Photo du gérant": false,
        "Plan de localisation": false,
    },
    isRentEnabled: true,
    rentAmount: 5000,
  });

  const [allProducts, setAllProducts] = usePersistentState<Product[]>('allProducts', initialProducts);
  const [allStores, setAllStores] = usePersistentState<Store[]>('allStores', initialStores);
  const [allCategories, setAllCategories] = usePersistentState<Category[]>('allCategories', initialCategories);
  const [allPickupPoints, setAllPickupPoints] = usePersistentState<PickupPoint[]>('allPickupPoints', initialPickupPoints);

  const [allPromoCodes, setAllPromoCodes] = usePersistentState<PromoCode[]>('allPromoCodes', []);
  const [allOrders, setAllOrders] = usePersistentState<Order[]>('allOrders', []);
  const [siteActivityLogs, setSiteActivityLogs] = usePersistentState<SiteActivityLog[]>('siteActivityLogs', []);
  const [flashSales, setFlashSales] = usePersistentState<FlashSale[]>('flashSales', []);
  const [payouts, setPayouts] = usePersistentState<Payout[]>('payouts', []);
  const [advertisements, setAdvertisements] = usePersistentState<Advertisement[]>('advertisements', [
    { id: 'ad1', imageUrl: 'https://picsum.photos/seed/ad1/800/200', linkUrl: '#', location: 'homepage-banner', isActive: true },
    { id: 'ad2', imageUrl: 'https://picsum.photos/seed/ad2/800/200', linkUrl: '#', location: 'homepage-banner', isActive: false },
    { id: 'ad3', imageUrl: 'https://picsum.photos/seed/ad3/800/200', linkUrl: '#', location: 'homepage-banner', isActive: true },
  ]);

  useEffect(() => {
    setComparisonProducts(allProducts);
  }, [allProducts, setComparisonProducts]);

  const addSiteActivityLog = useCallback((user: User, action: string, details: string) => {
    setSiteActivityLogs(prev => [{
      id: new Date().getTime().toString(),
      timestamp: new Date().toISOString(),
      user: { id: user.id, name: user.name, role: user.role },
      action,
      details,
    }, ...prev]);
  }, [setSiteActivityLogs]);

  // Rent Management Logic
  const handleActivateSubscription = useCallback((storeId: string) => {
    if (!user || user.role !== 'superadmin') return;
    setAllStores(prev => prev.map(s => {
      if (s.id === storeId && s.status === 'active' && s.subscriptionStatus !== 'active') {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        addSiteActivityLog(user, 'Activation Abonnement', `Abonnement activé pour la boutique '${s.name}'.`);
        return {
          ...s,
          subscriptionStatus: 'active',
          subscriptionDueDate: dueDate.toISOString(),
          paymentHistory: s.paymentHistory || []
        };
      }
      return s;
    }));
  }, [user, addSiteActivityLog, setAllStores]);

  const handlePayRent = useCallback((storeId: string) => {
    if (!user || user.role !== 'seller') return;
    
    const store = allStores.find(s => s.id === storeId);
    if (!store) return;

    if (window.confirm(`Confirmez-vous le paiement du loyer de ${siteSettings.rentAmount.toLocaleString('fr-CM')} FCFA pour votre boutique ?`)) {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                const newDueDate = s.subscriptionDueDate ? new Date(s.subscriptionDueDate) : new Date();
                if(newDueDate < new Date()) { // If overdue, start from today
                    newDueDate.setTime(Date.now());
                }
                newDueDate.setDate(newDueDate.getDate() + 30);
                addSiteActivityLog(user, 'Paiement Loyer', `Loyer payé pour la boutique '${s.name}'.`);
                return {
                    ...s,
                    subscriptionStatus: 'active',
                    subscriptionDueDate: newDueDate.toISOString(),
                    paymentHistory: [
                        ...(s.paymentHistory || []),
                        { date: new Date().toISOString(), amount: siteSettings.rentAmount }
                    ]
                };
            }
            return s;
        }));
    }
  }, [user, addSiteActivityLog, allStores, siteSettings.rentAmount, setAllStores]);

  // Effect to check for overdue payments
  useEffect(() => {
    if (!siteSettings.isRentEnabled) return;
    const now = new Date();

    const storesToUpdate = allStores.filter(store =>
      store.subscriptionStatus === 'active' &&
      store.subscriptionDueDate &&
      new Date(store.subscriptionDueDate) < now
    );

    if (storesToUpdate.length > 0) {
      const storeIdsToUpdate = storesToUpdate.map(s => s.id);
      setAllStores(prevStores =>
        prevStores.map(store =>
          storeIdsToUpdate.includes(store.id)
            ? { ...store, subscriptionStatus: 'overdue' }
            : store
        )
      );
    }
  }, [siteSettings.isRentEnabled, allStores]);


  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);
  
  const navigateToProduct = useCallback((product: Product) => { setSelectedProduct(product); navigate('product'); }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const productId = params.get('id');

    if (page === 'product' && productId) {
      const productToShow = allProducts.find(p => p.id === productId);
      if (productToShow) {
        navigateToProduct(productToShow);
      }
    }
  }, [allProducts, navigateToProduct]);

  const prevUserRef = useRef(user);
  useEffect(() => {
      const prevUser = prevUserRef.current;
      if (!prevUser && user) { // Login
          addSiteActivityLog(user, 'Connexion', `L'utilisateur s'est connecté.`);
           if (user.role === 'seller' || user.role === 'superadmin' || user.role === 'delivery_agent') {
              clearCart();
          }
          if (user.role === 'seller') {
              navigate('seller-dashboard');
          } else if (user.role === 'superadmin') {
              navigate('superadmin-dashboard');
          } else if (user.role === 'delivery_agent') {
              navigate('delivery-agent-dashboard');
          } else if (user.role === 'depot_agent') {
              navigate('depot-agent-dashboard');
          }
      } 
      else if (prevUser && !user) { // Logout
          addSiteActivityLog(prevUser, 'Déconnexion', `L'utilisateur s'est déconnecté.`);
          clearCart();
          if (prevUser.role === 'seller' || prevUser.role === 'superadmin') {
            navigate('home');
          }
      }
      else if (prevUser && user && prevUser.role !== 'seller' && user.role === 'seller') {
          addSiteActivityLog(user, 'Inscription Vendeur', `Est devenu vendeur avec la boutique '${user.shopName}'.`);
      }
      prevUserRef.current = user;
  }, [user, addSiteActivityLog, navigate, clearCart]);

  const addCategory = useCallback((categoryName: string): Category => {
    let newCategory: Category | undefined;
    setAllCategories(prev => {
        const existingCategory = prev.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        if (existingCategory) {
            newCategory = existingCategory;
            return prev;
        }
        newCategory = {
            id: new Date().getTime().toString(), 
            name: categoryName,
            imageUrl: `https://picsum.photos/seed/${categoryName.toLowerCase().replace(/\s+/g, '-')}/300/200`
        };
        return [...prev, newCategory];
    });
    return newCategory!;
  }, [setAllCategories]);

  const addReview = useCallback((productId: string, review: Review) => {
    if (!user) return;
    const currentUser = user;
    setAllProducts(prevProducts => {
        const product = prevProducts.find(p => p.id === productId);
        if (product) {
            addSiteActivityLog(currentUser, 'Avis Soumis', `A soumis un avis sur '${product.name}'.`);
        }
        return prevProducts.map(p => p.id === productId ? { ...p, reviews: [...p.reviews, review] } : p)
    });
  }, [user, addSiteActivityLog, setAllProducts]);

  const handleReviewModeration = useCallback((productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected') => {
    if (!user || user.role !== 'superadmin') return;
    const currentUser = user;
    setAllProducts(prevProducts => {
      const newProducts = prevProducts.map(p => {
        if (p.id === productId) {
          const newReviews = p.reviews.map(r => {
            if (r.author === reviewIdentifier.author && r.date === reviewIdentifier.date) {
              return { ...r, status: newStatus };
            }
            return r;
          });
          return { ...p, reviews: newReviews };
        }
        return p;
      });

      const product = prevProducts.find(p => p.id === productId);
      if (product) {
        const action = newStatus === 'approved' ? 'Approbation Avis' : 'Rejet Avis';
        addSiteActivityLog(currentUser, action, `Avis sur '${product.name}' par '${reviewIdentifier.author}'.`);
      }
      
      return newProducts;
    });
  }, [user, addSiteActivityLog, setAllProducts]);
  
  const handleSaveProduct = useCallback((productData: Product) => {
    if (!user) return;
    const currentUser = user;
    setAllProducts(prevProducts => {
        const isEditing = prevProducts.some(p => p.id === productData.id);
        const action = isEditing ? 'Modification Produit' : 'Création Produit';
        const details = `${isEditing ? 'A mis à jour le' : 'A créé le'} produit '${productData.name}'.`;
        addSiteActivityLog(currentUser, action, details);
        return isEditing 
            ? prevProducts.map(p => p.id === productData.id ? productData : p) 
            : [...prevProducts, productData];
    });
    setProductToEdit(null);
    navigate('seller-dashboard');
  }, [user, addSiteActivityLog, navigate, setAllProducts]);
  
  const handleDeleteProduct = useCallback((productId: string) => {
    if (!user) return;
    const currentUser = user;
    setAllProducts(prevProducts => {
        const product = prevProducts.find(p => p.id === productId);
        if (product) {
            addSiteActivityLog(currentUser, 'Suppression Produit', `A supprimé le produit '${product.name}'.`);
        }
        return prevProducts.filter(p => p.id !== productId);
    });
  }, [user, addSiteActivityLog, setAllProducts]);
  
  const handleToggleProductStatus = useCallback((productId: string) => {
    setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, status: p.status === 'published' ? 'draft' : 'published' } : p));
  }, [setAllProducts]);

  const handleOpenPromotionModal = useCallback((product: Product) => setPromotionModalProduct(product), []);
  const handleClosePromotionModal = useCallback(() => setPromotionModalProduct(null), []);
  
  const handleSetPromotion = useCallback((productId: string, promoPrice: number, startDate?: string, endDate?: string) => {
    if (!user) return;
    const currentUser = user;
    setAllProducts(prev => {
        const productToUpdate = prev.find(p => p.id === productId);
        if (productToUpdate) {
            addSiteActivityLog(currentUser, 'Promotion Produit', `A mis en promotion le produit '${productToUpdate.name}' à ${promoPrice.toLocaleString('fr-CM')} FCFA.`);
        }
        return prev.map(p => p.id === productId ? { ...p, promotionPrice: promoPrice, promotionStartDate: startDate, promotionEndDate: endDate } : p)
    });
    handleClosePromotionModal();
  }, [user, addSiteActivityLog, handleClosePromotionModal, setAllProducts]);
  
  const handleRemovePromotion = useCallback((productId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir retirer cette promotion ?")) {
      if (!user) return;
      const currentUser = user;
      setAllProducts(prev => {
        const productToUpdate = prev.find(p => p.id === productId);
         if (productToUpdate) {
             addSiteActivityLog(currentUser, 'Fin Promotion', `A retiré la promotion pour le produit '${productToUpdate.name}'.`);
          }
        return prev.map(p => {
          if (p.id === productId) { 
            const { promotionPrice, promotionStartDate, promotionEndDate, ...rest } = p; 
            return rest; 
          }
          return p;
        })
      });
    }
  }, [user, addSiteActivityLog, setAllProducts]);

  const handleConfirmOrder = useCallback(async (orderData: NewOrderData) => {
    if (!user) return;
    const currentUser = user;

    // Simulate payment processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setAllOrders(prevOrders => {
        let storeName = 'Inconnue';
        if (orderData.items.length > 0) {
            storeName = orderData.items[0].vendor;
        }

        const newOrder: Order = {
            id: `CMD-${new Date().getTime()}`,
            orderDate: new Date().toISOString(),
            status: 'confirmed',
            trackingNumber: `KZ${Math.floor(Math.random() * 100000000)}`,
            ...orderData,
            trackingHistory: [{
                status: 'confirmed',
                date: new Date().toISOString(),
                details: 'Commande reçue et en attente de préparation par le vendeur.',
                location: `Boutique: ${storeName}`
            }]
        };

        if (orderData.appliedPromoCode) {
            setAllPromoCodes(prev => prev.map(pc => 
                pc.code === orderData.appliedPromoCode!.code ? { ...pc, uses: pc.uses + 1 } : pc
            ));
        }
        
        addSiteActivityLog(currentUser, 'Nouvelle Commande', `A passé la commande #${newOrder.id} pour un total de ${newOrder.total.toLocaleString('fr-CM')} FCFA.`);
        return [...prevOrders, newOrder];
    });
    
    clearCart();
    setAppliedPromoCode(null);
    navigate('order-success');
  }, [user, addSiteActivityLog, clearCart, navigate, setAllOrders, setAllPromoCodes]);

  const handleUpdateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    if (!user) return;
    const currentUser = user;
    
    setAllOrders(prevOrders => {
        const order = prevOrders.find(o => o.id === orderId);
        if (!order) return prevOrders;

        addSiteActivityLog(currentUser, "Mise à jour statut commande", `Commande #${orderId} : '${order.status}' -> '${status}'`);
        
        if (status === 'delivered' && siteSettings.isPremiumProgramEnabled) {
            setAllUsers(prevUsers => {
                return prevUsers.map(u => {
                    if (u.id === order.userId) {
                        const deliveredOrders = [...prevOrders.filter(o => o.userId === order.userId && o.status === 'delivered'), order];
                        const orderCount = deliveredOrders.length;
                        const totalSpent = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
                        
                        const newStatus = (orderCount >= siteSettings.premiumThresholds.orders && totalSpent >= siteSettings.premiumThresholds.spending) ? 'premium' : 'standard';

                        if (u.loyalty.status !== 'premium' && newStatus === 'premium') {
                            addSiteActivityLog({ ...user, role: 'superadmin', name: 'Système' }, 'Mise à jour Fidélité', `L'utilisateur ${u.name} est passé au statut Premium par fidélité.`);
                             return { ...u, loyalty: { orderCount, totalSpent, status: 'premium', premiumStatusMethod: 'loyalty' }};
                        }

                        return { ...u, loyalty: { ...u.loyalty, orderCount, totalSpent }};
                    }
                    return u;
                });
            });
        }
        
        let newEventDetails = '';
        let newEventLocation = '';
        
        setAllStores(prevStores => {
            const store = prevStores.find(s => s.name === order.items[0].vendor);
            switch(status) {
              case 'ready-for-pickup': newEventDetails = "Le vendeur a préparé le colis pour l'enlèvement."; newEventLocation = `Boutique: ${store?.name || 'Inconnue'}`; break;
              case 'picked-up': newEventDetails = `L'agent ${currentUser.name} a scanné et récupéré le colis.`; newEventLocation = `Centre de tri, ${store?.location || 'Inconnu'}`; break;
              case 'at-depot': newEventDetails = "Le colis est arrivé au centre de distribution local."; newEventLocation = `Centre de distribution, ${order.shippingAddress.city}`; break;
              case 'out-for-delivery': newEventDetails = `Le livreur ${currentUser.name} a scanné le colis et a commencé sa tournée.`; newEventLocation = `En tournée, ${order.shippingAddress.city}`; break;
              case 'delivered': newEventDetails = order.status === 'refund-requested' ? 'La demande de remboursement a été rejetée. La commande reste considérée comme livrée.' : 'Le colis a été livré avec succès.'; newEventLocation = order.status === 'refund-requested' ? 'Service Client' : order.shippingAddress.address; break;
              case 'refunded': newEventDetails = 'La demande de remboursement a été approuvée par un administrateur.'; newEventLocation = 'Service Client'; break;
            }
            return prevStores;
        });

        const newTrackingEvent: TrackingEvent = { status, date: new Date().toISOString(), details: newEventDetails, location: newEventLocation };
        return prevOrders.map(o => o.id === orderId ? { ...o, status, trackingHistory: [...o.trackingHistory, newTrackingEvent] } : o);
    });
  }, [user, addSiteActivityLog, setAllUsers, siteSettings, setAllOrders, setAllStores]);

  const handleCancelOrder = useCallback((orderId: string) => {
    if (!user) return;
    const currentUser = user;
    
    setAllOrders(prevOrders => {
      const orderToCancel = prevOrders.find(o => o.id === orderId);
      if (!orderToCancel) return prevOrders;

      const confirmationMessage = `Êtes-vous sûr de vouloir annuler cette commande ? Des frais d'annulation de 15% (${(orderToCancel.total * 0.15).toLocaleString('fr-CM')} FCFA) seront appliqués.`;
      if (!window.confirm(confirmationMessage)) return prevOrders;

      const cancellationFee = orderToCancel.total * 0.15;
      const newTrackingEvent: TrackingEvent = {
        status: 'cancelled',
        date: new Date().toISOString(),
        details: `Commande annulée par le client. Frais appliqués: ${cancellationFee.toLocaleString('fr-CM')} FCFA.`,
        location: 'Client'
      };
      addSiteActivityLog(currentUser, "Annulation Commande", `Commande #${orderId} annulée avec des frais de ${cancellationFee.toLocaleString('fr-CM')} FCFA.`);
      return prevOrders.map(o => o.id === orderId ? { ...o, status: 'cancelled', cancellationFee, trackingHistory: [...o.trackingHistory, newTrackingEvent] } : o);
    });
    
    navigate('order-history');
  }, [user, addSiteActivityLog, navigate, setAllOrders]);


  const handleRequestRefund = useCallback((orderId: string, reason: string) => {
    if (!user) return;
    const currentUser = user;
    setAllOrders(prevOrders => {
        const newTrackingEvent: TrackingEvent = { status: 'refund-requested', date: new Date().toISOString(), details: `Demande de remboursement soumise. Motif: ${reason}`, location: 'Client' };
        addSiteActivityLog(currentUser, "Demande de remboursement", `Demande pour la commande #${orderId}. Motif: ${reason}`);
        return prevOrders.map(o => o.id === orderId ? { ...o, status: 'refund-requested', refundReason: reason, trackingHistory: [...o.trackingHistory, newTrackingEvent] } : o);
    });
    navigate('order-history');
  }, [user, addSiteActivityLog, navigate, setAllOrders]);

  const handleUpdateCategoryImage = useCallback((categoryId: string, imageUrl: string) => {
    if (!user || user.role !== 'superadmin') return;
    const currentUser = user;
    setAllCategories(prev => {
        const category = prev.find(c => c.id === categoryId);
        if(category){
            addSiteActivityLog(currentUser, "Mise à jour image catégorie", `Catégorie '${category.name}'`);
        }
        return prev.map(c => c.id === categoryId ? { ...c, imageUrl } : c);
    });
  }, [user, addSiteActivityLog, setAllCategories]);
  
  const handleAdminAddCategory = useCallback((categoryName: string) => {
    if (!user || user.role !== 'superadmin') return;
    setAllCategories(prev => {
        if (prev.find(c => c.name.toLowerCase() === categoryName.toLowerCase())) {
            alert("Cette catégorie existe déjà.");
            return prev;
        }
        const newCategory: Category = {
            id: `cat-${new Date().getTime()}`,
            name: categoryName,
            imageUrl: `https://picsum.photos/seed/${categoryName.toLowerCase().replace(/\s+/g, '-')}/300/200`
        };
        addSiteActivityLog(user, "Ajout Catégorie", `A créé la catégorie '${categoryName}'.`);
        return [...prev, newCategory];
    });
  }, [user, addSiteActivityLog, setAllCategories]);

  const handleAdminDeleteCategory = useCallback((categoryId: string) => {
    if (!user || user.role !== 'superadmin') return;
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ? Cela pourrait affecter les produits existants.")) {
        setAllCategories(prev => {
            const category = prev.find(c => c.id === categoryId);
            if(category) {
                addSiteActivityLog(user, "Suppression Catégorie", `A supprimé la catégorie '${category.name}'.`);
            }
            return prev.filter(c => c.id !== categoryId);
        });
    }
  }, [user, addSiteActivityLog, setAllCategories]);
  
  const handleBecomeSeller = useCallback((shopName: string, location: string, neighborhood: string, sellerFirstName: string, sellerLastName: string, sellerPhone: string, physicalAddress: string, logoUrl: string, latitude?: number, longitude?: number) => {
    if (!user) return;
    const currentUser = user;
    
    const requiredDocs = Object.entries(siteSettings.requiredSellerDocuments)
        .filter(([, isRequired]) => isRequired)
        .map(([docName]) => ({ name: docName, status: 'requested' as const }));

    setAllStores(prev => {
        const newStore: Store = {
          id: new Date().getTime().toString(), name: shopName, logoUrl: logoUrl, category: 'Nouvelle Boutique',
          warnings: [], status: 'pending', location, neighborhood, sellerFirstName, sellerLastName, sellerPhone, physicalAddress,
          documents: requiredDocs,
          latitude,
          longitude,
          subscriptionStatus: 'inactive',
          premiumStatus: 'standard',
        };
        return [...prev, newStore];
    });
    addSiteActivityLog(currentUser, 'Demande de Boutique', `A soumis une demande pour la boutique '${shopName}'.`);
    updateUser({ shopName, location });
  }, [user, addSiteActivityLog, updateUser, siteSettings.requiredSellerDocuments, setAllStores]);
  
  const handleApproveStore = useCallback((storeId: string) => {
    if (!user) return;
    const currentUser = user;
    setAllStores(prev => {
        const store = prev.find(s => s.id === storeId);
        if(store) { addSiteActivityLog(currentUser, "Approbation boutique", `La boutique '${store.name}' a été approuvée.`); }
        return prev.map(s => s.id === storeId ? { ...s, status: 'active' } : s);
    });
  }, [user, addSiteActivityLog, setAllStores]);
  
  const handleRejectStore = useCallback((storeId: string) => {
    if (!user) return;
    const currentUser = user;
    setAllStores(prev => {
        const store = prev.find(s => s.id === storeId);
        if(store) { addSiteActivityLog(currentUser, "Rejet boutique", `La boutique '${store.name}' a été rejetée.`); }
        return prev.map(s => s.id === storeId ? { ...s, status: 'suspended' } : s);
    });
  }, [user, addSiteActivityLog, setAllStores]);
  
  const handleWarnStore = useCallback((storeId: string, reason: string) => {
    if (!user) return;
    const currentUser = user;
    setAllStores(prevStores => prevStores.map(store => {
        if (store.id === storeId) {
            const newWarning: Warning = {
              id: `warn-${new Date().getTime()}`,
              date: new Date().toISOString(),
              reason: reason,
            };
            const newWarnings = [...store.warnings, newWarning];
            const newStatus = newWarnings.length >= 3 ? 'suspended' : store.status;
            addSiteActivityLog(currentUser, "Avertissement boutique", `Boutique '${store.name}' a reçu un avertissement (${newWarnings.length}/3). Motif: ${reason}`);
            if (newStatus === 'suspended' && store.status === 'active') { addSiteActivityLog(currentUser, "Suspension automatique boutique", `Boutique '${store.name}' suspendue après 3 avertissements.`); }
            return { ...store, warnings: newWarnings, status: newStatus };
        }
        return store;
    }));
  }, [user, addSiteActivityLog, setAllStores]);
  
  const handleToggleStoreStatus = useCallback((storeId: string) => {
    if (!user) return;
    const currentUser = user;
    setAllStores(prevStores => prevStores.map(store => {
        if (store.id === storeId) {
            const newStatus = store.status === 'active' ? 'suspended' : 'active';
            const newWarnings = newStatus === 'active' ? [] : store.warnings;
            addSiteActivityLog(currentUser, "Mise à jour statut boutique", `Boutique '${store.name}' : '${store.status}' -> '${newStatus}'.`);
            return { ...store, status: newStatus, warnings: newWarnings };
        }
        return store;
    }));
  }, [user, addSiteActivityLog, setAllStores]);

  const handleToggleStorePremiumStatus = useCallback((storeId: string) => {
    if (!user || user.role !== 'superadmin') return;
    setAllStores(prevStores => prevStores.map(store => {
        if (store.id === storeId) {
            const newStatus = store.premiumStatus === 'premium' ? 'standard' : 'premium';
            addSiteActivityLog(user, "Mise à jour Statut Premium Boutique", `Boutique '${store.name}' est maintenant ${newStatus === 'premium' ? 'Premium' : 'Standard'}.`);
            return { ...store, premiumStatus: newStatus };
        }
        return store;
    }));
  }, [user, addSiteActivityLog, setAllStores]);

    const handleRequestDocument = useCallback((storeId: string, documentName: string) => {
        if (!user) return;
        const currentUser = user;
        setAllStores(prev => {
            const store = prev.find(s => s.id === storeId);
            if (store) { addSiteActivityLog(currentUser, 'Demande de document', `Document '${documentName}' demandé à la boutique '${store?.name}'.`); }
            return prev.map(s => s.id === storeId ? { ...s, documents: [...s.documents, { name: documentName, status: 'requested' }] } : s)
        });
    }, [user, addSiteActivityLog, setAllStores]);

    const handleUploadDocument = useCallback((storeId: string, documentName: string, fileUrl: string) => {
        if (!user) return;
        setAllStores(prev => prev.map(s => s.id === storeId ? { ...s, documents: s.documents.map(d => d.name === documentName ? { ...d, status: 'uploaded', fileUrl: fileUrl } : d) } : s));
        addSiteActivityLog(user, 'Soumission de document', `Document '${documentName}' soumis.`);
    }, [user, addSiteActivityLog, setAllStores]);

    const handleVerifyDocumentStatus = useCallback((storeId: string, documentName: string, status: 'verified' | 'rejected', reason?: string) => {
        if (!user) return;
        const currentUser = user;
        setAllStores(prev => {
            const store = prev.find(s => s.id === storeId);
            if (store) { addSiteActivityLog(currentUser, 'Vérification de document', `Document '${documentName}' de la boutique '${store?.name}' a été ${status === 'verified' ? 'vérifié' : 'vérifié'}.`); }
            return prev.map(s => s.id === storeId ? { ...s, documents: s.documents.map(d => d.name === documentName ? { ...d, status: status, rejectionReason: reason } : d) } : s)
        });
    }, [user, addSiteActivityLog, setAllStores]);

  const handleSaveFlashSale = useCallback((flashSaleData: Omit<FlashSale, 'id' | 'products'>) => {
      if (!user) return;
      const currentUser = user;
      setFlashSales(prev => {
        const newFlashSale: FlashSale = { ...flashSaleData, id: new Date().getTime().toString(), products: [] };
        addSiteActivityLog(currentUser, 'Création Vente Flash', `L'événement '${newFlashSale.name}' a été créé.`);
        return [...prev, newFlashSale];
      });
  }, [user, addSiteActivityLog, setFlashSales]);

  const handleProposeForFlashSale = useCallback((flashSaleId: string, productId: string, flashPrice: number, sellerShopName: string) => {
      if (!user) return;
      const currentUser = user;
      setFlashSales(prev => prev.map(fs => {
          if (fs.id === flashSaleId) {
              const newProduct = { productId, flashPrice, sellerShopName, status: 'pending' as const };
              addSiteActivityLog(currentUser, 'Proposition Vente Flash', `Le vendeur '${sellerShopName}' a proposé le produit ID ${productId} pour l'événement '${fs.name}'.`);
              return { ...fs, products: [...fs.products, newProduct] };
          }
          return fs;
      }));
  }, [user, addSiteActivityLog, setFlashSales]);

  const handleUpdateFlashSaleSubmissionStatus = useCallback((flashSaleId: string, productId: string, status: 'approved' | 'rejected') => {
      if (!user) return;
      const currentUser = user;
      setFlashSales(prev => {
        return prev.map(fs => {
            if (fs.id === flashSaleId) {
                setAllProducts(prevProds => {
                    const product = prevProds.find(p => p.id === productId);
                    if (product) {
                        addSiteActivityLog(currentUser, 'Gestion Vente Flash', `Le produit '${product.name}' a été ${status === 'approved' ? 'approuvé' : 'rejeté'} pour la vente '${fs.name}'.`);
                    }
                    return prevProds;
                });
                return { ...fs, products: fs.products.map(p => p.productId === productId ? { ...p, status } : p) };
            }
            return fs;
        })
      });
  }, [user, addSiteActivityLog, setFlashSales, setAllProducts]);
  
  const handleBatchUpdateFlashSaleStatus = useCallback((flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => {
    if (!user) return;
    const currentUser = user;
    setFlashSales(prev => prev.map(fs => {
      if (fs.id === flashSaleId) {
        addSiteActivityLog(currentUser, 'Gestion Vente Flash par lot', `${productIds.length} produit(s) ont été ${status === 'approved' ? 'approuvés' : 'rejetés'} pour la vente '${fs.name}'.`);
        return { ...fs, products: fs.products.map(p => productIds.includes(p.productId) ? { ...p, status } : p) };
      }
      return fs;
    }));
  }, [user, addSiteActivityLog, setFlashSales]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    navigate('search-results');
  }, [navigate]);

  const handleAddPickupPoint = useCallback((pointData: Omit<PickupPoint, 'id'>) => {
    if (!user || user.role !== 'superadmin') return;
    const currentUser = user;
    setAllPickupPoints(prev => {
        const newPoint: PickupPoint = { id: `pp-${new Date().getTime()}`, ...pointData };
        addSiteActivityLog(currentUser, 'Ajout Point Dépôt', `Le point de dépôt '${newPoint.name}' a été créé.`);
        return [...prev, newPoint];
    });
  }, [user, addSiteActivityLog, setAllPickupPoints]);

  const handleUpdatePickupPoint = useCallback((updatedPoint: PickupPoint) => {
      if (!user) return;
      setAllPickupPoints(prev => {
        addSiteActivityLog(user, 'Modification Point Dépôt', `Le point de dépôt '${updatedPoint.name}' a été mis à jour.`);
        return prev.map(p => p.id === updatedPoint.id ? updatedPoint : p)
      });
  }, [user, addSiteActivityLog, setAllPickupPoints]);
  
  const handleDeletePickupPoint = useCallback((pointId: string) => {
    if (!user) return;
    const currentUser = user;
    
    setAllPickupPoints(prevPoints => {
        const pointToDelete = prevPoints.find(p => p.id === pointId);
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le point de dépôt "${pointToDelete?.name}"?`)) {
          if(pointToDelete) { addSiteActivityLog(currentUser, 'Suppression Point Dépôt', `Le point de dépôt '${pointToDelete.name}' a été supprimé.`); }
          return prevPoints.filter(p => p.id !== pointId);
        }
        return prevPoints;
    });
  }, [user, addSiteActivityLog, setAllPickupPoints]);

  const handleUpdateUserRole = useCallback((userId: string, newRole: UserRole) => {
    if (!user || user.role !== 'superadmin') return;
    if (window.confirm(`Êtes-vous sûr de vouloir changer le rôle de cet utilisateur en '${newRole}' ? Cette action est irréversible.`)) {
      setAllUsers(prevUsers => {
        const userToUpdate = prevUsers.find(u => u.id === userId);
        if (userToUpdate) {
          addSiteActivityLog(user, 'Changement de Rôle', `Le rôle de '${userToUpdate.name}' a été changé de '${userToUpdate.role}' à '${newRole}'.`);
        }
        return prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u);
      });
    }
  }, [user, addSiteActivityLog, setAllUsers]);

  const handleAssignAgent = useCallback((orderId: string, agentId: string) => {
    if (!user) return;
    const currentUser = user;
    setAllOrders(prevOrders => {
        const order = prevOrders.find(o => o.id === orderId);
        const agent = allUsers.find(u => u.id === agentId);
        if (order && agent) {
            addSiteActivityLog(currentUser, "Assignation Agent", `Agent '${agent.name}' assigné à la commande #${order.id}.`);
        }
        return prevOrders.map(o => o.id === orderId ? { ...o, agentId } : o);
    });
  }, [user, addSiteActivityLog, allUsers, setAllOrders]);
  
  const handleCreatePromoCode = useCallback((codeData: Omit<PromoCode, 'uses'>) => {
    if (!user) return;
    const currentUser = user;
    setAllPromoCodes(prev => {
        const newCode: PromoCode = { ...codeData, uses: 0 };
        addSiteActivityLog(currentUser, 'Création Code Promo', `A créé le code promo '${newCode.code}'.`);
        return [...prev, newCode];
    });
  }, [user, addSiteActivityLog, setAllPromoCodes]);

  const handleDeletePromoCode = useCallback((code: string) => {
    if (!user) return;
    const currentUser = user;
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le code promo "${code}" ?`)) {
        setAllPromoCodes(prev => {
            addSiteActivityLog(currentUser, 'Suppression Code Promo', `A supprimé le code promo '${code}'.`);
            return prev.filter(pc => pc.code !== code);
        });
    }
  }, [user, addSiteActivityLog, setAllPromoCodes]);
  
  const handleToggleChatFeature = useCallback(() => setIsChatEnabled(prev => !prev), [setIsChatEnabled]);
  const handleToggleComparisonFeature = useCallback(() => setIsComparisonEnabled(prev => !prev), [setIsComparisonEnabled]);
  
  const handleUpdateSiteSettings = useCallback((newSettings: SiteSettings) => {
      setSiteSettings(newSettings);
      if(user) addSiteActivityLog(user, 'Mise à jour Paramètres', `Les paramètres du site ont été mis à jour.`);
  }, [user, addSiteActivityLog, setSiteSettings]);

  const handleBecomePremiumByCaution = useCallback(() => {
    if (!user) return;
    setAllUsers(prev => prev.map(u => {
      if (u.id === user.id) {
          addSiteActivityLog(user, 'Adhésion Premium', `Est devenu Premium en payant la caution de ${siteSettings.premiumCautionAmount.toLocaleString('fr-CM')} FCFA.`);
          return {
            ...u,
            loyalty: { ...u.loyalty, status: 'premium', premiumStatusMethod: 'deposit' }
          };
      }
      return u;
    }));
    alert("Félicitations ! Vous êtes maintenant un membre KMER Premium.");
    navigate('home');
  }, [user, setAllUsers, addSiteActivityLog, siteSettings.premiumCautionAmount, navigate]);
  
  const handleUpgradeToPremiumPlus = useCallback(() => {
    if (!user) return;
    setAllUsers(prev => prev.map(u => {
      if (u.id === user.id) {
          addSiteActivityLog(user, 'Adhésion Premium+', `Est devenu Premium+ en payant l'abonnement de ${siteSettings.premiumPlusAnnualFee.toLocaleString('fr-CM')} FCFA.`);
          return {
            ...u,
            loyalty: { ...u.loyalty, status: 'premium_plus', premiumStatusMethod: 'subscription' }
          };
      }
      return u;
    }));
    alert("Félicitations ! Vous êtes maintenant un membre KMER Premium+.");
    navigate('home');
  }, [user, setAllUsers, addSiteActivityLog, siteSettings.premiumPlusAnnualFee, navigate]);

  const handlePayoutSeller = useCallback((storeId: string, amount: number) => {
    if (!user || user.role !== 'superadmin') return;
    if (amount <= 0) return;

    if (window.confirm(`Confirmez-vous le versement de ${amount.toLocaleString('fr-CM')} FCFA à cette boutique ?`)) {
        const newPayout: Payout = {
            storeId,
            amount,
            date: new Date().toISOString(),
        };
        setPayouts(prev => [...prev, newPayout]);
        
        const store = allStores.find(s => s.id === storeId);
        addSiteActivityLog(user, 'Paiement Vendeur', `A versé ${amount.toLocaleString('fr-CM')} FCFA à la boutique '${store?.name}'.`);
    }
  }, [user, addSiteActivityLog, allStores, setPayouts]);

  const handleAddAdvertisement = useCallback((ad: Omit<Advertisement, 'id'>) => {
    if (!user || user.role !== 'superadmin') return;
    const newAd = { ...ad, id: `ad-${Date.now()}` };
    setAdvertisements(prev => [...prev, newAd]);
    addSiteActivityLog(user, 'Ajout Publicité', `A ajouté une nouvelle publicité.`);
  }, [user, addSiteActivityLog, setAdvertisements]);

  const handleUpdateAdvertisement = useCallback((updatedAd: Advertisement) => {
    if (!user || user.role !== 'superadmin') return;
    setAdvertisements(prev => prev.map(ad => ad.id === updatedAd.id ? updatedAd : ad));
    addSiteActivityLog(user, 'Mise à jour Publicité', `A mis à jour la publicité ${updatedAd.id}.`);
  }, [user, addSiteActivityLog, setAdvertisements]);

  const handleDeleteAdvertisement = useCallback((adId: string) => {
    if (!user || user.role !== 'superadmin') return;
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette publicité ?")) {
      setAdvertisements(prev => prev.filter(ad => ad.id !== adId));
      addSiteActivityLog(user, 'Suppression Publicité', `A supprimé la publicité ${adId}.`);
    }
  }, [user, addSiteActivityLog, setAdvertisements]);

  const handleUpdateSellerProfile = useCallback((storeId: string, updatedData: { shopName: string, location: string, logoUrl: string }) => {
    if (!user) return;
    const { shopName, location, logoUrl } = updatedData;

    // Update the store in allStores
    setAllStores(prevStores => prevStores.map(s => 
        s.id === storeId ? { ...s, name: shopName, location, logoUrl } : s
    ));
    
    // Update the user object to keep it in sync
    updateUser({
        name: shopName, // user.name is often the shop name for a seller
        shopName,
        location
    });

    addSiteActivityLog(user, 'Mise à jour Profil Boutique', `Le profil de la boutique a été mis à jour.`);
  }, [user, addSiteActivityLog, setAllStores, updateUser]);

  const handleCheckInAtDepot = useCallback((orderId: string, storageLocationId: string) => {
    if (!user || user.role !== 'depot_agent') return;

    setAllOrders(prevOrders => {
        const order = prevOrders.find(o => o.id === orderId);
        if (!order) return prevOrders;

        const newStatus: OrderStatus = 'at-depot';
        addSiteActivityLog(user, "Arrivée au dépôt", `Colis #${orderId} enregistré au dépôt et assigné à l'emplacement ${storageLocationId}.`);
        
        const newTrackingEvent: TrackingEvent = {
            status: newStatus,
            date: new Date().toISOString(),
            details: `Colis enregistré par ${user.name} et stocké à l'emplacement ${storageLocationId}.`,
            location: 'Dépôt KMER ZONE'
        };
        
        return prevOrders.map(o => o.id === orderId ? { 
            ...o, 
            status: newStatus, 
            trackingHistory: [...o.trackingHistory, newTrackingEvent],
            storageLocationId,
            checkedInAt: new Date().toISOString(),
            checkedInBy: user.id,
        } : o);
    });
  }, [user, addSiteActivityLog, setAllOrders]);

  const navigateToHome = useCallback(() => { navigate('home'); setAppliedPromoCode(null); }, [navigate]);
  const navigateToCart = useCallback(() => navigate('cart'), [navigate]);
  const navigateToCheckout = useCallback(() => navigate('checkout'), [navigate]);
  const navigateToStores = useCallback(() => navigate('stores'), [navigate]);
  const navigateToPromotions = useCallback(() => navigate('promotions'), [navigate]);
  const navigateToBecomeSeller = useCallback(() => navigate('become-seller'), [navigate]);
  const navigateToSellerDashboard = useCallback(() => navigate('seller-dashboard'), [navigate]);
  const navigateToSellerProfile = useCallback(() => navigate('seller-profile'), [navigate]);
  const navigateToSuperAdminDashboard = useCallback(() => navigate('superadmin-dashboard'), [navigate]);
  const navigateToOrderHistory = useCallback(() => navigate('order-history'), [navigate]);
  const navigateToFlashSales = useCallback(() => navigate('flash-sales'), [navigate]);
  const navigateToWishlist = useCallback(() => navigate('wishlist'), [navigate]);
  const navigateToDeliveryAgentDashboard = useCallback(() => navigate('delivery-agent-dashboard'), [navigate]);
  const navigateToDepotAgentDashboard = useCallback(() => navigate('depot-agent-dashboard'), [navigate]);
  const navigateToComparison = useCallback(() => navigate('comparison'), [navigate]);
  const navigateToBecomePremium = useCallback(() => navigate('become-premium'), [navigate]);
  const navigateToAnalyticsDashboard = useCallback(() => navigate('analytics-dashboard'), [navigate]);
  const navigateToReviewModeration = useCallback(() => navigate('review-moderation'), [navigate]);
  
  const navigateToInfoPage = useCallback((title: string, content: string) => {
    setInfoPageContent({ title, content });
    navigate('info');
  }, [navigate]);

  const navigateToCategory = useCallback((categoryName: string) => { setSelectedCategory(categoryName); navigate('category'); }, [navigate]);
  const navigateToVendorPage = useCallback((vendorName: string) => { setSelectedVendor(vendorName); navigate('vendor-page'); }, [navigate]);
  const navigateToProductForm = useCallback((product: Product | null) => { setProductToEdit(product); navigate('product-form'); }, [navigate]);
  
  const navigateToOrderDetail = useCallback((order: Order) => { 
    setSelectedOrder(order); 
    navigate('order-detail'); 
  }, [navigate]);

  const onOpenLogin = useCallback(() => setIsLoginOpen(true), []);
  const onAddProduct = useCallback(() => navigateToProductForm(null), [navigateToProductForm]);

  const activeStores = useMemo(() => allStores.filter(s => s.status === 'active'), [allStores]);
  
  const storesForDisplay = useMemo(() => user?.role === 'seller'
    ? activeStores.filter(s => s.name !== user.shopName)
    : activeStores, [activeStores, user]);
    
  const currentStore = useMemo(() => user?.shopName ? allStores.find(s => s.name === user.shopName) : undefined, [allStores, user]);
  
  const publishedProducts = useMemo(() => {
    const activeStoreNames = activeStores.map(s => s.name);
    return allProducts.filter(p => p.status === 'published' && activeStoreNames.includes(p.vendor));
  }, [allProducts, activeStores]);

  const sellerProducts = useMemo(() => user?.shopName ? allProducts.filter(p => p.vendor === user.shopName) : [], [allProducts, user?.shopName]);
  const sellerOrders = useMemo(() => user?.shopName ? allOrders.filter(order => order.items.some(item => item.vendor === user.shopName)) : [], [allOrders, user?.shopName]);
  const sellerPromoCodes = useMemo(() => user?.id ? allPromoCodes.filter(pc => pc.sellerId === user.id) : [], [allPromoCodes, user?.id]);
  const sellerCategories = useMemo(() => {
    if (!user?.shopName) return [];
    const categoriesInUse = new Set(sellerProducts.map(p => p.category));
    return allCategories.filter(c => categoriesInUse.has(c.name));
  }, [allCategories, sellerProducts, user?.shopName]);
  
  const userOrders = useMemo(() => user?.id ? allOrders.filter(order => order.userId === user.id) : [], [allOrders, user?.id]);

  const renderContent = () => {
    switch (currentPage) {
      case 'product': return selectedProduct && <ProductDetail product={selectedProduct} allProducts={publishedProducts} allUsers={allUsers} stores={allStores} onBack={navigateToHome} onAddReview={addReview} onVendorClick={navigateToVendorPage} onProductClick={navigateToProduct} flashSales={flashSales} onOpenLogin={onOpenLogin} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} />;
      case 'cart': return <CartView onBack={navigateToHome} onNavigateToCheckout={navigateToCheckout} flashSales={flashSales} allPromoCodes={allPromoCodes} appliedPromoCode={appliedPromoCode} onApplyPromoCode={setAppliedPromoCode} />;
      case 'checkout': return <Checkout onBack={navigateToCart} onOrderConfirm={handleConfirmOrder} flashSales={flashSales} allPickupPoints={allPickupPoints} appliedPromoCode={appliedPromoCode} allStores={allStores} />;
      case 'order-success': return <OrderSuccess onNavigateHome={navigateToHome} onNavigateToOrders={navigateToOrderHistory} />;
      case 'stores': return <StoresPage stores={storesForDisplay} onBack={navigateToHome} onVisitStore={navigateToVendorPage} />;
      case 'promotions': return <PromotionsPage allProducts={publishedProducts} allStores={allStores} onProductClick={navigateToProduct} onBack={navigateToHome} onVendorClick={navigateToVendorPage} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />;
      case 'flash-sales': return <FlashSalesPage allProducts={publishedProducts} flashSales={flashSales} onProductClick={navigateToProduct} onBack={navigateToHome} onVendorClick={navigateToVendorPage} allStores={allStores} isComparisonEnabled={isComparisonEnabled} />;
      case 'search-results': return <SearchResultsPage searchQuery={searchQuery} allProducts={publishedProducts} allStores={allStores} onProductClick={navigateToProduct} onBack={navigateToHome} onVendorClick={navigateToVendorPage} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />;
      case 'wishlist': return <WishlistPage allProducts={allProducts} onProductClick={navigateToProduct} onBack={navigateToHome} onVendorClick={navigateToVendorPage} allStores={allStores} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />;
      case 'become-seller': return <BecomeSeller onBack={navigateToHome} onBecomeSeller={handleBecomeSeller} onRegistrationSuccess={navigateToSellerDashboard} siteSettings={siteSettings} />;
      case 'category': return selectedCategory && <CategoryPage categoryName={selectedCategory} allProducts={publishedProducts} allStores={allStores} onProductClick={navigateToProduct} onBack={navigateToHome} onVendorClick={navigateToVendorPage} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />;
      case 'seller-dashboard': return user && <SellerDashboard 
                                                  store={currentStore} products={sellerProducts} sellerOrders={sellerOrders} promoCodes={sellerPromoCodes} onBack={navigateToHome} 
                                                  onAddProduct={onAddProduct} onEditProduct={navigateToProductForm} onDeleteProduct={handleDeleteProduct} onToggleStatus={handleToggleProductStatus} 
                                                  onNavigateToProfile={navigateToSellerProfile} categories={sellerCategories} onSetPromotion={handleOpenPromotionModal} onRemovePromotion={handleRemovePromotion} 
                                                  flashSales={flashSales} onProposeForFlashSale={handleProposeForFlashSale} onUploadDocument={handleUploadDocument} onUpdateOrderStatus={handleUpdateOrderStatus}
                                                  onCreatePromoCode={handleCreatePromoCode} onDeletePromoCode={handleDeletePromoCode} isChatEnabled={isChatEnabled} onPayRent={handlePayRent} siteSettings={siteSettings} />;
      case 'vendor-page': return selectedVendor && <VendorPage vendorName={selectedVendor} allProducts={publishedProducts} allStores={allStores} onProductClick={navigateToProduct} onBack={navigateToHome} onVendorClick={navigateToVendorPage} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />;
      case 'product-form': return <ProductForm onCancel={navigateToSellerDashboard} onSave={handleSaveProduct} productToEdit={productToEdit} categories={allCategories} onAddCategory={addCategory} />;
      case 'seller-profile': return currentStore && <SellerProfile store={currentStore} onBack={navigateToSellerDashboard} onUpdateProfile={handleUpdateSellerProfile} />;
      case 'superadmin-dashboard': return <SuperAdminDashboard allUsers={allUsers} allOrders={allOrders} allCategories={allCategories} allStores={allStores} siteActivityLogs={siteActivityLogs} onUpdateOrderStatus={handleUpdateOrderStatus} onUpdateCategoryImage={handleUpdateCategoryImage} onWarnStore={handleWarnStore} onToggleStoreStatus={handleToggleStoreStatus} onApproveStore={handleApproveStore} onRejectStore={handleRejectStore} onSaveFlashSale={handleSaveFlashSale} flashSales={flashSales} allProducts={allProducts} onUpdateFlashSaleSubmissionStatus={handleUpdateFlashSaleSubmissionStatus} onBatchUpdateFlashSaleStatus={handleBatchUpdateFlashSaleStatus} onRequestDocument={handleRequestDocument} onVerifyDocumentStatus={handleVerifyDocumentStatus} allPickupPoints={allPickupPoints} onAddPickupPoint={handleAddPickupPoint} onUpdatePickupPoint={handleUpdatePickupPoint} onDeletePickupPoint={handleDeletePickupPoint} onAssignAgent={handleAssignAgent} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onToggleChatFeature={handleToggleChatFeature} onToggleComparisonFeature={handleToggleComparisonFeature} siteSettings={siteSettings} onUpdateSiteSettings={handleUpdateSiteSettings} onAdminAddCategory={handleAdminAddCategory} onAdminDeleteCategory={handleAdminDeleteCategory} onUpdateUserRole={handleUpdateUserRole} payouts={payouts} onPayoutSeller={handlePayoutSeller} onActivateSubscription={handleActivateSubscription} advertisements={advertisements} onAddAdvertisement={handleAddAdvertisement} onUpdateAdvertisement={handleUpdateAdvertisement} onDeleteAdvertisement={handleDeleteAdvertisement} onToggleStorePremiumStatus={handleToggleStorePremiumStatus} />;
      case 'order-history': return user && <OrderHistoryPage userOrders={userOrders} onBack={navigateToHome} onSelectOrder={navigateToOrderDetail} />;
      case 'order-detail': return selectedOrder && <OrderDetailPage order={selectedOrder} onBack={navigateToOrderHistory} allPickupPoints={allPickupPoints} onCancelOrder={handleCancelOrder} onRequestRefund={handleRequestRefund} />;
      case 'delivery-agent-dashboard': return <DeliveryAgentDashboard allOrders={allOrders} allStores={allStores} allPickupPoints={allPickupPoints} onUpdateOrderStatus={handleUpdateOrderStatus} />;
      case 'depot-agent-dashboard': return user && <DepotAgentDashboard allOrders={allOrders} onCheckIn={handleCheckInAtDepot} />;
      case 'comparison': return <ComparisonPage onBack={navigateToHome} />;
      case 'become-premium': return <BecomePremiumPage siteSettings={siteSettings} onBack={navigateToHome} onBecomePremiumByCaution={handleBecomePremiumByCaution} onUpgradeToPremiumPlus={handleUpgradeToPremiumPlus} />;
      case 'analytics-dashboard': return <AnalyticsDashboard onBack={navigateToSuperAdminDashboard} allOrders={allOrders} allProducts={allProducts} allStores={allStores} allUsers={allUsers} />;
      case 'review-moderation': return <ReviewModeration onBack={navigateToSuperAdminDashboard} allProducts={allProducts} onReviewModeration={handleReviewModeration} />;
      case 'info': return infoPageContent && <InfoPage title={infoPageContent.title} content={infoPageContent.content} onBack={navigateToHome} />;
      case 'home': default: return <HomePage categories={allCategories} products={publishedProducts} stores={storesForDisplay} onProductClick={navigateToProduct} onCategoryClick={navigateToCategory} onVendorClick={navigateToVendorPage} onVisitStore={navigateToVendorPage} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} advertisements={advertisements.filter(ad => ad.isActive)} />;
    }
  };

  return (
    <div className="min-h-screen text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
      {isModalOpen && modalProduct && <AddToCartModal product={modalProduct} onClose={closeModal} onNavigateToCart={() => { closeModal(); navigateToCart();}} />}
      {promotionModalProduct && <PromotionModal product={promotionModalProduct} onClose={handleClosePromotionModal} onSave={handleSetPromotion} />}
      {isChatEnabled && user && <ChatWidget allUsers={allUsers} allProducts={allProducts} />}
      <Header 
        categories={allCategories}
        onNavigateHome={navigateToHome} 
        onNavigateCart={navigateToCart}
        onNavigateToStores={navigateToStores}
        onNavigateToPromotions={navigateToPromotions}
        onNavigateToCategory={navigateToCategory}
        onNavigateToBecomeSeller={navigateToBecomeSeller}
        onNavigateToSellerDashboard={navigateToSellerDashboard}
        onNavigateToSellerProfile={navigateToSellerProfile}
        onOpenLogin={onOpenLogin}
        onNavigateToOrderHistory={navigateToOrderHistory}
        onNavigateToSuperAdminDashboard={navigateToSuperAdminDashboard}
        onNavigateToFlashSales={navigateToFlashSales}
        onNavigateToWishlist={navigateToWishlist}
        onNavigateToDeliveryAgentDashboard={navigateToDeliveryAgentDashboard}
        onNavigateToDepotAgentDashboard={navigateToDepotAgentDashboard}
        onSearch={handleSearch}
        isChatEnabled={isChatEnabled}
        onNavigateToBecomePremium={navigateToBecomePremium}
        isPremiumProgramEnabled={siteSettings.isPremiumProgramEnabled}
        onNavigateToAnalyticsDashboard={navigateToAnalyticsDashboard}
        onNavigateToReviewModeration={navigateToReviewModeration}
      />
      <main className="pb-16">
        {renderContent()}
      </main>
      <Footer onNavigate={navigateToInfoPage} />
      {isComparisonEnabled && <ComparisonBar onCompareClick={navigateToComparison} />}
    </div>
  );
}

export default App;