import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildNewRequestEmailHtml,
  buildRequestApprovedEmailHtml,
} from "../src/utils/emailTemplates";

const outDir = join(__dirname, "..", "email-previews");
mkdirSync(outDir, { recursive: true });

const newRequestHtml = buildNewRequestEmailHtml({
  ownerName: "רחל לוי",
  borrowerName: "שרה אברהם",
  itemTitle: "עגלת תינוק מתקפלת",
  startDate: new Date("2026-03-10"),
  endDate: new Date("2026-03-14"),
  message: "אשמח להשאיל לכמה ימים, תודה רבה!\nאחזיר במצב מצוין בדיוק כמו שקיבלתי.",
  receivedRequestsUrl: "http://localhost:5175/received",
});

const approvedHtml = buildRequestApprovedEmailHtml({
  borrowerName: "שרה אברהם",
  itemTitle: "עגלת תינוק מתקפלת",
  startDate: new Date("2026-03-10"),
  endDate: new Date("2026-03-14"),
  ownerName: "רחל לוי",
  ownerPhone: "050-123-4567",
  frontendUrl: "http://localhost:5175",
});

writeFileSync(join(outDir, "new-request.html"), newRequestHtml, "utf-8");
writeFileSync(join(outDir, "request-approved.html"), approvedHtml, "utf-8");

console.log(`נוצרו קבצי תצוגה מקדימה בתיקייה: ${outDir}`);
console.log("- new-request.html");
console.log("- request-approved.html");
