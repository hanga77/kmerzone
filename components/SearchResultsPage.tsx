import React, { useMemo } from 'react';
import type { Product, Store, FlashSale } from '../types';
import ProductCard from './ProductCard';
import { ArrowLeftIcon, SearchIcon } from './Icons';
import { useProductFiltering } from '../hooks/useProductFiltering';
import ProductFilters from './ProductFilters';

interface SearchResultsPageProps {
  searchQuery: string;
  products: Product[];
  stores: Store[];
  flashSales: FlashSale[];
  onProductClick: (product: Product) => void;
  onBack: () => void;
  onVendorClick: (vendorName: string) => void;
  isComparisonEnabled: boolean;
}

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ searchQuery, products, stores, flashSales, onProductClick, onBack, onVendorClick, isComparisonEnabled }) => {
  const searchedProducts = useMemo(() => {
    if (!searchQuery) return [];
    const lowerCaseQuery = searchQuery.toLowerCase();
    // A simple search across multiple fields.
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerCaseQuery) ||
      p.description.toLowerCase().includes(lowerCaseQuery) ||
      p.vendor.toLowerCase().includes(lowerCaseQuery) ||
      p.brand?.toLowerCase().includes(lowerCaseQuery)
    );
  }, [products, searchQuery]);
  
  const { filteredAndSortedProducts, filters, setFilters, resetFilters } = useProductFiltering(searchedProducts);

  const findStoreLocation = (vendorName: string) => stores.find(s => s.name === vendorName)?.location;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour
      </button>

      <div className="lg:flex lg:gap-8">
        <ProductFilters
          allProducts={searchedProducts}
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
        />
        <main className="flex-grow">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Résultats pour: <span className="text-kmer-green">"{searchQuery}"</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {filteredAndSortedProducts.length} sur {searchedProducts.length} produits affichés
            </p>
          </div>
          
          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map(product => (
                <ProductCard key={product.id} product={product} onProductClick={onProductClick} onVendorClick={onVendorClick} location={findStoreLocation(product.vendor)} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col justify-center items-center">
                <SearchIcon className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2 dark:text-white">Aucun produit trouvé.</h2>
                <p className="text-gray-600 dark:text-gray-400">Nous n'avons trouvé aucun résultat pour votre recherche.</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Essayez d'utiliser des mots-clés plus généraux.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResultsPage;