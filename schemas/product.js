const { z } = require("zod");

// Helper function to validate productId format
const validateProductId = (value) => {
  return /^PRD-\d{6}$/.test(value);
};

// Base product schema
const ProductSchema = z.object({
  productId: z.string()
    .min(1, "Product ID is required")
    .refine(validateProductId, {
      message: "Product ID must be in format PRD-XXXXXX where X is a digit"
    }),
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(100, "Product name cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),
  price: z
    .number({
      invalid_type_error: "Price must be a number",
      required_error: "Price is required",
    })
    .positive("Price must be greater than zero")
    .transform(val => parseFloat(val.toFixed(2))),
  purchasePrice: z
    .number({
      invalid_type_error: "Purchase Price must be a number",
      required_error: "Purchase Price is required",
    })
    .positive("Purchase Price must be greater than zero")
    .transform(val => parseFloat(val.toFixed(2))),
  discountedPrice: z
    .number({
      invalid_type_error: "Discounted Price must be a number",
    })
    .nonnegative("Discounted Price cannot be negative")
    .transform(val => parseFloat(val.toFixed(2)))
    .optional()
    .nullable(),
  category: z.string({ required_error: "Category is required" }),
  stock: z
    .number({
      invalid_type_error: "Stock must be a number",
      required_error: "Stock is required",
    })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
 images: z.array(
  z.object({
    url: z.string().min(1, "Image URL is required"),
    alt: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })
).max(10, "Cannot have more than 10 images").optional(),
  defaultImage: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  features: z.array(z.string().max(100, "Feature cannot exceed 100 characters"))
    .max(20, "Cannot have more than 20 features")
    .optional(),
  slug: z.string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9\-]+$/, "Slug can only contain lowercase letters, numbers and hyphens")
});

// Schema for creating a new product
const CreateProductSchema = ProductSchema.extend({
  productId: z.string().optional(), // Allowed to be optional for creation
  slug: z.string().optional() // Will be generated from name if not provided
})
.refine(data => {
  // Only validate if discountedPrice is provided
  if (data.discountedPrice === undefined || data.discountedPrice === null) return true;
  return data.discountedPrice <= data.price;
}, {
  message: "Discounted price cannot be greater than regular price",
  path: ["discountedPrice"]
})
.refine(data => data.purchasePrice <= data.price, {
  message: "Purchase price cannot be greater than selling price",
  path: ["purchasePrice"]
});

// Schema for updating an existing product (all fields optional except productId)
const UpdateProductSchema = ProductSchema.partial()
  .extend({
    productId: z.string().optional() // Keep required for updates if you want
  })
  .refine(data => {
    // Only validate if both prices are provided
    if (data.discountedPrice === undefined || data.price === undefined) return true;
    if (data.discountedPrice === null) return true;
    return data.discountedPrice <= data.price;
  }, {
    message: "Discounted price cannot be greater than regular price",
    path: ["discountedPrice"]
  })
  .refine(data => {
    // Only validate if both prices are provided
    if (data.purchasePrice === undefined || data.price === undefined) return true;
    return data.purchasePrice <= data.price;
  }, {
    message: "Purchase price cannot be greater than selling price",
    path: ["purchasePrice"]
  });

module.exports = {
  ProductSchema,
  CreateProductSchema,
  UpdateProductSchema
};