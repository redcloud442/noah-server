import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { decode } from "hono/jwt";
import { authLoginModel, authRegisterModel } from "./auth.model.js";
export const authLoginController = async (c) => {
    try {
        const { email, firstName, lastName, userId } = c.get("params");
        const result = await authLoginModel({ email, firstName, lastName, userId });
        setCookie(c, "auth_token", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
        });
        return c.json(result, 200);
    }
    catch (error) {
        return c.json({ message: "Error" }, 500);
    }
};
export const authRegisterController = async (c) => {
    try {
        const params = c.get("params");
        const result = await authRegisterModel(params);
        setCookie(c, "auth_token", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 60 * 60,
            path: "/",
        });
        return c.json(result, 200);
    }
    catch (error) {
        return c.json({ message: "Error" }, 500);
    }
};
export const authLogoutController = async (c) => {
    deleteCookie(c, "auth_token");
    return c.json({ message: "Logged out" });
};
export const authVerifyTokenController = async (c) => {
    const token = getCookie(c, "auth_token");
    if (!token) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const decoded = decode(token);
    return c.json(decoded.payload);
};
