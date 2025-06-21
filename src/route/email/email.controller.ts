import type { Context } from "hono";
import { sendEmail } from "./email.model.js";

export const emailController = async (c: Context) => {
  try {
    const { email, subject, message } = c.get("params");

    const emailResponse = await sendEmail(email, subject, message);

    return c.json(emailResponse, 200);
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500);
  }
};
