import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { rateLimit } from "../../utils/redis.js";
import {
  paymentCreatePaymentSchema,
  paymentSchema,
} from "../../utils/schema.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const paymentMiddleware = async (c: Context, next: Next) => {
  const userData = c.get("user");
  const checkoutToken = getCookie(c, "checkout_token");

  if (!getCookie) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  if (!checkoutToken) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const decoded = (await verify(checkoutToken, JWT_SECRET!)) as {
    referralCode?: string;
  };

  const referralCode = decoded.referralCode ?? null;

  // if (!userData) {
  //   return c.json({ message: "Unauthorized" }, 401);
  // }

  // if (
  //   userData.user_metadata.role !== "MEMBER" &&
  //   userData.user_metadata.role !== "ADMIN" &&
  //   userData.user_metadata.role !== "RESELLER"
  // ) {
  //   return c.json({ message: "Unauthorized" }, 401);
  // }

  const {
    order_number,
    email,
    firstName,
    lastName,
    phone,
    amount,
    barangay,
    address,
    city,
    province,
    postalCode,
    productVariant,
  } = await c.req.json();

  const validate = paymentSchema.safeParse({
    order_number,
    email,
    firstName,
    lastName,
    phone,
    address,
    city,
    barangay,
    amount,
    province,
    postalCode,
    productVariant,
    referralCode,
  });

  if (!validate.success) {
    return c.json(
      { message: "Invalid request", errors: validate.error.errors },
      400
    );
  }

  const isAllowed = await rateLimit(
    `rate-limit:${userData.id}:payment-create`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  c.set("params", validate.data);
  c.set("user", userData);

  await next();
};

export const paymentCreatePaymentMiddleware = async (
  c: Context,
  next: Next
) => {
  const userData = c.get("user");

  // if (
  //   userData.user_metadata.role !== "MEMBER" &&
  //   userData.user_metadata.role !== "ADMIN" &&
  //   userData.user_metadata.role !== "RESELLER"
  // ) {
  //   return c.json({ message: "Unauthorized" }, 401);
  // }

  const { order_number, payment_method, payment_details, payment_type } =
    await c.req.json();

  const validate = paymentCreatePaymentSchema.safeParse({
    order_number,
    payment_method,
    payment_type,
    payment_details,
  });

  if (!validate.success) {
    return c.json(
      { message: "Invalid request", errors: validate.error.errors },
      400
    );
  }

  const isAllowed = await rateLimit(
    `rate-limit:${userData.id}:payment-create`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  c.set("params", validate.data);
  c.set("user", userData);

  await next();
};

export const paymentGetMiddleware = async (c: Context, next: Next) => {
  const userData = c.get("user");

  // if (
  //   userData.user_metadata.role !== "MEMBER" &&
  //   userData.user_metadata.role !== "ADMIN" &&
  //   userData.user_metadata.role !== "RESELLER"
  // ) {
  //   return c.json({ message: "Unauthorized" }, 401);
  // }

  const { orderNumber } = c.req.param();
  const { paymentIntentId, clientKey } = c.req.query();

  if (!paymentIntentId) {
    return c.json({ message: "Invalid request" }, 400);
  }

  const isAllowed = await rateLimit(
    `rate-limit:${userData.id}:payment-get`,
    50,
    "1m",
    c
  );

  if (!isAllowed) {
    return c.json({ message: "Too many requests" }, 429);
  }

  c.set("params", { paymentIntentId, clientKey, orderNumber });

  await next();
};
