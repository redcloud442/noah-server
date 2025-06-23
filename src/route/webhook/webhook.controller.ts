import type { Context } from "hono";
import { WebhookPaymentModel } from "./webhook.model.js";

export const webhookController = async (c: Context) => {
  try {
    const body = c.get("body");
    const event = body?.data;
    const eventType = event?.attributes?.type;

    await WebhookPaymentModel({ eventType, event });

    return c.json({ message: "Webhook received" }, 200);
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return c.json({ error: "Invalid request" }, 400);
  }
};
