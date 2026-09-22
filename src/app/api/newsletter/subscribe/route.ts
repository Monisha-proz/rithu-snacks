import { z } from "zod";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { emailService } from "@/lib/email/email.service";
import { db } from "@/lib/db/prisma";

const subscribeNewsletterSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email is too long")
    .toLowerCase(),
});

export type SubscribeNewsletterInput = z.infer<typeof subscribeNewsletterSchema>;

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const { email } = context.body as SubscribeNewsletterInput;

      // 1. Persist/update subscriber in database
      try {
        await db.newsletter_subscribers.upsert({
          where: { email },
          create: {
            email,
            is_active: true,
            subscribed_at: new Date(),
          },
          update: {
            is_active: true,
            updated_at: new Date(),
          },
        });
      } catch (dbErr) {
        console.error("[NEWSLETTER] Failed to save subscriber in database:", dbErr);
      }

      // 2. Send the professional welcome email (non-blocking failure tolerance)
      let emailSent = false;
      try {
        emailSent = await emailService.sendNewsletterWelcomeEmail(email);
        if (!emailSent) {
          console.warn(`[NEWSLETTER] Welcome email was not dispatched for ${email}`);
        }
      } catch (err) {
        console.error("[NEWSLETTER] Failed to send welcome email:", err);
      }

      return apiSuccess(
        { email, emailSent },
        "Subscription is done!",
        200
      );
    },
  },
  {
    requireAuth: false,
    bodySchema: subscribeNewsletterSchema,
  }
);
