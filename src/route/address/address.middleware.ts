import type { Context, Next } from "hono";
import { rateLimit } from "../../utils/redis.js";
import { addressCreateSchema, orderGetSchema } from "../../utils/schema.js";

export const addressGetMiddleware = async (c: Context, next: Next) => {
  const user = c.get("user");

  const isAllowed = await rateLimit(
    `rate-limit:${user.id}:address-get`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
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

export const addressCreateMiddleware = async (c: Context, next: Next) => {
  const user = c.get("user");

  const isAllowed = await rateLimit(
    `rate-limit:${user.id}:address-create`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  const params = await c.req.json();

  const validated = addressCreateSchema.safeParse(params);

  if (!validated.success) {
    return c.json({ message: "Invalid request" }, 400);
  }

  c.set("params", validated.data);
  c.set("user", user);

  await next();
};

export const addressPutDefaultMiddleware = async (c: Context, next: Next) => {
  const user = c.get("user");

  const isAllowed = await rateLimit(
    `rate-limit:${user.id}:address-put-default`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { id } = c.req.param();

  c.set("params", id);
  c.set("user", user);

  await next();
};

export const addressDeleteMiddleware = async (c: Context, next: Next) => {
  const user = c.get("user");

  const isAllowed = await rateLimit(
    `rate-limit:${user.id}:address-delete`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { id } = c.req.param();

  c.set("params", id);
  c.set("user", user);

  await next();
};
