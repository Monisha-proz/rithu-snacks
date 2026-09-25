export function getBulkOrderAcknowledgementEmailTemplate(params: {
  name: string;
  email?: string | null;
  phone: string;
  quantity: number;
  productInterest?: string | null;
  companyName?: string | null;
  message?: string | null;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, phone, quantity, productInterest, companyName, message } = params;

  const emailSubject = productInterest
    ? `We have received your bulk order enquiry: ${productInterest} - Rithu Snacks`
    : `We have received your bulk order enquiry - Rithu Snacks`;

  const detailsTextList: string[] = [];
  detailsTextList.push(`- Product Interest: ${productInterest || "Custom Bulk Selection"}`);
  detailsTextList.push(`- Quantity: ${quantity} units`);
  if (companyName) {
    detailsTextList.push(`- Company / Business: ${companyName}`);
  }
  detailsTextList.push(`- Contact Phone: ${phone}`);
  if (message) {
    detailsTextList.push(`- Requirements: ${message}`);
  }

  const text = `Hi ${name},\n\nThank you for reaching out to Rithu Snacks for your bulk order requirement. We have successfully received your enquiry and our team will get in touch with you as soon as possible to discuss pricing, custom packaging, and delivery details.\n\nEnquiry Summary:\n${detailsTextList.join(
    "\n"
  )}\n\nIf you have any urgent queries, please feel free to reply directly to this email.\n\nWarm regards,\nRithu Snacks Team`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
          .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .logo { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 24px; text-align: center; }
          .badge { display: inline-block; background-color: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; }
          .message-box { background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .details-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; }
          .details-table { width: 100%; border-collapse: collapse; font-size: 14px; }
          .details-table td { padding: 6px 0; vertical-align: top; }
          .label-col { color: #64748b; font-weight: 500; width: 40%; }
          .value-col { color: #0f172a; font-weight: 600; }
          .req-box { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1; }
          .req-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px; }
          .req-content { font-size: 13px; color: #334155; line-height: 1.5; white-space: pre-wrap; margin: 0; }
          .next-steps { font-size: 14px; color: #475569; line-height: 1.6; margin: 20px 0; }
          .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Rithu Snacks</div>
          <div style="text-align: center;">
            <span class="badge">Bulk Order Enquiry</span>
            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 22px;">Thank You for Your Bulk Order Enquiry!</h2>
          </div>
          <p style="font-size: 15px; color: #374151;">Hi <strong>${name}</strong>,</p>
          <div class="message-box">
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">
              Thank you for choosing <strong>Rithu Snacks</strong> for your bulk order requirement. We have successfully received your inquiry and our bulk sales & corporate team is currently reviewing your specifications.
            </p>
          </div>

          <div class="details-card">
            <div style="font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
              Enquiry Summary
            </div>
            <table class="details-table">
              <tbody>
                <tr>
                  <td class="label-col">Product Interest:</td>
                  <td class="value-col">${productInterest || "Custom Bulk Selection"}</td>
                </tr>
                <tr>
                  <td class="label-col">Quantity Requested:</td>
                  <td class="value-col">${quantity} units</td>
                </tr>
                ${
                  companyName
                    ? `<tr>
                  <td class="label-col">Company / Business:</td>
                  <td class="value-col">${companyName}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td class="label-col">Phone Number:</td>
                  <td class="value-col">${phone}</td>
                </tr>
              </tbody>
            </table>

            ${
              message
                ? `<div class="req-box">
                <div class="req-title">Additional Requirements</div>
                <p class="req-content">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>
              </div>`
                : ""
            }
          </div>

          <p class="next-steps">
            Our corporate sales specialist will get in touch with you as soon as possible to discuss tailored bulk pricing, packaging options, and delivery schedules.
          </p>

          <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
            If you have any urgent requests or wish to provide additional details, please feel free to reply directly to this email.
          </p>

          <p style="margin-top: 24px; font-size: 14px; color: #374151;">
            Warm regards,<br>
            <strong>Rithu Snacks Team</strong>
          </p>
          <div class="footer">&copy; ${new Date().getFullYear()} Rithu Snacks. All rights reserved.</div>
        </div>
      </body>
    </html>
  `;

  return { subject: emailSubject, html, text };
}
