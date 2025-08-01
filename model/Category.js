import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: true,
      unique: true,  // Will automatically create a unique index
      default: () => `CAT-${Math.floor(100000 + Math.random() * 900000)}`
    },
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
      index: true  // Creates a regular index
    },
    description: { 
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"]
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true,  // Creates a unique index
      trim: true,
      match: [/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"]
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true  // Creates a regular index
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index example (only if you need it)
// CategorySchema.index({ status: 1, name: 1 }); 

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);