import { beforeEach, afterAll } from "vitest";
import { prisma } from "../src/prisma";

// מנקה את כל הטבלאות לפני כל בדיקה, כדי שכל test ירוץ ממצב נקי ועצמאי.
beforeEach(async () => {
  await prisma.loanRequest.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
