'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import User from '@/model/User';

export async function fetchReferralUsers() {
  try {
    await dbConnect();

    const users = await User.aggregate([
      {
        $match: {
          $or: [
            { 'referralProgram.pendingReferrals.0': { $exists: true } },
            { 'referralProgram.completedReferrals.0': { $exists: true } }
          ]
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          createdAt: 1,
          completedReferrals: { $size: '$referralProgram.completedReferrals' },
          pendingReferrals: { $size: '$referralProgram.pendingReferrals' }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    return {
      success: true,
      message: 'Successfully fetched referral users',
      data: users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        completedReferrals: user.completedReferrals,
        pendingReferrals: user.pendingReferrals
      }))
    };
  } catch (error) {
    console.error('Error fetching referral users:', error);
    return {
      success: false,
      message: 'Failed to fetch referral users',
      error: error.message
    };
  }
}

export async function fetchReferralUserDetails(userId) {
  try {
    await dbConnect();

    const user = await User.findById(userId)
      .populate({
        path: 'referralProgram.pendingReferrals.referee',
        select: 'name email createdAt'
      })
      .populate({
        path: 'referralProgram.completedReferrals.referee',
        select: 'name email createdAt'
      })
      .populate({
        path: 'referralProgram.completedReferrals.order',
        select: 'orderTotal status createdAt'
      })
      .lean();

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'User not found'
      };
    }

    // Ensure we always return arrays for referrals
    return {
      success: true,
      message: 'Successfully fetched referral user details',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          referralCode: user.referralProgram?.referralCode || '',
          createdAt: user.createdAt.toISOString()
        },
        pendingReferrals: user.referralProgram?.pendingReferrals?.map(ref => ({
          referee: {
            id: ref.referee?._id?.toString() || '',
            name: ref.referee?.name || '',
            email: ref.referee?.email || '',
            date: ref.date?.toISOString() || new Date().toISOString()
          },
          hasPurchased: ref.hasPurchased || false,
          date: ref.date?.toISOString() || new Date().toISOString()
        })) || [], // Fallback to empty array
        completedReferrals: user.referralProgram?.completedReferrals?.map(ref => ({
          referee: {
            id: ref.referee?._id?.toString() || '',
            name: ref.referee?.name || '',
            email: ref.referee?.email || '',
            date: ref.date?.toISOString() || new Date().toISOString()
          },
          order: ref.order ? {
            id: ref.order._id?.toString() || '',
            total: ref.order.orderTotal || 0,
            status: ref.order.status || '',
            date: ref.order.createdAt?.toISOString() || new Date().toISOString()
          } : null,
          amount: ref.amount || 0,
          status: ref.status || 'pending',
          paymentStatus: ref.paymentStatus || 'pending',
          date: ref.date?.toISOString() || new Date().toISOString()
        })) || [] // Fallback to empty array
      }
    };
  } catch (error) {
    console.error('Error fetching referral user details:', error);
    return {
      success: false,
      message: 'Failed to fetch referral user details',
      error: error.message
    };
  }
}

export async function fetchAllReferralUsers() {
  try {
    await dbConnect();

    const users = await User.find({
      $or: [
        { 'referralProgram.pendingReferrals.0': { $exists: true } },
        { 'referralProgram.completedReferrals.0': { $exists: true }}
      ]
    })
    .populate({
      path: 'referralProgram.pendingReferrals.referee',
      select: 'name email createdAt'
    })
    .populate({
      path: 'referralProgram.completedReferrals.referee',
      select: 'name email createdAt'
    })
    .populate({
      path: 'referralProgram.completedReferrals.order',
      select: 'orderTotal status createdAt'
    })
    .lean();

    if (!users.length) {
      return {
        success: false,
        message: 'No users with referral data found',
        error: 'No data'
      };
    }

    // Serialize all user data
    const serializedUsers = users.map(user => ({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        referralCode: user.referralProgram?.referralCode || '',
        createdAt: user.createdAt.toISOString()
      },
      pendingReferrals: user.referralProgram?.pendingReferrals?.map(ref => ({
        referee: {
          id: ref.referee?._id?.toString() || '',
          name: ref.referee?.name || '',
          email: ref.referee?.email || '',
          date: ref.date?.toISOString() || new Date().toISOString()
        },
        hasPurchased: ref.hasPurchased || false,
        date: ref.date?.toISOString() || new Date().toISOString()
      })) || [],
      completedReferrals: user.referralProgram?.completedReferrals?.map(ref => ({
        referee: {
          id: ref.referee?._id?.toString() || '',
          name: ref.referee?.name || '',
          email: ref.referee?.email || '',
          date: ref.date?.toISOString() || new Date().toISOString()
        },
        order: ref.order ? {
          id: ref.order._id?.toString() || '',
          total: ref.order.orderTotal || 0,
          status: ref.order.status || '',
          date: ref.order.createdAt?.toISOString() || new Date().toISOString()
        } : null,
        amount: ref.amount || 0,
        status: ref.status || 'pending',
        paymentStatus: ref.paymentStatus || 'pending',
        date: ref.date?.toISOString() || new Date().toISOString()
      })) || []
    }));

    return {
      success: true,
      message: 'Successfully fetched all referral users',
      data: serializedUsers
    };
  } catch (error) {
    console.error('Error fetching all referral users:', error);
    return {
      success: false,
      message: 'Failed to fetch referral users',
      error: error.message
    };
  }
}

export async function fetchPaginatedReferrals({
  page = 1,
  limit = 10,
  search = '',
  status = 'all',
  dateRange = 'all',
  paymentStatus = 'all' // Add payment status filter
}) {
  try {
    await dbConnect();

    const skip = (page - 1) * limit;

    // Base query for users with any referrals
    let baseQuery = {
      $or: [
        { 'referralProgram.pendingReferrals.0': { $exists: true } },
        { 'referralProgram.completedReferrals.0': { $exists: true } },
        { 'referralProgram.payoutHistory.0': { $exists: true } }
      ]
    };

    // Search conditions
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      baseQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { 'referralProgram.referralCode': searchRegex },
        { 'referralProgram.pendingReferrals.referee.name': searchRegex },
        { 'referralProgram.completedReferrals.referee.name': searchRegex },
        { 'referralProgram.completedReferrals.paymentStatus': searchRegex },
        { 'referralProgram.payoutHistory.paymentStatus': searchRegex }
      ];
    }

    // Payment status filter setup
    const getPaymentStatusFilter = () => {
      if (paymentStatus === 'all') return {};
      
      return {
        $or: [
          { 'referralProgram.completedReferrals.paymentStatus': paymentStatus },
          { 'referralProgram.payoutHistory.paymentStatus': paymentStatus }
        ]
      };
    };

    // Date range filter setup
    const getDateRangeFilter = () => {
      const now = new Date();
      const filters = { pending: {}, completed: {}, payout: {} };

      if (dateRange === 'today') {
        const startOfDay = new Date(now);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setUTCHours(23, 59, 59, 999);
        
        filters.pending = {
          'referralProgram.pendingReferrals.date': {
            $gte: startOfDay,
            $lte: endOfDay
          }
        };
        filters.completed = {
          'referralProgram.completedReferrals.date': {
            $gte: startOfDay,
            $lte: endOfDay
          }
        };
        filters.payout = {
          'referralProgram.payoutHistory.requestedAt': {
            $gte: startOfDay,
            $lte: endOfDay
          }
        };
      } else if (dateRange === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setUTCDate(now.getUTCDate() - 7);
        startOfWeek.setUTCHours(0, 0, 0, 0);
        
        filters.pending = {
          'referralProgram.pendingReferrals.date': {
            $gte: startOfWeek
          }
        };
        filters.completed = {
          'referralProgram.completedReferrals.date': {
            $gte: startOfWeek
          }
        };
        filters.payout = {
          'referralProgram.payoutHistory.requestedAt': {
            $gte: startOfWeek
          }
        };
      } else if (dateRange === 'month') {
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        startOfMonth.setUTCHours(0, 0, 0, 0);
        
        filters.pending = {
          'referralProgram.pendingReferrals.date': {
            $gte: startOfMonth
          }
        };
        filters.completed = {
          'referralProgram.completedReferrals.date': {
            $gte: startOfMonth
          }
        };
        filters.payout = {
          'referralProgram.payoutHistory.requestedAt': {
            $gte: startOfMonth
          }
        };
      }

      return filters;
    };

    // Status filter setup
    const getStatusFilter = () => {
      if (status === 'pending') {
        return { 'referralProgram.pendingReferrals.0': { $exists: true } };
      } else if (status === 'completed') {
        return { 'referralProgram.completedReferrals.0': { $exists: true } };
      } else if (status === 'payout') {
        return { 'referralProgram.payoutHistory.0': { $exists: true } };
      }
      return {};
    };

    // Combine all filters
    const dateFilters = dateRange !== 'all' ? getDateRangeFilter() : {};
    const statusFilter = status !== 'all' ? getStatusFilter() : {};
    const paymentStatusFilter = paymentStatus !== 'all' ? getPaymentStatusFilter() : {};

    const query = {
      $and: [
        baseQuery,
        ...(dateRange !== 'all'
          ? [{ $or: [dateFilters.pending, dateFilters.completed, dateFilters.payout] }]
          : []),
        ...(status !== 'all' ? [statusFilter] : []),
        ...(paymentStatus !== 'all' ? [paymentStatusFilter] : [])
      ].filter(Boolean)
    };

    // Get total count
    const totalUsers = await User.countDocuments(query);

    // Get paginated results with proper population
    const users = await User.find(query)
      .populate({
        path: 'referralProgram.pendingReferrals.referee',
        select: 'name email createdAt',
        match: status === 'all' || status === 'pending' ? {} : { _id: null }
      })
      .populate({
        path: 'referralProgram.completedReferrals.referee',
        select: 'name email createdAt',
        match: status === 'all' || status === 'completed' ? {} : { _id: null }
      })
      .populate({
        path: 'referralProgram.completedReferrals.order',
        select: 'totalPrice status createdAt paymentStatus'
      })
      .populate({
        path: 'referralProgram.payoutHistory',
        match: status === 'all' || status === 'payout' ? {} : { _id: null }
      })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate totals and serialize data
    let totalAmount = 0;
    let totalReferrals = 0;
    let pendingCount = 0;
    let completedCount = 0;
    let payoutCount = 0;

    const serializedUsers = users.map(user => {
      // Apply status filter to referrals
      const pending = (status === 'all' || status === 'pending') 
        ? user.referralProgram?.pendingReferrals?.filter(ref => {
            if (!ref) return false;
            if (dateRange === 'all') return true;
            
            const refDate = new Date(ref.date);
            const now = new Date();
            
            if (dateRange === 'today') {
              return refDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
            } else if (dateRange === 'week') {
              const weekAgo = new Date(now);
              weekAgo.setDate(now.getDate() - 7);
              return refDate >= weekAgo;
            } else if (dateRange === 'month') {
              return refDate.getMonth() === now.getMonth() && 
                     refDate.getFullYear() === now.getFullYear();
            }
            return true;
          }) || []
        : [];
      
      const completed = (status === 'all' || status === 'completed') 
        ? user.referralProgram?.completedReferrals?.filter(ref => {
            if (!ref) return false;
            if (dateRange === 'all') return true;
            
            const refDate = new Date(ref.date);
            const now = new Date();
            
            if (dateRange === 'today') {
              return refDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
            } else if (dateRange === 'week') {
              const weekAgo = new Date(now);
              weekAgo.setDate(now.getDate() - 7);
              return refDate >= weekAgo;
            } else if (dateRange === 'month') {
              return refDate.getMonth() === now.getMonth() && 
                     refDate.getFullYear() === now.getFullYear();
            }
            return true;
          }) || []
        : [];

      const payoutHistory = (status === 'all' || status === 'payout') 
        ? user.referralProgram?.payoutHistory?.filter(payout => {
            if (!payout) return false;
            if (dateRange === 'all') return true;
            
            const payoutDate = new Date(payout.requestedAt || payout.date);
            const now = new Date();
            
            if (dateRange === 'today') {
              return payoutDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
            } else if (dateRange === 'week') {
              const weekAgo = new Date(now);
              weekAgo.setDate(now.getDate() - 7);
              return payoutDate >= weekAgo;
            } else if (dateRange === 'month') {
              return payoutDate.getMonth() === now.getMonth() && 
                     payoutDate.getFullYear() === now.getFullYear();
            }
            return true;
          }) || []
        : [];

      // Apply payment status filter
      const filteredCompleted = paymentStatus !== 'all' 
        ? completed.filter(ref => ref.paymentStatus === paymentStatus)
        : completed;

      const filteredPayoutHistory = paymentStatus !== 'all'
        ? payoutHistory.filter(payout => payout.paymentStatus === paymentStatus)
        : payoutHistory;

      const completedAmount = filteredCompleted.reduce((sum, ref) => sum + (ref.amount || 0), 0);
      totalAmount += completedAmount;
      totalReferrals += pending.length + filteredCompleted.length + filteredPayoutHistory.length;
      pendingCount += pending.length;
      completedCount += filteredCompleted.length;
      payoutCount += filteredPayoutHistory.length;

      return {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          referralCode: user.referralProgram?.referralCode || '',
          createdAt: user.createdAt.toISOString()
        },
        pendingReferrals: pending.map(ref => ({
          referee: {
            id: ref.referee?._id?.toString() || '',
            name: ref.referee?.name || '',
            email: ref.referee?.email || '',
            date: ref.date?.toISOString() || new Date().toISOString()
          },
          hasPurchased: ref.hasPurchased || false,
          date: ref.date?.toISOString() || new Date().toISOString()
        })),
        completedReferrals: filteredCompleted.map(ref => ({
          referee: {
            id: ref.referee?._id?.toString() || '',
            name: ref.referee?.name || '',
            email: ref.referee?.email || '',
            date: ref.date?.toISOString() || new Date().toISOString()
          },
          order: ref.order ? {
            id: ref.order._id?.toString() || '',
            total: ref.order.totalPrice || 0,
            status: ref.order.status || '',
            paymentStatus: ref.order.paymentStatus || '',
            date: ref.order.createdAt?.toISOString() || new Date().toISOString()
          } : null,
          amount: ref.amount || 0,
          status: ref.status || 'pending',
          paymentStatus: ref.paymentStatus || 'pending',
          date: ref.date?.toISOString() || new Date().toISOString()
        })),
        payoutHistory: filteredPayoutHistory.map(payout => ({
          amount: payout.amount || 0,
          requestedAt: payout.requestedAt?.toISOString() || new Date().toISOString(),
          status: payout.status || 'pending',
          paymentStatus: payout.paymentStatus || 'pending',
          bankDetails: payout.bankDetails || {},
          paystackReference: payout.paystackReference || '',
          processedAt: payout.processedAt?.toISOString() || null
        }))
      };
    });

    return {
      success: true,
      data: {
        users: serializedUsers,
        pagination: {
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
          currentPage: page,
          limit
        },
        totals: {
          amount: totalAmount,
          referrals: totalReferrals,
          pending: pendingCount,
          completed: completedCount,
          payout: payoutCount
        }
      }
    };
  } catch (error) {
    console.error('Error fetching paginated referrals:', error);
    return {
      success: false,
      message: 'Failed to fetch referral data',
      error: error.message
    };
  }
}