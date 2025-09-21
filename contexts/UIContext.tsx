


import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CartItem } from '../types';

interface UIContextType {
    isModalOpen: boolean;
    modalProduct: CartItem | null;
    openModal: (product: CartItem) => void;
    closeModal: () => void;
}

const UIContext = createContext<UIContextType | null>(null);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProduct, setModalProduct] = useState<CartItem | null>(null);

    const openModal = useCallback((product: CartItem) => {
        setModalProduct(product);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setModalProduct(null);
    }, []);

    return (
        <UIContext.Provider value={{ isModalOpen, modalProduct, openModal, closeModal }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error("useUI must be used within a UIProvider");
    return context;
};