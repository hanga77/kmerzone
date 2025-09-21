import React from 'react';
import type { Product, Store, FlashSale } from '../types';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from './ProductCard';
import { ArrowLeftIcon, HeartIcon } from './Icons';

interface WishlistPageProps {
  allProducts: Product[];
  allStores: Store[];
  flashSales: FlashSale[];
  onProductClick: (product: Product) => void;
  onBack: () => void;
  onVendorClick: (vendorName: string) => void;
  isComparisonEnabled: boolean;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ allProducts, allStores, flashSales, onProductClick, onBack, onVendorClick, isComparisonEnabled }) => {
  const { wishlist } = useWishlist();
  const wishlistedProducts = allProducts.filter(p => wishlist.includes(p.id));
  const findStoreLocation = (vendorName: string) => allStores.find(s => s.name === vendorName)?.location;

  return (
    <div className="container mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-kmer-green font-semibold mb-8">
        <ArrowLeftIcon className="w-5 h-5" />
        Retour à l'accueil
      </button>
      <div className="flex items-center justify-center gap-3 mb-10">
        <HeartIcon className="w-8 h-8 text-kmer-red" filled={true} />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Mes Favoris</h1>
      </div>
      
      {wishlistedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {wishlistedProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onProductClick={onProductClick} 
              onVendorClick={onVendorClick} 
              location={findStoreLocation(product.vendor)} 
              flashSales={flashSales} 
              isComparisonEnabled={isComparisonEnabled}
              stores={allStores}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-2 dark:text-white">Votre liste de favoris est vide.</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Cliquez sur le cœur d'un produit pour l'ajouter ici !</p>
             <button onClick={onBack} className="bg-kmer-green text-white font-bold py-3 px-8 rounded-full hover:bg-green-700 transition-colors">
                Découvrir des produits
            </button>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
