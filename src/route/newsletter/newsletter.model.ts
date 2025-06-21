import { Resend } from "resend";
import prisma from "../../utils/prisma.js";

const resendClient = new Resend(process.env.RESEND_API_KEY);

export const newsletterModel = {
  create: async (email: string) => {
    const newsletter = await prisma.newsletter_table.create({
      data: { newsletter_email: email },
    });

    await resendClient.contacts.create({
      audienceId: process.env.RESEND_AUDIENCE_ID!,
      email: newsletter.newsletter_email,
    });
    return newsletter;
  },
};
