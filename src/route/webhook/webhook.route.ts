import { Hono } from "hono";
import { webhookController } from "./webhook.controller.js";
import { webhookMiddleware } from "./webhook.middleware.js";

const webhook = new Hono();

webhook.post("/payment", webhookMiddleware, webhookController);

export default webhook;
