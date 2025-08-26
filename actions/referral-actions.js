'use server';
import mongoose from 'mongoose';
import User from '../model/User';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import axios from 'axios';

// Paystack API configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Paystack API client
const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

// 1. Approve/Reject Referral Action
export const updateReferralStatus = async (userId, referralId, status) => {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findOne({
      _id: userId,
      'referralProgram.completedReferrals._id': referralId
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return { success: false, message: 'User or referral not found' };
    }

    const completedReferral = user.referralProgram.completedReferrals.find(
      ref => ref._id.toString() === referralId
    );

    if (!completedReferral) {
      await session.abortTransaction();
      return { success: false, message: 'Referral not found' };
    }

    // Update the referral status
    const result = await User.updateOne(
      { 
        _id: userId,
        'referralProgram.completedReferrals._id': referralId
      },
      {
        $set: {
          'referralProgram.completedReferrals.$.status': status === 'approve' ? 'completed' : 'rejected',
          'referralProgram.completedReferrals.$.paymentStatus': status === 'approve' ? 'pending' : 'rejected'
        }
      },
      { session }
    );

    if (result.modifiedCount === 0) {
      await session.abortTransaction();
      return { success: false, message: 'Failed to update referral' };
    }

    await session.commitTransaction();
    revalidatePath('/admin/referrals');
    return {
      success: true,
      message: `Referral ${status === 'approve' ? 'approved' : 'rejected'}`
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Referral update error:', error);
    return { 
      success: false, 
      message: 'Server error during referral update' 
    };
  } finally {
    session.endSession();
  }
};

// 2. Create Paystack Recipient (if not exists)
const createPaystackRecipient = async (bankDetails, userName) => {
  try {
    const response = await paystackClient.post('/transferrecipient', {
      type: 'nuban',
      name: bankDetails.accountName || userName,
      account_number: bankDetails.accountNumber,
      bank_code: bankDetails.bankCode,
      currency: 'NGN'
    });

    return {
      success: true,
      recipientCode: response.data.data.recipient_code
    };
  } catch (error) {
    console.error('Paystack recipient creation error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create recipient'
    };
  }
};

// 3. Initiate Actual Paystack Transfer
const initiatePaystackTransfer = async (recipientCode, amount, reason) => {
  try {
    // Convert amount to kobo (Paystack uses kobo as base unit)
    const amountInKobo = Math.round(amount * 100);

    const response = await paystackClient.post('/transfer', {
      source: 'balance',
      reason: reason,
      amount: amountInKobo,
      recipient: recipientCode,
      reference: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    });

    return {
      success: true,
      status: response.data.data.status,
      reference: response.data.data.reference,
      transferCode: response.data.data.transfer_code,
      amount: amount
    };
  } catch (error) {
    console.error('Paystack transfer error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to initiate transfer'
    };
  }
};

// 4. Request Payout Action
export const requestPayout = async (userId) => {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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

    // Get completed referrals that haven't been paid out
    const unpaidReferrals = user.referralProgram.completedReferrals.filter(
      ref => ref.status === 'completed' && ref.paymentStatus === 'pending'
    );

    if (unpaidReferrals.length === 0) {
      await session.abortTransaction();
      return { success: false, message: 'No unpaid referrals found' };
    }

    // Calculate total amount to payout
    const totalAmount = unpaidReferrals.reduce(
      (sum, ref) => sum + (ref.amount || 0), 0
    );

    // Check if user has a minimum payout amount setting
    let minPayout = 500000; // Default 5000 Naira in kobo
    if (user.referralProgram.minPayoutAmount) {
      // You would need to fetch the actual minPayoutAmount from ReferralPayoutSettings
      // For now, using a default
      minPayout = 500000;
    }

    if (totalAmount < minPayout) {
      await session.abortTransaction();
      return { 
        success: false, 
        message: `Minimum payout is ₦${minPayout/100}`,
        required: minPayout - totalAmount
      };
    }

    // Check if recipient code exists, create if not
    let recipientCode = user.referralProgram.paystackRecipientCode;
    if (!recipientCode) {
      const recipientResult = await createPaystackRecipient(
        user.referralProgram.bankDetails,
        user.name
      );

      if (!recipientResult.success) {
        await session.abortTransaction();
        return { 
          success: false, 
          message: recipientResult.message 
        };
      }

      recipientCode = recipientResult.recipientCode;
      
      // Save recipient code to user
      await User.updateOne(
        { _id: userId },
        { 'referralProgram.paystackRecipientCode': recipientCode },
        { session }
      );
    }

    // Create a payout request entry
    const payoutRequest = {
      amount: totalAmount,
      requestedAt: new Date(),
      status: 'pending',
      paymentStatus: 'pending',
      bankDetails: user.referralProgram.bankDetails,
      paystackReference: null
    };

    // Update user with payout request and mark referrals as processing
    const referralIds = unpaidReferrals.map(ref => ref._id);
    
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          'referralProgram.payoutHistory': payoutRequest
        },
        $set: {
          'referralProgram.completedReferrals.$[elem].paymentStatus': 'processing'
        }
      },
      {
        session,
        arrayFilters: [{ 'elem._id': { $in: referralIds } }]
      }
    );

    await session.commitTransaction();
    revalidatePath('/dashboard/payouts');
    return {
      success: true,
      message: 'Payout requested successfully',
      amount: totalAmount
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Payout request error:', error);
    return { 
      success: false, 
      message: 'Failed to request payout' 
    };
  } finally {
    session.endSession();
  }
};

// 5. Process Approved Payouts (Admin function)
export const processPayouts = async (payoutRequestId, userId) => {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findOne({
      _id: userId,
      'referralProgram.payoutHistory._id': payoutRequestId
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return { 
        success: false, 
        message: 'User or payout request not found' 
      };
    }

    const payoutRequest = user.referralProgram.payoutHistory.find(
      payout => payout._id.toString() === payoutRequestId
    );

    if (!payoutRequest || payoutRequest.status !== 'pending') {
      await session.abortTransaction();
      return { 
        success: false, 
        message: 'Payout request not found or already processed' 
      };
    }

    // Initiate actual Paystack transfer
    const payoutResponse = await initiatePaystackTransfer(
      user.referralProgram.paystackRecipientCode,
      payoutRequest.amount,
      `${user.name}'s referral payout`
    );

    if (!payoutResponse.success) {
      await session.abortTransaction();
      return { 
        success: false, 
        message: payoutResponse.message 
      };
    }

    // Update payout request status
    await User.updateOne(
      { 
        _id: userId,
        'referralProgram.payoutHistory._id': payoutRequestId
      },
      {
        $set: {
          'referralProgram.payoutHistory.$.status': 'processing',
          'referralProgram.payoutHistory.$.paymentStatus': 'processing',
          'referralProgram.payoutHistory.$.paystackReference': payoutResponse.reference,
          'referralProgram.payoutHistory.$.processedAt': new Date()
        }
      },
      { session }
    );

    await session.commitTransaction();
    revalidatePath('/admin/payouts');
    return {
      success: true,
      message: 'Payout processing initiated',
      amount: payoutRequest.amount,
      reference: payoutResponse.reference
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Payout processing error:', error);
    return { 
      success: false, 
      message: 'Failed to process payout' 
    };
  } finally {
    session.endSession();
  }
};

// 6. Check Transfer Status
export const checkTransferStatus = async (userId, reference) => {
  try {
    const response = await paystackClient.get(`/transfer/${reference}`);
    
    // Update the payout status based on Paystack response
    if (response.data.data.status === 'success') {
      await User.updateOne(
        { 
          _id: userId,
          'referralProgram.payoutHistory.paystackReference': reference
        },
        {
          $set: {
            'referralProgram.payoutHistory.$.status': 'completed',
            'referralProgram.payoutHistory.$.paymentStatus': 'success',
            'completedReferrals.$[elem].paymentStatus': 'success'
          }
        },
        {
          arrayFilters: [{ 'elem.paymentStatus': 'processing' }]
        }
      );
    } else if (response.data.data.status === 'failed') {
      await User.updateOne(
        { 
          _id: userId,
          'referralProgram.payoutHistory.paystackReference': reference
        },
        {
          $set: {
            'referralProgram.payoutHistory.$.status': 'failed',
            'referralProgram.payoutHistory.$.paymentStatus': 'failed',
            'completedReferrals.$[elem].paymentStatus': 'pending'
          }
        },
        {
          arrayFilters: [{ 'elem.paymentStatus': 'processing' }]
        }
      );
    }
    
    return {
      success: true,
      status: response.data.data.status,
      data: response.data.data
    };
  } catch (error) {
    console.error('Transfer status check error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to check transfer status'
    };
  }
};

// 7. Check Payout Eligibility
export const checkEligibility = async (userId) => {
  await dbConnect();
  try {
    const user = await User.findById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const unpaidAmount = user.referralProgram.completedReferrals
      .filter(ref => ref.status === 'completed' && ref.paymentStatus === 'pending')
      .reduce((sum, ref) => sum + (ref.amount || 0), 0);

    let minPayout = 500000; // Default 5000 Naira in kobo
    if (user.referralProgram.minPayoutAmount) {
      // You would need to fetch the actual minPayoutAmount from ReferralPayoutSettings
      minPayout = 500000;
    }

    return {
      success: true,
      eligible: unpaidAmount >= minPayout,
      unpaidAmount,
      minPayout,
      accountVerified: !!user.referralProgram.bankDetails?.verified
    };
  } catch (error) {
    console.error('Eligibility check error:', error);
    return { success: false, message: 'Failed to check eligibility' };
  }
};

// 8. Update Bank Details
export const updateBankDetails = async (userId, bankDetails) => {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Reset recipient code when bank details change
    const updated = await User.findByIdAndUpdate(
      userId,
      {
        'referralProgram.bankDetails': {
          accountName: bankDetails.accountName,
          accountNumber: bankDetails.accountNumber,
          bankCode: bankDetails.bankCode,
          verified: false
        },
        'referralProgram.paystackRecipientCode': null
      },
      { new: true, session }
    );

    if (!updated) {
      await session.abortTransaction();
      return { success: false, message: 'User not found' };
    }

    await session.commitTransaction();
    revalidatePath('/dashboard/bank-details');
    return { 
      success: true, 
      message: 'Bank details updated successfully' 
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Bank details update error:', error);
    return { 
      success: false, 
      message: 'Failed to update bank details' 
    };
  } finally {
    session.endSession();
  }
};