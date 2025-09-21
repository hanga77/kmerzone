import React, { useState, useMemo } from 'react';
import type { Store } from '../types';
import StoreCard from './StoreCard';
import { ArrowLeftIcon, MapPinIcon, FilterIcon, XIcon, ArrowPathIcon } from './Icons';

interface StoresPageProps {
  stores: Store[];
  onBack: () => void;
  onVisitStore: (storeName: string) => void;
  onNavigateToStoresMap: () => void;
}

const StoresPage: React.FC<StoresPageProps> = ({ stores, onBack, onVisitStore, onNavigateToStoresMap }) => {
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    category: '',
    premium: false,
  });
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const availableCities = useMemo(() => [...new Set(stores.map(s => s.location))], [stores]);
  const storeCategories = useMemo(() => [...new Set(stores.map(s => s.category))], [stores]);

  const filteredStores = useMemo(() => {
    const filtered = stores.filter(store => {
      const searchMatch = store.name.toLowerCase().includes(filters.search.toLowerCase());
      const cityMatch = !filters.city || store.location === filters.city;
      const categoryMatch = !filters.category || store.category === filters.category;
      const premiumMatch = !filters.premium || store.premiumStatus === 'premium';
      return searchMatch && cityMatch && categoryMatch && premiumMatch;
    });

    // Sort premium stores to the top
    return filtered.sort((a, b) => {
        if (a.premiumStatus === 'premium' && b.premiumStatus !== 'premium') return -1;
        if (a.premiumStatus !== 'premium' && b.premiumStatus === 'premium') return 1;
        return a.name.localeCompare(b.name); // Secondary sort by name
    });
  }, [stores, filters]);

  const resetFilters = () => {
    setFilters({ search: '', city: '', category: '', premium: false });
  };
  
  const FilterPanel = () => (
    <aside className="w-full lg:w-72 lg:flex-shrink-0">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm space-y-6">
            <div>
                <label className="font-semibold block mb-2">Rechercher par nom</label>
                <input
                    type="text"
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                    placeholder="Nom de la boutique..."
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
            </div>
            <div>
                <label className="font-semibold block mb-2">Filtrer par ville</label>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setFilters(f => ({ ...f, city: '' }))} className={`px-3 py-1 rounded-full text-sm ${!filters.city ? 'bg-kmer-green text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Toutes</button>
                    {availableCities.map(city => (
                        <button key={city} onClick={() => setFilters(f => ({ ...f, city }))} className={`px-3 py-1 rounded-full text-sm ${filters.city === city ? 'bg-kmer-green text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{city}</button>
                    ))}
                </div>
            </div>
            <div>
                <label className="font-semibold block mb-2">Filtrer par catégorie</label>
                <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="">Toutes les catégories</option>
                    {storeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={filters.premium} onChange={e => setFilters(f => ({...f, premium: e.target.checked}))} className="h-4 w-4 rounded text-kmer-yellow focus:ring-kmer-yellow" />
                    <span>Boutiques Premium seulement</span>
                </label>
            </div>
            <button onClick={resetFilters} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-kmer-red">
                <ArrowPathIcon className="w-4 h-4"/>
                Effacer les filtres
            </button>
        </div>
    </aside>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour à l'accueil
      </button>

      <div className="lg:flex lg:gap-8">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-6">
            <button onClick={() => setIsMobileFiltersOpen(true)} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md font-semibold">
                <FilterIcon className="w-5 h-5"/>
                Filtrer les boutiques
            </button>
        </div>
        
        {/* Mobile Filter Modal */}
        {isMobileFiltersOpen && (
            <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileFiltersOpen(false)}>
                <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-gray-50 dark:bg-gray-800 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                        <h2 className="font-bold text-lg dark:text-white">Filtres</h2>
                        <button onClick={() => setIsMobileFiltersOpen(false)}><XIcon className="w-6 h-6"/></button>
                    </div>
                    <FilterPanel />
                </div>
            </div>
        )}

        {/* Desktop Filter Panel */}
        <div className="hidden lg:block">
            <FilterPanel />
        </div>

        <main className="flex-grow">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Nos boutiques partenaires</h1>
                    <p className="text-gray-500">{filteredStores.length} boutique(s) trouvée(s)</p>
                </div>
                <button onClick={onNavigateToStoresMap} className="flex-shrink-0 flex items-center gap-2 bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                    <MapPinIcon className="w-5 h-5"/>
                    Voir sur la carte
                </button>
            </div>
            
            {filteredStores.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {filteredStores.map(store => <StoreCard key={store.id} store={store} onVisitStore={onVisitStore} />)}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-2">Aucune boutique trouvée</h2>
                    <p className="text-gray-600">Essayez de modifier vos filtres.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default StoresPage;
