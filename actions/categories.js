'use server';

import dbConnect from "@/lib/mongodb";
import Category from "@/model/Category";
import Products from "@/model/Products";
import CategorySchema from "@/schemas/category";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createCategory(formData) {
  await dbConnect();

  try {
    // Prepare the data with proper defaults
    const dataWithId = {
      ...formData,
      description: formData.description || undefined, // Convert empty to undefined
      categoryId: `CAT-${Math.floor(100000 + Math.random() * 900000)}`
    };

    // Validate the data
    const validatedData = CategorySchema.parse(dataWithId);

    // Check for duplicates
    const existingCategory = await Category.findOne({
      $or: [
        { slug: validatedData.slug },
        { name: validatedData.name },
        { categoryId: validatedData.categoryId }
      ],
    });

    if (existingCategory) {
      return {
        success: false,
        error: "Category with this name, slug or ID already exists",
      };
    }

    const newCategory = await Category.create(validatedData);
    
    revalidatePath("/dashboard/categories");
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(newCategory))
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format errors for better client-side handling
      const formattedErrors = error.errors.map(err => ({
        field: err.path[0], // Get the field name
        message: err.message
      }));
      
      return {
        success: false,
        error: "Validation failed",
        errors: formattedErrors // Structured error details
      };
    }
    
    console.error("Create category error:", error);
    return {
      success: false,
      error: error.message || "Failed to create category"
    };
  }
}



export async function getCategories(page = 1, limit = 10, search = "") {
  await dbConnect()

  const skip = (page - 1) * limit
  let query = {}

  if (search) {
    query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    }
  }

  const total = await Category.countDocuments(query)
  const categories = await Category.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const productCount = await Products.countDocuments({ category: category._id })
      return {
        ...category,
        _id: category._id.toString(), // Convert ObjectId to string
        productCount,
      }
    })
  )

  return {
    categories: JSON.parse(JSON.stringify(categoriesWithCount)), // Ensure plain objects
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    },
  }
}

export async function getAllCategories() {
  try {
    await dbConnect();

    const categories = await Category.find({ status: 'Active' })
      .sort({ name: 1 })
      .exec();


    // Stringify and parse to get pure objects
    const serializedCategories = JSON.parse(JSON.stringify(categories));

    return {
      success: true,
      data: serializedCategories,
      message: "Categories fetched successfully"
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      data: null,
      message: "Failed to fetch categories"
    };
  }
}

export async function updateCategory(id, formData) {
  await dbConnect();
  try {
    const category = await Category.findById(id);
    if (!category) {
      return { success: false, error: "Category not found" };
    }

    if (
      (formData.slug && formData.slug !== category.slug) ||
      (formData.name && formData.name !== category.name)
    ) {
      const existingCategory = await Category.findOne({
        _id: { $ne: id },
        $or: [
          { slug: formData.slug || category.slug },
          { name: formData.name || category.name },
        ],
      });

      if (existingCategory) {
        return {
          success: false,
          error: "Category with this name or slug already exists",
        };
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: formData },
      { new: true }
    );

    // Convert to plain object
    const plainCategory = JSON.parse(JSON.stringify(updatedCategory));
    
    revalidatePath("/dashboard/categories");
    return { success: true, data: plainCategory };
  } catch (error) {
    return { success: false, error: "Failed to update category" };
  }
}

export async function toggleCategoryStatus(id) {
  await dbConnect();

  try {
    const category = await Category.findById(id);

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    category.status = category.status === "Active" ? "Inactive" : "Active";
    await category.save();

    // Convert to plain object
    const plainCategory = JSON.parse(JSON.stringify(category));
    
    revalidatePath("/dashboard/categories");
    return { success: true, data: plainCategory };
  } catch (error) {
    return { success: false, error: "Failed to toggle category status" };
  }
}

export async function deleteCategory(id) {
  await dbConnect();

  try {
    // Check if category exists
    const category = await Category.findById(id);

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    // Check if category has products
    const productCount = await Products.countDocuments({ category: id });

    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete category with ${productCount} products. Reassign products first.`,
      };
    }

    // Delete category
    await Category.findByIdAndDelete(id);

    revalidatePath("/dashboard/categories");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete category" };
  }
}