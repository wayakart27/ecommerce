// actions/account.ts
"use server";

import { revalidatePath } from "next/cache";
import { updateBankDetails } from "./referral";

export const verifyAccountNumber = async (accountNumber, bankCode) => {
  try {
    if (!accountNumber || !bankCode) {
      return { success: false, message: 'Account number and bank code are required' };
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await paystackResponse.json();

    if (!data.status) {
      return { success: false, message: data.message || 'Failed to verify account' };
    }

    return {
      success: true,
      data: {
        accountName: data.data.account_name,
        accountNumber: data.data.account_number,
        bankCode: bankCode
      }
    };

  } catch (error) {
    console.error('Account verification error:', error);
    return { success: false, message: 'Internal server error' };
  }
};

export const updateBankDetailsWithVerification = async (userId, formData) => {
  try {
    // First verify the account
    const verification = await verifyAccountNumber(formData.accountNumber, formData.bankCode);
    
    if (!verification.success) {
      return verification;
    }

    // If verification succeeds, update the bank details
    const updateResponse = await updateBankDetails(userId, {
      accountName: verification.data.accountName,
      accountNumber: verification.data.accountNumber,
      bankCode: verification.data.bankCode
    });

    if (!updateResponse.success) {
      return updateResponse;
    }

    revalidatePath('/referrals');
    return { success: true, message: "Bank details updated successfully" };

  } catch (error) {
    console.error('Update bank details error:', error);
    return { success: false, message: 'Failed to update bank details' };
  }
};