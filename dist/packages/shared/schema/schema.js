"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const schema = zod_1.z.object({
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    address: zod_1.z.string(),
    province: zod_1.z.string(),
    city: zod_1.z.string(),
    barangay: zod_1.z.string(),
    postalCode: zod_1.z.string(),
    phone: zod_1.z.string(),
    amount: zod_1.z.number(),
    order_number: zod_1.z.string(),
    productVariant: zod_1.z.array(zod_1.z.object({
        product_variant_id: zod_1.z.string(),
        product_variant_quantity: zod_1.z.number(),
        product_variant_price: zod_1.z.number(),
    })),
});
