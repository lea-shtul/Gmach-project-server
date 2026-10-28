const PRIMARY_COLOR = "#4338ca";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function renderEmailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background-color:${PRIMARY_COLOR};border-radius:8px 8px 0 0;padding:20px;text-align:center;">
      <span style="color:#ffffff;font-size:18px;font-weight:bold;">גמ"ח שכונתי</span>
    </div>
    <div style="background-color:#ffffff;border-radius:0 0 8px 8px;padding:24px;color:#1f2937;font-size:15px;line-height:1.6;">
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
      הודעה אוטומטית מהאתר "גמ"ח שכונתי" - אין להשיב למייל זה.
    </p>
  </div>
</body>
</html>`;
}

function renderButton(url: string, label: string): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${escapeHtml(url)}" style="background-color:${PRIMARY_COLOR};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;display:inline-block;">${escapeHtml(label)}</a>
  </div>`;
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
  const messageHtml = data.message
    ? `<p style="margin:16px 0 0;"><strong>הודעה מהמבקשת:</strong><br>${escapeHtml(data.message)}</p>`
    : "";

  const body = `
    <p>שלום ${escapeHtml(data.ownerName)},</p>
    <p><strong>${escapeHtml(data.borrowerName)}</strong> הגישה בקשה להשאלת הפריט שלך <strong>"${escapeHtml(data.itemTitle)}"</strong>.</p>
    <p>
      תאריך התחלה: <strong>${formatDate(data.startDate)}</strong><br>
      תאריך סיום: <strong>${formatDate(data.endDate)}</strong>
    </p>
    ${messageHtml}
    ${renderButton(data.receivedRequestsUrl, "לצפייה בבקשה")}
  `;

  return renderEmailShell("בקשת השאלה חדשה", body);
}

export interface RequestApprovedEmailData {
  borrowerName: string;
  itemTitle: string;
  startDate: Date;
  endDate: Date;
  ownerName: string;
  ownerPhone: string;
}

export function buildRequestApprovedEmailHtml(data: RequestApprovedEmailData): string {
  const body = `
    <p>שלום ${escapeHtml(data.borrowerName)},</p>
    <p>הבקשה שלך להשאלת הפריט <strong>"${escapeHtml(data.itemTitle)}"</strong> <strong>אושרה</strong>!</p>
    <p>
      תאריך התחלה: <strong>${formatDate(data.startDate)}</strong><br>
      תאריך סיום: <strong>${formatDate(data.endDate)}</strong>
    </p>
    <p><strong>פרטי הבעלים ליצירת קשר:</strong><br>
      ${escapeHtml(data.ownerName)}<br>
      ${escapeHtml(data.ownerPhone)}
    </p>
  `;

  return renderEmailShell("הבקשה שלך אושרה", body);
}
