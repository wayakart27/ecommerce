"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Heart, ArrowRight, Tag, X, Menu, Star, Zap, MessageCircle, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/useCart"
import { getAllProductsGroupedByCategory } from "@/actions/products"

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(price)
}

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
    <div className="relative aspect-square overflow-hidden rounded-xl mb-5 w-full">
      <Skeleton className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-5 w-3/4 bg-gray-200 rounded-full" />
      <Skeleton className="h-4 w-1/2 bg-gray-200 rounded-full" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-20 bg-gray-200 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
      </div>
    </div>
  </div>
)

// Helper function to extract image URL from either string or object
const getImageUrl = (image) => {
  if (!image) return "/placeholder.svg";
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image.url) return image.url;
  return "/placeholder.svg";
};

const FeaturedProducts = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [wishlist, setWishlist] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCounts, setTotalCounts] = useState({ all: 0 })
  const [errorLoading, setErrorLoading] = useState(false)
  const [randomizedProducts, setRandomizedProducts] = useState([])

  const observer = useRef()
  const { toast } = useToast()
  const { addToCart } = useCart()
  const router = useRouter()
  const sidebarRef = useRef(null)

  const lastProductRef = useCallback(
    (node) => {
      if (isLoading || isLoadingMore || !hasMore) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
            setPage((prevPage) => prevPage + 1)
          }
        },
        {
          threshold: 0.1,
          rootMargin: "100px",
        },
      )

      if (node) observer.current.observe(node)
    },
    [isLoading, isLoadingMore, hasMore],
  )

  // Function to shuffle array randomly
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchProducts = async (pageNum = 1, category = "all", reset = false) => {
    try {
      setErrorLoading(false);
      if (pageNum === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const response = await getAllProductsGroupedByCategory(pageNum, 8, category)

      // Process products to ensure proper image URLs
      const processedProducts = response.products.map(product => ({
        ...product,
        defaultImage: getImageUrl(product.defaultImage)
      }));

      if (reset || pageNum === 1) {
        // Randomize products for ALL categories, not just "all"
        const shuffledProducts = shuffleArray(processedProducts);
        setProducts(shuffledProducts);
        setRandomizedProducts(shuffledProducts);
        setTotalCounts(response.totalCounts)
      } else {
        setProducts((prev) => [...prev, ...processedProducts])
      }

      setHasMore(response.pagination?.hasNextPage || false)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      setErrorLoading(true);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Function to retry loading products
  const retryLoading = () => {
    fetchProducts(1, activeCategory, true);
  };

  // Initial load
  useEffect(() => {
    fetchProducts(1, activeCategory, true)
  }, [])

  // Fetch categories immediately on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllProductsGroupedByCategory(1, 1, "all", true)
        setCategories(response.categories)
        setTotalCounts(response.totalCounts)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }

    fetchCategories()
  }, [])

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, activeCategory, false)
    }
  }, [page])

  const handleCategoryChange = (category) => {
    if (category === activeCategory) return

    setActiveCategory(category)
    setPage(1)
    setProducts([])
    setHasMore(true)

    if (observer.current) observer.current.disconnect()

    fetchProducts(1, category, true)
    setMobileSidebarOpen(false)
  }

  const handleAddToCart = (product, e) => {
    e.stopPropagation()
    e.preventDefault()
    addToCart(product)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const handleWishlistToggle = (productId, e) => {
    e.stopPropagation()
    e.preventDefault()
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
    toast({
      title: wishlist.includes(productId) ? "Removed from wishlist" : "Added to wishlist",
      description: wishlist.includes(productId) ? "Item removed from your wishlist." : "Item added to your wishlist.",
    })
  }

  const handleProductClick = (product, e) => {
    if (!e.target.closest("button")) {
      router.push(`/product/${product.slug}-${product.productId}`)
    }
  }

  const getCurrentCategoryCount = () => {
    if (activeCategory === "all") {
      return totalCounts.all || 0
    }
    return totalCounts[activeCategory] || 0
  }

  const openWhatsApp = () => {
    const phoneNumber = "2348160126157"; // Nigerian number without leading 0
    const message = "Hello! I'm interested in a product but couldn't find it on your website. Can you help me?";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative min-h-screen" id="products">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-30"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100 rounded-full translate-x-1/3 translate-y-1/3 opacity-30"></div>
      
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
        <div className="relative h-full w-3/4 max-w-xs bg-white shadow-2xl animate-slide-in flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-500">
            <h3 className="font-bold text-white text-lg">Categories</h3>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <div 
            ref={sidebarRef}
            className="flex-1 overflow-y-auto p-6 space-y-3"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            <button
              onClick={() => handleCategoryChange("all")}
              className={`w-full px-4 py-3 text-left rounded-xl transition-all font-medium flex items-center justify-between ${
                activeCategory === "all" 
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg" 
                  : "hover:bg-gray-100 text-gray-700 border border-gray-200"
              }`}
            >
              <span>All Products</span>
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">({totalCounts.all || 0})</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => handleCategoryChange(category.slug)}
                className={`w-full px-4 py-3 text-left rounded-xl transition-all font-medium flex items-center justify-between ${
                  activeCategory === category.slug
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                    : "hover:bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                <span>{category.name}</span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded-full">({totalCounts[category.slug] || 0})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-full mb-4">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Premium Tech Collection</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Discover Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Featured</span> Products
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">Premium phones, laptops, and accessories with cutting-edge technology</p>
        </div>

        {/* Mobile Category Toggle Button */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden mb-8 w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
        >
          <Menu className="h-5 w-5" />
          Browse Categories
          <span className="bg-white/20 px-2 py-1 rounded-full text-sm">({getCurrentCategoryCount()})</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Categories - Always show */}
          <div className="hidden lg:block lg:w-1/4 xl:w-1/5">
            <div className="sticky top-8 space-y-3 p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
              <h3 className="font-bold text-xl mb-5 text-gray-900 flex items-center gap-2">
                <Menu className="h-5 w-5 text-blue-600" />
                Categories
              </h3>
              <button
                onClick={() => handleCategoryChange("all")}
                className={`w-full px-4 py-3 text-left rounded-xl transition-all font-medium flex items-center justify-between cursor-pointer ${
                  activeCategory === "all" 
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg" 
                    : "hover:bg-gray-50 text-gray-700 border border-gray-200"
                }`}
              >
                <span>All Products</span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded-full">({totalCounts.all || 0})</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`w-full px-4 py-3 text-left rounded-xl transition-all font-medium flex items-center justify-between cursor-pointer ${
                    activeCategory === category.slug
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                      : "hover:bg-gray-50 text-gray-700 border border-gray-200"
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-sm bg-white/20 px-2 py-1 rounded-full">({totalCounts[category.slug] || 0})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4 xl:w-4/5">
            {errorLoading ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Failed to load products</h3>
                <p className="text-gray-500 mb-6">Please try again to load the products.</p>
                <Button 
                  onClick={retryLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product, index) => {
                    const isLastProduct = index === products.length - 1
                    return (
                      <div
                        ref={isLastProduct ? lastProductRef : null}
                        key={`${product.id}-${index}`}
                        className="group relative bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                        onClick={(e) => handleProductClick(product, e)}
                      >
                        <div className="absolute top-4 right-4 z-10">
                          <button
                            className={`p-2 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-md ${
                              wishlist.includes(product.id) ? "opacity-100" : ""
                            }`}
                            onClick={(e) => handleWishlistToggle(product.id, e)}
                          >
                            <Heart
                              className={`w-4 transition-colors ${
                                wishlist.includes(product.id) ? "text-red-500 fill-red-500" : "text-gray-500"
                              }`}
                            />
                          </button>
                        </div>

                        {product?.isNew && (
                          <span className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-400 text-white text-xs font-medium rounded-full shadow-md z-10">
                            New
                          </span>
                        )}

                        <div className="relative aspect-square overflow-hidden rounded-xl mb-5 w-full bg-gradient-to-br from-gray-100 to-gray-200">
                          <img
                            src={getImageUrl(product.defaultImage)}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = "/placeholder.svg";
                            }}
                          />
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-semibold text-gray-900 text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>

                          <div className="flex items-center gap-3">
                            {product.category && (
                              <div className="flex items-center gap-1">
                                <Tag className="w-3 text-gray-500" />
                                <span className="text-xs text-gray-500 capitalize">{product.category}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 font-bold text-lg">
                                {formatPrice(product.discountedPrice || product.price)}
                              </span>
                              {product.discountedPrice && (
                                <span className="line-through text-gray-500 text-sm">{formatPrice(product.price)}</span>
                              )}
                            </div>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 backdrop-blur-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-between items-center border-t border-gray-200">
                            {product.stock > 0 ? (
                              <Button
                                onClick={(e) => handleAddToCart(product, e)}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl text-white rounded-xl h-10 font-medium transition-all hover:scale-105"
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Add to Cart
                              </Button>
                            ) : (
                              <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-500 rounded-xl py-2 px-4 h-10">
                                Out of Stock
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:bg-gray-100 hover:text-gray-700 h-10 w-10 p-0 ml-2 rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                router.push(`/product/${product.slug}-${product.productId}`)
                              }}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {isLoadingMore && (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                    {[...Array(4)].map((_, index) => (
                      <ProductCardSkeleton key={`skeleton-${index}`} />
                    ))}
                  </div>
                )}

                {!hasMore && products.length > 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Star className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-gray-600 mb-4">You've viewed all {getCurrentCategoryCount()} products in this category.</p>
                    <p className="text-gray-600 mb-6">Didn't find what you're looking for?</p>
                    <Button 
                      onClick={openWhatsApp}
                      className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      WhatsApp Us for Special Requests
                    </Button>
                  </div>
                )}

                {products.length === 0 && !isLoading && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <span className="text-4xl">🔍</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                    <p className="text-gray-500 mb-6">Try selecting a different category or check back later for new arrivals.</p>
                    <Button 
                      onClick={openWhatsApp}
                      className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      WhatsApp Us for Special Requests
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedProducts