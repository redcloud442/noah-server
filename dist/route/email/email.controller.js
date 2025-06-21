import { sendEmail } from "./email.model.js";
export const emailController = async (c) => {
    try {
        const { to, subject, text, html } = c.get("params");
        const emailResponse = await sendEmail(to, subject, text, html);
        return c.json(emailResponse, 200);
    }
    catch (error) {
        return c.json({ message: "Internal Server Error" }, 500);
    }
};
