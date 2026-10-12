import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/prisma";
import { createTestUser, authHeader } from "./helpers";

const app = createApp();

describe("Admin", () => {
  it("GET /api/admin/stats עם USER מחזיר 403", async () => {
    const { token } = await createTestUser({ email: "notadmin@test.local" });
    const res = await request(app).get("/api/admin/stats").set(authHeader(token));
    expect(res.status).toBe(403);
  });

  it("GET /api/admin/users עם USER מחזיר 403", async () => {
    const { token } = await createTestUser({ email: "notadmin2@test.local" });
    const res = await request(app).get("/api/admin/users").set(authHeader(token));
    expect(res.status).toBe(403);
  });

  it("GET /api/admin/stats עם ADMIN מחזיר totals/byCategory/byStatus/monthlyRequests", async () => {
    const { token } = await createTestUser({ email: "admin-stats@test.local", role: "ADMIN" });
    const { user } = await createTestUser({ email: "plainuser@test.local" });
    await prisma.item.create({
      data: {
        ownerId: user.id,
        title: "פריט למנהלת",
        category: "OTHER",
        condition: "FAIR",
        neighborhood: "מרכז העיר",
      },
    });

    const res = await request(app).get("/api/admin/stats").set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.totals.users).toBeGreaterThanOrEqual(2);
    expect(res.body.totals.items).toBeGreaterThanOrEqual(1);
    expect(res.body.byCategory).toHaveLength(7);
    expect(res.body.byStatus).toHaveLength(6);
    expect(res.body.monthlyRequests).toHaveLength(6);
  });

  it("GET /api/admin/users מחזירה משתמשות בלי passwordHash עם itemsCount/requestsCount", async () => {
    const { token } = await createTestUser({ email: "admin-users@test.local", role: "ADMIN" });
    const { user } = await createTestUser({ email: "counted@test.local" });
    await prisma.item.create({
      data: {
        ownerId: user.id,
        title: "פריט לספירה",
        category: "OTHER",
        condition: "GOOD",
        neighborhood: "מרכז העיר",
      },
    });

    const res = await request(app).get("/api/admin/users").set(authHeader(token));
    expect(res.status).toBe(200);
    const found = res.body.find((u: { email: string }) => u.email === "counted@test.local");
    expect(found).toBeDefined();
    expect(found.passwordHash).toBeUndefined();
    expect(found.itemsCount).toBe(1);
    expect(found.requestsCount).toBe(0);
  });
});
