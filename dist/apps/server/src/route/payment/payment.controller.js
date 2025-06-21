import { createPaymentIntent } from "./payment.model.js";
export const paymentPostController = async (c) => {
    try {
        const paymentIntent = await createPaymentIntent({
            amount: 10000,
            order_number: "1234567890",
            productVariant: [{ product_variant_id: "1", quantity: 1, price: 10000 }],
        });
    }
    catch (error) {
        return c.json({ message: "Internal Server Error" }, 500);
    }
};
