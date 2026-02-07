'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AgencyProduct } from '@/lib/airtable/types';

export interface SimulatedProduct extends AgencyProduct {
    adults: number;
    children: number;
    infants: number;
}

interface CartContextType {
    selectedProducts: SimulatedProduct[];
    addToCart: (product: AgencyProduct) => void;
    removeFromCart: (productId: string) => void;
    updatePax: (productId: string, field: 'adults' | 'children' | 'infants', value: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [selectedProducts, setSelectedProducts] = useState<SimulatedProduct[]>([]);

    const addToCart = useCallback((product: AgencyProduct) => {
        setSelectedProducts(prev => {
            if (prev.find(p => p.id === product.id)) return prev;
            return [...prev, { ...product, adults: 1, children: 0, infants: 0 }];
        });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    }, []);

    const updatePax = useCallback((productId: string, field: 'adults' | 'children' | 'infants', value: number) => {
        setSelectedProducts(prev => prev.map(p =>
            p.id === productId ? { ...p, [field]: value } : p
        ));
    }, []);

    const clearCart = useCallback(() => {
        setSelectedProducts([]);
    }, []);

    return (
        <CartContext.Provider value={{ selectedProducts, addToCart, removeFromCart, updatePax, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
