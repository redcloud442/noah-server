import { Hono } from "hono";
import {
  withdrawActionController,
  withdrawController,
  withdrawListController,
} from "./withdraw.controller.js";
import {
  withdrawActionMiddleware,
  withdrawListMiddleware,
  withdrawMiddleware,
} from "./withdraw.middleware.js";

const withdraw = new Hono();

withdraw.post("/", withdrawMiddleware, withdrawController);

withdraw.post("/list", withdrawListMiddleware, withdrawListController);

withdraw.post("/action", withdrawActionMiddleware, withdrawActionController);

export default withdraw;
