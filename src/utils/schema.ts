import { z } from "zod";

//checkout schema
export const checkoutSchema = z.object({
  checkoutNumber: z.string().min(8).max(8),
  referralCode: z.string().optional().nullable(),
});

//payment schema
export const paymentSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(4, "First name is required"),
    lastName: z.string().min(4, "Last name is required"),
    address: z.string().min(4, "Address is required"),
    province: z.string().min(4, "Province is required"),
    city: z.string().min(4, "City is required"),
    shippingOption: z.string().min(4, "Shipping option is required"),
    barangay: z.string().min(4, "Barangay is required"),
    postalCode: z.string().min(4, "Postal code is required"),
    phone: z.string().min(10, "Phone number is required"),
    amount: z.number().min(4, "Amount is required"),
    order_number: z.string(),
    referralCode: z.string().optional().nullable(),
    productVariant: z.array(
      z.object({
        product_variant_id: z.string(),
        product_variant_quantity: z.number(),
        product_variant_price: z.number(),
        product_variant_size: z.string(),
        product_variant_color: z.string(),
      })
    ),
  })
  .strict();

export type CheckoutFormData = z.infer<typeof paymentSchema>;

const cardTypeEnum = z.enum(["Visa", "Mastercard"]);
const eWalletEnum = z.enum(["GCash", "GrabPay", "PayMaya"]);
const bankingEnum = z.enum(["BPI", "UnionBank"]);

const cardPaymentSchema = z.object({
  order_number: z.string().min(8).max(8),
  payment_method: z.literal("card"),
  payment_details: z.object({
    card: z.object({
      card_number: z.string().min(16).max(16),
      card_expiry: z.string().min(5).max(5),
      card_cvv: z.string().min(3).max(3),
    }),
  }),
  payment_type: cardTypeEnum,
});

const nonCardPaymentSchema = z.object({
  order_number: z.string().min(8).max(16),
  payment_method: z.enum(["e_wallet", "online_banking"]),
  payment_type: z.union([eWalletEnum, bankingEnum]),
});

export const paymentCreatePaymentSchema = z.discriminatedUnion(
  "payment_method",
  [cardPaymentSchema, nonCardPaymentSchema]
);

export type PaymentCreatePaymentFormData = z.infer<
  typeof paymentCreatePaymentSchema
>;

export const orderGetSchema = z.object({
  take: z.number().min(1).max(15),
  skip: z.number().min(0),
});

export type OrderGetParams = z.infer<typeof orderGetSchema>;

export const addressCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  address: z.string(),
  province: z.string(),
  city: z.string(),
  barangay: z.string(),
  postalCode: z.string(),
  phone: z.string(),
  is_default: z.boolean(),
  shippingOption: z.string().min(4, "Shipping option is required"),
});

export type AddressCreateFormData = z.infer<typeof addressCreateSchema>;

//product collection schema
export const productCollectionSchema = z.object({
  search: z.string().optional(),
  take: z.number().min(1).max(15),
  skip: z.number().min(0),
});

//product category schema
export const productCategorySchema = z.object({
  productCategoryName: z.string().min(1, "Product category name is required"),
  productCategoryDescription: z.string().optional(),
  teamId: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type ProductCategoryForm = z.infer<typeof productCategorySchema>;

export const productSchema = z.object({
  products: z.array(
    z.object({
      name: z.string().min(1, "Product name is required"),
      price: z.coerce.number().min(1, "Price must be greater than 0"),
      description: z.string().optional(),
      category: z.string().min(1, "Category is required"),
      variants: z.array(
        z.object({
          id: z.string().uuid("ID must be a valid UUID"),
          color: z.string().min(1, "Color is required"),
          size: z.string().min(1, "Size is required"),
          quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
          images: z.array(
            z
              .instanceof(File)
              .refine((file) => !!file, { message: "File is required" })
              .refine(
                (file) =>
                  ["image/jpeg", "image/png", "image/jpg"].includes(
                    file.type
                  ) && file.size <= 12 * 1024 * 1024, // 12MB limit
                { message: "File must be a valid image and less than 12MB." }
              )
          ),
          publicUrl: z.array(z.string()).optional(),
        })
      ),
    })
  ),
});

export type ProductFormType = z.infer<typeof productSchema>;

export const productVariantSchema = z.object({
  product_variant_color: z.string().uuid(),
  product_variant_id: z.string(),
  product_variant_product_id: z.string(),
  product_variant_quantity: z.number(),
  product_variant_size: z.string(),
  product_variant_slug: z.string(),
  variant_sample_images: z.array(
    z.object({
      variant_sample_image_image_url: z.string(),
      variant_sample_image_product_variant_id: z.string(),
    })
  ),
});

export const productCreateSchema = z.object({
  product_category_id: z.string(),
  product_description: z.string(),
  product_id: z.number(),
  product_name: z.string(),
  product_price: z.number(),
  product_sale_percentage: z.number(),
  product_slug: z.string(),
  product_team_id: z.string(),
  product_variants: z.array(productVariantSchema),
});

export type typeProductCreateSchema = z.infer<typeof productCreateSchema>;

export const productGetAllProductSchema = z.object({
  take: z.number().min(1).max(15),
  skip: z.number().min(1),
  search: z.string().optional(),
  teamId: z.string().optional(),
  category: z.string().optional(),
});

export const productSetFeaturedProductSchema = z.object({
  productId: z.string(),
});

export const productPublicSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  sort: z
    .enum([
      "newest",
      "oldest",
      "price_asc",
      "price_desc",
      "featured",
      "best_seller",
    ])
    .optional(),
  take: z.coerce.number().min(1).max(15),
  skip: z.coerce.number().min(1),
  branch: z.string().optional().default("16dcbf9a-1904-43f7-a98a-060f6903661d"),
});

export type ProductPublicParams = z.infer<typeof productPublicSchema>;

export const cartGetQuantitySchema = z.object({
  items: z.array(
    z.object({
      product_variant_id: z.string(),
      product_variant_size: z.string(),
    })
  ),
});

export type CartGetQuantityParams = z.infer<typeof cartGetQuantitySchema>;
