import { useState, useMemo, useCallback } from 'react';
import type { Product, ProductFiltersState } from '../types';

const getRating = (product: Product) => {
    if (!product.reviews || product.reviews.length === 0) return 0;
    return product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;
};

const getPrice = (product: Product) => {
    // This should also account for active flash sales, but we'll keep it simple in the hook
    // The flash sale price is primarily a display concern handled by cards/detail pages.
    // For filtering, using the base/promo price is more consistent.
    if (product.promotionPrice) {
        const now = new Date();
        const startDate = product.promotionStartDate ? new Date(product.promotionStartDate + 'T00:00:00') : null;
        const endDate = product.promotionEndDate ? new Date(product.promotionEndDate + 'T23:59:59') : null;
        const isPromoActive = 
            (startDate && endDate && now >= startDate && now <= endDate) ||
            (startDate && !endDate && now >= startDate) ||
            (!startDate && endDate && now <= endDate) ||
            (!startDate && !endDate); // Price defined but no date range means it's active

        if (isPromoActive) return product.promotionPrice;
    }
    return product.price;
};

export const useProductFiltering = (initialProducts: Product[]) => {
  const [filters, setFilters] = useState<ProductFiltersState>({
    sort: 'relevance',
    vendors: [],
    minRating: 0,
    priceMin: undefined,
    priceMax: undefined,
    key: 0,
  });

  const filteredAndSortedProducts = useMemo(() => {
    let items = [...initialProducts];

    // Filter by price
    if (filters.priceMin !== undefined && filters.priceMin > 0) {
      items = items.filter(p => getPrice(p) >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined && filters.priceMax > 0) {
      items = items.filter(p => getPrice(p) <= filters.priceMax!);
    }

    // Filter by vendors
    if (filters.vendors.length > 0) {
      items = items.filter(p => filters.vendors.includes(p.vendor));
    }

    // Filter by rating
    if (filters.minRating > 0) {
      items = items.filter(p => getRating(p) >= filters.minRating);
    }

    // Sort
    switch (filters.sort) {
      case 'price-asc':
        items.sort((a, b) => getPrice(a) - getPrice(b));
        break;
      case 'price-desc':
        items.sort((a, b) => getPrice(b) - getPrice(a));
        break;
      case 'rating-desc':
        items.sort((a, b) => getRating(b) - getRating(a));
        break;
      case 'newest-desc':
        items.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      case 'relevance':
      default:
        // No default sorting, keep original order from props
        break;
    }
    
    return items;
  }, [initialProducts, filters]);
  
  const resetFilters = useCallback(() => {
    setFilters(prev => ({
        sort: 'relevance',
        vendors: [],
        minRating: 0,
        priceMin: undefined,
        priceMax: undefined,
        key: (prev.key || 0) + 1
    }));
  }, []);

  return { filteredAndSortedProducts, filters, setFilters, resetFilters };
};