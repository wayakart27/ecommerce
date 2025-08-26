
import User from "@/model/User";
import dbConnect from "./mongodb";

export const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const validateReferralCode = async (code) => {
  if (!code) return { valid: true };
  
  await dbConnect();
  const referringUser = await User.findOne({ 
    'referralProgram.referralCode': code 
  });
  
  return {
    valid: !!referringUser,
    referringUser: referringUser ? referringUser._id : null
  };
};