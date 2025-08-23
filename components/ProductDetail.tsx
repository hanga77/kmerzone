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

const ProductDetail: React.FC<ProductDetailProps> = ({ product, allProducts, allUsers, stores, flashSales, onBack, onAddReview, onVendorClick, onProductClick, onOpenLogin, isChatEnabled, isComparisonEnabled }) => {
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
  const isOwner = user?.role === 'seller' && user.shopName === product.vendor;
  const vendorStore = stores.find(s => s.name === product.vendor);
  const sellerUser = allUsers.find(u => u.role === 'seller' && u.shopName === product.vendor);
  const inComparison = isInComparison(product.id);
  
  const approvedReviews = product.reviews.filter(r => r.status === 'approved');

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
                  <div className="absolute top-4 left-4 bg-blue-600 text-white text-lg font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"><BoltIcon className="w-5 h-5"/> VENTE FLASH</div>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {product.imageUrls.map((url, index) => (
                <button key={index} onClick={() => setMainImage(url)} className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${url === mainImage ? 'border-kmer-green' : 'border-transparent'}`}>
                  <img src={url} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <button onClick={() => onVendorClick(product.vendor)} className="text-gray-500 dark:text-gray-400 font-semibold hover:text-kmer-green hover:underline text-left">{product.vendor}</button>
              {vendorStore?.location && (
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {vendorStore.location}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white my-2">{product.name}</h1>
            
            <div className="my-2 flex items-center justify-between">
              {approvedReviews.length > 0 ? (
                  <div className="flex items-center gap-2">
                      <Rating rating={approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length} />
                      <span className="text-gray-600 dark:text-gray-400">({approvedReviews.length} avis)</span>
                  </div>
              ) : (
                  <p className="text-gray-500 dark:text-gray-400">Aucun avis pour le moment</p>
              )}
              <div className="flex items-center gap-2">
                <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title="Partager le produit">
                  <ShareIcon className="w-7 h-7" />
                </button>
                {isComparisonEnabled && (
                  <button onClick={() => toggleComparison(product.id)} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${inComparison ? 'text-kmer-green' : ''}`} title="Ajouter à la comparaison">
                      <ScaleIcon className="w-7 h-7" />
                  </button>
                )}
                <button onClick={() => toggleWishlist(product.id)} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-gray-800" title="Ajouter aux favoris">
                    <HeartIcon className="w-7 h-7" filled={isWishlisted(product.id)} />
                </button>
              </div>
            </div>
            
            <div className="my-4">
                {flashPrice || promotionIsActive ? (
                    <>
                      <div className="flex items-baseline gap-3">
                          {priceToDisplay}
                          <p className="text-xl text-gray-500 line-through">
                              {product.price.toLocaleString('fr-CM')} FCFA
                          </p>
                          <span className={`text-white text-sm font-semibold px-3 py-1 rounded-full ${flashPrice ? 'bg-blue-600' : 'bg-kmer-red'}`}>
                            -{percentageOff}%
                          </span>
                      </div>
                      {promotionIsActive && !flashPrice && product.promotionEndDate && (
                        <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 mt-2 bg-yellow-50 dark:bg-yellow-900/50 px-3 py-1 rounded-full">
                          <CalendarDaysIcon className="w-5 h-5" />
                          <span>Promotion valable jusqu'au {new Date(product.promotionEndDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </>
                ) : (
                  <>
                    {priceToDisplay}
                    {promotionIsUpcoming && product.promotionStartDate && (
                       <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-900/50 px-3 py-1 rounded-full">
                          <CalendarDaysIcon className="w-5 h-5" />
                          <span>Promotion à partir du {new Date(product.promotionStartDate).toLocaleDateString('fr-FR')} à {product.promotionPrice?.toLocaleString('fr-CM')} FCFA !</span>
                        </div>
                    )}
                  </>
                )}
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">{product.description}</p>
            
            <ProductCharacteristics product={product} />

            {otherOffers.length > 0 && isComparisonEnabled && (
              <AutoComparison 
                currentProduct={product}
                otherOffers={otherOffers}
                stores={stores}
                onProductClick={onProductClick}
              />
            )}

            {product.variants && product.variants.map(variant => (
                <div key={variant.name} className="my-2">
                    <h3 className="font-semibold mb-2">{variant.name}: <span className="font-normal text-gray-600 dark:text-gray-400">{selectedVariants[variant.name]}</span></h3>
                    <div className="flex flex-wrap gap-2">
                        {variant.options.map(option => (
                            <button 
                              key={option}
                              onClick={() => handleVariantSelect(variant.name, option)}
                              className={`px-4 py-1 border rounded-full ${selectedVariants[variant.name] === option ? 'bg-kmer-green text-white border-kmer-green' : 'border-gray-300 dark:border-gray-600'}`}>
                              {option}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            
            <div className="mt-auto pt-6">
                <div className="flex items-center gap-4 my-4">
                  <label htmlFor="quantity" className="font-semibold">Quantité:</label>
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-1 text-lg font-bold">-</button>
                    <input 
                      type="number"
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center border-l border-r border-gray-300 dark:border-gray-600 py-1 bg-transparent"
                      />
                    <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-1 text-lg font-bold">+</button>
                  </div>
                  <p className={`text-sm font-bold ${product.stock > 5 ? 'text-green-600' : 'text-orange-500'}`}>
                    {product.stock > 0 ? `${product.stock} en stock` : "Rupture de stock"}
                  </p>
                </div>
    
                <div className="flex flex-col sm:flex-row gap-3">
                     <button 
                      onClick={handleAddToCart}
                      disabled={product.stock === 0 || isOwner}
                      className={`w-full flex justify-center items-center gap-3 py-3 px-6 text-white font-bold rounded-lg text-lg transition-colors bg-kmer-red hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed`}
                      >
                      {isOwner ? "C'est votre produit" : (product.stock === 0 ? "Épuisé" : <><ShoppingCartIcon className="w-6 h-6" /> Ajouter au panier</>)}
                    </button>
                    {isChatEnabled && (
                      <button 
                          onClick={handleContactSeller}
                          disabled={isOwner}
                          className="w-full flex justify-center items-center gap-2 py-3 px-6 text-kmer-green font-bold rounded-lg bg-kmer-green/10 hover:bg-kmer-green/20 transition-colors disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                          <ChatBubbleBottomCenterTextIcon className="w-6 h-6"/> Contacter le vendeur
                      </button>
                    )}
                </div>
            </div>
          </div>
        </div>
          {/* Reviews Section */}
          <div className="mt-16 pt-8 border-t dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Avis des clients</h2>
              {approvedReviews.length > 0 ? (
                  <div className="space-y-6">
                      {approvedReviews.map((review, index) => (
                          <div key={index} className="border-b dark:border-gray-700 pb-4 last:border-b-0">
                              <div className="flex items-start mb-2">
                                  <div className="flex-grow">
                                      <Rating rating={review.rating} />
                                      <p className="font-bold mt-1">{review.author}</p>
                                  </div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{review.date}</p>
                              </div>
                              <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p>Soyez le premier à laisser un avis pour ce produit !</p>
              )}
              <ReviewForm productId={product.id} onAddReview={onAddReview} onOpenLogin={onOpenLogin}/>
          </div>
      </div>
      <RecommendedProducts currentProduct={product} allProducts={allProducts} stores={stores} onProductClick={onProductClick} onVendorClick={onVendorClick} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />
    </>
  );
};

export default ProductDetail;