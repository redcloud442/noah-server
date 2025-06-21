import { Hono } from "hono";
import {
  paymentCreatePaymentController,
  paymentGetController,
  paymentPostController,
} from "./payment.controller.js";
import {
  paymentCreatePaymentMiddleware,
  paymentGetMiddleware,
  paymentMiddleware,
} from "./payment.middleware.js";

const payment = new Hono();

payment.post("/", paymentMiddleware, paymentPostController);

payment.post(
  "/create-payment",
  paymentCreatePaymentMiddleware,
  paymentCreatePaymentController
);

payment.get("/:orderNumber", paymentGetMiddleware, paymentGetController);

export default payment;
