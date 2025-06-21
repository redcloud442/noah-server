import { getCookie } from "hono/cookie";
import { decode } from "hono/jwt";
export const cartMiddleware = async (c, next) => {
    const user = c.get("user");
    const token = getCookie(c, "auth_token");
    if (!token) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    const decoded = decode(token);
    if (!decoded) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    if (decoded.payload.role === "MEMBER") {
        c.set("user", user);
    }
    else {
        return c.json({ message: "Unauthorized" }, 401);
    }
    return next();
};
