import { Hono } from "hono";
import { newsLetterController } from "./newsletter.controller.js";
import { newsletterSubscribeMiddleware } from "./newsletter.middleware.js";
const newsletter = new Hono();
newsletter.post("/", newsletterSubscribeMiddleware, newsLetterController);
export default newsletter;
