'use server';
import User from '../model/User';
import dbConnect from '@/lib/mongodb';

// 1. Get User Referral Stats
export const getReferralStats = async (userId) => {
  await dbConnect();
  try {
    const user = await User.findById(userId)
      .select('referralProgram')
      .populate('referralProgram.pendingReferrals.referee', 'name email')
      .populate('referralProgram.completedReferrals.referee', 'name email');

    if (!user) return { success: false, message: 'User not found' };

    const stats = {
      referralCode: user.referralProgram.referralCode,
      totalEarned: user.referralProgram.totalEarned || 0,
      availableBalance: user.referralProgram.referralEarnings || 0,
      pendingCount: user.referralProgram.pendingReferrals.length,
      completedCount: user.referralProgram.completedReferrals.filter(
        ref => ref.status === 'completed'
      ).length,
      bankDetails: user.referralProgram.bankDetails
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Referral stats error:', error);
    return { success: false, message: 'Failed to get referral stats' };
  }
};

// 2. Get Payout History
export const getPayoutHistory = async (userId) => {
  await dbConnect();
  try {
    const user = await User.findById(userId)
      .select('referralProgram.payoutHistory');

    if (!user) return { success: false, message: 'User not found' };

    return { 
      success: true, 
      data: user.referralProgram.payoutHistory || [] 
    };
  } catch (error) {
    console.error('Payout history error:', error);
    return { success: false, message: 'Failed to get payout history' };
  }
};