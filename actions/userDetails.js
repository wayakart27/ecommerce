'use server';

import dbConnect from '@/lib/mongodb';
import User from '@/model/User';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';

export const getUserDetails = async (userId) => {
  try {
    await dbConnect();

    const user = await User.findById(userId)
      .select('name email role image phone status referralProgram')
      .populate([
        {
          path: 'referralProgram.pendingReferrals.referee',
          select: 'name email',
          model: 'User'
        },
        {
          path: 'referralProgram.completedReferrals.referee',
          select: 'name email',
          model: 'User'
        }
      ])
      .lean();

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Ensure all referral program fields exist
    const referralProgram = {
      referralCode: user.referralProgram?.referralCode || 'N/A',
      referralEarnings: user.referralProgram?.referralEarnings || 0,
      pendingReferrals: user.referralProgram?.pendingReferrals || [],
      completedReferrals: user.referralProgram?.completedReferrals || [],
      payoutHistory: user.referralProgram?.payoutHistory || [],
      minPayoutAmount: user.referralProgram?.minPayoutAmount || 500000,
      totalEarned: user.referralProgram?.totalEarned || 0,
      bankDetails: user.referralProgram?.bankDetails || null
    };

    return { 
      success: true, 
      data: {
        ...user,
        referralProgram
      } 
    };
  } catch (error) {
    console.error('Get user details error:', error);
    return { success: false, message: 'Failed to fetch user details' };
  }
};

// export const updateUserReferralStatus = async (userId, referralId, status) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     await dbConnect();

//     // 1. Find the user with the specific pending referral
//     const user = await User.findOne({
//       _id: userId,
//       'referralProgram.pendingReferrals._id': referralId
//     }).session(session);

//     if (!user) {
//       await session.abortTransaction();
//       return { success: false, message: 'User or referral not found' };
//     }

//     // 2. Find the specific pending referral
//     const pendingReferral = user.referralProgram.pendingReferrals.find(
//       ref => ref._id.toString() === referralId
//     );

//     if (!pendingReferral) {
//       await session.abortTransaction();
//       return { success: false, message: 'Referral not found' };
//     }

//     // 3. Validate amount
//     const amount = pendingReferral.amount || 0;
//     if (amount < 0) {
//       await session.abortTransaction();
//       return { success: false, message: 'Referral amount cannot be negative' };
//     }

//     // 4. Prepare update operation
//     const update = {
//       $pull: { 'referralProgram.pendingReferrals': { _id: referralId } },
//       $push: {
//         'referralProgram.completedReferrals': {
//           referee: pendingReferral.referee,
//           order: pendingReferral.order,
//           amount,
//           date: new Date(),
//           status: status === 'approve' ? 'completed' : 'failed',
//         }
//       }
//     };

//     // 5. Only increment for approved referrals
//     if (status === 'approve') {
//       update.$inc = {
//         'referralProgram.totalEarned': amount,
//         'referralProgram.referralEarnings': amount
//       };
//     }

//     // 6. Execute the update
//     const result = await User.updateOne(
//       { _id: userId },
//       update,
//       { session }
//     );

//     if (result.modifiedCount === 0) {
//       await session.abortTransaction();
//       return { success: false, message: 'Referral not updated' };
//     }

//     // 7. Commit transaction
//     await session.commitTransaction();
//     revalidatePath('/admin/users');

//     return {
//       success: true,
//       message: `Referral ${status === 'approve' ? 'approved' : 'rejected'} successfully`,
//       amount: status === 'approve' ? amount : 0
//     };

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Update referral error:', error);
//     return { 
//       success: false, 
//       message: 'Failed to update referral status',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     };
//   } finally {
//     session.endSession();
//   }
// };


// Database connection helper


// Paystack transfer function

const initiatePaystackTransfer = async (recipientCode, amount, reason) => {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',
        amount,
        recipient: recipientCode,
        reason
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      reference: response.data.data.reference,
      status: response.data.data.status
    };
  } catch (error) {
    console.error('Paystack transfer error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to initiate transfer'
    };
  }
};

export const updateUserReferralStatus = async (userId, referralId, status) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();

    // 1. Find the user with the specific pending referral
    const user = await User.findOne({
      _id: userId,
      'referralProgram.pendingReferrals._id': referralId
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return { success: false, message: 'User or referral not found' };
    }

    // 2. Find the specific pending referral
    const pendingReferral = user.referralProgram.pendingReferrals.find(
      ref => ref._id.toString() === referralId
    );

    if (!pendingReferral) {
      await session.abortTransaction();
      return { success: false, message: 'Referral not found' };
    }

    // 3. Validate amount
    const amount = pendingReferral.amount || 0;
    if (amount < 0) {
      await session.abortTransaction();
      return { success: false, message: 'Referral amount cannot be negative' };
    }

    // 4. Prepare update operation
    const update = {
      $pull: { 'referralProgram.pendingReferrals': { _id: referralId } },
      $push: {
        'referralProgram.completedReferrals': {
          referee: pendingReferral.referee,
          order: pendingReferral.order,
          amount,
          date: new Date(),
          status: status === 'approve' ? 'completed' : 'failed',
          isPaid: false
        }
      }
    };

    // 5. Only increment for approved referrals
    if (status === 'approve') {
      update.$inc = {
        'referralProgram.referralEarnings': amount // Available balance
        // Note: totalEarned will be updated when payout is actually made
      };
    }

    // 6. Execute the update
    const result = await User.updateOne(
      { _id: userId },
      update,
      { session }
    );

    if (result.modifiedCount === 0) {
      await session.abortTransaction();
      return { success: false, message: 'Referral not updated' };
    }

    // 7. Commit transaction
    await session.commitTransaction();
    revalidatePath('/admin/users');

    return {
      success: true,
      message: `Referral ${status === 'approve' ? 'approved' : 'rejected'} successfully`,
      amount: status === 'approve' ? amount : 0
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Update referral error:', error);
    return { 
      success: false, 
      message: 'Failed to update referral status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  } finally {
    session.endSession();
  }
};

export const processReferralPayout = async (userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();

    // 1. Find user with verified bank details
    const user = await User.findOne({
      _id: userId,
      'referralProgram.bankDetails.verified': true
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return { 
        success: false, 
        message: 'User not found or bank details not verified' 
      };
    }

    // 2. Get all completed but unpaid referrals
    const unpaidReferrals = user.referralProgram.completedReferrals.filter(
      ref => ref.status === 'completed' && !ref.isPaid
    );

    if (unpaidReferrals.length === 0) {
      await session.abortTransaction();
      return { success: false, message: 'No unpaid completed referrals found' };
    }

    // 3. Calculate total amount to payout
    const totalAmount = unpaidReferrals.reduce(
      (sum, ref) => sum + (ref.amount || 0), 0
    );

    // 4. Check against minimum payout amount
    const minPayout = user.referralProgram.minPayoutAmount || 500000; // 5000 NGN in kobo
    if (totalAmount < minPayout) {
      await session.abortTransaction();
      return { 
        success: false, 
        message: `Amount (${totalAmount/100} NGN) is below minimum payout (${minPayout/100} NGN)`,
        currentAmount: totalAmount,
        requiredAmount: minPayout - totalAmount
      };
    }

    // 5. Initiate Paystack transfer
    const transferResult = await initiatePaystackTransfer(
      user.referralProgram.paystackRecipientCode,
      totalAmount,
      `Referral earnings payout for ${user.name}`
    );

    if (!transferResult.success) {
      await session.abortTransaction();
      return { 
        success: false, 
        message: transferResult.message || 'Failed to initiate payout transfer'
      };
    }

    // 6. Prepare database updates
    const referralIds = unpaidReferrals.map(ref => ref._id);
    const updateOperations = {
      $set: {
        'referralProgram.completedReferrals.$[elem].isPaid': true
      },
      $inc: {
        'referralProgram.totalEarned': totalAmount, // Lifetime earnings
        'referralProgram.referralEarnings': -totalAmount // Deduct from available balance
      },
      $push: {
        'referralProgram.payoutHistory': {
          amount: totalAmount,
          date: new Date(),
          status: transferResult.status,
          reference: transferResult.reference,
          processedAt: new Date()
        }
      }
    };

    // 7. Execute the update
    await User.updateOne(
      { _id: userId },
      updateOperations,
      {
        session,
        arrayFilters: [{ 'elem._id': { $in: referralIds } }]
      }
    );

    // 8. Commit transaction
    await session.commitTransaction();
    revalidatePath('/dashboard/payouts');

    return {
      success: true,
      message: 'Payout processed successfully',
      amount: totalAmount,
      reference: transferResult.reference,
      status: transferResult.status
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Payout processing error:', error);
    return { 
      success: false, 
      message: 'Failed to process referral payout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  } finally {
    session.endSession();
  }
};

export const checkPayoutEligibility = async (userId) => {
  try {
    await dbConnect();
    const user = await User.findById(userId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Calculate unpaid amount from completed referrals
    const unpaidAmount = user.referralProgram.completedReferrals
      .filter(ref => ref.status === 'completed' && !ref.isPaid)
      .reduce((sum, ref) => sum + (ref.amount || 0), 0);

    const minPayout = user.referralProgram.minPayoutAmount || 500000;
    const eligible = unpaidAmount >= minPayout;

    return {
      success: true,
      eligible,
      unpaidAmount,
      minPayout,
      availableBalance: user.referralProgram.referralEarnings || 0,
      totalEarned: user.referralProgram.totalEarned || 0,
      bankDetailsVerified: !!user.referralProgram.bankDetails?.verified
    };
  } catch (error) {
    console.error('Eligibility check error:', error);
    return { 
      success: false, 
      message: 'Failed to check payout eligibility' 
    };
  }
};