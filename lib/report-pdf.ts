import PDFDocument from "pdfkit";

export interface ReportProjectItem {
  id: string;
  name: string;
  status: string;
  currentVersion?: number | null;
  lastDeployedVersion?: number | null;
  deploymentUrl?: string | null;
  hostingProjectName?: string | null;
  lastDeployedAt?: string | null;
  createdAt?: string | null;
  updatedAt: string;
}

export interface ReportDeploymentItem {
  id: string;
  projectId: string;
  projectName: string;
  deploymentId: string;
  url: string;
  environment: string;
  status: "success" | "failed";
  sourceVersion?: number | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface ReportData {
  user: {
    name?: string | null;
    email?: string | null;
  };
  generatedAt: Date;
  period: string;
  summary: {
    totalProjects: number;
    publishedProjects: number;
    draftProjects: number;
    totalDeployments: number;
    failedDeployments: number;
    successfulDeployments: number;
    successRate: string;
  };
  publishedProjects: {
    id: string;
    name: string;
    url?: string | null;
    productionVersion: string;
    draftVersion?: string | null;
    deployedAt?: string | null;
    deploymentId?: string | null;
    status: string;
  }[];
  draftProjects: {
    id: string;
    name: string;
    workingVersion: string;
    createdAt?: string | null;
    updatedAt?: string | null;
    status: string;
  }[];
  failedDeployments: {
    projectName: string;
    deploymentId: string;
    attemptedAt: string;
    attemptedVersion: string;
    status: string;
    errorSummary: string;
    url?: string | null;
  }[];
}

/**
 * Sanitizes error messages to protect sensitive infrastructure tokens, keys, or stack traces.
 */
export function sanitizeErrorMessage(raw?: string | null): string {
  if (!raw || typeof raw !== "string") {
    return "Deployment failed unexpectedly.";
  }

  let sanitized = raw.trim();

  // Strip bearer tokens, JWTs, and API tokens
  sanitized = sanitized.replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED]");
  sanitized = sanitized.replace(/cfut_[a-zA-Z0-9]+/gi, "[TOKEN_REDACTED]");
  sanitized = sanitized.replace(/ey[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]{20,}/gi, "[JWT_REDACTED]");
  sanitized = sanitized.replace(/([a-zA-Z0-9_-]{20,})/g, (match) => {
    // Redact suspected long alphanumeric hashes/keys
    if (match.length > 32) return "[REDACTED_HASH]";
    return match;
  });

  // Strip local system paths
  sanitized = sanitized.replace(/\/(home|tmp|usr|var|etc)\/[^\s:]+/gi, "[SYSTEM_PATH]");

  // Truncate long stack traces to concise summary
  if (sanitized.length > 160) {
    sanitized = sanitized.slice(0, 157) + "...";
  }

  return sanitized || "Deployment failed.";
}

/**
 * Formats ISO date string into readable user friendly date and time.
 */
function formatDate(isoString?: string | null): string {
  if (!isoString) return "Unavailable";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Unavailable";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Unavailable";
  }
}

/**
 * Generates an A4 PDF report from real database data using PDFKit.
 */
export function generateAnalyticsPdfReport(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 45, left: 40, right: 40 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2; // ~515.28 pt

      // Helper to check if page break is needed
      const ensureSpace = (requiredHeight: number) => {
        if (doc.y + requiredHeight > 770) {
          doc.addPage();
          doc.y = 45;
        }
      };

      // ----------------------------------------------------
      // SECTION A: REPORT HEADER
      // ----------------------------------------------------
      const headerBoxHeight = 110;
      doc.save();
      // Dark rounded banner background (Cyber Oceanic / Midnight Slate)
      doc
        .roundedRect(margin, 40, contentWidth, headerBoxHeight, 8)
        .fill("#09131f");

      // Cyan accent border line at top of banner
      doc
        .rect(margin + 8, 40, contentWidth - 16, 3)
        .fill("#0ea5e9");

      // Brand Title
      doc
        .fontSize(18)
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .text("Chat2Deploy", margin + 18, 55, { continued: true })
        .fontSize(10)
        .fillColor("#38bdf8")
        .font("Helvetica-Bold")
        .text("   •   AI PLATFORM METRICS");

      // Subtitle
      doc
        .fontSize(13)
        .fillColor("#94a3b8")
        .font("Helvetica")
        .text("Project & Deployment Report", margin + 18, 78);

      // Metadata line
      const userDisplay = data.user.name
        ? `${data.user.name} (${data.user.email || "Authenticated"})`
        : data.user.email || "Authenticated User";

      const dateStr = formatDate(data.generatedAt.toISOString());

      doc
        .fontSize(8.5)
        .fillColor("#64748b")
        .font("Helvetica")
        .text(`Account: `, margin + 18, 102, { continued: true })
        .fillColor("#cbd5e1")
        .font("Helvetica-Bold")
        .text(userDisplay, { continued: true })
        .fillColor("#64748b")
        .font("Helvetica")
        .text(`   |   Generated: `, { continued: true })
        .fillColor("#cbd5e1")
        .font("Helvetica-Bold")
        .text(dateStr, { continued: true })
        .fillColor("#64748b")
        .font("Helvetica")
        .text(`   |   Period: `, { continued: true })
        .fillColor("#cbd5e1")
        .font("Helvetica-Bold")
        .text(data.period);

      doc.restore();
      doc.y = 40 + headerBoxHeight + 20;

      // ----------------------------------------------------
      // SECTION B: EXECUTIVE SUMMARY
      // ----------------------------------------------------
      doc
        .fontSize(12)
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .text("EXECUTIVE SUMMARY", margin, doc.y);

      doc
        .rect(margin, doc.y + 2, 40, 2)
        .fill("#0ea5e9");
      doc.y += 8;

      // Metrics Cards Row
      const cardY = doc.y;
      const cardCount = 4;
      const cardGap = 8;
      const cardWidth = (contentWidth - (cardCount - 1) * cardGap) / cardCount;
      const cardHeight = 56;

      const metrics = [
        { label: "Total Projects", value: String(data.summary.totalProjects), color: "#0f172a" },
        { label: "Published (Live)", value: String(data.summary.publishedProjects), color: "#10b981" },
        { label: "Draft Projects", value: String(data.summary.draftProjects), color: "#f59e0b" },
        { label: "Deployments Run", value: `${data.summary.totalDeployments} (${data.summary.failedDeployments} failed)`, color: data.summary.failedDeployments > 0 ? "#ef4444" : "#0ea5e9" },
      ];

      metrics.forEach((m, idx) => {
        const cx = margin + idx * (cardWidth + cardGap);
        doc.save();
        doc
          .roundedRect(cx, cardY, cardWidth, cardHeight, 6)
          .fillAndStroke("#f8fafc", "#e2e8f0");

        doc
          .fontSize(7.5)
          .fillColor("#64748b")
          .font("Helvetica-Bold")
          .text(m.label.toUpperCase(), cx + 8, cardY + 10, { width: cardWidth - 16 });

        doc
          .fontSize(13)
          .fillColor(m.color)
          .font("Helvetica-Bold")
          .text(m.value, cx + 8, cardY + 28, { width: cardWidth - 16 });
        doc.restore();
      });

      doc.y = cardY + cardHeight + 20;

      // ----------------------------------------------------
      // SECTION C: DRAFT PROJECTS
      // ----------------------------------------------------
      ensureSpace(80);
      doc
        .fontSize(11)
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .text(`DRAFT PROJECTS (${data.draftProjects.length})`, margin, doc.y);

      doc
        .rect(margin, doc.y + 2, 35, 2)
        .fill("#f59e0b");
      doc.y += 8;

      if (data.draftProjects.length === 0) {
        doc.save();
        doc
          .roundedRect(margin, doc.y, contentWidth, 32, 4)
          .fillAndStroke("#f8fafc", "#e2e8f0");
        doc
          .fontSize(9)
          .fillColor("#64748b")
          .font("Helvetica-Oblique")
          .text("No draft projects found.", margin + 12, doc.y + 11);
        doc.restore();
        doc.y += 42;
      } else {
        // Table Header
        const colWidths = [150, 75, 75, 115, 100]; // sum = 515
        const drawDraftTableHeader = () => {
          doc.save();
          doc
            .rect(margin, doc.y, contentWidth, 20)
            .fill("#f1f5f9");

          doc.fontSize(8).fillColor("#475569").font("Helvetica-Bold");
          let xOffset = margin + 6;
          doc.text("Project Name", xOffset, doc.y + 5, { width: colWidths[0] });
          xOffset += colWidths[0];
          doc.text("Working Ver", xOffset, doc.y + 5, { width: colWidths[1] });
          xOffset += colWidths[1];
          doc.text("Status", xOffset, doc.y + 5, { width: colWidths[2] });
          xOffset += colWidths[2];
          doc.text("Last Updated", xOffset, doc.y + 5, { width: colWidths[3] });
          xOffset += colWidths[3];
          doc.text("Created", xOffset, doc.y + 5, { width: colWidths[4] });
          doc.restore();
          doc.y += 20;
        };

        drawDraftTableHeader();

        data.draftProjects.forEach((dp, index) => {
          ensureSpace(26);
          const rowY = doc.y;
          const isEven = index % 2 === 0;

          doc.save();
          if (isEven) {
            doc.rect(margin, rowY, contentWidth, 24).fill("#fafafa");
          }
          doc.rect(margin, rowY + 23.5, contentWidth, 0.5).fill("#e2e8f0");

          doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#0f172a");
          let xOff = margin + 6;
          doc.text(dp.name, xOff, rowY + 6, { width: colWidths[0] - 8, lineBreak: false });

          xOff += colWidths[0];
          doc.font("Helvetica-Bold").fillColor("#0284c7");
          doc.text(dp.workingVersion, xOff, rowY + 6, { width: colWidths[1] - 8 });

          xOff += colWidths[1];
          doc.font("Helvetica").fillColor("#b45309");
          doc.text("Draft", xOff, rowY + 6, { width: colWidths[2] - 8 });

          xOff += colWidths[2];
          doc.font("Helvetica").fillColor("#64748b");
          doc.text(formatDate(dp.updatedAt), xOff, rowY + 6, { width: colWidths[3] - 8 });

          xOff += colWidths[3];
          doc.text(formatDate(dp.createdAt), xOff, rowY + 6, { width: colWidths[4] - 8 });

          doc.restore();
          doc.y = rowY + 24;
        });

        doc.y += 14;
      }

      // ----------------------------------------------------
      // SECTION D: PUBLISHED PROJECTS
      // ----------------------------------------------------
      ensureSpace(80);
      doc
        .fontSize(11)
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .text(`PUBLISHED PROJECTS (${data.publishedProjects.length})`, margin, doc.y);

      doc
        .rect(margin, doc.y + 2, 35, 2)
        .fill("#10b981");
      doc.y += 8;

      if (data.publishedProjects.length === 0) {
        doc.save();
        doc
          .roundedRect(margin, doc.y, contentWidth, 32, 4)
          .fillAndStroke("#f8fafc", "#e2e8f0");
        doc
          .fontSize(9)
          .fillColor("#64748b")
          .font("Helvetica-Oblique")
          .text("No published projects found.", margin + 12, doc.y + 11);
        doc.restore();
        doc.y += 42;
      } else {
        const pubColWidths = [125, 170, 75, 80, 65]; // sum = 515
        const drawPubTableHeader = () => {
          doc.save();
          doc
            .rect(margin, doc.y, contentWidth, 20)
            .fill("#f1f5f9");

          doc.fontSize(8).fillColor("#475569").font("Helvetica-Bold");
          let xOff = margin + 6;
          doc.text("Project Name", xOff, doc.y + 5, { width: pubColWidths[0] });
          xOff += pubColWidths[0];
          doc.text("Live Production URL", xOff, doc.y + 5, { width: pubColWidths[1] });
          xOff += pubColWidths[1];
          doc.text("Prod Version", xOff, doc.y + 5, { width: pubColWidths[2] });
          xOff += pubColWidths[2];
          doc.text("Last Deployed", xOff, doc.y + 5, { width: pubColWidths[3] });
          xOff += pubColWidths[3];
          doc.text("Status", xOff, doc.y + 5, { width: pubColWidths[4] });
          doc.restore();
          doc.y += 20;
        };

        drawPubTableHeader();

        data.publishedProjects.forEach((pp, idx) => {
          ensureSpace(28);
          const rowY = doc.y;
          const isEven = idx % 2 === 0;

          doc.save();
          if (isEven) {
            doc.rect(margin, rowY, contentWidth, 26).fill("#fafafa");
          }
          doc.rect(margin, rowY + 25.5, contentWidth, 0.5).fill("#e2e8f0");

          let xOff = margin + 6;
          doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#0f172a");
          doc.text(pp.name, xOff, rowY + 6, { width: pubColWidths[0] - 8, lineBreak: false });

          xOff += pubColWidths[0];
          doc.fontSize(8).font("Helvetica");
          if (pp.url) {
            doc.fillColor("#0284c7");
            const cleanUrl = pp.url.replace(/^https?:\/\//, "");
            doc.text(cleanUrl, xOff, rowY + 6, {
              width: pubColWidths[1] - 8,
              link: pp.url,
              underline: true,
              lineBreak: false,
            });
          } else {
            doc.fillColor("#94a3b8").text("Undeployed", xOff, rowY + 6, { width: pubColWidths[1] - 8 });
          }

          xOff += pubColWidths[1];
          doc.font("Helvetica-Bold").fillColor("#059669");
          let verText = pp.productionVersion;
          if (pp.draftVersion && pp.draftVersion !== pp.productionVersion) {
            verText += ` (Dr: ${pp.draftVersion})`;
          }
          doc.text(verText, xOff, rowY + 6, { width: pubColWidths[2] - 8 });

          xOff += pubColWidths[2];
          doc.font("Helvetica").fillColor("#64748b");
          doc.text(formatDate(pp.deployedAt), xOff, rowY + 6, { width: pubColWidths[3] - 8 });

          xOff += pubColWidths[3];
          doc.font("Helvetica-Bold").fillColor("#10b981");
          doc.text("Published", xOff, rowY + 6, { width: pubColWidths[4] - 8 });

          doc.restore();
          doc.y = rowY + 26;
        });

        doc.y += 14;
      }

      // ----------------------------------------------------
      // SECTION E: FAILED DEPLOYMENTS
      // ----------------------------------------------------
      ensureSpace(80);
      doc
        .fontSize(11)
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .text(`FAILED DEPLOYMENTS (${data.failedDeployments.length})`, margin, doc.y);

      doc
        .rect(margin, doc.y + 2, 35, 2)
        .fill("#ef4444");
      doc.y += 8;

      if (data.failedDeployments.length === 0) {
        doc.save();
        doc
          .roundedRect(margin, doc.y, contentWidth, 32, 4)
          .fillAndStroke("#f8fafc", "#e2e8f0");
        doc
          .fontSize(9)
          .fillColor("#64748b")
          .font("Helvetica-Oblique")
          .text("No failed deployments found.", margin + 12, doc.y + 11);
        doc.restore();
        doc.y += 42;
      } else {
        const failColWidths = [115, 65, 95, 240]; // sum = 515
        const drawFailTableHeader = () => {
          doc.save();
          doc
            .rect(margin, doc.y, contentWidth, 20)
            .fill("#f1f5f9");

          doc.fontSize(8).fillColor("#475569").font("Helvetica-Bold");
          let xOff = margin + 6;
          doc.text("Project", xOff, doc.y + 5, { width: failColWidths[0] });
          xOff += failColWidths[0];
          doc.text("Attempt Ver", xOff, doc.y + 5, { width: failColWidths[1] });
          xOff += failColWidths[1];
          doc.text("Attempt Date", xOff, doc.y + 5, { width: failColWidths[2] });
          xOff += failColWidths[2];
          doc.text("Failure Reason (Sanitized)", xOff, doc.y + 5, { width: failColWidths[3] });
          doc.restore();
          doc.y += 20;
        };

        drawFailTableHeader();

        data.failedDeployments.forEach((fd, idx) => {
          ensureSpace(30);
          const rowY = doc.y;
          const isEven = idx % 2 === 0;

          doc.save();
          if (isEven) {
            doc.rect(margin, rowY, contentWidth, 26).fill("#fafafa");
          }
          doc.rect(margin, rowY + 25.5, contentWidth, 0.5).fill("#e2e8f0");

          let xOff = margin + 6;
          doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#0f172a");
          doc.text(fd.projectName, xOff, rowY + 6, { width: failColWidths[0] - 8, lineBreak: false });

          xOff += failColWidths[0];
          doc.fontSize(8).font("Helvetica").fillColor("#64748b");
          doc.text(fd.attemptedVersion, xOff, rowY + 6, { width: failColWidths[1] - 8 });

          xOff += failColWidths[1];
          doc.text(formatDate(fd.attemptedAt), xOff, rowY + 6, { width: failColWidths[2] - 8 });

          xOff += failColWidths[2];
          doc.fontSize(7.5).font("Helvetica").fillColor("#b91c1c");
          doc.text(fd.errorSummary, xOff, rowY + 6, { width: failColWidths[3] - 8, lineBreak: false });

          doc.restore();
          doc.y = rowY + 26;
        });

        doc.y += 14;
      }

      // ----------------------------------------------------
      // SECTION F: RUNNING HEADERS & FOOTERS (Page X of Y)
      // ----------------------------------------------------
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // Header (pages after page 1)
        if (i > 0) {
          doc.save();
          doc
            .fontSize(7.5)
            .fillColor("#94a3b8")
            .font("Helvetica")
            .text("Chat2Deploy • Project & Deployment Report", margin, 22, { width: contentWidth / 2 });

          doc
            .fontSize(7.5)
            .fillColor("#94a3b8")
            .font("Helvetica")
            .text(dateStr, margin + contentWidth / 2, 22, {
              width: contentWidth / 2,
              align: "right",
            });

          doc
            .rect(margin, 32, contentWidth, 0.5)
            .fill("#e2e8f0");
          doc.restore();
        }

        // Footer on all pages
        doc.save();
        const footerY = 805;
        doc
          .rect(margin, footerY - 5, contentWidth, 0.5)
          .fill("#e2e8f0");

        doc
          .fontSize(7.5)
          .fillColor("#64748b")
          .font("Helvetica")
          .text(
            "This report reflects genuine database records available at generation time.",
            margin,
            footerY,
            { width: contentWidth - 80 }
          );

        doc
          .fontSize(7.5)
          .fillColor("#0f172a")
          .font("Helvetica-Bold")
          .text(`Page ${i + 1} of ${totalPages}`, margin + contentWidth - 70, footerY, {
            width: 70,
            align: "right",
          });
        doc.restore();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
