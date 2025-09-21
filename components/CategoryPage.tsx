import React, { useMemo } from 'react';
import type { Product, Store, FlashSale, Category } from '../types';
import ProductCard from './ProductCard';
import { ArrowLeftIcon } from './Icons';
import { useProductFiltering } from '../hooks/useProductFiltering';
import ProductFilters from './ProductFilters';

interface CategoryPageProps {
  categoryId: string;
  allCategories: Category[];
  allProducts: Product[];
  allStores: Store[];
  flashSales: FlashSale[];
  onProductClick: (product: Product) => void;
  onBack: () => void;
  onVendorClick: (vendorName: string) => void;
  isComparisonEnabled: boolean;
}

const CategoryPage: React.FC<CategoryPageProps> = ({ categoryId, allCategories, allProducts, allStores, flashSales, onProductClick, onBack, onVendorClick, isComparisonEnabled }) => {
  const { selectedCategory, productsInCategory } = useMemo(() => {
    const selectedCat = allCategories.find(c => c.id === categoryId);
    if (!selectedCat) {
      return { selectedCategory: null, productsInCategory: [] };
    }
    
    let categoryIdsToFilter: string[];

    // If it's a main category (no parentId), get all its sub-category IDs
    if (!selectedCat.parentId) {
      const subCategoryIds = allCategories
        .filter(c => c.parentId === selectedCat.id)
        .map(c => c.id);
      categoryIdsToFilter = [selectedCat.id, ...subCategoryIds];
    } else {
      // It's a sub-category, just use its own ID
      categoryIdsToFilter = [selectedCat.id];
    }

    const filteredProducts = allProducts.filter(p => categoryIdsToFilter.includes(p.categoryId));
    return { selectedCategory: selectedCat, productsInCategory: filteredProducts };
  }, [allProducts, categoryId, allCategories]);
  
  const { filteredAndSortedProducts, filters, setFilters, resetFilters } = useProductFiltering(productsInCategory, allStores);

  const findStoreLocation = (vendorName: string) => allStores.find(s => s.name === vendorName)?.location;
  
  if (!selectedCategory) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-12 text-center">
        <p>Catégorie non trouvée.</p>
        <button onClick={onBack} className="mt-4 text-kmer-green font-semibold">Retour</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour à l'accueil
      </button>

      <div className="lg:flex lg:gap-8">
        <ProductFilters
          allProducts={productsInCategory}
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
        />
        <main className="flex-grow">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Catégorie: <span className="text-kmer-green">{selectedCategory.name}</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {filteredAndSortedProducts.length} sur {productsInCategory.length} produits affichés
            </p>
          </div>
          
          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map(product => (
                <ProductCard key={product.id} product={product} onProductClick={onProductClick} onVendorClick={onVendorClick} location={findStoreLocation(product.vendor)} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} stores={allStores} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col justify-center">
                <h2 className="text-2xl font-semibold mb-2 dark:text-white">Aucun produit ne correspond à vos filtres.</h2>
                <p className="text-gray-600 dark:text-gray-400">Essayez d'élargir votre recherche.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CategoryPage;
