import { resellerGetListSchema, resellerOrdersSchema, } from "../../schema/schema.js";
import { rateLimit } from "../../utils/redis.js";
export const resellerMiddleware = async (c, next) => {
    const user = c.get("user");
    if (user.user_metadata.role !== "RESELLER") {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.user_id}:reseller-dashboard`, 20, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { take, skip } = c.req.query();
    const validate = resellerGetListSchema.safeParse({
        take,
        skip,
    });
    if (!validate.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validate.data);
    return await next();
};
export const resellerDashboardMiddleware = async (c, next) => {
    const user = c.get("user");
    if (user.user_metadata.role !== "RESELLER") {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.user_id}:reseller-dashboard`, 20, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    return await next();
};
export const resellerOrdersMiddleware = async (c, next) => {
    const user = c.get("user");
    if (user.user_metadata.role !== "RESELLER") {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.user_id}:reseller-dashboard`, 20, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { take, skip, search, sortDirection, columnAccessor, dateFilter } = await c.req.json();
    const validate = resellerOrdersSchema.safeParse({
        take,
        skip,
        search,
        sortDirection,
        columnAccessor,
        dateFilter,
    });
    if (!validate.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validate.data);
    return await next();
};
