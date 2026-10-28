const PRIMARY_COLOR = "#4338ca";
const PAGE_BG = "#f5f6fb";
const CARD_BORDER = "#e5e7eb";
const LABEL_COLOR = "#6b7280";
const VALUE_COLOR = "#1f2937";
const FONT_FAMILY = "'Rubik','Segoe UI',Tahoma,Arial,sans-serif";
const RTL_ATTR = 'dir="rtl"';
const RTL_STYLE = "direction:rtl;text-align:right;";

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

function formatHebrewDate(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateRange(startDate: Date, endDate: Date): string {
  return `מ-${formatHebrewDate(startDate)} עד ${formatHebrewDate(endDate)}`;
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body dir="rtl" style="margin:0;padding:0;background-color:${PAGE_BG};direction:rtl;text-align:right;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;background-color:${PAGE_BG};">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;">
<tr>
<td ${RTL_ATTR} style="${RTL_STYLE}background-color:${PRIMARY_COLOR};border-radius:14px 14px 0 0;padding:26px 20px;font-family:${FONT_FAMILY};">
<span ${RTL_ATTR} style="${RTL_STYLE}color:#ffffff;font-size:20px;font-weight:bold;font-family:${FONT_FAMILY};">🏠 גמ"ח שכונתי</span>
</td>
</tr>
<tr>
<td ${RTL_ATTR} style="${RTL_STYLE}padding:32px 26px 16px;font-family:${FONT_FAMILY};">
<p ${RTL_ATTR} style="${RTL_STYLE}font-size:24px;font-weight:bold;color:${VALUE_COLOR};margin:0 0 20px;line-height:1.7;font-family:${FONT_FAMILY};">${headline}</p>
${bodyHtml}
</td>
</tr>
<tr>
<td ${RTL_ATTR} style="${RTL_STYLE}padding:22px 24px;background-color:${PAGE_BG};border-radius:0 0 14px 14px;font-family:${FONT_FAMILY};">
<p ${RTL_ATTR} style="${RTL_STYLE}margin:0;color:${PRIMARY_COLOR};font-size:14px;font-weight:bold;font-family:${FONT_FAMILY};">נשלח באהבה מגמ"ח שכונתי 💜</p>
<p ${RTL_ATTR} style="${RTL_STYLE}margin:6px 0 0;color:#9ca3af;font-size:12px;font-family:${FONT_FAMILY};">זוהי הודעה אוטומטית - אין להשיב למייל זה.</p>
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
  return `<p ${RTL_ATTR} style="${RTL_STYLE}margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;font-family:${FONT_FAMILY};${extraStyle}">${html}</p>`;
}

interface DetailRow {
  icon: string;
  label: string;
  valueHtml: string;
  highlightValue?: boolean;
}

function renderDetailsCard(rows: DetailRow[]): string {
  const rowsHtml = rows
    .map((row, index) => {
      const borderStyle = index === rows.length - 1 ? "" : `border-bottom:1px solid ${CARD_BORDER};`;
      const valueColor = row.highlightValue ? PRIMARY_COLOR : VALUE_COLOR;
      return `<tr>
<td ${RTL_ATTR} style="${RTL_STYLE}padding:14px 0;${borderStyle}font-family:${FONT_FAMILY};">
<div ${RTL_ATTR} style="${RTL_STYLE}color:${LABEL_COLOR};font-size:13px;line-height:1.7;margin-bottom:4px;font-family:${FONT_FAMILY};">${row.icon} ${escapeHtml(row.label)}</div>
<div ${RTL_ATTR} style="${RTL_STYLE}color:${valueColor};font-size:16px;font-weight:bold;line-height:1.7;font-family:${FONT_FAMILY};">${row.valueHtml}</div>
</td>
</tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;background-color:#ffffff;border:1px solid ${CARD_BORDER};border-radius:12px;margin:4px 0 20px;">
<tr>
<td style="padding:24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;">
${rowsHtml}
</table>
</td>
</tr>
</table>`;
}

function renderBulletList(itemsHtml: string[]): string {
  const rowsHtml = itemsHtml
    .map(
      (itemHtml) => `<tr>
<td ${RTL_ATTR} style="${RTL_STYLE}padding:6px 0;font-family:${FONT_FAMILY};">
<table role="presentation" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;">
<tr>
<td ${RTL_ATTR} valign="top" style="${RTL_STYLE}padding-left:10px;color:${PRIMARY_COLOR};font-size:16px;line-height:1.7;font-family:${FONT_FAMILY};">•</td>
<td ${RTL_ATTR} style="${RTL_STYLE}color:#374151;font-size:16px;line-height:1.7;font-family:${FONT_FAMILY};">${itemHtml}</td>
</tr>
</table>
</td>
</tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;margin:0 0 20px;">
${rowsHtml}
</table>`;
}

function renderButton(url: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;margin:24px 0 6px;">
<tr>
<td align="right" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" dir="rtl" style="direction:rtl;">
<tr>
<td align="center" style="background-color:${PRIMARY_COLOR};border-radius:8px;">
<a href="${escapeHtml(url)}" ${RTL_ATTR} style="${RTL_STYLE}display:inline-block;padding:14px 38px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;font-family:${FONT_FAMILY};">${escapeHtml(label)}</a>
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
  const rows: DetailRow[] = [
    { icon: "📦", label: "פריט", valueHtml: escapeHtml(data.itemTitle), highlightValue: true },
    {
      icon: "📅",
      label: "תאריכים",
      valueHtml: escapeHtml(formatDateRange(data.startDate, data.endDate)),
    },
  ];
  if (data.message) {
    rows.push({ icon: "💬", label: "הודעה", valueHtml: escapeHtmlWithLineBreaks(data.message) });
  }

  const body = [
    renderParagraph(`שלום ${escapeHtml(data.ownerName)},`),
    renderParagraph(
      `<strong>${escapeHtml(data.borrowerName)}</strong> הגישה בקשה להשאלת הפריט שלך:`,
    ),
    renderDetailsCard(rows),
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
  const rows: DetailRow[] = [
    { icon: "📦", label: "פריט", valueHtml: escapeHtml(data.itemTitle), highlightValue: true },
    {
      icon: "📅",
      label: "תאריכים",
      valueHtml: escapeHtml(formatDateRange(data.startDate, data.endDate)),
    },
    { icon: "👤", label: "בעלים", valueHtml: escapeHtml(data.ownerName) },
    {
      icon: "📞",
      label: "טלפון ליצירת קשר",
      valueHtml: `<a href="${toTelHref(data.ownerPhone)}" ${RTL_ATTR} style="${RTL_STYLE}color:${PRIMARY_COLOR};text-decoration:none;font-weight:bold;font-family:${FONT_FAMILY};">${escapeHtml(data.ownerPhone)}</a>`,
    },
  ];

  const body = [
    renderParagraph(`שלום ${escapeHtml(data.borrowerName)},`),
    renderParagraph(
      `הבקשה שלך להשאלת הפריט <strong>${escapeHtml(data.itemTitle)}</strong> אושרה! 🎉`,
    ),
    renderDetailsCard(rows),
    renderButton(data.frontendUrl, "🔗 להיכנס לאתר"),
  ].join("");

  return renderEmailShell("הבקשה שלך אושרה", "🎉 הבקשה שלך אושרה!", body);
}

export interface WelcomeEmailData {
  fullName: string;
  frontendUrl: string;
}

export function buildWelcomeEmailHtml(data: WelcomeEmailData): string {
  const safeName = escapeHtml(data.fullName);

  const body = [
    renderParagraph(
      `איזה כיף שהצטרפת! גמ"ח שכונתי הוא קהילה של שכנות שמשאילות ותומכות אחת בשנייה, ואנחנו שמחות שאת כאן.`,
    ),
    renderBulletList([
      "לפרסם פריטים שיש לך ושאפשר להשאיל לשכנות",
      "למצוא מה שאת צריכה אצל שכנות בקרבתך",
      "לעקוב אחרי הבקשות שלך ולראות את ההשפעה שיצרת בקהילה",
    ]),
    renderButton(data.frontendUrl, "🔗 להיכנס לאתר"),
  ].join("");

  return renderEmailShell(
    'ברוכה הבאה לגמ"ח שכונתי',
    `🎉 ברוכה הבאה לגמ"ח שכונתי, ${safeName}!`,
    body,
  );
}
