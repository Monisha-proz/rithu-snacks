import nodemailer from "nodemailer";
import {
  getRegistrationOtpEmailTemplate,
  getForgotPasswordOtpEmailTemplate,
} from "./templates/otp-email.template";
import {
  getContactAcknowledgementEmailTemplate,
  getContactReplyEmailTemplate,
} from "./templates/contact-email.template";
import { getNewsletterWelcomeEmailTemplate } from "./templates/newsletter-email.template";
import { getBulkOrderAcknowledgementEmailTemplate } from "./templates/bulk-order-email.template";

let cachedTransporter: nodemailer.Transporter | null = null;

export const emailService = {
  getFromAddress() {
    const fromEmail =
      process.env.EMAIL_FROM ||
      process.env.EMAIL_USER ||
      "noreply@rithusnacks.com";
    return fromEmail.includes("<")
      ? fromEmail
      : `"Rithu Snacks" <${fromEmail}>`;
  },

  getRawFromEmail() {
    return (
      process.env.EMAIL_FROM ||
      process.env.EMAIL_USER ||
      "noreply@rithusnacks.com"
    );
  },

  getTransporter() {
    if (cachedTransporter) {
      return cachedTransporter;
    }

    const host = process.env.EMAIL_HOST;
    const portStr = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (
      !host ||
      !user ||
      !pass ||
      host.includes("your-") ||
      user.includes("your-") ||
      pass.includes("your-")
    ) {
      return null;
    }

    const port = Number(portStr) || 587;
    const secure = port === 465; // false for 587 / Brevo

    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 15000,
      socketTimeout: 15000,
    });

    return cachedTransporter;
  },

  async sendOtpEmail(
    to: string,
    otp: string,
    purpose: "register" | "reset_password" = "register"
  ): Promise<boolean> {
    const { subject, html, text } =
      purpose === "register"
        ? getRegistrationOtpEmailTemplate(otp)
        : getForgotPasswordOtpEmailTemplate(otp);

    const from = this.getFromAddress();

    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn(
        `[EMAIL SERVICE] SMTP is not configured; ${purpose} OTP email was not sent.`
      );
      return false;
    }

    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      return true;
    } catch (error) {
      console.error("[EMAIL SERVICE] Error sending email:", error);
      return false;
    }
  },

  async sendContactAcknowledgementEmail(
    to: string,
    name: string,
    contactSubject?: string | null
  ): Promise<boolean> {
    const { subject, html, text } = getContactAcknowledgementEmailTemplate({
      name,
      subject: contactSubject,
    });

    const from = this.getFromAddress();

    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn(
        "[EMAIL SERVICE] SMTP is not configured; contact acknowledgement email was not sent."
      );
      return false;
    }

    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`[EMAIL SERVICE] Contact acknowledgement email sent to ${to} (MessageId: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error("[EMAIL SERVICE] Error sending contact acknowledgement email:", error);
      return false;
    }
  },

  async sendContactReplyEmail(
    to: string,
    name: string,
    originalSubject: string | null | undefined,
    replyMessage: string
  ): Promise<boolean> {
    const { subject, html, text } = getContactReplyEmailTemplate({
      name,
      originalSubject,
      replyMessage,
    });

    const from = this.getFromAddress();

    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn(
        "[EMAIL SERVICE] SMTP is not configured; contact reply email was not sent."
      );
      return false;
    }

    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`[EMAIL SERVICE] Contact reply email sent to ${to} (MessageId: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error("[EMAIL SERVICE] Error sending contact reply email:", error);
      return false;
    }
  },

  async sendNewsletterWelcomeEmail(to: string): Promise<boolean> {
    const { subject, html, text } = getNewsletterWelcomeEmailTemplate({
      email: to,
    });

    const from = this.getFromAddress();
    const rawFromEmail = this.getRawFromEmail();

    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn(
        "[EMAIL SERVICE] SMTP is not configured; newsletter welcome email was not sent."
      );
      return false;
    }

    try {
      const info = await transporter.sendMail({
        from,
        replyTo: rawFromEmail,
        to,
        subject,
        text,
        html,
      });
      console.log(
        `[EMAIL SERVICE] Newsletter welcome email sent to ${to} (MessageId: ${info.messageId})`
      );
      return true;
    } catch (error) {
      console.error("[EMAIL SERVICE] Error sending newsletter welcome email:", error);
      return false;
    }
  },

  async sendBulkOrderAcknowledgementEmail(params: {
    to: string;
    name: string;
    phone: string;
    quantity: number;
    productInterest?: string | null;
    companyName?: string | null;
    message?: string | null;
  }): Promise<boolean> {
    const { subject, html, text } = getBulkOrderAcknowledgementEmailTemplate(params);

    const from = this.getFromAddress();
    const rawFromEmail = this.getRawFromEmail();
    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn(
        "[EMAIL SERVICE] SMTP is not configured; bulk order acknowledgement email was not sent."
      );
      return false;
    }

    try {
      const info = await transporter.sendMail({
        from,
        replyTo: rawFromEmail,
        to: params.to,
        subject,
        text,
        html,
      });
      console.log(
        `[EMAIL SERVICE] Bulk order acknowledgement email sent to ${params.to} (MessageId: ${info.messageId})`
      );
      return true;
    } catch (error) {
      console.error(
        "[EMAIL SERVICE] Error sending bulk order acknowledgement email:",
        error
      );
      return false;
    }
  },
};


