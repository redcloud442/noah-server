import { Hono } from "hono";
import { dashboardController } from "./dashboard.controller.js";
import { dashboardMiddleware } from "./dashboard.middleware.js";

const dashboard = new Hono();

dashboard.post("/", dashboardMiddleware, dashboardController);

export default dashboard;
