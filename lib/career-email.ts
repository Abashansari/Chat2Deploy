/**
 * Career Application Email Dispatcher
 *
 * Dispatches:
 * 1. Admin notification email to CAREERS_ADMIN_EMAIL with complete applicant profile and dashboard link.
 * 2. Applicant confirmation email to the applicant.
 * 3. Official selection email to selected candidates with customizable content.
 *
 * Environment variables:
 *   RESEND_API_KEY — API key from https://resend.com/api-keys
 *   CAREERS_ADMIN_EMAIL — Authorized admin email address
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
  appliedPosition?: string;
  status?: string;
  createdAt?: string;
}

export interface ConfirmationEmailOptions {
  to: string;
  applicantName: string;
}

export interface SelectionEmailOptions {
  to: string;
  applicantName: string;
  appliedPosition?: string;
  subject: string;
  content: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Returns default subject and body for selection emails.
 */
export function getDefaultSelectionEmail(applicantName: string, appliedPosition: string = "Learner Contributor") {
  const subject = `Congratulations ${applicantName}! You have been selected for the Chat2Deploy ${appliedPosition} Program`;
  const body = `Dear ${applicantName},

We are delighted to inform you that your application for the Chat2Deploy ${appliedPosition} Program has been accepted!

Our review team was genuinely impressed by your background, your demonstrated interest in software engineering, and your motivation to contribute to real-world products.

Program Overview & Next Steps:
• Role: ${appliedPosition}
• Modality: Remote, collaborative project contribution
• Tooling & Setup: You will receive an invitation to our team repository and communication channels within the next 48 hours.
• Program Terms: As acknowledged in your application, this is an unpaid learning opportunity designed to provide hands-on experience with modern web architecture and deployment systems. An official Certificate of Completion will be awarded upon meeting milestone deliverables.

Please reply directly to this email to confirm your acceptance and your readiness to begin onboarding.

Congratulations once again, and welcome to the team!

Warm regards,
Careers & Contributor Programs
Chat2Deploy Team`;

  return { subject, body };
}

/**
 * Builds the branded admin notification HTML email.
 */
function buildAdminNotificationHtml(app: CareerApplicationData, dashboardUrl: string): string {
  const dateStr = app.createdAt
    ? new Date(app.createdAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " (IST)"
    : new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " (IST)";

  const position = app.appliedPosition || "Learner Contributor";

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
                    <div style="margin-top:4px;font-size:13px;color:#38bdf8;font-weight:500;">Role: ${escapeHtml(position)}</div>
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

          <!-- Primary Call to Action: Admin Dashboard Link -->
          <tr>
            <td style="padding:0 32px 20px;">
              <div style="background-color:#0c4a6e22;border:1px solid #0284c7;border-radius:8px;padding:16px;text-align:center;">
                <p style="margin:0 0 12px;font-size:13px;color:#e0f2fe;">
                  Review this application and manage candidate selection in the Admin Dashboard:
                </p>
                <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 22px;border-radius:6px;box-shadow:0 4px 12px rgba(2,132,199,0.35);">
                  Review Application in Admin Dashboard &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Academic & Profile Details Table -->
          <tr>
            <td style="padding:0 32px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;border-radius:8px;border:1px solid #27272a;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#71717a;width:35%;">Applied Position</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:13px;color:#38bdf8;font-weight:600;">${escapeHtml(position)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#71717a;">Institution</td>
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
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#71717a;">GitHub Profile</td>
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
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#71717a;">Application ID</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#a1a1aa;font-family:monospace;">${escapeHtml(app.id)}</td>
                </tr>
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
                    <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background-color:#0284c7;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;padding:8px 16px;border-radius:6px;">View in Dashboard</a>
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

function buildAdminNotificationPlainText(app: CareerApplicationData, dashboardUrl: string): string {
  return `=== NEW CHAT2DEPLOY CAREER APPLICATION ===

Applied Position: ${app.appliedPosition || "Learner Contributor"}
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
Submitted: ${app.createdAt || new Date().toISOString()}

Admin Dashboard Review Link:
${dashboardUrl}
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
                    <div style="width:36px;height:36px;background-color:#0284c7;border-radius:50%;display:inline-block;vertical-align:middle;text-align:center;line-height:36px;margin-right:10px;">
                      <span style="color:#ffffff;font-size:14px;font-weight:bold;">C2D</span>
                    </div>
                    <span style="font-size:20px;font-weight:700;color:#e5e5e5;vertical-align:middle;">Chat2Deploy Careers</span>
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
                We have successfully received your application. Our administrative team will review your profile, skills, and statement of motivation. If shortlisted or selected, you will receive an official notification from us with next steps.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="background-color:#151515;border:1px solid #222222;border-radius:8px;padding:16px;">
                    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
                      This is an <strong style="color:#d1d5db;">unpaid learning and contribution opportunity</strong>; no stipend is provided. A certificate of completion is awarded after successful participation and fulfillment of program milestones.
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
 * Builds the official selection HTML email for accepted learners.
 */
function buildSelectionHtml(applicantName: string, appliedPosition: string, content: string): string {
  const year = new Date().getFullYear();

  // Convert plain text newlines into formatted paragraphs
  const formattedContent = content
    .split(/\n\n+/)
    .map((paragraph) => `<p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">${escapeHtml(paragraph).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Selection — Chat2Deploy Careers</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0c;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#18181b;border-radius:12px;overflow:hidden;border:1px solid #27272a;">
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#042f2e 0%,#0f172a 100%);padding:32px 32px 24px;border-bottom:2px solid #14b8a6;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background-color:#14b8a6;color:#042f2e;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;padding:4px 10px;border-radius:4px;margin-bottom:10px;">Official Selection</span>
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#f0fdfa;">Welcome to Chat2Deploy</h1>
                    <div style="margin-top:6px;font-size:13px;color:#5eead4;">Role: ${escapeHtml(appliedPosition)}</div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <div style="width:40px;height:40px;background-color:#14b8a6;border-radius:50%;display:inline-block;text-align:center;line-height:40px;">
                      <span style="color:#042f2e;font-size:16px;font-weight:bold;">★</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Congratulatory Badge -->
          <tr>
            <td style="padding:28px 32px 12px;">
              <div style="background-color:#134e4a22;border:1px solid #14b8a6;border-radius:8px;padding:14px 18px;">
                <p style="margin:0;font-size:14px;color:#99f6e4;font-weight:600;">
                  🎉 You have been officially selected for the ${escapeHtml(appliedPosition)} Program!
                </p>
              </div>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding:16px 32px 28px;">
              ${formattedContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#09090b;padding:24px 32px;border-top:1px solid #27272a;">
              <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;text-align:center;">
                Chat2Deploy Contributor Programs • Empowering the next generation of builders
              </p>
              <p style="margin:0;font-size:11px;color:#71717a;text-align:center;">
                © ${year} Chat2Deploy. All rights reserved.
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

/**
 * Sends an email notification to the administrator configured in CAREERS_ADMIN_EMAIL.
 * Includes applicant details and a link to the admin dashboard.
 */
export async function sendCareerAdminNotificationEmail(
  app: CareerApplicationData,
  dashboardOrigin?: string
): Promise<void> {
  const adminEmail = process.env.CAREERS_ADMIN_EMAIL?.trim();

  if (!adminEmail) {
    console.error("[career-email] CAREERS_ADMIN_EMAIL environment variable is missing.");
    throw new Error("Careers admin email configuration is missing on server.");
  }

  const origin = dashboardOrigin || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const dashboardUrl = `${origin.replace(/\/$/, "")}/admin/careers?id=${encodeURIComponent(app.id)}`;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n============================================================`);
    console.log(`[CAREERS NOTIFICATION EMAIL] TO: ${adminEmail}`);
    console.log(`SUBJECT: [Chat2Deploy Careers] New Application: ${app.fullName} (${app.appliedPosition || "Learner Contributor"})`);
    console.log(`DASHBOARD URL: ${dashboardUrl}`);
    console.log(`------------------------------------------------------------`);
    console.log(buildAdminNotificationPlainText(app, dashboardUrl));
    console.log(`============================================================\n`);
    return;
  }

  const fromAddress = process.env.CAREERS_FROM_EMAIL || "Chat2Deploy Careers <onboarding@resend.dev>";
  const position = app.appliedPosition || "Learner Contributor";

  const payload = {
    from: fromAddress,
    to: [adminEmail],
    reply_to: app.email,
    subject: `[Chat2Deploy Careers] New Application: ${app.fullName} (${position})`,
    html: buildAdminNotificationHtml(app, dashboardUrl),
    text: buildAdminNotificationPlainText(app, dashboardUrl),
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
    throw new Error(`Resend Admin Notification error (${response.status}): ${errorBody.slice(0, 300)}`);
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
    throw new Error(`Resend Applicant Confirmation error (${response.status}): ${errorBody.slice(0, 300)}`);
  }
}

/**
 * Sends an official selection email to the accepted learner.
 * Fails safely and never marks as sent if delivery fails.
 */
export async function sendLearnerSelectionEmail(options: SelectionEmailOptions): Promise<{ id?: string }> {
  const { to, applicantName, appliedPosition = "Learner Contributor", subject, content } = options;

  if (!to || !to.includes("@")) {
    throw new Error("Invalid recipient email address.");
  }
  if (!subject || !subject.trim()) {
    throw new Error("Selection email subject is required.");
  }
  if (!content || !content.trim()) {
    throw new Error("Selection email content is required.");
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n============================================================`);
    console.log(`[SELECTION EMAIL DEV SIMULATION]`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`------------------------------------------------------------`);
    console.log(content);
    console.log(`============================================================\n`);
    return { id: "dev-simulated-id" };
  }

  const fromAddress = process.env.CAREERS_FROM_EMAIL || "Chat2Deploy Careers <onboarding@resend.dev>";

  const payload = {
    from: fromAddress,
    to: [to],
    subject: subject.trim(),
    html: buildSelectionHtml(applicantName, appliedPosition, content),
    text: content,
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
    throw new Error(`Selection email delivery failed (${response.status}): ${errorBody.slice(0, 300)}`);
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string };
  return { id: data.id };
}
