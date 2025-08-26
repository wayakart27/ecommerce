// actions/admin.js
'use server';

import dbConnect from '@/lib/mongodb';
import User from '@/model/User';
import ReferralPayoutSettings from '@/model/ReferralPayoutSettings';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

// Enhanced safe serializer that handles circular references and MongoDB types
const safeSerialize = (data) => {
  const seen = new WeakSet();
  
  const serialize = (value) => {
    // Handle null and primitives
    if (value === null || typeof value !== 'object') {
      return value;
    }
    
    // Handle circular references
    if (seen.has(value)) {
      return '[Circular]';
    }
    seen.add(value);
    
    // Handle Dates
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Handle ObjectIDs
    if (value instanceof mongoose.Types.ObjectId) {
      return value.toString();
    }
    
    // Handle Mongoose documents
    if (value.$__ != null) {
      value = value.toObject();
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => serialize(item));
    }
    
    // Handle buffers
    if (value instanceof Buffer) {
      return value.toString('base64');
    }
    
    // Handle plain objects
    const result = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = serialize(value[key]);
      }
    }
    return result;
  };
  
  try {
    return JSON.parse(JSON.stringify(serialize(data)));
  } catch (error) {
    console.error('Serialization error:', error);
    return null;
  }
};

// Initialize default settings if they don't exist
const ensureSettingsExist = async () => {
  try {
    let settings = await ReferralPayoutSettings.findOne();
    if (!settings) {
      settings = await ReferralPayoutSettings.create({});
      console.log('Created default referral settings');
    }
    return settings;
  } catch (error) {
    console.error('Error ensuring settings exist:', error);
    throw error;
  }
};

// Main dashboard data fetcher
export const getAdminDashboardData = async () => {
  try {
    await dbConnect();
    const settings = await ensureSettingsExist();

    const [totalUsers, recentReferrals] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $match: { "referralProgram.completedReferrals": { $exists: true, $ne: [] } } },
        { $unwind: "$referralProgram.completedReferrals" },
        { $sort: { "referralProgram.completedReferrals.date": -1 } },
        { $limit: 5 },
        { $lookup: {
          from: "users",
          localField: "referralProgram.completedReferrals.referee",
          foreignField: "_id",
          as: "refereeDetails"
        }},
        { $project: {
          name: 1,
          email: 1,
          amount: "$referralProgram.completedReferrals.amount",
          date: "$referralProgram.completedReferrals.date",
          referee: { $arrayElemAt: ["$refereeDetails", 0] }
        }}
      ])
    ]);

    // Process recent referrals
    const processedReferrals = (recentReferrals || []).map(ref => ({
      ...safeSerialize(ref),
      referee: ref.referee ? safeSerialize(ref.referee) : null,
      amount: ref.amount || 0,
      date: ref.date?.toISOString() || new Date().toISOString()
    }));

    return {
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        recentReferrals: processedReferrals,
        payoutStats: {
          minPayoutAmount: settings.minPayoutAmount,
          referralPercentage: settings.referralPercentage
        }
      }
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    return { 
      success: false, 
      message: 'Failed to load dashboard data',
      error: error.message 
    };
  }
};

// Update referral program settings
export const updateReferralSettings = async ({ minPayoutAmount, referralPercentage }) => {
  try {
    await dbConnect();

    // Validate inputs
    if (typeof minPayoutAmount !== 'number' || minPayoutAmount < 1000) {
      return { success: false, message: 'Invalid minimum payout amount' };
    }
    if (typeof referralPercentage !== 'number' || referralPercentage < 0 || referralPercentage > 100) {
      return { success: false, message: 'Invalid referral percentage' };
    }

    // Update or create settings
    const settings = await ReferralPayoutSettings.findOneAndUpdate(
      {},
      { minPayoutAmount, referralPercentage },
      { upsert: true, new: true, runValidators: true }
    );

    // Update all users with reference to these settings
    await User.updateMany(
      {},
      { $set: { 'referralProgram.minPayoutAmount': settings._id } }
    );

    revalidatePath('/admin/referrals');
    return { 
      success: true, 
      data: {
        minPayoutAmount: settings.minPayoutAmount,
        referralPercentage: settings.referralPercentage
      },
      message: 'Settings updated successfully' 
    };
  } catch (error) {
    console.error('Update error:', error);
    return { 
      success: false, 
      message: 'Failed to update settings',
      error: error.message 
    };
  }
};

// Get paginated list of users with their referral data
export const getUsersWithReferrals = async ({ page = 1, limit = 10, search = '' }) => {
  try {
    await dbConnect();
    await ensureSettingsExist();

    const skip = (page - 1) * limit;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'referralProgram.referralCode': { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email referralProgram')
        .populate({
          path: 'referralProgram.minPayoutAmount',
          select: 'minPayoutAmount referralPercentage'
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Process user data
    const processedUsers = users.map(user => {
      const referralProgram = user.referralProgram || {};
      
      // Categorize referrals
      const completedPaid = referralProgram.completedReferrals?.filter(
        ref => ref?.status === 'completed' && ref?.status ==='success'
      ) || [];
      
      const pendingUnpaid = referralProgram.completedReferrals?.filter(
        ref => !ref?.status || ref.status !== 'pending' || !ref.status =='pending'
      ) || [];

      return {
        ...safeSerialize(user),
        _id: user._id.toString(),
        referralProgram: {
          referralCode: referralProgram.referralCode || '',
          referralEarnings: referralProgram.referralEarnings || 0,
          minPayoutAmount: referralProgram.minPayoutAmount?.minPayoutAmount || 500000,
          referralPercentage: referralProgram.minPayoutAmount?.referralPercentage || 1.5,
          pendingCount: referralProgram.pendingReferrals?.length || 0,
          completedCount: completedPaid.length,
          unpaidCount: pendingUnpaid.length,
          pendingReferrals: referralProgram.pendingReferrals?.map(safeSerialize) || [],
          completedReferrals: completedPaid.map(safeSerialize),
          unpaidReferrals: pendingUnpaid.map(safeSerialize)
        }
      };
    });

    return {
      success: true,
      data: {
        users: processedUsers,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Users error:', error);
    return { 
      success: false, 
      message: 'Failed to fetch users',
      error: error.message 
    };
  }
};

// Repair broken database references
export const repairDatabaseReferences = async () => {
  try {
    await dbConnect();
    const settings = await ensureSettingsExist();

    // Find and fix users with invalid references
    const result = await User.updateMany(
      {
        $or: [
          { 'referralProgram.minPayoutAmount': { $exists: false } },
          { 'referralProgram.minPayoutAmount': { $type: ['number', 'string'] } },
          { 'referralProgram.minPayoutAmount': { $not: { $type: 'objectId' } } }
        ]
      },
      { $set: { 'referralProgram.minPayoutAmount': settings._id } }
    );

    return {
      success: true,
      message: `Fixed ${result.modifiedCount} broken references`,
      count: result.modifiedCount
    };
  } catch (error) {
    console.error('Repair error:', error);
    return { 
      success: false, 
      message: 'Failed to repair references',
      error: error.message 
    };
  }
};

// Get detailed referral info for a specific user
export const getUserDetails = async (userId) => {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, message: 'Invalid user ID' };
    }

    const user = await User.findById(userId)
      .populate([
        { 
          path: 'referralProgram.minPayoutAmount',
          select: 'minPayoutAmount referralPercentage'
        },
        {
          path: 'referralProgram.pendingReferrals.referee',
          select: 'name email'
        },
        {
          path: 'referralProgram.completedReferrals.referee',
          select: 'name email'
        }
      ])
      .lean();

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const referralProgram = user.referralProgram || {};
    
    // Calculate referral metrics
    const completedPaid = referralProgram.completedReferrals?.filter(
      ref => ref?.status === 'completed' && ref?.isPaid
    ) || [];
    
    const pendingUnpaid = referralProgram.completedReferrals?.filter(
      ref => !ref?.status || ref.status !== 'completed' || !ref.isPaid
    ) || [];

    const totalEarned = completedPaid.reduce((sum, ref) => sum + (ref?.amount || 0), 0);
    const referralEarnings = pendingUnpaid.reduce((sum, ref) => sum + (ref?.amount || 0), 0);

    return {
      success: true,
      data: {
        ...safeSerialize(user),
        _id: user._id.toString(),
        referralProgram: {
          ...safeSerialize(referralProgram),
          minPayoutAmount: referralProgram.minPayoutAmount?.minPayoutAmount || 500000,
          referralPercentage: referralProgram.minPayoutAmount?.referralPercentage || 1.5,
          totalEarned,
          referralEarnings,
          pendingReferrals: referralProgram.pendingReferrals?.map(safeSerialize) || [],
          completedReferrals: completedPaid.map(safeSerialize),
          unpaidReferrals: pendingUnpaid.map(safeSerialize)
        }
      }
    };
  } catch (error) {
    console.error('User details error:', error);
    return { 
      success: false, 
      message: 'Failed to fetch user details',
      error: error.message 
    };
  }
};

// Update a referral's status
export const updateReferralStatus = async (userId, referralId, status) => {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(referralId)) {
      return { success: false, message: 'Invalid IDs provided' };
    }

    const validStatuses = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return { success: false, message: 'Invalid status value' };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const referral = user.referralProgram.completedReferrals.id(referralId);
    if (!referral) {
      return { success: false, message: 'Referral not found' };
    }

    // Update status
    referral.status = status;
    
    // Mark as paid if completing
    if (status === 'completed') {
      referral.isPaid = true;
    }

    await user.save();
    revalidatePath(`/admin/users/${userId}`);

    return { 
      success: true, 
      data: safeSerialize(referral),
      message: 'Referral status updated successfully' 
    };
  } catch (error) {
    console.error('Status update error:', error);
    return { 
      success: false, 
      message: 'Failed to update referral status',
      error: error.message 
    };
  }
};

export const getPayoutRequests = async ({ page = 1, limit = 10, status = "", search = "", paymentStatus = "" }) => {
  try {
    await dbConnect();

    const skip = (page - 1) * limit;
    
    // Base match stage
    const baseMatch = { 
      "referralProgram.payoutHistory": { $exists: true, $ne: [] } 
    };

    // Status filter (for payout status)
    const statusMatch = status ? { "referralProgram.payoutHistory.status": status } : {};

    // Payment status filter (for failed payments)
    const paymentStatusMatch = paymentStatus ? { "referralProgram.payoutHistory.paymentStatus": paymentStatus } : {};

    // Search filter
    let searchMatch = {};
    if (search) {
      searchMatch = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { "referralProgram.bankDetails.accountName": { $regex: search, $options: 'i' } },
          { "referralProgram.bankDetails.accountNumber": { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get total count for pagination
    const countPipeline = [
      { $match: baseMatch },
      ...(search ? [{ $match: searchMatch }] : []),
      { $unwind: "$referralProgram.payoutHistory" },
      ...(status ? [{ $match: statusMatch }] : []),
      ...(paymentStatus ? [{ $match: paymentStatusMatch }] : []),
      { $count: "total" }
    ];

    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Get paginated results
    const users = await User.aggregate([
      { $match: baseMatch },
      ...(search ? [{ $match: searchMatch }] : []),
      { $unwind: "$referralProgram.payoutHistory" },
      ...(status ? [{ $match: statusMatch }] : []),
      ...(paymentStatus ? [{ $match: paymentStatusMatch }] : []),
      { $sort: { "referralProgram.payoutHistory.requestedAt": -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          email: 1,
          bankDetails: "$referralProgram.bankDetails",
          payout: "$referralProgram.payoutHistory",
          _id: 1
        }
      }
    ]);

    // Serialize the results
    const serializedPayouts = users.map(user => ({
      ...user,
      _id: user._id.toString(),
      payout: {
        ...user.payout,
        _id: user.payout._id.toString(),
        requestedAt: user.payout.requestedAt.toISOString(),
        ...(user.payout.processedAt && { processedAt: user.payout.processedAt.toISOString() }),
        ...(user.payout.completedAt && { completedAt: user.payout.completedAt.toISOString() }),
        ...(user.payout.lastAttempt && { lastAttempt: user.payout.lastAttempt.toISOString() })
      },
      bankDetails: user.bankDetails ? {
        ...user.bankDetails,
        ...(user.bankDetails._id && { _id: user.bankDetails._id.toString() })
      } : null
    }));

    return {
      success: true,
      data: {
        payouts: serializedPayouts,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    };
  } catch (error) {
    console.error("Error fetching payout requests:", error);
    return {
      success: false,
      message: "Failed to fetch payout requests",
      error: error.message
    };
  }
};

export const updatePayoutStatus = async (userId, payoutId, status) => {
  try {
    await dbConnect();

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(payoutId)) {
      return {
        success: false,
        message: "Invalid user or payout ID",
        data: null
      };
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: "Invalid status value",
        data: null
      };
    }

    // First find the user and payout to get details
    const user = await User.findOne({
      _id: userId,
      "referralProgram.payoutHistory._id": payoutId
    });

    if (!user) {
      return {
        success: false,
        message: "Payout request not found",
        data: null
      };
    }

    const payout = user.referralProgram.payoutHistory.find(p => p._id.equals(payoutId));

    // Update the payout status
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        "referralProgram.payoutHistory._id": payoutId
      },
      {
        $set: {
          "referralProgram.payoutHistory.$.status": status,
          "referralProgram.payoutHistory.$.processedAt": new Date(),
          ...(status === 'failed' && {
            "referralProgram.payoutHistory.$.paymentStatus": 'failed'
          })
        }
      },
      { new: true }
    ).lean();

    if (status === "completed") {
      // Mark related completed referrals as paid
      await User.updateMany(
        {
          _id: userId,
          "referralProgram.completedReferrals.status": "pending",
          "referralProgram.completedReferrals.paymentStatus": 'processing'
        },
        {
          $set: {
            "referralProgram.completedReferrals.$[elem].status": 'completed',
            "referralProgram.completedReferrals.$[elem].paymentStatus": 'paid',
            "referralProgram.completedReferrals.$[elem].paidAt": new Date()
          }
        },
        {
          arrayFilters: [
            { 
              "elem.status": "pending", 
              "elem.paymentStatus": 'processing' 
            }
          ]
        }
      );
    }

    revalidatePath("/admin/payouts");
    return {
      success: true,
      message: `Payout ${status} successfully`,
      data: {
        user: {
          _id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email
        },
        payout: {
          ...safeSerialize(payout),
          _id: payout._id.toString(),
          status,
          processedAt: new Date().toISOString()
        }
      }
    };
  } catch (error) {
    console.error("Error updating payout status:", error);
    return {
      success: false,
      message: "Failed to update payout status",
      error: error.message,
      data: null
    };
  }
};

export const retryFailedPayout = async (payoutId) => {
  try {
    await dbConnect();

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(payoutId)) {
      return {
        success: false,
        message: "Invalid payout ID",
        data: null
      };
    }

    // 1. Find the user with the failed payout
    const user = await User.findOne({
      "referralProgram.payoutHistory._id": payoutId,
      "referralProgram.payoutHistory.status": "failed"
    }).lean();

    if (!user) {
      return {
        success: false,
        message: "Payout not found or not in failed status",
        data: null
      };
    }

    // 2. Extract the specific payout
    const payout = user.referralProgram.payoutHistory.find(
      (p) => p._id.toString() === payoutId
    );

    if (!payout) {
      return {
        success: false,
        message: "Payout not found",
        data: null
      };
    }

    // 3. Verify the payment status is actually failed
    if (payout.paymentStatus !== "failed") {
      return {
        success: false,
        message: "Payout is not in failed state",
        data: null
      };
    }

    // 4. Prepare serialized bank details
    const bankDetails = {
      accountName: user.referralProgram.bankDetails?.accountName || '',
      accountNumber: user.referralProgram.bankDetails?.accountNumber || '',
      bankCode: user.referralProgram.bankDetails?.bankCode || '',
      bankName: user.referralProgram.bankDetails?.bankName || '',
    };

    // 5. Call payment processor API with serialized data
    const paymentResult = await processPayout({
      userId: user._id.toString(),
      amount: payout.amount,
      bankDetails: safeSerialize(bankDetails),
      reference: `retry-${payout._id.toString()}`
    });

    if (!paymentResult.success) {
      // Update the payout record with the new failure
      await User.updateOne(
        { _id: user._id, "referralProgram.payoutHistory._id": payoutId },
        {
          $set: {
            "referralProgram.payoutHistory.$.paymentStatus": "failed",
            "referralProgram.payoutHistory.$.lastAttempt": new Date(),
            "referralProgram.payoutHistory.$.error": paymentResult.message
          }
        }
      );

      return {
        success: false,
        message: paymentResult.message || "Failed to process payout retry",
        data: {
          payoutId: payout._id.toString(),
          status: "failed",
          lastAttempt: new Date().toISOString()
        }
      };
    }

    // 6. Update the payout record with success
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id, "referralProgram.payoutHistory._id": payoutId },
      {
        $set: {
          "referralProgram.payoutHistory.$.paymentStatus": "success",
          "referralProgram.payoutHistory.$.status": "completed",
          "referralProgram.payoutHistory.$.completedAt": new Date(),
          "referralProgram.payoutHistory.$.processorReference": paymentResult.referenceId,
          "referralProgram.payoutHistory.$.lastAttempt": new Date()
        }
      },
      { new: true }
    ).lean();

    // 7. Return fully serialized response
    return {
      success: true,
      message: "Payout retry processed successfully",
      data: {
        user: {
          _id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email
        },
        payout: {
          ...safeSerialize(payout),
          _id: payout._id.toString(),
          status: "completed",
          paymentStatus: "success",
          completedAt: new Date().toISOString(),
          processorReference: paymentResult.referenceId
        },
        bankDetails: safeSerialize(bankDetails)
      }
    };

  } catch (error) {
    console.error("Error retrying failed payout:", error);
    return {
      success: false,
      message: "An error occurred while retrying payout",
      error: error.message,
      data: null
    };
  }
};

// Helper function - Mock payment processor (replace with actual implementation)
async function processPayout({ userId, amount, bankDetails, reference }) {
  try {
    // In a real implementation, this would call your payment provider API
    // This is a mock implementation for demonstration
    
    if (amount > 1000000) { // Simulate failure for large amounts
      return {
        success: false,
        message: "Insufficient funds",
        referenceId: null
      };
    }

    // Simulate successful payment
    return {
      success: true,
      referenceId: `pay_${Date.now()}`,
      message: "Payment processed successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Payment processing failed",
      referenceId: null
    };
  }
}