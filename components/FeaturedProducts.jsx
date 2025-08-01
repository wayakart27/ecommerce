"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Heart, ArrowRight, Tag, X, Menu } from "lucide-react"
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
  <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 overflow-hidden">
    <div className="relative aspect-square overflow-hidden rounded-lg mb-4 w-full">
      <Skeleton className="w-full h-full bg-gray-200" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-5 w-3/4 bg-gray-200" />
      <Skeleton className="h-4 w-1/2 bg-gray-200" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-20 bg-gray-200" />
        <Skeleton className="h-9 w-9 rounded-full bg-gray-200" />
      </div>
    </div>
  </div>
)

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

  const fetchProducts = async (pageNum = 1, category = "all", reset = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const response = await getAllProductsGroupedByCategory(pageNum, 8, category)

      if (reset || pageNum === 1) {
        setProducts(response.products)
        setTotalCounts(response.totalCounts)
      } else {
        setProducts((prev) => [...prev, ...response.products])
      }

      setHasMore(response.pagination?.hasNextPage || false)
    } catch (error) {
      console.error("Failed to fetch products:", error)
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

  return (
    <section className="py-16 bg-gray-50 relative min-h-screen" id="products">
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
        <div className="relative h-full w-3/4 max-w-xs bg-white shadow-lg animate-slide-in flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-600">
            <h3 className="font-bold text-white">Categories</h3>
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
              className={`w-full px-4 py-3 text-left rounded-lg transition-all font-medium ${
                activeCategory === "all" ? "bg-blue-600 text-white shadow-md" : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              All Products
              <span className="text-sm opacity-70 ml-2">({totalCounts.all || 0})</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => handleCategoryChange(category.slug)}
                className={`w-full px-4 py-3 text-left rounded-lg transition-all font-medium ${
                  activeCategory === category.slug
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {category.name}
                <span className="text-sm opacity-70 ml-2">({totalCounts[category.slug] || 0})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
            Featured Tech Products
          </h2>
          <p className="text-gray-500 max-w-md mx-auto text-lg">Premium phones, laptops, and accessories</p>
        </div>

        {/* Mobile Category Toggle Button */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden mb-8 flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Menu className="h-5 w-5" />
          Browse Categories
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Categories - Always show */}
          <div className="hidden lg:block lg:w-1/5">
            <div className="sticky top-8 space-y-3 p-6 bg-white rounded-xl border border-gray-200 shadow-md">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Categories</h3>
              <button
                onClick={() => handleCategoryChange("all")}
                className={`w-full px-4 py-3 text-left rounded-lg transition-all font-medium cursor-pointer ${
                  activeCategory === "all" ? "bg-blue-600 text-white shadow-md" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                All Products
                <span className="text-sm opacity-70 ml-2">({totalCounts.all || 0})</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`w-full px-4 py-3 text-left rounded-lg transition-all font-medium cursor-pointer ${
                    activeCategory === category.slug
                      ? "bg-blue-600 text-white shadow-md"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {category.name}
                  <span className="text-sm opacity-70 ml-2">({totalCounts[category.slug] || 0})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:w-4/5">
            {isLoading ? (
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
                        className="group relative bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-gray-200 overflow-hidden cursor-pointer"
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
                              className={`w-4 h-4 transition-colors ${
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

                        <div className="relative aspect-square overflow-hidden rounded-xl mb-4 w-full bg-gray-100">
                          <img
                            src={product.defaultImage || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-semibold text-gray-800 text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>

                          <div className="flex items-center gap-3">
                            {product.category && (
                              <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3 text-gray-500" />
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
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-400 hover:shadow-lg text-white rounded-lg h-10 font-medium transition-all hover:scale-105"
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Add to Cart
                              </Button>
                            ) : (
                              <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg py-2 px-4 h-10">
                                Out of Stock
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:bg-gray-100 hover:text-gray-700 h-10 w-10 p-0 ml-2 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                router.push(`/product/${product.id}`)
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
                  <div className="text-center py-8">
                    <p className="text-gray-500">You've viewed all products in this category</p>
                  </div>
                )}

                {products.length === 0 && !isLoading && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-gray-500 text-lg">No products found in this category</p>
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