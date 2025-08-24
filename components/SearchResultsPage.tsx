import React, { useMemo } from 'react';
import type { Product, Store, FlashSale, Category } from '../types';
import ProductCard from './ProductCard';
import { ArrowLeftIcon } from './Icons';
import { useProductFiltering } from '../hooks/useProductFiltering';
import ProductFilters from './ProductFilters';

interface SearchResultsPageProps {
  searchQuery: string;
  allProducts: Product[];
  allStores: Store[];
  allCategories: Category[];
  flashSales: FlashSale[];
  onProductClick: (product: Product) => void;
  onBack: () => void;
  onVendorClick: (vendorName: string) => void;
  isComparisonEnabled: boolean;
}

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ searchQuery, allProducts, allStores, allCategories, flashSales, onProductClick, onBack, onVendorClick, isComparisonEnabled }) => {
  const findStoreLocation = (vendorName: string) => allStores.find(s => s.name === vendorName)?.location;

  const initialFilteredProducts = useMemo(() => {
    if (!searchQuery) return [];
    const lowercasedQuery = searchQuery.toLowerCase();
    return allProducts.filter(p => {
        const category = allCategories.find(c => c.id === p.categoryId);
        return p.name.toLowerCase().includes(lowercasedQuery) ||
               p.description.toLowerCase().includes(lowercasedQuery) ||
               (category && category.name.toLowerCase().includes(lowercasedQuery)) ||
               p.vendor.toLowerCase().includes(lowercasedQuery)
    });
  }, [searchQuery, allProducts, allCategories]);

  const { filteredAndSortedProducts, filters, setFilters, resetFilters } = useProductFiltering(initialFilteredProducts);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour à l'accueil
      </button>
      
      <div className="lg:flex lg:gap-8">
        <ProductFilters
          allProducts={initialFilteredProducts}
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
        />
        <main className="flex-grow">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Résultats pour: <span className="text-kmer-green">"{searchQuery}"</span></h1>
            <p className="text-gray-600 dark:text-gray-300">{filteredAndSortedProducts.length} sur {initialFilteredProducts.length} produits affichés</p>
          </div>
          
          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map(product => <ProductCard key={product.id} product={product} onProductClick={onProductClick} onVendorClick={onVendorClick} location={findStoreLocation(product.vendor)} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />)}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col justify-center">
                <h2 className="text-2xl font-semibold mb-2 dark:text-white">Aucun produit ne correspond à votre recherche.</h2>
                <p className="text-gray-600 dark:text-gray-400">Essayez avec d'autres mots-clés ou modifiez vos filtres.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResultsPage;