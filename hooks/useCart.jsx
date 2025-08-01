'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const toastIdRef = useRef(null);

  // Initialize cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart)) {
            setCartItems(parsedCart);
          }
        }
      } finally {
        setIsInitialized(true);
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  const addToCart = (product) => {
    if (!product?.id) return;

    // Validate quantity
    const quantityToAdd = Math.max(1, Math.min(product.quantity || 1, 100)); // Ensure between 1-100

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        const newQuantity = (existingItem.quantity || 0) + quantityToAdd;
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
        toastIdRef.current = toast.success(
          `${product.name} quantity ${quantityToAdd > 1 ? `increased by ${quantityToAdd} to` : 'updated to'} ${newQuantity}`
        );
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
        toastIdRef.current = toast.success(
          `${quantityToAdd} ${product.name} ${quantityToAdd > 1 ? 'items' : 'item'} added to cart`
        );
        return [...prevItems, { 
          ...product, 
          quantity: quantityToAdd,
          price: product.price,
          discountedPrice: product.discountedPrice || null
        }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => {
      const itemToRemove = prevItems.find((item) => item.id === productId);
      if (itemToRemove) {
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
        toastIdRef.current = toast.success(`${itemToRemove.name} removed from cart`);
      }
      return prevItems.filter((item) => item.id !== productId);
    });
  };

  const updateQuantity = (productId, quantity) => {
    const validatedQuantity = Math.max(1, Math.min(quantity, 100)); // Ensure between 1-100

    if (validatedQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === productId) {
          if (toastIdRef.current) toast.dismiss(toastIdRef.current);
          toastIdRef.current = toast.success(`${item.name} quantity updated to ${validatedQuantity}`);
          return { ...item, quantity: validatedQuantity };
        }
        return item;
      })
    );
  };

const clearCart = (showToast = true) => {
  setCartItems([]);
  
  if (showToast) {
    if (toastIdRef.current) toast.dismiss(toastIdRef.current);
    toastIdRef.current = toast.success('Cart cleared');
  }
};

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.discountedPrice !== null && item.discountedPrice !== undefined 
        ? item.discountedPrice 
        : item.price || 0;
      return total + price * (item.quantity || 1);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getEffectivePrice = (item) => {
    return item.discountedPrice !== null && item.discountedPrice !== undefined
      ? item.discountedPrice
      : item.price || 0;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        getEffectivePrice,
      }}
    >
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