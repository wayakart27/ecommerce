import dbConnect from "@/lib/mongodb";
import VerificationToken from "@/model/verification";


export const getVerificationTokenByToken = async (token) => {
  try {
    await dbConnect();
    const verificationToken = await VerificationToken.findOne({ token });
    return verificationToken;
  } catch (error) {
    return null;
  }
};

export const getVerificationTokenByEmail = async (email) => {
  try {
    await dbConnect();
    const verificationToken = await VerificationToken.findOne({ email });
    return verificationToken;
  } catch (error) {
    return null;
  }
};
