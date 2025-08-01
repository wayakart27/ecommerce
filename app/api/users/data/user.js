import dbConnect from '@/lib/mongodb';
import User from '@/model/User';

export const getUserById = async (id) => {
  try {
    await dbConnect();
    const user = await User.findById(id).lean();
    return user;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
};

export const getUserByEmail = async (email) => {
  try {
    await dbConnect();
    const user = await User.findOne({ email }).lean();
    return user;
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    return null;
  }
};