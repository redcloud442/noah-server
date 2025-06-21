import type { Context } from "hono";
import { newsletterModel } from "./newsletter.model.js";

export const newsLetterController = async (c: Context) => {
  try {
    const params = c.get("params");

    await newsletterModel.create(params.email);

    return c.json({ message: "Email subscribed" }, 200);
  } catch (error) {
    return c.json({ message: "Failed to subscribe" }, 500);
  }
};
