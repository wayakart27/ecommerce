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
import ReferralPayoutSettings from "@/model/ReferralPayoutSettings";

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

// --- helpers: safe add-days and normalizer ---
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (date, days) => new Date(date.getTime() + days * ONE_DAY_MS);
const norm = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");

// Calculate delivery days helper (returns "2" or "2-3")
const calculateDeliveryDate = async (order) => {
  // Only compute if we have the essentials
  if (!order || !order.isPaid || !order.paidAt || !order.shippingAddress) {
    return null;
  }

  try {
    // Get shipping configuration (prefer a single default doc if you have a flag)
    const defaultShipping = await Shipping.findOne({ isDefault: true }) || await Shipping.findOne({});

    // Fallbacks if config is missing
    if (!defaultShipping) {
      console.error("No shipping configuration found — falling back to 2-3 days.");
      return "2-3"; // fallback numeric string
    }

    // Default delivery days from config (string like "2-3 days" or "2 days")
    let deliveryDays = defaultShipping.defaultDeliveryDays || "2-3 days";

    // Resolve address object (handle ObjectId / populated)
    let address = order.shippingAddress;
    if (address && typeof address === "string" && mongoose.Types.ObjectId.isValid(address)) {
      address = await Address.findById(address);
    } else if (!address || typeof address !== "object") {
      console.error("Invalid address format");
      // still provide a sane default
      return "2-3";
    }

    const state = norm(address?.state);
    const city = norm(address?.city);

    // City-based override
    if (city && state && Array.isArray(defaultShipping.cityPrices)) {
      const cityMatch = defaultShipping.cityPrices.find((item) => {
        const iCity = norm(item?.city);
        const iState = norm(item?.state);
        return iCity && iState && iCity === city && iState === state && item?.deliveryDays;
      });
      if (cityMatch?.deliveryDays) deliveryDays = cityMatch.deliveryDays;
    }

    // State-based override
    if (state && Array.isArray(defaultShipping.statePrices)) {
      const stateMatch = defaultShipping.statePrices.find((item) => {
        const iState = norm(item?.state);
        return iState && iState === state && item?.deliveryDays;
      });
      if (stateMatch?.deliveryDays) deliveryDays = stateMatch.deliveryDays;
    }

    // Normalize to numeric string only: "2-3 days" -> "2-3", "2 days" -> "2"
    const m = String(deliveryDays).match(/(\d+)(?:-(\d+))?/);
    if (!m) {
      // if config value is weird, fall back
      return "2-3";
    }

    const minStr = m[1];
    const maxStr = m[2];
    return maxStr ? `${minStr}-${maxStr}` : `${minStr}`;
  } catch (error) {
    console.error("Delivery calculation failed:", error);
    return "2-3"; // safe fallback to keep the flow working
  }
};

// Calculate a date range from paidAt + "2-3" (or "2")
const calculateDateRangeFromDeliveryDays = (paidDate, deliveryDays) => {
  if (!paidDate || !deliveryDays) return null;

  const paid = new Date(paidDate);
  if (isNaN(paid.getTime())) return null;

  // Accept "2-3", "2", or even "2-3 days" / "2 days"
  const match = String(deliveryDays).match(/(\d+)(?:-(\d+))?/);
  if (!match) return null;

  const minDays = parseInt(match[1], 10);
  const maxDays = match[2] ? parseInt(match[2], 10) : null;

  if (!isFinite(minDays)) return null;

  if (isFinite(maxDays)) {
    // range
    return {
      from: addDays(paid, minDays),
      to: addDays(paid, maxDays),
      isRange: true,
      deliveryDaysString: `${minDays}-${maxDays}`,
    };
  } else {
    // single day
    return {
      from: addDays(paid, minDays),
      to: null,
      isRange: false,
      deliveryDaysString: `${minDays}`,
    };
  }
};

export const createOrder = async (orderData) => {
  try {
    await dbConnect();

    const {
      userId,
      shippingAddressId, // This is the address ID from the address collection
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

    // Convert the address document to embedded format
    const embeddedAddress = {
      firstName: address.firstName,
      lastName: address.lastName,
      email: address.email,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: '', // Your address model doesn't have postalCode, so set default
      additionalInfo: '' // Your address model doesn't have additionalInfo, so set default
    };

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

    // Create new order with embedded shipping address
    const newOrder = new Order({
      user: userId,
      shippingAddress: embeddedAddress, // Use the embedded address object
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();

    // 1. Fetch and validate order
    const order = await Order.findById(orderId)
      .populate("orderItems.product")
      .session(session);

    if (!order) {
      await session.abortTransaction();
      return { success: false, message: "Order not found" };
    }

    if (order.isPaid) {
      await session.abortTransaction();
      return {
        success: true,
        message: "Order already paid",
        data: {
          orderId: order._id,
          status: order.status,
        },
      };
    }

    // 2. Verify payment with Paystack API
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorJson = await response.json();
      await session.abortTransaction();
      return {
        success: false,
        error: errorJson.message || `Paystack API error: ${response.status}`,
        reference,
      };
    }

    const paymentData = await response.json();
    const transactionData = paymentData.data;

    if (!paymentData.status || transactionData.status !== "success") {
      await session.abortTransaction();
      return {
        success: false,
        error: paymentData.message || "Payment verification failed",
        reference,
        status: transactionData?.status,
      };
    }

    // 3. Validate payment details
    const paidAmount = transactionData.amount / 100;
    const orderAmount = order.totalPrice;

    if (Math.abs(paidAmount - orderAmount) > 0.01) {
      await session.abortTransaction();
      return {
        success: false,
        error: `Payment amount mismatch. Expected ₦${orderAmount.toFixed(2)}, received ₦${paidAmount.toFixed(2)}`,
        expectedAmount: orderAmount,
        paidAmount,
      };
    }

    // 4. Update product stock and validate inventory
    for (const item of order.orderItems) {
      const product = item.product;

      if (!product || product.stock < item.quantity) {
        await session.abortTransaction();
        return {
          success: false,
          error: product
            ? `Insufficient stock for ${product.name}. Available: ${product.stock}`
            : "Product not found",
          productId: item.product,
        };
      }

      product.stock -= item.quantity;
      product.sold += item.quantity;
      await product.save({ session });
    }

    // 5. Process referral if applicable
    if (order.user) {
      const user = await User.findById(order.user).session(session);

      if (user?.referralProgram?.referredBy && !user.hasMadePurchase) {
        // Get referral payout settings
        const payoutSettings = await ReferralPayoutSettings.findOne({}).session(session);
        const referralPercentage = payoutSettings?.referralPercentage || 1.5;
        
        const referrer = await User.findById(user.referralProgram.referredBy).session(session);

        if (referrer) {
          // Calculate bonus based on referral percentage
          const bonusPercentage = referralPercentage / 100;
          const bonusAmount = order.totalPrice * bonusPercentage;

          // Update referrer's account
          await User.findByIdAndUpdate(
            referrer._id,
            {
              $pull: {
                "referralProgram.pendingReferrals": {
                  referee: user._id,
                },
              },
              $push: {
                "referralProgram.completedReferrals": {
                  referee: user._id,
                  order: order._id,
                  amount: bonusAmount,
                  date: new Date(),
                  status: 'pending'
                },
              },
              $inc: {
                "referralProgram.referralEarnings": bonusAmount,
              },
            },
            { session }
          );

          // Mark user as having made a purchase
          user.hasMadePurchase = true;
          user.firstPurchaseDate = new Date();
          await user.save({ session });

          // Add to order metadata
          order.referralBonus = {
            referrer: referrer._id,
            amount: bonusAmount,
            percentage: referralPercentage,
            processedAt: new Date(),
          };
          
          // Mark order as referral order
          order.isReferral = true;
        }
      }
    }

    // 6. Update order status with simplified payment details
    order.transactionId = reference;
    order.isPaid = true;
    order.paidAt = new Date(transactionData.paid_at || Date.now());
    order.paymentMethod = "paystack";
    
    // Updated payment details structure
    order.paymentDetails = {
      channel: transactionData.channel,
      bank: transactionData.authorization?.bank,
      cardType: transactionData.authorization?.card_type,
      authorizationCode: transactionData.authorization?.authorization_code,
      last4: transactionData.authorization?.last4
    };
    
    order.status = "processing";
    order.statusTrack.push({
      status: "processing",
      date: new Date(),
      note: "Payment verified successfully",
    });

    await order.save({ session });

    // 7. Commit transaction
    await session.commitTransaction();

    return {
      success: true,
      data: {
        orderId: order._id,
        amount: order.totalPrice,
        paidAt: order.paidAt,
        status: order.status,
        reference,
        paymentChannel: transactionData.channel,
        items: order.orderItems.map((item) => ({
          product: item.product.name,
          quantity: item.quantity,
        })),
      },
      message: "Payment verified and order processed successfully",
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Payment verification error:", error);
    return {
      success: false,
      message: error.message || "Failed to verify payment",
      reference,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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

    // Find all PAID orders for the user and sort by creation date descending (newest first)
    const orders = await Order.find({ 
      user: userId,
      isPaid: true // Only include paid orders
    })
      .sort({ createdAt: -1 }) // Sort by date descending
      .populate({
        path: "user",
        select: "name email",
      })
      .populate("shippingAddress");

    return {
      success: true,
      data: sanitizeForClient(orders),
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

// Get order by ID with shipping details (always compute from paidAt)
export const getOrderAndShippingById = async (orderId) => {
  try {
    await dbConnect();

    const order = await Order.findById(orderId)
      .populate({ path: "user", select: "name email phone orderId" })
      .populate("shippingAddress")
      .populate({
        path: "orderItems.product",
        model: "Product",
        select: "name defaultImage productId price slug",
      });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // ensure expectedDeliveryDays exists (compute once when paid)
    let expectedDeliveryDays = order.expectedDeliveryDays || null;

    if ((!expectedDeliveryDays || typeof expectedDeliveryDays !== "string") && order.isPaid && order.paidAt) {
      expectedDeliveryDays = await calculateDeliveryDate(order);
      if (expectedDeliveryDays) {
        // persist normalized numeric string for consistency
        await Order.findByIdAndUpdate(orderId, { expectedDeliveryDays });
      }
    }

    // Always calculate from paidAt + expectedDeliveryDays (ignore status/estimatedDeliveryDate)
    let deliveryDateRange = null;
    if (expectedDeliveryDays && order.paidAt) {
      deliveryDateRange = calculateDateRangeFromDeliveryDays(new Date(order.paidAt), expectedDeliveryDays);
    }

    // Build response
    const orderObject = order.toObject();
    orderObject.expectedDeliveryDays = expectedDeliveryDays || null;

    if (deliveryDateRange) {
      orderObject.deliveryDateRange = {
        from: deliveryDateRange.from,
        to: deliveryDateRange.to,
        isRange: deliveryDateRange.isRange,
      };
    } else {
      // if we couldn't compute (e.g., unpaid), ensure field is absent/null
      orderObject.deliveryDateRange = null;
    }

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