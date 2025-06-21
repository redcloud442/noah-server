import { deleteCookie } from "hono/cookie";
import { loginSchema, registerSchema } from "../../schema/schema.js";
export const authLoginMiddleware = async (c, next) => {
    const { email, firstName, lastName, userId } = await c.req.json();
    const parsed = loginSchema.safeParse({ email, firstName, lastName, userId });
    if (!parsed.success) {
        return c.json({ message: "Invalid email or password" }, 400);
    }
    c.set("params", parsed.data);
    await next();
};
export const authRegisterMiddleware = async (c, next) => {
    const user = c.get("user");
    const { email, firstName, lastName } = await c.req.json();
    const parsed = registerSchema.safeParse({
        email,
        firstName,
        lastName,
        userId: user?.id,
    });
    if (!parsed.success) {
        return c.json({ message: "Invalid email or password" }, 400);
    }
    c.set("params", parsed.data);
    await next();
};
export const authLogoutMiddleware = async (c, next) => {
    deleteCookie(c, "auth_token");
    await next();
};
