import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Store, FlashSale } from '../types';
import ProductCard from './ProductCard';
import { ArrowLeftIcon, BoltIcon } from './Icons';
import { useProductFiltering } from '../hooks/useProductFiltering';
import ProductFilters from './ProductFilters';


interface FlashSalesPageProps {
  allProducts: Product[];
  allStores: Store[];
  flashSales: FlashSale[];
  onProductClick: (product: Product) => void;
  onBack: () => void;
  onVendorClick: (vendorName: string) => void;
  isComparisonEnabled: boolean;
}

const CountdownTimer: React.FC<{ endDate: string }> = ({ endDate }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(endDate) - +new Date();
    let timeLeft: Record<string, number> = {};
    if (difference > 0) {
      timeLeft = {
        jours: Math.floor(difference / (1000 * 60 * 60 * 24)),
        heures: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        secondes: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  return (
    <div className="flex justify-center items-center gap-4 text-center">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="bg-white dark:bg-gray-700/50 shadow-md rounded-lg p-2 min-w-[60px]">
          <div className="text-2xl font-bold text-blue-500">{String(value).padStart(2, '0')}</div>
          <div className="text-xs uppercase text-gray-500 dark:text-gray-400">{unit}</div>
        </div>
      ))}
    </div>
  );
};

const FlashSalesPage: React.FC<FlashSalesPageProps> = ({ allProducts, allStores, flashSales, onProductClick, onBack, onVendorClick, isComparisonEnabled }) => {
  const now = new Date();
  const activeSales = useMemo(() => flashSales.filter(sale => new Date(sale.startDate) <= now && new Date(sale.endDate) >= now), [flashSales, now]);
  
  const allFlashSaleProducts = useMemo(() => activeSales.flatMap(sale =>
    sale.products
      .filter(fp => fp.status === 'approved')
      .map(fp => allProducts.find(p => p.id === fp.productId))
  ).filter((p): p is Product => !!p), [activeSales, allProducts]);

  const { filteredAndSortedProducts, filters, setFilters, resetFilters } = useProductFiltering(allFlashSaleProducts);
  
  const findStoreLocation = (vendorName: string) => allStores.find(s => s.name === vendorName)?.location;
  
  const earliestEndingSale = activeSales.sort((a,b) => +new Date(a.endDate) - +new Date(b.endDate))[0];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-[80vh]">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
          <ArrowLeftIcon className="w-5 h-5" />
          Retour à l'accueil
        </button>
        <div className="text-center bg-blue-900/80 text-white border border-blue-500 rounded-xl p-8 mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
                <BoltIcon className="w-10 h-10 text-yellow-300" />
                <h1 className="text-4xl font-bold">Ventes Flash</h1>
            </div>
            {earliestEndingSale ? (
                <>
                    <p className="text-lg text-gray-300 mb-6">Ne manquez pas nos offres exclusives ! Fin de la vente <span className="font-bold text-yellow-300">{earliestEndingSale.name}</span> dans :</p>
                    <CountdownTimer endDate={earliestEndingSale.endDate} />
                </>
            ) : null}
        </div>
      
        <div className="lg:flex lg:gap-8">
          <ProductFilters
            allProducts={allFlashSaleProducts}
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
          />
          <main className="flex-grow">
            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedProducts.map(product => product && <ProductCard key={product.id} product={product} onProductClick={onProductClick} onVendorClick={onVendorClick} location={findStoreLocation(product.vendor)} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />)}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col justify-center">
                  <h2 className="text-2xl font-semibold mb-2 dark:text-white">Aucune vente flash en ce moment.</h2>
                  <p className="text-gray-400">Revenez bientôt pour des offres incroyables !</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default FlashSalesPage;