import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import {
  authCallbackModel,
  authLoginModel,
  authLoginResellerModel,
  authRegisterModel,
  authSaveCartModel,
  createCheckoutTokenModel,
  verifyCheckoutTokenModel,
} from "./auth.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-strong-secret";

export const authLoginController = async (c: Context) => {
  try {
    const { email, firstName, lastName, userId, cart } = c.get("params");

    const result = await authLoginModel({
      email,
      firstName,
      lastName,
      userId,
      cart,
    });

    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: "Error" }, 500);
  }
};

export const authLoginResellerController = async (c: Context) => {
  try {
    const { email } = c.get("params");

    const result = await authLoginResellerModel({ email });

    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: "Error" }, 500);
  }
};

export const authCallbackController = async (c: Context) => {
  try {
    const { email, firstName, lastName, userId, cart } = c.get("params");

    const result = await authCallbackModel({
      email,
      firstName,
      lastName,
      userId,
      cart,
    });

    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: "Error" }, 500);
  }
};

export const authSaveCartController = async (c: Context) => {
  try {
    const params = c.get("params");

    const result = await authSaveCartModel(params);

    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: "Error" }, 500);
  }
};

export const authRegisterController = async (c: Context) => {
  try {
    const params = c.get("params");

    const result = await authRegisterModel(params);

    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: "Error" }, 500);
  }
};

export const authLogoutController = async (c: Context) => {
  try {
    const supabase = c.get("supabase");

    await supabase.auth.signOut();

    deleteCookie(c, "auth_token");

    return c.json({ message: "Logged out" }, 200);
  } catch (error) {
    return c.json({ message: "Error" }, 500);
  }
};

export const authVerifyTokenController = async (c: Context) => {
  const token = getCookie(c, "auth_token");

  if (!token) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const decoded = jwt.verify(token, JWT_SECRET);

  return c.json(decoded);
};

export const createCheckoutTokenController = async (c: Context) => {
  try {
    const { checkoutNumber, referralCode } = c.get("params");
    const user = c.get("user");

    const result = await createCheckoutTokenModel({
      checkoutNumber,
      referralCode,
      user,
    });

    setCookie(c, "checkout_token", result, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 10 * 60,
    });

    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: "Error" }, 500);
  }
};

export const verifyCheckoutTokenController = async (c: Context) => {
  try {
    const token = c.get("token");

    if (!token) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const result = await verifyCheckoutTokenModel({ token });

    return c.json(result);
  } catch (error) {
    return c.json({ message: "Error" }, 500);
  }
};
