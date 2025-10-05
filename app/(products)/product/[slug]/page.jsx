"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Heart, Share2, ChevronRightIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import AddToCartButton from "@/components/AddToCartButton"
import { getProductBySlugAndId, getRelatedProducts } from "@/actions/products"
import WhatsAppButton from "@/components/WhatsAppButton"
import Head from "next/head"

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
  const [activeTab, setActiveTab] = useState("description")

  // Generate structured data for rich snippets
  const generateStructuredData = () => {
    if (!product) return null

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pureluxury.com.ng'
    const productUrl = `${baseUrl}/product/${params.slug}`
    const imageUrl = product.images?.length > 0 ? getImageUrl(product.images[0]) : '/placeholder.svg'

    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "image": imageUrl,
      "sku": product._id,
      "mpn": product._id,
      "brand": {
        "@type": "Brand",
        "name": getCategoryName(product.category)
      },
      "offers": {
        "@type": "Offer",
        "url": productUrl,
        "priceCurrency": "NGN",
        "price": product.discountedPrice || product.price,
        "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Pure Luxury Communications",
          "name": "Pure Luxury"
        }
      },
      "aggregateRating": product.rating ? {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviewCount || 1
      } : undefined
    }
  }

  // Generate meta description
  const generateMetaDescription = () => {
    if (!product) return "Discover amazing products at great prices"
    
    const price = formatPrice(product.discountedPrice || product.price)
    const category = getCategoryName(product.category)
    const description = product.description?.substring(0, 155) + (product.description?.length > 155 ? '...' : '')
    
    return `Buy ${product.name} - ${category} for only ${price}. ${description}`
  }

  const getCategoryName = (category) => {
    if (typeof category === "string") return category
    if (category && typeof category === "object") return category.name
    return "Uncategorized"
  }

  // Helper function to extract image URL from either string or object
  const getImageUrl = (image) => {
    if (!image) return "/placeholder.svg"
    if (typeof image === "string") return image
    if (typeof image === "object" && image.url) return image.url
    return "/placeholder.svg"
  }

  // Parse features into key-value pairs
  const parseFeatures = (features) => {
    if (!features || !Array.isArray(features)) return []

    return features
      .map((feature) => {
        if (typeof feature !== "string") return null

        const colonIndex = feature.indexOf(":")
        if (colonIndex === -1) return null

        return {
          key: feature.substring(0, colonIndex).trim(),
          value: feature.substring(colonIndex + 1).trim(),
        }
      })
      .filter((feature) => feature !== null)
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
        console.log("Error sharing:", err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
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
      minimumFractionDigits: 0,
    }).format(price)
  }

  // Get canonical URL
  const getCanonicalUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pureluxury.com.ng'
    return `${baseUrl}/product/${params.slug}`
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... | Pure Luxury</title>
          <meta name="description" content="Loading product details..." />
        </Head>
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
      </>
    )
  }

  if (error || !product || prdIndex === -1) {
    return (
      <>
        <Head>
          <title>Product Not Found | Pure Luxury</title>
          <meta name="description" content="The product you're looking for is not available." />
          <meta name="robots" content="noindex" />
        </Head>
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white py-12 text-center px-4">
          <div className="mb-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 p-8">
            <XCircle className="h-16 w-16 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Oops!</h2>
          <p className="mb-6 max-w-md text-gray-600">{error || "The product you're looking for is not available."}</p>
          <Link
            href="/"
            className="bg-gradient-to-r from-blue-600 to-blue-400 px-6 py-3 font-medium text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:from-blue-700 hover:to-blue-500"
          >
            Explore Our Products
          </Link>
        </div>
      </>
    )
  }

  // Parse the product features
  const productFeatures = parseFeatures(product.features || [])
  const structuredData = generateStructuredData()
  const metaDescription = generateMetaDescription()
  const canonicalUrl = getCanonicalUrl()
  const mainImageUrl = product.images?.length > 0 ? getImageUrl(product.images[0]) : '/placeholder.svg'

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{`${product.name} - ${getCategoryName(product.category)} | Pure Luxury`}</title>
        <meta name="title" content={`${product.name} - ${getCategoryName(product.category)} | Pure Luxury`} />
        <meta name="description" content={metaDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={mainImageUrl} />
        <meta property="og:site_name" content="Pure Luxury" />
        <meta property="product:price:amount" content={product.discountedPrice || product.price} />
        <meta property="product:price:currency" content="NGN" />
        <meta property="product:availability" content={product.stock > 0 ? "in stock" : "out of stock"} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={canonicalUrl} />
        <meta property="twitter:title" content={product.name} />
        <meta property="twitter:description" content={metaDescription} />
        <meta property="twitter:image" content={mainImageUrl} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Additional SEO Meta Tags */}
        <meta name="keywords" content={`${product.name}, ${getCategoryName(product.category)}, buy online, Nigeria`} />
        <meta name="author" content="Pure Luxury" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Product Specific Meta */}
        <meta name="product:brand" content={getCategoryName(product.category)} />
        <meta name="product:price:currency" content="NGN" />
        <meta name="product:retailer_item_id" content={product._id} />
        
        {/* Structured Data */}
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumb with Schema.org markup */}
          <nav className="mb-8" itemScope itemType="https://schema.org/BreadcrumbList">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link href="/" className="hover:text-blue-600 transition-colors" itemProp="item">
                  <span itemProp="name">Home</span>
                </Link>
                <meta itemProp="position" content="1" />
              </li>
              <li className="before:content-['/'] before:mx-2 before:text-gray-400" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link href="/#products" className="hover:text-blue-600 transition-colors" itemProp="item">
                  <span itemProp="name">Products</span>
                </Link>
                <meta itemProp="position" content="2" />
              </li>
              <li className="before:content-['/'] before:mx-2 before:text-gray-400" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <span className="text-gray-900" itemProp="item">
                  <span itemProp="name">{getCategoryName(product.category)}</span>
                </span>
                <meta itemProp="position" content="3" />
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Image Gallery */}
            <div className="space-y-6">
              {/* Main Image with Zoom */}
              <div
                className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 cursor-zoom-in group"
                onMouseEnter={() => setZoomImage(true)}
                onMouseLeave={() => setZoomImage(false)}
                onMouseMove={handleImageHover}
              >
                {product?.images?.length > 0 ? (
                  <>
                    <Image
                      src={getImageUrl(product.images[currentImageIndex]) || "/placeholder.svg"}
                      alt={`${product.name} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-cover transition-transform duration-300"
                      style={{
                        transform: zoomImage ? `scale(1.5)` : "scale(1)",
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }}
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg"
                      }}
                    />
                    {product.images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
                        className={`rounded-full backdrop-blur-sm transition-all ${
                          isWishlisted
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-white/90 text-gray-700 hover:bg-white hover:scale-110"
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={shareProduct}
                        className="rounded-full bg-white/90 text-gray-700 backdrop-blur-sm hover:bg-white hover:scale-110 transition-all"
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
                          ? "border-blue-600 scale-105 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Image
                        src={getImageUrl(image) || "/placeholder.svg"}
                        alt={`${product.name} - Thumbnail ${index + 1}`}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = "/placeholder.svg"
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-8" itemScope itemType="https://schema.org/Product">
              <div>
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-xl px-4 py-2 text-sm font-medium inline-block">
                  {getCategoryName(product.category)}
                </span>
                <h1 className="mt-4 text-4xl font-bold text-gray-900" itemProp="name">{product.name}</h1>

                {/* Price */}
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-3xl font-bold text-blue-600" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <span itemProp="price" content={product.discountedPrice || product.price}>
                      {formatPrice(product.discountedPrice || product.price)}
                    </span>
                    <meta itemProp="priceCurrency" content="NGN" />
                    <meta itemProp="availability" content={product.stock > 0 ? "InStock" : "OutOfStock"} />
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
                      <span className="font-medium text-green-700">In Stock</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-600" />
                      <span className="font-medium text-red-700">Out of Stock</span>
                    </>
                  )}
                </div>
              </div>

              {/* Tabbed Content for Description and Specifications */}
              <div className="border-t border-gray-200 pt-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab("description")}
                      className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "description"
                          ? "border-black text-black"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Description
                    </button>
                    <button
                      onClick={() => setActiveTab("specifications")}
                      className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "specifications"
                          ? "border-black text-black"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Specifications
                    </button>
                  </nav>
                </div>

                <div className="mt-6">
                  {activeTab === "description" && (
                    <div className="leading-relaxed text-gray-600 space-y-4" itemProp="description">
                      <p>{product.description}</p>
                    </div>
                  )}

                  {activeTab === "specifications" && (
                    <div className="space-y-4">
                      {productFeatures.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-x-6 gap-y-2">
                          {productFeatures.map((feature, index) => (
                            <div
                              key={index}
                              className="flex flex-col border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                            >
                              <div className="font-bold text-gray-700 capitalize mb-1">{feature.key}</div>
                              <div className="text-gray-600">{feature.value}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-bold text-gray-900">Note:</h4>
                            <p className="text-gray-600">This product has no specifications.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

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
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">You may also like</h3>
                <Link href="/#products" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View all <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {relatedLoading
                  ? [...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))
                  : relatedProducts.map((product) => {
                      const isOnSale = product.discountedPrice && product.discountedPrice < product.price
                      const isOutOfStock = product.stock <= 0
                      
                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}-${product.productId}`}
                          className="group overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 relative"
                        >
                          {/* Badge container */}
                          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 items-start">
                            {isOutOfStock && (
                              <span className="px-2 py-1 bg-gray-700 text-white text-xs font-medium rounded-full shadow-md">
                                Out of Stock
                              </span>
                            )}
                            {isOnSale && !isOutOfStock && (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-full shadow-md">
                                SALE
                              </span>
                            )}
                            {product?.isNew && !isOutOfStock && (
                              <span className="px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-400 text-white text-xs font-medium rounded-full shadow-md">
                                New
                              </span>
                            )}
                          </div>

                          <div className="relative aspect-square bg-gray-100">
                            <Image
                              src={getImageUrl(product.defaultImage) || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                e.target.src = "/placeholder.svg"
                              }}
                            />
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white font-bold text-sm bg-black/70 px-3 py-1.5 rounded-lg">
                                  Out of Stock
                                </span>
                              </div>
                            )}
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
                                <span className="text-sm text-gray-500 line-through">{formatPrice(product.price)}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}