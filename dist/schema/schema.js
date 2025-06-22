import { z } from "zod";
export const productSchema = z.object({
    cart_id: z.string().uuid(),
    product_id: z.string().uuid(),
    product_name: z.string(),
    product_price: z.number(),
    product_quantity: z.number(),
    product_variant_id: z.string().uuid(),
    product_variant_color: z.string(),
});
export const loginSchema = z.object({
    email: z.string().email(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    userId: z.string().optional().nullable(),
    cart: z.array(productSchema).optional().nullable(),
});
export const loginResellerSchema = z.object({
    email: z.string().email(),
});
export const saveCartSchema = z.object({
    cart: z.array(productSchema).optional(),
});
export const registerSchema = z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    userId: z.string().uuid(),
    cart: z.array(productSchema).optional(),
});
export const cartPostSchema = z.object({
    cart_id: z.string().uuid(),
    product_id: z.string().uuid(),
    product_name: z.string(),
    product_price: z.number(),
    product_quantity: z.number(),
    product_size: z.string(),
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
export const cartCheckoutSchema = z.object({
    items: z.array(z.string().uuid()),
    cartItems: z.array(cartPostSchema).optional(),
});
export const productVariantSchema = z.object({
    product_variant_color: z.string(),
    product_variant_id: z.string(),
    product_variant_product_id: z.string().uuid(),
    product_variant_slug: z.string(),
    product_variant_is_deleted: z.boolean().default(false),
    variant_sample_images: z.array(z.object({
        variant_sample_image_image_url: z.string(),
        variant_sample_image_product_variant_id: z.string(),
    })),
    variant_sizes: z.array(z.object({
        variant_size_id: z.string(),
        variant_size_value: z.string(),
        variant_size_quantity: z.number(),
        variant_size_variant_id: z.string(),
    })),
});
export const productCreateSchema = z.array(z.object({
    product_category_id: z.string(),
    product_description: z.string(),
    product_id: z.string().uuid(),
    product_name: z.string(),
    product_price: z.number(),
    product_sale_percentage: z.number(),
    product_slug: z.string(),
    product_team_id: z.string(),
    product_variants: z.array(productVariantSchema),
    product_size_guide_url: z.string().optional(),
}));
export const productCollectionSlugSchema = z.object({
    collectionSlug: z.string().min(1),
    take: z.number(),
    skip: z.number(),
    search: z.string().optional(),
    teamId: z.string().optional(),
});
export const orderGetListSchema = z.object({
    take: z.number(),
    skip: z.number(),
    search: z.string().optional(),
    dateFilter: z
        .object({
        start: z.string().optional(),
        end: z.string().optional(),
    })
        .optional(),
    teamId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
});
export const userPostSchema = z.object({
    search: z.string().optional(),
    dateFilter: z.object({
        start: z.string().optional(),
        end: z.string().optional(),
    }),
    sortDirection: z.string().optional(),
    columnAccessor: z.string().optional(),
    take: z.coerce.number().min(1).max(15),
    skip: z.coerce.number().min(0),
    teamId: z.string().uuid(),
});
export const userPatchSchema = z.object({
    userId: z.string().uuid(),
    type: z.enum(["ban", "promote"]),
    role: z
        .enum(["ADMIN", "MEMBER", "RESELLER", "CASHIER"])
        .optional()
        .nullable(),
});
export const userVerifyResellerCodeSchema = z.object({
    otp: z.string().min(6).max(6),
});
export const resellerGetListSchema = z.object({
    take: z.coerce.number().min(1).max(15),
    skip: z.coerce.number().min(1),
});
export const withdrawalSchema = z.object({
    withdrawalMethod: z.enum(["bank", "ewallet"], {
        required_error: "Select a withdrawal method",
    }),
    provider: z.string().min(1, "Please select a provider"),
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    accountNumber: z.string().min(5, "Enter a valid account number"),
    accountName: z.string().min(3, "Enter a valid account name"),
});
export const resellerOrdersSchema = z.object({
    take: z.coerce.number().min(1).max(100),
    skip: z.coerce.number().min(0),
    search: z.string().optional(),
    sortDirection: z.string().optional(),
    columnAccessor: z.string().optional(),
    dateFilter: z.object({
        start: z.string().optional(),
        end: z.string().optional(),
    }),
});
export const withdrawalListSchema = z.object({
    take: z.coerce.number().min(1).max(100),
    skip: z.coerce.number().min(0),
    search: z.string().optional(),
    sortDirection: z.string().optional(),
    columnAccessor: z.string().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    teamId: z.string().uuid(),
    dateFilter: z.object({
        start: z.string().optional(),
        end: z.string().optional(),
    }),
});
export const withdrawalActionSchema = z.object({
    withdrawalId: z.string().uuid(),
    resellerId: z.string().uuid(),
    status: z.enum(["APPROVED", "REJECTED"]),
});
export const dashboardSchema = z.object({
    dateFilter: z.object({
        start: z.string().optional(),
        end: z.string().optional(),
    }),
    teamId: z.string().uuid(),
});
export const userChangePasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    userId: z.string().uuid(),
});
export const newsletterSubscribeSchema = z.object({
    email: z.string().email(),
});
export const emailSchema = z.object({
    to: z.string().email(),
    subject: z.string(),
    text: z.string(),
    html: z.string(),
});
export const getPosProductsSchema = z.object({
    take: z.coerce.number().min(1).max(100),
    skip: z.coerce.number().min(0),
});
export const addPosProductSchema = z.object({
    total_amount: z.number(),
    cartItems: z.array(z.object({
        product_variant_id: z.string().uuid(),
        product_quantity: z.number(),
        product_variant_size: z.string(),
        product_variant_product: z.string(),
    })),
});
