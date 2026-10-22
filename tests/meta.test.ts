import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Meta", () => {
  it("GET /api/meta בלי token מחזיר 200 עם רשימות הבחירה", async () => {
    const res = await request(app).get("/api/meta");
    expect(res.status).toBe(200);
    expect(res.body.categories).toBeInstanceOf(Array);
    expect(res.body.conditions).toBeInstanceOf(Array);
    expect(res.body.neighborhoods).toBeInstanceOf(Array);
    expect(res.body.statuses).toBeInstanceOf(Array);
    expect(res.body.neighborhoods.length).toBeGreaterThan(0);
  });

  it("GET /api/meta עם token לא תקין עדיין מחזיר 200 (לא נדרש Token)", async () => {
    const res = await request(app).get("/api/meta").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(200);
  });
});
