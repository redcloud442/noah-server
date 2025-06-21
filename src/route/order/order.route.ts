import { Hono } from "hono";

import {
  orderGetController,
  orderGetItemsController,
  orderGetListController,
} from "./order.controller.js";
import {
  orderGetItemsMiddleware,
  orderGetListMiddleware,
  orderGetMiddleware,
} from "./order.middleware.js";

const order = new Hono();

order.get("/:id/items", orderGetItemsMiddleware, orderGetItemsController);

order.get("/", orderGetMiddleware, orderGetController);

order.post("/list", orderGetListMiddleware, orderGetListController);

export default order;
