"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useCart } from "@/hooks/useCart";
import { useState, useEffect } from "react";
import { getProductById } from "@/actions/products";
import Image from "next/image";

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity: originalUpdateQuantity,
    getTotalPrice,
    clearCart,
    getEffectivePrice,
    isLoading
  } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [insufficientStockItems, setInsufficientStockItems] = useState([]);
  const [stockCheckLoading, setStockCheckLoading] = useState(true);
  const [productStocks, setProductStocks] = useState({});
  const [itemLoading, setItemLoading] = useState({});

  // Helper function to extract image URL from either string or object
  const getImageUrl = (image) => {
    if (!image) return "/placeholder.png";
    if (typeof image === 'string') return image;
    if (typeof image === 'object' && image.url) return image.url;
    return "/placeholder.png";
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkStockAvailability = async () => {
      if (cartItems.length === 0) {
        setStockCheckLoading(false);
        return;
      }
      
      setStockCheckLoading(true);
      try {
        const stockResults = await Promise.all(
          cartItems.map(async (item) => {
            const product = await getProductById(item.id);
            return {
              id: item.id,
              stock: product?.stock || 0,
              name: item.name
            };
          })
        );

        const stockMap = {};
        stockResults.forEach(item => {
          stockMap[item.id] = item.stock;
        });
        setProductStocks(stockMap);

        const outOfStock = stockResults
          .filter(item => item.stock <= 0)
          .map(item => ({
            id: item.id,
            name: item.name
          }));

        const insufficientStock = stockResults
          .filter(item => item.stock > 0 && item.stock < (cartItems.find(cartItem => cartItem.id === item.id)?.quantity || 0))
          .map(item => ({
            id: item.id,
            name: item.name,
            available: item.stock
          }));

        setOutOfStockItems(outOfStock);
        setInsufficientStockItems(insufficientStock);
      } catch (error) {
        console.error("Failed to check stock:", error);
      } finally {
        setStockCheckLoading(false);
      }
    };

    checkStockAvailability();
  }, [cartItems]);

  const updateQuantityWithStockCheck = async (id, newQuantity) => {
    setItemLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      originalUpdateQuantity(id, newQuantity);
      
      const product = await getProductById(id);
      const stock = product?.stock || 0;
      
      setProductStocks(prev => ({ ...prev, [id]: stock }));
      
      setOutOfStockItems(prev => {
        if (stock <= 0) {
          return prev.some(item => item.id === id) 
            ? prev 
            : [...prev, { id, name: cartItems.find(i => i.id === id)?.name || "" }];
        }
        return prev.filter(item => item.id !== id);
      });
      
      setInsufficientStockItems(prev => {
        const item = cartItems.find(i => i.id === id);
        if (stock > 0 && newQuantity > stock) {
          const newItem = { 
            id, 
            name: item?.name || "", 
            available: stock 
          };
          return prev.some(i => i.id === id) 
            ? prev.map(i => i.id === id ? newItem : i)
            : [...prev, newItem];
        }
        return prev.filter(item => item.id !== id);
      });
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setItemLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = () => {
    if (outOfStockItems.length > 0 || insufficientStockItems.length > 0) return;
    setIsCheckingOut(true);
    setTimeout(() => {
      window.location.href = "/checkout";
    }, 500);
  };

  const CartItemSkeleton = () => (
    <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b">
      <div className="md:col-span-6 flex items-center space-x-4">
        <div className="w-20 h-20 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="md:col-span-2 flex justify-center">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="md:col-span-2 flex justify-center">
        <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
          <div className="h-8 w-8 bg-gray-200 animate-pulse"></div>
          <div className="w-8 text-center">
            <div className="h-4 w-4 mx-auto bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 animate-pulse"></div>
        </div>
      </div>
      <div className="md:col-span-2 flex justify-end">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );

  const OrderSummarySkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm sticky top-32">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
      <div className="space-y-3 pb-4 border-b border-gray-200">
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="flex justify-between py-4">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="h-10 w-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl animate-pulse mt-4"></div>
    </div>
  );

  const EmptyCartSkeleton = () => (
    <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
      <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
      <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
      <div className="h-4 w-64 bg-gray-200 rounded mx-auto mb-8 animate-pulse"></div>
      <div className="h-10 w-40 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl mx-auto animate-pulse"></div>
    </div>
  );

  const showLoading = isLoading || localLoading;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="container mt-32 mb-20 flex-1 px-4 md:px-6">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-8">
          Your Shopping Cart
        </h1>

        {showLoading ? (
          <>
            {cartItems.length === 0 ? (
              <EmptyCartSkeleton />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {[...Array(3)].map((_, i) => (
                      <CartItemSkeleton key={i} />
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between mt-6 gap-4">
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-40 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl animate-pulse"></div>
                  </div>
                </div>
                <OrderSummarySkeleton />
              </div>
            )}
          </>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
            <ShoppingCart className="h-16 w-16 text-blue-400/30 mx-auto mb-4" />
            <h2 className="text-2xl font-medium text-gray-700 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white rounded-xl">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-200 text-gray-500">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => {
                    const stock = productStocks[item.id] || 0;
                    const isOutOfStock = !stockCheckLoading && stock <= 0;
                    const isInsufficient = !stockCheckLoading && stock > 0 && item.quantity > stock;
                    const showError = isOutOfStock || isInsufficient;
                    const itemIsLoading = itemLoading[item.id] || false;
                    const imageUrl = getImageUrl(item.defaultImage);

                    return (
                      <div
                        key={item.id}
                        className={`p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center ${showError ? 'bg-red-50' : ''}`}
                      >
                        <div className="md:col-span-6 flex items-center space-x-4">
                          <span
                            className="w-20 h-20 flex-shrink-0 relative"
                          >
                            <Image
                              src={imageUrl}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover rounded-md"
                              onError={(e) => {
                                e.target.src = "/placeholder.png";
                              }}
                            />
                            {!stockCheckLoading && isOutOfStock && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-md">
                                <span className="bg-white px-2 py-1 rounded text-xs font-medium">
                                  Out of Stock
                                </span>
                              </div>
                            )}
                            {!stockCheckLoading && isInsufficient && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-md">
                                <span className="bg-white px-2 py-1 rounded text-xs font-medium">
                                  Only {stock} available
                                </span>
                              </div>
                            )}
                          </span>
                          <div>
                            <span
                              className={`font-medium ${showError ? 'text-red-600' : 'text-gray-700 hover:text-blue-600'}`}
                            >
                              {item.name}
                            </span>
                            {!stockCheckLoading && isInsufficient && (
                              <p className="text-xs text-red-500 mt-1">
                                You've selected {item.quantity}, but only {stock} available
                              </p>
                            )}
                            {!stockCheckLoading && isOutOfStock && (
                              <p className="text-xs text-red-500 mt-1">
                                This item is no longer available
                              </p>
                            )}
                            {stockCheckLoading && !itemIsLoading && (
                              <p className="text-xs text-gray-500 mt-1">
                                Checking stock availability...
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2 flex justify-center">
                          <div className="flex items-center md:hidden text-gray-500 mr-2">
                            Price:
                          </div>
                          <div className={`${showError ? 'text-red-600' : 'text-gray-700'}`}>
                            {formatPrice(getEffectivePrice(item))}
                          </div>
                        </div>

                        <div className="md:col-span-2 flex justify-center">
                          <div className="flex items-center md:hidden text-gray-500 mr-2">
                            Quantity:
                          </div>
                          {itemIsLoading ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                            </div>
                          ) : isOutOfStock ? (
                            <div className="text-red-500 text-sm">Unavailable</div>
                          ) : (
                            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-none h-8 w-8 text-gray-700 hover:text-blue-600 p-0"
                                onClick={() =>
                                  updateQuantityWithStockCheck(item.id, (item.quantity || 1) - 1)
                                }
                                disabled={itemIsLoading}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-gray-700">
                                {item.quantity || 1}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-none h-8 w-8 text-gray-700 hover:text-blue-600 p-0"
                                onClick={() =>
                                  updateQuantityWithStockCheck(item.id, Math.min((item.quantity || 1) + 1, stock))
                                }
                                disabled={item.quantity >= stock || itemIsLoading}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-2 flex justify-between md:justify-end">
                          <div className="flex items-center md:hidden text-gray-500 mr-2">
                            Total:
                          </div>
                          <div className="flex items-center">
                            <span className={`mr-4 ${showError ? 'text-red-600' : 'text-gray-700'}`}>
                              {formatPrice(
                                getEffectivePrice(item) * item.quantity
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-red-600"
                              onClick={() => removeFromCart(item.id)}
                              disabled={itemIsLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between mt-6 gap-4">
                <Button
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-gray-100"
                  onClick={() => clearCart()}
                >
                  Clear Cart
                </Button>
                <Link href="/">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-blue-600"
                  >
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm sticky top-32">
              <h2 className="text-xl font-medium bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 text-gray-500 pb-4 border-b border-gray-200">
                <div className="flex justify-between">
                  <span>
                    Subtotal ({cartItems.length}{" "}
                    {cartItems.length === 1 ? "item" : "items"})
                  </span>
                  <span className="text-gray-700">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-gray-700">-</span>
                </div>
              </div>
              <div className="flex justify-between py-4 font-medium bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                <span>Total</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut || stockCheckLoading || outOfStockItems.length > 0 || insufficientStockItems.length > 0 || Object.values(itemLoading).some(Boolean)}
                className={`w-full mt-4 cursor-pointer rounded-xl ${stockCheckLoading || outOfStockItems.length > 0 || insufficientStockItems.length > 0 || Object.values(itemLoading).some(Boolean) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white'}`}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : stockCheckLoading || Object.values(itemLoading).some(Boolean) ? (
                  "Checking stock..."
                ) : outOfStockItems.length > 0 || insufficientStockItems.length > 0 ? (
                  "Resolve stock issues to checkout"
                ) : (
                  "Proceed to Checkout"
                )}
              </Button>
              {(outOfStockItems.length > 0 || insufficientStockItems.length > 0) && !stockCheckLoading && !Object.values(itemLoading).some(Boolean) && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  You have {outOfStockItems.length + insufficientStockItems.length} 
                  {" "}item{(outOfStockItems.length + insufficientStockItems.length) !== 1 ? 's' : ''} 
                  {" "}with stock issues
                </p>
              )}
            </div>
          </div>
        )}
      </main>
      <WhatsAppButton />
    </div>
  );
};

export default CartPage;