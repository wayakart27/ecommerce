"use server";

import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import Products from "@/model/Products";
import Category from "@/model/Category";
import { CreateProductSchema, UpdateProductSchema } from "@/schemas/product";
import { revalidatePath } from "next/cache";
import User from "@/model/User";
import { sendNewArrivalsEmail } from "@/lib/mail";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary properly (server-side only)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function createProduct(formData) {
  await dbConnect();

  try {
    // Input validation
    if (!formData || typeof formData !== "object") {
      return {
        success: false,
        error: {
          _form: {
            _errors: ["Invalid form data"],
          },
        },
        message: "Invalid form data",
      };
    }

    // Generate unique product ID
    const generateProductId = () => {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      return `PRD-${randomNum}`;
    };

    // Generate slug from product name
    const generateSlug = (name) => {
      if (!name || typeof name !== "string") {
        throw new Error("Product name is required");
      }
      return name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    };

    // Prepare images array with proper object structure
    const images = Array.isArray(formData.images)
      ? formData.images.map((img, index) => ({
          url: typeof img === "object" ? img.url : img,
          alt:
            typeof img === "object"
              ? img.alt || `Product image ${index + 1}`
              : `Product image ${index + 1}`,
          isPrimary: typeof img === "object" ? img.isPrimary || false : false,
        }))
      : [];

    // Prepare defaultImage object
    const defaultImage = formData.defaultImage
      ? {
          url:
            typeof formData.defaultImage === "object"
              ? formData.defaultImage.url
              : formData.defaultImage,
          alt:
            typeof formData.defaultImage === "object"
              ? formData.defaultImage.alt || "Default product image"
              : "Default product image",
        }
      : null;

    // Prepare data with proper type conversion
    const data = {
      ...formData,
      productId: formData.productId || generateProductId(),
      price: Number(formData.price),
      purchasePrice: Number(formData.purchasePrice),
      discountedPrice: formData.discountedPrice
        ? Number(formData.discountedPrice)
        : null,
      stock: parseInt(formData.stock, 10),
      features: Array.isArray(formData.features) ? formData.features : [],
      slug: formData.slug || generateSlug(formData.name),
      isActive:
        formData.isActive !== undefined ? Boolean(formData.isActive) : true,
      isNew: formData.isNew !== undefined ? Boolean(formData.isNew) : false,
      tags: Array.isArray(formData.tags) ? formData.tags : [],
      images: images,
      defaultImage: defaultImage,
    };

    // Validate pricing
    if (data.discountedPrice && data.discountedPrice > data.price) {
      return {
        success: false,
        error: {
          discountedPrice: {
            _errors: ["Discounted price cannot be greater than regular price"],
          },
        },
        message: "Discounted price cannot be greater than regular price",
      };
    }

    if (data.purchasePrice > data.price) {
      return {
        success: false,
        error: {
          purchasePrice: {
            _errors: ["Purchase price cannot be greater than selling price"],
          },
        },
        message: "Purchase price cannot be greater than selling price",
      };
    }

    // Check if category exists
    const categoryExists = await Category.findById(data.category).lean();
    if (!categoryExists) {
      return {
        success: false,
        error: {
          category: {
            _errors: ["Selected category does not exist"],
          },
        },
        message: "Selected category does not exist",
      };
    }

    // Check for duplicate name
    const existingProductByName = await Products.findOne({
      name: { $regex: new RegExp(`^${data.name}$`, "i") },
    }).lean();

    if (existingProductByName) {
      return {
        success: false,
        error: {
          name: {
            _errors: ["Product with this name already exists"],
          },
        },
        message: "Product with this name already exists",
      };
    }

    // Generate unique slug
    let slug = data.slug;
    let slugExists = await Products.findOne({ slug }).lean();
    let slugCounter = 1;

    while (slugExists) {
      slug = `${data.slug}-${slugCounter}`;
      slugExists = await Products.findOne({ slug }).lean();
      slugCounter++;
    }

    // Create product
    const newProduct = await Products.create({
      ...data,
      productId: data.productId,
      slug,
      category: new mongoose.Types.ObjectId(data.category),
      images: data.images,
      defaultImage: data.defaultImage,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Populate the category to get the full category data
    const populatedProduct = await Products.findById(newProduct._id)
      .populate("category", "name status")
      .lean();

    // Serialize the product using your pattern
    const serializedProduct = {
      ...populatedProduct,
      _id: populatedProduct._id.toString(),
      id: populatedProduct._id.toString(),
      category: populatedProduct.category
        ? {
            ...populatedProduct.category,
            _id: populatedProduct.category._id.toString(),
          }
        : null,
      createdAt:
        populatedProduct.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt:
        populatedProduct.updatedAt?.toISOString() || new Date().toISOString(),
      purchasePrice: populatedProduct.purchasePrice || 0,
      // Handle images safely
      images:
        populatedProduct.images?.map((img) => ({
          ...img,
          // Remove any Mongoose-specific properties from images
          _id: img._id?.toString() || "",
        })) || [],
      defaultImage: populatedProduct.defaultImage
        ? {
            ...populatedProduct.defaultImage,
            // Remove any Mongoose-specific properties from defaultImage
            _id: populatedProduct.defaultImage._id?.toString() || "",
          }
        : null,
    };

    // Remove any Mongoose-specific properties
    delete serializedProduct.__v;
    delete serializedProduct.$__;
    delete serializedProduct._doc;

    // Revalidate paths
    revalidatePath("/dashboard/products");
    revalidatePath("/products");

    return {
      success: true,
      data: serializedProduct,
    };
  } catch (error) {
    console.error("Create product error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = {
          _errors: [error.errors[key].message],
        };
      });

      return {
        success: false,
        error: errors,
        message: "Validation failed",
      };
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return {
        success: false,
        error: {
          [field]: {
            _errors: [`${field} already exists`],
          },
        },
        message: "Duplicate entry found",
      };
    }

    // Generic error
    return {
      success: false,
      error: {
        _form: {
          _errors: [error.message || "Failed to create product"],
        },
      },
      message: error.message || "Failed to create product",
    };
  }
}

export async function getProducts(
  page = 1,
  limit = 10,
  search = "",
  category = ""
) {
  await dbConnect();

  const skip = (page - 1) * limit;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { "category.name": { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    query.category = category;
  }

  const total = await Products.countDocuments(query);

  const products = await Products.find(query)
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Serialize the products with proper error handling
  const serializedProducts = products.map((product) => {
    const serialized = {
      ...product,
      _id: product._id.toString(),
      category: product.category
        ? {
            ...product.category,
            _id: product.category._id.toString(),
          }
        : null,
      // Safely handle createdAt and updatedAt
      createdAt: product.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
      purchasePrice: product.purchasePrice || 0,
      // Handle images if they exist in the product
      images:
        product.images?.map((img) => ({
          ...img,
          data: img.data?.toString("base64") || "",
          _id: img._id?.toString() || "",
        })) || [],
      defaultImage: product.defaultImage
        ? {
            ...product.defaultImage,
            data: product.defaultImage.data?.toString("base64") || "",
            _id: product.defaultImage._id?.toString() || "",
          }
        : null,
    };

    // Remove any Mongoose-specific properties that might have leaked through
    delete serialized.__v;
    delete serialized.$__;
    delete serialized._doc;

    return serialized;
  });

  return {
    products: serializedProducts,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    },
  };
}

export async function getAllProducts(
  page = 1,
  limit = 10,
  search = "",
  category = ""
) {
  await dbConnect();

  const skip = (page - 1) * limit;
  const query = {};

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { "category.name": { $regex: search, $options: "i" } },
    ];
  }

  // Category filter - fixed to properly handle category filtering
  if (category && category !== "all") {
    query.category = category; // This assumes category is stored as ObjectId in products
  }

  try {
    const [total, products] = await Promise.all([
      Products.countDocuments(query),
      Products.find(query)
        .populate({
          path: "category",
          select: "name _id",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Simplified serialization
    const serializedProducts = products.map((product) => ({
      ...product,
      _id: product._id.toString(),
      category: product.category
        ? {
            _id: product.category._id.toString(),
            name: product.category.name,
          }
        : null,
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
      images:
        product.images?.map((img) => ({
          ...img,
          _id: img._id?.toString(),
        })) || [],
    }));

    return {
      products: serializedProducts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  } catch (error) {
    console.error("Error in getProducts:", error);
    throw error;
  }
}
export async function updateProduct(id, formData) {
  await dbConnect();

  try {
    console.log("Updating product with ID:", id);
    console.log("Form data received:", formData);

    // Generate slug from product name if name is being updated
    const generateSlug = (name) => {
      if (!name) return "";
      return name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    };

    // Manual validation checks
    const errors = {};

    // Validate required fields
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = {
        _errors: ["Product name must be at least 2 characters"],
      };
    }

    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = {
        _errors: ["Description must be at least 10 characters"],
      };
    }

    // Validate prices
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      errors.price = {
        _errors: ["Price must be a positive number"],
      };
    }

    const purchasePrice = parseFloat(formData.purchasePrice);
    if (isNaN(purchasePrice) || purchasePrice <= 0) {
      errors.purchasePrice = {
        _errors: ["Purchase price must be a positive number"],
      };
    }

    let discountedPrice = null;
    if (formData.discountedPrice && formData.discountedPrice !== "") {
      discountedPrice = parseFloat(formData.discountedPrice);
      if (isNaN(discountedPrice) || discountedPrice < 0) {
        errors.discountedPrice = {
          _errors: ["Discounted price must be a non-negative number"],
        };
      }
    }

    // Validate stock
    const stock = parseInt(formData.stock, 10);
    if (isNaN(stock) || stock < 0) {
      errors.stock = {
        _errors: ["Stock must be a non-negative integer"],
      };
    }

    // Validate images - convert to proper object structure for MongoDB
    let images = [];
    if (Array.isArray(formData.images)) {
      images = formData.images
        .map((img, index) => {
          if (typeof img === "string") {
            // If it's already a string URL, create an object
            return {
              url: img,
              alt: `Product image ${index + 1}`,
              isPrimary: false,
            };
          } else if (typeof img === "object" && img.url) {
            // If it's already an object, ensure it has all required fields
            return {
              url: img.url || "",
              alt: img.alt || `Product image ${index + 1}`,
              isPrimary: img.isPrimary || false,
            };
          }
          return null;
        })
        .filter((img) => img !== null && img.url && img.url.trim() !== "");
    }

    if (images.length > 10) {
      errors.images = {
        _errors: ["Cannot have more than 10 images"],
      };
    }

    // Validate defaultImage - convert to proper object structure
    let defaultImage = null;
    if (formData.defaultImage) {
      if (typeof formData.defaultImage === "string") {
        // Find the corresponding image object
        const defaultImg = images.find(
          (img) => img.url === formData.defaultImage
        );
        if (defaultImg) {
          defaultImage = {
            url: defaultImg.url,
            alt: defaultImg.alt || "Default product image",
          };
        }
      } else if (
        typeof formData.defaultImage === "object" &&
        formData.defaultImage.url
      ) {
        defaultImage = {
          url: formData.defaultImage.url,
          alt: formData.defaultImage.alt || "Default product image",
        };
      }

      if (defaultImage && !images.some((img) => img.url === defaultImage.url)) {
        errors.defaultImage = {
          _errors: ["Default image must be one of the product images"],
        };
      }
    }

    // Validate category
    if (!formData.category) {
      errors.category = {
        _errors: ["Category is required"],
      };
    }

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      return {
        success: false,
        error: errors,
        message: "Validation failed",
      };
    }

    // Price comparisons
    if (purchasePrice > price) {
      return {
        success: false,
        error: {
          purchasePrice: {
            _errors: ["Purchase price cannot be greater than selling price"],
          },
        },
        message: "Purchase price cannot be greater than selling price",
      };
    }

    if (discountedPrice !== null && discountedPrice > price) {
      return {
        success: false,
        error: {
          discountedPrice: {
            _errors: ["Discounted price cannot be greater than regular price"],
          },
        },
        message: "Discounted price cannot be greater than regular price",
      };
    }

    // Find existing product
    const existingProduct = await Products.findById(id);
    if (!existingProduct) {
      return {
        success: false,
        error: {
          _form: {
            _errors: ["Product not found"],
          },
        },
        message: "Product not found",
      };
    }

    // Validate category exists
    const category = await Category.findById(formData.category);
    if (!category) {
      return {
        success: false,
        error: {
          category: {
            _errors: ["Selected category does not exist"],
          },
        },
        message: "Selected category does not exist",
      };
    }

    // Validate name uniqueness if changed
    if (formData.name && formData.name !== existingProduct.name) {
      const productWithSameName = await Products.findOne({
        name: { $regex: new RegExp(`^${formData.name}$`, "i") },
        _id: { $ne: id },
      });
      if (productWithSameName) {
        return {
          success: false,
          error: {
            name: {
              _errors: ["Product with this name already exists"],
            },
          },
          message: "Product with this name already exists",
        };
      }
    }

    // Handle slug uniqueness if changed
    let finalSlug = formData.slug || generateSlug(formData.name);
    if (finalSlug && finalSlug !== existingProduct.slug) {
      let slugExists = await Products.findOne({
        slug: finalSlug,
        _id: { $ne: id },
      });

      let slugCounter = 1;
      while (slugExists) {
        finalSlug = `${generateSlug(formData.name)}-${slugCounter}`;
        slugExists = await Products.findOne({
          slug: finalSlug,
          _id: { $ne: id },
        });
        slugCounter++;
      }
    }

    // Prepare update fields - ensure images are in the correct object format
    const updateFields = {
      name: formData.name,
      slug: finalSlug,
      description: formData.description,
      price: parseFloat(price.toFixed(2)),
      purchasePrice: parseFloat(purchasePrice.toFixed(2)),
      discountedPrice:
        discountedPrice !== null
          ? parseFloat(discountedPrice.toFixed(2))
          : null,
      stock,
      isActive:
        formData.isActive !== undefined
          ? formData.isActive
          : existingProduct.isActive,
      features: Array.isArray(formData.features)
        ? formData.features
        : existingProduct.features,
      images: images, // This should now be an array of objects
      defaultImage: defaultImage, // This should be an object with url and alt
      category: new mongoose.Types.ObjectId(formData.category),
      updatedAt: new Date(),
    };

    console.log("Update fields:", updateFields);

    // Update product
    const updatedProduct = await Products.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
      }
    ).populate("category", "name status");

    if (!updatedProduct) {
      return {
        success: false,
        error: {
          _form: {
            _errors: ["Failed to update product"],
          },
        },
        message: "Failed to update product",
      };
    }
    // Serialize the response properly - ensure all _id fields are converted to strings
    const serializedProduct = {
      _id: updatedProduct._id.toString(),
      id: updatedProduct._id.toString(),
      name: updatedProduct.name,
      slug: updatedProduct.slug,
      description: updatedProduct.description,
      price: updatedProduct.price,
      purchasePrice: updatedProduct.purchasePrice || 0,
      discountedPrice: updatedProduct.discountedPrice || null,
      // Properly serialize images array
      images:
        updatedProduct.images?.map((img) => ({
          url: img.url || "",
          alt: img.alt || "",
          isPrimary: img.isPrimary || false,
          // Convert _id to string if it exists
          _id: img._id ? img._id.toString() : undefined,
          id: img._id ? img._id.toString() : undefined,
        })) || [],
      // Properly serialize defaultImage
      defaultImage: updatedProduct.defaultImage
        ? {
            url: updatedProduct.defaultImage.url || "",
            alt: updatedProduct.defaultImage.alt || "",
            // Convert _id to string if it exists
            _id: updatedProduct.defaultImage._id
              ? updatedProduct.defaultImage._id.toString()
              : undefined,
            id: updatedProduct.defaultImage._id
              ? updatedProduct.defaultImage._id.toString()
              : undefined,
          }
        : null,
      stock: updatedProduct.stock || 0,
      isActive: updatedProduct.isActive ?? true,
      features: updatedProduct.features || [],
      category: updatedProduct.category
        ? {
            _id: updatedProduct.category._id.toString(),
            name: updatedProduct.category.name,
            status: updatedProduct.category.status,
          }
        : null,
      createdAt: updatedProduct.createdAt
        ? updatedProduct.createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: updatedProduct.updatedAt
        ? updatedProduct.updatedAt.toISOString()
        : new Date().toISOString(),
    };

    // Remove any Mongoose-specific properties that might cause circular references
    const cleanSerializedProduct = JSON.parse(
      JSON.stringify(serializedProduct, (key, value) => {
        // Remove any properties that might contain Mongoose internals
        if (
          key === "__v" ||
          key === "$__" ||
          key === "_doc" ||
          key === "$isNew"
        ) {
          return undefined;
        }
        return value;
      })
    );

    console.log("Cleaned serialized product response:", cleanSerializedProduct);

    // Revalidate paths
    const pathsToRevalidate = [
      `/dashboard/products/edit/${id}`,
      "/dashboard/products",
      `/products/${existingProduct.slug}`,
      "/products",
    ];

    if (finalSlug && finalSlug !== existingProduct.slug) {
      pathsToRevalidate.push(`/products/${finalSlug}`);
    }

    try {
      await Promise.all(pathsToRevalidate.map((path) => revalidatePath(path)));
    } catch (revalidateError) {
      console.error("Revalidation error:", revalidateError);
      // Don't fail the whole operation if revalidation fails
    }

    return {
      success: true,
      data: serializedProduct,
      message: "Product updated successfully",
    };
  } catch (error) {
    console.error("Update product error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = {
          _errors: [error.errors[key].message],
        };
      });

      return {
        success: false,
        error: errors,
        message: "Validation failed",
      };
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return {
        success: false,
        error: {
          [field]: {
            _errors: [`${field} already exists`],
          },
        },
        message: "Duplicate entry found",
      };
    }

    return {
      success: false,
      error: {
        _form: {
          _errors: [error.message || "Failed to update product"],
        },
      },
      message: error.message || "Failed to update product",
    };
  }
}
export async function getProductById(id) {
  await dbConnect();

  try {
    const product = await mongoose
      .model("Product")
      .findOne({
        _id: id,
      })
      .populate("category", "name _id")
      .lean({ virtuals: true });

    if (!product) {
      console.log(`Product ${id} not found`);
      return null;
    }

    // Convert all Buffer objects to strings in images array
    const images = (product.images || []).map(image => ({
      url: image.url || "",
      alt: image.alt || "",
      isPrimary: image.isPrimary || false,
      // Convert _id Buffer to string if it exists
      _id: image._id ? image._id.toString() : null
    }));

    // Extract just the URL from defaultImage object
    const defaultImageUrl = product.defaultImage?.url || 
                           (images.length > 0 ? images[0].url : null);

    return {
      _id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      purchasePrice: product.purchasePrice || 0,
      discountedPrice: product.discountedPrice || null,
      images: images, // Now with all Buffer objects converted to strings
      defaultImage: defaultImageUrl, // Now just the URL string
      features: product.features || [],
      stock: product.stock || 0,
      isActive: product.isActive ?? true,
      category: product.category
        ? {
            _id: product.category._id.toString(),
            name: product.category.name,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}
export async function getProductBySlugAndId(slug, productId) {
  await dbConnect();

  try {
    const product = await mongoose
      .model("Product")
      .findOne({ productId, slug })
      .populate("category", "name _id")
      .lean({ virtuals: true });

    if (!product) {
      console.log(`Product with slug ${slug} and ID ${productId} not found`);
      return null;
    }

    // Convert images into plain objects
    const images = (product.images || []).map((image) => ({
      url: image.url || "",
      alt: image.alt || "",
      isPrimary: !!image.isPrimary,
      _id: image._id ? image._id.toString() : null,
    }));

    // Default image should be a URL string (not object) to match your Zod schema
    const defaultImage = product.defaultImage || (images[0]?.url ?? null);

    return {
      _id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      purchasePrice: product.purchasePrice || 0,
      discountedPrice: product.discountedPrice || null,
      images, // ✅ plain array of objects
      defaultImage, // ✅ plain string URL
      features: product.features || [],
      stock: product.stock || 0,
      isActive: product.isActive ?? true,
      category: product.category
        ? {
            _id: product.category._id.toString(),
            name: product.category.name,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}


export async function deleteProduct(id) {
  await dbConnect();

  try {
    const product = await Products.findById(id);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Verify Cloudinary configuration
    if (!cloudinary.config().api_key) {
      throw new Error("Cloudinary API key is not configured");
    }

    // Delete images from Cloudinary if they exist
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(async (imageUrl) => {
        try {
          // Extract public_id correctly (remove version number if present)
          const url = new URL(imageUrl);
          const pathParts = url.pathname.split("/");
          const uploadIndex = pathParts.indexOf("upload");

          if (uploadIndex === -1) {
            console.warn("Invalid Cloudinary URL:", imageUrl);
            return;
          }

          // Get parts after 'upload' and remove file extension
          const publicIdParts = pathParts.slice(uploadIndex + 1);
          let publicId = publicIdParts.join("/");

          // Remove version number if present (v123456789)
          if (/^v\d+/.test(publicIdParts[0])) {
            publicId = publicIdParts.slice(1).join("/");
          }

          // Remove file extension
          publicId = publicId.split(".")[0];

          const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true,
            resource_type: "image",
          });

          if (result.result !== "ok") {
            console.warn("Failed to delete image:", publicId, result);
          }
          return result;
        } catch (err) {
          console.error("Error deleting image:", imageUrl, err);
          return null;
        }
      });

      await Promise.all(deletePromises);
    }

    // Delete the product from database
    await Products.findByIdAndDelete(id);

    // Revalidate paths
    revalidatePath("/dashboard/products");
    revalidatePath(`/products/${product.slug}`);

    return { success: true };
  } catch (error) {
    console.error("Delete product error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete product",
    };
  }
}

export async function getAllProductsGroupedByCategory(
  page = 1,
  limit = 5,
  categoryFilter = "all",
  categoriesOnly = false
) {
  await dbConnect();

  // If only fetching categories and counts, return early
  if (categoriesOnly) {
    const categories = await getActiveCategories();
    const totalCounts = await getTotalCounts();

    return {
      products: [],
      categories,
      totalCounts,
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
      },
    };
  }

  try {
    const skip = (page - 1) * limit;

    // Build the base query for active products with active categories
    const baseQuery = {
      isActive: true,
    };

    // If filtering by specific category, add category filter
    if (categoryFilter !== "all") {
      // First find the category by slug
      const category = await Category.findOne({
        name: new RegExp(categoryFilter.replace("-", " "), "i"),
        status: "Active",
      }).lean();

      if (category) {
        baseQuery.category = category._id;
      } else {
        // If category not found, return empty results
        return {
          products: [],
          categories: await getActiveCategories(),
          totalCounts: await getTotalCounts(),
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
          },
        };
      }
    }

    // Find products with the query
    const products = await Products.find(baseQuery)
      .populate({
        path: "category",
        select: "name status",
        model: Category,
        match: { status: "Active" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter out products with inactive categories
    const validProducts = products.filter(
      (product) => product.category && product.category.status === "Active"
    );

    // Serialize the data for client-side use - FIXED IMAGE HANDLING
    const serialized = validProducts.map((product) => {
      // Handle defaultImage - extract URL if it's an object
      let defaultImageUrl = "/placeholder.png";
      if (product.defaultImage) {
        if (typeof product.defaultImage === 'string') {
          defaultImageUrl = product.defaultImage;
        } else if (product.defaultImage.url) {
          defaultImageUrl = product.defaultImage.url;
        }
      }

      return {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        discountedPrice: product.discountedPrice || null,
        defaultImage: defaultImageUrl, // Now always a string URL
        category: product.category.name,
        stock: product.stock,
        isNew: product.isNew || false,
        features: product.features || [],
        createdAt: product.createdAt,
        slug: product.slug,
        productId: product.productId,
      };
    });

    // Get total count for the current filter
    const totalCount = await Products.countDocuments(baseQuery);

    // Get categories and total counts
    const categories = await getActiveCategories();
    const totalCounts = await getTotalCounts();

    return {
      products: serialized,
      categories,
      totalCounts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: page * limit < totalCount,
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      products: [],
      categories: [],
      totalCounts: {},
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
      },
    };
  }
}


// Helper function to get all active categories
export async function getActiveCategories() {
  await dbConnect();

  try {
    const categories = await Category.find({ status: "Active" })
      .select("name")
      .lean();

    return categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.name.toLowerCase().replace(/\s+/g, "-"),
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Helper function to get total counts for all categories
async function getTotalCounts() {
  try {
    // Get total count of all active products
    const totalAll = await Products.countDocuments({
      isActive: true,
    });

    // Get counts by category
    const categoryCounts = await Products.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo",
      },
      {
        $match: { "categoryInfo.status": "Active" },
      },
      {
        $group: {
          _id: "$categoryInfo.name",
          count: { $sum: 1 },
        },
      },
    ]);

    // Build counts object
    const counts = { all: totalAll };
    categoryCounts.forEach((item) => {
      const slug = item._id.toLowerCase().replace(/\s+/g, "-");
      counts[slug] = item.count;
    });

    return counts;
  } catch (error) {
    console.error("Error getting total counts:", error);
    return { all: 0 };
  }
}
export async function getRelatedProducts(currentProductId, categoryName) {
  await dbConnect();

  try {
    // 1. Validate inputs
    if (
      !currentProductId ||
      !mongoose.Types.ObjectId.isValid(currentProductId)
    ) {
      console.error("Invalid or missing product ID");
      return [];
    }

    if (!categoryName) {
      console.error("Category name is required");
      return [];
    }

    // 2. Find the category
    const category = await mongoose
      .model("Category")
      .findOne({
        name: { $regex: new RegExp(`^${categoryName}$`, "i") },
      })
      .select("_id");

    if (!category) {
      console.error(`Category "${categoryName}" not found`);
      return [];
    }

    // 3. Find related products (excluding current)
    const products = await mongoose
      .model("Product")
      .find({
        _id: { $ne: new mongoose.Types.ObjectId(currentProductId) },
        category: category._id,
        isActive: true,
      })
      .limit(4)
      .sort({ createdAt: -1 })
      .lean()
      .populate("category", "name");

    // 4. Fallback if no same-category products found
    if (products.length === 0) {
      const fallbackProducts = await mongoose
        .model("Product")
        .find({
          _id: { $ne: new mongoose.Types.ObjectId(currentProductId) },
          isActive: true,
        })
        .limit(4)
        .sort({ createdAt: -1 })
        .lean()
        .populate("category", "name");

      return fallbackProducts.map((product) => {
        // Handle defaultImage - extract URL if it's an object
        let defaultImageUrl = "/placeholder.png";
        if (product.defaultImage) {
          if (typeof product.defaultImage === 'string') {
            defaultImageUrl = product.defaultImage;
          } else if (product.defaultImage.url) {
            defaultImageUrl = product.defaultImage.url;
          }
        }

        return {
          id: product._id.toString(),
          name: product.name,
          price: product.price,
          purchasePrice: product.purchasePrice || 0,
          discountedPrice: product.discountedPrice || null,
          stock: product.stock || 0, // Added stock field
          defaultImage: defaultImageUrl, // Now always a string URL
          category: product.category?.name || "uncategorized",
          productId: product.productId || "",
          slug: product.slug || "",
          isNew: product.isNew || false, // Added isNew field
        };
      });
    }

    return products.map((product) => {
      // Handle defaultImage - extract URL if it's an object
      let defaultImageUrl = "/placeholder.png";
      if (product.defaultImage) {
        if (typeof product.defaultImage === 'string') {
          defaultImageUrl = product.defaultImage;
        } else if (product.defaultImage.url) {
          defaultImageUrl = product.defaultImage.url;
        }
      }

      return {
        id: product._id.toString(),
        name: product.name,
        price: product.price,
        purchasePrice: product.purchasePrice || 0,
        discountedPrice: product.discountedPrice || null,
        stock: product.stock || 0, // Added stock field
        defaultImage: defaultImageUrl, // Now always a string URL
        category: product.category?.name || "uncategorized",
        productId: product.productId,
        slug: product.slug,
        isNew: product.isNew || false, // Added isNew field
      };
    });
  } catch (error) {
    console.error("Error in getRelatedProducts:", error);
    return [];
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Get products within a date range
export async function getProductsByDateRange(startDate, endDate) {
  await dbConnect();

  try {
    // Create proper date objects with UTC time
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const products = await Products.find({
      isActive: true,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    })
      .populate({
        path: "category",
        select: "name status",
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out products that don't have an active category
    const validProducts = products.filter((product) => {
      const isValid = product.category && product.category.status === "Active";
      if (!isValid) {
        console.log(
          "Filtered out product:",
          product._id,
          "due to category issue"
        );
      }
      return isValid;
    });

    return validProducts.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      formattedPrice: formatPrice(product.price),
      image: product.image || "/placeholder.png",
      category: product.category.name,
      createdAt: product.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching products by date range:", error);
    throw new Error("Failed to fetch products");
  }
}
// Send new arrivals notification to all active customers
export async function sendNewArrivalsNotification(productIds) {
  await dbConnect();

  try {
    // 1. Fetch the selected products
    const products = await Products.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .populate({
        path: "category",
        select: "name",
      })
      .lean();

    if (products.length === 0) {
      return { success: false, error: "No active products found" };
    }

    // 2. Fetch all active customers
    const customers = await User.find({
      role: "Customer",
      status: "Active",
    });

    if (customers.length === 0) {
      return { success: false, error: "No active customers found" };
    }

    // 3. Format products with Naira prices
    const formattedProducts = products.map((p) => ({
      name: p.name,
      description: p.description,
      price: p.price,
      formattedPrice: formatPrice(p.price),
      image: p.image,
      category: p.category.name,
    }));

    // 4. Send emails to all customers
    const sendPromises = customers.map((customer) =>
      sendNewArrivalsEmail(customer.email, customer.name, formattedProducts)
    );

    await Promise.all(sendPromises);

    return {
      success: true,
      message: "Notifications sent successfully",
      recipientCount: customers.length,
      productCount: products.length,
    };
  } catch (error) {
    console.error("Error sending new arrivals notification:", error);
    return {
      success: false,
      error: error.message || "Failed to send notifications",
    };
  }
}

export async function getAllCategories() {
  await dbConnect();

  try {
    const categories = await Category.find({ status: "Active" })
      .sort({ name: 1 })
      .lean();

    return categories.map((category) => ({
      ...category,
      _id: category._id.toString(),
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}
