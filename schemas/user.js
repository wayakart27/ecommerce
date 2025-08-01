import { z } from "zod";

// Base user schema without password requirements
export const UserBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["Admin", "User", "Customer"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
  status: z.enum(["Active", "Inactive"], {
    errorMap: () => ({ message: "Status must be either Active or Inactive" }),
  }),
  isVerified: z.boolean().default(true),
  isTwoFactorEnabled: z.boolean().default(false),
  image: z.string().optional(), // Optional image
});

// Schema for creating a new user (requires password)
export const CreateUserSchema = UserBaseSchema.extend({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Schema for updating an existing user (password optional)
export const UpdateUserSchema = UserBaseSchema.extend({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
});


export const UpdatePasswordSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  currentPassword: z.string().min(1, "Current password is required"),
newPassword: z.string()
  .min(8, "Password must be 8-20 characters with uppercase, lowercase, number, and special character (no spaces)")
  .max(20, "Password must be 8-20 characters with uppercase, lowercase, number, and special character (no spaces)")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?!.*\s).{8,20}$/, 
    "Password must be 8-64 characters with: 1 uppercase, 1 lowercase, 1 number, 1 special character, and no spaces"
  ),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).strict().refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }
);