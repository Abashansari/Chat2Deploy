/**
 * Career Application Email Dispatcher
 *
 * Dispatches:
 * 1. Admin notification email to ansariabash2004@gmail.com with the applicant's complete profile.
 * 2. Applicant confirmation email to the applicant.
 *
 * Environment variables:
 *   RESEND_API_KEY — API key from https://resend.com/api-keys
 *   CAREERS_ADMIN_EMAIL — Admin recipient (defaults to: ansariabash2004@gmail.com)
 *   CAREERS_FROM_EMAIL — Sender address (defaults to: "Chat2Deploy Careers <onboarding@resend.dev>")
 */

export interface CareerApplicationData {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  institution: string;
  course: string;
  currentYear: string;
  skills: string[];
  githubUrl: string;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  motivation: string;
  unpaidAcknowledged: boolean;
  createdAt?: string;
}

export interface ConfirmationEmailOptions {
  to: string;
  applicantName: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Builds the branded admin notification HTML email.
 */
function buildAdminNotificationHtml(app: CareerApplicationData): string {
  const year = new Date().getFullYear();
  const dateStr = app.createdAt ? new Date(app.createdAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) : new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

  const skillsBadges = app.skills
    .map(
      (s) =>
        `<span style="display:inline-block;background-color:#1e293b;color:#38bdf8;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;margin:2px 4px 2px 0;border:1px solid #334155;">${escapeHtml(s)}</span>`
    )
    .join(" ");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Application — Chat2Deploy Careers</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#18181b;border-radius:12px;overflow:hidden;border:1px solid #27272a;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#09090b 0%,#18181b 100%);padding:28px 32px;border-bottom:2px solid #0284c7;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background-color:#0284c7;color:#ffffff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 8px;border-radius:4px;margin-bottom:8px;">New Application</span>
                    <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#f4f4f5;">Chat2Deploy Contributor Program</h1>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="font-size:11px;color:#a1a1aa;">${escapeHtml(dateStr)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Applicant Card Header -->
          <tr>
            <td style="padding:28px 32px 16px;">
              <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#ffffff;">${escapeHtml(app.fullName)}</h2>
              <p style="margin:0;font-size:14px;color:#38bdf8;">
                <a href="mailto:${escapeHtml(app.email)}" style="color:#38bdf8;text-decoration:none;">${escapeHtml(app.email)}</a>
                ${app.phone ? ` • <span style="color:#a1a1aa;">${escapeHtml(app.phone)}</span>` : ""}
              </p>
            </td>
          </tr>

          <!-- Academic & Profile Details Table -->
          <tr>
            <td style="padding:0 32px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;border-radius:8px;border:1px solid #27272a;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#71717a;width:35%;">Institution</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:13px;color:#e4e4e7;font-weight:500;">${escapeHtml(app.institution)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#71717a;">Course / Degree</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:13px;color:#e4e4e7;font-weight:500;">${escapeHtml(app.course)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#71717a;">Year / Semester</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:13px;color:#e4e4e7;font-weight:500;">${escapeHtml(app.currentYear)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#71717a;">GitHub</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:13px;">
                    <a href="${escapeHtml(app.githubUrl)}" target="_blank" style="color:#38bdf8;text-decoration:none;font-weight:500;">${escapeHtml(app.githubUrl)} &rarr;</a>
                  </td>
                </tr>
                ${app.linkedinUrl ? `
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#71717a;">LinkedIn</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:13px;">
                    <a href="${escapeHtml(app.linkedinUrl)}" target="_blank" style="color:#38bdf8;text-decoration:none;font-weight:500;">${escapeHtml(app.linkedinUrl)} &rarr;</a>
                  </td>
                </tr>` : ""}
                ${app.portfolioUrl ? `
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#71717a;">Portfolio</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:13px;">
                    <a href="${escapeHtml(app.portfolioUrl)}" target="_blank" style="color:#38bdf8;text-decoration:none;font-weight:500;">${escapeHtml(app.portfolioUrl)} &rarr;</a>
                  </td>
                </tr>` : ""}
                <tr>
                  <td style="padding:10px 14px;font-size:12px;color:#71717a;">Unpaid Program Term</td>
                  <td style="padding:10px 14px;font-size:13px;color:#34d399;font-weight:600;">Acknowledged &amp; Agreed</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Selected Skills -->
          <tr>
            <td style="padding:0 32px 20px;">
              <h3 style="margin:0 0 10px;font-size:13px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Candidate Skills</h3>
              <div>${skillsBadges}</div>
            </td>
          </tr>

          <!-- Motivation -->
          <tr>
            <td style="padding:0 32px 28px;">
              <h3 style="margin:0 0 10px;font-size:13px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Statement of Motivation</h3>
              <div style="background-color:#09090b;border:1px solid #27272a;border-left:3px solid #0284c7;border-radius:6px;padding:16px;font-size:14px;color:#e4e4e7;line-height:1.6;white-space:pre-wrap;">${escapeHtml(app.motivation)}</div>
            </td>
          </tr>

          <!-- Action Footer -->
          <tr>
            <td style="background-color:#09090b;padding:20px 32px;border-top:1px solid #27272a;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#71717a;line-height:1.5;">
                      Direct reply is enabled: click Reply to email <strong style="color:#a1a1aa;">${escapeHtml(app.fullName)}</strong> directly at <span style="color:#38bdf8;">${escapeHtml(app.email)}</span>.
                    </p>
                  </td>
                  <td align="right">
                    <a href="mailto:${escapeHtml(app.email)}?subject=Re:%20Chat2Deploy%20Contributor%20Program%20Application" style="display:inline-block;background-color:#0284c7;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;padding:8px 16px;border-radius:6px;">Reply Candidate</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildAdminNotificationPlainText(app: CareerApplicationData): string {
  return `=== NEW CHAT2DEPLOY CAREER APPLICATION ===

Applicant: ${app.fullName}
Email: ${app.email}
Phone: ${app.phone || "Not provided"}

Institution: ${app.institution}
Course: ${app.course}
Year/Semester: ${app.currentYear}

Skills: ${app.skills.join(", ")}

GitHub: ${app.githubUrl}
LinkedIn: ${app.linkedinUrl || "Not provided"}
Portfolio: ${app.portfolioUrl || "Not provided"}

Unpaid Term Acknowledged: Yes

Statement of Motivation:
${app.motivation}

Application ID: ${app.id}
`;
}

function buildConfirmationHtml(applicantName: string): string {
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Application Received — Chat2Deploy</title>
</head>
<body style="margin:0;padding:0;background-color:#0c0c0c;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0c0c0c;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1c1c1c;border-radius:12px;overflow:hidden;border:1px solid #222222;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0c0c0c 0%,#1c1c1c 100%);padding:32px 32px 24px;border-bottom:2px solid #0ea5e9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="width:36px;height:36px;background-color:#e8633e;border-radius:50%;display:inline-block;vertical-align:middle;text-align:center;line-height:36px;margin-right:10px;">
                      <span style="color:#ffffff;font-size:14px;font-weight:bold;">C2D</span>
                    </div>
                    <span style="font-size:20px;font-weight:700;color:#e5e5e5;vertical-align:middle;">Chat2Deploy</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#e5e5e5;line-height:1.3;">
                We Have Received Your Application
              </h1>
              <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
                Hi ${escapeHtml(applicantName)},
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
                Thank you for applying to the <strong style="color:#e5e5e5;">Chat2Deploy Learner Contributor Program</strong>.
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
                We have successfully received your application. Our team will review the information you submitted and contact you if you are shortlisted or selected for the next stage.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="background-color:#151515;border:1px solid #222222;border-radius:8px;padding:16px;">
                    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
                      This is an <strong style="color:#d1d5db;">unpaid learning and contribution opportunity</strong>; no stipend is provided. A certificate may be awarded after successful completion of the program and fulfillment of its requirements.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:15px;color:#d1d5db;line-height:1.6;">
                Best regards,<br>
                <strong style="color:#e5e5e5;">Chat2Deploy Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0c0c0c;padding:20px 32px;border-top:1px solid #222222;">
              <p style="margin:0;font-size:11px;color:#6b7280;line-height:1.5;text-align:center;">
                © ${year} Chat2Deploy. This email was sent because you applied to the Learner Contributor Program.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildConfirmationPlainText(applicantName: string): string {
  return `Hi ${applicantName},

Thank you for applying to the Chat2Deploy Learner Contributor Program.

We have successfully received your application. Our team will review the information you submitted and contact you if you are shortlisted or selected for the next stage.

This is an unpaid learning and contribution opportunity; no stipend is provided. A certificate may be awarded after successful completion of the program and fulfillment of its requirements.

Best regards,
Chat2Deploy Team`;
}

/**
 * Sends an email notification to the administrator (ansariabash2004@gmail.com).
 */
export async function sendCareerAdminNotificationEmail(
  app: CareerApplicationData,
  recipientOverride?: string
): Promise<void> {
  const adminEmail = recipientOverride || process.env.CAREERS_ADMIN_EMAIL || "ansariabash2004@gmail.com";
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n============================================================`);
    console.log(`[CAREERS NOTIFICATION EMAIL] TO: ${adminEmail}`);
    console.log(`SUBJECT: New Application: ${app.fullName} (${app.course})`);
    console.log(`REPLY-TO: ${app.email}`);
    console.log(`------------------------------------------------------------`);
    console.log(buildAdminNotificationPlainText(app));
    console.log(`============================================================\n`);
    return;
  }

  const fromAddress = process.env.CAREERS_FROM_EMAIL || "Chat2Deploy Careers <onboarding@resend.dev>";

  const payload = {
    from: fromAddress,
    to: [adminEmail],
    reply_to: app.email,
    subject: `[Chat2Deploy Careers] New Application: ${app.fullName} (${app.course})`,
    html: buildAdminNotificationHtml(app),
    text: buildAdminNotificationPlainText(app),
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`Resend Admin Email error (${response.status}): ${errorBody.slice(0, 200)}`);
  }
}

/**
 * Sends a career confirmation email to the applicant using Resend API.
 */
export async function sendCareerConfirmationEmail(options: ConfirmationEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[career-email] Applicant confirmation for ${options.to} (RESEND_API_KEY not configured, skipped)`);
    return;
  }

  const fromAddress = process.env.CAREERS_FROM_EMAIL || "Chat2Deploy Careers <onboarding@resend.dev>";

  const payload = {
    from: fromAddress,
    to: [options.to],
    subject: "We Have Received Your Application — Chat2Deploy Careers",
    html: buildConfirmationHtml(options.applicantName),
    text: buildConfirmationPlainText(options.applicantName),
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`Resend Applicant Email error (${response.status}): ${errorBody.slice(0, 200)}`);
  }
}
