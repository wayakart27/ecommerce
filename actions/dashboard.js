// actions/dashboard.js
"use server";

import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { Order } from "@/model/Order";
import Products from "@/model/Products";
import User from "@/model/User";

// Recursive sanitizer for complete serialization
const sanitizeForClient = (data) => {
  if (data === null || data === undefined) return data;

  if (data instanceof mongoose.Document) {
    return sanitizeForClient(data.toObject({ getters: true, virtuals: true }));
  }

  if (data instanceof mongoose.Types.ObjectId) {
    return data.toString();
  }

  if (Buffer.isBuffer(data)) {
    return data.toString("base64");
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForClient);
  }

  if (typeof data === "object" && data.constructor === Object) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        sanitizeForClient(value),
      ])
    );
  }

  return data;
};

// Common helper functions
const formatNaira = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

const getDateRange = (range = "month") => {
  const now = new Date();

  if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(now);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  if (range === "year") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
  }

  // Default to month
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
};

// Admin/Staff Dashboard Data
export const getAdminDashboardData = async (timeRange = "month") => {
  try {
    await dbConnect();
    const { start, end } = getDateRange(timeRange);

    // Fetch all data in parallel
    const [
      totalSalesResult,
      totalOrders,
      totalCustomers,
      pendingDelivery,
      topSellingProducts,
    ] = await Promise.all([
      // Total Sales (sum of totalPrice for paid orders)
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            status: { $nin: ["cancelled", "refunded"] },
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
          },
        },
      ]),

      // Total Orders
      Order.countDocuments({
        isPaid: true,
        status: { $nin: ["cancelled", "refunded"] },
        createdAt: { $gte: start, $lte: end },
      }),

      // Total Customers
      User.countDocuments({
        role: "Customer",
        createdAt: { $gte: start, $lte: end },
      }),

      // Pending Delivery
      Order.countDocuments({ status: "shipped", isOrderReceived: false }),

      // Top Selling Products - CORRECTED CALCULATION
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            status: { $nin: ["cancelled", "refunded"] },
            createdAt: { $gte: start, $lte: end },
          },
        },
        { $unwind: "$orderItems" },
        {
          $group: {
            _id: "$orderItems.product",
            totalQuantity: { $sum: "$orderItems.quantity" },
            totalSales: {
              $sum: {
                $multiply: [
                  "$orderItems.quantity",
                  "$orderItems.discountedPrice",
                ],
              },
            },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: 0,
            productId: "$product._id",
            name: "$product.name",
            defaultImage: "$product.defaultImage",
            totalQuantity: 1,
            totalSales: 1,
            discountedPrice: "$product.discountedPrice",
          },
        },
      ]),
    ]);

    // Extract total sales from aggregation result
    const totalSales = totalSalesResult[0]?.total || 0;

    // Sales Chart Data
    const salesData = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          status: { $nin: ["cancelled", "refunded"] },
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: timeRange === "year" ? "%Y-%m" : "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          total: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = {
      totalSales,
      formattedSales: formatNaira(totalSales),
      totalOrders,
      totalCustomers,
      pendingDelivery,
      topSellingProducts,
      salesData: salesData.map((item) => ({
        date: item._id,
        sales: item.total,
      })),
      timeRange,
    };

    return sanitizeForClient(result);
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return sanitizeForClient({
      totalSales: 0,
      formattedSales: formatNaira(0),
      totalOrders: 0,
      totalCustomers: 0,
      pendingDelivery: 0,
      topSellingProducts: [],
      salesData: [],
      timeRange,
    });
  }
};

export const getUserDashboardData = async (timeRange = "month") => {
  try {
    await dbConnect();
    const { start, end } = getDateRange(timeRange);

    // Fetch data relevant for a user with limited permissions
    const [
      totalOrders,
      pendingDelivery,
      totalProducts,
      pendingOrders,
      completedOrders,
    ] = await Promise.all([
      // Total Orders (without financial details)
      Order.countDocuments({
        status: { $nin: ["cancelled", "refunded", "pending"] },
        createdAt: { $gte: start, $lte: end },
      }),

      // Pending Delivery
      Order.countDocuments({ status: "shipped", isOrderReceived: false }),

      // Total Products
      Products.countDocuments({}),

      // Pending Orders (processing/shipping)
      Order.countDocuments({
        status: { $in: ["processing"] },
        isPaid: true,
      }),

      // Completed Orders
      Order.countDocuments({
        status: "delivered",
        isPaid: true,
        createdAt: { $gte: start, $lte: end },
      }),
    ]);

    // Order Status Breakdown
    const orderStatusData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      totalOrders,
      pendingDelivery,
      totalProducts,
      pendingOrders,
      completedOrders,
      orderStatusBreakdown: orderStatusData.map((item) => ({
        status: item._id,
        count: item.count,
      })),
      timeRange,
    };

    return sanitizeForClient(result);
  } catch (error) {
    console.error("User dashboard error:", error);
    return sanitizeForClient({
      totalOrders: 0,
      pendingDelivery: 0,
      totalProducts: 0,
      pendingOrders: 0,
      completedOrders: 0,
      orderStatusBreakdown: [],
      timeRange,
    });
  }
};

// Customer Dashboard Data
export const getCustomerDashboardData = async (userId) => {
  try {
    await dbConnect();

    const [
      totalPurchasesResult,
      totalOrders,
      totalDeliveries,
      pendingDeliveries,
      recentProducts,
    ] = await Promise.all([
      // Total Purchases (sum of totalPrice for paid orders)
      Order.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            isPaid: true,
            status: { $nin: ["cancelled", "refunded"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),

      // Total Orders
      Order.countDocuments({ user: userId, isPaid: true }),

      // Total Deliveries (delivered orders)
      Order.countDocuments({
        user: userId,
        status: "delivered",
        isPaid: true,
      }),

      // Pending Deliveries (shipped but not received)
      Order.countDocuments({
        user: userId,
        status: {
          $nin: ["pending", "cancelled", "refunded", 'delivered'], // Correct array syntax
        },
        isPaid: true,
        isDelivered: false,
      }),
      // Recent Products
      Products.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name defaultImage price slug productId")
        .lean(),
    ]);

    // Extract total purchases from aggregation result
    const totalPurchases = totalPurchasesResult[0]?.total || 0;

    // Customer Chart Data (Order history)
    const orderHistory = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          isPaid: true,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
          total: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = {
      totalPurchases,
      formattedPurchases: formatNaira(totalPurchases),
      totalOrders,
      totalDeliveries,
      pendingDeliveries,
      recentProducts: recentProducts.map((p) => ({
        ...p,
        _id: p._id.toString(),
        price: formatNaira(p.price),
      })),
      orderHistory: orderHistory.map((item) => ({
        month: item._id,
        orders: item.count,
        total: item.total,
      })),
    };

    return sanitizeForClient(result);
  } catch (error) {
    console.error("Customer dashboard error:", error);
    return sanitizeForClient({
      totalPurchases: 0,
      formattedPurchases: formatNaira(0),
      totalOrders: 0,
      totalDeliveries: 0,
      pendingDeliveries: 0,
      recentProducts: [],
      orderHistory: [],
    });
  }
};
