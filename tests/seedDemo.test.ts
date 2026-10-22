import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/prisma";
import { runSeedDemo } from "../prisma/seedDemo";

const ACTIVE_STATUSES = ["APPROVED", "BORROWED"];

const ORIGINAL_SEED_DEMO = process.env.SEED_DEMO;
const ORIGINAL_DEMO_PASSWORD = process.env.DEMO_USERS_PASSWORD;

beforeEach(() => {
  delete process.env.SEED_DEMO;
  delete process.env.DEMO_USERS_PASSWORD;
});

afterEach(() => {
  if (ORIGINAL_SEED_DEMO === undefined) delete process.env.SEED_DEMO;
  else process.env.SEED_DEMO = ORIGINAL_SEED_DEMO;
  if (ORIGINAL_DEMO_PASSWORD === undefined) delete process.env.DEMO_USERS_PASSWORD;
  else process.env.DEMO_USERS_PASSWORD = ORIGINAL_DEMO_PASSWORD;
});

async function countAll() {
  return {
    users: await prisma.user.count(),
    items: await prisma.item.count(),
    requests: await prisma.loanRequest.count(),
  };
}

describe("seed:demo - guards", () => {
  it("לא רץ כש-SEED_DEMO לא true", async () => {
    await runSeedDemo();
    expect(await countAll()).toEqual({ users: 0, items: 0, requests: 0 });
  });

  it("לא רץ כש-SEED_DEMO='false'", async () => {
    process.env.SEED_DEMO = "false";
    process.env.DEMO_USERS_PASSWORD = "Demo123!";
    await runSeedDemo();
    expect(await countAll()).toEqual({ users: 0, items: 0, requests: 0 });
  });

  it("לא יוצר שום דבר (כולל פריטים) כש-DEMO_USERS_PASSWORD חסר", async () => {
    process.env.SEED_DEMO = "true";
    await runSeedDemo();
    expect(await countAll()).toEqual({ users: 0, items: 0, requests: 0 });
  });

  it("לא רץ אם יש כבר משתמשת USER קיימת (לא נדרס, לא מכפיל)", async () => {
    await prisma.user.create({
      data: {
        fullName: "משתמשת קיימת",
        email: "existing@test.local",
        passwordHash: "x",
        phone: "050-0000000",
        neighborhood: "מרכז העיר",
        role: "USER",
      },
    });

    process.env.SEED_DEMO = "true";
    process.env.DEMO_USERS_PASSWORD = "Demo123!";
    await runSeedDemo();

    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.item.count()).toBe(0);
  });
});

describe("seed:demo - הרצה כפולה ותקינות נתונים", () => {
  it("הרצה כפולה לא מוסיפה כפילויות", async () => {
    process.env.SEED_DEMO = "true";
    process.env.DEMO_USERS_PASSWORD = "Demo123!";

    await runSeedDemo();
    const afterFirst = await countAll();
    expect(afterFirst.users).toBeGreaterThan(0);
    expect(afterFirst.items).toBeGreaterThan(0);

    await runSeedDemo();
    const afterSecond = await countAll();
    expect(afterSecond).toEqual(afterFirst);
  });

  it("הנתונים שנוצרו עומדים בחוקי העסק", async () => {
    process.env.SEED_DEMO = "true";
    process.env.DEMO_USERS_PASSWORD = "Demo123!";
    await runSeedDemo();

    const items = await prisma.item.findMany({ include: { loanRequests: true } });
    expect(items.length).toBeGreaterThan(0);

    for (const item of items) {
      const hasOpenBorrow = item.loanRequests.some((r) => r.status === "BORROWED");
      expect(item.isAvailable).toBe(!hasOpenBorrow);

      const active = item.loanRequests.filter((r) =>
        ACTIVE_STATUSES.includes(r.status),
      );
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const a = active[i]!;
          const b = active[j]!;
          const overlap =
            a.startDate.getTime() <= b.endDate.getTime() &&
            a.endDate.getTime() >= b.startDate.getTime();
          expect(overlap).toBe(false);
        }
      }

      for (const request of item.loanRequests) {
        expect(request.borrowerId).not.toBe(item.ownerId);

        if (request.status === "BORROWED" || request.status === "RETURNED") {
          expect(request.borrowedAt).not.toBeNull();
        } else {
          expect(request.borrowedAt).toBeNull();
        }

        if (request.status === "RETURNED") {
          expect(request.returnedAt).not.toBeNull();
          expect(request.returnedAt!.getTime()).toBeGreaterThanOrEqual(
            request.borrowedAt!.getTime(),
          );
        } else {
          expect(request.returnedAt).toBeNull();
        }
      }
    }
  });
});
