import { z } from "zod";
import mongoose from "mongoose";

export const addressSchema = z.object({
  user: z.instanceof(mongoose.Types.ObjectId),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  email: z.string().email("Invalid email"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone is required"),
  isDefault: z.boolean(),
  type: z.string().optional()
});

export const updateAddressSchema = addressSchema.omit({ user: true });