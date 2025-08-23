import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, OrangeMoneyLogo, MtnMomoLogo, PaypalIcon, TruckIcon, BuildingStorefrontIcon, VisaIcon, MastercardIcon } from './Icons';
import type { Order, Address, Product, FlashSale, PickupPoint, NewOrderData, CartItem, PromoCode, Store } from '../types';

declare const L: any;

interface CheckoutProps {
  onBack: () => void;
  onOrderConfirm: (orderData: NewOrderData) => Promise<void>;
  flashSales: FlashSale[];
  allPickupPoints: PickupPoint[];
  appliedPromoCode: PromoCode | null;
  allStores: Store[];
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
  if (!product.promotionPrice || product.promotionPrice >= product.price) {
    return false;
  }
  const now = new Date();
  const startDate = product.promotionStartDate ? new Date(product.promotionStartDate + 'T00:00:00') : null;
  const endDate = product.promotionEndDate ? new Date(product.promotionEndDate + 'T23:59:59') : null;
  if (!startDate && !endDate) {
    return false;
  }
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


const Checkout: React.FC<CheckoutProps> = ({ onBack, onOrderConfirm, flashSales, allPickupPoints, appliedPromoCode, allStores }) => {
  const { cart } = useCart();
  const { user } = useAuth();
  const [deliveryMethod, setDeliveryMethod] = useState<'home-delivery' | 'pickup'>('home-delivery');
  const [isProcessing, setIsProcessing] = useState(false);
  const isPremium = user?.loyalty?.status === 'premium';
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedCity, setSelectedCity] = useState('Douala');

  const [shippingAddress, setShippingAddress] = useState<Address>({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: 'Douala'
  });

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

  const subtotal = cart.reduce((sum, item) => getFinalPrice(item) * item.quantity + sum, 0);

  const deliveryFee = useMemo(() => {
    if (deliveryMethod !== 'home-delivery' || subtotal === 0) {
      return 0;
    }

    const deliveryFeesConfig = {
      intraUrban: 1000,
      interUrban: 2500,
    };

    const itemsByVendor = cart.reduce((acc, item) => {
      (acc[item.vendor] = acc[item.vendor] || []).push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    let totalFee = 0;

    for (const vendorName in itemsByVendor) {
      const vendorItems = itemsByVendor[vendorName];
      const vendorStore = allStores.find(s => s.name === vendorName);

      if (!vendorStore) {
        totalFee += deliveryFeesConfig.interUrban; // Fallback
        continue;
      }

      const maxProductShippingCost = Math.max(0, ...vendorItems
        .map(item => item.shippingCost)
        .filter((cost): cost is number => cost !== undefined && cost >= 0)
      );

      const zoneFee = vendorStore.location.toLowerCase() === shippingAddress.city.toLowerCase()
        ? deliveryFeesConfig.intraUrban
        : deliveryFeesConfig.interUrban;
      
      const shipmentFee = Math.max(maxProductShippingCost, zoneFee);
      totalFee += shipmentFee;
    }

    return totalFee;
  }, [cart, deliveryMethod, shippingAddress.city, subtotal, allStores]);
  
  const discount = appliedPromoCode
    ? appliedPromoCode.discountType === 'percentage'
      ? (subtotal * appliedPromoCode.discountValue) / 100
      : appliedPromoCode.discountValue
    : 0;
    
  const loyaltyDiscount = isPremium ? deliveryFee * 0.10 : 0;
  const total = subtotal - discount + deliveryFee - loyaltyDiscount;

  const [paymentMethod, setPaymentMethod] = useState('OM');
  const [useInstallments, setUseInstallments] = useState(false);
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('08:00 - 10:00');

  const filteredPickupPoints = useMemo(() => allPickupPoints.filter(p => p.city === selectedCity), [allPickupPoints, selectedCity]);
  const [selectedPickupPointId, setSelectedPickupPointId] = useState(filteredPickupPoints.length > 0 ? filteredPickupPoints[0].id : '');

  // Map Initialization & Cleanup
    useEffect(() => {
        if (deliveryMethod === 'pickup') {
            if (mapContainerRef.current && !mapRef.current) {
                mapRef.current = L.map(mapContainerRef.current).setView([3.8480, 11.5021], 7);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(mapRef.current);
            } else if (mapRef.current) {
                setTimeout(() => mapRef.current.invalidateSize(), 100);
            }
        } else {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        }
    }, [deliveryMethod]);

    // Map Markers
    useEffect(() => {
        if (mapRef.current && deliveryMethod === 'pickup') {
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            filteredPickupPoints.forEach(point => {
                if (point.latitude && point.longitude) {
                    const marker = L.marker([point.latitude, point.longitude]).addTo(mapRef.current);
                    marker.bindPopup(`<b>${point.name}</b><br>${point.street}, ${point.neighborhood}`);
                    marker.on('click', () => {
                        setSelectedPickupPointId(point.id);
                    });
                    markersRef.current.push(marker);
                }
            });
        }
    }, [deliveryMethod, filteredPickupPoints]);

    // Map Panning for city and point selection
    useEffect(() => {
        if (mapRef.current && deliveryMethod === 'pickup') {
            const cityCoords = {
                Douala: { lat: 4.05, lng: 9.70, zoom: 12 },
                Yaoundé: { lat: 3.86, lng: 11.52, zoom: 12 }
            };

            const point = allPickupPoints.find(p => p.id === selectedPickupPointId);
            if (point?.latitude && point?.longitude) {
                mapRef.current.flyTo([point.latitude, point.longitude], 14);
                const marker = markersRef.current.find(m => {
                    const latLng = m.getLatLng();
                    return latLng.lat === point.latitude && latLng.lng === point.longitude;
                });
                if (marker) marker.openPopup();
            } else if (cityCoords[selectedCity as keyof typeof cityCoords]) {
                const { lat, lng, zoom } = cityCoords[selectedCity as keyof typeof cityCoords];
                mapRef.current.flyTo([lat, lng], zoom);
            }
        }
    }, [selectedCity, selectedPickupPointId, deliveryMethod, allPickupPoints]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCity = e.target.value;
      setSelectedCity(newCity);
      const newCityPoints = allPickupPoints.filter(p => p.city === newCity);
      setSelectedPickupPointId(newCityPoints.length > 0 ? newCityPoints[0].id : '');
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Veuillez vous connecter pour passer une commande.");
      return;
    }
    
    if (deliveryMethod === 'home-delivery' && (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address)) {
      alert("Veuillez remplir toutes les informations de livraison.");
      return;
    }

    if (deliveryMethod === 'pickup' && !selectedPickupPointId) {
       alert("Veuillez choisir un point de dépôt.");
       return;
    }

    setIsProcessing(true);

    const orderData: NewOrderData = {
      userId: user.id,
      items: cart,
      subtotal,
      deliveryFee,
      total,
      shippingAddress,
      deliveryMethod,
      deliveryTimeSlot: deliveryMethod === 'home-delivery' ? deliveryTimeSlot : undefined,
      pickupPointId: deliveryMethod === 'pickup' ? selectedPickupPointId : undefined,
      appliedPromoCode: appliedPromoCode || undefined,
    };
    await onOrderConfirm(orderData);
  };

  if (cart.length === 0) {
      return (
          <div className="container mx-auto px-6 py-12 text-center">
              <h2 className="text-2xl font-semibold mb-4 dark:text-white">Votre panier est vide.</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Impossible de passer au paiement sans articles.</p>
              <button onClick={onBack} className="mt-4 bg-kmer-green text-white font-bold py-2 px-6 rounded-full">
                Retour à la boutique
              </button>
          </div>
      )
  }
  
  const deliveryTimeSlots = ["08:00 – 10:00", "12:00 – 14:00", "14:00 – 16:00"];

  return (
    <div className="bg-gray-100 dark:bg-gray-950 min-h-[80vh]">
      <div className="container mx-auto px-6 py-12">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
          <ArrowLeftIcon className="w-5 h-5" />
          Retour au panier
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Paiement</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-12">
          {/* Delivery & Payment Info */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <div>
                <h2 className="text-xl font-bold mb-4 dark:text-white">Méthode de livraison</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div onClick={() => setDeliveryMethod('home-delivery')} className={`p-4 border-2 rounded-lg cursor-pointer flex items-center gap-4 transition-all ${deliveryMethod === 'home-delivery' ? 'border-kmer-green bg-kmer-green/5' : 'border-gray-300 dark:border-gray-600'}`}>
                        <TruckIcon className="w-8 h-8 text-kmer-green" />
                        <div>
                            <p className="font-bold dark:text-white">Livraison à Domicile</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Recevez votre colis chez vous.</p>
                        </div>
                    </div>
                    <div onClick={() => setDeliveryMethod('pickup')} className={`p-4 border-2 rounded-lg cursor-pointer flex items-center gap-4 transition-all ${deliveryMethod === 'pickup' ? 'border-kmer-green bg-kmer-green/5' : 'border-gray-300 dark:border-gray-600'}`}>
                        <BuildingStorefrontIcon className="w-8 h-8 text-kmer-green" />
                        <div>
                            <p className="font-bold dark:text-white">Retrait en Point de Dépôt</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Gratuit et flexible.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {deliveryMethod === 'home-delivery' ? (
              <div>
                <h2 className="text-xl font-bold mb-4 dark:text-white">Informations de livraison</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom complet</label>
                    <input type="text" id="fullName" name="fullName" value={shippingAddress.fullName} onChange={handleAddressChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Numéro de téléphone</label>
                    <input type="tel" id="phone" name="phone" value={shippingAddress.phone} onChange={handleAddressChange} placeholder="+237 6XX XX XX XX" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse de livraison</label>
                    <input type="text" id="address" name="address" value={shippingAddress.address} onChange={handleAddressChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ville</label>
                    <select id="city" name="city" value={shippingAddress.city} onChange={handleAddressChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option>Douala</option>
                      <option>Yaoundé</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="deliveryTimeSlot" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Heure de livraison</label>
                    <select id="deliveryTimeSlot" name="deliveryTimeSlot" value={deliveryTimeSlot} onChange={(e) => setDeliveryTimeSlot(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        {deliveryTimeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
                 <div>
                    <h2 className="text-xl font-bold mb-4 dark:text-white">Choisissez votre point de dépôt</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="pickup-city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1. Choisissez une ville</label>
                                <select 
                                    id="pickup-city"
                                    value={selectedCity} 
                                    onChange={handleCityChange} 
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="Douala">Douala</option>
                                    <option value="Yaoundé">Yaoundé</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="pickup-point" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">2. Choisissez un point de dépôt</label>
                                <select 
                                    id="pickup-point" 
                                    value={selectedPickupPointId} 
                                    onChange={(e) => setSelectedPickupPointId(e.target.value)} 
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    size={5}
                                    required={deliveryMethod === 'pickup'}
                                >
                                    {filteredPickupPoints.map(pp => <option key={pp.id} value={pp.id}>{pp.name} - {pp.neighborhood}</option>)}
                                </select>
                            </div>
                        </div>
                        <div ref={mapContainerRef} className="h-64 md:h-80 w-full rounded-lg shadow-md z-0" style={{ minHeight: '250px' }}></div>
                    </div>
                </div>
            )}

            <div>
              <h2 className="text-xl font-bold mb-4 dark:text-white">Méthode de paiement</h2>
              <div className="space-y-4">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer dark:border-gray-600 ${paymentMethod === 'OM' ? 'border-kmer-green ring-2 ring-kmer-green' : 'border-gray-300'}`}>
                  <input type="radio" name="paymentMethod" value="OM" checked={paymentMethod === 'OM'} onChange={() => setPaymentMethod('OM')} className="h-4 w-4 text-kmer-green focus:ring-kmer-green" />
                  <span className="ml-4 flex-grow font-semibold dark:text-white">Orange Money</span>
                  <OrangeMoneyLogo className="h-8" />
                </label>
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer dark:border-gray-600 ${paymentMethod === 'MoMo' ? 'border-kmer-green ring-2 ring-kmer-green' : 'border-gray-300'}`}>
                  <input type="radio" name="paymentMethod" value="MoMo" checked={paymentMethod === 'MoMo'} onChange={() => setPaymentMethod('MoMo')} className="h-4 w-4 text-kmer-green focus:ring-kmer-green" />
                  <span className="ml-4 flex-grow font-semibold dark:text-white">MTN Mobile Money</span>
                  <MtnMomoLogo className="h-8" />
                </label>
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer dark:border-gray-600 ${paymentMethod === 'Card' ? 'border-kmer-green ring-2 ring-kmer-green' : 'border-gray-300'}`}>
                  <input type="radio" name="paymentMethod" value="Card" checked={paymentMethod === 'Card'} onChange={() => setPaymentMethod('Card')} className="h-4 w-4 text-kmer-green focus:ring-kmer-green" />
                  <span className="ml-4 flex-grow font-semibold dark:text-white">Carte de crédit</span>
                  <div className="flex items-center gap-2">
                    <VisaIcon className="h-8"/>
                    <MastercardIcon className="h-8"/>
                  </div>
                </label>
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer dark:border-gray-600 ${paymentMethod === 'PayPal' ? 'border-kmer-green ring-2 ring-kmer-green' : 'border-gray-300'}`}>
                  <input type="radio" name="paymentMethod" value="PayPal" checked={paymentMethod === 'PayPal'} onChange={() => setPaymentMethod('PayPal')} className="h-4 w-4 text-kmer-green focus:ring-kmer-green" />
                  <span className="ml-4 flex-grow font-semibold dark:text-white">PayPal</span>
                  <PaypalIcon className="h-8" />
                </label>
              </div>
               <div className="mt-6 pt-6 border-t dark:border-gray-700">
                  <label className="flex items-center">
                      <input type="checkbox" checked={useInstallments} onChange={(e) => setUseInstallments(e.target.checked)} className="h-4 w-4 text-kmer-green rounded border-gray-300 focus:ring-kmer-green" />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Payer en 4x (25% aujourd'hui)</span>
                  </label>
                  {useInstallments && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md space-y-1">
                        <p>Aujourd'hui : <strong>{(total * 0.25).toLocaleString('fr-CM')} FCFA</strong></p>
                        <p>Suivi de 3 mensualités de <strong>{((total * 0.75) / 3).toLocaleString('fr-CM')} FCFA</strong></p>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold border-b pb-4 mb-4 dark:border-gray-700 dark:text-white">Résumé de la commande</h2>
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {cart.map(item => (
                    <div key={item.id + JSON.stringify(item.selectedVariant)} className="flex justify-between text-sm">
                        <div className="pr-2">
                           <span className="dark:text-gray-300">{item.name} x {item.quantity}</span>
                           {item.selectedVariant && (
                               <p className="text-xs text-gray-500">
                                   {Object.entries(item.selectedVariant).map(([key, value]) => `${key}: ${value}`).join(' / ')}
                               </p>
                           )}
                        </div>
                        <span className="font-medium whitespace-nowrap dark:text-gray-200">{(getFinalPrice(item) * item.quantity).toLocaleString('fr-CM')} FCFA</span>
                    </div>
                ))}
              </div>
               <div className="space-y-3 border-t pt-4 dark:border-gray-700">
                    <div className="flex justify-between dark:text-gray-300">
                        <span>Sous-total</span>
                        <span className="font-semibold dark:text-gray-200">{subtotal.toLocaleString('fr-CM')} FCFA</span>
                    </div>
                    {appliedPromoCode && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>Réduction ({appliedPromoCode.code})</span>
                            <span className="font-semibold">- {discount.toLocaleString('fr-CM')} FCFA</span>
                        </div>
                    )}
                    <div className="flex justify-between dark:text-gray-300">
                        <span>Frais de livraison</span>
                        <span className="font-semibold dark:text-gray-200">{deliveryFee.toLocaleString('fr-CM')} FCFA</span>
                    </div>
                    {isPremium && deliveryFee > 0 && (
                        <div className="flex justify-between text-kmer-yellow">
                            <span>Réduction Premium (10%)</span>
                            <span className="font-semibold">- {loyaltyDiscount.toLocaleString('fr-CM')} FCFA</span>
                        </div>
                    )}
                    <div className="border-t pt-4 mt-4 flex justify-between text-lg font-bold dark:border-gray-700 dark:text-white">
                        <span>Total</span>
                        <span>{total.toLocaleString('fr-CM')} FCFA</span>
                    </div>
               </div>
               <button 
                 type="submit" 
                 disabled={isProcessing}
                 className="w-full mt-6 bg-kmer-red text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center"
               >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Traitement en cours...
                  </>
                ) : (
                  useInstallments ? `Payer ${ (total * 0.25).toLocaleString('fr-CM')} FCFA maintenant` : `Confirmer et Payer ${total.toLocaleString('fr-CM')} FCFA`
                )}
               </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;