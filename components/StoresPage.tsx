import React from 'react';
import type { Store } from '../types';
import StoreCard from './StoreCard';
import { ArrowLeftIcon } from './Icons';

interface StoresPageProps {
  stores: Store[];
  onBack: () => void;
  onVisitStore: (storeName: string) => void;
}

const StoresPage: React.FC<StoresPageProps> = ({ stores, onBack, onVisitStore }) => {
  return (
    <div className="container mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour à l'accueil
      </button>
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Nos boutiques partenaires</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stores.map(store => <StoreCard key={store.id} store={store} onVisitStore={onVisitStore} />)}
      </div>
    </div>
  );
};

export default StoresPage;