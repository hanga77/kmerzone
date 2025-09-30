import React, { useMemo } from 'react';
import type { Product, Store, FlashSale } from '../types';
import ProductCard from './ProductCard';
import { ArrowLeftIcon, StarIcon, CheckCircleIcon, HeartIcon } from './Icons';
import { useProductFiltering } from '../hooks/useProductFiltering';
import ProductFilters from './ProductFilters';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface VendorPageProps {
  vendorName: string;
  allProducts: Product[];
  allStores: Store[];
  flashSales: FlashSale[];
  onProductClick: (product: Product) => void;
  onBack: () => void;
  onVendorClick: (vendorName: string) => void;
  isComparisonEnabled: boolean;
}

const VendorPage: React.FC<VendorPageProps> = ({ vendorName, allProducts, allStores, flashSales, onProductClick, onBack, onVendorClick, isComparisonEnabled }) => {
  const { user, toggleFollowStore } = useAuth();
  const { t } = useLanguage();
  const productsFromVendor = useMemo(() => allProducts.filter(p => p.vendor === vendorName), [allProducts, vendorName]);
  const { filteredAndSortedProducts, filters, setFilters, resetFilters } = useProductFiltering(productsFromVendor, allStores);
  const store = allStores.find(s => s.name === vendorName);
  const isFollowing = user?.followedStores?.includes(store?.id || '');

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour
      </button>
      
      {store?.bannerUrl && (
        <div className="mb-8 rounded-lg overflow-hidden shadow-lg h-48 bg-gray-200 dark:bg-gray-800">
            <img src={store.bannerUrl} alt={`${store.name} banner`} className="w-full h-full object-cover"/>
        </div>
      )}

      {store?.premiumStatus === 'premium' && (
        <div className="mb-8 p-4 bg-kmer-yellow/10 border-l-4 border-kmer-yellow text-yellow-800 dark:text-yellow-200 rounded-r-lg">
          <div className="flex items-center gap-3">
            <StarIcon className="w-8 h-8 text-kmer-yellow" />
            <div>
              <h3 className="font-bold text-lg">Boutique Premium</h3>
              <p className="text-sm">Ce vendeur est reconnu pour sa fiabilité et la qualité de ses services.</p>
            </div>
          </div>
        </div>
      )}

      {store?.collections && store.collections.length > 0 && (
        <section className="mb-12 space-y-10">
          {store.collections.map(collection => {
            const collectionProducts = collection.productIds
              .map(id => allProducts.find(p => p.id === id))
              .filter((p): p is Product => !!p);

            if (collectionProducts.length === 0) return null;

            return (
              <div key={collection.id}>
                <h2 className="text-2xl font-bold mb-2 dark:text-white">{collection.name}</h2>
                {collection.description && <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-3xl">{collection.description}</p>}
                <div className="-mx-4 sm:-mx-6 px-4 sm:px-6">
                  <div className="flex overflow-x-auto space-x-6 pb-4">
                    {collectionProducts.map(product => (
                      <div key={product.id} className="w-72 flex-shrink-0">
                        <ProductCard 
                          product={product} 
                          onProductClick={onProductClick} 
                          onVendorClick={onVendorClick} 
                          location={store?.location} 
                          flashSales={flashSales} 
                          isComparisonEnabled={isComparisonEnabled} 
                          stores={allStores}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

       <div className="lg:flex lg:gap-8">
        <ProductFilters
          allProducts={productsFromVendor}
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
        />
        <main className="flex-grow">
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={store?.logoUrl} alt={store?.name} className="h-16 w-16 object-contain rounded-md bg-white p-1 shadow-sm"/>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          Boutique <span className="text-kmer-green">{vendorName}</span>
                      </h1>
                       {store && <p className="text-gray-500 dark:text-gray-400">{store.location}</p>}
                    </div>
                  </div>
                   {store && user && user.role === 'customer' && (
                      <button 
                          onClick={() => toggleFollowStore(store.id)}
                          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-colors w-full sm:w-auto ${isFollowing ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300' : 'bg-kmer-green text-white hover:bg-green-700'}`}
                      >
                          <HeartIcon className="w-5 h-5" filled={isFollowing}/>
                          <span>{isFollowing ? 'Suivi' : 'Suivre'}</span>
                      </button>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-4">
                    {filteredAndSortedProducts.length} sur {productsFromVendor.length} produits affichés
                </p>
            </div>
      
          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map(product => (
                <ProductCard key={product.id} product={product} onProductClick={onProductClick} onVendorClick={onVendorClick} location={store?.location} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} stores={allStores} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col justify-center">
                <h2 className="text-2xl font-semibold mb-2 dark:text-white">Aucun produit ne correspond à vos filtres.</h2>
                <p className="text-gray-600 dark:text-gray-400">Cette boutique n'a peut-être pas de produits ou vos filtres sont trop stricts.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VendorPage;