import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/prisma";
import { createTestUser, authHeader } from "./helpers";

const app = createApp();

function monthLabel(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

describe("Stats", () => {
  it("GET /api/stats/me ממלא 6 חודשים באפסים כשאין פעילות", async () => {
    const { token } = await createTestUser({ email: "statsempty@test.local" });
    const res = await request(app).get("/api/stats/me").set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.monthly).toHaveLength(6);
    expect(res.body.monthly.every((m: { lent: number; borrowed: number }) => m.lent === 0 && m.borrowed === 0)).toBe(
      true,
    );
    expect(res.body.topItem).toBeNull();
    expect(res.body.totals.myItemsCount).toBe(0);

    const now = new Date();
    expect(res.body.monthly[5].month).toBe(monthLabel(now));
  });

  it("GET /api/stats/me סופר פריטים, השאלות שהגיעו ל-BORROWED/RETURNED ו-pendingReceived", async () => {
    const { user: owner, token: ownerToken } = await createTestUser({ email: "statsowner@test.local" });
    const { user: borrower, token: borrowerToken } = await createTestUser({ email: "statsborrower@test.local" });

    const item = await prisma.item.create({
      data: {
        ownerId: owner.id,
        title: "פריט לבדיקת גרפים",
        category: "TOOLS",
        condition: "GOOD",
        neighborhood: "מרכז העיר",
      },
    });

    const pendingReq = await request(app)
      .post("/api/requests")
      .set(authHeader(borrowerToken))
      .send({
        itemId: item.id,
        startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      });

    await request(app)
      .patch(`/api/requests/${pendingReq.body.id}/status`)
      .set(authHeader(ownerToken))
      .send({ status: "APPROVED" });
    await request(app)
      .patch(`/api/requests/${pendingReq.body.id}/status`)
      .set(authHeader(ownerToken))
      .send({ status: "BORROWED" });

    const ownerStats = await request(app).get("/api/stats/me").set(authHeader(ownerToken));
    expect(ownerStats.body.totals.myItemsCount).toBe(1);
    expect(ownerStats.body.totals.timesMyItemsLent).toBe(1);
    expect(ownerStats.body.totals.pendingReceived).toBe(0);
    expect(ownerStats.body.topItem.id).toBe(item.id);

    const borrowerStats = await request(app).get("/api/stats/me").set(authHeader(borrowerToken));
    expect(borrowerStats.body.totals.timesIBorrowed).toBe(1);
  });

  it("GET /api/stats/neighborhood ממלא 7 ימים ומשתמש בשכונה של המשתמשת כברירת מחדל", async () => {
    const { token } = await createTestUser({ email: "statsneighbor@test.local", neighborhood: "גני גד" });
    const res = await request(app).get("/api/stats/neighborhood").set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.daily).toHaveLength(7);
    expect(res.body.newItemsThisWeek).toBe(0);
    expect(res.body.mostRequested).toEqual([]);
  });

  it("GET /api/stats/neighborhood סופר פריטים חדשים בשכונה שצוינה", async () => {
    const { token, user } = await createTestUser({ email: "statsneighbor2@test.local" });
    await prisma.item.create({
      data: {
        ownerId: user.id,
        title: "פריט בשכונה",
        category: "KITCHEN",
        condition: "GOOD",
        neighborhood: "שיכון ג'",
      },
    });

    const res = await request(app)
      .get("/api/stats/neighborhood")
      .query({ neighborhood: "שיכון ג'" })
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.newItemsThisWeek).toBe(1);
  });
});
