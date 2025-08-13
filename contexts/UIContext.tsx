import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import type { Product } from '../types';

interface UIContextType {
  isModalOpen: boolean;
  modalProduct: Product | null;
  openModal: (product: Product) => void;
  closeModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const openModal = useCallback((product: Product) => {
    setModalProduct(product);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalProduct(null);
  }, []);

  const contextValue = useMemo(() => ({
    isModalOpen,
    modalProduct,
    openModal,
    closeModal
  }), [isModalOpen, modalProduct, openModal, closeModal]);

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};