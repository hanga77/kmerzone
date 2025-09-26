

import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import type { Product } from '../types';

interface ComparisonContextType {
  comparisonList: string[]; // Array of product IDs
  products: Product[];
  setProducts: (products: Product[]) => void;
  toggleComparison: (productId: string) => void;
  isInComparison: (productId: string) => boolean;
  clearComparison: () => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const toggleComparison = useCallback((productId: string) => {
    setComparisonList(prevList => {
      if (prevList.includes(productId)) {
        return prevList.filter(id => id !== productId);
      } else {
        if (prevList.length >= 4) {
          alert("Vous ne pouvez comparer que 4 produits à la fois.");
          return prevList;
        }
        return [...prevList, productId];
      }
    });
  }, []);

  const isInComparison = useCallback((productId: string) => {
    return comparisonList.includes(productId);
  }, [comparisonList]);
  
  const clearComparison = useCallback(() => {
    setComparisonList([]);
  }, []);

  const contextValue = useMemo(() => ({
      comparisonList,
      products,
      setProducts,
      toggleComparison,
      isInComparison,
      clearComparison
  }), [comparisonList, products, setProducts, toggleComparison, isInComparison, clearComparison]);

  return (
    <ComparisonContext.Provider value={contextValue}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};