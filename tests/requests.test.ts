import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/prisma";
import { createTestUser, authHeader } from "./helpers";

const app = createApp();

function futureDate(daysFromNow: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

async function createItem(ownerId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return prisma.item.create({
    data: {
      ownerId,
      title: "עגלת תינוק",
      category: "BABY",
      condition: "GOOD",
      neighborhood: "מרכז העיר",
      isPublic: true,
      isAvailable: true,
      ...overrides,
    },
  });
}

describe("Requests - creation", () => {
  it("בקשה תקינה נוצרת בסטטוס PENDING", async () => {
    const { user: owner } = await createTestUser({ email: "o1@test.local" });
    const { token: borrowerToken } = await createTestUser({ email: "b1@test.local" });
    const item = await createItem(owner.id);

    const res = await request(app)
      .post("/api/requests")
      .set(authHeader(borrowerToken))
      .send({ itemId: item.id, startDate: futureDate(1), endDate: futureDate(3) });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
  });

  it("בקשה על פריט של עצמי מחזירה 400", async () => {
    const { user: owner, token } = await createTestUser({ email: "o2@test.local" });
    const item = await createItem(owner.id);

    const res = await request(app)
      .post("/api/requests")
      .set(authHeader(token))
      .send({ itemId: item.id, startDate: futureDate(1), endDate: futureDate(2) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("CANNOT_REQUEST_OWN_ITEM");
  });

  it("בקשה על פריט לא זמין מחזירה 409", async () => {
    const { user: owner } = await createTestUser({ email: "o3@test.local" });
    const { token: borrowerToken } = await createTestUser({ email: "b3@test.local" });
    const item = await createItem(owner.id, { isAvailable: false });

    const res = await request(app)
      .post("/api/requests")
      .set(authHeader(borrowerToken))
      .send({ itemId: item.id, startDate: futureDate(1), endDate: futureDate(2) });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ITEM_NOT_AVAILABLE");
  });

  it("בקשה על פריט פרטי מחזירה 409", async () => {
    const { user: owner } = await createTestUser({ email: "o3b@test.local" });
    const { token: borrowerToken } = await createTestUser({ email: "b3b@test.local" });
    const item = await createItem(owner.id, { isPublic: false });

    const res = await request(app)
      .post("/api/requests")
      .set(authHeader(borrowerToken))
      .send({ itemId: item.id, startDate: futureDate(1), endDate: futureDate(2) });

    expect(res.status).toBe(409);
  });

  it("תאריך התחלה בעבר מחזיר 400", async () => {
    const { user: owner } = await createTestUser({ email: "o4@test.local" });
    const { token: borrowerToken } = await createTestUser({ email: "b4@test.local" });
    const item = await createItem(owner.id);

    const res = await request(app)
      .post("/api/requests")
      .set(authHeader(borrowerToken))
      .send({ itemId: item.id, startDate: "2000-01-01", endDate: futureDate(2) });

    expect(res.status).toBe(400);
  });

  it("endDate לפני startDate מחזיר 400", async () => {
    const { user: owner } = await createTestUser({ email: "o5@test.local" });
    const { token: borrowerToken } = await createTestUser({ email: "b5@test.local" });
    const item = await createItem(owner.id);

    const res = await request(app)
      .post("/api/requests")
      .set(authHeader(borrowerToken))
      .send({ itemId: item.id, startDate: futureDate(5), endDate: futureDate(1) });

    expect(res.status).toBe(400);
  });

  it("בקשה כפולה PENDING על אותו פריט מחזירה 409", async () => {
    const { user: owner } = await createTestUser({ email: "o6@test.local" });
    const { token: borrowerToken } = await createTestUser({ email: "b6@test.local" });
    const item = await createItem(owner.id);

    await request(app)
      .post("/api/requests")
      .set(authHeader(borrowerToken))
      .send({ itemId: item.id, startDate: futureDate(1), endDate: futureDate(2) });

    const res = await request(app)
      .post("/api/requests")
      .set(authHeader(borrowerToken))
      .send({ itemId: item.id, startDate: futureDate(10), endDate: futureDate(12) });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_PENDING_REQUEST");
  });

  it("תאריכים חופפים לבקשה APPROVED קיימת מחזירים 409", async () => {
    const { user: owner, token: ownerToken } = await createTestUser({ email: "o7@test.local" });
    const { token: borrower1Token } = await createTestUser({ email: "b7a@test.local" });
    const { token: borrower2Token } = await createTestUser({ email: "b7b@test.local" });
    const item = await createItem(owner.id);

    const first = await request(app)
      .post("/api/requests")
      .set(authHeader(borrower1Token))
      .send({ itemId: item.id, startDate: futureDate(5), endDate: futureDate(10) });
    await request(app)
      .patch(`/api/requests/${first.body.id}/status`)
      .set(authHeader(ownerToken))
      .send({ status: "APPROVED" });

    const res = await request(app)
      .post("/api/requests")
      .set(authHeader(borrower2Token))
      .send({ itemId: item.id, startDate: futureDate(7), endDate: futureDate(8) });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DATE_OVERLAP");
  });
});

describe("Requests - status transitions", () => {
  async function setupPending() {
    const { user: owner, token: ownerToken } = await createTestUser({ email: "owX@test.local" });
    const { user: borrower, token: borrowerToken } = await createTestUser({ email: "boX@test.local" });
    const item = await createItem(owner.id);
    const created = await request(app)
      .post("/api/requests")
      .set(authHeader(borrowerToken))
      .send({ itemId: item.id, startDate: futureDate(1), endDate: futureDate(2) });
    return { owner, ownerToken, borrower, borrowerToken, item, requestId: created.body.id as string };
  }

  it("הבעלים יכולה לאשר בקשה PENDING -> APPROVED", async () => {
    const { ownerToken, requestId } = await setupPending();
    const res = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .set(authHeader(ownerToken))
      .send({ status: "APPROVED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
  });

  it("הבעלים יכולה לדחות בקשה PENDING -> REJECTED", async () => {
    const { ownerToken, requestId } = await setupPending();
    const res = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .set(authHeader(ownerToken))
      .send({ status: "REJECTED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("REJECTED");
  });

  it("המבקשת יכולה לבטל בקשה PENDING -> CANCELLED", async () => {
    const { borrowerToken, requestId } = await setupPending();
    const res = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .set(authHeader(borrowerToken))
      .send({ status: "CANCELLED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELLED");
  });

  it("המבקשת לא יכולה לאשר בקשה בעצמה - 403", async () => {
    const { borrowerToken, requestId } = await setupPending();
    const res = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .set(authHeader(borrowerToken))
      .send({ status: "APPROVED" });
    expect(res.status).toBe(403);
  });

  it("הבעלים לא יכולה לבטל (CANCELLED) בקשה - 403", async () => {
    const { ownerToken, requestId } = await setupPending();
    const res = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .set(authHeader(ownerToken))
      .send({ status: "CANCELLED" });
    expect(res.status).toBe(403);
  });

  it("מעבר PENDING -> BORROWED (לא חוקי) מחזיר 409", async () => {
    const { ownerToken, requestId } = await setupPending();
    const res = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .set(authHeader(ownerToken))
      .send({ status: "BORROWED" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
  });

  it("מעבר מלא APPROVED -> BORROWED -> RETURNED מעדכן isAvailable ו-borrowedAt/returnedAt", async () => {
    const { ownerToken, item, requestId } = await setupPending();

    await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .set(authHeader(ownerToken))
      .send({ status: "APPROVED" });

    const borrowedRes = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .set(authHeader(ownerToken))
      .send({ status: "BORROWED" });
    expect(borrowedRes.status).toBe(200);
    expect(borrowedRes.body.borrowedAt).not.toBeNull();

    const itemAfterBorrow = await prisma.item.findUnique({ where: { id: item.id } });
    expect(itemAfterBorrow?.isAvailable).toBe(false);

    const returnedRes = await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .set(authHeader(ownerToken))
      .send({ status: "RETURNED" });
    expect(returnedRes.status).toBe(200);
    expect(returnedRes.body.returnedAt).not.toBeNull();

    const itemAfterReturn = await prisma.item.findUnique({ where: { id: item.id } });
    expect(itemAfterReturn?.isAvailable).toBe(true);
  });

  it("חושף טלפון הדדי רק כש-APPROVED", async () => {
    const { ownerToken, borrowerToken, requestId } = await setupPending();

    const beforeApprove = await request(app)
      .get(`/api/requests/${requestId}`)
      .set(authHeader(borrowerToken));
    expect(beforeApprove.body.owner.phone).toBeUndefined();

    await request(app)
      .patch(`/api/requests/${requestId}/status`)
      .set(authHeader(ownerToken))
      .send({ status: "APPROVED" });

    const afterApprove = await request(app)
      .get(`/api/requests/${requestId}`)
      .set(authHeader(borrowerToken));
    expect(afterApprove.body.owner.phone).toBeTypeOf("string");

    const ownerView = await request(app)
      .get(`/api/requests/${requestId}`)
      .set(authHeader(ownerToken));
    expect(ownerView.body.borrower.phone).toBeTypeOf("string");
  });

  it("GET /api/requests/:id על ידי מי שאינה צד לבקשה מחזיר 403", async () => {
    const { requestId } = await setupPending();
    const { token: strangerToken } = await createTestUser({ email: "stranger-req@test.local" });
    const res = await request(app).get(`/api/requests/${requestId}`).set(authHeader(strangerToken));
    expect(res.status).toBe(403);
  });

  it("GET /api/requests/mine מחזירה רק את הבקשות ששלחתי", async () => {
    const { borrowerToken, requestId } = await setupPending();
    const res = await request(app).get("/api/requests/mine").set(authHeader(borrowerToken));
    expect(res.status).toBe(200);
    expect(res.body.map((r: { id: string }) => r.id)).toContain(requestId);
  });

  it("GET /api/requests/received מחזירה רק בקשות על הפריטים שלי", async () => {
    const { ownerToken, requestId } = await setupPending();
    const res = await request(app).get("/api/requests/received").set(authHeader(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.map((r: { id: string }) => r.id)).toContain(requestId);
  });

  it("GET /api/requests (admin בלבד) - USER מקבלת 403", async () => {
    const { borrowerToken } = await setupPending();
    const res = await request(app).get("/api/requests").set(authHeader(borrowerToken));
    expect(res.status).toBe(403);
  });

  it("GET /api/requests (admin בלבד) - ADMIN מקבלת את כל הבקשות", async () => {
    await setupPending();
    const { token: adminToken } = await createTestUser({ email: "admin-req@test.local", role: "ADMIN" });
    const res = await request(app).get("/api/requests").set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
