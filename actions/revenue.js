// actions/revenue-actions.js
'use server';

import dbConnect from '@/lib/mongodb';
import { calculatePaystackCharges } from '@/lib/paystack-charges';
import { Order } from '@/model/Order';
import { Products } from '@/model/Products';
import User from '@/model/User';

// Helper function to convert local date to UTC
function convertToUTC(date) {
  if (!date) return null;
  const localDate = new Date(date);
  return new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0, 0, 0, 0
  ));
}

// Helper function to convert local date to end of day UTC
function convertToUTCEndOfDay(date) {
  if (!date) return null;
  const localDate = new Date(date);
  return new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    23, 59, 59, 999
  ));
}

// Simple safe serialization function
function safeSerializeOrder(order) {
  const serialized = { ...order };

  // Convert _id to string if it exists
  if (serialized._id && typeof serialized._id === 'object') {
    serialized._id = serialized._id.toString();
  }

  // Handle user field safely
  if (serialized.user && typeof serialized.user === 'object' && serialized.user !== null) {
    if (serialized.user._id && typeof serialized.user._id === 'object') {
      serialized.user._id = serialized.user._id.toString();
    }
  } else {
    serialized.user = { _id: null, name: 'Unknown', email: '' };
  }

  // Handle referralBonus safely
  if (
    serialized.referralBonus &&
    serialized.referralBonus.referrer &&
    typeof serialized.referralBonus.referrer === 'object' &&
    serialized.referralBonus.referrer !== null
  ) {
    if (
      serialized.referralBonus.referrer._id &&
      typeof serialized.referralBonus.referrer._id === 'object'
    ) {
      serialized.referralBonus.referrer._id =
        serialized.referralBonus.referrer._id.toString();
    }
  }

  // Handle orderItems safely
  if (Array.isArray(serialized.orderItems)) {
    serialized.orderItems = serialized.orderItems.map((item) => {
      const product =
        item.product && typeof item.product === 'object' && item.product !== null
          ? {
              ...item.product,
              _id: item.product._id
                ? item.product._id.toString()
                : null,
              purchasePrice: item.product.purchasePrice || 0,
              name: item.product.name || 'Unknown',
            }
          : { _id: null, purchasePrice: 0, name: 'Unknown' };

      return { ...item, product };
    });
  } else {
    serialized.orderItems = [];
  }

  return serialized;
}

export async function getRevenueData({
  page = 1,
  limit = 10,
  search = '',
  startDate = null,
  endDate = null,
  status = 'all'
}) {
  try {
    await dbConnect();
    
    const skip = (page - 1) * limit;
    let query = { isPaid: true };

    // Search filter
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id').lean();
      
      const userIds = users.map(user => user._id.toString());
      
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    // Date range filter (UTC)
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = convertToUTC(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = convertToUTCEndOfDay(endDate);
      }
    }

    // Status filter
    if (status !== 'all') {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate([
          {
            path: 'user',
            select: 'name email'
          },
          {
            path: 'orderItems.product',
            select: 'name purchasePrice'
          },
          {
            path: 'referralBonus.referrer',
            select: 'name email'
          }
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);

    // Calculate revenue metrics for each order
    const revenueData = orders.map((order, index) => {
      const serialized = safeSerializeOrder(order);
      
      // Calculate profit/loss from order items
      let totalProfitLoss = 0;
      let totalItemsCost = 0;
      let totalQuantity = 0;
      
      serialized.orderItems.forEach(item => {
        const purchasePrice = item.product?.purchasePrice || 0;
        const itemCost = purchasePrice * item.quantity;
        const itemRevenue = item.discountedPrice * item.quantity;
        totalProfitLoss += (itemRevenue - itemCost);
        totalItemsCost += itemCost;
        totalQuantity += item.quantity;
      });

      // Calculate referral costs if applicable
      const referralEarning = serialized.isReferral && serialized.referralBonus 
        ? serialized.referralBonus.amount 
        : 0;
      
      const referralPercentage = serialized.isReferral && serialized.referralBonus 
        ? serialized.referralBonus.percentage 
        : 0;

      // Calculate Paystack charges
      const paymentChannel = serialized.paymentDetails?.channel || 'card';
      const paystackCharges = calculatePaystackCharges(serialized.totalPrice, paymentChannel);

      // Calculate final revenue (Net Profit)
      const revenue = totalProfitLoss - referralEarning - paystackCharges;

      return {
        sn: skip + index + 1,
        _id: serialized._id,
        orderId: serialized.orderId,
        createdAt: serialized.createdAt.toISOString(),
        user: serialized.user,
        profitLoss: parseFloat(totalProfitLoss.toFixed(2)),
        shippingFee: parseFloat(serialized.shippingPrice.toFixed(2)),
        referee: serialized.isReferral && serialized.referralBonus?.referrer 
          ? {
              _id: serialized.referralBonus.referrer._id,
              name: serialized.referralBonus.referrer.name,
              email: serialized.referralBonus.referrer.email
            }
          : null,
        refereeEarning: parseFloat(referralEarning.toFixed(2)),
        refereePercentage: parseFloat(referralPercentage.toFixed(2)),
        paystackCharges: parseFloat(paystackCharges.toFixed(2)),
        paymentChannel: paymentChannel,
        revenue: parseFloat(revenue.toFixed(2)),
        status: serialized.status,
        totalPrice: parseFloat(serialized.totalPrice.toFixed(2)),
        itemsPrice: parseFloat(serialized.itemsPrice.toFixed(2)),
        totalItemsCost: parseFloat(totalItemsCost.toFixed(2)),
        totalQuantity: totalQuantity
      };
    });

    // Calculate totals
    const totals = revenueData.reduce((acc, item) => ({
      totalSales: acc.totalSales + item.totalPrice,
      totalItemsCost: acc.totalItemsCost + item.totalItemsCost,
      totalProfitLoss: acc.totalProfitLoss + item.profitLoss,
      totalShippingFee: acc.totalShippingFee + item.shippingFee,
      totalRefereeEarning: acc.totalRefereeEarning + item.refereeEarning,
      totalPaystackCharges: acc.totalPaystackCharges + item.paystackCharges,
      totalRevenue: acc.totalRevenue + item.revenue,
      totalOrders: acc.totalOrders + 1,
      totalQuantity: acc.totalQuantity + item.totalQuantity
    }), {
      totalSales: 0,
      totalItemsCost: 0,
      totalProfitLoss: 0,
      totalShippingFee: 0,
      totalRefereeEarning: 0,
      totalPaystackCharges: 0,
      totalRevenue: 0,
      totalOrders: 0,
      totalQuantity: 0
    });

    return {
      success: true,
      data: revenueData,
      totals: {
        totalSales: parseFloat(totals.totalSales.toFixed(2)),
        totalItemsCost: parseFloat(totals.totalItemsCost.toFixed(2)),
        totalProfitLoss: parseFloat(totals.totalProfitLoss.toFixed(2)),
        totalShippingFee: parseFloat(totals.totalShippingFee.toFixed(2)),
        totalRefereeEarning: parseFloat(totals.totalRefereeEarning.toFixed(2)),
        totalPaystackCharges: parseFloat(totals.totalPaystackCharges.toFixed(2)),
        totalRevenue: parseFloat(totals.totalRevenue.toFixed(2)),
        totalOrders: totals.totalOrders,
        totalQuantity: totals.totalQuantity
      },
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return { 
      success: false, 
      message: 'Failed to fetch revenue data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    };
  }
}


export async function exportRevenueData({
  startDate = null,
  endDate = null,
  status = 'all',
  search = ''
}) {
  try {
    await dbConnect();
    
    let query = { isPaid: true };

    // Search filter
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id').lean();
      
      const userIds = users.map(user => user._id.toString());
      
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    // Date range filter (UTC)
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = convertToUTC(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = convertToUTCEndOfDay(endDate);
      }
    }

    // Status filter
    if (status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate([
        {
          path: 'user',
          select: 'name email'
        },
        {
          path: 'orderItems.product',
          select: 'name purchasePrice'
        },
        {
          path: 'referralBonus.referrer',
          select: 'name email'
        }
      ])
      .sort({ createdAt: -1 })
      .lean();

    // Use the safe serialization function
    const serializedOrders = orders.map(order => safeSerializeOrder(order));

    // Format data for export
    const exportData = serializedOrders.map((order, index) => {
      let totalProfitLoss = 0;
      let totalItemsCost = 0;
      let totalQuantity = 0;
      
      order.orderItems.forEach(item => {
        const purchasePrice = item.product?.purchasePrice || 0;
        const itemCost = purchasePrice * item.quantity;
        const itemRevenue = item.discountedPrice * item.quantity;
        totalProfitLoss += (itemRevenue - itemCost);
        totalItemsCost += itemCost;
        totalQuantity += item.quantity;
      });

      const referralEarning = order.isReferral && order.referralBonus 
        ? order.referralBonus.amount 
        : 0;

      // Calculate Paystack charges
      const paymentChannel = order.paymentDetails?.channel || 'card';
      const paystackCharges = calculatePaystackCharges(order.totalPrice, paymentChannel);

      const revenue = totalProfitLoss - referralEarning - paystackCharges;

      return {
        'S/N': index + 1,
        'Order ID': order.orderId,
        'Date': new Date(order.createdAt).toISOString().split('T')[0],
        'Customer Name': order.user?.name || 'Unknown',
        'Customer Email': order.user?.email || '',
        'Total Sales': order.totalPrice,
        'Items Cost': totalItemsCost,
        'Gross Profit': totalProfitLoss,
        'Shipping Fee': order.shippingPrice,
        'Total Quantity': totalQuantity,
        'Is Referral': order.isReferral ? 'Yes' : 'No',
        'Referee Name': order.isReferral && order.referralBonus?.referrer 
          ? order.referralBonus.referrer.name 
          : '',
        'Referee Email': order.isReferral && order.referralBonus?.referrer 
          ? order.referralBonus.referrer.email 
          : '',
        'Referee Earning': referralEarning,
        'Referee Percentage': order.isReferral && order.referralBonus 
          ? order.referralBonus.percentage 
          : 0,
        'Payment Channel': paymentChannel,
        'Paystack Charges': paystackCharges,
        'Net Revenue': revenue,
        'Status': order.status
      };
    });

    return {
      success: true,
      data: exportData,
      filename: `revenue-report-${new Date().toISOString().split('T')[0]}.csv`
    };
  } catch (error) {
    console.error('Error exporting revenue data:', error);
    return { 
      success: false, 
      message: 'Failed to export revenue data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    };
  }
}