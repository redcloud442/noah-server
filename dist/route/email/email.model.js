import { Resend } from "resend";
export const resend = new Resend(process.env.RESEND_API_KEY);
export const sendEmail = async (to, subject, text, html) => {
    const { data, error } = await resend.emails.send({
        from: "Noir Clothing <no-reply@help.noir-clothing.com>",
        to,
        subject,
        text,
        html,
    });
    return {
        message: "Email sent",
    };
};
