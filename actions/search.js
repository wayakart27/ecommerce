'use server';

import dbConnect from "@/lib/mongodb"
import Products from "@/model/Products"
import Category from "@/model/Category"

export async function searchProducts(query = "", limit = 10) {
  await dbConnect()

  try {
    if (!query || query.trim() === "") {
      return []
    }

    const searchRegex = new RegExp(query.trim(), "i")

    // Find products that match the search query
    const products = await Products.find({
      isActive: true,
      $or: [{ name: searchRegex }, { description: searchRegex }],
    })
      .populate({
        path: "category",
        select: "name status",
        model: Category,
        match: { status: "Active" },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    // Filter out products with inactive categories and serialize
    const validProducts = products
      .filter((product) => product.category && product.category.status === "Active")
      .map((product) => ({
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        discountedPrice: product.discountedPrice || null,
        // Extract the URL from the defaultImage object
        defaultImage: product.defaultImage?.url || "/placeholder.png",
        category: product.category.name,
        slug: product.slug,
        productId: product.productId,
        stock: product.stock,
        isNew: product.isNew || false,
        features: product.features || [],
        createdAt: product.createdAt,
      }))

    return validProducts
  } catch (error) {
    console.error("Error searching products:", error)
    return []
  }
}

export async function getAllProductsForSearch() {
  await dbConnect()

  try {
    // Get all active products for client-side search
    const products = await Products.find({ isActive: true })
      .populate({
        path: "category",
        select: "name status",
        model: Category,
        match: { status: "Active" },
      })
      .sort({ createdAt: -1 })
      .lean()

    // Filter out products with inactive categories and serialize
    const validProducts = products
      .filter((product) => product.category && product.category.status === "Active")
      .map((product) => ({
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        discountedPrice: product.discountedPrice || null,
        image: product.image || "/placeholder.png",
        category: product.category.name,
        stock: product.stock,
        isNew: product.isNew || false,
        features: product.features || [],
        createdAt: product.createdAt,
      }))

    return validProducts
  } catch (error) {
    console.error("Error fetching all products for search:", error)
    return []
  }
}
