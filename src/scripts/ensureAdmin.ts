import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { env } from "../config/env";

// רץ בכל עליית שרת בפרודקשן (לא מוחק נתונים!). יוצר מנהלת לפי משתני הסביבה
// אם היא עדיין לא קיימת. בניגוד ל-seed, אינו מוחק ואינו יוצר נתוני דמו.
async function ensureAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: env.admin.email } });
  if (existing) {
    console.log(`מנהלת (${env.admin.email}) קיימת כבר - לא נעשה שינוי.`);
    return;
  }

  const passwordHash = await bcrypt.hash(env.admin.password, 10);
  await prisma.user.create({
    data: {
      fullName: env.admin.fullName,
      email: env.admin.email,
      passwordHash,
      phone: env.admin.phone,
      neighborhood: env.admin.neighborhood,
      role: "ADMIN",
    },
  });
  console.log(`נוצרה מנהלת חדשה: ${env.admin.email}`);
}

ensureAdmin()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
