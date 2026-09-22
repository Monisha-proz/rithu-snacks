export function getNewsletterWelcomeEmailTemplate(params: {
  email: string;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const { email } = params;
  const emailSubject = "Thank You for Subscribing - Rithu Snacks";

  const text = `Hi ${email},\n\nThank you for subscribing to the Rithu Snacks newsletter. You're now on the list to receive our latest updates, festival offers, and fresh snack arrivals.\n\nRegards,\nRithu Snacks Team`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
          .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .logo { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 24px; text-align: center; }
          .message-box { background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #dc2626; }
          .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Rithu Snacks</div>
          <h2>Thank You for Subscribing!</h2>
          <p>Hi <strong>${email}</strong>,</p>
          <div class="message-box">
            <p style="margin: 0; font-size: 15px; color: #374151;">
              Thank you for subscribing to the <strong>Rithu Snacks</strong> newsletter. You're now on the list to receive our latest updates, festival offers, and fresh snack arrivals.
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            We look forward to serving you the most authentic, handcrafted traditional South Indian snacks and sweets.
          </p>
          <div class="footer">&copy; ${new Date().getFullYear()} Rithu Snacks. All rights reserved.</div>
        </div>
      </body>
    </html>
  `;

  return { subject: emailSubject, html, text };
}
