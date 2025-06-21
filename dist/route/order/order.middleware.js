import { orderGetListSchema } from "../../schema/schema.js";
import { rateLimit } from "../../utils/redis.js";
import { orderGetSchema } from "../../utils/schema.js";
export const orderGetMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:order-get`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { take, skip } = c.req.query();
    const takeNumber = Number(take);
    const skipNumber = Number(skip);
    const validated = orderGetSchema.safeParse({
        take: takeNumber,
        skip: skipNumber,
    });
    if (!validated.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validated.data);
    c.set("user", user);
    await next();
};
export const orderGetItemsMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:order-get-items`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { id } = c.req.param();
    c.set("params", { orderNumber: id });
    c.set("user", user);
    return await next();
};
export const orderGetListMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:order-get-list`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { params } = await c.req.json();
    const validated = orderGetListSchema.safeParse(params);
    if (!validated.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validated.data);
    c.set("user", user);
    await next();
};
