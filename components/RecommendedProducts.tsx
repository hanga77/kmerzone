import React from 'react';
import ProductCard from './ProductCard';
import type { Product, Store, FlashSale } from '../types';

interface RecommendedProductsProps {
  currentProduct: Product;
  allProducts: Product[];
  stores: Store[];
  flashSales: FlashSale[];
  onProductClick: (product: Product) => void;
  onVendorClick: (vendorName: string) => void;
  isComparisonEnabled: boolean;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({ currentProduct, allProducts, stores, flashSales, onProductClick, onVendorClick, isComparisonEnabled }) => {
  const recommended = allProducts
    .filter(p => p.categoryId === currentProduct.categoryId && p.id !== currentProduct.id)
    .slice(0, 4);

  if (recommended.length === 0) return null;

  const findStoreLocation = (vendorName: string) => stores.find(s => s.name === vendorName)?.location;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 py-16">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-10 dark:text-white">Produits similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {recommended.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onProductClick={onProductClick}
                        onVendorClick={onVendorClick}
                        location={findStoreLocation(product.vendor)}
                        flashSales={flashSales}
                        isComparisonEnabled={isComparisonEnabled}
                        stores={stores}
                    />
                ))}
            </div>
        </div>
    </div>
  );
};

export default RecommendedProducts;
