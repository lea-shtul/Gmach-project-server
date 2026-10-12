import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { createTestUser, authHeader } from "./helpers";

const app = createApp();

describe("Auth", () => {
  it("register יוצר משתמשת חדשה עם role=USER ומחזיר token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "דנה כהן",
      email: "dana@test.local",
      password: "mySecret1",
      phone: "050-1111111",
      neighborhood: "פרדס כץ",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.user.role).toBe("USER");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("register עם אימייל כפול מחזיר 409", async () => {
    await createTestUser({ email: "taken@test.local" });
    const res = await request(app).post("/api/auth/register").send({
      fullName: "דנה כהן",
      email: "taken@test.local",
      password: "mySecret1",
      phone: "050-1111111",
      neighborhood: "פרדס כץ",
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("register עם שכונה לא קיימת מחזיר 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "דנה כהן",
      email: "dana2@test.local",
      password: "mySecret1",
      phone: "050-1111111",
      neighborhood: "שכונה לא קיימת",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("login תקין מחזיר token ומשתמשת", async () => {
    const { user, password } = await createTestUser({ email: "login@test.local" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.user.email).toBe(user.email);
  });

  it("login עם סיסמה שגויה מחזיר 401", async () => {
    const { user } = await createTestUser({ email: "wrongpass@test.local" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("login עם אימייל לא קיים מחזיר 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.local", password: "whatever1" });
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me בלי token מחזיר 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/auth/me עם token לא תקין מחזיר 401", async () => {
    const res = await request(app).get("/api/auth/me").set(authHeader("not-a-real-token"));
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me עם token תקין מחזיר את פרטי המשתמשת", async () => {
    const { user, token } = await createTestUser({ email: "me@test.local" });
    const res = await request(app).get("/api/auth/me").set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
    expect(res.body.passwordHash).toBeUndefined();
  });
});
