import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/prisma";
import { createTestUser, authHeader } from "./helpers";

const app = createApp();

async function createItem(ownerId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return prisma.item.create({
    data: {
      ownerId,
      title: "עגלת תינוק",
      description: "מצב טוב",
      category: "BABY",
      condition: "GOOD",
      neighborhood: "מרכז העיר",
      isPublic: true,
      isAvailable: true,
      ...overrides,
    },
  });
}

describe("Items", () => {
  it("יצירת פריט תקינה מחזירה 201 עם owner מוטמע", async () => {
    const { token, user } = await createTestUser();
    const res = await request(app)
      .post("/api/items")
      .set(authHeader(token))
      .send({
        title: "עגלת תינוק",
        description: "מצב מצוין",
        category: "BABY",
        condition: "NEW",
        neighborhood: "פרדס כץ",
      });

    expect(res.status).toBe(201);
    expect(res.body.ownerId).toBe(user.id);
    expect(res.body.owner.id).toBe(user.id);
    expect(res.body.isPublic).toBe(true);
    expect(res.body.isAvailable).toBe(true);
  });

  it("יצירת פריט עם כותרת קצרה מדי מחזירה 400", async () => {
    const { token } = await createTestUser();
    const res = await request(app).post("/api/items").set(authHeader(token)).send({
      title: "א",
      category: "BABY",
      condition: "NEW",
      neighborhood: "פרדס כץ",
    });
    expect(res.status).toBe(400);
  });

  it("בלי token מחזיר 401", async () => {
    const res = await request(app).get("/api/items");
    expect(res.status).toBe(401);
  });

  it("USER רואה פריטים ציבוריים של אחרות + את כל הפריטים הפרטיים שלה", async () => {
    const { user: owner } = await createTestUser({ email: "owner@test.local" });
    const { token: viewerToken, user: viewer } = await createTestUser({ email: "viewer@test.local" });

    await createItem(owner.id, { title: "פריט ציבורי של אחרת", isPublic: true });
    await createItem(owner.id, { title: "פריט פרטי של אחרת", isPublic: false });
    await createItem(viewer.id, { title: "פריט פרטי שלי", isPublic: false });

    const res = await request(app).get("/api/items").set(authHeader(viewerToken));
    expect(res.status).toBe(200);
    const titles = res.body.items.map((i: { title: string }) => i.title);
    expect(titles).toContain("פריט ציבורי של אחרת");
    expect(titles).toContain("פריט פרטי שלי");
    expect(titles).not.toContain("פריט פרטי של אחרת");
  });

  it("GET /api/items/:id על פריט פרטי של אחרת מחזיר 404 עבור USER", async () => {
    const { user: owner } = await createTestUser({ email: "owner2@test.local" });
    const { token: viewerToken } = await createTestUser({ email: "viewer2@test.local" });
    const item = await createItem(owner.id, { isPublic: false });

    const res = await request(app).get(`/api/items/${item.id}`).set(authHeader(viewerToken));
    expect(res.status).toBe(404);
  });

  it("ADMIN רואה פריט פרטי של כל משתמשת", async () => {
    const { user: owner } = await createTestUser({ email: "owner3@test.local" });
    const { token: adminToken } = await createTestUser({ email: "admin3@test.local", role: "ADMIN" });
    const item = await createItem(owner.id, { isPublic: false });

    const res = await request(app).get(`/api/items/${item.id}`).set(authHeader(adminToken));
    expect(res.status).toBe(200);
  });

  it("עריכת פריט על ידי מי שלא הבעלים מחזירה 403", async () => {
    const { user: owner } = await createTestUser({ email: "owner4@test.local" });
    const { token: strangerToken } = await createTestUser({ email: "stranger4@test.local" });
    const item = await createItem(owner.id);

    const res = await request(app)
      .put(`/api/items/${item.id}`)
      .set(authHeader(strangerToken))
      .send({ title: "כותרת חדשה" });
    expect(res.status).toBe(403);
  });

  it("הבעלים יכולה לעדכן את הפריט שלה", async () => {
    const { user: owner, token } = await createTestUser({ email: "owner5@test.local" });
    const item = await createItem(owner.id);

    const res = await request(app)
      .put(`/api/items/${item.id}`)
      .set(authHeader(token))
      .send({ title: "כותרת מעודכנת" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("כותרת מעודכנת");
  });

  it("ADMIN יכולה לעדכן פריט של מישהי אחרת", async () => {
    const { user: owner } = await createTestUser({ email: "owner6@test.local" });
    const { token: adminToken } = await createTestUser({ email: "admin6@test.local", role: "ADMIN" });
    const item = await createItem(owner.id);

    const res = await request(app)
      .put(`/api/items/${item.id}`)
      .set(authHeader(adminToken))
      .send({ title: "כותרת ע\"י מנהלת" });
    expect(res.status).toBe(200);
  });

  it("מחיקת פריט על ידי מי שלא הבעלים מחזירה 403", async () => {
    const { user: owner } = await createTestUser({ email: "owner7@test.local" });
    const { token: strangerToken } = await createTestUser({ email: "stranger7@test.local" });
    const item = await createItem(owner.id);

    const res = await request(app).delete(`/api/items/${item.id}`).set(authHeader(strangerToken));
    expect(res.status).toBe(403);
  });

  it("מחיקת פריט עם בקשה APPROVED מחזירה 409", async () => {
    const { user: owner, token } = await createTestUser({ email: "owner8@test.local" });
    const { user: borrower } = await createTestUser({ email: "borrower8@test.local" });
    const item = await createItem(owner.id);
    await prisma.loanRequest.create({
      data: {
        itemId: item.id,
        borrowerId: borrower.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        status: "APPROVED",
      },
    });

    const res = await request(app).delete(`/api/items/${item.id}`).set(authHeader(token));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ITEM_HAS_ACTIVE_LOAN");
  });

  it("מחיקת פריט תקינה מחזירה 204", async () => {
    const { user: owner, token } = await createTestUser({ email: "owner9@test.local" });
    const item = await createItem(owner.id);
    const res = await request(app).delete(`/api/items/${item.id}`).set(authHeader(token));
    expect(res.status).toBe(204);
  });

  it("חיפוש לפי כותרת לא רגיש לאותיות", async () => {
    const { token, user } = await createTestUser({ email: "searcher@test.local" });
    await createItem(user.id, { title: "כלי עבודה חדש" });
    await createItem(user.id, { title: "ספר ילדים" });

    const res = await request(app).get("/api/items").query({ search: "עבודה" }).set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe("כלי עבודה חדש");
  });

  it("סינון לפי קטגוריה ושכונה", async () => {
    const { token, user } = await createTestUser({ email: "filterer@test.local" });
    await createItem(user.id, { category: "TOOLS", neighborhood: "גני גד" });
    await createItem(user.id, { category: "BOOKS", neighborhood: "גני גד" });

    const res = await request(app)
      .get("/api/items")
      .query({ category: "TOOLS", neighborhood: "גני גד" })
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].category).toBe("TOOLS");
  });

  it("mine=true מחזיר רק את הפריטים של המשתמשת המחוברת", async () => {
    const { token, user } = await createTestUser({ email: "mineuser@test.local" });
    const { user: other } = await createTestUser({ email: "otheruser@test.local" });
    await createItem(user.id, { title: "שלי" });
    await createItem(other.id, { title: "של אחרת", isPublic: true });

    const res = await request(app).get("/api/items").query({ mine: "true" }).set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe("שלי");
  });

  it("פריטים ברשימה לא חושפים טלפון של הבעלים", async () => {
    const { token, user } = await createTestUser({ email: "phonehider@test.local" });
    await createItem(user.id);
    const res = await request(app).get("/api/items").set(authHeader(token));
    expect(res.body.items[0].owner.phone).toBeUndefined();
  });
});
