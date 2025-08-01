'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import { Address } from '@/model/Address';
import { addressSchema, updateAddressSchema } from '@/schemas/address';
import User from '@/model/User';
import mongoose from 'mongoose';

// Helper: Convert Mongoose doc to plain object with serializable fields
const serializeAddress = (address) => ({
  ...address,
  _id: address._id.toString(),
  user: address.user.toString(),
  createdAt: address.createdAt?.toISOString(),
  updatedAt: address.updatedAt?.toISOString()
});

export const createAddress = async (userId, formData) => {
  try {
    await dbConnect();

    if (!userId) throw new Error("User ID is required");

    let userIdObj;
    try {
      userIdObj = new mongoose.Types.ObjectId(userId);
    } catch {
      throw new Error(`Invalid user ID format: ${userId}`);
    }

    const userExists = await User.exists({ _id: userIdObj });
    if (!userExists) throw new Error(`User with ID ${userId} not found`);

    const addressData = {
      user: userIdObj,
      firstName: String(formData.firstName),
      lastName: String(formData.lastName),
      address: String(formData.address),
      city: String(formData.city),
      state: String(formData.state),
      email: String(formData.email),
      country: String(formData.country || "Nigeria"),
      phone: String(formData.phone),
      isDefault: Boolean(formData.isDefault),
      type: String(formData.type || "home")
    };

    const validation = addressSchema.safeParse(addressData);
    if (!validation.success) {
      const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }

    const newAddress = await Address.create(validation.data);

    revalidatePath("/account/addresses");

    return {
      success: true,
      message: "Address created successfully",
      data: serializeAddress(newAddress.toObject())
    };

  } catch (error) {
    console.error("Address creation failed:", error.message);
    return {
      success: false,
      message: error.message,
      error: error.message
    };
  }
};

export const getUserAddresses = async (userId) => {
  await dbConnect();

  try {
    const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
    const plainAddresses = addresses.map(serializeAddress);

    return {
      success: true,
      data: plainAddresses
    };
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return {
      success: false,
      message: 'Failed to fetch addresses',
      error: error.message
    };
  }
};

export const getAddressById = async (addressId) => {
  await dbConnect();

  try {
    const address = await Address.findById(addressId).lean();
    if (!address) {
      return {
        success: false,
        message: 'Address not found'
      };
    }

    return {
      success: true,
      data: serializeAddress(address)
    };
  } catch (error) {
    console.error('Error fetching address:', error);
    return {
      success: false,
      message: 'Failed to fetch address',
      error: error.message
    };
  }
};

export const updateAddress = async (addressId, formData) => {
  await dbConnect();

  const rawFormData = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    email: formData.email,
    country: formData.country,
    phone: formData.phone,
    isDefault: formData.isDefault,
    type: formData.type
  };

  const validatedData = updateAddressSchema.safeParse(rawFormData);
  if (!validatedData.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validatedData.error.flatten().fieldErrors
    };
  }

  try {
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      validatedData.data,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedAddress) {
      return {
        success: false,
        message: 'Address not found'
      };
    }

    revalidatePath('/account/addresses');

    return {
      success: true,
      message: 'Address updated successfully',
      data: serializeAddress(updatedAddress)
    };
  } catch (error) {
    console.error('Error updating address:', error);
    return {
      success: false,
      message: 'Failed to update address',
      error: error.message
    };
  }
};

export const setDefaultAddress = async (userId, addressId) => {
  await dbConnect();

  try {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });

    const defaultAddress = await Address.findByIdAndUpdate(
      addressId,
      { $set: { isDefault: true } },
      { new: true }
    ).lean();

    revalidatePath('/account/addresses');

    return {
      success: true,
      message: 'Default address updated',
      data: serializeAddress(defaultAddress)
    };
  } catch (error) {
    console.error('Error setting default address:', error);
    return {
      success: false,
      message: 'Failed to set default address',
      error: error.message
    };
  }
};

export const deleteAddress = async (addressId) => {
  await dbConnect();

  try {
    const deletedAddress = await Address.findByIdAndDelete(addressId);

    if (!deletedAddress) {
      return {
        success: false,
        message: 'Address not found'
      };
    }

    revalidatePath('/account/addresses');

    return {
      success: true,
      message: 'Address deleted successfully',
      data: serializeAddress(deletedAddress.toObject())
    };
  } catch (error) {
    console.error('Error deleting address:', error);
    return {
      success: false,
      message: 'Failed to delete address',
      error: error.message
    };
  }
};
