const { z } = require("zod");

// Helper function to validate categoryId format
const validateCategoryId = (value) => {
  return /^CAT-\d{6}$/.test(value);
};

const CategorySchema = z.object({
  categoryId: z.string()
    .min(1, "Category ID is required")
    .refine(validateCategoryId, {
      message: "Category ID must be in format CAT-XXXXXX where X is a digit"
    }),
  name: z.string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters"),
  slug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug cannot exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters")
    .optional() // Make it optional
    .or(z.literal("")), // Also allow empty string
  isActive: z.boolean().default(true),
  // Add other category-specific fields as needed
});

module.exports = CategorySchema;