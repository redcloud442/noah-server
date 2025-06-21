import { deleteCookie, getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { envConfig } from "../../env.js";
import { loginResellerSchema, loginSchema, registerSchema, saveCartSchema, } from "../../schema/schema.js";
import { rateLimit } from "../../utils/redis.js";
import { checkoutSchema } from "../../utils/schema.js";
const JWT_SECRET = envConfig.JWT_SECRET;
export const authLoginMiddleware = async (c, next) => {
    const { email, firstName, lastName, userId, cart } = await c.req.json();
    const parsed = loginSchema.safeParse({
        email,
        firstName,
        lastName,
        userId,
        cart,
    });
    if (!parsed.success) {
        return c.json({ message: "Invalid email or password" }, 400);
    }
    const isAllowed = await rateLimit(`rate-limit:${email}:login-post`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    c.set("params", parsed.data);
    await next();
};
export const authCallbackMiddleware = async (c, next) => {
    const { email, firstName, lastName, userId, cart } = await c.req.json();
    const parsed = loginSchema.safeParse({
        email,
        firstName,
        lastName,
        userId,
        cart,
    });
    if (!parsed.success) {
        return c.json({ message: "Invalid email or password" }, 400);
    }
    const isAllowed = await rateLimit(`rate-limit:${email}:login-post`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    c.set("params", parsed.data);
    await next();
};
export const authLoginResellerMiddleware = async (c, next) => {
    const { email } = await c.req.json();
    const parsed = loginResellerSchema.safeParse({
        email,
    });
    if (!parsed.success) {
        return c.json({ message: "Invalid email or password" }, 400);
    }
    const isAllowed = await rateLimit(`rate-limit:${email}:login-post`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    c.set("params", parsed.data);
    await next();
};
export const authSaveCartMiddleware = async (c, next) => {
    const user = c.get("user");
    const { cart } = await c.req.json();
    const parsed = saveCartSchema.safeParse({
        cart,
    });
    if (!parsed.success) {
        return c.json({ message: "Invalid cart" }, 400);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:save-cart-post`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    c.set("params", parsed.data);
    await next();
};
export const authRegisterMiddleware = async (c, next) => {
    const user = c.get("user");
    const { email, firstName, lastName, cart } = await c.req.json();
    const parsed = registerSchema.safeParse({
        email,
        firstName,
        lastName,
        userId: user?.id,
        cart,
    });
    if (!parsed.success) {
        return c.json({ message: "Invalid email or password" }, 400);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:register-post`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    c.set("params", parsed.data);
    await next();
};
export const authLogoutMiddleware = async (c, next) => {
    deleteCookie(c, "auth_token");
    await next();
};
export const createCheckoutTokenMiddleware = async (c, next) => {
    const { checkoutNumber, referralCode } = await c.req.json();
    const isAllowed = await rateLimit(`rate-limit:${checkoutNumber}:checkout-post`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const parsed = checkoutSchema.safeParse({ checkoutNumber, referralCode });
    if (!parsed.success) {
        return c.json({ message: "Invalid checkout number" }, 400);
    }
    c.set("params", parsed.data);
    await next();
};
export const verifyCheckoutTokenMiddleware = async (c, next) => {
    const token = getCookie(c, "checkout_token");
    const user = c.get("user");
    if (!token) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:checkout-post`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    c.set("token", token);
    await next();
};
export const handleLogoutMiddleware = async (c, next) => {
    const user = c.get("user");
    const token = getCookie(c, "auth_token");
    if (!token) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const decoded = await verify(token, JWT_SECRET);
    if (!decoded) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    if (decoded.role === "MEMBER" || decoded.role === "ADMIN") {
        c.set("user", decoded);
    }
    else {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const { id } = c.req.param();
    c.set("params", id);
    c.set("user", user);
    await next();
};
export const deleteCheckoutTokenMiddleware = async (c, next) => {
    const token = getCookie(c, "checkout_token");
    const user = c.get("user");
    if (!token) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${token}:checkout-post`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    c.set("token", token);
    await next();
};
