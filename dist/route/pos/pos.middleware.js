import { addPosProductSchema, getPosProductsSchema, } from "../../schema/schema.js";
import { rateLimit } from "../../utils/redis.js";
export const getPostProductsMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    if (user.user_metadata.role !== "CASHIER") {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:get-pos-products`, 10, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { take, skip } = c.req.query();
    const { data, error } = getPosProductsSchema.safeParse({ take, skip });
    if (error) {
        return c.json({ message: error.message }, 400);
    }
    c.set("params", data);
    await next();
};
export const addPosProductMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    if (user.user_metadata.role !== "CASHIER") {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:get-pos-products`, 10, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { total_amount, cartItems } = await c.req.json();
    const { data, error } = addPosProductSchema.safeParse({
        total_amount,
        cartItems,
    });
    if (error) {
        return c.json({ message: error.message }, 400);
    }
    c.set("params", data);
    await next();
};
