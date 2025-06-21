import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { envConfig } from "./env.js";
import { supabaseMiddleware } from "./middleware/auth.middleware.js";
import { errorHandlerMiddleware } from "./middleware/error.middleware.js";
import route from "./route/route.js";
const app = new Hono();
app.use("*", supabaseMiddleware(), cors({
    origin: [
        process.env.NODE_ENV === "development"
            ? "http://localhost:3000"
            : "https://primepinas.com",
    ],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Range", "X-Total-Count"],
}));
app.get("/", (c) => {
    return c.text("API endpoint is working!");
});
app.onError(errorHandlerMiddleware);
app.use(logger());
app.route("/api/v1", route);
serve({
    fetch: app.fetch,
    port: envConfig.PORT,
});
console.log(`Server is running on port ${envConfig.PORT}`);
