import { newsletterSubscribeSchema } from "../../schema/schema.js";
import prisma from "../../utils/prisma.js";
import { rateLimit } from "../../utils/redis.js";
export const newsletterSubscribeMiddleware = async (c, next) => {
    const { email } = await c.req.json();
    const isAllowed = await rateLimit(`rate-limit:${email}:newsletter-subscribe`, 1, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const validated = newsletterSubscribeSchema.safeParse({ email });
    if (!validated.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    const checker = !!(await prisma.newsletter_table.findUnique({
        where: { newsletter_email: validated.data.email },
    }));
    if (checker) {
        return c.json({ message: "Email already subscribed" }, 400);
    }
    c.set("params", { email: validated.data.email });
    await next();
};
