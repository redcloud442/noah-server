import { Hono } from "hono";
import { cartDeleteController, cartGetController, cartPostController, cartPutController, } from "./cart.controller.js";
import { cartDeleteMiddleware, cartMiddleware, cartPostMiddleware, cartPutMiddleware, } from "./cart.middleware.js";
const cart = new Hono();
cart.get("/", cartMiddleware, cartGetController);
cart.post("/", cartPostMiddleware, cartPostController);
cart.put("/:id", cartPutMiddleware, cartPutController);
cart.delete("/:id", cartDeleteMiddleware, cartDeleteController);
export default cart;
