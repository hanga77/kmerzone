import React from 'react';
import type { Store } from '../types';
import { StarIcon } from './Icons';

interface StoreCardProps {
  store: Store;
  onVisitStore: (storeName: string) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({ store, onVisitStore }) => {
  return (
    <button 
      onClick={() => onVisitStore(store.name)} 
      className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-kmer-green focus:ring-offset-2 relative"
    >
      {store.premiumStatus === 'premium' && (
        <div className="absolute top-2 right-2 bg-kmer-yellow text-white p-1 rounded-full" title="Boutique Premium">
          <StarIcon className="w-4 h-4" />
        </div>
      )}
      <div className="w-32 h-20 mb-4 flex items-center justify-center">
        <img src={store.logoUrl} alt={`${store.name} logo`} className="max-w-full max-h-full object-contain rounded" />
      </div>
      <h3 className="text-lg font-semibold dark:text-white">{store.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow">{store.category}</p>
      <div className="mt-4 bg-kmer-green/10 text-kmer-green font-semibold py-1 px-4 rounded-full text-sm group-hover:bg-kmer-green/20 transition-colors">
        Visiter la boutique
      </div>
    </button>
  );
};

export default StoreCard;