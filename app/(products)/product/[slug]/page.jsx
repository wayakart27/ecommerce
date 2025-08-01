"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import AddToCartButton from "@/components/AddToCartButton"
import { getProductBySlugAndId, getRelatedProducts } from "@/actions/products"
import WhatsAppButton from "@/components/WhatsAppButton"

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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

  if (loading) {
    return (
      <div className="mx-auto mt-16 max-w-7xl bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-md" />
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
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product || prdIndex === -1) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white py-12 text-center mt-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 p-8">
          <XCircle className="h-16 w-16 text-white" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Oops!</h2>
        <p className="mb-6 max-w-md text-gray-600">
          {error || "The product you're looking for is not available."}
        </p>
        <Link
          href="/"
          className="bg-gradient-to-r from-blue-600 to-blue-400 px-6 py-3 font-medium text-white rounded-xl shadow-sm transition-colors hover:from-blue-700 hover:to-blue-500"
        >
          Explore Our Products
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto mt-16 max-w-7xl bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            {product?.images?.length > 0 ? (
              <>
                <Image
                  src={product.images[currentImageIndex]}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {product.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
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

          {/* Horizontal Thumbnail Gallery - 5 in a row */}
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {product.images.slice(0, 5).map((image, index) => (
                <button
                  key={index}
                  onClick={() => selectImage(index)}
                  className={`flex-shrink-0 h-20 w-20 rounded-md border-2 transition-colors ${
                    currentImageIndex === index ? "border-blue-600" : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-xl px-3 py-1 text-sm font-medium">
              {getCategoryName(product.category)}
            </span>
            <h1 className="mt-3 text-4xl font-bold text-gray-900">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-3xl font-medium text-blue-600">
                {formatPrice(product.discountedPrice || product.price)}
              </p>
              {product.discountedPrice && (
                <p className="text-lg text-gray-500 line-through">{formatPrice(product.price)}</p>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-100 p-3">
              {product.stock > 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700">
                    In Stock ({product.stock} available)
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-700">Out of Stock</span>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900">Description</h2>
            <p className="mt-3 leading-relaxed text-gray-600">{product.description}</p>
          </div>

          {product.features?.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900">Features</h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <CheckCircle className="mr-2 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add to Cart Section */}
          {product.stock > 0 ? (
            <div className="border-t border-gray-200 pt-6">
              <AddToCartButton
                product={product}
                resetKey={product._id}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-medium rounded-xl shadow-sm transition-colors py-3 px-6"
              />
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-6">
              <div className="rounded-lg bg-gray-100 p-4 text-center">
                <p className="font-medium text-gray-700">This product is currently out of stock</p>
              </div>
            </div>
          )}
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
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : relatedProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}-${product.productId}`}
                    className="group overflow-hidden rounded-lg transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-gray-100">
                      <Image
                        src={product.defaultImage || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover transition-opacity group-hover:opacity-90"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="line-clamp-1 font-medium text-gray-900">{product.name}</h4>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-medium text-blue-600">
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
      <WhatsAppButton />
    </div>
  )
}