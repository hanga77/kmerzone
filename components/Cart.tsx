import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { TrashIcon, ArrowLeftIcon } from './Icons';
import type { Product, FlashSale, CartItem, PromoCode } from '../types';

interface CartViewProps {
  onBack: () => void;
  onNavigateToCheckout: () => void;
  flashSales: FlashSale[];
  allPromoCodes: PromoCode[];
  appliedPromoCode: PromoCode | null;
  onApplyPromoCode: (code: PromoCode | null) => void;
}

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


const CartView: React.FC<CartViewProps> = ({ onBack, onNavigateToCheckout, flashSales, allPromoCodes, appliedPromoCode, onApplyPromoCode }) => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  
  const getFinalPrice = (item: CartItem) => {
    // Variant price overrides everything
    if (item.selectedVariant) {
        const variantDetail = item.variantDetails?.find(vd => {
            const vdKeys = Object.keys(vd.options);
            const selectedKeys = Object.keys(item.selectedVariant!);
            if (vdKeys.length !== selectedKeys.length) return false;
            return vdKeys.every(key => vd.options[key] === item.selectedVariant![key]);
        });
        if (variantDetail?.price) {
            return variantDetail.price;
        }
    }
    const flashPrice = getActiveFlashSalePrice(item.id, flashSales);
    if (flashPrice !== null) return flashPrice;
    if (isPromotionActive(item)) return item.promotionPrice!;
    return item.price;
  }

  const handleApplyPromoCode = () => {
    setPromoError('');
    onApplyPromoCode(null);
    if (!promoCodeInput.trim()) {
        setPromoError("Veuillez entrer un code.");
        return;
    }

    const code = allPromoCodes.find(pc => pc.code.toLowerCase() === promoCodeInput.toLowerCase());
    if (!code) {
        setPromoError("Code promo invalide.");
        return;
    }

    if (code.validUntil && new Date(code.validUntil) < new Date()) {
        setPromoError("Ce code promo a expiré.");
        return;
    }

    onApplyPromoCode(code);
    setPromoCodeInput('');
  };

  const subtotal = cart.reduce((sum, item) => sum + getFinalPrice(item) * item.quantity, 0);
  
  const discount = appliedPromoCode
    ? appliedPromoCode.discountType === 'percentage'
      ? (subtotal * appliedPromoCode.discountValue) / 100
      : appliedPromoCode.discountValue
    : 0;

  const totalBeforeDelivery = subtotal - discount;


  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-[80vh]">
        <div className="container mx-auto px-4 sm:px-6 py-12">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
                <ArrowLeftIcon className="w-5 h-5" />
                Continuer mes achats
            </button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Mon Panier</h1>

            {cart.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-2 dark:text-white">Votre panier est vide.</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Parcourez nos catégories pour trouver votre bonheur !</p>
                    <button onClick={onBack} className="bg-kmer-green text-white font-bold py-3 px-8 rounded-full hover:bg-green-700 transition-colors">
                        Commencer mes achats
                    </button>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 space-y-4">
                        {cart.map(item => (
                            <div key={item.id + JSON.stringify(item.selectedVariant)} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b dark:border-gray-700 pb-4 last:border-b-0">
                                <div className="flex items-center gap-4 flex-grow w-full">
                                    <img src={item.imageUrls[0] || PLACEHOLDER_IMAGE_URL} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md flex-shrink-0"/>
                                    <div>
                                        <h3 className="font-semibold text-lg dark:text-white">{item.name}</h3>
                                        {item.selectedVariant && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                {Object.entries(item.selectedVariant).map(([key, value]) => `${key}: ${value}`).join(' / ')}
                                            </p>
                                        )}
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">{item.vendor}</p>
                                        <p className="text-kmer-green font-bold mt-1">
                                          {getFinalPrice(item).toLocaleString('fr-CM')} FCFA
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                                     <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariant)} className="px-3 py-1 text-lg font-bold dark:text-gray-200">-</button>
                                        <span className="w-12 text-center border-l border-r border-gray-300 dark:border-gray-600 py-1 dark:text-white">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariant)} className="px-3 py-1 text-lg font-bold dark:text-gray-200">+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id, item.selectedVariant)} className="text-gray-500 hover:text-red-600 p-2">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-24">
                           <h2 className="text-xl font-bold border-b dark:border-gray-700 pb-4 mb-4 dark:text-white">Résumé de la commande</h2>
                            <div className="mb-4">
                                <label htmlFor="promo-code" className="text-sm font-medium dark:text-gray-300">Code Promo</label>
                                <div className="flex gap-2 mt-1">
                                    <input 
                                        type="text" 
                                        id="promo-code"
                                        value={promoCodeInput}
                                        onChange={(e) => setPromoCodeInput(e.target.value)}
                                        placeholder="Entrez votre code"
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    />
                                    <button onClick={handleApplyPromoCode} className="bg-gray-200 dark:bg-gray-600 font-semibold px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                                        Appliquer
                                    </button>
                                </div>
                                {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                            </div>
                           <div className="space-y-3 dark:text-gray-300 border-t dark:border-gray-700 pt-4">
                                <div className="flex justify-between">
                                    <span>Sous-total</span>
                                    <span className="font-semibold dark:text-white">{subtotal.toLocaleString('fr-CM')} FCFA</span>
                                </div>
                                {appliedPromoCode && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400">
                                        <span>Réduction ({appliedPromoCode.code})</span>
                                        <span className="font-semibold">- {discount.toLocaleString('fr-CM')} FCFA</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Frais de livraison</span>
                                    <span className="font-semibold dark:text-white">À calculer</span>
                                </div>
                                <div className="border-t dark:border-gray-700 pt-4 mt-4 flex justify-between text-lg font-bold dark:text-white">
                                    <span>Total (avant livraison)</span>
                                    <span>{totalBeforeDelivery.toLocaleString('fr-CM')} FCFA</span>
                                </div>
                           </div>
                           <button onClick={onNavigateToCheckout} className="w-full mt-6 bg-kmer-red text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400" disabled={cart.length === 0}>
                            Passer au paiement
                           </button>
                       </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default CartView;
