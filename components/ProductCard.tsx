import React, { useMemo } from 'react';
import type { Product, FlashSale, Store } from '../types';
import { ShoppingCartIcon, HeartIcon, CalendarDaysIcon, MapPinIcon, BoltIcon, ScaleIcon, StarIcon, BookmarkSquareIcon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { useComparison } from '../contexts/ComparisonContext';

const PLACEHOLDER_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23E5E7EB'/%3E%3Cpath d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' stroke='%239CA3AF' stroke-width='1.5'/%3E%3C/svg%3E";

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

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onVendorClick: (vendorName: string) => void;
  location?: string;
  flashSales: FlashSale[];
  isComparisonEnabled: boolean;
  isFlashSaleUpcoming?: boolean;
  stores: Store[];
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick, onVendorClick, location, flashSales, isComparisonEnabled, isFlashSaleUpcoming, stores }) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isInComparison, toggleComparison } = useComparison();
  const { user, toggleFollowStore } = useAuth();

  const isMyProduct = user?.role === 'seller' && user.shopName === product.vendor;
  const hasVariants = product.variants && product.variants.length > 0;
  
  const store = useMemo(() => stores.find(s => s.name === product.vendor), [stores, product.vendor]);
  const isFollowingStore = user?.followedStores?.includes(store?.id || '');


  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (hasVariants) {
        onProductClick(product);
        return;
    }
    if (product.stock > 0) {
      addToCart(product, 1);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleComparison(product.id);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (store && user) {
        toggleFollowStore(store.id);
    } else if (!user) {
        alert("Veuillez vous connecter pour suivre une boutique.");
    }
  };

  const handleVendorClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onVendorClick(product.vendor);
  }

  const flashPrice = getActiveFlashSalePrice(product.id, flashSales);
  const promotionIsActive = isPromotionActive(product);
  const promotionIsDefined = !!(product.promotionPrice && product.promotionPrice < product.price && (product.promotionStartDate || product.promotionEndDate));
  const promotionIsUpcoming = promotionIsDefined && !promotionIsActive && product.promotionStartDate && new Date(product.promotionStartDate + 'T00:00:00') > new Date();

  const finalPrice = flashPrice ?? (promotionIsActive ? product.promotionPrice! : product.price);
  const originalPrice = (flashPrice || (promotionIsActive && product.promotionPrice)) ? product.price : null;
  const promotionPercentage = originalPrice ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;
  
  const totalStock = hasVariants 
    ? (product.variantDetails || []).reduce((sum, v) => sum + v.stock, 0) 
    : product.stock;

  const inComparison = isInComparison(product.id);
  const displayImage = product.imageUrls[0] || PLACEHOLDER_IMAGE_URL;
  
  const averageRating = useMemo(() => {
      const approvedReviews = product.reviews.filter(r => r.status === 'approved');
      if (approvedReviews.length === 0) return 0;
      return approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length;
  }, [product.reviews]);

  return (
    <div onClick={() => onProductClick(product)} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col">
      <div className="relative">
        <img className="h-56 w-full object-cover" src={displayImage} alt={product.name} />
        <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
        
        {isFlashSaleUpcoming && (
            <div className="absolute top-2 left-2 bg-purple-600 text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1">
                <CalendarDaysIcon className="w-4 h-4"/> VENTE BIENTÔT
            </div>
        )}
        {flashPrice && !isFlashSaleUpcoming && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1"><BoltIcon className="w-4 h-4"/> VENTE FLASH</div>
        )}
        {!flashPrice && !isFlashSaleUpcoming && promotionIsUpcoming && (
           <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg">PROMO À VENIR</div>
        )}
        {!flashPrice && !isFlashSaleUpcoming && promotionIsActive && (
            <div className="absolute top-2 left-2 bg-kmer-red text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-lg">-{promotionPercentage}%</div>
        )}

         <div className="absolute top-2 right-2 flex flex-col gap-2">
            <button 
              onClick={handleWishlistClick} 
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-full p-2 hover:bg-white dark:hover:bg-gray-700 transition-colors"
              aria-label="Ajouter à la liste de souhaits"
            >
              <HeartIcon className="h-5 w-5" filled={isWishlisted(product.id)} />
            </button>
             {user && user.role === 'customer' && (
              <button 
                onClick={handleFollowClick} 
                className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-full p-2 hover:bg-white dark:hover:bg-gray-700 transition-colors ${isFollowingStore ? 'text-kmer-green' : ''}`}
                aria-label="Suivre la boutique"
              >
                <BookmarkSquareIcon className="h-5 w-5" />
              </button>
            )}
            {isComparisonEnabled && (
              <button 
                onClick={handleCompareClick} 
                className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-full p-2 hover:bg-white dark:hover:bg-gray-700 transition-colors ${inComparison ? 'text-kmer-green' : ''}`}
                aria-label="Ajouter à la comparaison"
              >
                <ScaleIcon className="h-5 w-5" />
              </button>
            )}
        </div>

        <div className="absolute bottom-2 right-2">
            <button 
              onClick={handleAddToCart} 
              disabled={totalStock === 0 || isMyProduct}
              className={`flex items-center justify-center h-12 w-12 text-gray-900 rounded-full shadow-md transform transition-all duration-300 hover:scale-110 bg-kmer-yellow disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed`}
              aria-label={isMyProduct ? "Vous ne pouvez pas acheter votre propre produit" : (totalStock === 0 ? "Épuisé" : (hasVariants ? "Choisir options" : "Ajouter au panier"))}
              title={isMyProduct ? "Vous ne pouvez pas acheter votre propre produit" : (hasVariants ? "Choisir les options" : "Ajouter au panier")}
            >
                {totalStock === 0 ? <span className="text-xs font-bold text-white">ÉPUISÉ</span> : <ShoppingCartIcon className="h-5 w-5" />}
            </button>
        </div>
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-center gap-2">
          <button onClick={handleVendorClick} className="text-sm text-gray-500 dark:text-gray-400 mb-1 hover:text-kmer-green hover:underline text-left truncate flex items-center gap-1.5">
            <span>{product.vendor}</span>
          </button>
          {location && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 flex-shrink-0">
                  <MapPinIcon className="w-3.5 h-3.5" />
                  {location}
              </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate flex-grow">{product.name}</h3>
        
        <div className="flex items-center gap-2 mt-1 h-5">
            {averageRating > 0 && (
                <>
                   <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} className="w-4 h-4 text-yellow-400" filled={i < Math.round(averageRating)} />
                        ))}
                    </div>
                    <span className="text-xs text-gray-500">({product.reviews.filter(r => r.status === 'approved').length})</span>
                </>
            )}
        </div>

        {promotionIsActive && product.promotionEndDate && !flashPrice && (
          <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            <CalendarDaysIcon className="w-4 h-4" />
            <span>Se termine le {new Date(product.promotionEndDate).toLocaleDateString('fr-FR')}</span>
          </div>
        )}
        {promotionIsUpcoming && product.promotionStartDate && !flashPrice && (
          <div className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 mt-1">
            <CalendarDaysIcon className="w-4 h-4" />
            <span>Promo le {new Date(product.promotionStartDate).toLocaleDateString('fr-FR')}</span>
          </div>
        )}

        <div className="mt-2">
            {flashPrice || promotionIsActive ? (
                <div className="flex items-baseline gap-2">
                    <p className={`text-xl font-bold ${flashPrice ? 'text-blue-600' : 'text-kmer-red'}`}>
                        {finalPrice.toLocaleString('fr-CM')} FCFA
                    </p>
                    {originalPrice && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                            {originalPrice.toLocaleString('fr-CM')} FCFA
                        </p>
                    )}
                </div>
            ) : (
                <p className="text-xl font-bold text-kmer-green">
                    {finalPrice.toLocaleString('fr-CM')} FCFA
                </p>
            )}
        </div>
        <div className="mt-2 text-sm font-bold">
            {totalStock > 0 ? (
                <p className={totalStock < 5 ? 'text-orange-500 font-semibold' : 'text-green-600'}>
                    {totalStock} en stock
                </p>
            ) : (
                <p className="text-red-500 font-semibold">
                    Rupture de stock
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;