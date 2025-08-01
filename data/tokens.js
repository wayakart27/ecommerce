
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getVerificationTokenByEmail } from './verification-token';
import VerificationToken from '@/model/verification';
import { getPasswordResetTokenByEmail, getTwoFactorTokenByEmail } from './password-reset-token';
import ResetToken from '@/model/reset-password';
import TwoFactorToken from '@/model/two-factor';

export const generateTwoFactorToken = async (email) => {
  try {
    const token = crypto.randomInt(100_000, 1_000_000).toString();
    
    // Correct 5 minutes expiration calculation
    const expires = new Date(new Date().getTime() + 5 * 60 * 1000); // 5 minutes from now

    // Check for existing token
    const existingToken = await getTwoFactorTokenByEmail(email);
    if (existingToken) {
      await TwoFactorToken.findByIdAndDelete(existingToken._id);
    }

    // Create new token
    const twoFactorToken = await TwoFactorToken.create({
      email,
      token,
      expires
    });

    return twoFactorToken;
  } catch (error) {
    console.error('Error generating two-factor token:', error);
    throw new Error('Failed to generate two-factor token');
  }
};


export const generatePasswordResetToken = async (email) => {
    const token = uuidv4();
    // Token expires in 1 hour
    const expires = new Date(Date.now() + 3600 * 1000);
  
    const existingToken = await getPasswordResetTokenByEmail(email);
  
    if (existingToken) {
      await ResetToken.findOneAndDelete({ _id: existingToken._id });
    }
  
    const resetToken = await ResetToken.create({
      email,
      token,
      expires,
    });
  
    return resetToken;
  };


export const generateVerificationToken = async (email) => {
  const token = uuidv4();
  // Token expires in 1 hour
  const expires = new Date(Date.now() + 3600 * 1000);

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await VerificationToken.findOneAndDelete({ _id: existingToken._id });
  }

  const verificationToken = await VerificationToken.create({
    email,
    token,
    expires,
  });

  return verificationToken;
};
