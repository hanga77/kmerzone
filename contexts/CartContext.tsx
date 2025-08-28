import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import type { Product, CartItem, VariantDetail } from '../types';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedVariant?: Record<string, string>, options?: { suppressModal?: boolean }) => void;
  removeFromCart: (productId: string, selectedVariant?: Record<string, string>) => void;
  updateQuantity: (productId: string, quantity: number, selectedVariant?: Record<string, string>) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const areVariantsEqual = (v1?: Record<string, string>, v2?: Record<string, string>): boolean => {
  if (!v1 && !v2) return true;
  if (!v1 || !v2) return false;
  const keys1 = Object.keys(v1);
  const keys2 = Object.keys(v2);
  if (keys1.length !== keys2.length) return false;
  return keys1.every(key => v1[key] === v2[key]);
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { openModal } = useUI();
  const { user } = useAuth();

  const addToCart = useCallback((product: Product, quantity: number = 1, selectedVariant?: Record<string, string>, options?: { suppressModal?: boolean }) => {
    if (user && ['superadmin', 'seller', 'delivery_agent', 'depot_agent'].includes(user.role)) {
        alert("Votre rôle ne vous autorise pas à effectuer des achats sur la plateforme.");
        return;
    }
    
    let itemAdded = false;
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id && areVariantsEqual(item.selectedVariant, selectedVariant));
      
      let stock = product.stock;
      let variantDetail: VariantDetail | undefined;
      if (product.variantDetails && selectedVariant) {
        variantDetail = product.variantDetails.find(vd => areVariantsEqual(vd.options, selectedVariant));
        stock = variantDetail?.stock ?? 0;
      }
      
      if (stock === 0) {
        alert("Ce produit ou cette variante est en rupture de stock.");
        return prevCart;
      }

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > stock) {
            alert(`Stock insuffisant. Vous ne pouvez pas commander plus de ${stock} unités de cette variante.`);
            return prevCart;
        }
        itemAdded = true;
        return prevCart.map(item =>
          (item.id === product.id && areVariantsEqual(item.selectedVariant, selectedVariant))
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        if (quantity > stock) {
            alert(`Stock insuffisant. Vous ne pouvez pas commander plus de ${stock} unités de cette variante.`);
            return prevCart;
        }
        itemAdded = true;
        const newItem: CartItem = { ...product, quantity, selectedVariant };
        if(variantDetail && variantDetail.price) {
          newItem.price = variantDetail.price;
          newItem.promotionPrice = undefined; // Variant price overrides promotion
        }
        return [...prevCart, newItem];
      }
    });

    if (itemAdded && !selectedVariant && !options?.suppressModal) {
      openModal(product);
    }
  }, [user, openModal]);

  const removeFromCart = useCallback((productId: string, selectedVariant?: Record<string, string>) => {
    setCart(prevCart => prevCart.filter(item => !(item.id === productId && areVariantsEqual(item.selectedVariant, selectedVariant))));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, selectedVariant?: Record<string, string>) => {
    const productInCart = cart.find(item => item.id === productId && areVariantsEqual(item.selectedVariant, selectedVariant));
    if (!productInCart) return;
    
    let stock = productInCart.stock;
    if (productInCart.variantDetails && selectedVariant) {
        const variantDetail = productInCart.variantDetails.find(vd => areVariantsEqual(vd.options, selectedVariant));
        stock = variantDetail?.stock ?? 0;
    }

    if (quantity > stock) {
        alert(`Stock insuffisant. Vous ne pouvez pas commander plus de ${stock} unités.`);
        return;
    }

    if (quantity <= 0) {
      removeFromCart(productId, selectedVariant);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          (item.id === productId && areVariantsEqual(item.selectedVariant, selectedVariant)) ? { ...item, quantity } : item
        )
      );
    }
  }, [cart, removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const contextValue = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};