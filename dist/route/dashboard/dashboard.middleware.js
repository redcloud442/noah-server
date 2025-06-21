import { dashboardSchema } from "../../schema/schema.js";
import { rateLimit } from "../../utils/redis.js";
export const dashboardMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    if (user.user_metadata.role !== "ADMIN") {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:user-dashboard`, 10, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const params = await c.req.json();
    const { error } = dashboardSchema.safeParse(params);
    if (error) {
        return c.json({ message: error.message }, 400);
    }
    c.set("params", params);
    await next();
};
