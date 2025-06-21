import axios from "axios";
import { envConfig } from "../../env.js";
import prisma from "../../utils/prisma.js";
export const createPaymentIntent = async (params) => {
    const { amount, productVariant, order_number, email, firstName, lastName, phone, address, city, province, postalCode, } = params;
    const productVariantIds = productVariant.map((item) => item.product_variant_id);
    const existingProducts = await prisma.product_variant_table.findMany({
        where: {
            product_variant_id: { in: productVariantIds },
        },
        select: {
            product_variant_id: true,
            product_variant_quantity: true,
        },
    });
    const productStockMap = new Map(existingProducts.map((product) => [
        product.product_variant_id,
        product.product_variant_quantity,
    ]));
    for (const item of productVariant) {
        const availableStock = productStockMap.get(item.product_variant_id);
        if (availableStock === undefined) {
            throw new Error(`Product variant ${item.product_variant_id} not found.`);
        }
        if (availableStock < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.product_variant_id}.`);
        }
    }
    const options = {
        method: "POST",
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            authorization: `Basic ${envConfig.PAYMONGO_SECRET_KEY}`,
        },
        body: JSON.stringify({
            data: {
                attributes: {
                    amount: amount,
                    payment_method_allowed: [
                        "atome",
                        "card",
                        "dob",
                        "paymaya",
                        "billease",
                    ],
                    payment_method_options: { card: { request_three_d_secure: "any" } },
                    currency: "PHP",
                    capture_type: "automatic",
                },
            },
        }),
    };
    const response = await axios.post("https://api.paymongo.com/v1/payment_intents", options);
    const paymentIntent = await prisma.$transaction(async (tx) => {
        const paymentIntent = await tx.order_table.create({
            data: {
                order_number: order_number,
                order_status: "PENDING",
                order_total: amount,
                order_payment_id: response.data.id,
                order_email: "",
                order_first_name: "",
                order_last_name: "",
                order_contact: "",
                order_address: "",
                order_city: "",
                order_province: "",
                order_postal_code: "",
            },
            select: {
                order_id: true,
            },
        });
        await tx.order_item_table.createMany({
            data: productVariant.map((variant) => ({
                order_id: paymentIntent.order_id,
                product_variant_id: variant.product_variant_id,
                quantity: variant.quantity,
                price: variant.price,
            })),
        });
        return {
            paymentIntent: response.data.id,
            paymentIntentStatus: response.data.attributes.status,
            order_id: paymentIntent.order_id,
            order_number: order_number,
        };
    });
    return {
        paymentIntent: response.data.id,
        paymentIntentStatus: response.data.attributes.status,
        order_id: paymentIntent.order_id,
        order_number: order_number,
        order_status: "PENDING",
        order_total: amount,
    };
};
