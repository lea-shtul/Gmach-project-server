import { describe, expect, it } from "vitest";
import {
  buildNewRequestEmailHtml,
  buildRequestApprovedEmailHtml,
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
});
