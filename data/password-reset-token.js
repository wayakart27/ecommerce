import dbConnect from "@/lib/mongodb";
import ResetToken from "@/model/reset-password";
import TwoFactorToken from "@/model/two-factor";
import TwoFactorConfirmation from "@/model/two-factor-confirmation";


export const getPasswordResetTokenByToken = async (token) => {
  try {
    await dbConnect();
    const passwordResetToken = await ResetToken.findOne({ token });
    return passwordResetToken;
  } catch (error) {
    return null;
  }
};



export const getPasswordResetTokenByEmail = async (email) => {
    try {
      await dbConnect();
      const passwordResetToken = await ResetToken.findOne({ email });
      return passwordResetToken;
    } catch (error) {
      return null;
    }
  };


export const getTwoFactorTokenByToken = async (token) => {
  if (!token) {
    console.warn("No token provided to getTwoFactorTokenByToken");
    return null;
  }

  try {
    await dbConnect();
    return await TwoFactorToken.findOne({ token })
      .select('-__v') // Exclude version key
      .lean(); // Convert to plain JS object
  } catch (error) {
    console.error("Error fetching two-factor token:", error.message);
    return null;
  }
};

export const getTwoFactorTokenByEmail = async (email) => {
  if (!email) {
    console.warn("No email provided to getTwoFactorTokenByEmail");
    return null;
  }

  try {
    await dbConnect();
    return await TwoFactorToken.findOne({ email })
      .lean();
  } catch (error) {
    console.error("Error fetching two-factor token by email:", error.message);
    return null;
  }
};

export const getTwoFactorConfirmationByUserId = async (userId) => {
  if (!userId) {
    console.warn('Invalid userId provided to getTwoFactorConfirmationByUserId');
    return null;
  }

  try {
    await dbConnect();
    const twoFactorConfirmation = await TwoFactorConfirmation.findOne({ userId })
      .select('-__v') // Exclude version key
      .lean(); // Convert to plain JS object
    
    return twoFactorConfirmation;
  } catch (error) {
    console.error("Error fetching two-factor confirmation:", error.message);
    return null;
  }
};
  
