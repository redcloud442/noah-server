import { Hono } from "hono";
import { addPosProductController, getPosProductsController, } from "./pos.controller.js";
import { addPosProductMiddleware, getPostProductsMiddleware, } from "./pos.middleware.js";
const pos = new Hono();
pos.get("/get-pos-products", getPostProductsMiddleware, getPosProductsController);
pos.post("/checkout", addPosProductMiddleware, addPosProductController);
export default pos;
