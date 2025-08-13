import React, { useState, useMemo, useEffect } from 'react';
import type { Product, ProductFiltersState, ProductSortOption } from '../types';
import { StarIcon, ArrowPathIcon, FilterIcon, XIcon, ChevronDownIcon } from './Icons';

interface ProductFiltersProps {
  allProducts: Product[];
  filters: ProductFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<ProductFiltersState>>;
  resetFilters: () => void;
}

const getPrice = (product: Product) => product.promotionPrice ?? product.price;

const SortOptions: Record<ProductSortOption, string> = {
    'relevance': 'Pertinence',
    'price-asc': 'Prix : Croissant',
    'price-desc': 'Prix : Décroissant',
    'rating-desc': 'Mieux notés',
    'newest-desc': 'Plus récents',
};

const ProductFilters: React.FC<ProductFiltersProps> = ({ allProducts, filters, setFilters, resetFilters }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<ProductFiltersState>(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const availableVendors = useMemo(() => {
        return [...new Set(allProducts.map(p => p.vendor))].sort();
    }, [allProducts]);
    
    const priceRange = useMemo(() => {
        if (allProducts.length === 0) return { min: 0, max: 100000 };
        const prices = allProducts.map(getPrice);
        return {
            min: Math.floor(Math.min(...prices) / 1000) * 1000,
            max: Math.ceil(Math.max(...prices) / 1000) * 1000
        };
    }, [allProducts]);

    const handleApplyFilters = () => {
        setFilters(localFilters);
        setIsFilterOpen(false);
    };
    
    const handleResetAndApply = () => {
        resetFilters();
        setIsFilterOpen(false);
    };
    
    const handleVendorChange = (vendor: string) => {
        setLocalFilters(prev => ({
            ...prev,
            vendors: prev.vendors.includes(vendor)
                ? prev.vendors.filter(v => v !== vendor)
                : [...prev.vendors, vendor]
        }));
    };

    const filterContent = (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="font-semibold mb-2 dark:text-gray-200">Prix (FCFA)</h3>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        placeholder={`Min (${priceRange.min})`}
                        value={localFilters.priceMin || ''}
                        onChange={e => setLocalFilters(f => ({ ...f, priceMin: e.target.value ? parseInt(e.target.value) : undefined }))}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
                    />
                    <span>-</span>
                     <input
                        type="number"
                        placeholder={`Max (${priceRange.max})`}
                        value={localFilters.priceMax || ''}
                        onChange={e => setLocalFilters(f => ({ ...f, priceMax: e.target.value ? parseInt(e.target.value) : undefined }))}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
                    />
                </div>
            </div>
             <div>
                <h3 className="font-semibold mb-2 dark:text-gray-200">Boutiques</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                    {availableVendors.map(vendor => (
                        <label key={vendor} className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={localFilters.vendors.includes(vendor)}
                                onChange={() => handleVendorChange(vendor)}
                                className="h-4 w-4 rounded border-gray-300 text-kmer-green focus:ring-kmer-green"
                            />
                            <span className="dark:text-gray-300">{vendor}</span>
                        </label>
                    ))}
                </div>
            </div>
             <div>
                <h3 className="font-semibold mb-2 dark:text-gray-200">Note minimale</h3>
                <div className="flex justify-around">
                    {[4, 3, 2, 1].map(rating => (
                        <button key={rating} onClick={() => setLocalFilters(f => ({ ...f, minRating: rating }))}
                            className={`flex items-center gap-1 p-2 rounded-md transition-colors ${localFilters.minRating === rating ? 'bg-kmer-yellow/20 text-kmer-yellow' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <StarIcon className="w-4 h-4 text-kmer-yellow" />
                            <span className="text-sm font-semibold">{rating}+</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t dark:border-gray-600">
                <button onClick={handleApplyFilters} className="w-full bg-kmer-green text-white font-bold py-2 rounded-lg">Appliquer</button>
                <button onClick={handleResetAndApply} className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-600 font-semibold py-2 rounded-lg">
                    <ArrowPathIcon className="w-4 h-4" /> Réinitialiser
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Button & Sort Dropdown */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
                <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 text-kmer-green font-bold p-2 rounded-md bg-kmer-green/10">
                    <FilterIcon className="w-5 h-5"/> Filtres
                </button>
                <select 
                    value={filters.sort}
                    onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value as ProductSortOption }))}
                    className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm font-semibold"
                >
                   {Object.entries(SortOptions).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                    ))}
                </select>
            </div>
            
            {/* Modal for mobile */}
            {isFilterOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsFilterOpen(false)}>
                    <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white dark:bg-gray-800 shadow-xl" onClick={e => e.stopPropagation()}>
                       <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                         <h2 className="font-bold text-lg dark:text-white">Filtres</h2>
                         <button onClick={() => setIsFilterOpen(false)}><XIcon className="w-6 h-6"/></button>
                       </div>
                        {filterContent}
                    </div>
                </div>
            )}

            {/* Sidebar for desktop */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm sticky top-28">
                     <div className="p-4 border-b dark:border-gray-700">
                         <label htmlFor="sort-desktop" className="text-sm font-medium dark:text-gray-400">Trier par</label>
                         <select 
                            id="sort-desktop"
                            value={filters.sort}
                            onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value as ProductSortOption }))}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 font-semibold focus:ring-1 focus:ring-kmer-green"
                        >
                           {Object.entries(SortOptions).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                     </div>
                    {filterContent}
                </div>
            </aside>
        </>
    );
};

export default ProductFilters;
