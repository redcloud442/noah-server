import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (
  email: string,
  subject: string,
  message: string
) => {
  await resend.emails.send({
    from: "Noir Clothing <no-reply@help.noir-clothing.com>",
    to: email,
    subject,
    text: message,
  });

  return {
    message: "Email sent",
  };
};
