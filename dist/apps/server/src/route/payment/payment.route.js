import { Hono } from "hono";
import { paymentPostController } from "./payment.controller.js";
import { paymentMiddleware } from "./payment.middleware.js";
const payment = new Hono();
payment.post("/", paymentMiddleware, paymentPostController);
export default payment;
