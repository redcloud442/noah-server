import { Hono } from "hono";
import { protectionMiddleware } from "../../middleware/protection.middleware.js";
import {
  cartCheckoutController,
  cartDeleteController,
  cartGetCheckedOutController,
  cartGetController,
  cartGetQuantityController,
  cartPostController,
  cartPutController,
} from "./cart.controller.js";
import {
  cartCheckoutMiddleware,
  cartDeleteMiddleware,
  cartGetQuantityMiddleware,
  cartMiddleware,
  cartPostMiddleware,
  cartPutMiddleware,
} from "./cart.middleware.js";

const cart = new Hono();

cart.get("/", protectionMiddleware, cartMiddleware, cartGetController);

cart.get(
  "/checked-out",
  protectionMiddleware,
  cartMiddleware,
  cartGetCheckedOutController
);

cart.post("/quantity", cartGetQuantityMiddleware, cartGetQuantityController);

cart.post("/", protectionMiddleware, cartPostMiddleware, cartPostController);

cart.put("/:id", protectionMiddleware, cartPutMiddleware, cartPutController);

cart.post(
  "/checkout",
  protectionMiddleware,
  cartCheckoutMiddleware,
  cartCheckoutController
);

cart.delete(
  "/:id",
  protectionMiddleware,
  cartDeleteMiddleware,
  cartDeleteController
);

export default cart;
