import { createPaymentIntent, createPaymentMethod, getPayment, } from "./payment.model.js";
export const paymentPostController = async (c) => {
    try {
        const params = c.get("params");
        const user = c.get("user");
        const paymentIntent = await createPaymentIntent(params, {
            ...user,
            user_id: user.id ? user.id : null,
        });
        return c.json(paymentIntent, 200);
    }
    catch (error) {
        return c.json({ message: "Internal Server Error" }, 500);
    }
};
export const paymentCreatePaymentController = async (c) => {
    try {
        const params = c.get("params");
        const paymentIntent = await createPaymentMethod(params);
        return c.json(paymentIntent, 200);
    }
    catch (error) {
        return c.json({ message: "Internal Server Error" }, 500);
    }
};
export const paymentGetController = async (c) => {
    try {
        const params = c.get("params");
        const paymentIntent = await getPayment(params);
        return c.json(paymentIntent, 200);
    }
    catch (error) {
        return c.json({ message: "Internal Server Error" }, 500);
    }
};
