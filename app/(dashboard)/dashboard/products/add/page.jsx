"use client"
import { useEffect, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2, UploadCloud, X, Plus, Minus, Star } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateProductSchema } from "@/schemas/product"
import { createProduct } from "@/actions/products"
import { getAllCategories } from "@/actions/categories"
import { Checkbox } from "@/components/ui/checkbox"

export default function AddProductPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const abortControllers = useRef({})
  const [categories, setCategories] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [defaultImageIndex, setDefaultImageIndex] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [features, setFeatures] = useState([])
  const [currentFeature, setCurrentFeature] = useState("")
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false)
  const [activeUploads, setActiveUploads] = useState([])

  const form = useForm({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      purchasePrice: 0,
      discountedPrice: 0,
      category: "",
      stock: 0,
      isActive: true,
      images: [], // Initialize as empty array
      defaultImage: null, // Initialize as null
      features: [],
    },
  })

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
      Object.values(abortControllers.current).forEach((controller) => controller.abort())
    }
  }, [imagePreviews])

  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    try {
      const result = await getAllCategories()
      if (result?.success) {
        setCategories(result.data || [])
      } else {
        toast.error(result?.message || "Failed to load categories")
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast.error("Failed to load categories. Please try again later.")
    } finally {
      setIsLoadingCategories(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const generateSlug = async (name) => {
    if (!name) return ""
    setIsGeneratingSlug(true)
    try {
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s]+/g, "-")
        .replace(/--+/g, "-")
        .trim()
      form.setValue("slug", slug)
      return slug
    } catch (error) {
      console.error("Error generating slug:", error)
      return ""
    } finally {
      setIsGeneratingSlug(false)
    }
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    form.setValue("name", name)
    generateSlug(name)
  }

  const uploadToCloudinary = async (file, index) => {
    const MAX_SIZE = 2 * 1024 * 1024
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Only JPG, PNG, and WebP images are allowed")
    }
    if (file.size > MAX_SIZE) {
      throw new Error(`Image exceeds 2MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    }

    const controller = new AbortController()
    abortControllers.current[index] = controller

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Upload failed")
      }

      return await response.json()
    } catch (error) {
      if (error.name !== "AbortError") {
        throw error
      }
      return null // Return null if upload was aborted
    } finally {
      delete abortControllers.current[index]
    }
  }

  const handleImageChange = async (files) => {
    const filesArray = Array.from(files).slice(0, 5 - imagePreviews.length)

    try {
      // Create previews and filter invalid files
      const newPreviews = []
      const validFilesToUpload = []
      filesArray.forEach((file) => {
        try {
          if (file.size > 2 * 1024 * 1024) {
            throw new Error(`${file.name}: Exceeds 2MB limit`)
          }
          if (!file.type.startsWith("image/")) {
            throw new Error(`${file.name}: Not an image file`)
          }
          const preview = URL.createObjectURL(file)
          newPreviews.push(preview)
          validFilesToUpload.push(file)
        } catch (error) {
          toast.error(error.message)
        }
      })

      // Update previews immediately
      const updatedPreviews = [...imagePreviews, ...newPreviews].slice(0, 5)
      setImagePreviews(updatedPreviews)

      // Upload files with progress tracking
      const uploadPromises = validFilesToUpload.map(async (file, index) => {
        const globalIndex = imagePreviews.length + index // Calculate global index for new files
        setActiveUploads((prev) => [...prev, globalIndex])
        try {
          // Simulate progress (optional, for UI feedback)
          for (let progress = 0; progress <= 90; progress += 10) {
            await new Promise((resolve) => setTimeout(resolve, 200))
            if (abortControllers.current[globalIndex]?.signal.aborted) break
            setUploadProgress((prev) => ({ ...prev, [globalIndex]: progress }))
          }
          if (abortControllers.current[globalIndex]?.signal.aborted) {
            return null
          }

          const result = await uploadToCloudinary(file, globalIndex)
          setUploadProgress((prev) => ({ ...prev, [globalIndex]: 100 }))
          return result.secure_url
        } catch (error) {
          if (error.name !== "AbortError") {
            toast.error(`Failed to upload ${file.name}: ${error.message}`)
          }
          return null
        } finally {
          setActiveUploads((prev) => prev.filter((i) => i !== globalIndex))
        }
      })

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean)

      // Get current images from form state to ensure we have the latest
      const currentUrls = form.getValues("images")
      const allUrls = [...currentUrls, ...uploadedUrls].slice(0, 5)

      // Update form with all URLs
      form.setValue("images", allUrls)

      // Set default image if none selected and new images were uploaded
      if (defaultImageIndex === null && uploadedUrls.length > 0) {
        const newDefaultIndex = currentUrls.length // Index of the first newly uploaded image
        setDefaultImageIndex(newDefaultIndex)
        form.setValue("defaultImage", allUrls[newDefaultIndex])
      }
    } catch (error) {
      console.error("Image processing error:", error)
    }
  }

  const cancelUpload = (index) => {
    if (abortControllers.current[index]) {
      abortControllers.current[index].abort()
      delete abortControllers.current[index]
    }

    // Remove preview
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    setUploadProgress((prev) => {
      const newProgress = { ...prev }
      delete newProgress[index]
      return newProgress
    })

    // Update form images array
    const currentUrls = form.getValues("images")
    if (index < currentUrls.length) {
      // Only remove from form if it was already uploaded
      const newUrls = currentUrls.filter((_, i) => i !== index)
      form.setValue("images", newUrls)

      // Adjust default image index if the removed image was default or before it
      if (defaultImageIndex === index) {
        const newDefaultIndex = newUrls.length > 0 ? 0 : null // Set first image as default or null
        setDefaultImageIndex(newDefaultIndex)
        form.setValue("defaultImage", newDefaultIndex !== null ? newUrls[newDefaultIndex] : null)
      } else if (defaultImageIndex !== null && defaultImageIndex > index) {
        setDefaultImageIndex(defaultImageIndex - 1)
      }
    }
    toast.info("Upload cancelled or image removed.")
  }

  const handleFileInputChange = (e) => {
    const files = e.target.files
    if (files?.length) handleImageChange(files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) handleImageChange(e.dataTransfer.files)
  }

  const setAsDefault = (index) => {
    const images = form.getValues("images")
    if (images[index]) {
      setDefaultImageIndex(index)
      form.setValue("defaultImage", images[index])
      toast.success("Default image set!")
    }
  }

  const addFeature = () => {
    if (!currentFeature.trim()) return
    const newFeatures = [...features, currentFeature.trim()]
    setFeatures(newFeatures)
    form.setValue("features", newFeatures) // Ensure form state is updated
    setCurrentFeature("")
  }

  const removeFeature = (index) => {
    const newFeatures = features.filter((_, i) => i !== index)
    setFeatures(newFeatures)
    form.setValue("features", newFeatures) // Ensure form state is updated
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      // Get the latest form values including images and defaultImage
      // These are managed manually via form.setValue, so getValues() is crucial here.
      const formValues = form.getValues()
      const productData = {
        ...data,
        images: formValues.images, // Ensure images array is passed
        defaultImage: formValues.defaultImage, // Ensure defaultImage URL is passed
        features: features, // Ensure features array is passed
      }

      const result = await createProduct(productData)

      if (result?.success) {
        toast.success("Product created successfully")
        router.push("/dashboard/products")
      } else if (result?.error) {
        // Handle Zod field errors from server action
        Object.entries(result.error).forEach(([key, value]) => {
          if (value?._errors) {
            form.setError(key, { type: "server", message: value._errors.join(", ") })
          }
        })
        toast.error(result.message || "Failed to create product")
      } else {
        toast.error("An unknown error occurred during product creation.")
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} onChange={handleNameChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input placeholder="product-slug" {...field} />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateSlug(form.getValues("name"))}
                            disabled={isGeneratingSlug || !form.getValues("name")}
                          >
                            {isGeneratingSlug ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Price (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountedPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCategories}>
                        <FormControl>
                          <SelectTrigger>
                            {isLoadingCategories ? (
                              <span className="text-muted-foreground">Loading categories...</span>
                            ) : (
                              <SelectValue placeholder="Select a category" />
                            )}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCategories ? (
                            <div className="text-muted-foreground p-2 text-center text-sm">Loading categories...</div>
                          ) : categories.length === 0 ? (
                            <div className="text-muted-foreground p-2 text-center text-sm">No categories available</div>
                          ) : (
                            categories.map((category) => (
                              <SelectItem key={category._id} value={category._id}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="images" // This field is controlled manually, but still part of the schema
                  render={() => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Product Images (Max 5, 2MB each)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                              {imagePreviews.map((preview, index) => {
                                const isUploading = activeUploads.includes(index)
                                const progress = uploadProgress[index] || 0
                                return (
                                  <div key={index} className="relative group h-32">
                                    <img
                                      src={preview || "/placeholder.svg"}
                                      alt={`Product preview ${index + 1}`}
                                      className="w-full h-full object-cover rounded-lg border bg-gray-50"
                                    />
                                    {isUploading && (
                                      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center rounded-lg">
                                        <div className="w-4/5 bg-gray-200 rounded-full h-1.5">
                                          <div
                                            className="bg-blue-600 h-1.5 rounded-full"
                                            style={{ width: `${progress}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-white text-xs mt-2">
                                          {progress}% {progress < 100 ? "Uploading..." : "Processing..."}
                                        </span>
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => cancelUpload(index)}
                                      className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 shadow-sm transition-all"
                                    >
                                      <X className="h-4 w-4 text-gray-700" />
                                    </button>
                                    {!isUploading && (
                                      <button
                                        type="button"
                                        onClick={() => setAsDefault(index)}
                                        className={`absolute top-2 left-2 rounded-full p-1 transition-all ${
                                          defaultImageIndex === index
                                            ? "bg-yellow-400 text-yellow-800"
                                            : "bg-white/90 hover:bg-white text-gray-700"
                                        }`}
                                      >
                                        <Star className="h-4 w-4" />
                                      </button>
                                    )}
                                    {!isUploading && defaultImageIndex === index && (
                                      <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs py-1 px-2 rounded text-center">
                                        Default
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          {imagePreviews.length < 5 && (
                            <div
                              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                isDragging ? "border-primary bg-primary/5" : "border-gray-300"
                              }`}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              onClick={() => activeUploads.length === 0 && fileInputRef.current.click()}
                              style={{
                                cursor: activeUploads.length > 0 ? "wait" : "pointer",
                              }}
                            >
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileInputChange}
                                multiple
                                disabled={activeUploads.length > 0}
                              />
                              <div className="flex flex-col items-center justify-center gap-2">
                                {activeUploads.length > 0 ? (
                                  <>
                                    <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                                    <p className="text-sm font-medium text-gray-700">
                                      Uploading {activeUploads.length} image(s)...
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <UploadCloud className="h-10 w-10 text-gray-400" />
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium text-gray-700">
                                        Drag and drop images here ({5 - imagePreviews.length} remaining)
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        JPG, PNG, or WebP only • Max 2MB per image
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 bg-transparent"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        fileInputRef.current.click()
                                      }}
                                      disabled={activeUploads.length > 0}
                                    >
                                      Select Images
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter product description" className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-medium">Features</h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a feature (e.g., 'Waterproof', 'Silk', etc.)"
                        value={currentFeature}
                        onChange={(e) => setCurrentFeature(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addFeature()
                          }
                        }}
                        disabled={activeUploads.length > 0 || isSubmitting}
                      />
                      <Button
                        type="button"
                        onClick={addFeature}
                        variant="outline"
                        disabled={activeUploads.length > 0 || isSubmitting || !currentFeature.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{feature}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeature(index)}
                            className="text-red-500 hover:text-red-700"
                            disabled={activeUploads.length > 0 || isSubmitting}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={activeUploads.length > 0 || isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active Product</FormLabel>
                        <p className="text-sm text-muted-foreground">This product will be visible to customers</p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/products")}
                  disabled={isSubmitting || activeUploads.length > 0}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoadingCategories || activeUploads.length > 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Product...
                    </>
                  ) : (
                    "Create Product"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
