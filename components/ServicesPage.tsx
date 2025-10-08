import React, { useMemo } from 'react';
import type { Product, Store, FlashSale } from '../types';
import ProductCard from './ProductCard';
import { ArrowLeftIcon, SparklesIcon } from './Icons';
import { useProductFiltering } from '../hooks/useProductFiltering';
import ProductFilters from './ProductFilters';
import { useLanguage } from '../contexts/LanguageContext';

interface ServicesPageProps {
  allProducts: Product[];
  allStores: Store[];
  flashSales: FlashSale[];
  onProductClick: (product: Product) => void;
  onBack: () => void;
  onVendorClick: (vendorName: string) => void;
  isComparisonEnabled: boolean;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ allProducts, allStores, flashSales, onProductClick, onBack, onVendorClick, isComparisonEnabled }) => {
  const { t } = useLanguage();
  const serviceProducts = useMemo(() => allProducts.filter(p => p.type === 'service'), [allProducts]);
  const { filteredAndSortedProducts, filters, setFilters, resetFilters } = useProductFiltering(serviceProducts, allStores);
  const findStoreLocation = (vendorName: string) => allStores.find(s => s.name === vendorName)?.location;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        {t('common.backToHome')}
      </button>

      <div className="lg:flex lg:gap-8">
        <ProductFilters
          allProducts={serviceProducts}
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
        />
        <main className="flex-grow">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
                <SparklesIcon className="w-8 h-8 text-purple-500" />
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('servicesPage.title')}</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
                {filteredAndSortedProducts.length} sur {serviceProducts.length} services affichés
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
                <h2 className="text-2xl font-semibold mb-2 dark:text-white">{t('servicesPage.noServices')}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t('servicesPage.noServicesDescription')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ServicesPage;
