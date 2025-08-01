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


// Register Function
export const register = async (values) => {
  const validatedFields = signUpSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: 'Invalid input data.',
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    await dbConnect();

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return {
        error: 'Email already in use.',
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const verificationToken = await generateVerificationToken(email);

    
    await sendVerificationEmail(verificationToken.email, verificationToken.token)

    return {
      success: 'Confirmation code sent to your email!.',
    };
  } catch (error) {
    console.error('[REGISTER_ERROR]', error);
    return {
      error: 'Something went wrong. Please try again.',
    };
  }
};

export const login = async (values, callbackUrl) => {
  // Validate input fields
  const validatedFields = loginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid input data." };
  }

  const { email, password, code } = validatedFields.data;

  try {
    await dbConnect();
    const existingUser = await getUserByEmail(email);

    // Validate user exists
    if (!existingUser?.email || !existingUser?.password) {
      return { error: "Invalid credentials!" };
    }

    // Verify password
    const passwordsMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordsMatch) {
      return { error: "Invalid credentials!" };
    }

    // Check email verification
    if (!existingUser.isVerified) {
      const verificationToken = await generateVerificationToken(existingUser.email);
      await sendVerificationEmail(verificationToken.email, verificationToken.token);
      return { error: "Please verify your email first. A new verification link has been sent." };
    }

    // Handle 2FA if enabled
    if (existingUser.isTwoFactorEnabled) {
      if (code) {
        // Verify 2FA code
        const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);

        if (!twoFactorToken) {
          return { error: "Invalid code!" };
        }

        if (twoFactorToken.token !== code) {
          return { error: "Invalid code!" };
        }

        const hasExpired = new Date(twoFactorToken.expires) < new Date();
        if (hasExpired) {
          return { error: "Code expired!" };
        }

        // Clean up used token
        await TwoFactorToken.deleteOne({ _id: twoFactorToken._id });

        // Update confirmation
        const existingConfirmation = await getTwoFactorConfirmationByUserId(existingUser._id);
        if (existingConfirmation) {
          await TwoFactorConfirmation.deleteOne({ _id: existingConfirmation._id });
        }

        await TwoFactorConfirmation.create({
          userId: existingUser._id
        });
      } else {
        // Generate and send new 2FA token if no code provided
        const twoFactorToken = await generateTwoFactorToken(existingUser.email);
        await sendTwoFactorEmail(twoFactorToken.email, twoFactorToken.token);

        return { 
          twoFactor: true,
          email: existingUser.email
        };
      }
    }

    // IMPORTANT FIX: Return the user object that matches what your Credentials provider expects
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
      redirect: callbackUrl || DEFAULT_LOGIN_REDIRECT
    };

  } catch (error) {
    console.error("Login error:", error);
    return { error: "An error occurred during login. Please try again." };
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

