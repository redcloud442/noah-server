import type { Context } from "hono";

import type { Next } from "hono";
import {
  cartCheckoutSchema,
  cartDeleteSchema,
  cartPostSchema,
  cartPutSchema,
} from "../../schema/schema.js";
import { rateLimit } from "../../utils/redis.js";
import { cartGetQuantitySchema } from "../../utils/schema.js";

export const cartMiddleware = async (c: Context, next: Next) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const isAllowed = await rateLimit(
    `rate-limit:${user.id}:cart-get`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  if (
    user.user_metadata.role !== "ADMIN" &&
    user.user_metadata.role !== "MEMBER" &&
    user.user_metadata.role !== "RESELLER"
  ) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  await next();
};

export const cartGetQuantityMiddleware = async (c: Context, next: Next) => {
  const ip = c.req.header("x-forwarded-for");

  const isAllowed = await rateLimit(
    `rate-limit:${ip}:cart-get-quantity`,
    100,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  const params = await c.req.json();

  const validated = cartGetQuantitySchema.safeParse(params);

  if (!validated.success) {
    console.log(validated.error);
    return c.json({ message: "Invalid request" }, 400);
  }

  c.set("params", validated.data);
  await next();
};

export const cartPostMiddleware = async (c: Context, next: Next) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const isAllowed = await rateLimit(
    `rate-limit:${user.id}:cart-post`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  if (
    user.user_metadata.role !== "ADMIN" &&
    user.user_metadata.role !== "MEMBER" &&
    user.user_metadata.role !== "RESELLER"
  ) {
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

export const cartDeleteMiddleware = async (c: Context, next: Next) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const isAllowed = await rateLimit(
    `rate-limit:${user.id}:cart-delete`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  if (
    user.user_metadata.role !== "MEMBER" &&
    user.user_metadata.role !== "ADMIN" &&
    user.user_metadata.role !== "RESELLER"
  ) {
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

export const cartPutMiddleware = async (c: Context, next: Next) => {
  const user = c.get("user");

  const isAllowed = await rateLimit(
    `rate-limit:${user.id}:cart-put`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  if (
    user.user_metadata.role !== "ADMIN" &&
    user.user_metadata.role !== "MEMBER"
  ) {
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

export const cartCheckoutMiddleware = async (c: Context, next: Next) => {
  const user = c.get("user");

  const isAllowed = await rateLimit(
    `rate-limit:${user.id}:cart-put`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  if (
    user.user_metadata.role !== "ADMIN" &&
    user.user_metadata.role !== "MEMBER"
  ) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { items, cartItems } = await c.req.json();

  const validated = cartCheckoutSchema.safeParse({
    items: items,
    cartItems: cartItems,
  });

  if (!validated.success) {
    return c.json({ message: "Invalid request" }, 400);
  }

  c.set("params", validated.data);

  await next();
};
