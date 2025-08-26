"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Zap, Shield, Truck, RotateCcw, Heart, Share2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import AddToCartButton from "@/components/AddToCartButton"
import { getProductBySlugAndId, getRelatedProducts } from "@/actions/products"
import WhatsAppButton from "@/components/WhatsAppButton"
import { motion } from "framer-motion"

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [zoomImage, setZoomImage] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })

  const getCategoryName = (category) => {
    if (typeof category === "string") return category
    if (category && typeof category === "object") return category.name
    return "Uncategorized"
  }

  const slugWithId = params?.slug || ""
  const prdIndex = slugWithId.indexOf("-PRD-")

  const slug = prdIndex !== -1 ? slugWithId.substring(0, prdIndex) : ""
  const productId = prdIndex !== -1 ? slugWithId.substring(prdIndex + 1) : ""

  const nextImage = () => {
    if (!product?.images?.length) return
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  const prevImage = () => {
    if (!product?.images?.length) return
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const selectImage = (index) => {
    setCurrentImageIndex(index)
  }

  const handleImageHover = (e) => {
    if (!zoomImage) return
    
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPosition({ x, y })
  }

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    // Add your wishlist logic here
  }

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getProductBySlugAndId(slug, productId)
        if (response) {
          setProduct(response)
          setCurrentImageIndex(0)
          fetchRelatedProducts(response._id, getCategoryName(response.category))
        } else {
          setError("Product not found")
        }
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to fetch product")
      } finally {
        setLoading(false)
      }
    }

    const fetchRelatedProducts = async (id, category) => {
      try {
        setRelatedLoading(true)
        const related = await getRelatedProducts(id, category)
        setRelatedProducts(related)
      } catch (err) {
        console.error("Failed to fetch related products:", err)
      } finally {
        setRelatedLoading(false)
      }
    }

    if (prdIndex !== -1) fetchProductAndRelated()
  }, [slug, productId, prdIndex])

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price)
  }

  // Generic features that work for both tech products and accessories
  const productFeatures = [
    {
      icon: <Zap className="h-5 w-5 text-blue-600" />,
      title: "Premium Quality",
      description: "Genuine products with warranty"
    },
    {
      icon: <Shield className="h-5 w-5 text-green-600" />,
      title: "Secure Payment",
      description: "Safe and encrypted transactions"
    },
    {
      icon: <Truck className="h-5 w-5 text-purple-600" />,
      title: "Fast Delivery",
      description: "Quick shipping"
    },
    {
      icon: <RotateCcw className="h-5 w-5 text-orange-600" />,
      title: "Easy Returns",
      description: "7-day return policy"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-20 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-5 w-40" />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))}
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product || prdIndex === -1) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white py-12 text-center px-4">
        <div className="mb-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 p-8">
          <XCircle className="h-16 w-16 text-white" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Oops!</h2>
        <p className="mb-6 max-w-md text-gray-600">
          {error || "The product you're looking for is not available."}
        </p>
        <Link
          href="/"
          className="bg-gradient-to-r from-blue-600 to-blue-400 px-6 py-3 font-medium text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:from-blue-700 hover:to-blue-500"
        >
          Explore Our Products
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
            </li>
            <li className="before:content-['/'] before:mx-2 before:text-gray-400">
              <Link href="/#products" className="hover:text-blue-600 transition-colors">
                Products
              </Link>
            </li>
            <li className="before:content-['/'] before:mx-2 before:text-gray-400">
              <span className="text-gray-900">{getCategoryName(product.category)}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-6">
            {/* Main Image with Zoom */}
            <div 
              className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 cursor-zoom-in"
              onMouseEnter={() => setZoomImage(true)}
              onMouseLeave={() => setZoomImage(false)}
              onMouseMove={handleImageHover}
            >
              {product?.images?.length > 0 ? (
                <>
                  <Image
                    src={product.images[currentImageIndex]}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-cover transition-transform duration-300"
                    style={{
                      transform: zoomImage ? `scale(1.5)` : 'scale(1)',
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                    }}
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {product.images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleWishlist}
                      className={`rounded-full backdrop-blur-sm ${
                        isWishlisted 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-white/90 text-gray-700 hover:bg-white'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={shareProduct}
                      className="rounded-full bg-white/90 text-gray-700 backdrop-blur-sm hover:bg-white"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200">
                  <div className="text-center p-8">
                    <div className="mb-4 text-5xl">📷</div>
                    <p className="text-blue-600">{product.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => selectImage(index)}
                    className={`flex-shrink-0 h-20 w-20 rounded-xl border-2 transition-all ${
                      currentImageIndex === index 
                        ? 'border-blue-600 scale-105' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-xl px-4 py-2 text-sm font-medium inline-block">
                {getCategoryName(product.category)}
              </span>
              <h1 className="mt-4 text-4xl font-bold text-gray-900">{product.name}</h1>

              {/* Price */}
              <div className="mt-4 flex items-center gap-3">
                <p className="text-3xl font-bold text-blue-600">
                  {formatPrice(product.discountedPrice || product.price)}
                </p>
                {product.discountedPrice && (
                  <p className="text-lg text-gray-500 line-through">{formatPrice(product.price)}</p>
                )}
                {product.discountedPrice && (
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm font-medium">
                    Save {formatPrice(product.price - product.discountedPrice)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-100 p-4">
                {product.stock > 0 ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="font-medium text-green-700">
                      In Stock
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-600" />
                    <span className="font-medium text-red-700">Out of Stock</span>
                  </>
                )}
              </div>
            </div>

            {/* Product Features - Generic for all products */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {productFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {feature.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{feature.title}</p>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Description */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="leading-relaxed text-gray-600">{product.description}</p>
            </div>

            {/* Features */}
            {product.features?.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h2>
                <ul className="grid grid-cols-1 gap-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add to Cart Section */}
            <div className="border-t border-gray-200 pt-6">
              {product.stock > 0 ? (
                <div className="space-y-4">
                  <AddToCartButton
                    product={product}
                    resetKey={product._id}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all py-4 px-6 text-lg"
                  />
                  <WhatsAppButton 
                    product={product}
                    className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium rounded-xl py-4 px-6 text-lg transition-all"
                  />
                </div>
              ) : (
                <div className="rounded-xl bg-gray-100 p-6 text-center">
                  <p className="font-medium text-gray-700 mb-2">This product is currently out of stock</p>
                  <p className="text-sm text-gray-600">Contact us to be notified when it's back in stock</p>
                  <WhatsAppButton 
                    product={product}
                    className="mt-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium rounded-xl py-3 px-6"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h3 className="mb-8 text-2xl font-bold text-gray-900">You may also like</h3>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {relatedLoading
                ? [...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-48 w-full rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))
                : relatedProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}-${product.productId}`}
                      className="group overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative aspect-square bg-gray-100">
                        <Image
                          src={product.defaultImage || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="line-clamp-1 font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h4>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="font-bold text-blue-600">
                            {formatPrice(product.discountedPrice || product.price)}
                          </span>
                          {product.discountedPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}