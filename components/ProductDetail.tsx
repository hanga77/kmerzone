import React, { useState, useEffect } from 'react';
import type { Product, Review, Store, FlashSale, User } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useComparison } from '../contexts/ComparisonContext';
import { useChatContext } from '../contexts/ChatContext';
import { ArrowLeftIcon, ShoppingCartIcon, StarIcon, HeartIcon, CalendarDaysIcon, MapPinIcon, BoltIcon, ChatBubbleBottomCenterTextIcon, ScaleIcon, ShareIcon } from './Icons';
import RecommendedProducts from './RecommendedProducts';
import AutoComparison from './AutoComparison';

interface ProductDetailProps {
  product: Product;
  allProducts: Product[];
  allUsers: User[];
  stores: Store[];
  flashSales: FlashSale[];
  onBack: () => void;
  onAddReview: (productId: string, review: Review) => void;
  onVendorClick: (vendorName: string) => void;
  onProductClick: (product: Product) => void;
  onOpenLogin: () => void;
  isChatEnabled: boolean;
  isComparisonEnabled: boolean;
  onProductView: (productId: string) => void;
}

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
  // A promotion must have a promotional price lower than the regular price.
  if (!product.promotionPrice || product.promotionPrice >= product.price) {
    return false;
  }

  const now = new Date();
  // Dates from input are YYYY-MM-DD. Appending time details ensures they are parsed correctly in local time.
  const startDate = product.promotionStartDate ? new Date(product.promotionStartDate + 'T00:00:00') : null;
  const endDate = product.promotionEndDate ? new Date(product.promotionEndDate + 'T23:59:59') : null;

  // A promotion is not active if it doesn't have at least a start or end date defined.
  if (!startDate && !endDate) {
    return false;
  }

  // Check against date ranges
  if (startDate && endDate) {
    return now >= startDate && now <= endDate;
  }
  if (startDate) {
    return now >= startDate;
  }
  if (endDate) {
    return now <= endDate;
  }
  
  return false; 
};

const Rating: React.FC<{ rating: number, setRating?: (rating: number) => void }> = ({ rating, setRating }) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <button 
            type="button"
            key={i} 
            onClick={setRating ? () => setRating(i + 1) : undefined}
            className={setRating ? 'cursor-pointer' : ''}
            disabled={!setRating}
        >
            <StarIcon 
                className={`w-5 h-5 ${i < rating ? 'text-kmer-yellow' : 'text-gray-300 dark:text-gray-500'}`} 
                filled={i < rating}
            />
        </button>
      ))}
    </div>
);

const ReviewForm: React.FC<{ productId: string, onAddReview: (productId: string, review: Review) => void, onOpenLogin: () => void }> = ({ productId, onAddReview, onOpenLogin }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rating || !comment || !user) {
            alert("Veuillez donner une note et un commentaire.");
            return;
        }
        const newReview: Review = {
            author: user.name,
            rating,
            comment,
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
        };
        onAddReview(productId, newReview);
        setRating(0);
        setComment('');
        setSubmitted(true);
    };
    
    if (!user) {
      return (
        <div className="mt-8 text-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          Vous devez être <button onClick={onOpenLogin} className="text-kmer-green font-bold underline">connecté</button> pour laisser un avis.
        </div>
      );
    }
    
    if (submitted) {
        return (
            <div className="mt-8 text-center text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/50 p-6 rounded-lg">
                <h3 className="font-bold text-lg">Merci pour votre avis !</h3>
                <p>Il a été soumis et est en attente de modération avant d'être publié.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-8 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-4">Laissez votre avis</h3>
            <div className="mb-4">
                <label className="block font-medium mb-1">Votre note</label>
                <Rating rating={rating} setRating={setRating} />
            </div>
            <div className="mb-4">
                <label htmlFor="comment" className="block font-medium mb-1">Votre commentaire</label>
                <textarea 
                    id="comment" 
                    rows={4} 
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Décrivez votre expérience avec ce produit..."
                    required
                ></textarea>
            </div>
            <button type="submit" className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">
                Soumettre l'avis
            </button>
        </form>
    );
};

const ProductCharacteristics: React.FC<{ product: Product }> = ({ product }) => {
  const characteristics = [
    // Generic
    { label: 'Marque', value: product.brand },
    { label: 'Genre', value: product.gender },
    { label: 'Matériau', value: product.material },
    { label: 'Poids', value: product.weight },
    { label: 'Dimensions', value: product.dimensions },
    // Electronics
    { label: 'Modèle', value: product.modelNumber },
    { label: 'Couleur', value: product.color },
    { label: 'Garantie', value: product.warranty },
    // Books
    { label: 'Auteur', value: product.author },
    { label: 'Éditeur', value: product.publisher },
    { label: 'Année', value: product.publicationYear },
    { label: 'ISBN', value: product.isbn },
    // Others
    { label: 'N° de série', value: product.serialNumber },
    { label: 'Date de production', value: product.productionDate ? new Date(product.productionDate).toLocaleDateString('fr-FR') : undefined },
    { label: 'Date d\'expiration', value: product.expirationDate ? new Date(product.expirationDate).toLocaleDateString('fr-FR') : undefined },
  ].filter(c => c.value);

  if (characteristics.length === 0) return null;

  return (
    <div className="mt-6">
        <h3 className="text-lg font-semibold border-b pb-2 mb-3 dark:border-gray-700">Caractéristiques</h3>
        <div className="text-sm space-y-2">
            {characteristics.map(char => (
                <div key={char.label} className="flex">
                    <span className="w-1/3 text-gray-500 dark:text-gray-400">{char.label}</span>
                    <span className="w-2/3 font-medium text-gray-800 dark:text-gray-200">{char.value}</span>
                </div>
            ))}
        </div>
    </div>
  );
};

const ProductDetail: React.FC<ProductDetailProps> = ({ product, allProducts, allUsers, stores, flashSales, onBack, onAddReview, onVendorClick, onProductClick, onOpenLogin, isChatEnabled, isComparisonEnabled, onProductView }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [mainImage, setMainImage] = useState(product.imageUrls[0]);
  const [otherOffers, setOtherOffers] = useState<Product[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { startChat } = useChatContext();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isInComparison, toggleComparison } = useComparison();
  const isSeller = user?.role === 'seller';
  const vendorStore = stores.find(s => s.name === product.vendor);
  const sellerUser = allUsers.find(u => u.role === 'seller' && u.shopName === product.vendor);
  const inComparison = isInComparison(product.id);
  
  const approvedReviews = product.reviews.filter(r => r.status === 'approved');

  useEffect(() => {
    onProductView(product.id);
  }, [product.id, onProductView]);

  useEffect(() => {
    // Find other offers for the same product
    const offers = allProducts.filter(p => p.name === product.name && p.id !== product.id);
    setOtherOffers(offers);
    
    // Reset state when product changes
    setMainImage(product.imageUrls[0]);
    setQuantity(1);
    setSelectedVariants({});
    window.scrollTo(0, 0);
  }, [product, allProducts]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };
  
  const handleContactSeller = () => {
      if (sellerUser && vendorStore) {
        startChat(sellerUser, vendorStore, product);
      } else {
        alert("Impossible de trouver les informations du vendeur.");
      }
  };

  const handleShare = async () => {
    const productUrl = `${window.location.origin}${window.location.pathname}?page=product&id=${product.id}`;
    const shareData = {
        title: product.name,
        text: `Découvrez ${product.name} sur KMER ZONE !`,
        url: productUrl,
    };
    
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Share failed:', err);
        }
    } else if (navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(productUrl);
            setToastMessage("Lien copié dans le presse-papiers !");
            setTimeout(() => setToastMessage(null), 3000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            setToastMessage("La copie du lien a échoué.");
            setTimeout(() => setToastMessage(null), 3000);
        }
    } else {
        setToastMessage("Le partage ou la copie n'est pas supporté sur votre navigateur.");
        setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleVariantSelect = (variantName: string, option: string) => {
    setSelectedVariants(prev => ({...prev, [variantName]: option}));
  }

  const flashPrice = getActiveFlashSalePrice(product.id, flashSales);
  const promotionIsActive = isPromotionActive(product);
  
  let finalPrice = product.price;
  let priceToDisplay;
  if (flashPrice !== null) {
      priceToDisplay = <p className="text-3xl font-bold text-blue-600">{flashPrice.toLocaleString('fr-CM')} FCFA</p>;
      finalPrice = flashPrice;
  } else if (promotionIsActive) {
      priceToDisplay = <p className="text-3xl font-bold text-kmer-red">{product.promotionPrice?.toLocaleString('fr-CM')} FCFA</p>;
      finalPrice = product.promotionPrice!;
  } else {
      priceToDisplay = <p className="text-3xl font-bold text-kmer-green">{product.price.toLocaleString('fr-CM')} FCFA</p>;
  }

  const percentageOff = flashPrice ? Math.round(((product.price - flashPrice) / product.price) * 100) : (promotionIsActive ? Math.round(((product.price - product.promotionPrice!) / product.price) * 100) : 0);
  
  const promotionIsDefined = !!(product.promotionPrice && product.promotionPrice < product.price && (product.promotionStartDate || product.promotionEndDate));
  const promotionIsUpcoming = promotionIsDefined && !promotionIsActive && product.promotionStartDate && new Date(product.promotionStartDate + 'T00:00:00') > new Date();


  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-bottom-5">
            {toastMessage}
        </div>
      )}
      <div className="container mx-auto px-6 py-12">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
          <ArrowLeftIcon className="w-5 h-5" />
          Retour
        </button>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image Gallery */}
          <div>
            <div className="mb-4 relative">
              <img src={mainImage} alt={product.name} className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg" />
               {flashPrice && (
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1"><BoltIcon className="w-4 h-4"/> VENTE FLASH</div>
                )}
                {!flashPrice && promotionIsUpcoming && (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg">PROMO À VENIR</div>
                )}
                {!flashPrice && promotionIsActive && (
                    <div className="absolute top-3 left-3 bg-kmer-red text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-lg">-{percentageOff}%</div>
                )}
            </div>
            <div className="flex space-x-2">
              {product.imageUrls.map((url, index) => (
                <img key={index} src={url} alt={`${product.name} thumbnail ${index + 1}`} onClick={() => setMainImage(url)} className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${mainImage === url ? 'border-kmer-green' : 'border-transparent'}`} />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <button onClick={() => onVendorClick(product.vendor)} className="text-gray-500 dark:text-gray-400 hover:text-kmer-green hover:underline">{product.vendor}</button>
            <h1 className="text-4xl font-bold mt-2 text-gray-800 dark:text-white">{product.name}</h1>
            
             <div className="flex items-center mt-4">
              <Rating rating={approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length} />
              <span className="ml-2 text-gray-600 dark:text-gray-300 text-sm">({approvedReviews.length} avis)</span>
            </div>

            <div className="my-6">
                {priceToDisplay}
                {(flashPrice || promotionIsActive) && <p className="text-gray-500 dark:text-gray-400 line-through">Prix original : {product.price.toLocaleString('fr-CM')} FCFA</p>}
                 {promotionIsActive && product.promotionEndDate && !flashPrice && (
                  <div className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>L'offre se termine le {new Date(product.promotionEndDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                {promotionIsUpcoming && product.promotionStartDate && !flashPrice && (
                  <div className="flex items-center gap-1 text-sm text-blue-500 dark:text-blue-400 mt-2">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>Promotion disponible le {new Date(product.promotionStartDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-300">{product.description}</p>
            
            <ProductCharacteristics product={product} />

            {vendorStore && (
                <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <MapPinIcon className="w-5 h-5 text-kmer-green flex-shrink-0" />
                    Vendu et expédié depuis <strong>{vendorStore.location}</strong>
                </div>
            )}
            
            {/* Variants */}
            {product.variants && product.variants.map(variant => (
                <div key={variant.name} className="mt-6">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">{variant.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {variant.options.map(option => (
                            <button key={option} onClick={() => handleVariantSelect(variant.name, option)} className={`px-4 py-2 border rounded-md text-sm font-medium ${selectedVariants[variant.name] === option ? 'border-kmer-green bg-kmer-green/10 text-kmer-green' : 'border-gray-300 dark:border-gray-600'}`}>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isSeller}
                className="w-full flex-grow bg-kmer-green text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:bg-green-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                title={isSeller ? "Les vendeurs ne peuvent pas effectuer d'achats" : ""}
              >
                <ShoppingCartIcon className="w-6 h-6" />
                {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
              </button>
               <button onClick={() => toggleWishlist(product.id)} className="p-3 border-2 rounded-lg hover:border-kmer-red transition-colors" aria-label="Ajouter à la liste de souhaits">
                   <HeartIcon className="w-6 h-6" filled={isWishlisted(product.id)} />
               </button>
                {isComparisonEnabled && (
                  <button onClick={() => toggleComparison(product.id)} className={`p-3 border-2 rounded-lg hover:border-kmer-green transition-colors ${inComparison ? 'border-kmer-green text-kmer-green' : ''}`} aria-label="Ajouter à la comparaison">
                    <ScaleIcon className="w-6 h-6"/>
                  </button>
                )}
                <button onClick={handleShare} className="p-3 border-2 rounded-lg hover:border-blue-500 transition-colors" aria-label="Partager">
                    <ShareIcon className="w-6 h-6"/>
                </button>
            </div>
            {isChatEnabled && !isSeller && (
                 <button onClick={handleContactSeller} className="mt-4 w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:bg-blue-600 transition-colors">
                    <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
                    Contacter le vendeur
                 </button>
            )}

          </div>
        </div>

        {otherOffers.length > 0 && (
            <AutoComparison currentProduct={product} otherOffers={otherOffers} stores={stores} onProductClick={onProductClick} />
        )}

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 border-b pb-4 dark:border-gray-700">Avis des clients ({approvedReviews.length})</h2>
          {approvedReviews.length > 0 ? (
            <div className="space-y-6">
              {approvedReviews.map((review, index) => (
                <div key={index} className="border-b pb-6 last:border-b-0 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <Rating rating={review.rating} />
                    <span className="ml-4 font-bold text-gray-800 dark:text-white">{review.author}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{new Date(review.date).toLocaleDateString('fr-FR')}</p>
                  <p className="text-gray-600 dark:text-gray-300 italic">"{review.comment}"</p>
                  {review.sellerReply && (
                      <div className="mt-4 ml-8 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg border-l-4 border-kmer-green">
                          <p className="font-bold text-sm text-gray-800 dark:text-gray-200">Réponse du vendeur</p>
                          <p className="text-gray-600 dark:text-gray-300 italic">"{review.sellerReply.text}"</p>
                      </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Aucun avis pour ce produit pour le moment.</p>
          )}

          <ReviewForm productId={product.id} onAddReview={onAddReview} onOpenLogin={onOpenLogin} />
        </div>
      </div>
      <RecommendedProducts 
        currentProduct={product} 
        allProducts={allProducts} 
        stores={stores} 
        flashSales={flashSales}
        onProductClick={onProductClick}
        onVendorClick={onVendorClick}
        isComparisonEnabled={isComparisonEnabled}
      />
    </>
  );
};

export default ProductDetail;