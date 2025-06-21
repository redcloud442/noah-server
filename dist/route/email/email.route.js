import { Hono } from "hono";
import { emailController } from "./email.controller.js";
import { emailMiddleware } from "./email.middleware.js";
const email = new Hono();
email.post("/send-email", emailMiddleware, emailController);
export default email;
