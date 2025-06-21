import { Hono } from "hono";
import { registerController } from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";
const auth = new Hono();
auth.get("/", (c) => c.text("Hello World"));
auth.post("/register", authMiddleware, registerController);
export default auth;
