import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface ContactNotificationParams {
  productTitle: string;
  contactType: string;
  contactValue: string;
  message?: string;
}

export async function sendContactNotification({
  productTitle,
  contactType,
  contactValue,
  message,
}: ContactNotificationParams): Promise<void> {
  const ownerEmail = process.env.OWNER_EMAIL;

  if (!ownerEmail) {
    console.warn("OWNER_EMAIL not configured, skipping notification");
    return;
  }

  const contactLabel = contactType === "instagram" ? "Instagram" : "WhatsApp";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1d1d1f; margin-bottom: 24px;">New Contact Request</h2>

      <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px 0; color: #86868b; font-size: 14px;">Product</p>
        <p style="margin: 0; color: #1d1d1f; font-size: 16px; font-weight: 500;">${productTitle}</p>
      </div>

      <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px 0; color: #86868b; font-size: 14px;">${contactLabel}</p>
        <p style="margin: 0; color: #1d1d1f; font-size: 16px; font-weight: 500;">${contactValue}</p>
      </div>

      ${
        message
          ? `
      <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px 0; color: #86868b; font-size: 14px;">Message</p>
        <p style="margin: 0; color: #1d1d1f; font-size: 16px;">${message}</p>
      </div>
      `
          : ""
      }

      <p style="color: #86868b; font-size: 12px; margin-top: 24px;">
        This notification was sent from your PUPPED store.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: ownerEmail,
    subject: `PUPPED: New inquiry for ${productTitle}`,
    html,
  });
}
