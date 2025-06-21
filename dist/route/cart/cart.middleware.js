import { cartDeleteSchema, cartPostSchema, cartPutSchema, } from "../../schema/schema.js";
import { rateLimit } from "../../utils/redis.js";
export const cartMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:cart-get`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    if (user.user_metadata.role !== "ADMIN" &&
        user.user_metadata.role !== "MEMBER" &&
        user.user_metadata.role !== "RESELLER") {
        return c.json({ message: "Unauthorized" }, 401);
    }
    await next();
};
export const cartPostMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:cart-post`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    if (user.user_metadata.role !== "ADMIN" &&
        user.user_metadata.role !== "MEMBER" &&
        user.user_metadata.role !== "RESELLER") {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const params = await c.req.json();
    const validated = cartPostSchema.safeParse(params);
    if (!validated.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validated.data);
    await next();
};
export const cartDeleteMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:cart-delete`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    if (user.user_metadata.role !== "MEMBER" &&
        user.user_metadata.role !== "ADMIN" &&
        user.user_metadata.role !== "RESELLER") {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const params = c.req.param("id");
    const validated = cartDeleteSchema.safeParse({
        id: params,
    });
    if (!validated.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validated.data);
    await next();
};
export const cartPutMiddleware = async (c, next) => {
    const user = c.get("user");
    const isAllowed = await rateLimit(`rate-limit:${user.id}:cart-put`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    if (user.user_metadata.role !== "ADMIN" &&
        user.user_metadata.role !== "MEMBER") {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const params = c.req.param("id");
    const { product_quantity } = await c.req.json();
    const validated = cartPutSchema.safeParse({
        id: params,
        product_quantity: product_quantity,
    });
    if (!validated.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validated.data);
    await next();
};
