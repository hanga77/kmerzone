import React, { useEffect } from 'react';
import { useComparison } from '../contexts/ComparisonContext';
import { XCircleIcon } from './Icons';
import type { Product } from '../types';

interface ComparisonBarProps {
  onCompareClick: () => void;
}

const ComparisonBar: React.FC<ComparisonBarProps> = ({ onCompareClick }) => {
  const { comparisonList, products: allProducts, toggleComparison, clearComparison } = useComparison();
  
  if (comparisonList.length === 0) {
    return null;
  }
  
  const productsToCompare = allProducts.filter(p => comparisonList.includes(p.id));

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white shadow-lg z-30 animate-in slide-in-from-bottom-full">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-lg hidden sm:block">Comparer les produits</h3>
          <div className="flex items-center gap-2">
            {productsToCompare.map(product => (
              <div key={product.id} className="relative">
                <img src={product.imageUrls[0]} alt={product.name} className="h-12 w-12 object-cover rounded-md" />
                <button 
                  onClick={() => toggleComparison(product.id)} 
                  className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full"
                  aria-label={`Retirer ${product.name} de la comparaison`}
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={clearComparison} className="text-sm text-gray-400 hover:underline">Vider</button>
            <button 
                onClick={onCompareClick} 
                disabled={comparisonList.length < 2}
                className="bg-kmer-green font-bold py-2 px-5 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                Comparer ({comparisonList.length})
            </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;
