import { describe, expect, it, vi, afterEach } from "vitest";
import { env } from "../src/config/env";
import { prisma } from "../src/prisma";
import { isDemoEmail, sendEmail } from "../src/services/email.service";
import { createRequest } from "../src/services/requests.service";
import { createTestUser } from "./helpers";

const originalResendApiKey = env.email.resendApiKey;
const originalFrom = env.email.from;
const originalFromName = env.email.fromName;

afterEach(() => {
  env.email.resendApiKey = originalResendApiKey;
  env.email.from = originalFrom;
  env.email.fromName = originalFromName;
  vi.restoreAllMocks();
});

describe("isDemoEmail", () => {
  it("מזהה כתובת של משתמשת דמו, בלי תלות ברישיות", () => {
    expect(isDemoEmail("demo1@gemach-demo.local")).toBe(true);
    expect(isDemoEmail("Demo1@Gemach-Demo.Local")).toBe(true);
  });

  it("לא מזהה כתובת אמיתית כדמו", () => {
    expect(isDemoEmail("real.person@gmail.com")).toBe(false);
  });
});

describe("sendEmail", () => {
  it("לא שולחת מייל כש-RESEND_API_KEY חסר", async () => {
    env.email.resendApiKey = "";
    env.email.from = "noreply@example.com";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await sendEmail("someone@test.local", "נושא", "<p>תוכן</p>");

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("לא שולחת מייל כש-EMAIL_FROM חסר", async () => {
    env.email.resendApiKey = "test-key";
    env.email.from = "";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await sendEmail("someone@test.local", "נושא", "<p>תוכן</p>");

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("לא שולחת מייל לכתובת של משתמשת דמו, גם כש-RESEND מוגדר", async () => {
    env.email.resendApiKey = "test-key";
    env.email.from = "noreply@example.com";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await sendEmail("demo1@gemach-demo.local", "נושא", "<p>תוכן</p>");

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("סטטוס שגיאה מ-Resend לא זורק שגיאה", async () => {
    env.email.resendApiKey = "test-key";
    env.email.from = "noreply@example.com";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("invalid api key", { status: 401 }),
    );

    await expect(sendEmail("real@test.local", "נושא", "<p>תוכן</p>")).resolves.toBeUndefined();
  });

  it("שגיאת רשת בשליחה לא זורקת שגיאה", async () => {
    env.email.resendApiKey = "test-key";
    env.email.from = "noreply@example.com";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    await expect(sendEmail("real@test.local", "נושא", "<p>תוכן</p>")).resolves.toBeUndefined();
  });

  it("שליחה תקינה שולחת POST ל-Resend עם הכותרות והגוף הנכונים", async () => {
    env.email.resendApiKey = "test-key";
    env.email.from = "noreply@example.com";
    env.email.fromName = "גמ״ח שכונתי";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await sendEmail("real@test.local", "נושא הבדיקה", "<p>תוכן</p>");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.method).toBe("POST");
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer test-key");

    const body = JSON.parse(options.body as string);
    expect(body.to).toBe("real@test.local");
    expect(body.from).toBe("גמ״ח שכונתי <noreply@example.com>");
    expect(body.subject).toBe("נושא הבדיקה");
  });
});

describe("יצירת בקשה ושליחת מייל", () => {
  it("בקשה נוצרת בהצלחה גם כששליחת המייל נכשלת", async () => {
    env.email.resendApiKey = "test-key";
    env.email.from = "noreply@example.com";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("resend is down"));

    const { user: owner } = await createTestUser({ email: "owner-email-fail@test.local" });
    const { user: borrower } = await createTestUser({ email: "borrower-email-fail@test.local" });
    const item = await prisma.item.create({
      data: {
        ownerId: owner.id,
        title: "פריט לבדיקה",
        category: "BABY",
        condition: "GOOD",
        neighborhood: "מרכז העיר",
        isPublic: true,
        isAvailable: true,
      },
    });

    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() + 1);
    const endDate = new Date();
    endDate.setUTCDate(endDate.getUTCDate() + 3);

    const dto = await createRequest(
      { itemId: item.id, startDate, endDate },
      { id: borrower.id, role: "USER" },
    );

    expect(dto.status).toBe("PENDING");
  });
});
