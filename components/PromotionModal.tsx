
import React, { useState } from 'react';
import type { Product } from '../types';
import { XIcon, TagIcon } from './Icons';

interface PromotionModalProps {
  product: Product;
  onClose: () => void;
  onSave: (productId: string, promoPrice: number, startDate?: string, endDate?: string) => void;
}

const PromotionModal: React.FC<PromotionModalProps> = ({ product, onClose, onSave }) => {
  const [promoPrice, setPromoPrice] = useState(product.promotionPrice?.toString() || '');
  const [startDate, setStartDate] = useState(product.promotionStartDate || '');
  const [endDate, setEndDate] = useState(product.promotionEndDate || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    const priceValue = parseFloat(promoPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Veuillez saisir un prix valide.');
      return;
    }
    if (priceValue >= product.price) {
      setError('Le prix promotionnel doit être inférieur au prix original.');
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        setError('La date de début doit être antérieure à la date de fin.');
        return;
    }
    setError('');
    onSave(product.id, priceValue, startDate, endDate);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <XIcon className="h-6 w-6" />
        </button>
        
        <div className="flex items-center gap-3 text-xl font-semibold text-gray-800 dark:text-white mb-4">
          <TagIcon className="w-6 h-6 text-kmer-green" />
          Mettre en Promotion
        </div>

        <div className="border-t border-b dark:border-gray-700 py-4 my-4">
          <p className="font-semibold text-lg">{product.name}</p>
          <p className="text-gray-500 dark:text-gray-400">Prix original : <span className="font-bold">{product.price.toLocaleString('fr-CM')} FCFA</span></p>
        </div>

        <div className="space-y-4">
            <div>
                <label htmlFor="promoPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nouveau prix promotionnel (FCFA)</label>
                <input
                  type="number"
                  id="promoPrice"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Ex: 12000"
                  required
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de début (optionnel)</label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                 <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de fin (optionnel)</label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kmer-green focus:border-kmer-green dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} className="bg-kmer-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
            Enregistrer la promotion
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;
