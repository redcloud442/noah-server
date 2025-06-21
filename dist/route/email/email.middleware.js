import { emailSchema } from "../../schema/schema.js";
import { rateLimit } from "../../utils/redis.js";
export const emailMiddleware = async (c, next) => {
    const { to, subject, text, html } = await c.req.json();
    const isAllowed = await rateLimit(`rate-limit:${to}:email-send`, 1, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const validated = emailSchema.safeParse({ to, subject, text, html });
    if (!validated.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validated.data);
    await next();
};
