// actions/order.js
"use server";
import mongoose from "mongoose";
import { Address } from "@/model/Address";
import { Order } from "@/model/Order";
import Products from "@/model/Products";
import User from "@/model/User";
import { revalidatePath } from "next/cache";
import { sendOrderStatusEmail } from "@/lib/mail";
import Shipping from "@/model/Shipping";
import dbConnect from "@/lib/mongodb";

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

export const createOrder = async (orderData) => {
  try {
    await dbConnect();

    const {
      userId,
      shippingAddressId,
      orderItems,
      itemsPrice,
      shippingPrice,
      totalPrice,
    } = orderData;

    // Validate shipping address
    const address = await Address.findOne({
      _id: shippingAddressId,
      user: userId,
    });
    if (!address) {
      return {
        success: false,
        error: "Invalid shipping address",
      };
    }

    // Validate products and prepare order items
    const itemsWithProduct = await Promise.all(
      orderItems.map(async (item) => {
        const product = await Products.findById(item.id);
        if (!product) throw new Error(`Product ${item.id} not found`);

        return {
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          discountedPrice: item.discountedPrice,
        };
      })
    );

    // Create new order
    const newOrder = new Order({
      user: userId,
      shippingAddress: shippingAddressId,
      orderItems: itemsWithProduct,
      paymentMethod: "paystack",
      itemsPrice,
      shippingPrice,
      totalPrice,
      status: "pending",
    });

    await newOrder.save();

    return {
      success: true,
      data: sanitizeForClient(newOrder),
      message: "Order created successfully",
    };
  } catch (error) {
    console.error("Order creation error:", error);
    return {
      success: false,
      message: error.message || "Failed to create order",
    };
  }
};

export const verifyPaystackPayment = async (orderId, reference) => {
  console.log(orderId, reference);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return { success: false, message: "Order not found" };
    }

    if (order.isPaid) {
      await session.abortTransaction();
      return { success: true, message: "Order already paid" };
    }

    // Verify payment with Paystack API
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorJson = await response.json();
      console.error(
        `Paystack API error: ${response.status} - ${errorJson.message}`
      );
      await session.abortTransaction();
      return {
        success: false,
        error: errorJson.message || `Paystack API error: ${response.status}`,
      };
    }

    const paymentData = await response.json();

    if (!paymentData.status) {
      const errorMsg = paymentData.message || "Payment verification failed";
      await session.abortTransaction();
      return {
        success: false,
        error: errorMsg,
        detail: paymentData.data?.gateway_response || "No additional info",
      };
    }

    const transactionData = paymentData.data;

    if (transactionData.status !== "success") {
      const errorMsg = `Transaction status: ${transactionData.status}`;
      console.error("Payment verification error:", errorMsg);
      await session.abortTransaction();
      return {
        success: false,
        error: errorMsg,
        detail: transactionData.gateway_response || "No additional info",
      };
    }

    // Extract orderId from Paystack metadata
    let paystackOrderId = null;
    const metadata = transactionData.metadata || {};

    if (metadata.order_id) {
      paystackOrderId = metadata.order_id;
    } else if (Array.isArray(metadata.custom_fields)) {
      const orderIdField = metadata.custom_fields.find(
        (field) => field.variable_name === "order_id"
      );
      if (orderIdField) paystackOrderId = orderIdField.value;
    } else if (metadata.custom_fields?.order_id) {
      paystackOrderId = metadata.custom_fields.order_id;
    }

    if (paystackOrderId && paystackOrderId !== orderId) {
      console.error(
        `OrderId mismatch. Expected: ${orderId}, Paystack: ${paystackOrderId}`
      );
      await session.abortTransaction();
      return {
        success: false,
        error: "OrderId mismatch. Payment verification failed.",
      };
    }

    // Validate payment amount
    const paidAmount = transactionData.amount / 100;
    const orderAmount = order.totalPrice;

    if (Math.abs(paidAmount - orderAmount) > 0.01) {
      console.error(
        `Payment amount mismatch. Expected ${orderAmount}, received ${paidAmount}`
      );
      await session.abortTransaction();
      return {
        success: false,
        error: `Payment amount mismatch. Expected ${orderAmount}, received ${paidAmount}`,
      };
    }

    // Security check for transaction ID
    const isPendingState = order.transactionId.startsWith("pending-");
    const isSameReference = order.transactionId === reference;

    if (!isPendingState && !isSameReference) {
      console.error(
        `Transaction ID mismatch. Order: ${order.transactionId}, Paystack: ${reference}`
      );
      await session.abortTransaction();
      return {
        success: false,
        error: "Transaction ID mismatch. Possible duplicate payment attempt",
      };
    }

    // CRITICAL: Update product stock quantities
    for (const item of order.orderItems) {
      const product = await Products.findById(item.product).session(session);

      if (!product) {
        console.error(`Product not found: ${item.product}`);
        await session.abortTransaction();
        return {
          success: false,
          error: `Product ${item.name || item.product} not found`,
        };
      }

      // Validate sufficient stock
      if (product.stock < item.quantity) {
        console.error(
          `Insufficient stock for ${product.name}. Requested: ${item.quantity}, Available: ${product.stock}`
        );
        await session.abortTransaction();
        return {
          success: false,
          error: `Insufficient stock for ${product.name}. Only ${product.stock} available`,
        };
      }

      // Update stock
      product.stock -= item.quantity;
      await product.save({ session });
    }

    // Update order status
    order.transactionId = reference;
    order.isPaid = true;
    order.paidAt = new Date(transactionData.paid_at || transactionData.paidAt);
    order.status = "processing";

    // Add processing status to statusTrack
    order.statusTrack.push({
      status: "processing",
      date: new Date(),
    });

    await order.save({ session });

    // Commit all changes
    await session.commitTransaction();

    return {
      success: true,
      data: sanitizeForClient(order),
      message: "Payment verified successfully",
    };
  } catch (error) {
    console.error("Payment verification error:", error);
    await session.abortTransaction();
    return {
      success: false,
      message: error.message || "Failed to verify payment",
    };
  } finally {
    session.endSession();
  }
};
export const getOrderById = async (orderId) => {
  try {
    await dbConnect();
    const order = await Order.findById(orderId)
      .populate({
        path: "user",
        select: "name email phone orderId",
      })
      .populate("shippingAddress")
      .populate({
        path: "orderItems.product",
        model: Products, // Explicitly specify the model
        select: "name image price slug", // Select specific fields
      });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    return {
      success: true,
      data: sanitizeForClient(order),
      message: "Order retrieved successfully",
    };
  } catch (error) {
    console.error("Get order error:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve order",
    };
  }
};

export const getOrdersByUserId = async (userId) => {
  try {
    await dbConnect();

    // Find all orders for the user and sort by creation date descending (newest first)
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 }) // Sort by date descending
      .populate({
        path: "user",
        select: "name email",
      })
      .populate("shippingAddress");

    return {
      success: true,
      data: orders.map((order) => sanitizeForClient(order)),
      message: "Orders retrieved successfully",
    };
  } catch (error) {
    console.error("Get orders by user error:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve orders",
    };
  }
};

export const markOrderAsReceived = async (orderId) => {
  try {
    await dbConnect();

    // Update the order with received confirmation
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          isOrderReceived: true,
          orderReceivedAt: new Date(),
        },
      },
      { new: true } // Return the updated document
    );

    if (!updatedOrder) {
      return {
        success: false,
        message: "Order not found",
      };
    }

    return {
      success: true,
      data: sanitizeForClient(updatedOrder),
      message: "Order marked as received",
    };
  } catch (error) {
    console.error("Mark order as received error:", error);
    return {
      success: false,
      message: error.message || "Failed to mark order as received",
    };
  }
};

export const getAllOrders = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  date = "",
  sort = "-createdAt",
}) => {
  try {
    await dbConnect();

    // Naira formatter function
    const formatNaira = (amount) => {
      const value = parseFloat(amount) || 0;
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    };

    // Build the query
    const query = {};

    // Search functionality
    if (search) {
      const searchTerm = search.trim();
      const searchConditions = [];

      // Check for order/tracking ID patterns
      const prefixMatch = searchTerm.match(/^(ORD-|TRK-)?(\d+)/i);
      const numericPart = prefixMatch ? prefixMatch[2] : searchTerm;
      const prefix = prefixMatch ? prefixMatch[1] : null;

      if (prefix) {
        if (prefix.toUpperCase().startsWith("ORD")) {
          searchConditions.push({ orderId: searchTerm.toUpperCase() });
        } else if (prefix.toUpperCase().startsWith("TRK")) {
          searchConditions.push({ trackingId: searchTerm.toUpperCase() });
        } else if (prefix.toUpperCase().startsWith("PAYSTACK")) {
          searchConditions.push({ transactionId: searchTerm.toUpperCase() });
        }
      }

      searchConditions.push(
        { orderId: { $regex: numericPart, $options: "i" } },
        { trackingId: { $regex: numericPart, $options: "i" } },
        { transactionId: { $regex: numericPart, $options: "i" } }
      );

      // Search users and add their IDs to filter
      const users = await User.find({
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      if (users.length > 0) {
        const userIds = users.map((u) => u._id);
        searchConditions.push({ user: { $in: userIds } });
      }

      query.$or = searchConditions;
    }

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Date filter
    if (date) {
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Sort options
    const sortOptions = {};
    if (sort === "-createdAt") sortOptions.createdAt = -1;
    else if (sort === "createdAt") sortOptions.createdAt = 1;
    else if (sort === "-totalPrice") sortOptions.totalPrice = -1;
    else if (sort === "totalPrice") sortOptions.totalPrice = 1;

    // Fetch orders with population
    const ordersQuery = Order.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "user",
        select: "name email image",
        match: { name: { $exists: true }, email: { $exists: true } },
      })
      .populate({
        path: "orderItems.product",
        select: "name image",
      })
      .populate("shippingAddress");

    // Get total count
    const countQuery = Order.countDocuments(query);

    const [orders, total] = await Promise.all([ordersQuery.lean(), countQuery]);

    // Transform and format order data
    const transformedData = orders.map((order) => {
      const user = order.user || {};
      const orderDate = order.createdAt || new Date();
      const productNames = (order.orderItems || [])
        .map((item) => item.product?.name || "Unknown Product")
        .join(", ");

      return {
        _id: order._id?.toString(),
        orderId: order.orderId,
        trackingId: order.trackingId || null,
        transactionId: order.transactionId || null,
        customer: {
          name: user.name || "Unknown",
          email: user.email || "",
          image: user.image || "/placeholder.svg",
        },
        date: orderDate,
        formattedDate: orderDate.toISOString().split("T")[0],
        status: order.status || "pending",
        totalPrice: parseFloat(order.totalPrice) || 0,
        formattedTotal: formatNaira(order.totalPrice),
        items: (order.orderItems || []).reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        ),
        products: productNames,
        isPaid: order.isPaid,
        payment: order.paymentMethod || "Unknown",
        shippingAddress: order.shippingAddress || null,
      };
    });

    return {
      success: true,
      data: sanitizeForClient(transformedData),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      message: "Orders retrieved successfully",
    };
  } catch (error) {
    console.error("Get all orders error:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve orders",
    };
  }
};

export const updateOrderStatusWithTracking = async (
  orderId,
  newStatus,
  email = ""
) => {
  try {
    await dbConnect();

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return {
        success: false,
        error: "Invalid order ID format",
      };
    }

    // Validate and sanitize status
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, message: "Invalid status value" };
    }

    // Find the current order with user email
    const currentOrder = await Order.findById(orderId)
      .select("status statusTrack userEmail")
      .lean();

    if (!currentOrder) {
      return { success: false, message: "Order not found" };
    }

    // Check if status is actually changing
    if (currentOrder.status === newStatus) {
      return {
        success: true,
        message: "Status unchanged",
        data: sanitizeForClient({ _id: orderId }),
      };
    }

    // Prepare the update object
    const updateData = {
      status: newStatus,
      $push: {
        statusTrack: {
          status: newStatus,
          date: new Date(),
        },
      },
      updatedAt: new Date(),
    };

    // Perform the update with validation
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
      runValidators: true,
    })
      .select("status isPaid isDelivered isCancelled statusTrack userEmail")
      .lean();

    if (!updatedOrder) {
      return { success: false, error: "Failed to update order" };
    }

    // Send email notification
    if (email) {
      await sendOrderStatusEmail(
        email,
        orderId,
        currentOrder.status,
        newStatus
      );
    }

    // Sanitize the response data
    const sanitizedData = sanitizeForClient({
      _id: orderId,
      status: updatedOrder.status,
      isPaid: updatedOrder.isPaid,
      isDelivered: updatedOrder.isDelivered,
      isCancelled: updatedOrder.isCancelled,
      statusTrack: updatedOrder.statusTrack,
    });

    return {
      success: true,
      message: "Order status updated successfully",
      data: sanitizedData,
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      message: error.message || "Failed to update order status",
      data: null,
    };
  }
};

// Calculate delivery date helper
const calculateDeliveryDate = async (order) => {
  // Skip calculation for terminal statuses
  if (
    ["shipped", "delivered", "cancelled", "refunded"].includes(order.status)
  ) {
    return null;
  }

  // Validate required fields
  if (!order.shippingAddress || !order.isPaid || !order.paidAt) {
    return null;
  }

  try {
    // Get shipping configuration
    const shippingConfigs = await Shipping.find({});
    const defaultShipping = shippingConfigs[0];

    if (!defaultShipping) {
      console.error("No shipping configuration found");
      return null;
    }

    const paidDate = new Date(order.paidAt);
    let deliveryDays = defaultShipping.defaultDeliveryDays || 6;

    // Get address details
    let address = order.shippingAddress;
    // Handle both ObjectID and populated address
    if (mongoose.Types.ObjectId.isValid(address)) {
      address = await Address.findById(address);
    } else if (address && typeof address === "object") {
      // Already populated, use as is
    } else {
      console.error("Invalid address format");
      return null;
    }

    const state = address?.state;
    const city = address?.city;

    // City-based delivery days
    if (city && state && defaultShipping.cityPrices) {
      const cityMatch = defaultShipping.cityPrices.find(
        (item) =>
          item.city === city && item.state === state && item.deliveryDays
      );
      if (cityMatch) deliveryDays = cityMatch.deliveryDays;
    }

    // State-based delivery days
    if (state && defaultShipping.statePrices) {
      const stateMatch = defaultShipping.statePrices.find(
        (item) => item.state === state && item.deliveryDays
      );
      if (stateMatch) deliveryDays = stateMatch.deliveryDays;
    }

    // Calculate final date
    const deliveryDate = new Date(paidDate);
    deliveryDate.setDate(paidDate.getDate() + deliveryDays);
    return deliveryDate;
  } catch (error) {
    console.error("Delivery calculation failed:", error);
    return null;
  }
};

// Get order by ID with shipping details
export const getOrderAndShippingById = async (orderId) => {
  try {
    await dbConnect();

    // Fetch order with populated data
    const order = await Order.findById(orderId)
      .populate({
        path: "user",
        select: "name email phone orderId",
      })
      .populate("shippingAddress")
      .populate({
        path: "orderItems.product",
        model: "Product",
        select: "name defaultImage productId price slug",
      });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    let deliveryDate = order.estimatedDeliveryDate || null;

    // Only calculate for processing orders without existing date
    if (order.status === "processing" && !deliveryDate) {
      deliveryDate = await calculateDeliveryDate(order);
      if (deliveryDate) {
        // Update order in database
        await Order.findByIdAndUpdate(orderId, {
          estimatedDeliveryDate: deliveryDate,
        });
      }
    }

    // Prepare response
    const orderObject = order.toObject();
    orderObject.deliveryDate = deliveryDate;

    return {
      success: true,
      data: sanitizeForClient(orderObject),
      message: "Order retrieved successfully",
    };
  } catch (error) {
    console.error("Get order error:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve order",
    };
  }
};
