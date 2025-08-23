import React from 'react';
import type { Product, Store } from '../types';

interface AutoComparisonProps {
  currentProduct: Product;
  otherOffers: Product[];
  stores: Store[];
  onProductClick: (product: Product) => void;
}

const AutoComparison: React.FC<AutoComparisonProps> = ({ currentProduct, otherOffers, stores, onProductClick }) => {
  const allOffers = [currentProduct, ...otherOffers];
  
  const getPrice = (p: Product) => p.promotionPrice ?? p.price;

  const bestPrice = Math.min(...allOffers.map(getPrice));

  const findStoreLogo = (vendorName: string) => {
    return stores.find(s => s.name === vendorName)?.logoUrl || 'https://picsum.photos/seed/defaultlogo/200/100';
  }

  return (
    <div className="my-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Comparer les offres pour ce produit</h3>
      <div className="space-y-3">
        {allOffers.sort((a,b) => getPrice(a) - getPrice(b)).map(offer => {
            const price = getPrice(offer);
            const isCurrent = offer.id === currentProduct.id;
            const isBestPrice = price === bestPrice;

            return (
              <div key={offer.id} className={`p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all ${isCurrent ? 'bg-kmer-green/10 border-kmer-green' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img src={findStoreLogo(offer.vendor)} alt={offer.vendor} className="w-16 h-10 object-contain flex-shrink-0" />
                    <div className="flex-grow">
                        <p className="font-semibold">{offer.vendor}</p>
                        {isBestPrice && !isCurrent && <span className="text-xs font-bold text-kmer-red">Meilleur prix</span>}
                        {isCurrent && <span className="text-xs font-bold text-kmer-green">Vous êtes ici</span>}
                    </div>
                </div>

                <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end sm:gap-4">
                  <div className="text-left sm:text-right">
                       <p className={`font-bold text-base sm:text-lg ${isBestPrice ? 'text-kmer-red' : 'text-gray-800 dark:text-white'}`}>
                          {price.toLocaleString('fr-CM')} FCFA
                       </p>
                       <p className={`text-xs ${offer.stock > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-red-500'}`}>
                           {offer.stock > 0 ? `${offer.stock} en stock` : 'Épuisé'}
                       </p>
                  </div>
                  <div className="flex-shrink-0">
                      {!isCurrent && offer.stock > 0 && (
                          <button onClick={() => onProductClick(offer)} className="bg-kmer-yellow text-sm text-gray-900 font-bold py-2 px-3 rounded-md hover:bg-yellow-300 transition-colors">
                              Voir l'offre
                          </button>
                      )}
                  </div>
                </div>
            </div>
            )
        })}
      </div>
    </div>
  );
};

export default AutoComparison;