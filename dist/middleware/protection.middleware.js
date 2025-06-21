import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { sendErrorResponse } from "../utils/function.js";
import { getSupabase } from "./auth.middleware.js";
const JWT_SECRET = process.env.JWT_SECRET || "your-strong-secret";
export const protectionMiddleware = async (c, next) => {
    const supabase = getSupabase(c);
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        return sendErrorResponse("Unauthorized", 401);
    }
    if (!data.user) {
        return sendErrorResponse("Unauthorized", 401);
    }
    c.set("user", data.user);
    await next();
};
export const checkoutMiddleware = async (c, next) => {
    const supabase = getSupabase(c);
    const { data } = await supabase.auth.getUser();
    c.set("user", data.user || null);
    await next();
};
export const checkoutProtectionMiddleware = async (c, next) => {
    const supabase = getSupabase(c);
    const checkoutToken = getCookie(c, "checkout_token");
    let user = null;
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
        if (!checkoutToken) {
            return sendErrorResponse("Unauthorized (Missing checkout token)", 401);
        }
        try {
            const decoded = await verify(checkoutToken, JWT_SECRET);
            user = decoded;
        }
        catch (err) {
            return sendErrorResponse("Invalid checkout token", 401);
        }
    }
    else {
        user = data.user;
    }
    if (user) {
        c.set("user", user);
    }
    await next();
};
