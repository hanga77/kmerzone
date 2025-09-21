import React from 'react';
import { useCart } from '../contexts/CartContext';
import type { Product, CartItem } from '../types';
import { CheckCircleIcon, XIcon } from './Icons';

interface AddToCartModalProps {
  product: CartItem;
  onClose: () => void;
  onNavigateToCart: () => void;
}

const PLACEHOLDER_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23E5E7EB'/%3E%3Cpath d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' stroke='%239CA3AF' stroke-width='1.5'/%3E%3C/svg%3E";

const AddToCartModal: React.FC<AddToCartModalProps> = ({ product, onClose, onNavigateToCart }) => {
  const { cart } = useCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.promotionPrice ?? item.price) * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const displayImage = product.imageUrls[0] || PLACEHOLDER_IMAGE_URL;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-lg w-full relative transform transition-all animate-in fade-in-0 zoom-in-95">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <XIcon className="h-6 w-6" />
        </button>
        
        <div className="flex items-center gap-3 text-lg font-semibold text-green-700 dark:text-green-300 mb-4">
          <CheckCircleIcon className="w-7 h-7" />
          Produit ajouté au panier !
        </div>

        <div className="flex gap-4 border-t border-b dark:border-gray-700 py-4">
            <img src={displayImage} alt={product.name} className="w-24 h-24 object-cover rounded-md"/>
            <div>
                <h3 className="font-semibold dark:text-white">{product.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{product.vendor}</p>
                <p className="text-kmer-green font-bold mt-1">
                    {(product.promotionPrice ?? product.price).toLocaleString('fr-CM')} FCFA
                </p>
            </div>
        </div>

        <div className="py-4 space-y-2">
            <div className="flex justify-between">
                <span className="dark:text-gray-300">Panier ({totalItems} articles)</span>
                <span className="font-semibold dark:text-white">{subtotal.toLocaleString('fr-CM')} FCFA</span>
            </div>
             <p className="text-sm text-gray-500 dark:text-gray-400">Frais de livraison calculés à l'étape suivante.</p>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button onClick={onClose} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            Continuer mes achats
          </button>
          <button onClick={onNavigateToCart} className="w-full bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
            Voir mon panier
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToCartModal;
