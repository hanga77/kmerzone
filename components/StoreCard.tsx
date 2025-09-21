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
      className="group relative flex flex-col items-center text-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      {store.premiumStatus === 'premium' && (
          <div className="absolute top-2 right-2 bg-kmer-yellow text-white p-1 rounded-full z-10" title="Boutique Premium">
              <StarIcon className="w-4 h-4" filled />
          </div>
      )}
      {store.status !== 'active' && (
        <div className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full z-10 ${
            store.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
        }`}>
            {store.status === 'pending' ? 'En attente' : 'Suspendu'}
        </div>
      )}
      <div className="w-24 h-24 mb-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
          <img src={store.logoUrl} alt={`${store.name} logo`} className="w-full h-full object-contain" />
      </div>
      <h3 className="font-bold text-md text-gray-800 dark:text-white group-hover:text-kmer-green">{store.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{store.category}</p>
    </button>
  );
};

export default StoreCard;