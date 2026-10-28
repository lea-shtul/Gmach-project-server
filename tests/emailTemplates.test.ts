import { describe, expect, it } from "vitest";
import {
  buildNewRequestEmailHtml,
  buildRequestApprovedEmailHtml,
  buildWelcomeEmailHtml,
  escapeHtml,
} from "../src/utils/emailTemplates";

describe("emailTemplates - escapeHtml", () => {
  it("מחליפה את כל התווים המסוכנים", () => {
    expect(escapeHtml(`<script>&"'</script>`)).toBe(
      "&lt;script&gt;&amp;&quot;&#39;&lt;/script&gt;",
    );
  });

  it("הודעה עם <a href> בתוך בקשה חדשה מוצגת כטקסט רגיל, לא כקישור", () => {
    const maliciousMessage = '<a href="https://evil.example.com">לחצי כאן</a>';

    const html = buildNewRequestEmailHtml({
      ownerName: "בעלת הפריט",
      borrowerName: "מבקשת",
      itemTitle: "פריט",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-01-05"),
      message: maliciousMessage,
      receivedRequestsUrl: "https://example.com/received",
    });

    expect(html).not.toContain('<a href="https://evil.example.com">');
    expect(html).toContain(
      "&lt;a href=&quot;https://evil.example.com&quot;&gt;לחצי כאן&lt;/a&gt;",
    );
  });

  it("שם מבקשת עם תווים מסוכנים נשאר טקסט במייל האישור", () => {
    const html = buildRequestApprovedEmailHtml({
      borrowerName: "<img src=x onerror=alert(1)>",
      itemTitle: "פריט",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-01-05"),
      ownerName: "בעלים",
      ownerPhone: "050-0000000",
      frontendUrl: "https://example.com",
    });

    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("ירידות שורה בהודעה מוצגות כ-<br> אמיתי, לא כטקסט בריחה מה-escape", () => {
    const html = buildNewRequestEmailHtml({
      ownerName: "בעלת הפריט",
      borrowerName: "מבקשת",
      itemTitle: "פריט",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-01-05"),
      message: "שורה ראשונה\nשורה שנייה עם <תג>",
      receivedRequestsUrl: "https://example.com/received",
    });

    expect(html).toContain("שורה ראשונה<br>שורה שנייה עם &lt;תג&gt;");
  });

  it("טלפון הבעלים במייל האישור מוצג כקישור tel: לחיוג", () => {
    const html = buildRequestApprovedEmailHtml({
      borrowerName: "מבקשת",
      itemTitle: "פריט",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-01-05"),
      ownerName: "בעלים",
      ownerPhone: "050-123-4567",
      frontendUrl: "https://example.com",
    });

    expect(html).toContain('href="tel:0501234567"');
    expect(html).toContain("050-123-4567");
  });

  it("התאריכים מוצגים בעברית מלאה עם יום בשבוע וטווח מ-...עד...", () => {
    const html = buildNewRequestEmailHtml({
      ownerName: "בעלת הפריט",
      borrowerName: "מבקשת",
      itemTitle: "פריט",
      startDate: new Date("2026-11-02T00:00:00.000Z"),
      endDate: new Date("2026-11-05T00:00:00.000Z"),
      message: null,
      receivedRequestsUrl: "https://example.com/received",
    });

    expect(html).toContain("מ-יום שני, 2 בנובמבר 2026 עד יום חמישי, 5 בנובמבר 2026");
  });

  it("הפונט הראשי הוא Rubik עם נפילה חזרה ל-Segoe UI/Tahoma, וקישור Google Fonts נמצא ב-head", () => {
    const html = buildNewRequestEmailHtml({
      ownerName: "בעלת הפריט",
      borrowerName: "מבקשת",
      itemTitle: "פריט",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-01-05"),
      message: null,
      receivedRequestsUrl: "https://example.com/received",
    });

    expect(html).toContain("'Rubik','Segoe UI',Tahoma,Arial,sans-serif");
    expect(html).toContain("fonts.googleapis.com/css2?family=Rubik");
  });
});

describe("emailTemplates - buildWelcomeEmailHtml", () => {
  it("כוללת את שם המשתמשת בכותרת ובכפתור לאתר", () => {
    const html = buildWelcomeEmailHtml({
      fullName: "שרה אברהם",
      frontendUrl: "https://example.com",
    });

    expect(html).toContain('ברוכה הבאה לגמ"ח שכונתי, שרה אברהם!');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("להיכנס לאתר");
  });

  it("שם עם תווים מסוכנים נשאר טקסט, לא תג HTML", () => {
    const html = buildWelcomeEmailHtml({
      fullName: '<img src=x onerror=alert(1)>',
      frontendUrl: "https://example.com",
    });

    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
});
