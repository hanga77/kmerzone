import React, { useState, useEffect, useRef } from 'react';
import type { Product, Category, Store, FlashSale, Advertisement } from '../types';
import CategoryCard from './CategoryCard';
import ProductCard from './ProductCard';
import StoreCard from './StoreCard';
import { ShoppingBagIcon, SparklesIcon, TruckIcon, CreditCardIcon, ChatBubbleBottomCenterTextIcon, TagIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface HomePageProps {
    categories: Category[];
    products: Product[];
    stores: Store[];
    flashSales: FlashSale[];
    advertisements: Advertisement[];
    onProductClick: (product: Product) => void;
    onCategoryClick: (categoryName: string) => void;
    onVendorClick: (vendorName: string) => void;
    onVisitStore: (storeName: string) => void;
    onViewStories: (store: Store) => void;
    isComparisonEnabled: boolean;
    isStoriesEnabled: boolean;
}

const StoryCarousel: React.FC<{ stores: Store[], onViewStories: (store: Store) => void }> = ({ stores, onViewStories }) => {
    const storesWithStories = stores.filter(store => {
        if (!store.stories || store.stories.length === 0) return false;
        // Show stories from the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return store.stories.some(story => new Date(story.createdAt) > twentyFourHoursAgo);
    });

    if (storesWithStories.length === 0) return null;

    return (
        <div className="py-8">
            <div className="container mx-auto px-6">
                <h2 className="text-2xl font-bold mb-4 dark:text-white">Stories des Boutiques</h2>
                <div className="flex space-x-4 overflow-x-auto pb-4">
                    {storesWithStories.map(store => (
                        <div key={store.id} className="flex-shrink-0 text-center">
                            <button onClick={() => onViewStories(store)} className="w-20 h-20 p-1 rounded-full border-2 border-kmer-red hover:border-kmer-yellow transition-colors">
                                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain rounded-full bg-white" />
                            </button>
                            <p className="text-xs mt-2 font-semibold truncate w-20">{store.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const AdCarousel: React.FC<{ advertisements: Advertisement[] }> = ({ advertisements }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(
            () => setCurrentIndex((prevIndex) => (prevIndex === advertisements.length - 1 ? 0 : prevIndex + 1)),
            5000 // Change slide every 5 seconds
        );
        return () => {
            resetTimeout();
        };
    }, [currentIndex, advertisements.length]);

    const prevSlide = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? advertisements.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const nextSlide = () => {
        const isLastSlide = currentIndex === advertisements.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    const goToSlide = (slideIndex: number) => {
        setCurrentIndex(slideIndex);
    };
    
    if (advertisements.length === 0) return null;

    return (
        <div className="relative w-full h-48 sm:h-64 rounded-lg shadow-lg group">
            <div className="w-full h-full rounded-lg overflow-hidden">
                <div
                    className="flex transition-transform ease-in-out duration-700 h-full"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {advertisements.map((ad) => (
                        <a key={ad.id} href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-full h-full">
                            <img src={ad.imageUrl} alt="Publicité" className="w-full h-full object-cover" />
                        </a>
                    ))}
                </div>
            </div>
            {/* Left Arrow */}
            <div onClick={prevSlide} className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 left-5 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer">
                <ChevronLeftIcon className="w-6 h-6" />
            </div>
            {/* Right Arrow */}
            <div onClick={nextSlide} className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 right-5 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer">
                <ChevronRightIcon className="w-6 h-6" />
            </div>
            {/* Dots */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex justify-center py-2 space-x-2">
                {advertisements.map((_, slideIndex) => (
                    <div
                        key={slideIndex}
                        onClick={() => goToSlide(slideIndex)}
                        className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${
                            currentIndex === slideIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                    ></div>
                ))}
            </div>
        </div>
    );
};


const HomePage: React.FC<HomePageProps> = ({ categories, products, stores, flashSales, advertisements, onProductClick, onCategoryClick, onVendorClick, onVisitStore, onViewStories, isComparisonEnabled, isStoriesEnabled }) => {
    
    const popularProductsRef = React.useRef<HTMLDivElement>(null);
    const findStoreLocation = (vendorName: string) => stores.find(s => s.name === vendorName)?.location;

    const handleScrollToProducts = () => {
        popularProductsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    return (
        <>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-kmer-green to-green-900 text-white h-[60vh] flex items-center justify-center">
              <div className="absolute inset-0">
                <img src="https://picsum.photos/seed/market/1600/900" alt="Marché camerounais" className="w-full h-full object-cover opacity-20"/>
              </div>
              <div className="relative z-10 text-center p-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>Le meilleur du Cameroun, livré chez vous.</h1>
                <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">La plus grande sélection de produits locaux et internationaux, à portée de clic.</p>
                <button onClick={handleScrollToProducts} className="bg-kmer-yellow text-gray-900 font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-300 transition-transform transform hover:scale-105">
                  Commencer mes achats
                </button>
              </div>
            </section>
            
            {/* Advertisements Section */}
            {advertisements.length > 0 && (
                <section className="py-8 bg-gray-100 dark:bg-gray-800/50">
                    <div className="container mx-auto px-6">
                        <AdCarousel advertisements={advertisements} />
                    </div>
                </section>
            )}

            {isStoriesEnabled && <StoryCarousel stores={stores} onViewStories={onViewStories} />}

             {/* Promotions Section */}
            <section className="py-16 bg-white dark:bg-gray-800/30">
              <div className="container mx-auto px-6">
                <div className="flex justify-center items-center gap-4 mb-10">
                    <TagIcon className="w-8 h-8 text-kmer-red"/>
                    <h2 className="text-3xl font-bold text-center dark:text-white">Promotions du moment</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {products.filter(p => p.promotionPrice).slice(0, 4).map(product => <ProductCard key={product.id} product={product} onProductClick={onProductClick} onVendorClick={onVendorClick} location={findStoreLocation(product.vendor)} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />)}
                </div>
              </div>
            </section>

            {/* Categories Section */}
            <section className="py-16 bg-gray-50 dark:bg-gray-900">
              <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold text-center mb-10 dark:text-white">Parcourir par catégorie</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {categories.map(cat => <CategoryCard key={cat.id} category={cat} onClick={onCategoryClick} />)}
                </div>
              </div>
            </section>

            {/* Featured Products Section */}
            <section ref={popularProductsRef} className="py-16 bg-white dark:bg-gray-800/30">
              <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold text-center mb-10 dark:text-white">Nos produits populaires</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {products.slice(0, 4).map(product => <ProductCard key={product.id} product={product} onProductClick={onProductClick} onVendorClick={onVendorClick} location={findStoreLocation(product.vendor)} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />)}
                </div>
              </div>
            </section>
            
            {/* Made in Cameroon Section */}
            <section className="py-16 bg-kmer-green/10 dark:bg-kmer-green/20">
              <div className="container mx-auto px-6">
                 <div className="flex justify-center items-center gap-4 mb-10">
                    <SparklesIcon className="w-10 h-10 text-kmer-green"/>
                    <h2 className="text-3xl font-bold text-center dark:text-white">Fierté Locale: Soutenez le "Made in Cameroon"</h2>
                </div>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">Découvrez des produits authentiques, fabriqués avec passion par nos artisans et producteurs locaux. Chaque achat est un soutien à notre économie.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {products.filter(p => p.category === 'Chimie domestique et hygiène').slice(0,4).map(product => <ProductCard key={product.id} product={product} onProductClick={onProductClick} onVendorClick={onVendorClick} location={findStoreLocation(product.vendor)} flashSales={flashSales} isComparisonEnabled={isComparisonEnabled} />)}
                </div>
              </div>
            </section>
            
            {/* How It Works Section */}
            <section className="py-20 bg-white dark:bg-gray-800/30">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-12 dark:text-white">Simple, Rapide et Fiable</h2>
                    <div className="grid md:grid-cols-4 gap-10">
                        <div className="flex flex-col items-center">
                            <div className="bg-kmer-yellow/20 p-5 rounded-full mb-4">
                                <ShoppingBagIcon className="h-12 w-12 text-kmer-yellow" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 dark:text-gray-200">1. Commandez</h3>
                            <p className="text-gray-600 dark:text-gray-400">Choisissez parmi des milliers de produits et ajoutez-les à votre panier.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-kmer-red/20 p-5 rounded-full mb-4">
                                <CreditCardIcon className="h-12 w-12 text-kmer-red" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 dark:text-gray-200">2. Payez en sécurité</h3>
                            <p className="text-gray-600 dark:text-gray-400">Utilisez Orange Money ou MTN Mobile Money pour un paiement 100% sécurisé.</p>
                        </div>
                         <div className="flex flex-col items-center">
                            <div className="bg-kmer-green/20 p-5 rounded-full mb-4">
                               <TruckIcon className="h-12 w-12 text-kmer-green" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 dark:text-gray-200">3. Suivez votre livraison</h3>
                            <p className="text-gray-600 dark:text-gray-400">Suivez votre livreur en temps réel jusqu'à votre porte.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-blue-500/20 p-5 rounded-full mb-4">
                               <ChatBubbleBottomCenterTextIcon className="h-12 w-12 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 dark:text-gray-200">4. Donnez votre avis</h3>
                            <p className="text-gray-600 dark:text-gray-400">Notez les produits et les vendeurs pour aider la communauté.</p>
                        </div>
                    </div>
                </div>
            </section>


            {/* Featured Stores Section */}
            <section className="py-16 bg-gray-50 dark:bg-gray-900">
              <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold text-center mb-10 dark:text-white">Nos boutiques partenaires</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {stores.map(store => <StoreCard key={store.id} store={store} onVisitStore={onVisitStore} />)}
                </div>
              </div>
            </section>
        </>
    )
}

export default HomePage;