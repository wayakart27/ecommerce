import { z } from "zod";

export const UpdateProfileSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  image: z.union([
    z.string().url("Invalid image URL"),
    z.string().length(0),
    z.undefined()
  ]).optional().transform(val => val === "" ? undefined : val),
}).strict();