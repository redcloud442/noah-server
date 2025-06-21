import { adminAuthProtection } from "../../middleware/auth.middleware.js";
import { productCollectionSlugSchema, productCreateSchema, } from "../../schema/schema.js";
import { rateLimit } from "../../utils/redis.js";
import { productCategorySchema, productCollectionSchema, productGetAllProductSchema, productPublicSchema, productSetFeaturedProductSchema, } from "../../utils/schema.js";
export const productCollectionMiddleware = async (c, next) => {
    const user = await adminAuthProtection(c);
    const isAllowed = await rateLimit(`rate-limit:${user.id}:product-collection`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { search, take, skip, teamId } = c.req.query();
    const takeNumber = Number(take);
    const skipNumber = Number(skip);
    const validate = productCollectionSchema.safeParse({
        search,
        take: takeNumber,
        skip: skipNumber,
        teamId,
    });
    if (!validate.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validate.data);
    return await next();
};
export const productCollectionsPostMiddleware = async (c, next) => {
    const user = await adminAuthProtection(c);
    const isAllowed = await rateLimit(`rate-limit:${user.id}:product-collections-post`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { productCategoryName, productCategoryDescription, teamId, imageUrl } = await c.req.json();
    const validate = productCategorySchema.safeParse({
        productCategoryName,
        productCategoryDescription,
        teamId,
        imageUrl,
    });
    if (!validate.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validate.data);
    return await next();
};
export const productCreateMiddleware = async (c, next) => {
    const user = await adminAuthProtection(c);
    const key = `product:${user.id}-create`;
    const isAllowed = await rateLimit(`rate-limit:${user.id}:product-create`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const body = await c.req.json();
    const validate = productCreateSchema.safeParse(body);
    if (!validate.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validate.data);
    return await next();
};
export const productUpdateMiddleware = async (c, next) => {
    const user = await adminAuthProtection(c);
    const isAllowed = await rateLimit(`rate-limit:${user.id}:product-update`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const body = await c.req.json();
    const validate = productCreateSchema.safeParse(body);
    if (!validate.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validate.data);
    return await next();
};
export const productCollectionSlugMiddleware = async (c, next) => {
    const user = await adminAuthProtection(c);
    const isAllowed = await rateLimit(`rate-limit:${user.id}:product-collection-slug`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { params } = await c.req.json();
    const validate = productCollectionSlugSchema.safeParse(params);
    if (!validate.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validate.data);
    await next();
};
export const productGetCategoriesMiddleware = async (c, next) => {
    const user = await adminAuthProtection(c);
    const isAllowed = await rateLimit(`rate-limit:${user.id}:product-get-all`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    return await next();
};
export const productGetAllProductMiddleware = async (c, next) => {
    const user = await adminAuthProtection(c);
    const isAllowed = await rateLimit(`rate-limit:${user.id}:product-get-all`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { params } = await c.req.json();
    const validate = productGetAllProductSchema.safeParse(params);
    if (!validate.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validate.data);
    return await next();
};
export const productSetFeaturedProductMiddleware = async (c, next) => {
    const user = await adminAuthProtection(c);
    const isAllowed = await rateLimit(`rate-limit:${user.id}:product-set-featured`, 50, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { params } = await c.req.json();
    const validate = productSetFeaturedProductSchema.safeParse(params);
    if (!validate.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validate.data);
    return await next();
};
export const productPublicMiddleware = async (c, next) => {
    const ip = c.req.header("x-forwarded-for");
    const isAllowed = await rateLimit(`rate-limit:${ip}:product-public`, 20, "1m", c);
    if (!isAllowed) {
        return c.json({ message: "Too many requests" }, 429);
    }
    const { take, skip, search, category, sort, branch } = c.req.query();
    const validate = productPublicSchema.safeParse({
        take,
        skip,
        search,
        category,
        sort,
        branch,
    });
    if (!validate.success) {
        return c.json({ message: "Invalid request" }, 400);
    }
    c.set("params", validate.data);
    return await next();
};
