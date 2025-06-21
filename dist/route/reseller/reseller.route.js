import { Hono } from "hono";
import { resellerController, resellerDashboardController, resellerOrdersController, } from "./reseller.controller.js";
import { resellerDashboardMiddleware, resellerMiddleware, resellerOrdersMiddleware, } from "./reseller.middleware.js";
const reseller = new Hono();
reseller.get("/dashboard/transactions", resellerMiddleware, resellerController);
reseller.get("/dashboard", resellerDashboardMiddleware, resellerDashboardController);
reseller.post("/orders", resellerOrdersMiddleware, resellerOrdersController);
export default reseller;
