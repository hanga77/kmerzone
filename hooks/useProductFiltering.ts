import { useState, useMemo, useEffect } from 'react';
import type { Product, ProductFiltersState, Store } from '../types';

const getActiveFlashSalePrice = (productId: string, flashSales: any[]): number | null => {
    const now = new Date();
    for (const sale of flashSales) {
        const startDate = new Date(sale.startDate);
        const endDate = new Date(sale.endDate);
        if (now >= startDate && now <= endDate) {
            const productInSale = sale.products.find((p: any) => p.productId === productId && p.status === 'approved');
            if (productInSale) return productInSale.flashPrice;
        }
    }
    return null;
}

const isPromotionActive = (product: Product): boolean => {
  if (!product.promotionPrice || product.promotionPrice >= product.price) {
    return false;
  }
  const now = new Date();
  const startDate = product.promotionStartDate ? new Date(product.promotionStartDate + 'T00:00:00') : null;
  const endDate = product.promotionEndDate ? new Date(product.promotionEndDate + 'T23:59:59') : null;

  if (!startDate && !endDate) return false;
  if (startDate && endDate) return now >= startDate && now <= endDate;
  if (startDate) return now >= startDate;
  if (endDate) return now <= endDate;
  
  return false; 
};


const getFinalPrice = (product: Product, flashSales: any[] = []) => {
    const flashPrice = getActiveFlashSalePrice(product.id, flashSales);
    if (flashPrice !== null) return flashPrice;
    if (isPromotionActive(product)) return product.promotionPrice!;
    return product.price;
};

const getAverageRating = (product: Product) => {
    const approvedReviews = product.reviews.filter(r => r.status === 'approved');
    if (approvedReviews.length === 0) return 0;
    return approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length;
};


const initialFilters: ProductFiltersState = {
  sort: 'relevance',
  priceMin: undefined,
  priceMax: undefined,
  vendors: [],
  brands: [],
  minRating: 0,
};

export const useProductFiltering = (products: Product[], allStores: Store[]) => {
  const [filters, setFilters] = useState<ProductFiltersState>(initialFilters);
  
  // Create a stable key based on the content of the products array.
  // This prevents the effect from running if the parent re-renders with a new array reference but identical content.
  const productIdsKey = useMemo(() => products.map(p => p.id).sort().join(','), [products]);

  useEffect(() => {
    // This now only runs when the actual set of products changes, breaking the infinite loop.
    setFilters(initialFilters);
  }, [productIdsKey]);

  const resetFilters = () => setFilters(initialFilters);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by price
    if (filters.priceMin !== undefined) {
      filtered = filtered.filter(p => getFinalPrice(p, []) >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      filtered = filtered.filter(p => getFinalPrice(p, []) <= filters.priceMax!);
    }

    // Filter by vendors
    if (filters.vendors.length > 0) {
      filtered = filtered.filter(p => filters.vendors.includes(p.vendor));
    }

    // Filter by brands
    if (filters.brands.length > 0) {
      filtered = filtered.filter(p => p.brand && filters.brands.includes(p.brand));
    }

    // Filter by rating
    if (filters.minRating > 0) {
      filtered = filtered.filter(p => getAverageRating(p) >= filters.minRating);
    }

    // Create a set of premium vendors for quick lookup
    const premiumVendors = new Set(allStores.filter(s => s.premiumStatus === 'premium').map(s => s.name));

    // A reusable sort function that prioritizes premium
    const premiumSort = (a: Product, b: Product): number => {
        const aIsPremium = premiumVendors.has(a.vendor);
        const bIsPremium = premiumVendors.has(b.vendor);
        if (aIsPremium && !bIsPremium) return -1;
        if (!aIsPremium && bIsPremium) return 1;
        return 0;
    };

    // Sort
    switch (filters.sort) {
      case 'price-asc':
        filtered.sort((a, b) => premiumSort(a, b) || getFinalPrice(a, []) - getFinalPrice(b, []));
        break;
      case 'price-desc':
        filtered.sort((a, b) => premiumSort(a, b) || getFinalPrice(b, []) - getFinalPrice(a, []));
        break;
      case 'rating-desc':
        filtered.sort((a, b) => premiumSort(a, b) || getAverageRating(b) - getAverageRating(a));
        break;
      case 'newest-desc':
        // Assuming newer products have higher IDs. In a real app, you'd use a creation date.
        filtered.sort((a, b) => premiumSort(a, b) || parseInt(b.id) - parseInt(a.id));
        break;
      case 'relevance':
      default:
        filtered.sort(premiumSort);
        break;
    }

    return filtered;
  }, [products, filters, allStores]);

  return {
    filteredAndSortedProducts,
    filters,
    setFilters,
    resetFilters,
  };
};
