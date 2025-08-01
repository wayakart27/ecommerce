"use client";

import { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

export default function AddToCartButton({ product, className, resetKey }) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const { addToCart } = useCart();
  const timeoutRef = useRef(null);

  // Verify product structure on mount
  useEffect(() => {
    if (!product?._id) {
      console.error('Product is missing required "id" field:', product);
    }
  }, [product]);

  // Reset quantity when resetKey changes
  useEffect(() => {
    setQuantity(1);
  }, [resetKey]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleAddToCart = () => {
    if (!product?._id) {
      console.error('Cannot add to cart: Product missing ID');
      return;
    }

    if (quantity < 1) {
      setQuantity(1);
      return;
    }
    
    setIsAdding(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      addToCart({ 
        ...product,
        quantity: quantity,
        id: product._id
      });
      setIsAdding(false);
    }, 500); // Reduced timeout for better UX
  };

  const handleBuyNow = () => {
    if (!product?._id) {
      console.error('Cannot buy: Product missing ID');
      return;
    }

    if (quantity < 1) {
      setQuantity(1);
      return;
    }
    
    setIsBuying(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      addToCart({ 
        ...product,
        quantity: quantity,
        id: product._id
      });
      setIsBuying(false);
      window.location.href = '/cart';
    }, 500); // Reduced timeout for better UX
  };

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, 100));
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1));
  };

  // Disable buttons if product is invalid
  const isProductValid = !!product?._id;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Quantity Selector */}
      <div className="flex items-center justify-center space-x-4">
        <button 
          onClick={decrementQuantity}
          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-black"
          disabled={quantity <= 1 || !isProductValid}
          aria-label="Decrease quantity"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="font-medium text-gray-900 w-8 text-center">
          {quantity}
        </span>
        <button 
          onClick={incrementQuantity}
          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-black"
          disabled={quantity >= 100 || !isProductValid}
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding || !isProductValid}
        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm transition-all
          ${isProductValid ? 'bg-[#D4AF37] hover:bg-[#D4AF37]/90' : 'bg-gray-400 cursor-not-allowed'}
          text-black shadow-sm hover:shadow-md
          ${isAdding ? 'opacity-90' : ''}
        `}
        aria-label="Add to cart"
      >
        {isAdding ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" />
            {isProductValid ? 'Add to Cart' : 'Product Unavailable'}
          </>
        )}
      </button>

      {/* Buy Now Button */}
      <button
        onClick={handleBuyNow}
        disabled={isBuying || !isProductValid}
        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm transition-all
          ${isProductValid ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'}
          text-white shadow-sm hover:shadow-md
          ${isBuying ? 'opacity-90' : ''}
        `}
        aria-label="Buy now"
      >
        {isBuying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          isProductValid ? 'Buy Now' : 'Unavailable'
        )}
      </button>
    </div>
  );
}