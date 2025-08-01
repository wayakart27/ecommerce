'use server';

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongodb";
import { CreateUserSchema, UpdatePasswordSchema, UpdateUserSchema } from "@/schemas/user";
import User from "@/model/User";
import { UpdateProfileSchema } from "@/schemas/updateProfile";

// Helper function to convert MongoDB documents to plain objects
function toPlainObject(doc) {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(toPlainObject);
  return JSON.parse(JSON.stringify(doc));
}

export async function createUser(formData) {
  await dbConnect();

  try {
    const validationResult = CreateUserSchema.safeParse(formData);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.format(),
      };
    }

    const validatedData = validationResult.data;
    const existingUser = await User.findOne({
      $or: [{ email: validatedData.email }],
    });

    if (existingUser) {
      return {
        success: false,
        error: "User with this email or username already exists",
      };
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const userData = {
      name: validatedData.name?.toUpperCase(),
      email: validatedData.email?.toLowerCase(),
      password: hashedPassword,
      role: validatedData.role || "Customer",
      image: validatedData.image || "",
      phone: validatedData.phone || "",
      whatsAppPhone: validatedData.whatsAppPhone || "",
      isVerified: validatedData.isVerified || false,
      isTwoFactorEnabled: validatedData.isTwoFactorEnabled || false,
      twoFactorConfirmation: validatedData.twoFactorConfirmation || undefined,
      status: validatedData.status || 'Active',
    };

    const newUser = await User.create(userData);
    const plainUser = toPlainObject(newUser);

    revalidatePath("/dashboard/users");
    return {
      success: true,
      data: plainUser,
    };
  } catch (error) {
    console.error("Create user error:", error);
    return {
      success: false,
      error: "Failed to create user",
    };
  }
}

export async function getUsers(page = 1, limit = 10, search = "") {
  await dbConnect();

  const skip = (page - 1) * limit;
  let query = {};

  if (search) {
    query = {
      $and: [
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ]
        }
      ]
    };
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    users: toPlainObject(users),
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    },
  };
}

export async function getUserById(id) {
  await dbConnect();

  if (!id) {
    throw new Error("User ID is required");
  }

  const user = await User.findById(id).lean();
  if (!user) {
    throw new Error("User not found");
  }

  return toPlainObject(user);
}

export async function updateUser(id, formData) {
  await dbConnect();

  try {
    const validationResult = UpdateUserSchema.safeParse(formData);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.format(),
      };
    }

    const user = await User.findById(id);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const validatedData = validationResult.data;
    const updateData = { ...validatedData };

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true }
    );

    const plainUser = toPlainObject(updatedUser);

    revalidatePath(`/dashboard/users/edit/${id}`);
    revalidatePath("/dashboard/users");

    return { success: true, data: plainUser };
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUser(id) {
  await dbConnect();

  try {
    const user = await User.findById(id);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    await User.findByIdAndDelete(id);
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete user" };
  }
}


export async function updateProfile(formData) {
  await dbConnect();

  try {
    const id = formData.get('id');
    const name = formData.get('name');
    const image = formData.get('image');

    const validationResult = UpdateProfileSchema.safeParse({ name, image, id });

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.format(),
      };
    }

    const user = await User.findById(id);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { name, image } },
      { new: true }
    );

    const plainUser = toPlainObject(updatedUser);

    revalidatePath(`/dashboard/settings`);
    return { success: true, data: plainUser };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
export async function getProfile(id) {
  await dbConnect();

  try {
    const user = await User.findById(id).select("name email image");

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const plainUser = toPlainObject ? toPlainObject(user) : user;

    return { success: true, data: plainUser };
  } catch (error) {
    console.error("Get profile error:", error);
    return { success: false, error: "Failed to fetch profile" };
  }
}

export async function getTwoFactor(id) {
  await dbConnect();

  try {
    const user = await User.findById(id).select("isTwoFactorEnabled");

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: user.isTwoFactorEnabled };
  } catch (error) {
    console.error("Get two-factor error:", error);
    return { success: false, error: "Failed to fetch two-factor setting" };
  }
}

export async function updatePassword(formData) {
  await dbConnect();

  try {
    const id = formData.get('id');
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    // Validate all fields including confirmPassword
    const validationResult = UpdatePasswordSchema.safeParse({
      id,
      currentPassword,
      newPassword,
      confirmPassword
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.format(),
      };
    }

    const user = await User.findById(id);
    if (!user) {
      return { 
        success: false, 
        error: { 
          _errors: ["User not found"] 
        } 
      };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return { 
        success: false, 
        error: { 
          currentPassword: { 
            _errors: ["Current password is incorrect"] 
          } 
        } 
      };
    }

    // Check if new password is different from current
    if (await bcrypt.compare(newPassword, user.password)) {
      return {
        success: false,
        error: {
          newPassword: {
            _errors: ["New password must be different from current password"]
          }
        }
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { 
      success: true, 
      message: "Password updated successfully." 
    };
  } catch (error) {
    console.error("Update password error:", error);
    return { 
      success: false, 
      error: { 
        _errors: ["Failed to update password"] 
      } 
    };
  }
}

export async function updateTwoFactor(formData) {
  await dbConnect();

  try {
    const id = formData.get('id');
    const twoFactorEnabled = formData.get('twoFactorEnabled') === 'true';

    const user = await User.findById(id);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    user.isTwoFactorEnabled = twoFactorEnabled;
    await user.save();

    return { 
      success: true, 
      data: { isTwoFactorEnabled: user.isTwoFactorEnabled } 
    };
  } catch (error) {
    console.error("Update two-factor error:", error);
    return { success: false, error: "Failed to update two-factor setting" };
  }
}