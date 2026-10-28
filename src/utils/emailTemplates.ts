const PRIMARY_COLOR = "#4338ca";
const CARD_BG = "#f5f6fb";
const FONT_FAMILY = "Arial, Helvetica, sans-serif";
const RTL = 'dir="rtl" style="direction:rtl;text-align:right;"';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ממירה ירידות שורה ל-<br> - תמיד אחרי escapeHtml, כדי שה-<br> שמוזרקות כאן לא יהיו טקסט
// של המשתמשת (שהיה נכנס ל-escape ומאבד את התפקיד שלו כתגית) אלא תגית אמיתית שאנחנו מוסיפים.
function escapeHtmlWithLineBreaks(value: string): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, "<br>");
}

function formatDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function toTelHref(phone: string): string {
  return `tel:${escapeHtml(phone.replace(/[^0-9+]/g, ""))}`;
}

function renderEmailShell(title: string, headline: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
</head>
<body dir="rtl" style="margin:0;padding:0;background-color:#eef0fa;direction:rtl;text-align:right;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;background-color:#eef0fa;">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;">
<tr>
<td ${RTL} style="background-color:${PRIMARY_COLOR};border-radius:14px 14px 0 0;padding:26px 20px;font-family:${FONT_FAMILY};">
<span ${RTL} style="color:#ffffff;font-size:20px;font-weight:bold;font-family:${FONT_FAMILY};">🏠 גמ"ח שכונתי</span>
</td>
</tr>
<tr>
<td ${RTL} style="padding:30px 26px 14px;font-family:${FONT_FAMILY};">
<p ${RTL} style="font-size:22px;font-weight:bold;color:#1f2937;margin:0 0 18px;font-family:${FONT_FAMILY};">${headline}</p>
${bodyHtml}
</td>
</tr>
<tr>
<td ${RTL} style="padding:22px 24px;background-color:${CARD_BG};border-radius:0 0 14px 14px;font-family:${FONT_FAMILY};">
<p ${RTL} style="margin:0;color:${PRIMARY_COLOR};font-size:14px;font-weight:bold;font-family:${FONT_FAMILY};">נשלח באהבה מגמ"ח שכונתי 💜</p>
<p ${RTL} style="margin:6px 0 0;color:#9ca3af;font-size:12px;font-family:${FONT_FAMILY};">זוהי הודעה אוטומטית - אין להשיב למייל זה.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function renderParagraph(html: string, extraStyle = ""): string {
  return `<p ${RTL} style="margin:0 0 14px;color:#374151;font-size:15px;line-height:1.6;font-family:${FONT_FAMILY};${extraStyle}">${html}</p>`;
}

interface DetailRow {
  label: string;
  valueHtml: string;
}

function renderDetailsCard(rows: DetailRow[]): string {
  const rowsHtml = rows
    .map((row, index) => {
      const borderStyle = index === rows.length - 1 ? "" : "border-bottom:1px solid #e3e5f1;";
      return `<tr>
<td ${RTL} style="padding:10px 2px;${borderStyle}font-family:${FONT_FAMILY};">
<div ${RTL} style="color:#6b7280;font-size:12px;margin-bottom:3px;font-family:${FONT_FAMILY};">${escapeHtml(row.label)}</div>
<div ${RTL} style="color:#111827;font-size:15px;font-weight:bold;font-family:${FONT_FAMILY};">${row.valueHtml}</div>
</td>
</tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;background-color:${CARD_BG};border-radius:10px;margin:4px 0 18px;">
<tr>
<td style="padding:6px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;">
${rowsHtml}
</table>
</td>
</tr>
</table>`;
}

function renderQuotedMessage(message: string): string {
  const safeMessage = escapeHtmlWithLineBreaks(message);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;background-color:#f9fafb;border-right:4px solid ${PRIMARY_COLOR};border-radius:6px;margin:0 0 18px;">
<tr>
<td ${RTL} style="padding:14px 16px;font-family:${FONT_FAMILY};">
<div ${RTL} style="color:#6b7280;font-size:12px;margin-bottom:5px;font-family:${FONT_FAMILY};">💬 הודעה מהמבקשת</div>
<div ${RTL} style="color:#374151;font-size:14px;line-height:1.6;font-family:${FONT_FAMILY};">${safeMessage}</div>
</td>
</tr>
</table>`;
}

function renderButton(url: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;margin:24px 0 6px;">
<tr>
<td align="right" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;">
<tr>
<td align="center" style="background-color:${PRIMARY_COLOR};border-radius:8px;">
<a href="${escapeHtml(url)}" ${RTL} style="display:inline-block;padding:14px 38px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;font-family:${FONT_FAMILY};">${escapeHtml(label)}</a>
</td>
</tr>
</table>
</td>
</tr>
</table>`;
}

export interface NewRequestEmailData {
  ownerName: string;
  borrowerName: string;
  itemTitle: string;
  startDate: Date;
  endDate: Date;
  message: string | null;
  receivedRequestsUrl: string;
}

export function buildNewRequestEmailHtml(data: NewRequestEmailData): string {
  const body = [
    renderParagraph(`שלום ${escapeHtml(data.ownerName)},`),
    renderParagraph(
      `<strong>${escapeHtml(data.borrowerName)}</strong> הגישה בקשה להשאלת הפריט שלך:`,
    ),
    renderDetailsCard([
      { label: "פריט", valueHtml: escapeHtml(data.itemTitle) },
      { label: "תאריך התחלה", valueHtml: formatDate(data.startDate) },
      { label: "תאריך סיום", valueHtml: formatDate(data.endDate) },
    ]),
    data.message ? renderQuotedMessage(data.message) : "",
    renderButton(data.receivedRequestsUrl, "📬 לצפייה בבקשה"),
  ].join("");

  return renderEmailShell("בקשת השאלה חדשה", "📬 יש לך בקשת השאלה חדשה!", body);
}

export interface RequestApprovedEmailData {
  borrowerName: string;
  itemTitle: string;
  startDate: Date;
  endDate: Date;
  ownerName: string;
  ownerPhone: string;
  frontendUrl: string;
}

export function buildRequestApprovedEmailHtml(data: RequestApprovedEmailData): string {
  const body = [
    renderParagraph(`שלום ${escapeHtml(data.borrowerName)},`),
    renderParagraph(
      `הבקשה שלך להשאלת הפריט <strong>${escapeHtml(data.itemTitle)}</strong> אושרה! 🎉`,
    ),
    renderDetailsCard([
      { label: "פריט", valueHtml: escapeHtml(data.itemTitle) },
      { label: "תאריך התחלה", valueHtml: formatDate(data.startDate) },
      { label: "תאריך סיום", valueHtml: formatDate(data.endDate) },
      { label: "בעלים", valueHtml: escapeHtml(data.ownerName) },
      {
        label: "טלפון ליצירת קשר",
        valueHtml: `<a href="${toTelHref(data.ownerPhone)}" ${RTL} style="color:${PRIMARY_COLOR};text-decoration:none;font-weight:bold;font-family:${FONT_FAMILY};">${escapeHtml(data.ownerPhone)}</a>`,
      },
    ]),
    renderButton(data.frontendUrl, "🔗 להיכנס לאתר"),
  ].join("");

  return renderEmailShell("הבקשה שלך אושרה", "🎉 הבקשה שלך אושרה!", body);
}
