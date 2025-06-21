import { userChangePasswordSchema, userPatchSchema, userPostSchema, userVerifyResellerCodeSchema, } from "../../schema/schema.js";
import { rateLimit } from "../../utils/redis.js";
export const userGetMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:user-get`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    await next();
};
export const userPostMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:user-post`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { params } = await c.req.json();
    const { error } = userPostSchema.safeParse(params);
    if (error) {
        return c.json({ message: error.message }, 400);
    }
    c.set("params", params);
    await next();
};
export const userPatchMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:user-post`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { params } = await c.req.json();
    const { id } = c.req.param();
    const { error } = userPatchSchema.safeParse({
        ...params,
        userId: id,
    });
    if (error) {
        return c.json({ message: error.message }, 400);
    }
    c.set("params", params);
    await next();
};
export const userResellerRequestMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:user-reseller-request`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    await next();
};
export const userVerifyResellerCodeMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:user-verify-reseller-code`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { params } = await c.req.json();
    const validatedData = userVerifyResellerCodeSchema.safeParse(params);
    if (validatedData.error) {
        return c.json({ message: "invalid otp" }, 400);
    }
    c.set("params", validatedData.data);
    await next();
};
export const userChangePasswordMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:user-change-password`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { params } = await c.req.json();
    const validatedData = userChangePasswordSchema.safeParse(params);
    if (validatedData.error) {
        return c.json({ message: "invalid password" }, 400);
    }
    c.set("params", validatedData.data);
    await next();
};
export const userGenerateLoginLinkMiddleware = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${user.id}:user-generate-login-link`, 5, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { params } = await c.req.json();
    c.set("params", params);
    await next();
};
