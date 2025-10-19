import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import type { NewOrderData, PickupPoint, SiteSettings, Address, PaymentMethod, CartItem, Store, PromoCode, Product, FlashSale, PaymentRequest } from '../types';
import { ArrowLeftIcon, BuildingStorefrontIcon, CheckCircleIcon, CreditCardIcon, MapPinIcon, PlusIcon, ShoppingBagIcon, TruckIcon, XIcon } from './Icons';

// Helper functions for price calculation
const getActiveFlashSalePrice = (productId: string, flashSales: FlashSale[]): number | null => {
    const now = new Date();
    for (const sale of flashSales) {
        if (new Date(sale.startDate) <= now && new Date(sale.endDate) >= now) {
            const productInSale = sale.products.find(p => p.productId === productId && p.status === 'approved');
            if (productInSale) return productInSale.flashPrice;
        }
    }
    return null;
};
const isPromotionActive = (product: Product): boolean => {
  if (!product.promotionPrice || product.promotionPrice >= product.price) return false;
  const now = new Date();
  const startDate = product.promotionStartDate ? new Date(product.promotionStartDate + 'T00:00:00') : null;
  const endDate = product.promotionEndDate ? new Date(product.promotionEndDate + 'T23:59:59') : null;
  
  // FIX: A promotion with a price but no dates is a permanent promotion.
  if (!startDate && !endDate) return true;

  if (startDate && endDate) return now >= startDate && now <= endDate;
  if (startDate) return now >= startDate;
  if (endDate) return now <= endDate;
  return false; 
};

const getFinalPrice = (item: CartItem, flashSales: FlashSale[]) => {
    if (item.selectedVariant) {
        const variantDetail = item.variantDetails?.find(vd => {
            if (!item.selectedVariant) return false;
            const vdKeys = Object.keys(vd.options);
            const selectedKeys = Object.keys(item.selectedVariant!);
            if (vdKeys.length !== selectedKeys.length) return false;
            return vdKeys.every(key => vd.options[key] === item.selectedVariant![key]);
        });
        if (variantDetail?.price) return variantDetail.price;
    }
    const flashPrice = getActiveFlashSalePrice(item.id, flashSales);
    if (flashPrice !== null) return flashPrice;
    if (isPromotionActive(item)) return item.promotionPrice!;
    return item.price;
}

const AddressForm: React.FC<{
  onSave: (address: Omit<Address, 'id' | 'isDefault'>) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState<Omit<Address, 'id' | 'isDefault'>>({
        fullName: user?.name || '',
        phone: user?.phone || '',
        address: '',
        city: 'Douala',
        label: 'Maison'
    });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 mt-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 animate-in">
            <h3 className="font-semibold text-lg dark:text-white">Ajouter une nouvelle adresse</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Nom complet" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Téléphone" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                <input name="address" value={formData.address} onChange={handleChange} placeholder="Adresse (Rue, quartier, repère...)" className="sm:col-span-2 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                <select name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option>Douala</option>
                    <option>Yaoundé</option>
                    <option>Bafoussam</option>
                    <option>Limbe</option>
                    <option>Kribi</option>
                </select>
                <input name="label" value={formData.label} onChange={handleChange} placeholder="Étiquette (Maison, Bureau...)" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-4 rounded-lg">Annuler</button>
                <button type="submit" className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg">Enregistrer</button>
            </div>
        </form>
    );
};

interface CheckoutProps {
  onBack: () => void;
  onOrderConfirm: (orderData: NewOrderData) => void;
  flashSales: FlashSale[];
  allPickupPoints: PickupPoint[];
  allStores: Store[];
  appliedPromoCode: PromoCode | null;
  siteSettings: SiteSettings;
  paymentMethods: PaymentMethod[];
}

const Checkout: React.FC<CheckoutProps> = ({ onBack, onOrderConfirm, flashSales, allPickupPoints, allStores, appliedPromoCode, siteSettings, paymentMethods }) => {
    const { user, addAddress } = useAuth();
    const { cart } = useCart();
    
    const [deliveryMethod, setDeliveryMethod] = useState<'home-delivery' | 'pickup'>('home-delivery');
    const defaultAddressId = user?.addresses?.find(a => a.isDefault)?.id;
    const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(defaultAddressId);
    const [selectedPickupPointId, setSelectedPickupPointId] = useState<string | undefined>(allPickupPoints[0]?.id);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | undefined>(paymentMethods[0]?.id);
    const [isAddingAddress, setIsAddingAddress] = useState(false);

    const subtotal = cart.reduce((sum, item) => sum + getFinalPrice(item, flashSales) * item.quantity, 0);
    const discount = appliedPromoCode
        ? appliedPromoCode.discountType === 'percentage'
        ? (subtotal * appliedPromoCode.discountValue) / 100
        : appliedPromoCode.discountValue
        : 0;
    const subtotalAfterDiscount = subtotal - discount;
    const selectedAddress = user?.addresses?.find(a => a.id === selectedAddressId);
    
    const deliveryFee = useMemo(() => {
        if (deliveryMethod === 'pickup' || !selectedAddress) return 0;

        const customerCity = selectedAddress.city;

        // Group items by vendor
        const itemsByVendor: Record<string, CartItem[]> = cart.reduce((acc, item) => {
            (acc[item.vendor] = acc[item.vendor] || []).push(item);
            return acc;
        }, {} as Record<string, CartItem[]>);

        let totalFee = 0;

        // Calculate fee for each vendor
        for (const vendorName in itemsByVendor) {
            const vendorItems = itemsByVendor[vendorName];
            
            // FIX: If all items from this vendor are services, skip shipping fee calculation for them
            if (vendorItems.every(item => (item.type || 'product') === 'service')) {
                continue;
            }

            const store = allStores.find(s => s.name === vendorName);
            if (!store) continue;

            const vendorSubtotal = vendorItems.reduce((sum, item) => sum + getFinalPrice(item, flashSales) * item.quantity, 0);

            // 1. Check for seller's custom shipping settings
            if (store.shippingSettings) {
                // Check free shipping threshold
                if (store.shippingSettings.freeShippingThreshold !== null && vendorSubtotal >= store.shippingSettings.freeShippingThreshold) {
                    continue; // Shipping is free for this vendor's items
                }

                // Check custom rates
                const isLocal = store.location === customerCity;
                const customRate = isLocal ? store.shippingSettings.customRates.local : store.shippingSettings.customRates.national;
                if (customRate !== null) {
                    totalFee += customRate;
                    continue; // Custom rate applied, move to next vendor
                }
            }
            
            // 2. Fallback to platform's default calculation for this vendor
            const isInterUrban = store.location !== customerCity;
            const baseFee = isInterUrban
                ? siteSettings.deliverySettings.interUrbanBaseFee
                : siteSettings.deliverySettings.intraUrbanBaseFee;
            totalFee += baseFee; 
        }
        
        // Apply global premium discount if applicable
        let discountPercentage = 0;
        if (siteSettings.deliverySettings.premiumDeliveryDiscountPercentage && (user?.loyalty.status === 'premium' || user?.loyalty.status === 'premium_plus')) {
            discountPercentage = siteSettings.deliverySettings.premiumDeliveryDiscountPercentage;
        }

        return totalFee - (totalFee * discountPercentage / 100);
    }, [selectedAddress, deliveryMethod, cart, allStores, siteSettings, user, flashSales]);

    const total = subtotalAfterDiscount + deliveryFee;

    const handleSaveAddress = (address: Omit<Address, 'id'|'isDefault'>) => {
        if (user) {
            addAddress(user.id, address);
            // This is a simplification. We assume the user list updates and re-renders.
            // A better way would be to get the new address ID back and set it as selected.
            setIsAddingAddress(false);
        }
    };
    
    const handleConfirmOrder = () => {
        if (!user) return;
        if (deliveryMethod === 'home-delivery' && !selectedAddress) {
            alert("Veuillez sélectionner une adresse de livraison.");
            return;
        }
        if (deliveryMethod === 'pickup' && !selectedPickupPointId) {
            alert("Veuillez sélectionner un point de retrait.");
            return;
        }
        
        let finalShippingAddress: Address;
        if (deliveryMethod === 'home-delivery') {
            if (!selectedAddress) {
                alert("Veuillez sélectionner une adresse de livraison.");
                return;
            }
            finalShippingAddress = selectedAddress;
        } else {
            const pickupPoint = allPickupPoints.find(p => p.id === selectedPickupPointId);
            finalShippingAddress = {
                id: `pickup-${pickupPoint?.id || 'unknown'}`,
                fullName: user.name,
                phone: user.phone || 'N/A',
                address: pickupPoint ? `${pickupPoint.name}, ${pickupPoint.neighborhood}` : 'Point de retrait',
                city: pickupPoint?.city || '',
            };
        }

        const orderData: NewOrderData = {
            userId: user.id,
            items: cart,
            subtotal,
            deliveryFee,
            total,
            shippingAddress: finalShippingAddress,
            deliveryMethod,
            pickupPointId: deliveryMethod === 'pickup' ? selectedPickupPointId : undefined,
            appliedPromoCode: appliedPromoCode || undefined,
        };
        onOrderConfirm(orderData);
    };

    if (cart.length === 0) {
        return (
            <div className="text-center p-12">
                <p>Votre panier est vide.</p>
                <button onClick={onBack} className="mt-4 bg-kmer-green text-white px-4 py-2 rounded">Retourner à la boutique</button>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 py-12">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Retour au panier
                </button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Finaliser ma commande</h1>
                <div className="grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Delivery Method */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold mb-4 dark:text-white">1. Méthode de livraison</h2>
                            <div className="flex gap-4">
                                <button onClick={() => setDeliveryMethod('home-delivery')} className={`flex-1 p-4 border-2 rounded-lg text-left ${deliveryMethod === 'home-delivery' ? 'border-kmer-green' : 'dark:border-gray-700'}`}>
                                    <div className="flex items-center gap-3"><TruckIcon className="w-6 h-6"/> <span className="font-semibold">Livraison à domicile</span></div>
                                </button>
                                <button onClick={() => setDeliveryMethod('pickup')} className={`flex-1 p-4 border-2 rounded-lg text-left ${deliveryMethod === 'pickup' ? 'border-kmer-green' : 'dark:border-gray-700'}`}>
                                    <div className="flex items-center gap-3"><BuildingStorefrontIcon className="w-6 h-6"/> <span className="font-semibold">Retrait en point de dépôt</span></div>
                                </button>
                            </div>
                        </div>

                        {/* Address/Pickup Point */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold mb-4 dark:text-white">2. {deliveryMethod === 'home-delivery' ? 'Adresse de livraison' : 'Point de dépôt'}</h2>
                            {deliveryMethod === 'home-delivery' ? (
                                <div className="space-y-4">
                                    {user?.addresses?.map(addr => (
                                        <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)} className={`p-4 border-2 rounded-lg cursor-pointer flex items-start gap-4 ${selectedAddressId === addr.id ? 'border-kmer-green' : 'dark:border-gray-700'}`}>
                                            <input type="radio" checked={selectedAddressId === addr.id} readOnly className="mt-1 h-4 w-4 text-kmer-green focus:ring-kmer-green"/>
                                            <div className="text-sm">
                                                <p className="font-bold">{addr.label}</p>
                                                <address className="not-italic">{addr.fullName}, {addr.address}, {addr.city}, {addr.phone}</address>
                                            </div>
                                        </div>
                                    ))}
                                    {!isAddingAddress && (
                                        <button onClick={() => setIsAddingAddress(true)} className="flex items-center gap-2 text-kmer-green font-semibold"><PlusIcon className="w-5 h-5"/> Ajouter une adresse</button>
                                    )}
                                    {isAddingAddress && <AddressForm onSave={handleSaveAddress} onCancel={() => setIsAddingAddress(false)} />}
                                </div>
                            ) : (
                                <select onChange={e => setSelectedPickupPointId(e.target.value)} value={selectedPickupPointId} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                    {allPickupPoints.map(p => <option key={p.id} value={p.id}>{p.name} - {p.neighborhood}, {p.city}</option>)}
                                </select>
                            )}
                        </div>
                    </div>
                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-24">
                           <h2 className="text-xl font-bold border-b dark:border-gray-700 pb-4 mb-4 dark:text-white">Résumé de la commande</h2>
                           <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                               {cart.map(item => (
                                   <div key={item.id + JSON.stringify(item.selectedVariant)} className="flex items-center gap-3 text-sm">
                                       <img src={item.imageUrls[0]} alt={item.name} className="w-12 h-12 rounded-md object-cover"/>
                                       <div className="flex-grow">
                                           <p className="font-semibold line-clamp-1">{item.name}</p>
                                           <p className="text-xs text-gray-500">x {item.quantity}</p>
                                       </div>
                                       <p className="font-semibold whitespace-nowrap">{(getFinalPrice(item, flashSales) * item.quantity).toLocaleString('fr-CM')} F</p>
                                   </div>
                               ))}
                           </div>
                           <div className="space-y-3 dark:text-gray-300 border-t dark:border-gray-700 pt-4">
                                <div className="flex justify-between"><span>Sous-total</span><span className="font-semibold dark:text-white">{subtotal.toLocaleString('fr-CM')} FCFA</span></div>
                                {appliedPromoCode && (<div className="flex justify-between text-green-600 dark:text-green-400"><span>Réduction ({appliedPromoCode.code})</span><span className="font-semibold">- {discount.toLocaleString('fr-CM')} FCFA</span></div>)}
                                <div className="flex justify-between"><span>Livraison</span><span className="font-semibold dark:text-white">{deliveryFee.toLocaleString('fr-CM')} FCFA</span></div>
                                <div className="border-t dark:border-gray-700 pt-4 mt-4 flex justify-between text-xl font-bold dark:text-white"><span>Total</span><span>{total.toLocaleString('fr-CM')} FCFA</span></div>
                           </div>
                           <button onClick={handleConfirmOrder} className="w-full mt-6 bg-kmer-red text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors">Confirmer la commande</button>
                       </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;