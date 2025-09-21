import React from 'react';
import type { Product, Store } from '../types';

interface AutoComparisonProps {
  currentProduct: Product;
  otherOffers: Product[];
  stores: Store[];
  onProductClick: (product: Product) => void;
}

const AutoComparison: React.FC<AutoComparisonProps> = ({ currentProduct, otherOffers, stores, onProductClick }) => {
    const allItems = [currentProduct, ...otherOffers];
    return (
        <div className="mt-16 bg-gray-100 dark:bg-gray-800/50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Comparer les offres</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Ce produit est disponible chez plusieurs vendeurs. Comparez les options ci-dessous.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allItems.map(product => {
                    const store = stores.find(s => s.name === product.vendor);
                    return (
                        <button key={product.id} onClick={() => onProductClick(product)} className="p-4 border dark:border-gray-700 rounded-lg text-left hover:bg-white dark:hover:bg-gray-700 transition-colors">
                            <p className="font-bold">{product.vendor}</p>
                            <p className="text-lg text-kmer-green font-semibold">{product.price.toLocaleString('fr-CM')} FCFA</p>
                            <p className="text-sm">Vendu depuis: {store?.location}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default AutoComparison;
