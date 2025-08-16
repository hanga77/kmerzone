import React, { useMemo } from 'react';
import type { Product, Store, FlashSale } from '../types';
import ProductCard from './ProductCard';
import { ArrowLeftIcon, StarIcon, CheckCircleIcon } from './Icons';
import { useProductFiltering } from '../hooks/useProductFiltering';
import ProductFilters from './ProductFilters';

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
  const productsFromVendor = useMemo(() => allProducts.filter(p => p.vendor === vendorName), [allProducts, vendorName]);
  const { filteredAndSortedProducts, filters, setFilters, resetFilters } = useProductFiltering(productsFromVendor);
  const store = allStores.find(s => s.name === vendorName);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour
      </button>
      
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

       <div className="lg:flex lg:gap-8">
        <ProductFilters
          allProducts={productsFromVendor}
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
        />
        <main className="flex-grow">
            <div className="mb-6">
                <div className="flex items-center gap-4">
                  <img src={store?.logoUrl} alt={store?.name} className="h-16 w-16 object-contain rounded-md bg-white p-1 shadow-sm"/>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        Boutique <span className="text-kmer-green">{vendorName}</span>
                    </h1>
                     {store && <p className="text-gray-500 dark:text-gray-400">{store.location}</p>}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {filteredAndSortedProducts.length} sur {productsFromVendor.length} produits affichés
                </p>
            </div>
      
          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map(product => (
                <ProductCard key={product.id} product={product} onProductClick={onProductClick} onVendorClick={onVendorClick} location={store?.location} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />
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