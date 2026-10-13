/**
 * Contact Email Dispatcher
 * Dispatches notification emails when a user submits a message via the Contact page.
 */

export interface ContactMessageData {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildAdminNotificationHtml(msg: ContactMessageData): string {
  const dateStr = new Date(msg.createdAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Contact Message — Chat2Deploy</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#18181b;border-radius:12px;overflow:hidden;border:1px solid #27272a;">
          <tr>
            <td style="background:linear-gradient(135deg,#09090b 0%,#18181b 100%);padding:24px 32px;border-bottom:2px solid #e8633e;">
              <span style="display:inline-block;background-color:#e8633e;color:#ffffff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 8px;border-radius:4px;margin-bottom:8px;">New Message</span>
              <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#f4f4f5;">Chat2Deploy Contact Inquiry</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 12px;">
              <h2 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#ffffff;">${escapeHtml(msg.fullName)}</h2>
              <p style="margin:0;font-size:13px;color:#38bdf8;">
                <a href="mailto:${escapeHtml(msg.email)}" style="color:#38bdf8;text-decoration:none;">${escapeHtml(msg.email)}</a>
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#71717a;">Received: ${escapeHtml(dateStr)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 20px;">
              <div style="background-color:#09090b;border:1px solid #27272a;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
                <span style="font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Subject</span>
                <p style="margin:4px 0 0;font-size:14px;color:#f4f4f5;font-weight:600;">${escapeHtml(msg.subject)}</p>
              </div>
              <div style="background-color:#09090b;border:1px solid #27272a;border-left:3px solid #e8633e;border-radius:6px;padding:16px;font-size:14px;color:#e4e4e7;line-height:1.6;white-space:pre-wrap;">${escapeHtml(msg.message)}</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#09090b;padding:16px 32px;border-top:1px solid #27272a;">
              <a href="mailto:${escapeHtml(msg.email)}?subject=Re:%20${encodeURIComponent(msg.subject)}" style="display:inline-block;background-color:#e8633e;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;padding:8px 16px;border-radius:6px;">Reply to Sender</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildAdminNotificationPlainText(msg: ContactMessageData): string {
  return `=== NEW CHAT2DEPLOY CONTACT MESSAGE ===
From: ${msg.fullName} <${msg.email}>
Date: ${msg.createdAt}
Subject: ${msg.subject}

Message:
${msg.message}

Message ID: ${msg.id}
`;
}

function buildSenderConfirmationHtml(fullName: string, subject: string): string {
  const year = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Message Received — Chat2Deploy</title>
</head>
<body style="margin:0;padding:0;background-color:#0c0c0c;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#e5e5e5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0c0c0c;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1c1c1c;border-radius:12px;overflow:hidden;border:1px solid #222222;">
          <tr>
            <td style="padding:28px 32px;border-bottom:2px solid #e8633e;">
              <span style="font-size:18px;font-weight:700;color:#ffffff;">Chat2Deploy Support</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#ffffff;">We Received Your Message</h1>
              <p style="margin:0 0 14px;font-size:14px;color:#d1d5db;line-height:1.6;">Hi ${escapeHtml(fullName)},</p>
              <p style="margin:0 0 14px;font-size:14px;color:#d1d5db;line-height:1.6;">Thank you for contacting Chat2Deploy regarding "<strong>${escapeHtml(subject)}</strong>". We have received your inquiry and our team will review it as soon as possible.</p>
              <p style="margin:20px 0 0;font-size:14px;color:#d1d5db;line-height:1.6;">Best regards,<br><strong>Chat2Deploy Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0c0c0c;padding:16px 32px;border-top:1px solid #222222;">
              <p style="margin:0;font-size:11px;color:#6b7280;text-align:center;">© ${year} Chat2Deploy. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendContactEmail(msg: ContactMessageData): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.CONTACT_ADMIN_EMAIL || process.env.CAREERS_ADMIN_EMAIL || "ansariabash2004@gmail.com";
  const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.CAREERS_FROM_EMAIL || "Chat2Deploy <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[contact-email] RESEND_API_KEY not configured. Message logged to console for ${adminEmail}:`);
    console.log(buildAdminNotificationPlainText(msg));
    return { sent: false, error: "Email delivery not configured in environment (logged to server)." };
  }

  try {
    // 1. Notify admin
    const adminPayload = {
      from: fromEmail,
      to: [adminEmail],
      reply_to: msg.email,
      subject: `[Chat2Deploy Contact] ${msg.subject} (from ${msg.fullName})`,
      html: buildAdminNotificationHtml(msg),
      text: buildAdminNotificationPlainText(msg),
    };

    const adminRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(adminPayload),
    });

    if (!adminRes.ok) {
      const errText = await adminRes.text().catch(() => "Unknown error");
      console.error(`[contact-email] Resend error (${adminRes.status}):`, errText);
      return { sent: false, error: `Resend error (${adminRes.status}): ${errText.slice(0, 200)}` };
    }

    // 2. Attempt sender confirmation (non-fatal if blocked)
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [msg.email],
          subject: `We Received Your Message: ${msg.subject} — Chat2Deploy`,
          html: buildSenderConfirmationHtml(msg.fullName, msg.subject),
          text: `Hi ${msg.fullName},\n\nThank you for reaching out to Chat2Deploy. We have received your message regarding "${msg.subject}" and will respond shortly.\n\nBest regards,\nChat2Deploy Team`,
        }),
      });
    } catch {
      // Non-critical
    }

    return { sent: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[contact-email] Unexpected delivery error:", errorMsg);
    return { sent: false, error: errorMsg };
  }
}
