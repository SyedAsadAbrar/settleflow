import { z } from "zod";

export const signupSchema = z.object({
  email: z.email("Enter a valid email address.").transform((email) => email.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

export const loginSchema = signupSchema;
