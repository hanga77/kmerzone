

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProductDetail from './components/ProductDetail';
import CartView from './components/Cart';
import Checkout from './components/Checkout';
import OrderSuccess from './components/OrderSuccess';
import LoginModal from './components/LoginModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ResetPasswordPage from './components/ResetPasswordPage';
import StoresPage from './components/StoresPage';
import StoresMapPage from './components/StoresMapPage';
import BecomeSeller from './components/BecomeSeller';
import CategoryPage from './components/CategoryPage';
import SellerDashboard from './components/SellerDashboard';
import VendorPage from './components/VendorPage';
import ProductForm from './components/ProductForm';
import SellerProfile from './components/SellerProfile';
// Fix: Import SuperAdminDashboard as a default import since it is a default export.
import SuperAdminDashboard from './components/SuperAdminDashboard';
import OrderHistoryPage from './components/OrderHistoryPage';
import { OrderDetailPage } from './components/OrderDetailPage';
import PromotionsPage from './components/PromotionsPage';
import FlashSalesPage from './components/FlashSalesPage';
import SearchResultsPage from './components/SearchResultsPage';
import WishlistPage from './components/WishlistPage';
// Fix: Import DeliveryAgentDashboard as a named import.
import { DeliveryAgentDashboard } from './components/DeliveryAgentDashboard';
import { DepotAgentDashboard } from './components/DepotAgentDashboard';
import ComparisonPage from './components/ComparisonPage';
import ComparisonBar from './components/ComparisonBar';
import BecomePremiumPage from './components/BecomePremiumPage';
import InfoPage from './components/InfoPage';
import MaintenancePage from './components/MaintenancePage';
import NotFoundPage from './components/NotFoundPage';
import ForbiddenPage from './components/ForbiddenPage';
import ServerErrorPage from './components/ServerErrorPage';
import AccountPage from './components/AccountPage';
import { useAuth } from './contexts/AuthContext';
import { useComparison } from './contexts/ComparisonContext';
import type { Product, Category, Store, Review, Order, Address, OrderStatus, User, SiteActivityLog, FlashSale, DocumentStatus, PickupPoint, NewOrderData, TrackingEvent, PromoCode, Warning, SiteSettings, CartItem, UserRole, Payout, Advertisement, Discrepancy, Story, UserAvailabilityStatus, DisputeMessage, StatusChangeLogEntry, FlashSaleProduct, RequestedDocument, SiteContent, Ticket, TicketMessage, TicketStatus, TicketPriority, Announcement } from './types';
import AddToCartModal from './components/AddToCartModal';
import { useUI } from './contexts/UIContext';
import StoryViewer from './components/StoryViewer';
import PromotionModal from './components/PromotionModal';
import { useCart } from './contexts/CartContext';
import ChatWidget from './components/ChatWidget';
import { ArrowLeftIcon, BarChartIcon, ShieldCheckIcon, CurrencyDollarIcon, ShoppingBagIcon, UsersIcon, StarIcon, XIcon } from './components/Icons';
import { usePersistentState } from './hooks/usePersistentState';

type Page = 'home' | 'product' | 'cart' | 'checkout' | 'order-success' | 'stores' | 'stores-map' | 'become-seller' | 'category' | 'seller-dashboard' | 'vendor-page' | 'product-form' | 'seller-profile' | 'superadmin-dashboard' | 'order-history' | 'order-detail' | 'promotions' | 'flash-sales' | 'search-results' | 'wishlist' | 'delivery-agent-dashboard' | 'depot-agent-dashboard' | 'comparison' | 'become-premium' | 'info' | 'not-found' | 'forbidden' | 'server-error' | 'reset-password' | 'account' | 'seller-analytics-dashboard';

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

const SellerAnalyticsDashboard: React.FC<{
    onBack: () => void;
    sellerOrders: Order[];
    sellerProducts: Product[];
    flashSales: FlashSale[];
}> = ({ onBack, sellerOrders, sellerProducts, flashSales }) => {
    const analytics = useMemo(() => {
        const getFinalPrice = (item: CartItem) => {
            const flashPrice = getActiveFlashSalePrice(item.id, flashSales);
            if (flashPrice !== null) return flashPrice;
            if (isPromotionActive(item)) return item.promotionPrice!;
            return item.price;
        };

        const deliveredOrders = sellerOrders.filter(o => o.status === 'delivered');
        const totalRevenue = deliveredOrders.reduce((sum, order) => {
             const sellerItemsTotal = order.items.reduce((itemSum, item) => itemSum + getFinalPrice(item) * item.quantity, 0);
             return sum + sellerItemsTotal;
        }, 0);
        
        const totalDeliveredOrders = deliveredOrders.length;
        const averageOrderValue = totalDeliveredOrders > 0 ? totalRevenue / totalDeliveredOrders : 0;

        const topProducts = deliveredOrders
            .flatMap(o => o.items)
            .reduce((acc, item) => {
                const existing = acc.find(p => p.id === item.id);
                const revenue = getFinalPrice(item) * item.quantity;
                if (existing) {
                    existing.revenue += revenue;
                    existing.quantitySold += item.quantity;
                } else {
                    acc.push({ id: item.id, name: item.name, revenue, quantitySold: item.quantity });
                }
                return acc;
            }, [] as { id: string; name: string; revenue: number; quantitySold: number }[]);
        
        const sortedTopProducts = topProducts.sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        return {
            totalRevenue,
            totalOrders: totalDeliveredOrders,
            averageOrderValue,
            topProducts: sortedTopProducts,
        };
    }, [sellerOrders, flashSales]);

    return (
        <div className="container mx-auto p-4 sm:p-8 animate-in bg-gray-50 dark:bg-gray-900">
            <button onClick={onBack} className="text-kmer-green font-semibold mb-6 inline-flex items-center gap-2">
                <ArrowLeftIcon className="w-5 h-5"/>
                Retour au tableau de bord
            </button>
            <div className="flex items-center gap-3 mb-8">
                <BarChartIcon className="w-8 h-8"/>
                <h1 className="text-3xl font-bold">Analyse des Ventes</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard icon={<CurrencyDollarIcon className="w-7 h-7"/>} label="Revenu Total (Livré)" value={`${analytics.totalRevenue.toLocaleString('fr-CM')} FCFA`} color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300" />
                <StatCard icon={<ShoppingBagIcon className="w-7 h-7"/>} label="Commandes Livrées" value={analytics.totalOrders} color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" />
                <StatCard icon={<StarIcon className="w-7 h-7"/>} label="Panier Moyen" value={`${analytics.averageOrderValue.toLocaleString('fr-CM', { maximumFractionDigits: 0 })} FCFA`} color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300" />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm p-6 h-full">
                    <h2 className="text-xl font-bold mb-4">Top 5 Produits (par revenu)</h2>
                    <ul className="space-y-3">
                        {analytics.topProducts.map((product) => (
                            <li key={product.id} className="flex justify-between items-center text-sm">
                                <div>
                                    <span className="font-medium dark:text-gray-200">{product.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({product.quantitySold} vendus)</span>
                                </div>
                                <span className="font-bold text-kmer-green">{product.revenue.toLocaleString('fr-CM')} FCFA</span>
                            </li>
                        ))}
                         {analytics.topProducts.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aucune donnée de vente pour le moment.</p>}
                    </ul>
                </div>
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
    { id: '2', name: 'Robe en Tissu Pagne', price: 15000, imageUrls: ['https://images.unsplash.com/photo-1617051395299-52d33b7336b1?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Une robe élégante confectionnée à la main avec du tissu pagne de haute qualité.", reviews: [{author: "Aïcha B.", rating: 4, comment: "Très belles couleurs.", date: "2023-10-11", status: 'approved'}], stock: 8, categoryId: 'sub-vetements', status: 'published', brand: 'Kmer Fashion' },
    { id: '3', name: 'Savon Artisanal à l\'huile d\'olive', price: 1500, imageUrls: ['https://images.unsplash.com/photo-1600966492337-1d83c4bee955?q=80&w=2070&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Un savon artisanal fabriqué localement. Doux pour la peau et respectueux de l'environnement.", reviews: [], stock: 50, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '4', name: 'Smartphone Pro Max', price: 75000, promotionPrice: 69900, imageUrls: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1965&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un smartphone performant avec un excellent rapport qualité-prix. Grand écran et bonne autonomie.", reviews: [{author: "Eric K.", rating: 5, comment: "Super téléphone pour le prix.", date: "2023-10-12", status: 'approved'}], stock: 4, categoryId: 'sub-telephones-casques', status: 'published', promotionStartDate: '2024-07-01', promotionEndDate: '2024-07-31', brand: 'TechPro' },
    { id: '5', name: 'Miel d\'Oku', price: 5000, imageUrls: ['https://images.unsplash.com/photo-1558642754-b27b3b95a8a9?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Un miel blanc rare et primé, récolté sur les flancs du mont Oku.", reviews: [{author: "Fatima G.", rating: 5, comment: "Le meilleur miel que j'ai jamais goûté.", date: "2023-10-13", status: 'approved'}], stock: 25, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '6', name: 'Sandales en cuir', price: 8000, imageUrls: ['https://images.unsplash.com/photo-1620652755231-c2f8b16a2b8e?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Sandales en cuir véritable, faites à la main. Confortables et durables.", reviews: [], stock: 10, categoryId: 'sub-chaussures', status: 'draft', brand: 'Kmer Fashion' },
    { id: '7', name: 'Poulet DG', price: 6500, imageUrls: ['https://images.unsplash.com/photo-1543339308-43e59d6b70a6?q=80&w=2070&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Un plat de fête succulent avec du poulet frit, des plantains et une sauce riche en légumes.", reviews: [], stock: 12, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '8', name: 'Jus de Bissap Naturel', price: 1000, imageUrls: ['https://images.unsplash.com/photo-1623341214825-9f4f96d62c54?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Boisson rafraîchissante et naturelle à base de fleurs d'hibiscus.", reviews: [], stock: 30, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '9', name: 'Beignets Haricots Bouillie', price: 1500, imageUrls: ['https://img.cuisineaz.com/660x660/2022/01/24/i181710-beignets-souffles-camerounais.jpeg'], vendor: 'Mama Africa', description: "Le petit-déjeuner camerounais par excellence. Des beignets soufflés accompagnés d'une purée de haricots.", reviews: [], stock: 20, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '10', name: 'Chemise en Toghu', price: 25000, imageUrls: ['https://i.pinimg.com/564x/a0/0c/37/a00c3755255673a5a415958253a5f82c.jpg'], vendor: 'Kmer Fashion', description: "Chemise de cérémonie pour homme, en velours noir brodé avec les motifs colorés traditionnels du Toghu.", reviews: [], stock: 5, categoryId: 'sub-vetements', status: 'published', brand: 'Kmer Fashion' },
    { id: '11', name: 'Poivre de Penja', price: 4500, imageUrls: ['https://images.unsplash.com/photo-1508616258423-f3e4e73b29b4?q=80&w=1935&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Considéré comme l'un des meilleurs poivres au monde, cultivé sur les terres volcaniques de Penja.", reviews: [], stock: 40, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '12', name: 'Sac à main en pagne', price: 12000, imageUrls: ['https://images.unsplash.com/photo-1566150905458-1bf1f2961239?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Accessoirisez votre tenue avec ce magnifique sac à main fait main, alliant cuir et tissu pagne.", reviews: [], stock: 15, categoryId: 'sub-sacs', status: 'published', brand: 'Kmer Fashion' },
    { id: '13', name: 'Téléviseur LED 32"', price: 85000, imageUrls: ['https://images.unsplash.com/photo-1593359677879-a4bb92f82acb?q=80&w=2070&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un téléviseur LED de 32 pouces avec une image de haute qualité.", reviews: [], stock: 9, categoryId: 'sub-telephones-casques', status: 'published', brand: 'ViewSonic' },
    { id: '14', name: 'Fer à repasser', price: 7500, imageUrls: ['https://images.unsplash.com/photo-1622629734636-95a239552382?q=80&w=1932&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Simple, efficace et durable. Ce fer à repasser est parfait pour un usage quotidien.", reviews: [], stock: 25, categoryId: 'sub-telephones-casques', status: 'published', brand: 'Generic' },
    { id: '15', name: 'Blender / Mixeur', price: 18000, imageUrls: ['https://images.unsplash.com/photo-1582142391035-61f20a003881?q=80&w=1974&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un mixeur puissant pour préparer vos jus, soupes et sauces. Bol en verre robuste de 1.5L.", reviews: [], stock: 18, categoryId: 'sub-telephones-casques', status: 'published', brand: 'MixWell' },
    { id: '16', name: 'Savon noir gommant', price: 2500, imageUrls: ['https://images.unsplash.com/photo-1623461624469-8a964343169f?q=80&w=1974&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Savon noir africain pour un gommage naturel et une peau douce et purifiée.", reviews: [], stock: 40, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '17', name: 'Huile de coco vierge', price: 4000, imageUrls: ['https://images.unsplash.com/photo-1590945259635-e1a532ac9695?q=80&w=1974&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Huile de coco 100% pure et pressée à froid. Idéale pour la peau, les cheveux et la cuisson.", reviews: [], stock: 30, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '18', name: 'Beurre de karité', price: 3000, imageUrls: ['https://images.unsplash.com/photo-1554153041-33924bb6aa67?q=80&w=2070&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Beurre de karité brut et non raffiné, parfait pour hydrater en profondeur la peau et les cheveux secs.", reviews: [], stock: 60, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '19', name: 'Baskets de Ville', price: 22000, imageUrls: ['https://images.unsplash.com/photo-1515955656352-a1fa3ffcdda9?q=80&w=2070&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Baskets confortables et stylées pour un usage quotidien.", reviews: [], stock: 20, categoryId: 'sub-chaussures', status: 'published', brand: 'CityWalkers' },
    { id: '20', name: 'Eau de Parfum "Sawa"', price: 28000, imageUrls: ['https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1904&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Un parfum boisé et épicé pour homme, inspiré par la côte camerounaise.", reviews: [], stock: 15, categoryId: 'sub-parfums', status: 'published', brand: 'Douala Soaps' },
    { id: '21', name: 'Fauteuil en Rotin', price: 45000, imageUrls: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1965&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Fauteuil artisanal en rotin, parfait pour votre salon ou votre terrasse.", reviews: [], stock: 5, categoryId: 'sub-chaises', status: 'published', brand: 'HomeDecor' },
    { id: '22', name: 'Masque décoratif Fang', price: 18000, imageUrls: ['https://images.unsplash.com/photo-1513480749022-2f7a0b1e4a1a?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Authentique masque décoratif de l'ethnie Fang, sculpté à la main.", reviews: [], stock: 10, categoryId: 'sub-decoration', status: 'published', brand: 'Artisanat Local' },
    { id: '23', name: 'Lampe de chevet "Wouri"', price: 13500, imageUrls: ['https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=1974&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Lampe de chevet au design moderne avec une base en bois local.", reviews: [], stock: 22, categoryId: 'sub-decoration', status: 'published', brand: 'HomeDecor' },
    { id: '24', name: 'Collier de perles', price: 9500, imageUrls: ['https://images.unsplash.com/photo-1599643477877-539eb8a52f18?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Collier artisanal fait de perles traditionnelles colorées.", reviews: [], stock: 30, categoryId: 'sub-bijoux', status: 'published', brand: 'Artisanat Local' },
    { id: '25', name: 'Montre Classique Homme', price: 32000, imageUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Montre élégante avec bracelet en cuir, idéale pour le bureau ou les sorties.", reviews: [], stock: 12, categoryId: 'sub-montres', status: 'published', brand: 'TimeMaster' },
    { id: '26', name: 'Poupée "Penda"', price: 7000, imageUrls: ['https://images.unsplash.com/photo-1620243423599-da1c88a51e6c?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Poupée en tissu pagne, faite à la main, pour le bonheur des plus petits.", reviews: [], stock: 25, categoryId: 'sub-jouets-fournitures', status: 'published', brand: 'Artisanat Local' },
    { id: '27', name: 'Lot de 10 Cahiers', price: 2500, imageUrls: ['https://images.unsplash.com/photo-1529142893173-665a0a1027c4?q=80&w=2070&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un lot de 10 cahiers de 100 pages pour la rentrée scolaire.", reviews: [], stock: 100, categoryId: 'sub-papeterie', status: 'published', brand: 'School Essentials' },
    { id: '28', name: 'Bière "33" Export (Pack de 6)', price: 4000, imageUrls: ['https://www.bebe-cash.com/wp-content/uploads/2021/07/33-export.jpg'], vendor: 'Mama Africa', description: "La bière blonde de référence au Cameroun. Pack de 6 bouteilles de 65cl.", reviews: [], stock: 50, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '29', name: 'Café Arabica en Grains', price: 6000, imageUrls: ['https://images.unsplash.com/photo-1559449272-4d24b2f27b72?q=80&w=1974&auto=format&fit=crop'], vendor: 'Bafoussam Brews', description: "Café Arabica de l'Ouest Cameroun, torréfaction artisanale. Sachet de 500g.", reviews: [], stock: 30, categoryId: 'sub-autres-textiles', status: 'published', brand: 'Bafoussam Brews' },
    { id: '30', name: 'Statuette en bois d\'ébène', price: 22000, imageUrls: ['https://i.pinimg.com/564x/7d/50/e0/7d50e0529d1ccf1b36952d76d4a52efc.jpg'], vendor: 'Limbe Arts & Crafts', description: "Statuette finement sculptée à la main par des artisans de la région du Sud-Ouest.", reviews: [], stock: 8, categoryId: 'sub-decoration', status: 'published', brand: 'Limbe Arts & Crafts' },
    { id: '31', name: 'Tableau d\'art contemporain', price: 48000, imageUrls: ['https://i.pinimg.com/564x/e7/7d/1f/e77d1f6d396a84c25f573453347f31b2.jpg'], vendor: 'Limbe Arts & Crafts', description: "Peinture sur toile vibrante, représentant une scène de marché local.", reviews: [], stock: 3, categoryId: 'sub-decoration', status: 'published', brand: 'Limbe Arts & Crafts' },
    { id: '32', name: 'Écouteurs sans fil', price: 12500, imageUrls: ['https://images.unsplash.com/photo-1606220588913-b35474623dc5?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kribi Digital', description: "Écouteurs Bluetooth avec une bonne autonomie et un son clair. Idéal pour la musique et les appels.", reviews: [], stock: 25, categoryId: 'sub-chargeurs-cables-batteries', status: 'draft' }, // In draft, store is pending
    { id: '33', name: 'Café Robusta Moulu', price: 4500, imageUrls: ['https://images.unsplash.com/photo-1611162458022-20c24b071a2a?q=80&w=2070&auto=format&fit=crop'], vendor: 'Bafoussam Brews', description: "Café Robusta puissant et aromatique, parfait pour un expresso corsé. Sachet de 500g.", reviews: [], stock: 40, categoryId: 'sub-autres-textiles', status: 'published', brand: 'Bafoussam Brews' },
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
    agentId: 'agent-1',
    trackingHistory: [
        { status: 'confirmed', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), location: 'Mama Africa', details: 'Commande confirmée' },
        { status: 'picked-up', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), location: 'Livreur', details: 'Colis pris en charge' },
        { status: 'delivered', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), location: 'Yaoundé', details: 'Livré avec succès' }
    ]
};

const sampleDeliveredOrder2: Order = {
    id: 'ORDER-SAMPLE-2',
    userId: 'customer-1',
    items: [
        { ...initialProducts.find(p => p.id === '2')!, quantity: 1 }, // Robe en Tissu Pagne
        { ...initialProducts.find(p => p.id === '12')!, quantity: 1 } // Sac à main
    ],
    subtotal: 27000,
    deliveryFee: 1000,
    total: 28000,
    shippingAddress: { fullName: 'Client de Test 2', phone: '655555556', address: '456 Rue du Test', city: 'Douala' },
    deliveryMethod: 'home-delivery',
    orderDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
    status: 'delivered',
    trackingNumber: 'KZSAMPLE2',
    trackingHistory: [],
};

const sampleDeliveredOrder3: Order = {
    id: 'ORDER-SAMPLE-3',
    userId: 'customer-1',
    items: [
        { ...initialProducts.find(p => p.id === '13')!, quantity: 1 } // TV
    ],
    subtotal: 85000,
    deliveryFee: 2500,
    total: 87500,
    shippingAddress: { fullName: 'Client de Test 3', phone: '655555557', address: '789 Rue du Test', city: 'Yaoundé' },
    deliveryMethod: 'home-delivery',
    orderDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months ago
    status: 'delivered',
    trackingNumber: 'KZSAMPLE3',
    trackingHistory: [],
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
        id: 'store-7', name: 'Limbe Arts & Crafts', logoUrl: 'https://i.pinimg.com/736x/8a/9e-12/8a9e-1261a8779728283575647585355e.jpg', category: 'Artisanat & Décoration', warnings: [], status: 'active', premiumStatus: 'premium',
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
  commissionRate: 10,
  maintenanceMode: {
      isEnabled: false,
      message: "Nous effectuons une mise à jour. Nous serons de retour très bientôt !",
      reopenDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  }
};

const initialSiteContent: SiteContent[] = [
  {
    slug: 'about',
    title: "À propos de KMER ZONE",
    content: "KMER ZONE est la première plateforme e-commerce camerounaise dédiée à la mise en relation directe des commerçants locaux et des consommateurs. Notre mission est de démocratiser l'accès au commerce en ligne, de valoriser les produits locaux et de simplifier l'expérience d'achat pour tous les Camerounais."
  },
  {
    slug: 'contact',
    title: "Contactez-nous",
    content: "Pour toute question, partenariat ou assistance, veuillez nous contacter à l'adresse suivante : support@kmerzone.com. Notre équipe est disponible 24/7 pour vous aider."
  },
  {
    slug: 'faq',
    title: "Foire Aux Questions (FAQ)",
    content: "Q: Quels sont les délais de livraison ?\nR: Les délais varient entre 24h et 72h en fonction de votre localisation et de celle du vendeur.\n\nQ: Les paiements sont-ils sécurisés ?\nR: Oui, nous utilisons les plateformes de paiement mobile les plus fiables du pays pour garantir la sécurité de vos transactions."
  },
  {
    slug: 'careers',
    title: "Carrières",
    content: "Rejoignez une équipe dynamique et passionnée qui révolutionne le e-commerce au Cameroun ! Consultez nos offres d'emploi sur notre page LinkedIn ou envoyez votre candidature spontanée à careers@kmerzone.com."
  },
  {
    slug: 'sell',
    title: "Vendre sur KMER ZONE",
    content: "Augmentez votre visibilité et vos ventes en rejoignant notre marketplace. L'inscription est simple et rapide. Cliquez sur 'Devenir vendeur' en haut de la page pour commencer votre aventure avec nous !"
  },
  {
    slug: 'training-center',
    title: "Centre de formation",
    content: "Bientôt disponible : des tutoriels et des guides pour vous aider à maximiser vos ventes."
  },
  {
    slug: 'logistics',
    title: "Logistique & Livraison",
    content: "Notre réseau de livreurs est à votre disposition pour garantir des livraisons rapides et fiables à vos clients."
  }
];

const initialAdvertisements: Advertisement[] = [
    { id: 'ad1', imageUrl: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1920&auto=format&fit=crop', linkUrl: '#', location: 'homepage-banner', isActive: true },
    { id: 'ad2', imageUrl: 'https://images.unsplash.com/photo-1598327105151-586673437584?q=80&w=1920&auto=format&fit=crop', linkUrl: '#', location: 'homepage-banner', isActive: true },
];

const AnnouncementBanner: React.FC<{
  announcement: Announcement;
  onDismiss: (id: string) => void;
}> = ({ announcement, onDismiss }) => {
  return (
    <div className="bg-kmer-yellow text-gray-900 p-3 text-center relative font-semibold text-sm">
      <p>
        <strong className="font-bold uppercase">{announcement.title}:</strong> {announcement.content}
      </p>
      <button onClick={() => onDismiss(announcement.id)} className="absolute top-1/2 right-4 -translate-y-1/2">
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

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
  const [siteContent, setSiteContent] = usePersistentState<SiteContent[]>('siteContent', initialSiteContent);
  const [activeAccountTab, setActiveAccountTab] = useState('profile');

  const [allProducts, setAllProducts] = usePersistentState<Product[]>('allProducts', initialProducts);
  const [allCategories, setAllCategories] = usePersistentState<Category[]>('allCategories', initialCategories);
  const [allStores, setAllStores] = usePersistentState<Store[]>('allStores', initialStores);
  const [allOrders, setAllOrders] = usePersistentState<Order[]>('allOrders', [sampleDeliveredOrder, sampleDeliveredOrder2, sampleDeliveredOrder3]);
  const [allPromoCodes, setAllPromoCodes] = usePersistentState<PromoCode[]>('allPromoCodes', []);
  const [siteActivityLogs, setSiteActivityLogs] = usePersistentState<SiteActivityLog[]>('siteActivityLogs', []);
  const [flashSales, setFlashSales] = usePersistentState<FlashSale[]>('flashSales', initialFlashSales);
  const [allPickupPoints, setAllPickupPoints] = usePersistentState<PickupPoint[]>('allPickupPoints', initialPickupPoints);
    const [payouts, setPayouts] = usePersistentState<Payout[]>('payouts', []);
    const [advertisements, setAdvertisements] = usePersistentState<Advertisement[]>('advertisements', initialAdvertisements);
    const [allTickets, setAllTickets] = usePersistentState<Ticket[]>('allTickets', []);
    const [allAnnouncements, setAllAnnouncements] = usePersistentState<Announcement[]>('allAnnouncements', []);
    const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);

    const { user, logout: authLogout, allUsers, setAllUsers, updateUser: authUpdateUser, resetPassword } = useAuth();
    const { isModalOpen, modalProduct, closeModal: uiCloseModal } = useUI();
    const { cart, clearCart, addToCart } = useCart();
    const { comparisonList, setProducts: setComparisonProducts } = useComparison();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [promotionModalProduct, setPromotionModalProduct] = useState<Product | null>(null);
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    const [emailForPasswordReset, setEmailForPasswordReset] = useState<string | null>(null);

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

    const userId = user?.id;

    useEffect(() => {
        // This effect automatically upgrades a customer to Premium status based on their order history.
        // It's designed to prevent infinite loops by checking the most current user data from `allUsers`
        // instead of the potentially stale `user` object from context.
        if (userId) {
            const currentUserInList = allUsers.find(u => u.id === userId);

            if (!currentUserInList || currentUserInList.role !== 'customer' || !siteSettings.isPremiumProgramEnabled) {
                return;
            }

            if (currentUserInList.loyalty.status !== 'standard' || currentUserInList.loyalty.premiumStatusMethod === 'deposit') {
                return;
            }

            const userOrders = allOrders.filter(o => o.userId === userId && o.status === 'delivered');
            const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
            const orderCount = userOrders.length;

            const shouldBePremium = orderCount >= siteSettings.premiumThresholds.orders || totalSpent >= siteSettings.premiumThresholds.spending;

            if (shouldBePremium) {
                setAllUsers(users => users.map(u => 
                    u.id === userId 
                        ? { ...u, loyalty: { ...u.loyalty, status: 'premium' as const, premiumStatusMethod: 'loyalty' as const } }
                        : u
                ));
            }
        }
    }, [allOrders, allUsers, userId, siteSettings, setAllUsers]);

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

    const handleOpenForgotPassword = () => {
        setIsLoginModalOpen(false);
        setIsForgotPasswordModalOpen(true);
    };

    const handleForgotPasswordSubmit = (email: string) => {
        // In a real app, this would trigger sending a reset email.
        // For this simulation, we'll check if the user exists and prepare for reset.
        const userExists = allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
            setEmailForPasswordReset(email);
        }
        // The modal will show a confirmation. For simulation, let's also navigate.
        setIsForgotPasswordModalOpen(false);
        if (userExists) {
            // This is a temporary solution for the demo to show the next step.
            // In a real app, the user would click a link in their email.
            alert("Un e-mail de réinitialisation a été envoyé (simulation). Vous allez être redirigé vers la page de réinitialisation.");
            handleNavigate('reset-password');
        } else {
             // We show the same message whether the user exists or not for security reasons.
             alert("Si un compte correspondant à cet email existe, un lien de réinitialisation a été envoyé.");
        }
    };
    
    const handlePasswordReset = (newPassword: string) => {
        if (emailForPasswordReset) {
            resetPassword(emailForPasswordReset, newPassword);
            setEmailForPasswordReset(null);
            // The success is handled inside the ResetPasswordPage component
        } else {
            // This case should ideally not happen if the flow is correct
            alert("Erreur: Aucune adresse e-mail n'a été spécifiée pour la réinitialisation.");
            handleNavigate('home');
        }
    };
    
    const handleNavigateLoginFromReset = () => {
        handleNavigate('home');
        setIsLoginModalOpen(true);
    };

    const handleNavigateToAccount = (tab: string = 'profile') => {
        setActiveAccountTab(tab);
        handleNavigate('account');
    };


    const handlePlaceOrder = useCallback(async (orderData: NewOrderData): Promise<void> => {
        logActivity('Order Placed', `New order created with total ${orderData.total.toLocaleString('fr-CM')} FCFA.`);
        
        const newOrder: Order = {
            ...orderData,
            id: `ORDER-${Date.now()}`,
            orderDate: new Date().toISOString(),
            status: 'confirmed',
            trackingNumber: `KZ${Date.now()}`,
            trackingHistory: [{
                status: 'confirmed',
                date: new Date().toISOString(),
                location: 'System',
                details: 'Commande confirmée et en attente de préparation par le vendeur.'
            }],
            statusChangeLog: [{
                status: 'confirmed',
                date: new Date().toISOString(),
                changedBy: 'Customer',
            }],
        };

        // Simulate stock deduction
        setAllProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            newOrder.items.forEach(item => {
                const productIndex = updatedProducts.findIndex(p => p.id === item.id);
                if (productIndex !== -1) {
                    const newStock = updatedProducts[productIndex].stock - item.quantity;
                    updatedProducts[productIndex] = { ...updatedProducts[productIndex], stock: Math.max(0, newStock) };
                }
            });
            return updatedProducts;
        });

        setAllOrders(prevOrders => [...prevOrders, newOrder]);
        setSelectedOrder(newOrder);
        clearCart();
        setAppliedPromoCode(null);
        handleNavigate('order-success');
    }, [logActivity, setAllProducts, setAllOrders, clearCart, handleNavigate]);
    
    const handleAddProduct = (product: Product) => {
        setAllProducts(prev => {
            const existingIndex = prev.findIndex(p => p.id === product.id);
            if (existingIndex > -1) {
                 logActivity('Product Updated', `Product "${product.name}" updated by its seller.`);
                return prev.map((p, i) => i === existingIndex ? product : p);
            }
            logActivity('Product Added', `New product "${product.name}" added by a seller.`);
            return [...prev, product];
        });
        setProductToEdit(null);
        handleNavigate('seller-dashboard');
    };

    const handleDeleteProduct = (productId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
            const productName = allProducts.find(p => p.id === productId)?.name || 'Unknown Product';
            setAllProducts(prev => prev.filter(p => p.id !== productId));
            logActivity('Product Deleted', `Product "${productName}" (ID: ${productId}) deleted by its seller.`);
        }
    };
    
    const handleToggleStatus = (productId: string) => {
        setAllProducts(prev => prev.map(p => p.id === productId ? {...p, status: p.status === 'published' ? 'draft' : 'published'} : p));
    };

    const handleSetPromotion = (productId: string, promoPrice: number, startDate?: string, endDate?: string) => {
        setAllProducts(prev => prev.map(p => {
            if (p.id === productId) {
                const productName = p.name;
                logActivity('Promotion Set', `Promotion set for product "${productName}" at ${promoPrice.toLocaleString('fr-CM')} FCFA.`);
                return {...p, promotionPrice: promoPrice, promotionStartDate: startDate, promotionEndDate: endDate };
            }
            return p;
        }));
        setPromotionModalProduct(null);
    };

    const handleRemovePromotion = (productId: string) => {
         if (window.confirm("Êtes-vous sûr de vouloir retirer la promotion de ce produit ?")) {
            setAllProducts(prev => prev.map(p => {
                 if (p.id === productId) {
                     const { promotionPrice, promotionStartDate, promotionEndDate, ...rest } = p;
                     logActivity('Promotion Removed', `Promotion removed for product "${p.name}".`);
                     return rest;
                 }
                 return p;
             }));
         }
    };
    
    const handleProposeForFlashSale = (flashSaleId: string, productId: string, flashPrice: number, sellerShopName: string) => {
        setFlashSales(prev => prev.map(fs => {
            if (fs.id === flashSaleId) {
                // Avoid duplicates
                if (fs.products.some(p => p.productId === productId)) return fs;
                
                const newProposal: FlashSaleProduct = {
                    productId,
                    sellerShopName,
                    flashPrice,
                    status: 'pending'
                };
                logActivity('Flash Sale Proposal', `Seller "${sellerShopName}" proposed product ID ${productId} for flash sale "${fs.name}".`);
                return { ...fs, products: [...fs.products, newProposal] };
            }
            return fs;
        }));
    };
    
     const handleUpdateFlashSaleSubmissionStatus = (flashSaleId: string, productId: string, status: 'approved' | 'rejected') => {
        setFlashSales(prev => prev.map(fs => {
            if (fs.id === flashSaleId) {
                const productName = allProducts.find(p => p.id === productId)?.name || `ID ${productId}`;
                logActivity('Flash Sale Submission Reviewed', `Submission for "${productName}" in sale "${fs.name}" was ${status}.`);
                return {
                    ...fs,
                    products: fs.products.map(p => p.productId === productId ? { ...p, status } : p)
                };
            }
            return fs;
        }));
    };
    
     const handleBatchUpdateFlashSaleStatus = (flashSaleId: string, productIds: string[], status: 'approved' | 'rejected') => {
        setFlashSales(prev => prev.map(fs => {
            if (fs.id === flashSaleId) {
                 logActivity('Flash Sale Batch Update', `Batch ${status} for ${productIds.length} products in sale "${fs.name}".`);
                return {
                    ...fs,
                    products: fs.products.map(p => productIds.includes(p.productId) ? { ...p, status } : p)
                };
            }
            return fs;
        }));
    };

    const handleUploadDocument = (storeId: string, documentName: string, fileUrl: string) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                logActivity('Document Uploaded', `Document "${documentName}" was uploaded for store "${s.name}".`);
                return {
                    ...s,
                    documents: s.documents.map(d => d.name === documentName ? { ...d, status: 'uploaded', fileUrl } : d)
                };
            }
            return s;
        }));
    };
    
    const handleRequestDocument = (storeId: string, documentName: string) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId && !s.documents.some(d => d.name === documentName)) {
                 logActivity('Document Requested', `Document "${documentName}" was requested for store "${s.name}".`);
                const newDoc: RequestedDocument = { name: documentName, status: 'requested' };
                return { ...s, documents: [...s.documents, newDoc] };
            }
            return s;
        }));
    };
    
    const handleVerifyDocumentStatus = (store: Store, documentName: string, status: 'verified' | 'rejected', reason: string = '') => {
        setAllStores(prev => prev.map(s => {
            if (s.id === store.id) {
                 logActivity('Document Reviewed', `Document "${documentName}" for store "${s.name}" was ${status}.`);
                return {
                    ...s,
                    documents: s.documents.map(d => d.name === documentName ? { ...d, status, rejectionReason: reason || undefined } : d)
                };
            }
            return s;
        }));
    };

    const handleCreatePromoCode = (codeData: Omit<PromoCode, 'uses'>) => {
        // Prevent duplicate codes
        if (allPromoCodes.some(pc => pc.code.toLowerCase() === codeData.code.toLowerCase())) {
            alert(`Le code promo "${codeData.code}" existe déjà.`);
            return;
        }
        const newCode: PromoCode = { ...codeData, uses: 0 };
        setAllPromoCodes(prev => [...prev, newCode]);
        logActivity('Promo Code Created', `Promo code "${newCode.code}" was created.`);
    };
    
    const handleDeletePromoCode = (code: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le code promo "${code}" ?`)) {
            setAllPromoCodes(prev => prev.filter(pc => pc.code !== code));
            logActivity('Promo Code Deleted', `Promo code "${code}" was deleted.`);
        }
    };
    
    const handleApplyPromoCode = (code: PromoCode | null) => {
        setAppliedPromoCode(code);
    };

    const handleAddReview = useCallback((productId: string, review: Review) => {
        setAllProducts(prev => prev.map(p => {
            if (p.id === productId) {
                // Add the new review, which will have a 'pending' status by default from the form
                return { ...p, reviews: [...p.reviews, review] };
            }
            return p;
        }));
         logActivity('Review Added', `New review for product ID ${productId} was submitted by ${review.author}.`);
    }, [setAllProducts, logActivity]);

    const handleReviewModeration = (productId: string, reviewIdentifier: { author: string; date: string; }, newStatus: 'approved' | 'rejected') => {
        setAllProducts(prev => prev.map(p => {
            if (p.id === productId) {
                logActivity('Review Moderated', `Review from ${reviewIdentifier.author} on product ${p.name} was ${newStatus}.`);
                return {
                    ...p,
                    reviews: p.reviews.map(r => 
                        r.author === reviewIdentifier.author && r.date === reviewIdentifier.date 
                        ? { ...r, status: newStatus }
                        : r
                    )
                };
            }
            return p;
        }));
    };
    
     const handleBecomeSeller = (shopName: string, location: string, neighborhood: string, sellerFirstName: string, sellerLastName: string, sellerPhone: string, physicalAddress: string, logoUrl: string, latitude?: number, longitude?: number) => {
        if (!user) return;
        
        const newStore: Store = {
            id: `store-${Date.now()}`,
            name: shopName,
            logoUrl: logoUrl,
            category: 'Divers', // Default category
            warnings: [],
            status: 'pending',
            premiumStatus: 'standard',
            location,
            neighborhood,
            sellerFirstName,
            sellerLastName,
            sellerPhone,
            physicalAddress,
            latitude,
            longitude,
            documents: Object.entries(siteSettings.requiredSellerDocuments)
              .filter(([, isRequired]) => isRequired)
              .map(([name]): RequestedDocument => ({ name, status: 'requested' }))
        };

        setAllStores(prev => [...prev, newStore]);
        authUpdateUser({ shopName });
        logActivity('Seller Application', `User "${user.name}" applied to become a seller with shop "${shopName}".`);
    };

    const handleUpdateOrderWithAdmin = (order: Order, newStatus: OrderStatus) => {
        const actor = user ? `${user.name} (superadmin)` : 'System';
        const updatedOrder = addStatusLog(order, newStatus, actor);
        setAllOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
        logActivity('Order Status Updated (Admin)', `Admin updated order ${order.id} to ${newStatus}.`);
    };
    
    const handleUpdateOrderWithSeller = (orderId: string, newStatus: OrderStatus) => {
        const order = allOrders.find(o => o.id === orderId);
        if (!order || !user) return;
        const actor = `${user.name} (seller)`;
        const updatedOrder = addStatusLog(order, newStatus, actor);
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        logActivity('Order Status Updated (Seller)', `Seller updated order ${orderId} to ${newStatus}.`);
    };
    
    const handleAssignAgent = (orderId: string, agentId: string) => {
        const order = allOrders.find(o => o.id === orderId);
        const agent = allUsers.find(u => u.id === agentId);
        if (order && agent) {
            const updatedOrder = addStatusLog(order, 'picked-up', `Admin (Assigned to ${agent.name})`);
            updatedOrder.agentId = agentId;
            setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
            logActivity('Agent Assigned', `Agent ${agent.name} assigned to order ${orderId}.`);
        }
    };
    
    const handleAddStory = (storeId: string, imageUrl: string) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                const newStory: Story = { id: `story-${Date.now()}`, imageUrl, createdAt: new Date().toISOString() };
                const updatedStories = [...(s.stories || []), newStory];
                return { ...s, stories: updatedStories };
            }
            return s;
        }));
    };

    const handleDeleteStory = (storeId: string, storyId: string) => {
        setAllStores(prev => prev.map(s => {
            if (s.id === storeId) {
                const updatedStories = s.stories?.filter(story => story.id !== storyId);
                return { ...s, stories: updatedStories };
            }
            return s;
        }));
    };
    
    const handleBecomePremiumByCaution = () => {
        if (!user) return;
        if (window.confirm(`Confirmez-vous le paiement de la caution de ${siteSettings.premiumCautionAmount.toLocaleString('fr-CM')} FCFA pour devenir Premium ?`)) {
            setAllUsers(users => users.map(u => u.id === user.id ? { ...u, loyalty: { ...u.loyalty, status: 'premium', premiumStatusMethod: 'deposit' } } : u));
            logActivity('Premium by Deposit', `User ${user.name} became Premium by paying a deposit.`);
            alert("Félicitations ! Vous êtes maintenant un membre Premium.");
        }
    };
    
    const handleUpgradeToPremiumPlus = () => {
        if (!user) return;
         if (window.confirm(`Confirmez-vous le paiement de ${siteSettings.premiumPlusAnnualFee.toLocaleString('fr-CM')} FCFA pour l'abonnement annuel Premium+ ?`)) {
            setAllUsers(users => users.map(u => u.id === user.id ? { ...u, loyalty: { ...u.loyalty, status: 'premium_plus', premiumStatusMethod: 'subscription' } } : u));
            logActivity('Premium+ Subscription', `User ${user.name} upgraded to Premium+.`);
            alert("Félicitations ! Vous êtes maintenant un membre Premium+.");
        }
    };
    
    const handleCancelOrder = (orderId: string) => {
      const order = allOrders.find(o => o.id === orderId);
      if(order && window.confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
          const updatedOrder = addStatusLog(order, 'cancelled', user?.name || 'Customer');
          setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
          logActivity('Order Cancelled', `Order ${orderId} was cancelled by the customer.`);
      }
    };

    const handleRequestRefund = (orderId: string, reason: string, evidenceUrls: string[]) => {
      const order = allOrders.find(o => o.id === orderId);
      if(order) {
        const updatedOrder: Order = {
            ...addStatusLog(order, 'refund-requested', user?.name || 'Customer'),
            refundReason: reason,
            refundEvidenceUrls: evidenceUrls,
            disputeLog: [{ author: 'customer', message: `Demande de remboursement: ${reason}`, date: new Date().toISOString() }]
        };
        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        logActivity('Refund Requested', `Refund requested for order ${orderId}. Reason: ${reason}`);
      }
    };

    const handleResolveRefund = (orderId: string, resolution: 'approved' | 'rejected') => {
        const order = allOrders.find(o => o.id === orderId);
        if (order) {
            const newStatus = resolution === 'approved' ? 'refunded' : order.status; // Revert to previous status or keep as is? Let's just update log.
            const message = resolution === 'approved' ? 'Demande de remboursement approuvée. Le remboursement sera traité.' : 'Demande de remboursement rejetée.';
            const updatedOrder = addStatusLog(order, newStatus, user?.name || 'Admin');
            updatedOrder.disputeLog = [...(updatedOrder.disputeLog || []), { author: 'admin', message, date: new Date().toISOString()}];

            setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
            logActivity('Refund Resolved', `Refund request for order ${orderId} was ${resolution}.`);
        }
    };
    
    const handleAdminDisputeMessage = (orderId: string, message: string, author: 'admin' | 'seller' | 'customer') => {
        setAllOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const newMsg: DisputeMessage = { author, message, date: new Date().toISOString() };
                return { ...o, disputeLog: [...(o.disputeLog || []), newMsg] };
            }
            return o;
        }));
    };

    const handleSellerDisputeMessage = (orderId: string, message: string) => {
        setAllOrders(prev => prev.map(o => {
            if (o.id === orderId && user && user.role === 'seller') {
                const newMsg: DisputeMessage = { author: 'seller', message, date: new Date().toISOString() };
                return { ...o, disputeLog: [...(o.disputeLog || []), newMsg] };
            }
            return o;
        }));
    };

    const handleRepeatOrder = useCallback((order: Order) => {
        const areVariantsEqual = (v1?: Record<string, string>, v2?: Record<string, string>): boolean => {
            if (!v1 && !v2) return true;
            if (!v1 || !v2) return false;
            const keys1 = Object.keys(v1);
            const keys2 = Object.keys(v2);
            if (keys1.length !== keys2.length) return false;
            return keys1.every(key => v1[key] === v2[key]);
        };

        const addedItems: string[] = [];
        const outOfStockItems: string[] = [];

        order.items.forEach(item => {
            const currentProduct = allProducts.find(p => p.id === item.id);
            
            if (currentProduct) {
                let stock = currentProduct.stock;
                if(currentProduct.variantDetails && item.selectedVariant) {
                    const variantDetail = currentProduct.variantDetails.find(vd => areVariantsEqual(vd.options, item.selectedVariant!));
                    stock = variantDetail?.stock ?? 0;
                }

                if (stock >= item.quantity) {
                    addToCart(currentProduct, item.quantity, item.selectedVariant, { suppressModal: true });
                    addedItems.push(`${item.name} (x${item.quantity})`);
                } else {
                    outOfStockItems.push(`${item.name} (x${item.quantity})`);
                }
            } else {
                 outOfStockItems.push(`${item.name} (x${item.quantity})`);
            }
        });

        let alertMessage = '';
        if (addedItems.length > 0) {
            alertMessage += `Les produits suivants ont été ajoutés à votre panier :\n- ${addedItems.join('\n- ')}\n\n`;
        }
        if (outOfStockItems.length > 0) {
            alertMessage += `Les produits suivants sont en rupture de stock ou indisponibles et n'ont pas pu être ajoutés :\n- ${outOfStockItems.join('\n- ')}`;
        }

        if (alertMessage.trim()) {
            alert(alertMessage.trim());
        } else {
            alert("Aucun produit de cette commande n'est actuellement disponible.");
        }

        if (addedItems.length > 0) {
            handleNavigate('cart');
        }
    }, [allProducts, addToCart, handleNavigate]);

    const handleUpdateOrderFromAgent = useCallback((orderId: string, updates: Partial<Order>) => {
        const order = allOrders.find(o => o.id === orderId);
        if (!order || !user) return;
        
        const actorName = user.name;
        let updatedOrder: Order = { ...order, ...updates };

        if (updates.status && updates.status !== order.status) {
            updatedOrder = addStatusLog(updatedOrder, updates.status, actorName);
        }

        setAllOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
        logActivity('Order Updated by Agent', `Agent ${actorName} updated order ${orderId}. Details: ${JSON.stringify(updates)}`);
    }, [allOrders, user, addStatusLog, setAllOrders, logActivity]);
    
    const handleCreateTicket = useCallback((subject: string, message: string, relatedOrderId?: string) => {
        if (!user) return;
        const now = new Date().toISOString();
        const newTicket: Ticket = {
            id: `TICKET-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            subject,
            relatedOrderId,
            status: 'Ouvert',
            priority: 'Moyenne',
            createdAt: now,
            updatedAt: now,
            messages: [{
                authorId: user.id,
                authorName: user.name,
                message,
                date: now
            }]
        };
        setAllTickets(prev => [newTicket, ...prev]);
        logActivity('Ticket Created', `User ${user.name} created ticket #${newTicket.id} with subject "${subject}".`);
    }, [user, setAllTickets, logActivity]);

    const handleUserReplyToTicket = useCallback((ticketId: string, message: string) => {
        if (!user) return; // Only logged in users can reply
        const now = new Date().toISOString();
        setAllTickets(prev => prev.map(t => {
            if (t.id === ticketId && (t.userId === user.id || user.role === 'superadmin')) {
                const newMessage: TicketMessage = {
                    authorId: user.id,
                    authorName: user.name,
                    message,
                    date: now,
                };
                // User sets status to 'Ouvert', Admin to 'En cours'
                const newStatus = user.role === 'superadmin' ? 'En cours' : 'Ouvert';
                return { ...t, status: newStatus, updatedAt: now, messages: [...t.messages, newMessage] };
            }
            return t;
        }));
        logActivity('Ticket Reply', `User ${user.name} replied to ticket #${ticketId}.`);
    }, [user, setAllTickets, logActivity]);

    const handleAdminReplyToTicket = useCallback((ticketId: string, message: string) => {
        if (!user || user.role !== 'superadmin') return;
        handleUserReplyToTicket(ticketId, message); // Reuse the logic but with admin context
    }, [user, handleUserReplyToTicket]);
    
    const handleAdminUpdateTicketStatus = useCallback((ticketId: string, status: TicketStatus, priority: TicketPriority) => {
         setAllTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status, priority, updatedAt: new Date().toISOString() } : t));
         logActivity('Ticket Update', `Admin updated ticket #${ticketId} status to ${status} and priority to ${priority}.`);
    }, [setAllTickets, logActivity]);

    const handleCreateOrUpdateAnnouncement = useCallback((announcement: Omit<Announcement, 'id'> | Announcement) => {
        setAllAnnouncements(prev => {
            if ('id' in announcement) { // Update
                logActivity('Announcement Updated', `Announcement "${announcement.title}" was updated.`);
                return prev.map(a => a.id === announcement.id ? announcement : a);
            } else { // Create
                const newAnnouncement = { ...announcement, id: `ANNC-${Date.now()}` };
                logActivity('Announcement Created', `Announcement "${newAnnouncement.title}" was created.`);
                return [newAnnouncement, ...prev];
            }
        });
    }, [setAllAnnouncements, logActivity]);

    const handleDeleteAnnouncement = useCallback((id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
             setAllAnnouncements(prev => prev.filter(a => a.id !== id));
             logActivity('Announcement Deleted', `Announcement ID ${id} was deleted.`);
        }
    }, [setAllAnnouncements, logActivity]);


    const activeAnnouncements = useMemo(() => {
        if (!user) return [];
        const now = new Date();
        return allAnnouncements.filter(ann => {
            const targetsUser = 
                ann.target === 'all' ||
                (ann.target === 'customers' && user?.role === 'customer') ||
                (ann.target === 'sellers' && user?.role === 'seller');

            return (
                ann.isActive &&
                targetsUser &&
                new Date(ann.startDate) <= now &&
                new Date(ann.endDate) >= now &&
                !dismissedAnnouncements.includes(ann.id)
            );
        });
    }, [allAnnouncements, user, dismissedAnnouncements]);

     // --- START OF ADMIN HANDLERS ---

    const handleUpdateCategoryImage = useCallback((categoryId: string, imageUrl: string) => {
        setAllCategories(prev => prev.map(c => (c.id === categoryId ? { ...c, imageUrl } : c)));
        logActivity('Category Image Updated', `Image for category ID ${categoryId} was updated.`);
    }, [setAllCategories, logActivity]);

    const handleWarnStore = useCallback((store: Store, reason: string) => {
        setAllStores(prev => prev.map(s => (s.id === store.id ? { ...s, warnings: [...s.warnings, { id: `warn-${Date.now()}`, date: new Date().toISOString(), reason }] } : s)));
        logActivity('Store Warned', `Store "${store.name}" was warned. Reason: ${reason}`);
    }, [setAllStores, logActivity]);

    const handleToggleStoreStatus = useCallback((store: Store) => {
        const newStatus = store.status === 'active' ? 'suspended' : 'active';
        setAllStores(prev => prev.map(s => (s.id === store.id ? { ...s, status: newStatus } : s)));
        logActivity('Store Status Toggled', `Store "${store.name}" status changed to ${newStatus}.`);
    }, [setAllStores, logActivity]);

    const handleToggleStorePremiumStatus = useCallback((store: Store) => {
        const newStatus = store.premiumStatus === 'premium' ? 'standard' : 'premium';
        setAllStores(prev => prev.map(s => (s.id === store.id ? { ...s, premiumStatus: newStatus } : s)));
        logActivity('Store Premium Status Toggled', `Store "${store.name}" premium status changed to ${newStatus}.`);
    }, [setAllStores, logActivity]);

    const handleApproveStore = useCallback((store: Store) => {
        setAllStores(prev => prev.map(s => (s.id === store.id ? { ...s, status: 'active' } : s)));
        logActivity('Store Approved', `Store "${store.name}" has been approved and is now active.`);
    }, [setAllStores, logActivity]);

    const handleRejectStore = useCallback((store: Store) => {
        setAllStores(prev => prev.filter(s => s.id !== store.id));
        logActivity('Store Rejected', `Store application for "${store.name}" has been rejected and removed.`);
    }, [setAllStores, logActivity]);
    
    const handleSaveFlashSale = useCallback((flashSaleData: Omit<FlashSale, 'id' | 'products'>) => {
        const newFlashSale: FlashSale = { ...flashSaleData, id: `fs-${Date.now()}`, products: [] };
        setFlashSales(prev => [...prev, newFlashSale]);
        logActivity('Flash Sale Created', `New flash sale event "${newFlashSale.name}" was created.`);
    }, [setFlashSales, logActivity]);

    const handleAddOrUpdatePickupPoint = useCallback((pointData: Omit<PickupPoint, 'id'> | PickupPoint) => {
        if ('id' in pointData) { // Update
            setAllPickupPoints(prev => prev.map(p => p.id === pointData.id ? pointData : p));
            logActivity('Pickup Point Updated', `Pickup point "${pointData.name}" was updated.`);
        } else { // Add
            const newPoint = { ...pointData, id: `pp-${Date.now()}`};
            setAllPickupPoints(prev => [...prev, newPoint]);
            logActivity('Pickup Point Added', `New pickup point "${newPoint.name}" was added.`);
        }
    }, [setAllPickupPoints, logActivity]);

    const handleDeletePickupPoint = useCallback((pointId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce point de dépôt ?")) {
            setAllPickupPoints(prev => prev.filter(p => p.id !== pointId));
            logActivity('Pickup Point Deleted', `Pickup point ID ${pointId} was deleted.`);
        }
    }, [setAllPickupPoints, logActivity]);

    const handleUpdateUserFromAdmin = useCallback((userId: string, updates: Partial<User>) => {
        setAllUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)));
        logActivity('User Updated by Admin', `User account ${userId} was updated by an admin.`);
    }, [setAllUsers, logActivity]);
    
    const handlePayoutSeller = useCallback((store: Store, amount: number) => {
        const newPayout: Payout = { storeId: store.id, amount, date: new Date().toISOString() };
        setPayouts(prev => [...prev, newPayout]);
        logActivity('Seller Payout', `Processed a payout of ${amount} FCFA for store "${store.name}".`);
    }, [setPayouts, logActivity]);

    const handleActivateSubscription = useCallback((store: Store) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
        setAllStores(prev => prev.map(s => s.id === store.id ? { ...s, subscriptionStatus: 'active', subscriptionDueDate: dueDate.toISOString() } : s));
        logActivity('Seller Subscription Activated', `Subscription for "${store.name}" activated.`);
    }, [setAllStores, logActivity]);

    const handleAddOrUpdateAdvertisement = useCallback((adData: Omit<Advertisement, 'id'> | Advertisement) => {
        if ('id' in adData) { // Update
            setAdvertisements(prev => prev.map(ad => ad.id === adData.id ? adData : ad));
            logActivity('Advertisement Updated', `Advertisement ${adData.id} updated.`);
        } else { // Add
            const newAd = { ...adData, id: `ad-${Date.now()}` };
            setAdvertisements(prev => [...prev, newAd]);
            logActivity('Advertisement Added', `New advertisement created.`);
        }
    }, [setAdvertisements, logActivity]);
    
    const handleDeleteAdvertisement = useCallback((adId: string) => {
        if (window.confirm("Supprimer cette publicité ?")) {
            setAdvertisements(prev => prev.filter(ad => ad.id !== adId));
            logActivity('Advertisement Deleted', `Advertisement ${adId} deleted.`);
        }
    }, [setAdvertisements, logActivity]);

    const handleCreateUserByAdmin = useCallback((userData: Omit<User, 'id' | 'loyalty' | 'password'>) => {
        const defaultPassword = 'password123';
        const newUser: User = {
            ...userData,
            id: `user-${Date.now()}`,
            password: defaultPassword,
            loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
            addresses: [],
            followedStores: []
        };
        setAllUsers(prev => [...prev, newUser]);
        logActivity('User Created by Admin', `New user "${newUser.name}" (${newUser.role}) created.`);
        alert(`Utilisateur créé avec succès ! Le mot de passe par défaut est : ${defaultPassword}`);
    }, [setAllUsers, logActivity]);

    const handleSanctionAgent = useCallback((agentId: string, reason: string) => {
        setAllUsers(prev => prev.map(u => u.id === agentId ? { ...u, warnings: [...(u.warnings || []), { id: `warn-${Date.now()}`, date: new Date().toISOString(), reason }] } : u));
        const agentName = allUsers.find(u => u.id === agentId)?.name;
        logActivity('Agent Sanctioned', `Agent ${agentName} sanctioned. Reason: ${reason}`);
    }, [setAllUsers, allUsers, logActivity]);

    // --- END OF ADMIN HANDLERS ---

    if (siteSettings.maintenanceMode.isEnabled && user?.role !== 'superadmin') {
        return <MaintenancePage message={siteSettings.maintenanceMode.message} reopenDate={siteSettings.maintenanceMode.reopenDate} />;
    }

  const currentPage = useMemo(() => {
    switch(page) {
      case 'home': return <HomePage categories={allCategories} products={visibleProducts} stores={allStores.filter(s => s.status === 'active')} flashSales={flashSales} advertisements={advertisements.filter(ad => ad.isActive)} onProductClick={handleProductClick} onCategoryClick={handleCategoryClick} onVendorClick={handleVendorClick} onVisitStore={handleVendorClick} onViewStories={(store) => setViewingStoriesOfStore(store)} isComparisonEnabled={isComparisonEnabled} isStoriesEnabled={siteSettings.isStoriesEnabled} />;
      case 'product': return selectedProduct ? <ProductDetail product={selectedProduct} allProducts={allProducts} allUsers={allUsers} stores={allStores} flashSales={flashSales} onBack={() => handleNavigate('home', resetSelections)} onAddReview={handleAddReview} onVendorClick={handleVendorClick} onProductClick={handleProductClick} onOpenLogin={() => setIsLoginModalOpen(true)} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
      case 'cart': return <CartView onBack={() => handleNavigate('home')} onNavigateToCheckout={() => handleNavigate('checkout')} flashSales={flashSales} allPromoCodes={allPromoCodes} appliedPromoCode={appliedPromoCode} onApplyPromoCode={handleApplyPromoCode} />;
      case 'checkout': return <Checkout onBack={() => handleNavigate('cart')} onOrderConfirm={handlePlaceOrder} flashSales={flashSales} allPickupPoints={allPickupPoints} appliedPromoCode={appliedPromoCode} allStores={allStores} />;
      case 'order-success': return selectedOrder ? <OrderSuccess order={selectedOrder} onNavigateHome={() => handleNavigate('home', resetSelections)} onNavigateToOrders={() => handleNavigate('order-history')} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
      case 'stores': return <StoresPage stores={allStores.filter(s => s.status === 'active')} onBack={() => handleNavigate('home')} onVisitStore={handleVendorClick} onNavigateToStoresMap={() => handleNavigate('stores-map')} />;
      case 'stores-map': return <StoresMapPage stores={allStores.filter(s => s.status === 'active')} onBack={() => handleNavigate('stores')} onVisitStore={handleVendorClick} />;
      case 'become-seller': return <BecomeSeller onBack={() => handleNavigate('home')} onBecomeSeller={handleBecomeSeller} onRegistrationSuccess={() => handleNavigate('seller-dashboard')} siteSettings={siteSettings} />;
      case 'category': return selectedCategoryId ? <CategoryPage categoryId={selectedCategoryId} allCategories={allCategories} allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home', resetSelections)} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
      case 'seller-dashboard': return user && user.role === 'seller' && user.shopName ? <SellerDashboard store={allStores.find(s=>s.name === user.shopName)} products={allProducts.filter(p=>p.vendor === user.shopName)} sellerOrders={allOrders.filter(o => o.items.some(i => i.vendor === user.shopName))} categories={allCategories} flashSales={flashSales} promoCodes={allPromoCodes.filter(pc => pc.sellerId === user.id)} onBack={() => handleNavigate('home')} onAddProduct={() => { setProductToEdit(null); handleNavigate('product-form'); }} onEditProduct={(p) => { setProductToEdit(p); handleNavigate('product-form'); }} onDeleteProduct={handleDeleteProduct} onToggleStatus={handleToggleStatus} onNavigateToProfile={() => handleNavigate('seller-profile')} onNavigateToAnalytics={() => handleNavigate('seller-analytics-dashboard')} onSetPromotion={(p) => setPromotionModalProduct(p)} onRemovePromotion={handleRemovePromotion} onProposeForFlashSale={handleProposeForFlashSale} onUploadDocument={handleUploadDocument} onUpdateOrderStatus={handleUpdateOrderWithSeller} onCreatePromoCode={handleCreatePromoCode} onDeletePromoCode={handleDeletePromoCode} isChatEnabled={isChatEnabled} onPayRent={()=>{}} siteSettings={siteSettings} onAddStory={handleAddStory} onDeleteStory={handleDeleteStory} payouts={payouts} onSellerDisputeMessage={handleSellerDisputeMessage} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
      case 'seller-analytics-dashboard': return user && user.role === 'seller' && user.shopName ? <SellerAnalyticsDashboard onBack={() => handleNavigate('seller-dashboard')} sellerOrders={allOrders.filter(o => o.items.some(i => i.vendor === user.shopName))} sellerProducts={allProducts.filter(p=>p.vendor === user.shopName)} flashSales={flashSales} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
      case 'vendor-page': return selectedVendor ? <VendorPage vendorName={selectedVendor} allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home', resetSelections)} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
      case 'product-form': return user && user.role === 'seller' ? <ProductForm onSave={handleAddProduct} onCancel={() => handleNavigate('seller-dashboard')} productToEdit={productToEdit} categories={allCategories} onAddCategory={() => {return {id: '', name: '', imageUrl: ''}}} siteSettings={siteSettings} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
      case 'seller-profile': return user && user.role === 'seller' && user.shopName ? <SellerProfile store={allStores.find(s=>s.name === user.shopName)!} onBack={() => handleNavigate('seller-dashboard')} onUpdateProfile={() => {}} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
      // FIX: Corrected the function name for requesting a document from `onRequestDocument` to `handleRequestDocument`.
      case 'superadmin-dashboard': return user && user.role === 'superadmin' ? <SuperAdminDashboard allOrders={allOrders} allCategories={allCategories} allStores={allStores} allProducts={allProducts} allUsers={allUsers} siteActivityLogs={siteActivityLogs} onUpdateOrderStatus={handleUpdateOrderWithAdmin} onUpdateCategoryImage={handleUpdateCategoryImage} onWarnStore={handleWarnStore} onToggleStoreStatus={handleToggleStoreStatus} onToggleStorePremiumStatus={handleToggleStorePremiumStatus} onApproveStore={handleApproveStore} onRejectStore={handleRejectStore} onSaveFlashSale={handleSaveFlashSale} flashSales={flashSales} onUpdateFlashSaleSubmissionStatus={handleUpdateFlashSaleSubmissionStatus} onBatchUpdateFlashSaleStatus={handleBatchUpdateFlashSaleStatus} onRequestDocument={handleRequestDocument} onVerifyDocumentStatus={handleVerifyDocumentStatus} allPickupPoints={allPickupPoints} onAddPickupPoint={handleAddOrUpdatePickupPoint} onUpdatePickupPoint={handleAddOrUpdatePickupPoint} onDeletePickupPoint={handleDeletePickupPoint} onAssignAgent={handleAssignAgent} isChatEnabled={isChatEnabled} isComparisonEnabled={isComparisonEnabled} onToggleChatFeature={() => setIsChatEnabled(p => !p)} onToggleComparisonFeature={() => setIsComparisonEnabled(p => !p)} siteSettings={siteSettings} onUpdateSiteSettings={setSiteSettings} onAdminAddCategory={handleAdminAddCategory} onAdminDeleteCategory={handleAdminDeleteCategory} onUpdateUser={handleUpdateUserFromAdmin} payouts={payouts} onPayoutSeller={handlePayoutSeller} onActivateSubscription={handleActivateSubscription} advertisements={advertisements} onAddAdvertisement={handleAddOrUpdateAdvertisement} onUpdateAdvertisement={handleAddOrUpdateAdvertisement} onDeleteAdvertisement={handleDeleteAdvertisement} onCreateUserByAdmin={handleCreateUserByAdmin} onSanctionAgent={handleSanctionAgent} onResolveRefund={handleResolveRefund} onAdminStoreMessage={(orderId, message) => handleAdminDisputeMessage(orderId, message, 'admin')} onAdminCustomerMessage={(orderId, message) => handleAdminDisputeMessage(orderId, message, 'admin')} siteContent={siteContent} onUpdateSiteContent={setSiteContent} allTickets={allTickets} allAnnouncements={allAnnouncements} onAdminReplyToTicket={handleAdminReplyToTicket} onAdminUpdateTicketStatus={handleAdminUpdateTicketStatus} onCreateOrUpdateAnnouncement={handleCreateOrUpdateAnnouncement} onDeleteAnnouncement={handleDeleteAnnouncement} onReviewModeration={handleReviewModeration} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
      case 'order-history': return user ? <OrderHistoryPage userOrders={allOrders.filter(o => o.userId === user.id)} onBack={() => handleNavigate('home')} onSelectOrder={(order) => { setSelectedOrder(order); handleNavigate('order-detail'); }} onRepeatOrder={handleRepeatOrder} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
      case 'order-detail': return selectedOrder ? <OrderDetailPage order={selectedOrder} onBack={() => handleNavigate('order-history', resetSelections)} allPickupPoints={allPickupPoints} allUsers={allUsers} onCancelOrder={handleCancelOrder} onRequestRefund={handleRequestRefund} onCustomerDisputeMessage={(orderId, message) => handleAdminDisputeMessage(orderId, message, 'customer')} /> : <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
      case 'promotions': return <PromotionsPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
      case 'flash-sales': return <FlashSalesPage allProducts={visibleProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
      case 'search-results': return <SearchResultsPage searchQuery={searchQuery} allProducts={visibleProducts} allCategories={allCategories} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled} />;
      case 'wishlist': return <WishlistPage allProducts={allProducts} allStores={allStores} flashSales={flashSales} onProductClick={handleProductClick} onBack={() => handleNavigate('home')} onVendorClick={handleVendorClick} isComparisonEnabled={isComparisonEnabled}/>;
      case 'delivery-agent-dashboard': return user && user.role === 'delivery_agent' ? <DeliveryAgentDashboard allOrders={allOrders.filter(o => o.agentId === user.id)} allStores={allStores} allPickupPoints={allPickupPoints} onUpdateOrder={handleUpdateOrderFromAgent} onLogout={handleLogout} onUpdateUserAvailability={handleUpdateUserAvailability} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
      case 'depot-agent-dashboard': return user && user.role === 'depot_agent' ? <DepotAgentDashboard user={user} allUsers={allUsers} allOrders={allOrders} onCheckIn={()=>{}} onReportDiscrepancy={()=>{}} onLogout={handleLogout} onProcessDeparture={()=>{}} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
      case 'comparison': return <ComparisonPage onBack={() => handleNavigate('home')} allCategories={allCategories} />;
      case 'become-premium': return <BecomePremiumPage siteSettings={siteSettings} onBack={() => handleNavigate('home')} onBecomePremiumByCaution={handleBecomePremiumByCaution} onUpgradeToPremiumPlus={handleUpgradeToPremiumPlus} />;
      case 'info': return <InfoPage title={infoPageContent.title} content={infoPageContent.content} onBack={() => handleNavigate('home')} />;
      case 'reset-password': return <ResetPasswordPage onPasswordReset={handlePasswordReset} onNavigateLogin={handleNavigateLoginFromReset} />;
      case 'account': return user ? <AccountPage onBack={() => handleNavigate('home')} initialTab={activeAccountTab} allStores={allStores} onVendorClick={handleVendorClick} allTickets={allTickets.filter(t => t.userId === user.id)} userOrders={allOrders.filter(o=>o.userId === user.id)} onCreateTicket={handleCreateTicket} onUserReplyToTicket={handleUserReplyToTicket} /> : <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
      case 'forbidden': return <ForbiddenPage onNavigateHome={() => handleNavigate('home')} />;
      case 'server-error': return <ServerErrorPage onNavigateHome={() => handleNavigate('home')} />;
      case 'not-found':
      default: return <NotFoundPage onNavigateHome={() => handleNavigate('home')} />;
    }
  }, [page, selectedProduct, selectedCategoryId, selectedVendor, selectedOrder, searchQuery, allProducts, allCategories, allStores, allOrders, user, allPromoCodes, appliedPromoCode, productToEdit, siteActivityLogs, allUsers, cart, flashSales, allPickupPoints, payouts, advertisements, allTickets, allAnnouncements, visibleProducts, isChatEnabled, isComparisonEnabled, siteSettings.isStoriesEnabled, siteSettings, siteContent, infoPageContent, viewingStoriesOfStore, modalProduct, isModalOpen, comparisonList, promotionModalProduct, dismissedAnnouncements, activeAccountTab, handleNavigate]);

  const handleInfoPageNavigate = (slug: string) => {
    const content = siteContent.find(c => c.slug === slug);
    if (content) {
      setInfoPageContent(content);
      handleNavigate('info');
    } else {
      handleNavigate('not-found');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {activeAnnouncements.map(ann => (
          <AnnouncementBanner key={ann.id} announcement={ann} onDismiss={(id) => setDismissedAnnouncements(prev => [...prev, id])} />
      ))}
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
        onNavigateToAccount={handleNavigateToAccount}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onSearch={handleSearch}
        isChatEnabled={isChatEnabled}
        isPremiumProgramEnabled={siteSettings.isPremiumProgramEnabled}
        logoUrl={siteSettings.logoUrl}
        onLoginSuccess={handleLoginSuccess}
      />
      <main className="flex-grow">
        {currentPage}
      </main>
      <Footer onNavigate={handleInfoPageNavigate} logoUrl={siteSettings.logoUrl} />
      {isModalOpen && modalProduct && <AddToCartModal product={modalProduct} onClose={uiCloseModal} onNavigateToCart={() => { uiCloseModal(); handleNavigate('cart'); }} />}
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} onForgotPassword={handleOpenForgotPassword} />}
      {isForgotPasswordModalOpen && <ForgotPasswordModal onClose={() => setIsForgotPasswordModalOpen(false)} onEmailSubmit={handleForgotPasswordSubmit} />}
      {viewingStoriesOfStore && <StoryViewer store={viewingStoriesOfStore} onClose={() => setViewingStoriesOfStore(null)} />}
      {promotionModalProduct && <PromotionModal product={promotionModalProduct} onClose={() => setPromotionModalProduct(null)} onSave={handleSetPromotion} />}
      {isComparisonEnabled && <ComparisonBar onCompareClick={() => handleNavigate('comparison')} />}
      {isChatEnabled && <ChatWidget allUsers={allUsers} allProducts={allProducts} allCategories={allCategories} />}
    </div>
  );
}