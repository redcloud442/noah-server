import { z } from "zod";
export const loginSchema = z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    userId: z.string().uuid().optional(),
});
export const registerSchema = z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    userId: z.string().uuid(),
});
export const cartPostSchema = z.object({
    product_id: z.string().uuid(),
    product_name: z.string(),
    product_price: z.number(),
    product_quantity: z.number(),
    product_variant_id: z.string().uuid(),
    product_variant_size: z.string(),
    product_variant_color: z.string(),
    product_variant_quantity: z.number(),
    product_variant_image: z.string(),
});
export const cartDeleteSchema = z.object({
    id: z.string().uuid(),
});
export const cartPutSchema = z.object({
    id: z.string().uuid(),
    product_quantity: z.number(),
});
