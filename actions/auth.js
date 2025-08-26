'use server';

import bcrypt from 'bcryptjs';
import { loginSchema, passwordResetSchema, resetPasswordSchema, signUpSchema } from '@/schemas/authSchema';
import dbConnect from '@/lib/mongodb';
import User from '@/model/User';
import { getUserByEmail } from '@/data/user';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { AuthError } from 'next-auth';
import { generatePasswordResetToken, generateTwoFactorToken, generateVerificationToken } from '@/data/tokens';
import { sendPasswordResetEmail, sendTwoFactorEmail, sendVerificationEmail } from '@/lib/mail';
import { getVerificationTokenByToken } from '@/data/verification-token';
import VerificationToken from '@/model/verification';
import { getPasswordResetTokenByToken, getTwoFactorConfirmationByUserId, getTwoFactorTokenByEmail } from '@/data/password-reset-token';
import ResetToken from '@/model/reset-password';
import TwoFactorToken from '@/model/two-factor';
import TwoFactorConfirmation from '@/model/two-factor-confirmation';
import { validateReferralCode } from '@/lib/referralUtils';
import mongoose from 'mongoose';
import { headers } from 'next/headers';


export const resendTwoFactorCode = async (email) => {
  try {
    const twoFactorToken = await generateTwoFactorToken(email);
    await sendTwoFactorEmail(email, twoFactorToken.token);
    return { success: true };
  } catch (error) {
    console.error('Failed to resend 2FA code:', error);
    return { success: false, error: 'Failed to resend verification code' };
  }
};


const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Main registration function
export const register = async (formData) => {

  // Get client IP and user agent from headers
  const headerList = await headers();
  const ipAddress = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = headerList.get('user-agent') || 'unknown';

  // Validate input data
  const validatedFields = signUpSchema.safeParse(formData);
  
  if (!validatedFields.success) {
    return { 
      error: "Invalid input data",
      details: validatedFields.error.flatten().fieldErrors 
    };
  }

  const { name, email, password, referralCode } = validatedFields.data;

  try {
    await dbConnect();

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "Email already in use." };
    }

    // Validate referral code if provided
    let referringUser = null;
    if (referralCode) {
      referringUser = await User.findOne({ 
        'referralProgram.referralCode': referralCode 
      });
      
      if (!referringUser) {
        return { error: "Invalid referral code." };
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await User.create({
      name: name.toUpperCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'Customer',
      referralProgram: {
        referralCode: generateReferralCode(),
        ...(referringUser && { referredBy: referringUser._id }),
      },
      compliance: {
        signupIp: ipAddress,
        signupUserAgent: userAgent,
        devices: [{
          userAgent: userAgent,
          ipAddress: ipAddress,
          firstSeen: new Date(),
          lastSeen: new Date()
        }],
        kycVerified: false
      },
      status: 'Active',
      isVerified: false,
      isTwoFactorEnabled: false,
      hasMadePurchase: false
    });

    // Update referrer's pending referrals if applicable
    if (referringUser) {
      await User.findByIdAndUpdate(
        referringUser._id,
        {
          $push: {
            'referralProgram.pendingReferrals': {
              referee: newUser._id,
              date: new Date(),
              hasPurchased: false,
              signupIp: ipAddress,
              deviceInfo: userAgent
            }
          }
        }
      );
    }

    // Generate verification token
    const verificationToken = await generateVerificationToken(email);
    
    // Send verification email
    await sendVerificationEmail(verificationToken.email, verificationToken.token);

    return { 
      success: "Account created successfully! A confirmation email has been sent to your email.",
      userId: newUser._id.toString(),
      emailVerified: false
    };

  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    
    if (error.code === 11000) {
      return { error: "This email is already registered." };
    }
    
    return { 
      error: "Account creation failed",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};


export const login = async (values, callbackUrl) => {
  // Get client information from headers
  const headerList = await headers();
  const ipAddress = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = headerList.get('user-agent') || 'unknown';

  // Validate input fields
  const validatedFields = loginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { 
      error: "Invalid input data",
      details: validatedFields.error.flatten().fieldErrors 
    };
  }

  const { email, password, code } = validatedFields.data;
  let existingUser; // Declare outside try block for catch access

  try {
    await dbConnect();
    existingUser = await getUserByEmail(email.toLowerCase());

    // Validate user exists
    if (!existingUser || !existingUser.password) {
      // For non-existent users, use email as identifier
      await User.updateOne(
        { email: email.toLowerCase() },
        {
          $push: {
            loginAttempts: {
              email,
              ipAddress,
              userAgent,
              status: 'invalid_credentials',
              timestamp: new Date()
            }
          }
        },
        { upsert: true } // Create record if doesn't exist
      );
      return { 
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS" 
      };
    }

    // Verify password
    const passwordsMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordsMatch) {
      await User.updateOne(
        { _id: existingUser._id },
        {
          $push: {
            loginAttempts: {
              email,
              ipAddress,
              userAgent,
              status: 'invalid_password',
              timestamp: new Date()
            }
          }
        }
      );
      return { 
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS" 
      };
    }

    // Check email verification
    if (!existingUser.isVerified) {
      await User.updateOne(
        { _id: existingUser._id },
        {
          $push: {
            loginAttempts: {
              email,
              ipAddress,
              userAgent,
              status: 'unverified_email',
              timestamp: new Date()
            }
          }
        }
      );
      const verificationToken = await generateVerificationToken(existingUser.email);
      await sendVerificationEmail(verificationToken.email, verificationToken.token);
      return { 
        error: "Please verify your email first",
        code: "EMAIL_NOT_VERIFIED"
      };
    }

    // Handle 2FA if enabled
    if (existingUser.isTwoFactorEnabled) {
      if (code) {
        const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);
        
        if (!twoFactorToken || twoFactorToken.token !== code) {
          await User.updateOne(
            { _id: existingUser._id },
            {
              $push: {
                loginAttempts: {
                  email,
                  ipAddress,
                  userAgent,
                  status: 'invalid_2fa',
                  timestamp: new Date()
                }
              }
            }
          );
          return { error: "Invalid verification code" };
        }

        if (new Date(twoFactorToken.expires) < new Date()) {
          await User.updateOne(
            { _id: existingUser._id },
            {
              $push: {
                loginAttempts: {
                  email,
                  ipAddress,
                  userAgent,
                  status: 'expired_2fa',
                  timestamp: new Date()
                }
              }
            }
          );
          return { error: "Verification code expired" };
        }

        await TwoFactorToken.deleteOne({ _id: twoFactorToken._id });
        await TwoFactorConfirmation.findOneAndUpdate(
          { userId: existingUser._id },
          { userId: existingUser._id },
          { upsert: true }
        );
      } else {
        const twoFactorToken = await generateTwoFactorToken(existingUser.email);
        await sendTwoFactorEmail(twoFactorToken.email, twoFactorToken.token);
        await User.updateOne(
          { _id: existingUser._id },
          {
            $push: {
              loginAttempts: {
                email,
                ipAddress,
                userAgent,
                status: '2fa_required',
                timestamp: new Date()
              }
            }
          }
        );
        return { 
          twoFactor: true,
          email: existingUser.email
        };
      }
    }

    // Update device tracking and record successful login
    await User.updateOne(
      { _id: existingUser._id },
      {
        $push: {
          'compliance.devices': {
            userAgent,
            ipAddress,
            firstSeen: new Date(),
            lastSeen: new Date()
          },
          loginAttempts: {
            email,
            ipAddress,
            userAgent,
            status: 'success',
            timestamp: new Date()
          }
        },
        $set: {
          'compliance.lastLogin': new Date(),
          'compliance.lastIp': ipAddress
        }
      }
    );

    return {
      success: true,
      user: {
        id: existingUser._id.toString(),
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        isVerified: existingUser.isVerified,
        isTwoFactorEnabled: existingUser.isTwoFactorEnabled
      },
      session: {
        ipAddress,
        userAgent,
        loginTime: new Date().toISOString()
      },
      redirect: callbackUrl || DEFAULT_LOGIN_REDIRECT
    };

  } catch (error) {
    console.error("Login error:", error);
    
    // Log error attempt if we have user context
    if (existingUser) {
      await User.updateOne(
        { _id: existingUser._id },
        {
          $push: {
            loginAttempts: {
              email,
              ipAddress,
              userAgent,
              status: 'error',
              error: error.message,
              timestamp: new Date()
            }
          }
        }
      );
    } else {
      // Log failed attempt for unknown users
      await User.updateOne(
        { email: email.toLowerCase() },
        {
          $push: {
            loginAttempts: {
              email,
              ipAddress,
              userAgent,
              status: 'error',
              error: error.message,
              timestamp: new Date()
            }
          }
        },
        { upsert: true }
      );
    }
    
    return { 
      error: "Login failed",
      code: "LOGIN_ERROR",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

export const newVerification = async (token) => {
  try {
    await dbConnect();
    const existingToken = await getVerificationTokenByToken(token);

    if (!existingToken) {
      return {
        success: false,
        error: 'Token does not exist!',
      };
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      return {
        success: false,
        error: 'Token has expired!',
      };
    }

    const existingUser = await getUserByEmail(existingToken.email);

    if (!existingUser) {
      return {
        success: false,
        error: 'Invalid Credentials!',
      };
    }

    // Update the user's verification status
    await User.findByIdAndUpdate(existingUser._id, {
      $set: { isVerified: true }
    }, { new: true });

    // Delete the used verification token
    await VerificationToken.findByIdAndDelete(existingToken._id);

    return {
      success: true,
      message: 'Email verified successfully!'
    };

  } catch (error) {
    console.error('Verification error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during verification.',
    };
  }
};

export const forgotPassword = async (data) => {
  const validatedField = resetPasswordSchema.safeParse(data);

  if (!validatedField.success) {
    return {
      success: false,
      error: 'Invalid email!',
      message: 'Please provide a valid email address'
    };
  }

  const { email } = validatedField.data;

  try {
    await dbConnect();
    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
      return {
        success: false,
        error: 'Email not found!',
        message: 'No account found with this email address'
      };
    }

    // Here you would typically:
    // 1. Generate a password reset token
    // 2. Send the email with reset link
    // 3. Return success response
    
    const passwordResetToken = await generatePasswordResetToken(email);

    await sendPasswordResetEmail(
      passwordResetToken.email,
      passwordResetToken.token
    )
    return {
      success: true,
      message: 'Password reset email sent successfully!'
    };
    
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return {
      success: false,
      error: 'Server error',
      message: 'Failed to process your request. Please try again later.'
    };
  }
};


export const newPassword = async (token, newPasswordData) => {
  // 1. Validate the input data using Zod
  const validatedField = passwordResetSchema.safeParse(newPasswordData);
  
  if (!validatedField.success) {
    return {
      success: false,
      error: 'Validation error',
      message: validatedField.error.errors[0]?.message || 'Invalid password format'
    };
  }

  try {
     await dbConnect();
    // 2. Verify the token exists
    const existingToken = await getPasswordResetTokenByToken(token);
    
    if (!existingToken) {
      return {
        success: false,
        error: 'Invalid reset token',
        message: 'The password reset link is invalid or has already been used.'
      };
    }

    // 3. Check if token has expired
    const hasExpired = new Date(existingToken.expires) < new Date();
    
    if (hasExpired) {
      return {
        success: false,
        error: 'Expired token',
        message: 'The password reset link has expired. Please request a new one.'
      };
    }

    // 4. Verify the user exists
    const existingUser = await User.findOne({ email: existingToken.email });
    
    if (!existingUser) {
      return {
        success: false,
        error: 'User not found',
        message: 'No account found with this email address.'
      };
    }

    // 5. Hash the new password
    const hashedPassword = await bcrypt.hash(validatedField.data.password, 10);

    // 6. Update user's password and clear reset token
    await User.updateOne(
      { _id: existingUser._id },
      { $set: { password: hashedPassword } }
    );
    
    await ResetToken.deleteOne({ _id: existingToken._id });

    return {
      success: true,
      message: 'Password updated successfully!'
    };

  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred. Please try again later.'
    };
  }
};

