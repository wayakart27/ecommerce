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
  shortDescription: z.string()
    .max(200, "Short description cannot exceed 200 characters")
    .optional(),
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
  brand: z.string({ required_error: "Brand is required" }),
  model: z.string().optional(),
  stock: z
    .number({
      invalid_type_error: "Stock must be a number",
      required_error: "Stock is required",
    })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  lowStockThreshold: z
    .number()
    .int("Low stock threshold must be a whole number")
    .min(0, "Low stock threshold cannot be negative")
    .default(5)
    .optional(),
  sku: z.string().optional(),
  weight: z.object({
    value: z.number().min(0, "Weight cannot be negative").optional(),
    unit: z.enum(['g', 'kg', 'lb', 'oz']).default('g').optional()
  }).optional(),
  dimensions: z.object({
    length: z.number().min(0, "Length cannot be negative").optional(),
    width: z.number().min(0, "Width cannot be negative").optional(),
    height: z.number().min(0, "Height cannot be negative").optional(),
    unit: z.enum(['cm', 'in', 'mm']).default('cm').optional()
  }).optional(),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    isPrimary: z.boolean().default(false).optional()
  })).max(10, "Cannot have more than 10 images").optional(),
  defaultImage: z.string().optional().nullable(),
  specifications: z.record(z.string()).optional(),
  variants: z.array(z.object({
    name: z.string(),
    options: z.array(z.object({
      value: z.string(),
      sku: z.string().optional(),
      price: z.number().min(0, "Price cannot be negative").optional(),
      stock: z.number().min(0, "Stock cannot be negative").optional(),
      images: z.array(z.string()).optional()
    }))
  })).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false).optional(),
  isNewArrival: z.boolean().default(false).optional(),
  isBestSeller: z.boolean().default(false).optional(),
  features: z.array(z.string().max(100, "Feature cannot exceed 100 characters"))
    .max(20, "Cannot have more than 20 features")
    .optional(),
  tags: z.array(z.string())
    .max(15, "Cannot have more than 15 tags")
    .optional(),
  returnPolicy: z.enum(['standard', 'extended', 'non-refundable']).default('standard').optional(),
  warranty: z.object({
    duration: z.number().min(0, "Warranty duration cannot be negative").optional(),
    unit: z.enum(['days', 'months', 'years']).optional(),
    details: z.string().optional()
  }).optional(),
  shipping: z.object({
    weightBased: z.boolean().default(false).optional(),
    free: z.boolean().default(false).optional(),
    processingTime: z.object({
      min: z.number().min(0, "Minimum processing time cannot be negative").optional(),
      max: z.number().min(0, "Maximum processing time cannot be negative").optional(),
      unit: z.enum(['hours', 'days', 'business days']).default('days').optional()
    }).optional()
  }).optional(),
  relatedProducts: z.array(z.string()).optional(),
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