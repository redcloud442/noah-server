import { Hono } from "hono";

import {
  orderGetController,
  orderGetItemsController,
  orderGetListController,
  orderPutController,
} from "./order.controller.js";
import {
  orderGetItemsMiddleware,
  orderGetListMiddleware,
  orderGetMiddleware,
  orderPutMiddleware,
} from "./order.middleware.js";

const order = new Hono();

order.get("/:id/items", orderGetItemsMiddleware, orderGetItemsController);

order.get("/", orderGetMiddleware, orderGetController);

order.post("/list", orderGetListMiddleware, orderGetListController);

order.put("/:id", orderPutMiddleware, orderPutController);

export default order;
