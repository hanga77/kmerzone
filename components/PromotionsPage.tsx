import React, { useMemo } from 'react';
import type { Product, Store, FlashSale } from '../types';
import ProductCard from './ProductCard';
import { ArrowLeftIcon, TagIcon } from './Icons';
import { useProductFiltering } from '../hooks/useProductFiltering';
import ProductFilters from './ProductFilters';

interface PromotionsPageProps {
  allProducts: Product[];
  allStores: Store[];
  flashSales: FlashSale[];
  onProductClick: (product: Product) => void;
  onBack: () => void;
  onVendorClick: (vendorName: string) => void;
  isComparisonEnabled: boolean;
}

const isPromotionActive = (product: Product): boolean => {
  if (!product.promotionPrice || product.promotionPrice >= product.price) {
    return false;
  }
  const now = new Date();
  const startDate = product.promotionStartDate ? new Date(product.promotionStartDate + 'T00:00:00') : null;
  const endDate = product.promotionEndDate ? new Date(product.promotionEndDate + 'T23:59:59') : null;

  if (!startDate && !endDate) {
    // If a promo price is set but no dates, we consider it active.
    return true; 
  }

  if (startDate && endDate) {
    return now >= startDate && now <= endDate;
  }
  if (startDate) {
    return now >= startDate;
  }
  if (endDate) {
    return now <= endDate;
  }
  
  return false; 
};


const PromotionsPage: React.FC<PromotionsPageProps> = ({ allProducts, allStores, flashSales, onProductClick, onBack, onVendorClick, isComparisonEnabled }) => {
  const promotionalProducts = useMemo(() => allProducts.filter(p => isPromotionActive(p)), [allProducts]);
  const { filteredAndSortedProducts, filters, setFilters, resetFilters } = useProductFiltering(promotionalProducts);
  const findStoreLocation = (vendorName: string) => allStores.find(s => s.name === vendorName)?.location;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour à l'accueil
      </button>

      <div className="lg:flex lg:gap-8">
        <ProductFilters
          allProducts={promotionalProducts}
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
        />
        <main className="flex-grow">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
                <TagIcon className="w-8 h-8 text-kmer-red" />
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Promotions du Moment</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
                {filteredAndSortedProducts.length} sur {promotionalProducts.length} produits affichés
            </p>
          </div>
          
          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map(product => (
                <ProductCard key={product.id} product={product} onProductClick={onProductClick} onVendorClick={onVendorClick} location={findStoreLocation(product.vendor)} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />
              ))}
            </div>
          ) : (
             <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col justify-center">
                <h2 className="text-2xl font-semibold mb-2 dark:text-white">Aucune promotion pour le moment.</h2>
                <p className="text-gray-600 dark:text-gray-400">Revenez bientôt pour découvrir nos offres !</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PromotionsPage;