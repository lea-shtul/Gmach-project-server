import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { env } from "../src/config/env";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  return daysAgo(-n);
}

const DEMO_PASSWORD = "Demo123!";

async function main() {
  console.log("מנקה טבלאות קיימות...");
  await prisma.loanRequest.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();

  console.log("יוצרת משתמשות...");
  const adminPasswordHash = await bcrypt.hash(env.admin.password, 10);
  const admin = await prisma.user.create({
    data: {
      fullName: env.admin.fullName,
      email: env.admin.email,
      passwordHash: adminPasswordHash,
      phone: env.admin.phone,
      neighborhood: env.admin.neighborhood,
      role: "ADMIN",
    },
  });

  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const [rachel, sara, miriam] = await Promise.all([
    prisma.user.create({
      data: {
        fullName: "רחל לוי",
        email: "rachel@gemach.local",
        passwordHash: demoPasswordHash,
        phone: "052-1111111",
        neighborhood: "פרדס כץ",
      },
    }),
    prisma.user.create({
      data: {
        fullName: "שרה אברהם",
        email: "sara@gemach.local",
        passwordHash: demoPasswordHash,
        phone: "053-2222222",
        neighborhood: "גבעת רוקח",
      },
    }),
    prisma.user.create({
      data: {
        fullName: "מרים גולד",
        email: "miriam@gemach.local",
        passwordHash: demoPasswordHash,
        phone: "054-3333333",
        neighborhood: "רמת אלחנן",
      },
    }),
  ]);

  const users = [rachel, sara, miriam];

  console.log("יוצרת פריטים...");
  type ItemSeed = {
    ownerId: string;
    title: string;
    description: string;
    category: "BABY" | "KITCHEN" | "EVENTS" | "BOOKS" | "HOLIDAY" | "TOOLS" | "OTHER";
    condition: "NEW" | "GOOD" | "FAIR";
    neighborhood: string;
    isPublic: boolean;
    isAvailable: boolean;
    createdDaysAgo: number;
  };

  const itemSeeds: ItemSeed[] = [
    // BABY
    { ownerId: rachel.id, title: "עגלת תינוק מתקפלת", description: "עגלה קלה, מתאימה מגיל חודש", category: "BABY", condition: "GOOD", neighborhood: "פרדס כץ", isPublic: true, isAvailable: true, createdDaysAgo: 80 },
    { ownerId: sara.id, title: "כיסא אוכל לתינוק", description: "מתקפל, ניתן לכיוון גובה", category: "BABY", condition: "NEW", neighborhood: "גבעת רוקח", isPublic: true, isAvailable: true, createdDaysAgo: 3 },
    { ownerId: miriam.id, title: "משאבת חלב אלקטרונית", description: "משומשת מעט, מנוקה ומושרה", category: "BABY", condition: "FAIR", neighborhood: "רמת אלחנן", isPublic: false, isAvailable: true, createdDaysAgo: 40 },
    // KITCHEN
    { ownerId: rachel.id, title: "מיקסר שף גדול", description: "למאפים ועוגות לשבת וחג", category: "KITCHEN", condition: "GOOD", neighborhood: "פרדס כץ", isPublic: true, isAvailable: true, createdDaysAgo: 2 },
    { ownerId: sara.id, title: "סיר לחץ 10 ליטר", description: "מתאים לבישול כמויות גדולות", category: "KITCHEN", condition: "GOOD", neighborhood: "גבעת רוקח", isPublic: true, isAvailable: true, createdDaysAgo: 65 },
    { ownerId: miriam.id, title: "מכונת קפה קפסולות", description: "", category: "KITCHEN", condition: "NEW", neighborhood: "מרכז העיר", isPublic: true, isAvailable: true, createdDaysAgo: 150 },
    // EVENTS
    { ownerId: rachel.id, title: "שולחנות מתקפלים לאירוע (x4)", description: "שולחנות פלסטיק, קלים להרכבה", category: "EVENTS", condition: "GOOD", neighborhood: "פרדס כץ", isPublic: true, isAvailable: true, createdDaysAgo: 20 },
    { ownerId: sara.id, title: "מערכת הגברה קטנה", description: "רמקול + מיקרופון אחד", category: "EVENTS", condition: "FAIR", neighborhood: "גבעת רוקח", isPublic: true, isAvailable: true, createdDaysAgo: 6 },
    { ownerId: miriam.id, title: "כיסאות פלסטיק לאירוח (x20)", description: "לבנים, מצב שמיש", category: "EVENTS", condition: "FAIR", neighborhood: "רמת אלחנן", isPublic: true, isAvailable: true, createdDaysAgo: 100 },
    // BOOKS
    { ownerId: rachel.id, title: "סט ספרי פרשת שבוע לילדים", description: "מאוייר, 5 כרכים", category: "BOOKS", condition: "GOOD", neighborhood: "פרדס כץ", isPublic: true, isAvailable: true, createdDaysAgo: 110 },
    { ownerId: sara.id, title: "ספרי לימוד כיתה ג'", description: "חשבון ולשון", category: "BOOKS", condition: "FAIR", neighborhood: "גבעת רוקח", isPublic: false, isAvailable: true, createdDaysAgo: 4 },
    { ownerId: miriam.id, title: "אנציקלופדיה לילדים", description: "סט 10 כרכים", category: "BOOKS", condition: "GOOD", neighborhood: "רמת אלחנן", isPublic: true, isAvailable: true, createdDaysAgo: 170 },
    // HOLIDAY
    { ownerId: rachel.id, title: "ארבעת המינים - קופסת החזקה", description: "קופסה מהודרת לפסח", category: "HOLIDAY", condition: "NEW", neighborhood: "פרדס כץ", isPublic: true, isAvailable: true, createdDaysAgo: 1 },
    { ownerId: sara.id, title: "סוכה מתקפלת 2x2", description: "כולל סכך, לבדיקה לפני חג", category: "HOLIDAY", condition: "GOOD", neighborhood: "גבעת רוקח", isPublic: true, isAvailable: true, createdDaysAgo: 75 },
    { ownerId: miriam.id, title: "מנורת חנוכה גדולה לאירוע", description: "", category: "HOLIDAY", condition: "GOOD", neighborhood: "רמת אלחנן", isPublic: true, isAvailable: true, createdDaysAgo: 130 },
    // TOOLS
    { ownerId: rachel.id, title: "מברגה חשמלית + סט ראשים", description: "סוללה נטענת", category: "TOOLS", condition: "GOOD", neighborhood: "פרדס כץ", isPublic: true, isAvailable: true, createdDaysAgo: 45 },
    { ownerId: sara.id, title: "סולם אלומיניום 3 מ'", description: "מתקפל, יציב", category: "TOOLS", condition: "FAIR", neighborhood: "גבעת רוקח", isPublic: true, isAvailable: true, createdDaysAgo: 5 },
    { ownerId: miriam.id, title: "מערכת מקדחה + פטיש", description: "לעבודות שיפוץ קטנות", category: "TOOLS", condition: "GOOD", neighborhood: "רמת אלחנן", isPublic: false, isAvailable: true, createdDaysAgo: 60 },
    // OTHER
    { ownerId: rachel.id, title: "אוהל קמפינג 4 אנשים", description: "לטיולי חופש", category: "OTHER", condition: "GOOD", neighborhood: "פרדס כץ", isPublic: true, isAvailable: true, createdDaysAgo: 90 },
    { ownerId: sara.id, title: "כיסא גלגלים מתקפל", description: "להשאלה לזמן קצר", category: "OTHER", condition: "FAIR", neighborhood: "גבעת רוקח", isPublic: true, isAvailable: true, createdDaysAgo: 0 },
    { ownerId: miriam.id, title: "מצעד תינוקות למדרגות", description: "סט שערי בטיחות", category: "OTHER", condition: "NEW", neighborhood: "מרכז העיר", isPublic: true, isAvailable: true, createdDaysAgo: 12 },
  ];

  const items = [];
  for (const seed of itemSeeds) {
    const item = await prisma.item.create({
      data: {
        ownerId: seed.ownerId,
        title: seed.title,
        description: seed.description || null,
        category: seed.category,
        condition: seed.condition,
        neighborhood: seed.neighborhood,
        isPublic: seed.isPublic,
        isAvailable: seed.isAvailable,
        createdAt: daysAgo(seed.createdDaysAgo),
      },
    });
    items.push(item);
  }

  console.log("יוצרת בקשות השאלה...");

  function otherUser(ownerId: string) {
    const candidates = users.filter((u) => u.id !== ownerId);
    return candidates[Math.floor(Math.random() * candidates.length)]!;
  }

  type Status = "PENDING" | "APPROVED" | "REJECTED" | "BORROWED" | "RETURNED" | "CANCELLED";

  interface RequestSeed {
    itemIndex: number;
    status: Status;
    createdDaysAgo: number;
    loanDurationDays: number;
    borrowedDaysAgo?: number;
    returnedDaysAgo?: number;
  }

  const requestSeeds: RequestSeed[] = [
    // PENDING - בקשות ממתינות, חלקן מהשבוע האחרון
    { itemIndex: 1, status: "PENDING", createdDaysAgo: 1, loanDurationDays: 3 },
    { itemIndex: 6, status: "PENDING", createdDaysAgo: 2, loanDurationDays: 2 },
    { itemIndex: 16, status: "PENDING", createdDaysAgo: 4, loanDurationDays: 5 },
    { itemIndex: 19, status: "PENDING", createdDaysAgo: 0, loanDurationDays: 2 },
    { itemIndex: 20, status: "PENDING", createdDaysAgo: 5, loanDurationDays: 4 },
    // APPROVED - מאושרות, עדיין לא נאספו
    { itemIndex: 3, status: "APPROVED", createdDaysAgo: 3, loanDurationDays: 3 },
    { itemIndex: 7, status: "APPROVED", createdDaysAgo: 6, loanDurationDays: 4 },
    { itemIndex: 12, status: "APPROVED", createdDaysAgo: 1, loanDurationDays: 2 },
    { itemIndex: 17, status: "APPROVED", createdDaysAgo: 2, loanDurationDays: 3 },
    { itemIndex: 9, status: "APPROVED", createdDaysAgo: 4, loanDurationDays: 5 },
    // BORROWED - בהשאלה כרגע
    { itemIndex: 0, status: "BORROWED", createdDaysAgo: 10, loanDurationDays: 7, borrowedDaysAgo: 8 },
    { itemIndex: 4, status: "BORROWED", createdDaysAgo: 15, loanDurationDays: 10, borrowedDaysAgo: 12 },
    { itemIndex: 8, status: "BORROWED", createdDaysAgo: 20, loanDurationDays: 14, borrowedDaysAgo: 18 },
    { itemIndex: 11, status: "BORROWED", createdDaysAgo: 7, loanDurationDays: 5, borrowedDaysAgo: 5 },
    { itemIndex: 13, status: "BORROWED", createdDaysAgo: 25, loanDurationDays: 10, borrowedDaysAgo: 20 },
    { itemIndex: 15, status: "BORROWED", createdDaysAgo: 9, loanDurationDays: 6, borrowedDaysAgo: 6 },
    { itemIndex: 18, status: "BORROWED", createdDaysAgo: 30, loanDurationDays: 14, borrowedDaysAgo: 26 },
    { itemIndex: 2, status: "BORROWED", createdDaysAgo: 14, loanDurationDays: 7, borrowedDaysAgo: 11 },
    // RETURNED - הושלמו בעבר, מפוזרות על פני 6 חודשים
    { itemIndex: 5, status: "RETURNED", createdDaysAgo: 160, loanDurationDays: 7, borrowedDaysAgo: 158, returnedDaysAgo: 150 },
    { itemIndex: 10, status: "RETURNED", createdDaysAgo: 140, loanDurationDays: 5, borrowedDaysAgo: 138, returnedDaysAgo: 133 },
    { itemIndex: 14, status: "RETURNED", createdDaysAgo: 120, loanDurationDays: 6, borrowedDaysAgo: 118, returnedDaysAgo: 112 },
    { itemIndex: 20, status: "RETURNED", createdDaysAgo: 95, loanDurationDays: 4, borrowedDaysAgo: 93, returnedDaysAgo: 89 },
    { itemIndex: 9, status: "RETURNED", createdDaysAgo: 70, loanDurationDays: 7, borrowedDaysAgo: 68, returnedDaysAgo: 61 },
    { itemIndex: 16, status: "RETURNED", createdDaysAgo: 50, loanDurationDays: 5, borrowedDaysAgo: 48, returnedDaysAgo: 43 },
    { itemIndex: 1, status: "RETURNED", createdDaysAgo: 35, loanDurationDays: 4, borrowedDaysAgo: 33, returnedDaysAgo: 29 },
    { itemIndex: 7, status: "RETURNED", createdDaysAgo: 22, loanDurationDays: 3, borrowedDaysAgo: 21, returnedDaysAgo: 18 },
    // REJECTED
    { itemIndex: 3, status: "REJECTED", createdDaysAgo: 18, loanDurationDays: 3 },
    { itemIndex: 17, status: "REJECTED", createdDaysAgo: 40, loanDurationDays: 2 },
    // CANCELLED
    { itemIndex: 6, status: "CANCELLED", createdDaysAgo: 12, loanDurationDays: 2 },
    { itemIndex: 12, status: "CANCELLED", createdDaysAgo: 55, loanDurationDays: 3 },
  ];

  for (const seed of requestSeeds) {
    const item = items[seed.itemIndex]!;
    const borrower = otherUser(item.ownerId);
    const createdAt = daysAgo(seed.createdDaysAgo);

    // בקשות שעדיין לא התחילו (PENDING/APPROVED) מקבלות תאריך התחלה עתידי, כמו בקשה אמיתית.
    // בקשות שכבר הסתיימו/בוטלו (BORROWED/RETURNED/REJECTED/CANCELLED) מקבלות תאריך היסטורי.
    const startDate =
      seed.status === "PENDING" || seed.status === "APPROVED"
        ? daysFromNow(2 + (seed.itemIndex % 5))
        : daysAgo(Math.max(seed.createdDaysAgo - 1, 0));
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + seed.loanDurationDays);

    await prisma.loanRequest.create({
      data: {
        itemId: item.id,
        borrowerId: borrower.id,
        startDate,
        endDate,
        message: "אשמח להשאיל, תודה מראש!",
        status: seed.status,
        createdAt,
        borrowedAt: seed.borrowedDaysAgo !== undefined ? daysAgo(seed.borrowedDaysAgo) : null,
        returnedAt: seed.returnedDaysAgo !== undefined ? daysAgo(seed.returnedDaysAgo) : null,
      },
    });
  }

  console.log("מעדכנת isAvailable לפריטים שנמצאים כרגע בהשאלה...");
  const borrowedItemIndexes = requestSeeds.filter((r) => r.status === "BORROWED").map((r) => r.itemIndex);
  for (const index of borrowedItemIndexes) {
    await prisma.item.update({ where: { id: items[index]!.id }, data: { isAvailable: false } });
  }

  console.log("בוצע בהצלחה.");
  console.log(`מנהלת: ${admin.email} / (הסיסמה ממשתנה הסביבה ADMIN_PASSWORD)`);
  console.log(`משתמשות דמו (סיסמה לכולן: ${DEMO_PASSWORD}):`);
  for (const user of users) {
    console.log(`  - ${user.fullName} <${user.email}> (${user.neighborhood})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
