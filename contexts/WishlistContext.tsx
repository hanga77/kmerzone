import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';

interface WishlistContextType {
  wishlist: string[]; // Array of product IDs
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = usePersistentState<string[]>('wishlist', []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist(prevWishlist =>
      prevWishlist.includes(productId)
        ? prevWishlist.filter(id => id !== productId)
        : [...prevWishlist, productId]
    );
  }, [setWishlist]);

  const isWishlisted = useCallback((productId: string) => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const contextValue = useMemo(() => ({
    wishlist,
    toggleWishlist,
    isWishlisted
  }), [wishlist, toggleWishlist, isWishlisted]);

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};