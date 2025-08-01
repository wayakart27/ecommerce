// actions/profit.js
"use server";

import dbConnect from "@/lib/mongodb";
import { Order } from "@/model/Order";
import Products from "@/model/Products";

export async function getProfitAnalysis(
  startDate,
  endDate,
  page = 1,
  limit = 10
) {
  await dbConnect();

  try {
    // Create UTC date objects from inputs
    let start = null;
    let end = null;

    if (startDate) {
      start = new Date(startDate + "T00:00:00Z"); // UTC midnight
    }

    if (endDate) {
      end = new Date(endDate + "T23:59:59.999Z"); // UTC end of day
    }

    // Build query
    const query = { isPaid: true };
    if (start && end) {
      query.createdAt = { $gte: start, $lte: end };
    }

    // Pagination
    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // Fetch orders with populated product details
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "orderItems.product",
        model: "Product",
        select: "purchasePrice category name",
        populate: {
          path: "category",
          model: "Category",
          select: "name",
        },
      })
      .lean();

    let totalSoldPrice = 0;

    // Process orders
    const profitData = orders.flatMap((order) => {
      return order.orderItems.map((item) => {
        const product = item.product || {};
        const purchasePrice = product?.purchasePrice ?? 0;
        const sellingPrice = item?.discountedPrice ?? item?.price ?? 0;
        const quantity = item?.quantity ?? 0;
        const price = sellingPrice * quantity;
        const profitPerItem = sellingPrice - purchasePrice;
        const totalProfit = profitPerItem * quantity;

        totalSoldPrice += price;

        return {
          id: order._id?.toString(),
          orderId: order.orderId,
          orderDate: order.createdAt,
          productId: product._id?.toString() || "",
          productName: item.name || product.name || "Unknown Product",
          category: product?.category?.name || "Uncategorized",
          purchasePrice,
          sellingPrice,
          quantity,
          profit: totalProfit,
          price, // renamed from soldPrice
        };
      });
    });

    // Calculate totals for all data
    const allOrders = await Order.find(query)
      .populate({
        path: "orderItems.product",
        model: "Product",
        select: "purchasePrice",
      })
      .lean();

    let allSoldPrice = 0;

    const allProfitData = allOrders.flatMap((order) => {
      return order.orderItems.map((item) => {
        const product = item.product || {};
        const purchasePrice = product?.purchasePrice ?? 0;
        const sellingPrice = item?.discountedPrice ?? item?.price ?? 0;
        const quantity = item?.quantity ?? 0;
        const profitPerItem = sellingPrice - purchasePrice;
        allSoldPrice += sellingPrice * quantity;
        return profitPerItem * quantity;
      });
    });

    const totalProfit = allProfitData.reduce((sum, profit) => sum + profit, 0);
    const itemsCount = allOrders.reduce(
      (sum, order) =>
        sum +
        order.orderItems.reduce(
          (orderSum, item) => orderSum + (item.quantity ?? 0),
          0
        ),
      0
    );

    return {
      data: profitData,
      totalProfit,
      soldPrice: allSoldPrice, // Added soldPrice as total
      itemsCount,
      pagination: {
        totalPages,
        currentPage: page,
        totalOrders,
      },
    };
  } catch (error) {
    console.error("Error fetching profit analysis:", error);
    return {
      data: [],
      totalProfit: 0,
      soldPrice: 0,
      itemsCount: 0,
      pagination: {
        totalPages: 0,
        currentPage: page,
        totalOrders: 0,
      },
    };
  }
}

export async function getProductProfitDetails(productId, date) {
  await dbConnect();

  try {
    // Validate input
    if (!productId || !date) {
      throw new Error("Missing required parameters");
    }

    // Create UTC date objects with proper time ranges
    const start = new Date(date + "T00:00:00Z"); // UTC midnight
    const end = new Date(date + "T23:59:59.999Z"); // UTC end of day

    // Find orders containing the specified product
    const orders = await Order.find({
      isPaid: true,
      createdAt: { $gte: start, $lte: end },
      "orderItems.product": productId,
    })
      .populate({
        path: "orderItems.product",
        model: Products,
        select: "purchasePrice category name productId",
        populate: {
          path: "category",
          model: "Category",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // If no orders found, return empty results
    if (orders.length === 0) {
      return {
        summary: {
          productName: "Product",
          category: "",
          totalQuantity: 0,
          totalProfit: 0,
          avgPurchasePrice: 0,
          avgSellingPrice: 0,
          avgProfit: 0,
        },
        dailyBreakdown: [],
      };
    }

    // Process order items for this specific product
    let totalQuantity = 0;
    let totalPurchaseValue = 0;
    let totalSellingValue = 0;
    let totalProfit = 0;

    // Since we're only dealing with one date, we'll have a single daily breakdown
    const dailyBreakdown = {
      date: date,
      quantity: 0,
      totalProfit: 0,
      sellingPrices: [],
    };

    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (item.product && item.product._id.toString() === productId) {
          const purchasePrice = item.product?.purchasePrice || 0;
          const sellingPrice = item.discountedPrice;
          const profitPerItem = sellingPrice - purchasePrice;
          const itemProfit = profitPerItem * item.quantity;

          // Add to summary totals
          totalQuantity += item.quantity;
          totalPurchaseValue += purchasePrice * item.quantity;
          totalSellingValue += sellingPrice * item.quantity;
          totalProfit += itemProfit;

          // Add to daily breakdown
          dailyBreakdown.quantity += item.quantity;
          dailyBreakdown.totalProfit += itemProfit;
          dailyBreakdown.sellingPrices.push(sellingPrice);
        }
      });
    });

    // Calculate averages
    const avgPurchasePrice =
      totalQuantity > 0 ? totalPurchaseValue / totalQuantity : 0;
    const avgSellingPrice =
      totalQuantity > 0 ? totalSellingValue / totalQuantity : 0;
    const avgProfit = totalQuantity > 0 ? totalProfit / totalQuantity : 0;

    // Get product details from the first item found
    const firstItem = orders[0]?.orderItems?.find(
      (item) => item.product && item.product._id.toString() === productId
    );

    return {
      summary: {
        productName: firstItem?.name || firstItem?.product?.name || "Product",
        category: firstItem?.product?.category?.name || "Uncategorized",
        productId: firstItem?.product?.productId || "",
        totalQuantity,
        totalProfit,
        avgPurchasePrice,
        avgSellingPrice,
        avgProfit,
      },
      dailyBreakdown: [
        {
          date: date,
          quantity: dailyBreakdown.quantity,
          totalProfit: dailyBreakdown.totalProfit,
          avgSellingPrice:
            dailyBreakdown.sellingPrices.length > 0
              ? dailyBreakdown.sellingPrices.reduce((a, b) => a + b, 0) /
                dailyBreakdown.sellingPrices.length
              : 0,
        },
      ],
    };
  } catch (error) {
    console.error("Error in getProductProfitDetails:", error);
    return {
      summary: {
        productName: "Product",
        category: "",
        totalQuantity: 0,
        totalProfit: 0,
        avgPurchasePrice: 0,
        avgSellingPrice: 0,
        avgProfit: 0,
      },
      dailyBreakdown: [],
    };
  }
}
