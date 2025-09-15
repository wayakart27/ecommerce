"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Save, Loader2, X, Plus, Minus, Star } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getProductById, updateProduct } from "@/actions/products";
import { getAllCategories } from "@/actions/categories";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateProductSchema } from "@/schemas/product";

export default function EditProductPage({ params }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const fileInputRef = useRef(null);
  const abortControllers = useRef({});

  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [currentCategoryName, setCurrentCategoryName] = useState("");
  const [productData, setProductData] = useState(null);

  // Image handling states
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [defaultImageIndex, setDefaultImageIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeUploads, setActiveUploads] = useState([]);

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [features, setFeatures] = useState([]);
  const [currentFeature, setCurrentFeature] = useState("");

  const form = useForm({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      name: "",
      slug: "",
      category: "",
      description: "",
      price: 0,
      purchasePrice: 0,
      discountedPrice: null,
      stock: 0,
      isActive: true,
      images: [],
      defaultImage: "",
      features: [],
    },
  });

  const currentCategoryId = form.watch("category");
  const priceValue = form.watch("price");
  const discountedPriceValue = form.watch("discountedPrice");
  const purchasePriceValue = form.watch("purchasePrice");
  const nameValue = form.watch("name");
  const slugValue = form.watch("slug");

  // Debug form state changes
  useEffect(() => {
    console.log("=== FORM STATE DEBUG ===");
    console.log("Form isValid:", form.formState.isValid);
    console.log("Form errors:", form.formState.errors);
    console.log("Form isSubmitting:", form.formState.isSubmitting);
    console.log("Form isSubmitted:", form.formState.isSubmitted);
    console.log("Form isDirty:", form.formState.isDirty);
    console.log("Form dirtyFields:", form.formState.dirtyFields);
  }, [form.formState]);

  // Debug image states
  useEffect(() => {
    console.log("=== IMAGE STATES DEBUG ===");
    console.log("Image previews:", imagePreviews);
    console.log("Upload progress:", uploadProgress);
    console.log("Default image index:", defaultImageIndex);
    console.log("Active uploads:", activeUploads);
    console.log("Is dragging:", isDragging);
  }, [
    imagePreviews,
    uploadProgress,
    defaultImageIndex,
    activeUploads,
    isDragging,
  ]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
      Object.values(abortControllers.current).forEach((controller) =>
        controller.abort()
      );
    };
  }, [imagePreviews]);

  // Generate slug when name changes
  useEffect(() => {
    if (nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
      form.setValue("slug", slug);
    }
  }, [nameValue, form.setValue]);

  const addFeature = () => {
    if (currentFeature.trim() === "") return;
    const newFeatures = [...features, currentFeature.trim()];
    setFeatures(newFeatures);
    form.setValue("features", newFeatures);
    setCurrentFeature("");
    console.log("Feature added:", currentFeature.trim());
  };

  const removeFeature = (index) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
    form.setValue("features", newFeatures);
    console.log("Feature removed at index:", index);
  };

  // Fetch product data and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching product data for ID:", unwrappedParams.id);
        const [product, categoriesResponse] = await Promise.all([
          getProductById(unwrappedParams.id),
          getAllCategories(),
        ]);

        console.log("Categories response:", categoriesResponse);
        console.log("Product response:", product);

        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        } else {
          toast.error("Failed to load categories");
        }

        if (product) {
          setProductData(product);
          const currentCategory = categoriesResponse.data?.find(
            (cat) => cat._id === product.category?._id
          );

          // Fix: Properly serialize images to ensure consistent format
          const serializedImages = product.images?.map((img) => {
            // Handle both string URLs and image objects from API
            if (typeof img === 'string') {
              return { url: img, alt: "", isPrimary: false };
            }
            return {
              url: img.url || "",
              alt: img.alt || "",
              isPrimary: img.isPrimary || false,
            };
          }) || [];

          // Fix: Handle defaultImage consistently
          let serializedDefaultImage = null;
          if (product.defaultImage) {
            if (typeof product.defaultImage === 'string') {
              serializedDefaultImage = { url: product.defaultImage, alt: "" };
            } else {
              serializedDefaultImage = {
                url: product.defaultImage.url || "",
                alt: product.defaultImage.alt || "",
              };
            }
          }

          console.log("Serialized images:", serializedImages);
          console.log("Serialized default image:", serializedDefaultImage);

          // Set image previews to actual image URLs, not blob URLs
          const previewUrls = serializedImages.map(img => img.url);
          setImagePreviews(previewUrls);

          // Set all form values at once to prevent multiple re-renders
          form.reset({
            name: product.name || "",
            slug: product.slug || "",
            category: product.category?._id || "",
            description: product.description || "",
            price: product.price || 0,
            purchasePrice: product.purchasePrice || 0,
            discountedPrice: product.discountedPrice || null,
            stock: product.stock || 0,
            isActive: product.isActive ?? true,
            features: product.features || [],
            images: serializedImages,
            defaultImage: serializedDefaultImage?.url || null,
          });

          setFeatures(product.features || []);

          // Set default image index
          if (serializedDefaultImage) {
            const defaultIdx = serializedImages.findIndex(
              (img) => img.url === serializedDefaultImage.url
            );
            setDefaultImageIndex(defaultIdx !== -1 ? defaultIdx : 0);
          } else if (serializedImages.length > 0) {
            setDefaultImageIndex(0);
          } else {
            setDefaultImageIndex(null);
          }

          if (currentCategory) {
            setCurrentCategoryName(currentCategory.name);
          }

          console.log("Form reset completed successfully");
        }
      } catch (error) {
        console.error("Failed to load product data:", error);
        toast.error("Failed to load product data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [unwrappedParams.id, form]);

  useEffect(() => {
    if (currentCategoryId && categories.length > 0) {
      const selectedCategory = categories.find(
        (cat) => cat._id === currentCategoryId
      );
      if (selectedCategory) {
        setCurrentCategoryName(selectedCategory.name);
      }
    }
  }, [currentCategoryId, categories]);

  // --- Image Upload Logic ---
  const uploadToCloudinary = async (file, index) => {
    const MAX_SIZE = 2 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Only JPG, PNG, and WebP images are allowed");
    }
    if (file.size > MAX_SIZE) {
      throw new Error(
        `Image exceeds 2MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
      );
    }

    const controller = new AbortController();
    abortControllers.current[index] = controller;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      return await response.json();
    } catch (error) {
      if (error.name !== "AbortError") {
        throw error;
      }
      return null;
    } finally {
      delete abortControllers.current[index];
    }
  };

  const handleImageChange = async (files) => {
    console.log("Handling image change, files:", files);
    const filesArray = Array.from(files).slice(0, 5 - imagePreviews.length);
    console.log("Files to process:", filesArray);

    try {
      const newPreviews = [];
      const validFilesToUpload = [];
      filesArray.forEach((file) => {
        try {
          if (file.size > 2 * 1024 * 1024) {
            throw new Error(`${file.name}: Exceeds 2MB limit`);
          }
          if (!file.type.startsWith("image/")) {
            throw new Error(`${file.name}: Not an image file`);
          }
          const preview = URL.createObjectURL(file);
          newPreviews.push(preview);
          validFilesToUpload.push(file);
        } catch (error) {
          toast.error(error.message);
        }
      });

      const updatedPreviews = [...imagePreviews, ...newPreviews].slice(0, 5);
      setImagePreviews(updatedPreviews);

      const uploadPromises = validFilesToUpload.map(async (file, index) => {
        const globalIndex = imagePreviews.length + index;
        setActiveUploads((prev) => [...prev, globalIndex]);
        try {
          for (let progress = 0; progress <= 90; progress += 10) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            if (abortControllers.current[globalIndex]?.signal.aborted) break;
            setUploadProgress((prev) => ({ ...prev, [globalIndex]: progress }));
          }
          if (abortControllers.current[globalIndex]?.signal.aborted) {
            return null;
          }

          const result = await uploadToCloudinary(file, globalIndex);
          setUploadProgress((prev) => ({ ...prev, [globalIndex]: 100 }));
          return result.secure_url;
        } catch (error) {
          if (error.name !== "AbortError") {
            toast.error(`Failed to upload ${file.name}: ${error.message}`);
          }
          return null;
        } finally {
          setActiveUploads((prev) => prev.filter((i) => i !== globalIndex));
        }
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean);
      console.log("Uploaded URLs:", uploadedUrls);

      const currentImages = form.getValues("images");
      // Ensure we're working with objects, not strings
      const allImages = [
        ...currentImages, 
        ...uploadedUrls.map(url => ({ url, alt: "", isPrimary: false }))
      ].slice(0, 5);
      
      console.log("All images after upload:", allImages);

      form.setValue("images", allImages);

      if (defaultImageIndex === null && uploadedUrls.length > 0) {
        const newDefaultIndex = currentImages.length;
        setDefaultImageIndex(newDefaultIndex);
        form.setValue("defaultImage", allImages[newDefaultIndex].url);
      }
    } catch (error) {
      console.error("Image processing error:", error);
    }
  };

  const cancelUpload = (index) => {
    console.log("Cancelling upload at index:", index);
    if (abortControllers.current[index]) {
      abortControllers.current[index].abort();
      delete abortControllers.current[index];
    }

    // Remove preview
    const previewToRemove = imagePreviews[index];
    if (previewToRemove && previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove);
    }
    
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });

    // Update form images array
    const currentImages = form.getValues("images");
    if (index < currentImages.length) {
      const newImages = currentImages.filter((_, i) => i !== index);
      form.setValue("images", newImages);

      // Adjust default image index if the removed image was default or before it
      if (defaultImageIndex === index) {
        const newDefaultIndex = newImages.length > 0 ? 0 : null;
        setDefaultImageIndex(newDefaultIndex);
        form.setValue(
          "defaultImage",
          newDefaultIndex !== null ? newImages[newDefaultIndex].url : null
        );
      } else if (defaultImageIndex !== null && defaultImageIndex > index) {
        setDefaultImageIndex(defaultImageIndex - 1);
      }
    }
    toast.info("Upload cancelled or image removed.");
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    console.log("File input changed, files:", files);
    if (files?.length) handleImageChange(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleImageChange(e.dataTransfer.files);
  };

  const setAsDefault = (index) => {
    console.log("Setting default image at index:", index);
    const images = form.getValues("images");
    if (images[index]) {
      setDefaultImageIndex(index);
      // Ensure we're setting the URL, not the object
      const defaultImageUrl = typeof images[index] === 'string' 
        ? images[index] 
        : images[index].url;
      form.setValue("defaultImage", defaultImageUrl);
      toast.success("Default image set!");
    }
  };

  const onSubmit = async (data) => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form data received:", data);
    setIsSubmittingForm(true);

    try {
      const finalDiscountedPrice =
        data.discountedPrice === null || data.discountedPrice === 0
          ? undefined
          : data.discountedPrice;

      console.log("Final discounted price:", finalDiscountedPrice);

      const isDiscountedPriceValid =
        finalDiscountedPrice === undefined ||
        Number.parseFloat(finalDiscountedPrice.toFixed(2)) <=
          Number.parseFloat(data.price.toFixed(2));
      const isPurchasePriceValid =
        Number.parseFloat(data.purchasePrice.toFixed(2)) <=
        Number.parseFloat(data.price.toFixed(2));

      console.log("Price validation:", {
        discountedPriceValid: isDiscountedPriceValid,
        purchasePriceValid: isPurchasePriceValid,
        price: data.price,
        discountedPrice: data.discountedPrice,
        purchasePrice: data.purchasePrice,
      });

      if (!isDiscountedPriceValid) {
        console.log("Discounted price validation failed");
        toast.error("Selling price cannot be greater than market price");
        return;
      }
      if (!isPurchasePriceValid) {
        console.log("Purchase price validation failed");
        toast.error("Purchase price cannot be greater than market price");
        return;
      }

      // Get the latest form values including images and defaultImage
      const formValues = form.getValues();
      console.log("Form values from getValues():", formValues);

      // Fix: Ensure images are properly formatted as objects
      const formattedImages = formValues.images.map(img => {
        // If image is already an object, use it as is
        if (typeof img === 'object' && img !== null) {
          return {
            url: img.url,
            alt: img.alt || '',
            isPrimary: img.isPrimary || false
          };
        }
        // If image is a string (URL), convert to object
        return {
          url: img,
          alt: '',
          isPrimary: false
        };
      });

      const productData = {
        ...data,
        images: formattedImages,
        defaultImage: data.defaultImage || null,
        features,
        discountedPrice: finalDiscountedPrice,
      };

      console.log("Final product data being sent to API:", productData);

      const result = await updateProduct(unwrappedParams.id, productData);
      console.log("API response:", result);

      if (result.success) {
        console.log("Product update successful");
        toast.success("Product updated successfully");
        router.push("/dashboard/products");
      } else {
        console.log("Product update failed:", result);
        // Handle Zod field errors from server action
        if (result.error && typeof result.error === "object") {
          Object.entries(result.error).forEach(([key, value]) => {
            if (value?._errors) {
              form.setError(key, {
                type: "server",
                message: value._errors.join(", "),
              });
            }
          });
        }
        toast.error(result.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Submission error:", error);
      console.error("Error details:", error.message, error.stack);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmittingForm(false);
      console.log("=== FORM SUBMISSION COMPLETED ===");
    }
  };

  const handleDebugClick = () => {
    console.log("=== DEBUG INFORMATION ===");
    console.log("Form values:", form.getValues());
    console.log("Form errors:", form.formState.errors);
    console.log("Form isValid:", form.formState.isValid);
    console.log("Features state:", features);
    console.log("Image previews:", imagePreviews);
    console.log("Active uploads:", activeUploads);
    console.log("Default image index:", defaultImageIndex);
    console.log("Current category ID:", currentCategoryId);
    console.log("Categories:", categories);
    console.log("Product data:", productData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Loading product data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <Button variant="outline" onClick={handleDebugClick}>
          Debug Info
        </Button>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              Update the details of this product.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="Product slug"
                  {...form.register("slug")}
                  value={slugValue}
                  readOnly
                  className="bg-gray-100"
                />
                {form.formState.errors.slug && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.slug.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                {currentCategoryName && (
                  <p className="text-sm text-muted-foreground">
                    Current category:{" "}
                    <span className="font-medium">{currentCategoryName}</span>
                  </p>
                )}
                <Select
                  onValueChange={(value) => {
                    form.setValue("category", value);
                    const selectedCategory = categories.find(
                      (cat) => cat._id === value
                    );
                    if (selectedCategory) {
                      setCurrentCategoryName(selectedCategory.name);
                    }
                  }}
                  value={form.watch("category")}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.category.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                {...form.register("description")}
                rows={4}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Market Price (₦)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...form.register("price", {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price (₦)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...form.register("purchasePrice", {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.purchasePrice && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.purchasePrice.message}
                  </p>
                )}
                {purchasePriceValue > priceValue && (
                  <p className="text-sm text-red-500">
                    Purchase price cannot be greater than market price
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Selling Price (₦)</Label>
                <Input
                  id="discountedPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...form.register("discountedPrice", {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.discountedPrice && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.discountedPrice.message}
                  </p>
                )}
                {discountedPriceValue > priceValue && (
                  <p className="text-sm text-red-500">
                    Selling price cannot be greater than market price
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...form.register("stock", {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.stock && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.stock.message}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 md:col-span-3">
                <Checkbox
                  id="isActive"
                  {...form.register("isActive")}
                  onCheckedChange={(checked) =>
                    form.setValue("isActive", checked)
                  }
                  checked={form.watch("isActive")}
                />
                <Label htmlFor="isActive">Active Product</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a feature (e.g., 'Waterproof', 'Silk', etc.)"
                  value={currentFeature}
                  onChange={(e) => setCurrentFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addFeature}
                  variant="outline"
                  className="shrink-0 bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span>{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {/* Multi-image upload section */}
            <div className="space-y-2">
              <Label>Product Images (Max 5, 2MB each)</Label>
              <div className="space-y-4">
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {imagePreviews.map((preview, index) => {
                      const isUploading = activeUploads.includes(index);
                      const progress = uploadProgress[index] || 0;
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
                                {progress}%{" "}
                                {progress < 100
                                  ? "Uploading..."
                                  : "Processing..."}
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
                      );
                    })}
                  </div>
                )}
                {imagePreviews.length < 5 && (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-gray-300"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() =>
                      activeUploads.length === 0 && fileInputRef.current.click()
                    }
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
                              Drag and drop images here (
                              {5 - imagePreviews.length} remaining)
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
                              e.stopPropagation();
                              fileInputRef.current.click();
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
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/dashboard/products")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingForm || activeUploads.length > 0}
              onClick={() => {
                console.log("Save button clicked - disabled state:", {
                  isSubmittingForm,
                  activeUploads: activeUploads.length,
                  disabled: isSubmittingForm || activeUploads.length > 0,
                });
              }}
            >
              {isSubmittingForm ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Save
                  Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}