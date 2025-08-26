import { z } from "zod";

// User schema
export const createUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // this marks the error at confirmPassword
  });

// Login user schema
export const loginUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// Product schema
export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().nonnegative("Stock must be non-negative"),
});

// Order schema
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive("Quantity must be positive"),
      })
    )
    .min(1, "At least one item is required"),
});
