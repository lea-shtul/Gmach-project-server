import type { Item, LoanRequest, User } from "@prisma/client";
import { env } from "../config/env";
import { buildNewRequestEmailHtml, buildRequestApprovedEmailHtml } from "../utils/emailTemplates";

const DEMO_EMAIL_DOMAIN = "@gemach-demo.local";

export function isDemoEmail(email: string): boolean {
  return email.toLowerCase().endsWith(DEMO_EMAIL_DOMAIN);
}

// שולחת מייל בודד דרך Resend HTTP API (לא SMTP - Render חוסם SMTP בשרתים חינמיים).
// לעולם לא זורקת שגיאה: כישלון שליחה נרשם ב-console ולא אמור להפיל את הבקשה שקראה לה.
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.email.resendApiKey || !env.email.from) {
    console.log(`דילוג על שליחת מייל ל-${to}: RESEND_API_KEY ו/או EMAIL_FROM לא מוגדרים.`);
    return;
  }

  if (isDemoEmail(to)) {
    console.log(`דילוג על שליחת מייל ל-${to}: כתובת של משתמשת דמו.`);
    return;
  }

  const from = env.email.fromName ? `${env.email.fromName} <${env.email.from}>` : env.email.from;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.email.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(`שליחת מייל ל-${to} נכשלה: סטטוס ${response.status} - ${errorBody}`);
    }
  } catch (error) {
    console.error(`שליחת מייל ל-${to} נכשלה עם שגיאת רשת:`, error);
  }
}

type RequestWithRelations = LoanRequest & {
  item: Item & { owner: User };
  borrower: User;
};

export async function notifyNewLoanRequest(request: RequestWithRelations): Promise<void> {
  const receivedRequestsUrl = `${env.frontendUrl}/received`;
  const html = buildNewRequestEmailHtml({
    ownerName: request.item.owner.fullName,
    borrowerName: request.borrower.fullName,
    itemTitle: request.item.title,
    startDate: request.startDate,
    endDate: request.endDate,
    message: request.message,
    receivedRequestsUrl,
  });

  await sendEmail(request.item.owner.email, 'בקשת השאלה חדשה - גמ"ח שכונתי', html);
}

export async function notifyRequestApproved(request: RequestWithRelations): Promise<void> {
  const html = buildRequestApprovedEmailHtml({
    borrowerName: request.borrower.fullName,
    itemTitle: request.item.title,
    startDate: request.startDate,
    endDate: request.endDate,
    ownerName: request.item.owner.fullName,
    ownerPhone: request.item.owner.phone,
  });

  await sendEmail(request.borrower.email, 'הבקשה שלך אושרה - גמ"ח שכונתי', html);
}
